let prettierModule = null
let xmlPluginModule = null

try {
  if (typeof window === 'undefined') {
    prettierModule = require('prettier')
    xmlPluginModule = require('@prettier/plugin-xml')
  }
} catch (error) {
  // Prettier not available in browser environment
}

/* ============================
 *  VALIDATION (STRICT)
 * ============================ */

function validateSVG(svg) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  }

  try {
    if (!/<svg\b/i.test(svg)) {
      validation.isValid = false
      validation.errors.push('Missing <svg> root element')
      return validation
    }

    const invalidAttrPattern = /=\s*"[^"]*[<>&][^"]*"/g
    if (invalidAttrPattern.test(svg)) {
      validation.errors.push('Attribute values contain unescaped special characters')
      validation.isValid = false
    }

    const xmlnsMatch = svg.match(/xmlns="([^"]+)"/i)
    const expectedXmlns = 'http://www.w3.org/2000/svg'
    if (xmlnsMatch && xmlnsMatch[1] !== expectedXmlns) {
      validation.warnings.push(`Non-standard SVG namespace: ${xmlnsMatch[1]}`)
    }
  } catch (error) {
    validation.errors.push(`Validation error: ${error.message}`)
    validation.isValid = false
  }

  return validation
}

/* ============================
 *  LINTING (BEST PRACTICES)
 * ============================ */

