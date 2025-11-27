const { XMLParser, XMLBuilder } = require('fast-xml-parser')
const prettData = require('pretty-data')
const pd = prettData.pd
const { DOMParser: NodeDOMParser } = require('@xmldom/xmldom')

/**
 * Validate XML string using DOMParser (browser) or @xmldom/xmldom (Node).
 * Returns null if valid, or an error string if invalid.
 */
function domValidate(xmlString) {
  let DOMParserImpl

  if (typeof DOMParser !== 'undefined') {
    // Browser / edge runtime
    DOMParserImpl = DOMParser
  } else {
    // Node.js environment (Next.js API route)
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
 * Auto-repair malformed XML using a 3-pass recovery pipeline.
 * This is the maximum possible repair achievable in Node.js without libxml2.
 *
 * PASS 1: Normal tolerant parse (best structure recovery)
 * PASS 2: Loose sanitization + parse (recoverable illegal chars/entities)
 * PASS 3: Token-based soft repair + parse (heavy repair mode for orphan tags)
 * THEN: Rebuild from AST + validate
 */
function autoRepairXML(xmlString) {
  // PASS 1 — normal tolerant parse (best structure repair)
  const parserNormal = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: false,
    allowBooleanAttributes: true,
    commentPropName: '#comment',
    cdataPropName: '#cdata',
    trimValues: false,
  })

  // PASS 2 — loose sanitation to fix illegal chars/entities
  function sanitizeLoose(xml) {
    return xml
      .replace(/&(?!(amp|lt|gt|apos|quot);)/g, '&amp;')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  }

  // PASS 3 — token-repair for missing close-tags and orphaned content
  function softFix(xml) {
    // Fix: content between closing tag and next opening tag on different lines
    let fixed = xml
      .replace(/>\s*\w[^<]*?\n\s*</g, (match) => {
        // Find the tag name from the preceding >
        const lastTagMatch = fixed.match(/<(\w+)[^>]*>/)
        if (lastTagMatch) {
          const lastTag = lastTagMatch[1]
          return `></${lastTag}>\n<`
        }
        return match
      })

    // Fix: unclosed tags - if we have <tag but no closing tag later
    const tagRegex = /<([a-zA-Z_][\w\-:]*)([\s\S]*?)((?=<)|$)/g
    const openTags = []
    let closedTags = new Set()

    let match
    while ((match = tagRegex.exec(fixed)) !== null) {
      const fullTag = match[0]
      const tagName = match[1]
      const content = match[2]

      // If tag is not self-closing and has no content ending with >, add closing tag
      if (!fullTag.endsWith('/>') && !content.includes(`</${tagName}>`)) {
        fixed = fixed.replace(fullTag, `${fullTag}</${tagName}>`)
      }
    }

    // Remove tempFix remnants
    fixed = fixed.replace(/<\/tempFix>/g, '')

    return fixed
  }

  let ast = null
  let phase = 'normal'

  try {
    // Try PASS 1 — normal parse
    ast = parserNormal.parse(xmlString)
  } catch (e1) {
    try {
      // Try PASS 2 — sanitize and parse
      phase = 'sanitized'
      const cleaned = sanitizeLoose(xmlString)
      ast = parserNormal.parse(cleaned)
    } catch (e2) {
      try {
        // Try PASS 3 — soft token repair and parse
        phase = 'softfix'
        const fixed = softFix(xmlString)
        ast = parserNormal.parse(fixed)
      } catch (e3) {
        return {
          ok: false,
          stage: 'parse',
          error: 'XML is too malformed for automatic repair.',
          rawError: e3.toString(),
          repairedXml: null,
        }
      }
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: false,
    suppressBooleanAttributes: false,
    format: false,
  })

  const repairedXml = builder.build(ast)

  // Validate the repaired XML
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
    stage: phase,
    repairedXml,
  }
}

/**
 * Simple "lint" that gives style / structural hints.
 * Not a full schema validator, just basic quality checks.
 */
function lintXML(xmlString) {
  const warnings = []
  const trimmed = xmlString.trim()

  // Check for XML declaration
  if (!trimmed.startsWith('<?xml')) {
    warnings.push(
      'No XML declaration found (e.g., <?xml version="1.0"?>).'
    )
  }

  // Check root element presence
  const rootMatch = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/m)
  if (!rootMatch) {
    warnings.push('No clear root element detected.')
  }

  // Check for multiple root-level elements (very naive check)
  const topLevelTags = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/gm)
  if (topLevelTags && topLevelTags.length > 1) {
    warnings.push(
      'Multiple top-level elements detected. XML should normally have a single root element.'
    )
  }

  // Well-formedness check using DOMParser logic
  const validationError = domValidate(xmlString)
  if (validationError) {
    warnings.push(`Well-formedness issue: ${validationError}`)
  }

  return warnings
}

/**
 * Cleanup toggles:
 * - removeDeclaration
 * - removeComments
 * - removeCDATA
 * - trimWhitespaceBetweenTags
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
    // Strip CDATA wrapper but keep content
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  }

  if (trimWhitespaceBetweenTags) {
    // Collapse whitespace between tags; inner text whitespace remains
    out = out.replace(/>\s+</g, '><')
  }

  return out
}

/**
 * Final formatting: "beautify", "minify", or "none"
 */
function formatFinalXML(xmlString, mode = 'beautify') {
  if (mode === 'minify') {
    // Do not preserve comments when minifying
    return pd.xmlmin(xmlString, false)
  }

  if (mode === 'beautify') {
    return pd.xml(xmlString)
  }

  // "none" - use as-is
  return xmlString
}

/**
 * High-level pipeline used by your tool hub.
 *
 * @param {string} inputXml - raw user XML
 * @param {object} options - { removeDeclaration, removeComments, removeCDATA, trimWhitespaceBetweenTags, formatMode }
 *
 * Returns a rich result object good for UI / logging / diffs.
 */
function processXmlTool(inputXml, options = {}) {
  const formatMode = options.formatMode || 'beautify'

  // 1. Auto-repair
  const repairResult = autoRepairXML(inputXml)

  if (!repairResult.ok && !repairResult.repairedXml) {
    // unrecoverable
    return {
      ok: false,
      stage: repairResult.stage,
      error: repairResult.error,
      rawError: repairResult.rawError || null,
      originalXml: inputXml,
    }
  }

  const repairedXml = repairResult.repairedXml || inputXml

  // 2. Lint (on repaired XML)
  const lintWarnings = lintXML(repairedXml)

  // 3. Cleanup toggles
  const cleanedXml = applyCleanupOptions(repairedXml, options)

  // 4. Formatting
  const finalXml = formatFinalXML(cleanedXml, formatMode)

  return {
    ok: true,
    stage: 'done',
    originalXml: inputXml,
    repairedXml,
    cleanedXml,
    finalXml,
    lintWarnings,
    optionsApplied: {
      removeDeclaration: !!options.removeDeclaration,
      removeComments: !!options.removeComments,
      removeCDATA: !!options.removeCDATA,
      trimWhitespaceBetweenTags: !!options.trimWhitespaceBetweenTags,
      formatMode,
    },
  }
}

module.exports = {
  autoRepairXML,
  lintXML,
  applyCleanupOptions,
  formatFinalXML,
  processXmlTool,
}
