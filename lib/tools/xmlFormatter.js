const { XMLValidator } = require('fast-xml-parser')
const prettData = require('pretty-data')
const pd = prettData.pd

/**
 * STRICT XML validation using fast-xml-parser.
 * Returns { isValid: boolean, errors: [{ line, column, message }] }
 */
function strictValidate(xmlString) {
  const result = XMLValidator.validate(xmlString, {
    allowBooleanAttributes: true,
  })

  if (result === true) {
    return { isValid: true, errors: [] }
  }

  // fast-xml-parser error object: result.err = { code, msg, line, col }
  const err = result.err || {}
  return {
    isValid: false,
    errors: [
      {
        line: err.line || null,
        column: err.col || null,
        message: err.msg || 'Invalid XML',
      },
    ],
  }
}

/**
 * STAGE 0 — Fix accidental opening tags that should be closing tags.
 * Example: <name>John<name>  →  <name>John</name>
 */
function fixAccidentalOpeningTags(xml) {
  return xml.replace(
    /<([a-zA-Z0-9:_-]+)>([\s\S]*?)<\1>/g,
    (match, tag, between) => {
      // if there is no proper closing tag inside, treat the second as a closing tag
      if (!between.includes(`</${tag}>`)) {
        return `<${tag}>${between}</${tag}>`
      }
      return match
    }
  )
}

/**
 * STAGE 1 — Fix broken tag closures (missing >, dangling </name on its own line, etc.)
 * These regexes are conservative and operate line-by-line.
 */
function fixBrokenTagClosures(xml) {
  return xml
    // Fix closing tags with extra space: </name   > → </name>
    .replace(/<\/([a-zA-Z0-9:_-]+)\s+(?=>)/g, '</$1>')
    // Fix closing tags missing > at end of line: "</name" → "</name>"
    .replace(/<\/([a-zA-Z0-9:_-]+)\s*$/gm, '</$1>')
    // Fix opening tags missing > before newline: "<name\n" → "<name>\n"
    .replace(/<([a-zA-Z0-9:_-]+)([^>\n]*?)\n/g, '<$1$2>\n')
    // Fix opening tags missing > at end of file/line: "<tag attr="x"" → "<tag attr="x">"
    .replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, '<$1$2>')
}

/**
 * STAGE 2 — Soft fix orphaned text or dangling content between tags.
 * This is intentionally conservative. If it can't confidently fix, it leaves as-is.
 */
function softFix(xml) {
  // Currently minimal; placeholder for future heuristics.
  // For safety, we avoid touching CDATA or comments here.
  return xml
}

/**
 * AUTO-REPAIR PIPELINE
 *
 * IMPORTANT: This DOES NOT parse + rebuild the XML, so comments and CDATA are preserved.
 * It only runs targeted regex passes and then re-validates.
 *
 * Returns:
 *  - ok: true/false
 *  - stage: 'success' | 'validate' | 'unrepairable'
 *  - repairedXml: string (when ok)
 *  - rawRepaired: string (text after repairs, before parser reformatting)
 */
function autoRepairXML(inputXml) {
  // Run staged transforms
  const stage0 = fixAccidentalOpeningTags(inputXml)
  const stage1 = fixBrokenTagClosures(stage0)
  const stage2 = softFix(stage1)

  // Final candidate
  const candidate = stage2

  // Validate candidate strictly
  const validation = strictValidate(candidate)

  if (!validation.isValid) {
    return {
      ok: false,
      stage: 'validate',
      error: 'Unable to fully auto-repair XML. Still not well-formed.',
      validation,
      repairedXml: candidate, // Return candidate even if invalid for inspection
    }
  }

  // At this point we consider the candidate the "repaired" XML
  // We also return the raw candidate for diff computation BEFORE parser reformatting
  return {
    ok: true,
    stage: 'success',
    repairedXml: candidate, // This is the validated, repaired XML
    rawRepaired: candidate, // For diff, this is the same as repairedXml in this version
  }
}

/**
 * Simple style / structure lint.
 * This is NOT validation; we keep it light.
 */
function lintXML(xmlString) {
  const warnings = []
  const trimmed = xmlString.trim()

  if (!trimmed.startsWith('<?xml')) {
    warnings.push('No XML declaration found (e.g., <?xml version="1.0"?>).')
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
    // unwrap CDATA but keep its content
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  }

  if (trimWhitespaceBetweenTags) {
    // collapse whitespace between tags (but leave text node whitespace)
    out = out.replace(/>\s+</g, '><')
  }

  return out
}