function lintSVG(svg, analysis) {
  const linting = {
    hints: [],
    warnings: []
  }

  try {
    // Structural & Safety Linting
    if (/<script\b/i.test(svg)) {
      linting.warnings.push({
        category: 'security',
        level: 'error',
        message: 'Script tags detected in SVG',
        description: 'Inline scripts can pose security risks. Consider removing or sandboxing.'
      })
    }

    if (/on\w+\s*=\s*["']/i.test(svg)) {
      linting.warnings.push({
        category: 'security',
        level: 'warning',
        message: 'Inline event handlers detected',
        description: 'Event handlers like onclick, onload can be security risks. Use external event listeners instead.'
      })
    }

    // Check for unused IDs
    if (analysis && analysis.references) {
      const unusedIds = analysis.references.idsDefined.filter(
        id => !analysis.references.idsReferenced.includes(id)
      )
      if (unusedIds.length > 0) {
        linting.hints.push({
          category: 'structural',
          level: 'info',
          message: `${unusedIds.length} unused ID(s) found`,
          description: `IDs not referenced: ${unusedIds.slice(0, 3).join(', ')}${unusedIds.length > 3 ? '...' : ''}`
        })
      }
    }

    // Performance Linting
    if (/<defs\b[^>]*>\s*<\/defs>/i.test(svg)) {
      linting.hints.push({
        category: 'performance',
        level: 'info',
        message: 'Empty <defs> section found',
        description: 'Remove empty definition sections to reduce file size.'
      })
    }

    if (/opacity\s*=\s*["']1["']/i.test(svg)) {
      linting.hints.push({
        category: 'performance',
        level: 'info',
        message: 'Default opacity values detected',
        description: 'opacity="1" is the default. These attributes can be removed.'
      })
    }

    if (/fill\s*=\s*["']black["']/i.test(svg) || /fill\s*=\s*["']#000000?["']/i.test(svg)) {
      linting.hints.push({
        category: 'performance',
        level: 'info',
        message: 'Default fill values detected',
        description: 'Black fill is the default. These attributes can be removed.'
      })
    }

    // Check for high precision decimals (potential optimization)
    const highPrecisionNumbers = svg.match(/\d+\.\d{5,}/g) || []
    if (highPrecisionNumbers.length > 0) {
      linting.hints.push({
        category: 'performance',
        level: 'info',
        message: `High precision decimals detected (${highPrecisionNumbers.length} instances)`,
        description: 'Consider reducing decimal precision to 2-4 places for better compression without visual loss.'
      })
    }

    // Accessibility Linting
    if (/<svg\b[^>]*>/.test(svg)) {
      const svgTagMatch = svg.match(/<svg\b[^>]*>/)?.[0]
      if (svgTagMatch && !/<title\b/.test(svg)) {
        linting.warnings.push({
          category: 'accessibility',
          level: 'warning',
          message: 'SVG missing <title> element',
          description: 'Add a <title> element as the first child of <svg> for better accessibility and semantic meaning.'
        })
      }
    }

    if (analysis && analysis.features.usesText) {
      const textWithoutTitle = /<text\b[^>]*>(?!.*?<title)/i.test(svg)
      if (textWithoutTitle) {
        linting.warnings.push({
          category: 'accessibility',
          level: 'warning',
          message: '<text> elements without descriptions',
          description: 'Consider adding <title> or <desc> elements to text for better accessibility.'
        })
      }
    }

    if (/<text\b/i.test(svg) && !/<title\b|<desc\b|role\s*=\s*["']img["']/i.test(svg)) {
      linting.hints.push({
        category: 'accessibility',
        level: 'info',
        message: 'SVG contains text but lacks accessibility attributes',
        description: 'Add role="img" or <desc> to improve accessibility for screen readers.'
      })
    }

    // Structural best practices
    if (/<g\b[^>]*>\s*<\/g>/i.test(svg)) {
      linting.hints.push({
        category: 'structural',
        level: 'info',
        message: 'Empty group elements found',
        description: 'Remove empty <g> elements to reduce file size.'
      })
    }

    if (/<path\b[^>]*\s+d\s*=\s*["']M\s*0\s*0\s*L\s*0\s*0["']/i.test(svg)) {
      linting.hints.push({
        category: 'structural',
        level: 'info',
        message: 'Zero-length paths detected',
        description: 'Remove paths that do not draw anything (zero dimensions or invalid data).'
      })
    }

    // Check for duplicate gradients or patterns (potential optimization)
    const gradientMatches = svg.match(/<(?:linearGradient|radialGradient)\b[^>]*id="([^"]+)"/gi) || []
    if (gradientMatches.length > 1) {
      const gradientIds = new Set()
      gradientMatches.forEach(m => {
        const id = m.match(/id="([^"]+)"/)?.[1]
        if (id) gradientIds.add(id)
      })
      if (gradientIds.size < gradientMatches.length) {
        linting.hints.push({
          category: 'performance',
          level: 'info',
          message: 'Duplicate gradients or patterns',
          description: 'Multiple gradients with similar definitions found. Consider consolidating them.'
        })
      }
    }

    // Style vs attribute usage
    if (/\bstyle\s*=\s*["'][^"]*fill:/i.test(svg)) {
      linting.hints.push({
        category: 'structural',
        level: 'info',
        message: 'Inline styles detected',
        description: 'Consider converting style attributes to SVG presentation attributes for better consistency.'
      })
    }
  } catch (error) {
    linting.warnings.push({
      category: 'system',
      level: 'warning',
      message: `Linting error: ${error.message}`,
      description: 'An error occurred during linting analysis.'
    })
  }

  return linting
}

/* ============================
 *  ANALYSIS & STATISTICS
 * ============================ */

function trackReferences(svg) {
  const references = {
    idsDefined: [],
    idsReferenced: [],
    brokenReferences: []
  }

  try {
    const idPattern = /\bid="([^"]+)"/g
    let match
    while ((match = idPattern.exec(svg)) !== null) {
      references.idsDefined.push(match[1])
    }

    const refPatterns = [
      /url\(#([^)]+)\)/g,
      /xlink:href="#([^"]+)"/g,
      /href="#([^"]+)"/g,
      /<use[^>]+href="#([^"]+)"/g
    ]

    refPatterns.forEach(pattern => {
      while ((match = pattern.exec(svg)) !== null) {
        const refId = match[1]
        if (!references.idsReferenced.includes(refId)) {
          references.idsReferenced.push(refId)
        }
      }
    })

    references.idsReferenced.forEach(refId => {
      if (!references.idsDefined.includes(refId)) {
        references.brokenReferences.push(refId)
      }
    })
  } catch (error) {
    // Silently fail on reference tracking
  }

  return references
}

