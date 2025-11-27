const { XMLParser, XMLBuilder } = require('fast-xml-parser')
const prettData = require('pretty-data')
const pd = prettData.pd
const { DOMParser: NodeDOMParser } = require('@xmldom/xmldom')

/**
 * DOMParser-based XML validation.
 * Returns either null (valid) or a raw error string.
 */
function domValidate(xmlString) {
  let DOMParserImpl

  if (typeof DOMParser !== 'undefined') {
    DOMParserImpl = DOMParser
  } else {
    DOMParserImpl = NodeDOMParser
  }

  const parser = new DOMParserImpl()
  const doc = parser.parseFromString(xmlString, 'application/xml')
  const errors = doc.getElementsByTagName('parsererror')

  if (errors && errors.length > 0) {
    const msg =
      errors[0].textContent ||
      errors[0].text ||
      'Unknown XML parse error from DOMParser'
    return msg.trim()
  }

  return null
}

/**
 * Create a structured validation report with line + column if possible
 */
function validateXmlDetailed(xmlString) {
  const rawErr = domValidate(xmlString)

  if (!rawErr) {
    return {
      isValid: true,
      errors: [],
    }
  }

  const lineMatch = rawErr.match(/lineNumber[:=]\s*([0-9]+)/i)
  const colMatch = rawErr.match(/columnNumber[:=]\s*([0-9]+)/i)

  return {
    isValid: false,
    errors: [
      {
        line: lineMatch ? Number(lineMatch[1]) : null,
        column: colMatch ? Number(colMatch[1]) : null,
        message: rawErr,
      },
    ],
  }
}

/**
 * Auto-repair (5-stage recovery)
 */
function autoRepairXML(xmlString) {
  // STAGE 0 — Fix accidental <tag>John<tag> => <tag>John</tag>
  function fixAccidentalOpeningTags(xml) {
    return xml.replace(
      /<([a-zA-Z0-9:_-]+)>([\s\S]*?)<\1>/g,
      (match, tag, between) => {
        if (!between.includes(`</${tag}>`)) {
          return `<${tag}>${between}</${tag}>`
        }
        return match
      }
    )
  }
  const stage0 = fixAccidentalOpeningTags(xmlString)

  // STAGE 1 — Fix broken tag closures
  function fixBrokenTagClosures(xml) {
    return xml
      .replace(/<\/([a-zA-Z0-9:_-]+)\s+(?=>)/g, '</$1>')
      .replace(/<\/([a-zA-Z0-9:_-]+)\s*$/gm, '</$1>')
      .replace(/<([a-zA-Z0-9:_-]+)([^>]*)\n/g, '<$1$2>\n')
      .replace(/<([a-zA-Z0-9:_-]+)([^>]*)\/\s*$/gm, '<$1$2/>')
      .replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, '<$1$2>')
  }
  const stage1 = fixBrokenTagClosures(stage0)

  // STAGE 2 — Sanitize illegal characters
  function sanitizeLoose(xml) {
    return xml
      .replace(/&(?!(amp|lt|gt|apos|quot);)/g, '&amp;')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  }
  const stage2 = sanitizeLoose(stage1)

  // STAGE 3 — Soft fix
  function softFix(xml) {
    return xml
      .replace(/>\s*\w[^<]*?\n</g, (match) => {
        const before = xml.substring(0, xml.indexOf(match))
        const lastTag = before.match(/<(\w+)[^>]*>(?!.*<\/\1>)$/)
        if (lastTag) {
          return `></${lastTag[1]}>\n<`
        }
        return match
      })
      .replace(/<\/tempFix>/g, '')
  }
  const stage3 = softFix(stage2)

  // STAGE 4 — Parse → rebuild → validate
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: false,
    allowBooleanAttributes: true,
    commentPropName: '#comment',
    cdataPropName: '#cdata',
    trimValues: false,
  })

  let ast
  try {
    ast = parser.parse(stage3)
  } catch (err) {
    return {
      ok: false,
      stage: 'parse',
      error: 'XML is too malformed for automatic repair.',
      rawError: err.toString(),
      repairedXml: null,
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: false,
    suppressBooleanAttributes: false,
    format: false,
  })

  const repairedXml = builder.build(ast)

  // Validate fully repaired XML
  const validationError = domValidate(repairedXml)
  if (validationError) {
    return {
      ok: false,
      stage: 'validate',
      error: 'Repaired but still not valid XML.',
      validationError,
      repairedXml,
    }
  }

  return {
    ok: true,
    stage: 'success',
    repairedXml,
  }
}