/**
 * Final formatting: beautify / minify / none
 */
function formatFinalXML(xmlString, mode = 'beautify') {
  if (mode === 'minify') {
    // xmlmin second arg = removeComments; we keep them here and let cleanup handle comments
    return pd.xmlmin(xmlString, false)
  }

  if (mode === 'beautify') {
    return pd.xml(xmlString)
  }

  return xmlString
}

/**
 * Compute a simple, line-based diff between original and repaired XML.
 * Returns [{ line, original, repaired }]
 */
function computeDiffLines(original, repaired) {
  const origLines = original.split(/\r?\n/)
  const newLines = repaired.split(/\r?\n/)

  const diff = []
  const maxLen = Math.max(origLines.length, newLines.length)

  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i] || ''
    const n = newLines[i] || ''

    if (o !== n) {
      diff.push({
        line: i + 1,
        original: o,
        repaired: n,
      })
    }
  }

  return diff
}

/**
 * Generate a human-readable repair summary from the diff.
 * Only emits specific, meaningful messages (no noisy generic spam).
 */
function generateRepairSummary(diff) {
  const messages = []

  diff.forEach((d) => {
    const { original, repaired, line } = d
    const o = original.trim()
    const r = repaired.trim()

    // Added missing '>' for a tag
    if (
      /<[/]?[a-zA-Z0-9:_-]+[^>]*$/.test(o) && // looks like incomplete tag
      />\s*$/.test(r)
    ) {
      messages.push(`Added missing '>' for tag on line ${line}.`)
      return
    }

    // Fixed duplicate opening tag into closing tag
    if (
      /<([a-zA-Z0-9:_-]+)>.+<\1>/.test(o) &&
      /<([a-zA-Z0-9:_-]+)>.+<\/\1>/.test(r)
    ) {
      messages.push(
        `Converted mistaken opening tag into closing tag on line ${line}.`
      )
      return
    }

    // Escaped illegal '&'
    if (o.includes('&') && !o.includes('&amp;') && r.includes('&amp;')) {
      messages.push(`Escaped bare '&' character on line ${line}.`)
      return
    }

    // We could add more heuristics over time; keep it clean for now.
  })

  // dedupe
  return [...new Set(messages)]
}

/**
 * High-level pipeline used by your tool hub.
 *
 * @param {string} inputXml
 * @param {object} options - {
 *   autoRepair?: boolean,
 *   removeDeclaration?: boolean,
 *   removeComments?: boolean,
 *   removeCDATA?: boolean,
 *   trimWhitespaceBetweenTags?: boolean,
 *   formatMode?: 'beautify' | 'minify' | 'none'
 * }
 */
function processXmlTool(inputXml, options = {}) {
  const formatMode = options.formatMode || 'beautify'
  const autoRepairEnabled = options.autoRepair !== false

  let repairedXml = inputXml
  let repairInfo = null

  // 1. Auto-Repair (optional)
  if (autoRepairEnabled) {
    const repairResult = autoRepairXML(inputXml)

    // we still continue even if not ok; the caller can inspect validation
    repairedXml = repairResult.repairedXml || inputXml

    // compute diff & summary BEFORE cleanup/formatting
    // Use rawRepaired from repairResult for diff to avoid parser reformatting changes
    const diffBase = repairResult.rawRepaired || repairedXml
    const diff = computeDiffLines(inputXml, diffBase)
    const summary = generateRepairSummary(diff)

    repairInfo = {
      ...repairResult, // includes ok, stage, error, validation, repairedXml
      originalXml: inputXml,
      repairedXml, // the validated, repaired XML
      diff,
      summary,
      wasRepaired: diff.length > 0,
    }
  }

  // 2. Validation (original + repaired)
  const originalValidation = strictValidate(inputXml)
  const repairedValidation = strictValidate(repairedXml)

  const validation = {
    original: originalValidation,
    repaired: repairedValidation,
  }

  // 3. Linting (style hints; not validation)
  const lintWarnings = lintXML(repairedXml)

  // 4. Cleanup toggles
  const cleanedXml = applyCleanupOptions(repairedXml, options)

  // 5. Final formatting
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
  strictValidate,
  computeDiffLines,
  generateRepairSummary,
}