function extractViewport(svg) {
  const viewport = {
    hasViewBox: false,
    viewBox: null,
    hasWidth: false,
    hasHeight: false,
    width: null,
    height: null
  }

  try {
    const svgMatch = svg.match(/<svg[^>]+>/i)
    if (!svgMatch) return viewport

    const svgTag = svgMatch[0]
    const viewBoxMatch = svgTag.match(/viewBox="([^"]+)"/i)
    if (viewBoxMatch) {
      viewport.hasViewBox = true
      viewport.viewBox = viewBoxMatch[1]
    }

    const widthMatch = svgTag.match(/width="([^"]+)"/i)
    if (widthMatch) {
      viewport.hasWidth = true
      viewport.width = widthMatch[1]
    }

    const heightMatch = svgTag.match(/height="([^"]+)"/i)
    if (heightMatch) {
      viewport.hasHeight = true
      viewport.height = heightMatch[1]
    }
  } catch (error) {
    // Silently fail
  }

  return viewport
}

function analyzeSVGStructure(svg) {
  const analysis = {
    elements: {},
    features: {
      usesText: false,
      usesGradients: false,
      usesFilters: false,
      usesMasks: false,
      usesPatterns: false,
      usesDefs: false
    },
    fonts: {
      detected: [],
      implicit: false
    },
    viewport: null,
    references: null,
    warnings: []
  }

  try {
    const elementPattern = /<(\w+)(?:\s[^>]*)?>(?:[^<]*(?:<[^/][^>]*>)*)?<\/\1>|<(\w+)(?:\s[^>]*)?\/>/g
    let match

    while ((match = elementPattern.exec(svg)) !== null) {
      const tag = match[1] || match[2]
      if (tag && tag.toLowerCase() !== 'svg') {
        analysis.elements[tag] = (analysis.elements[tag] || 0) + 1
      }
    }

    analysis.features.usesText = /<text\b/i.test(svg)
    analysis.features.usesGradients = /<(?:linearGradient|radialGradient)\b/i.test(svg)
    analysis.features.usesFilters = /<filter\b/i.test(svg)
    analysis.features.usesMasks = /<mask\b/i.test(svg)
    analysis.features.usesPatterns = /<pattern\b/i.test(svg)
    analysis.features.usesDefs = /<defs\b/i.test(svg)

    const fontPattern = /font-family="([^"]+)"/gi
    const detectedFonts = new Set()
    while ((match = fontPattern.exec(svg)) !== null) {
      const fonts = match[1].split(',').map(f => f.trim().replace(/['"]/g, ''))
      fonts.forEach(font => {
        if (font) detectedFonts.add(font)
      })
    }
    analysis.fonts.detected = Array.from(detectedFonts)
    analysis.fonts.implicit = analysis.features.usesText && detectedFonts.size === 0

    analysis.viewport = extractViewport(svg)
    analysis.references = trackReferences(svg)

    if (analysis.features.usesText && detectedFonts.size === 0) {
      analysis.warnings.push('Text elements found without font-family definitions - may render incorrectly')
    }
    if (analysis.references.brokenReferences.length > 0) {
      analysis.warnings.push(`Broken ID references found: ${analysis.references.brokenReferences.join(', ')}`)
    }
    if (analysis.features.usesMasks && analysis.features.usesFilters) {
      analysis.warnings.push('Both masks and filters detected - may impact performance')
    }
  } catch (error) {
    analysis.warnings.push(`Analysis error: ${error.message}`)
  }

  return analysis
}

function calculateOptimizationStats(originalSvg, optimizedSvg) {
  const originalSize = new Blob([originalSvg]).size
  const optimizedSize = new Blob([optimizedSvg]).size
  const bytesRemoved = originalSize - optimizedSize
  const reductionPercent = originalSize > 0 ? ((bytesRemoved) / originalSize * 100).toFixed(1) : 0

  const originalAttrPattern = /\s+[\w\-:]+="[^"]*"/g
  const optimizedAttrPattern = /\s+[\w\-:]+="[^"]*"/g

  const originalAttrs = (originalSvg.match(originalAttrPattern) || []).length
  const optimizedAttrs = (optimizedSvg.match(optimizedAttrPattern) || []).length
  const attributesRemoved = Math.max(0, originalAttrs - optimizedAttrs)

  const attrByElement = {}
  const elemAttrPattern = /<(\w+)([^>]*)>/g
  let elemMatch
  while ((elemMatch = elemAttrPattern.exec(originalSvg)) !== null) {
    const tag = elemMatch[1].toLowerCase()
    const attrs = (elemMatch[2].match(/\s+[\w\-:]+="[^"]*"/g) || []).length
    if (attrs > 0 || !attrByElement[tag]) {
      attrByElement[tag] = (attrByElement[tag] || 0) + attrs
    }
  }

  const originalElemPattern = /<(\w+)(?:\s[^>]*)?>(?:[^<]*(?:<[^/][^>]*>)*)?<\/\1>|<(\w+)(?:\s[^>]*)?\/>/g
  const optimizedElemPattern = /<(\w+)(?:\s[^>]*)?>(?:[^<]*(?:<[^/][^>]*>)*)?<\/\1>|<(\w+)(?:\s[^>]*)?\/>/g

  let originalElemCount = 0
  let match
  while ((match = originalElemPattern.exec(originalSvg)) !== null) {
    originalElemCount++
  }

  let optimizedElemCount = 0
  while ((match = optimizedElemPattern.exec(optimizedSvg)) !== null) {
    optimizedElemCount++
  }
  const elementsRemoved = Math.max(0, originalElemCount - optimizedElemCount)

  const elemByType = {}
  const elemTypePattern = /<(\w+)(?:\s[^>]*)?>|<(\w+)(?:\s[^>]*)?\/>/g
  let typeMatch
  while ((typeMatch = elemTypePattern.exec(originalSvg)) !== null) {
    const tag = (typeMatch[1] || typeMatch[2]).toLowerCase()
    elemByType[tag] = (elemByType[tag] || 0) + 1
  }

  const getDecimalCount = (numStr) => {
    const match = numStr.match(/\.(\d+)/)
    return match ? match[1].length : 0
  }

  const originalNumbers = originalSvg.match(/\d+\.\d+/g) || []
  const optimizedNumbers = optimizedSvg.match(/\d+\.\d+/g) || []

  let originalDecimals = 0
  let optimizedDecimals = 0

  if (originalNumbers.length > 0) {
    originalDecimals = Math.max(...originalNumbers.map(n => getDecimalCount(n)))
  }
  if (optimizedNumbers.length > 0) {
    optimizedDecimals = Math.max(...optimizedNumbers.map(n => getDecimalCount(n)))
  }

  const precisionReduced = originalDecimals > optimizedDecimals && originalDecimals > 0

  return {
    originalSize,
    optimizedSize,
    bytesRemoved,
    reductionPercent: parseFloat(reductionPercent),
    attributes: {
      total: originalAttrs,
      removed: attributesRemoved,
      byElement: attrByElement
    },
    elements: {
      total: originalElemCount,
      removed: elementsRemoved,
      byType: elemByType
    },
    precision: {
      reduced: precisionReduced,
      originalDecimals: originalDecimals > 0 ? originalDecimals : null,
      optimizedDecimals: optimizedDecimals > 0 ? optimizedDecimals : null
    }
  }
}