/**
 * Style-only lint rules (not validation!)
 */
function lintXML(xmlString) {
  const warnings = []
  const trimmed = xmlString.trim()

  if (!trimmed.startsWith('<?xml')) {
    warnings.push(
      'No XML declaration found (e.g., <?xml version="1.0"?>).'
    )
  }

  const rootMatch = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/m)
  if (!rootMatch) {
    warnings.push('No clear root element detected.')
  }

  const topLevelTags = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/gm)
  if (topLevelTags && topLevelTags.length > 1) {
    warnings.push(
      'Multiple top-level elements detected. XML should normally have a single root element.'
    )
  }

  return warnings
}

/**
 * Cleanup options
 */
function applyCleanupOptions(xmlString, options = {}) {
  let out = xmlString

  const {
    removeDeclaration = false,
    removeComments = false,
    removeCDATA = false,
    trimWhitespaceBetweenTags = false,
  } = options

  if (removeDeclaration) {
    out = out.replace(/<\?xml[^>]*\?>/g, '')
  }

  if (removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '')
  }

  if (removeCDATA) {
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  }

  if (trimWhitespaceBetweenTags) {
    out = out.replace(/>\s+</g, '><')
  }

  return out
}

/**
 * Beautify/minify/none
 */
function formatFinalXML(xmlString, mode = 'beautify') {
  if (mode === 'minify') {
    return pd.xmlmin(xmlString, false)
  }
  if (mode === 'beautify') {
    return pd.xml(xmlString)
  }
  return xmlString
}

/**
 * Full pipeline (with validation now fully implemented)
 */
function processXmlTool(inputXml, options = {}) {
  const formatMode = options.formatMode || 'beautify'
  const autoRepairEnabled = options.autoRepair !== false

  let repairedXml = inputXml
  let repairInfo = null

  // 1. Auto-repair
  if (autoRepairEnabled) {
    const repairResult = autoRepairXML(inputXml)

    if (!repairResult.ok && !repairResult.repairedXml) {
      return {
        ok: false,
        stage: repairResult.stage,
        error: repairResult.error,
        rawError: repairResult.rawError || null,
        originalXml: inputXml,
      }
    }

    repairedXml = repairResult.repairedXml || inputXml
    repairInfo = { ...repairResult, originalXml: inputXml }
  }

  // 2. FULL VALIDATION (original + repaired)
  const validation = {
    original: validateXmlDetailed(inputXml),
    repaired: autoRepairEnabled ? validateXmlDetailed(repairedXml) : null,
  }

  // 3. Style linting
  const lintWarnings = lintXML(repairedXml)

  // 4. Cleanup & format
  const cleanedXml = applyCleanupOptions(repairedXml, options)
  const finalXml = formatFinalXML(cleanedXml, formatMode)

  return {
    ok: true,
    stage: 'done',
    originalXml: inputXml,
    repairedXml,
    cleanedXml,
    finalXml,
    lintWarnings,
    validation,
    repairInfo,
    optionsApplied: {
      removeDeclaration: !!options.removeDeclaration,
      removeComments: !!options.removeComments,
      removeCDATA: !!options.removeCDATA,
      trimWhitespaceBetweenTags: !!options.trimWhitespaceBetweenTags,
      formatMode,
      autoRepair: autoRepairEnabled,
    },
  }
}

module.exports = {
  autoRepairXML,
  lintXML,
  applyCleanupOptions,
  formatFinalXML,
  processXmlTool,
  validateXmlDetailed,
}
