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
 * Auto-repair malformed XML using fast-xml-parser tolerant parsing
 * and rebuild via XMLBuilder. Then validate the rebuilt XML.
 *
 * This uses the parser's native AST reconstruction to handle malformed markup.
 * No custom repair logic — let the parser do what it's designed for.
 */
function autoRepairXML(xmlString) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    preserveOrder: true,
    allowBooleanAttributes: true,
    commentPropName: '#comment',
    cdataPropName: '#cdata',
    alwaysCreateTextNode: true,
    trimValues: false,
  })

  let parsed
  try {
    parsed = parser.parse(xmlString)
  } catch (err) {
    return {
      ok: false,
      stage: 'parse',
      error: 'XML is too malformed for automatic repair.',
      rawError: String(err),
      repairedXml: null,
    }
  }

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    preserveOrder: true,
    suppressBooleanAttributes: false,
    format: false,
  })

  const rebuiltXml = builder.build(parsed)

  // Validate the repaired XML
  const validationError = domValidate(rebuiltXml)

  if (validationError) {
    return {
      ok: false,
      stage: 'validate',
      error: 'XML was auto-repaired but is still not well-formed.',
      validationError,
      repairedXml: rebuiltXml,
    }
  }

  return {
    ok: true,
    stage: 'repaired',
    repairedXml: rebuiltXml,
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