function generateDiffHighlights(originalSvg, optimizedSvg) {
  const changes = {
    summary: 'no_changes',
    removedAttributes: [],
    removedElements: [],
    precisionChanges: []
  }

  try {
    let hasChanges = false

    const origAttrs = originalSvg.match(/\s[\w\-:]+="[^"]*"/g) || []
    const optAttrs = optimizedSvg.match(/\s[\w\-:]+="[^"]*"/g) || []

    origAttrs.forEach(attr => {
      if (!optAttrs.includes(attr)) {
        changes.removedAttributes.push(attr.trim())
        hasChanges = true
      }
    })

    const commentPattern = /<!--(.*?)-->/g
    let match
    while ((match = commentPattern.exec(originalSvg)) !== null) {
      changes.removedElements.push({ type: 'comment', content: match[1] })
      hasChanges = true
    }

    const numberPattern = /(\d+\.\d{3,})/g
    const origNumbers = (originalSvg.match(numberPattern) || [])
    if (origNumbers.length > 0 && !optimizedSvg.match(numberPattern)) {
      changes.precisionChanges.push({
        type: 'decimal_reduction',
        count: origNumbers.length,
        example: origNumbers[0]
      })
      hasChanges = true
    }

    if (hasChanges) {
      changes.summary = 'changes_applied'
    } else if (originalSvg === optimizedSvg) {
      changes.summary = 'no_changes'
    } else {
      changes.summary = 'normalization_only'
    }
  } catch (error) {
    changes.summary = 'error'
  }

  return changes
}

function detectNormalization(originalSvg, optimizedSvg) {
  const normalization = {
    applied: originalSvg !== optimizedSvg,
    details: []
  }

  if (originalSvg === optimizedSvg) {
    return normalization
  }

  if (/\s{2,}/.test(originalSvg) && !/\s{2,}/.test(optimizedSvg)) {
    normalization.details.push('Multiple whitespace collapsed')
  }

  if (/\n|\r/.test(originalSvg) && !(/\n|\r/.test(optimizedSvg))) {
    normalization.details.push('Newlines and carriage returns removed')
  }

  if (/<!--/.test(originalSvg) && !(/<!--/.test(optimizedSvg))) {
    normalization.details.push('Comments removed')
  }

  if (/\s+<\//.test(originalSvg) && !(/\s+<\//.test(optimizedSvg))) {
    normalization.details.push('Whitespace before closing tags removed')
  }

  return normalization
}

/* ============================
 *  FORMATTING
 * ============================ */

async function formatSVGPretty(svg) {
  try {
    if (!prettierModule || !xmlPluginModule) {
      // Fallback to simple pretty formatting
      return formatSVGSimplePretty(svg)
    }

    const formatted = await prettierModule.format(svg, {
      parser: 'xml',
      plugins: [xmlPluginModule],
      tabWidth: 2,
      printWidth: 120,
      xmlWhitespaceSensitivity: 'ignore'
    })

    return formatted
  } catch (error) {
    // Fallback to simple formatting
    return formatSVGSimplePretty(svg)
  }
}

function formatSVGSimplePretty(svg) {
  let formatted = svg
  let indent = 0
  const indentStr = '  '

  formatted = formatted
    .replace(/>\s*</g, '>\n<')
    .replace(/\s+/g, ' ')
    .trim()

  let result = ''
  let inText = false
  let tagBuffer = ''

  for (let i = 0; i < formatted.length; i++) {
    const char = formatted[i]

    if (char === '<' && !inText) {
      if (tagBuffer) {
        result += tagBuffer
        tagBuffer = ''
      }

      const endTag = formatted.substring(i, i + 2) === '</'
      const selfClosing = formatted.substring(i).match(/^<[^>]*\/>/)

      if (endTag) indent--

      if (result && !result.endsWith('\n')) {
        result += '\n'
      }

      result += indentStr.repeat(Math.max(0, indent))
      tagBuffer = '<'
    } else if (char === '>' && !inText) {
      tagBuffer += char
      result += tagBuffer
      tagBuffer = ''

      const isTextStart = /^<text\b/.test(formatted.substring(i - 4))
      const isSelfClosing = formatted.substring(i - 1, i) === '/'
      const isClosing = formatted.substring(i - 1, i) === '</'

      if (isTextStart) inText = true

      if (!isClosing && !isSelfClosing) {
        const tagName = formatted.substring(formatted.lastIndexOf('<', i), i + 1).match(/<(\w+)/)?.[1]
        if (!['circle', 'rect', 'ellipse', 'path', 'line', 'polygon', 'image'].includes(tagName)) {
          indent++
        }
      }

      result += '\n'
    } else if (char === '>' && inText) {
      tagBuffer += char
      if (/<\/text>/.test(tagBuffer)) {
        inText = false
      }
      result += tagBuffer
      tagBuffer = ''
    } else {
      tagBuffer += char
    }
  }

  if (tagBuffer) result += tagBuffer

  return result.replace(/\n\s*\n/g, '\n').trim()
}

function formatSVGCompact(svg) {
  return svg.replace(/\n\s*/g, '').trim()
}

/* ============================
 *  MAIN SVG OPTIMIZER
 * ============================ */

async function svgOptimizer(text, config = {}) {
  if (!text || typeof text !== 'string') {
    return {
      error: 'Invalid SVG input'
    }
  }

  const originalSvg = text.trim()

  // Phase 0: Validation
  const validation = validateSVG(originalSvg)
  if (!validation.isValid) {
    return {
      error: 'Invalid SVG',
      validation,
      originalSvg
    }
  }

  // Phase 1: Basic optimization (whitespace normalization)
  const optimizedSvg = originalSvg
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/<!--.*?-->/g, '')
    .trim()

  // Phase 2: Analysis and linting
  const analysis = analyzeSVGStructure(originalSvg)
  const linting = lintSVG(originalSvg, analysis)
  const stats = calculateOptimizationStats(originalSvg, optimizedSvg)
  const diff = generateDiffHighlights(originalSvg, optimizedSvg)
  const normalization = detectNormalization(originalSvg, optimizedSvg)

  // Determine optimization result
  let optimizationResult = 'no_changes'
  if (!validation.isValid) {
    optimizationResult = 'invalid_svg'
  } else if (diff.summary === 'changes_applied') {
    optimizationResult = 'changes_applied'
  } else if (diff.summary === 'normalization_only') {
    optimizationResult = 'normalization_only'
  } else {
    optimizationResult = 'no_changes'
  }

  // Build safety flags
  const hasExternalUrlRefs = /url\(\s*https?:|url\(\s*\/|<image\s[^>]*href=["']https?:|<use\s[^>]*href=["']https?:|<use\s[^>]*xlink:href=["']https?:/i.test(originalSvg)

  const safetyFlags = {
    hasText: analysis.features.usesText,
    hasInternalRefs: analysis.references.idsReferenced.length > 0,
    hasExternalRefs: hasExternalUrlRefs,
    hasFilters: analysis.features.usesFilters,
    hasAnimations: /<animate\b|<set\b|<animateMotion\b|<animateTransform\b/i.test(originalSvg),
    hasScripts: /<script\b/i.test(originalSvg),
    hasMasks: analysis.features.usesMasks,
    hasGradients: analysis.features.usesGradients,
    hasPatterns: analysis.features.usesPatterns,
    hasBrokenReferences: analysis.references.brokenReferences.length > 0
  }

  // Potential optimizations
  const potentialOptimizations = {
    precisionReduction: {
      possible: stats.precision.reduced && stats.precision.originalDecimals !== null,
      reason: stats.precision.originalDecimals && stats.precision.originalDecimals > 2
        ? `High precision decimals detected (${stats.precision.originalDecimals} decimals) - could be reduced`
        : null
    },
    shapeConversion: {
      possible: Object.keys(analysis.elements).some(tag => ['circle', 'ellipse', 'rect', 'polygon', 'polyline'].includes(tag)),
      reason: Object.keys(analysis.elements).filter(tag => ['circle', 'ellipse', 'rect', 'polygon', 'polyline'].includes(tag)).length > 0
        ? `Shapes detected that could be converted to paths`
        : null
    },
    pathMerging: {
      possible: (stats.elements.byType.path || 0) > 1,
      reason: (stats.elements.byType.path || 0) > 1 ? `Multiple paths (${stats.elements.byType.path}) detected - could be merged` : null
    },
    attributeCleanup: {
      possible: true,
      reason: diff.removedAttributes.length > 0 ? `Redundant attributes detected` : `Potential for attribute optimization`
    },
    commentRemoval: {
      possible: diff.removedElements.filter(e => e.type === 'comment').length > 0,
      reason: diff.removedElements.filter(e => e.type === 'comment').length > 0 ? `Comments found and removed` : null
    }
  }

  // Format output
  const outputFormat = config.outputFormat || 'compact'
  let outputSvg = optimizedSvg

  if (outputFormat === 'pretty') {
    try {
      outputSvg = await formatSVGPretty(optimizedSvg)
    } catch (error) {
      outputSvg = formatSVGSimplePretty(optimizedSvg)
    }
  } else {
    outputSvg = formatSVGCompact(optimizedSvg)
  }

  return {
    optimizedSvg,
    outputSvg,
    originalSvg,
    optimizationResult,
    stats,
    validation,
    linting,
    analysis,
    diff,
    normalization,
    potentialOptimizations,
    safetyFlags
  }
}

module.exports = {
  validateSVG,
  lintSVG,
  analyzeSVGStructure,
  calculateOptimizationStats,
  generateDiffHighlights,
  detectNormalization,
  trackReferences,
  extractViewport,
  formatSVGPretty,
  formatSVGSimplePretty,
  formatSVGCompact,
  svgOptimizer
}
