/* ============================
// SVG Optimizer Module - Validation, Linting, Analysis, and Formatting

let prettierModule = null
let xmlPluginModule = null

if (typeof window === 'undefined') {
  try {
    prettierModule = require('prettier')
    xmlPluginModule = require('@prettier/plugin-xml')
  } catch (e) {
    // Prettier not available, will use simple formatting fallback
  }
}

/* ============================
 *  PHASE 2 CONFIG GENERATION
 * ============================ */

function getPhase2Config(level) {
  const baseConfig = {
    attributeCleanup: {
      enabled: true,
      description: 'Remove default and redundant attributes'
    },
    removeUnusedDefs: {
      enabled: true,
      description: 'Remove unused definitions from <defs>'
    }
  }

  switch (level) {
    case 'safe':
      return {
        ...baseConfig,
        removeUnusedDefs: { enabled: false, description: 'Unused defs linted only (not removed) in safe mode' },
        removeEmptyGroups: { enabled: true, description: 'Always remove empty groups' },
        precisionReduction: { enabled: false, description: 'Precision reduction disabled in safe mode' },
        shapeConversion: { enabled: false, description: 'Shape conversion disabled in safe mode' },
        pathMerging: { enabled: false, description: 'Path merging disabled in safe mode' },
        idCleanup: { enabled: false, mode: 'preserve', description: 'Preserve all IDs in safe mode' },
        textHandling: { enabled: false, mode: 'preserve', description: 'Preserve text in safe mode' }
      }

    case 'balanced':
      return {
        ...baseConfig,
        removeUnusedDefs: { enabled: true, description: 'Remove unused definitions from <defs>' },
        removeEmptyGroups: { enabled: true, description: 'Always remove empty groups' },
        precisionReduction: { enabled: true, decimals: 3, description: 'Reduce precision to 3 decimals' },
        shapeConversion: { enabled: false, description: 'Shape conversion disabled in balanced mode' },
        pathMerging: { enabled: false, description: 'Path merging disabled in balanced mode' },
        idCleanup: { enabled: true, mode: 'unused-only', description: 'Remove unused IDs only' },
        textHandling: { enabled: false, mode: 'preserve', description: 'Preserve text in balanced mode' }
      }

    case 'aggressive':
      return {
        ...baseConfig,
        removeUnusedDefs: { enabled: true, description: 'Remove unused definitions from <defs>' },
        removeEmptyGroups: { enabled: true, description: 'Always remove empty groups' },
        precisionReduction: { enabled: true, decimals: 2, description: 'Reduce precision to 2 decimals' },
        shapeConversion: { enabled: true, description: 'Convert shapes to paths' },
        pathMerging: { enabled: true, description: 'Merge paths with identical styles' },
        idCleanup: { enabled: true, mode: 'minify', description: 'Minify all IDs' },
        textHandling: { enabled: false, mode: 'preserve', description: 'Preserve text in aggressive mode' }
      }

    default:
      return getPhase2Config('safe')
  }
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

    // Check for high precision decimals
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
      const textElements = svg.match(/<text\b[^>]*>/gi) || []
      if (textElements.length > 0) {
        linting.hints.push({
          category: 'accessibility',
          level: 'info',
          message: `${textElements.length} text element(s) found`,
          description: 'Text elements may benefit from <desc> or <title> elements for improved accessibility with screen readers. This is optional and context-dependent.'
        })
      }
    }

    if (/<text\b/i.test(svg) && !/<font-family|inherit|monospace|serif|sans-serif/i.test(svg)) {
      linting.hints.push({
        category: 'accessibility',
        level: 'info',
        message: 'Text rendering may vary across environments',
        description: 'No explicit font-family is set on text elements. Font rendering may vary depending on the host environment. Add font-family if consistent typography is needed.'
      })
    }

    if (/<title\b|<desc\b/i.test(svg)) {
      linting.hints.push({
        category: 'accessibility',
        level: 'info',
        message: 'SVG has accessibility metadata',
        description: 'This SVG includes <title> or <desc> elements for screen readers. Good for accessibility.'
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

    // Check for duplicate gradients or patterns
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

    // Note: ID usage messaging is now handled in Phase 2 with proper context
    // (moved to lib/tools.js where we have access to idCleanup mode)
    // This removes the generic "scary" message and replaces it with context-aware messaging

    // Feature-aware optimization warnings (moved from silent gates to explicit UI warnings)
    if (analysis && analysis.features) {
      // Warn about text + aggressive precision reduction
      if (analysis.features.usesText) {
        linting.hints.push({
          category: 'compatibility',
          level: 'info',
          message: 'Text elements detected',
          description: 'Aggressive precision reduction (< 3 decimals) may affect font rendering. Consider reducing precision conservatively (3+ decimals).'
        })
      }

      // Warn about masks + aggressive precision reduction
      if (analysis.features.usesMasks) {
        linting.hints.push({
          category: 'compatibility',
          level: 'info',
          message: 'Masks detected',
          description: 'Aggressive precision reduction (< 2 decimals) may shift visual clipping. Use caution with high precision reduction.'
        })
      }

      // Warn about filters + aggressive precision reduction
      if (analysis.features.usesFilters) {
        linting.hints.push({
          category: 'compatibility',
          level: 'info',
          message: 'Filters detected',
          description: 'Aggressive precision reduction (< 2 decimals) may affect filter behavior. Use caution with high precision reduction.'
        })
      }

      // Warn about animations + shape conversion
      const hasAnimations = /<animate\b|<set\b|<animateMotion\b|<animateTransform\b/i.test(svg)
      if (hasAnimations) {
        linting.hints.push({
          category: 'compatibility',
          level: 'info',
          message: 'Animations detected',
          description: 'Shape conversion may break animations. Verify rendering after enabling shape conversion.'
        })
      }

      // Warn about scripts + shape conversion
      const hasScripts = /<script\b/i.test(svg)
      if (hasScripts) {
        linting.hints.push({
          category: 'compatibility',
          level: 'info',
          message: 'Scripts detected',
          description: 'Shape conversion may break script functionality. Verify behavior after enabling shape conversion.'
        })
      }
    }

    // Warn about broken references + ID cleanup
    if (analysis && analysis.references && analysis.references.brokenReferences.length > 0) {
      linting.warnings.push({
        category: 'compatibility',
        level: 'warning',
        message: `Broken ID references found: ${analysis.references.brokenReferences.join(', ')}`,
        description: 'These IDs are referenced but not defined. ID cleanup or minification may cause rendering issues. Fix broken references before optimizing IDs.'
      })
    }

    // Warn about external refs + ID minification
    const hasExternalRefs = /<use[^>]+xlink:href="(?!#)/i.test(svg) || /<use[^>]+href="(?!#)/i.test(svg)
    if (hasExternalRefs) {
      linting.hints.push({
        category: 'compatibility',
        level: 'info',
        message: 'External references detected',
        description: 'ID minification will not affect external references. If only using internal references, ID minification is safe.'
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
    warnings: [],
    context: {
      notes: []
    }
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

    // Add contextual notes about why features matter
    // Important: Use conditional language ("may be affected", "consider") NOT blocking language ("will skip")
    // Blocking is handled by user choice, not automatic gates
    if (analysis.features.usesText) {
      analysis.context.notes.push('Text elements detected. If precision reduction is enabled below 3 decimals, font rendering may be affected. Consider using conservative precision settings.')
    }
    if (analysis.features.usesFilters && analysis.features.usesMasks) {
      analysis.context.notes.push('Masks + filters detected — complex rendering features that may be sensitive to coordinate changes. If optimizing, test rendering carefully.')
    } else if (analysis.features.usesFilters) {
      analysis.context.notes.push('Filters detected — may impact performance. If enabling precision reduction, use conservative settings (3+ decimals).')
    } else if (analysis.features.usesMasks) {
      analysis.context.notes.push('Masks detected — visual clipping may be affected by coordinate precision. If optimizing, use caution with aggressive precision reduction.')
    }
    if (analysis.features.usesGradients) {
      analysis.context.notes.push('Gradients detected — these define colors via coordinates. If enabling precision reduction, be conservative (3+ decimals recommended).')
    }
    if (analysis.features.usesPatterns) {
      analysis.context.notes.push('Patterns detected — may be sensitive to coordinate changes. If optimizing, test carefully.')
    }
    if (analysis.references.brokenReferences.length > 0) {
      analysis.context.notes.push('⚠️ Broken ID references detected — some elements reference non-existent definitions. These may need manual fixing')
    }
    if (analysis.viewport.hasViewBox && !analysis.viewport.hasWidth && !analysis.viewport.hasHeight) {
      analysis.context.notes.push('SVG uses viewBox without explicit width/height — scalable but may affect canvas calculations')
    }

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

function generateDiff(originalSvg, optimizedSvg, idMappings = {}) {
  const changes = {
    hasChanges: false,
    attributesRemoved: [],
    elementsRemoved: [],
    idChanges: {
      renamed: [],
      removed: []
    },
    precisionChanges: []
  }

  try {
    // Track attribute changes (excluding ID changes, which are handled separately)
    const origAttrs = originalSvg.match(/\s[\w\-:]+="[^"]*"/g) || []
    const optAttrs = optimizedSvg.match(/\s[\w\-:]+="[^"]*"/g) || []

    origAttrs.forEach(attr => {
      // Skip if this is an ID that was renamed
      const idMatch = attr.match(/id="([^"]+)"/)
      if (idMatch && idMappings[idMatch[1]]) {
        return
      }
      
      if (!optAttrs.includes(attr)) {
        changes.attributesRemoved.push(attr.trim())
        changes.hasChanges = true
      }
    })

    // Handle ID renamings
    Object.entries(idMappings).forEach(([original, minified]) => {
      if (original !== minified) {
        changes.idChanges.renamed.push({
          from: original,
          to: minified
        })
        changes.hasChanges = true
      }
    })

    // Track removed comments
    const commentPattern = /<!--(.*?)-->/g
    let match
    while ((match = commentPattern.exec(originalSvg)) !== null) {
      changes.elementsRemoved.push({ type: 'comment', content: match[1] })
      changes.hasChanges = true
    }

    // Track precision changes
    const numberPattern = /(\d+\.\d{3,})/g
    const origNumbers = (originalSvg.match(numberPattern) || [])
    if (origNumbers.length > 0 && !optimizedSvg.match(numberPattern)) {
      changes.precisionChanges.push({
        type: 'decimal_reduction',
        count: origNumbers.length,
        example: origNumbers[0]
      })
      changes.hasChanges = true
    }
  } catch (error) {
    // Silently fail
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
 *  OPTIMIZATION STEPS (Phase 2)
 * ============================ */

function removeUnusedDefs(svg, references) {
  let result = svg
  let bytesRemoved = 0

  try {
    const defsMatch = result.match(/<defs\b[^>]*>([\s\S]*?)<\/defs>/i)
    if (!defsMatch) return { result, bytesRemoved }

    const defsContent = defsMatch[1]
    const defPattern = /<(linearGradient|radialGradient|pattern|mask|filter|clipPath|marker|symbol)\s*[^>]*id="([^"]+)"[^>]*>/gi
    
    let defMatch
    while ((defMatch = defPattern.exec(defsContent)) !== null) {
      const id = defMatch[2]
      if (!references.idsReferenced.includes(id)) {
        const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const defRemovalPattern = new RegExp(
          `<(linearGradient|radialGradient|pattern|mask|filter|clipPath|marker|symbol)\\s*[^>]*id="${escapedId}"[^>]*>(?:[^<]|<(?!/\\1))*</\\1>`,
          'gi'
        )
        
        const before = result.length
        result = result.replace(defRemovalPattern, '')
        bytesRemoved += before - result.length
      }
    }
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function reducePrecision(svg, decimals) {
  let result = svg
  let bytesRemoved = 0

  try {
    const numberPattern = /\d+\.\d+/g
    const before = result.length
    
    result = result.replace(numberPattern, (match) => {
      const num = parseFloat(match)
      const reduced = parseFloat(num.toFixed(decimals)).toString()
      return reduced
    })
    
    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function removeEmptyGroups(svg) {
  let result = svg
  let bytesRemoved = 0
  const before = result.length

  try {
    result = result.replace(/<g\b[^>]*>\s*<\/g>/gi, '')
    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function cleanupAttributes(svg) {
  let result = svg
  let bytesRemoved = 0

  try {
    const before = result.length

    result = result.replace(/\sopacity="1"\.?0*"/gi, '')
    result = result.replace(/\sopacity="01"/gi, '')
    result = result.replace(/\sopacity="1\.0+"/gi, '')
    result = result.replace(/\sstroke-width="0\.5+"/gi, '')
    result = result.replace(/\sfill="black"|fill="#000000"|fill="#000"/gi, '')
    result = result.replace(/\sstroke="none"/gi, '')
    result = result.replace(/\svisibility="visible"/gi, '')
    result = result.replace(/\sdisplay="inline"/gi, '')

    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function removeUnusedIds(svg, references) {
  let result = svg
  let bytesRemoved = 0
  const unusedIds = references.idsDefined.filter(id => !references.idsReferenced.includes(id))

  try {
    const before = result.length

    unusedIds.forEach(unusedId => {
      const idPattern = new RegExp(`\\s+id="${unusedId.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}"`, 'g')
      result = result.replace(idPattern, '')
    })

    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function removeUnreferencedIds(svg, references) {
  let result = svg
  let bytesRemoved = 0
  const unreferencedIds = references.idsDefined.filter(id => !references.idsReferenced.includes(id))

  try {
    const before = result.length

    unreferencedIds.forEach(unreferencedId => {
      const idPattern = new RegExp(`\\s+id="${unreferencedId.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}"`, 'g')
      result = result.replace(idPattern, '')
    })

    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function cascadingCleanup(svg) {
  let result = svg
  let bytesRemoved = 0
  const renderingAttributes = ['transform', 'opacity', 'display', 'visibility', 'clip-path', 'mask', 'filter', 'mix-blend-mode', 'isolation', 'pointer-events']

  try {
    const before = result.length

    let changed = true
    while (changed) {
      changed = false

      const groupPattern = /<g\b([^>]*)>\s*<\/g>/gi
      let match
      const matches = []

      while ((match = groupPattern.exec(result)) !== null) {
        matches.push({
          fullTag: match[0],
          attributes: match[1],
          index: match.index
        })
      }

      for (const groupMatch of matches) {
        const hasRenderingAttribute = renderingAttributes.some(attr =>
          new RegExp(`\\b${attr}\\s*=`, 'i').test(groupMatch.attributes)
        )

        if (!hasRenderingAttribute) {
          result = result.replace(groupMatch.fullTag, '')
          changed = true
          break
        }
      }
    }

    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved }
}

function minifyIds(svg, references) {
  let result = svg
  let bytesRemoved = 0
  const idMap = {}

  try {
    const before = result.length

    const idPattern = /\bid="([^"]+)"/g
    let counter = 0
    let match

    while ((match = idPattern.exec(svg)) !== null) {
      const originalId = match[1]
      const minifiedId = `a${counter}`
      idMap[originalId] = minifiedId
      counter++
    }

    Object.entries(idMap).forEach(([original, minified]) => {
      const idPattern = new RegExp(`id="${original}"`, 'g')
      const refPattern = new RegExp(`(url\\(#|href="#|xlink:href="#)${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')

      result = result.replace(idPattern, `id="${minified}"`)
      result = result.replace(refPattern, `$1${minified}`)
    })

    bytesRemoved = before - result.length
  } catch (error) {
    // Silently fail
  }

  return { result, bytesRemoved, idMap }
}

/* ============================
 *  SHAPE CONVERSION TO PATHS
 * ============================ */

function rectToPath(x, y, width, height, rx = 0, ry = 0) {
  try {
    x = parseFloat(x || 0)
    y = parseFloat(y || 0)
    width = parseFloat(width)
    height = parseFloat(height)
    rx = parseFloat(rx || 0)
    ry = parseFloat(ry || rx)

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      return null
    }

    rx = Math.min(rx, width / 2)
    ry = Math.min(ry, height / 2)

    if (rx === 0 && ry === 0) {
      return `M${x},${y}L${x + width},${y}L${x + width},${y + height}L${x},${y + height}Z`
    }

    return `M${x + rx},${y}L${x + width - rx},${y}Q${x + width},${y} ${x + width},${y + ry}L${x + width},${y + height - ry}Q${x + width},${y + height} ${x + width - rx},${y + height}L${x + rx},${y + height}Q${x},${y + height} ${x},${y + height - ry}L${x},${y + ry}Q${x},${y} ${x + rx},${y}Z`
  } catch (error) {
    return null
  }
}

function circleToPath(cx, cy, r) {
  try {
    cx = parseFloat(cx || 0)
    cy = parseFloat(cy || 0)
    r = parseFloat(r)

    if (isNaN(cx) || isNaN(cy) || isNaN(r) || r <= 0) {
      return null
    }

    const k = 0.5522847498
    const x = r * k
    return `M${cx - r},${cy}C${cx - r},${cy - x} ${cx - x},${cy - r} ${cx},${cy - r}C${cx + x},${cy - r} ${cx + r},${cy - x} ${cx + r},${cy}C${cx + r},${cy + x} ${cx + x},${cy + r} ${cx},${cy + r}C${cx - x},${cy + r} ${cx - r},${cy + x} ${cx - r},${cy}Z`
  } catch (error) {
    return null
  }
}

function ellipseToPath(cx, cy, rx, ry) {
  try {
    cx = parseFloat(cx || 0)
    cy = parseFloat(cy || 0)
    rx = parseFloat(rx)
    ry = parseFloat(ry)

    if (isNaN(cx) || isNaN(cy) || isNaN(rx) || isNaN(ry) || rx <= 0 || ry <= 0) {
      return null
    }

    const k = 0.5522847498
    const kx = rx * k
    const ky = ry * k
    return `M${cx - rx},${cy}C${cx - rx},${cy - ky} ${cx - kx},${cy - ry} ${cx},${cy - ry}C${cx + kx},${cy - ry} ${cx + rx},${cy - ky} ${cx + rx},${cy}C${cx + rx},${cy + ky} ${cx + kx},${cy + ry} ${cx},${cy + ry}C${cx - kx},${cy + ry} ${cx - rx},${cy + ky} ${cx - rx},${cy}Z`
  } catch (error) {
    return null
  }
}

function lineToPath(x1, y1, x2, y2) {
  try {
    x1 = parseFloat(x1 || 0)
    y1 = parseFloat(y1 || 0)
    x2 = parseFloat(x2)
    y2 = parseFloat(y2)

    if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
      return null
    }

    return `M${x1},${y1}L${x2},${y2}`
  } catch (error) {
    return null
  }
}

function polygonToPath(points) {
  try {
    if (!points || typeof points !== 'string') {
      return null
    }

    const coords = points.trim().split(/[\s,]+/).map(c => parseFloat(c))
    if (coords.length < 2 || coords.some(isNaN) || coords.length % 2 !== 0) {
      return null
    }

    let pathData = `M${coords[0]},${coords[1]}`
    for (let i = 2; i < coords.length; i += 2) {
      pathData += `L${coords[i]},${coords[i + 1]}`
    }
    pathData += 'Z'
    return pathData
  } catch (error) {
    return null
  }
}

function polylineToPath(points) {
  try {
    if (!points || typeof points !== 'string') {
      return null
    }

    const coords = points.trim().split(/[\s,]+/).map(c => parseFloat(c))
    if (coords.length < 2 || coords.some(isNaN) || coords.length % 2 !== 0) {
      return null
    }

    let pathData = `M${coords[0]},${coords[1]}`
    for (let i = 2; i < coords.length; i += 2) {
      pathData += `L${coords[i]},${coords[i + 1]}`
    }
    return pathData
  } catch (error) {
    return null
  }
}

function convertShapesToPaths(svg) {
  let result = svg
  let bytesRemoved = 0
  const before = result.length

  try {
    result = result.replace(/<rect\b([^>]*)>/gi, (match) => {
      const x = match.match(/\bx="([^"]*)"/)?.[1]
      const y = match.match(/\by="([^"]*)"/)?.[1]
      const width = match.match(/\bwidth="([^"]*)"/)?.[1]
      const height = match.match(/\bheight="([^"]*)"/)?.[1]
      const rx = match.match(/\brx="([^"]*)"/)?.[1]
      const ry = match.match(/\bry="([^"]*)"/)?.[1]

      const pathD = rectToPath(x, y, width, height, rx, ry)
      if (!pathD) return match

      let attrs = match.replace(/\s(x|y|width|height|rx|ry)="[^"]*"/g, '')
      attrs = attrs.replace(/^<rect\b/, '').replace(/>$/, '')
      return `<path d="${pathD}"${attrs}>`
    })

    result = result.replace(/<circle\b([^>]*)>/gi, (match) => {
      const cx = match.match(/\bcx="([^"]*)"/)?.[1]
      const cy = match.match(/\bcy="([^"]*)"/)?.[1]
      const r = match.match(/\br="([^"]*)"/)?.[1]

      const pathD = circleToPath(cx, cy, r)
      if (!pathD) return match

      let attrs = match.replace(/\s(cx|cy|r)="[^"]*"/g, '')
      attrs = attrs.replace(/^<circle\b/, '').replace(/>$/, '')
      return `<path d="${pathD}"${attrs}>`
    })

    result = result.replace(/<ellipse\b([^>]*)>/gi, (match) => {
      const cx = match.match(/\bcx="([^"]*)"/)?.[1]
      const cy = match.match(/\bcy="([^"]*)"/)?.[1]
      const rx = match.match(/\brx="([^"]*)"/)?.[1]
      const ry = match.match(/\bry="([^"]*)"/)?.[1]

      const pathD = ellipseToPath(cx, cy, rx, ry)
      if (!pathD) return match

      let attrs = match.replace(/\s(cx|cy|rx|ry)="[^"]*"/g, '')
      attrs = attrs.replace(/^<ellipse\b/, '').replace(/>$/, '')
      return `<path d="${pathD}"${attrs}>`
    })

    result = result.replace(/<line\b([^>]*)\/>/gi, (match) => {
      const x1 = match.match(/\bx1="([^"]*)"/)?.[1]
      const y1 = match.match(/\by1="([^"]*)"/)?.[1]
      const x2 = match.match(/\bx2="([^"]*)"/)?.[1]
      const y2 = match.match(/\by2="([^"]*)"/)?.[1]

      const pathD = lineToPath(x1, y1, x2, y2)
      if (!pathD) return match

      let attrs = match.replace(/\s(x1|y1|x2|y2)="[^"]*"/g, '')
      attrs = attrs.replace(/^<line\b/, '').replace(/\/>$/, '>')
      return `<path d="${pathD}"${attrs}>`
    })

    result = result.replace(/<polygon\b([^>]*)>/gi, (match) => {
      const points = match.match(/\bpoints="([^"]*)"/)?.[1]

      const pathD = polygonToPath(points)
      if (!pathD) return match

      let attrs = match.replace(/\bpoints="[^"]*"/, '')
      attrs = attrs.replace(/^<polygon\b/, '').replace(/>$/, '')
      return `<path d="${pathD}"${attrs}>`
    })

    result = result.replace(/<polyline\b([^>]*)>/gi, (match) => {
      const points = match.match(/\bpoints="([^"]*)"/)?.[1]

      const pathD = polylineToPath(points)
      if (!pathD) return match

      let attrs = match.replace(/\bpoints="[^"]*"/, '')
      attrs = attrs.replace(/^<polyline\b/, '').replace(/>$/, '')
      return `<path d="${pathD}"${attrs}>`
    })

    bytesRemoved = before - result.length
  } catch (error) {
    return { result: svg, bytesRemoved: 0 }
  }

  return { result, bytesRemoved }
}

/* ============================
 *  PATH MERGING
 * ============================ */

function getPathAttributes(pathTag) {
  const attrs = {
    fill: pathTag.match(/\bfill="([^"]*)"/)?.[1] || 'black',
    stroke: pathTag.match(/\bstroke="([^"]*)"/)?.[1] || 'none',
    fillRule: pathTag.match(/\bfill-rule="([^"]*)"/)?.[1] || 'nonzero',
    transform: pathTag.match(/\btransform="([^"]*)"/)?.[1] || ''
  }
  return attrs
}

function pathAttributesEqual(attrs1, attrs2) {
  return (
    attrs1.fill === attrs2.fill &&
    attrs1.stroke === attrs2.stroke &&
    attrs1.fillRule === attrs2.fillRule &&
    attrs1.transform === attrs2.transform
  )
}

function canMergePaths(path1Tag, path2Tag, svg) {
  const attrs1 = getPathAttributes(path1Tag)
  const attrs2 = getPathAttributes(path2Tag)

  if (!pathAttributesEqual(attrs1, attrs2)) {
    return false
  }

  if (/\bfilter="[^"]*"|<filter\b/.test(svg)) {
    return false
  }

  if (/\bmask="[^"]*"|<mask\b/.test(svg)) {
    return false
  }

  if (/<animate\b|<set\b|<animateMotion\b|<animateTransform\b/.test(svg)) {
    return false
  }

  return true
}

function mergePaths(svg) {
  let result = svg
  let bytesRemoved = 0
  const before = result.length

  try {
    const pathPattern = /<path\b[^>]*d="([^"]*)"[^>]*>/gi
    const pathTags = []
    let match

    while ((match = pathPattern.exec(svg)) !== null) {
      pathTags.push({
        index: match.index,
        fullTag: match[0],
        d: match[1]
      })
    }

    if (pathTags.length < 2) {
      return { result, bytesRemoved }
    }

    const mergedIndices = new Set()
    let mergedCount = 0

    for (let i = 0; i < pathTags.length; i++) {
      if (mergedIndices.has(i)) continue

      const pathsToMerge = [pathTags[i]]
      for (let j = i + 1; j < pathTags.length; j++) {
        if (mergedIndices.has(j)) continue
        if (canMergePaths(pathTags[i].fullTag, pathTags[j].fullTag, svg)) {
          pathsToMerge.push(pathTags[j])
          mergedIndices.add(j)
        }
      }

      if (pathsToMerge.length > 1) {
        const mergedD = pathsToMerge.map(p => p.d).join(' ')
        const replacement = pathTags[i].fullTag.replace(/d="[^"]*"/, `d="${mergedD}"`)
        result = result.replace(pathTags[i].fullTag, replacement)

        for (let j = 1; j < pathsToMerge.length; j++) {
          result = result.replace(pathsToMerge[j].fullTag, '')
        }

        mergedCount += pathsToMerge.length - 1
      }
    }

    bytesRemoved = before - result.length
  } catch (error) {
    return { result: svg, bytesRemoved: 0 }
  }

  return { result, bytesRemoved }
}

/* ============================
 *  FORMATTING (PRETTY MODE)
 * ============================ */

const ATTRIBUTE_ORDER = {
  'xmlns': 0, 'xmlns:xlink': 0, 'xmlns:svg': 0,
  'viewBox': 1,
  'width': 2, 'height': 2,
  'id': 3, 'class': 3,
  'x': 10, 'y': 10, 'x1': 10, 'y1': 10, 'x2': 10, 'y2': 10,
  'cx': 10, 'cy': 10,
  'width': 10, 'height': 10, 'r': 10, 'rx': 10, 'ry': 10,
  'd': 15, 'points': 15,
  'transform': 20,
  'fill': 30, 'stroke': 30, 'stroke-width': 30, 'stroke-linecap': 30, 'stroke-dasharray': 30, 'stroke-linejoin': 30,
  'opacity': 30, 'fill-opacity': 30, 'stroke-opacity': 30, 'fill-rule': 30,
  'filter': 40, 'mask': 40, 'clip-path': 40,
  'text-anchor': 50, 'font-size': 50, 'font-family': 50, 'font-weight': 50, 'font-style': 50,
  'href': 60, 'xlink:href': 60,
  'offset': 70, 'stop-color': 70, 'stop-opacity': 70,
  'stdDeviation': 70, 'in': 70, 'result': 70,
  'cx': 70, 'cy': 70,
  'viewBox': 70,
  'role': 80, 'aria-label': 80, 'aria-labelledby': 80, 'aria-describedby': 80,
  'version': 90
}

function extractAttributes(attrString) {
  const attrs = []
  const pattern = /(\w[\w:-]*)\s*=\s*"([^"]*)"/g
  let match
  while ((match = pattern.exec(attrString)) !== null) {
    attrs.push({ name: match[1], value: match[2] })
  }
  return attrs
}

function sortAttributeList(attrs) {
  return attrs.sort((a, b) => {
    const orderA = ATTRIBUTE_ORDER[a.name] !== undefined ? ATTRIBUTE_ORDER[a.name] : 999
    const orderB = ATTRIBUTE_ORDER[b.name] !== undefined ? ATTRIBUTE_ORDER[b.name] : 999
    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })
}

function formatAttributes(attrs, baseIndent, isSingleLine) {
  if (attrs.length === 0) return ''

  const attrStr = attrs.map(a => `${a.name}="${a.value}"`).join(' ')

  if (isSingleLine && attrStr.length <= 70 && attrs.length <= 3) {
    return ' ' + attrStr
  }

  const lines = attrs.map(a => `${baseIndent}  ${a.name}="${a.value}"`)
  return '\n' + lines.join('\n') + '\n' + baseIndent
}

function tokenizeSVG(svg) {
  const tokens = []
  let i = 0
  const normalized = svg.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()

  while (i < normalized.length) {
    const openIdx = normalized.indexOf('<', i)

    if (openIdx === -1) {
      const textContent = normalized.substring(i).trim()
      if (textContent) tokens.push({ type: 'text', content: textContent })
      break
    }

    if (openIdx > i) {
      const textContent = normalized.substring(i, openIdx).trim()
      if (textContent) tokens.push({ type: 'text', content: textContent })
    }

    const closeIdx = normalized.indexOf('>', openIdx)
    if (closeIdx === -1) break

    const tagContent = normalized.substring(openIdx + 1, closeIdx)
    const isClosing = tagContent.startsWith('/')
    const isSelfClosing = tagContent.endsWith('/')

    if (isClosing) {
      const tagName = tagContent.substring(1).trim()
      tokens.push({ type: 'closeTag', tagName })
    } else {
      const parts = tagContent.split(/\s+/)
      const tagName = parts[0]
      const attrPart = tagContent.substring(tagName.length).trim()
      const attrs = extractAttributes(attrPart)
      const sortedAttrs = sortAttributeList(attrs)

      tokens.push({
        type: 'openTag',
        tagName,
        attrs: sortedAttrs,
        selfClosing: isSelfClosing
      })
    }

    i = closeIdx + 1
  }

  return tokens
}

function shouldFormatMultiLine(tagName, attrs) {
  const structuralElements = ['svg', 'g', 'defs', 'mask', 'filter', 'clipPath', 'pattern', 'symbol', 'style', 'text']

  if (structuralElements.includes(tagName)) return true

  if (attrs.length > 4) return true

  const attrStr = attrs.map(a => `${a.name}="${a.value}"`).join(' ')
  if (attrStr.length > 70) return true

  const complexAttrs = attrs.some(a => a.name === 'd' || a.name === 'transform' || a.name === 'style')
  if (complexAttrs) return true

  return false
}

function formatSVGPretty(svg) {
  try {
    const tokens = tokenizeSVG(svg)
    let depth = 0
    let result = ''
    const indentStr = '  '
    const structuralElements = ['svg', 'g', 'defs', 'mask', 'filter', 'clipPath', 'pattern', 'symbol', 'text']

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      const nextToken = tokens[i + 1]
      const prevToken = i > 0 ? tokens[i - 1] : null

      if (token.type === 'openTag') {
        const currentIndent = indentStr.repeat(depth)
        const isMultiLine = shouldFormatMultiLine(token.tagName, token.attrs)
        const isStructural = structuralElements.includes(token.tagName)
        const willHaveChildren = !token.selfClosing && nextToken && nextToken.type !== 'closeTag'
        const attrStr = token.attrs.map(a => `${a.name}="${a.value}"`).join(' ')

        if (token.selfClosing) {
          if (isMultiLine) {
            result += currentIndent + `<${token.tagName}\n`
            token.attrs.forEach((attr) => {
              result += currentIndent + `  ${attr.name}="${attr.value}"\n`
            })
            result += currentIndent + `/>\n`
          } else if (token.attrs.length > 0) {
            result += currentIndent + `<${token.tagName} ${attrStr} />\n`
          } else {
            result += currentIndent + `<${token.tagName} />\n`
          }
        } else if (!willHaveChildren && nextToken?.type === 'closeTag') {
          if (isMultiLine) {
            result += currentIndent + `<${token.tagName}\n`
            token.attrs.forEach((attr) => {
              result += currentIndent + `  ${attr.name}="${attr.value}"\n`
            })
            result += currentIndent + `>\n`
          } else if (token.attrs.length > 0) {
            result += currentIndent + `<${token.tagName} ${attrStr}>\n`
          } else {
            result += currentIndent + `<${token.tagName}>\n`
          }
          depth++
        } else {
          if (isMultiLine) {
            result += currentIndent + `<${token.tagName}\n`
            token.attrs.forEach((attr) => {
              result += currentIndent + `  ${attr.name}="${attr.value}"\n`
            })
            result += currentIndent + `>\n`
          } else if (token.attrs.length > 0) {
            result += currentIndent + `<${token.tagName} ${attrStr}>\n`
          } else {
            result += currentIndent + `<${token.tagName}>\n`
          }

          if (isStructural) result += '\n'
          depth++
        }
      } else if (token.type === 'closeTag') {
        depth = Math.max(0, depth - 1)
        const currentIndent = indentStr.repeat(depth)
        result += currentIndent + `</${token.tagName}>\n`

        const isStructural = structuralElements.includes(token.tagName)
        const isNextTokenOpenTag = nextToken && nextToken.type === 'openTag'
        const isNextTokenSibling = isNextTokenOpenTag && depth < 2

        if (isStructural && isNextTokenSibling && depth === 0) {
          result += '\n'
        }
      } else if (token.type === 'text') {
        const currentIndent = indentStr.repeat(depth)
        result += currentIndent + token.content + '\n'
      }
    }

    return result.replace(/\n\s*\n\n+/g, '\n\n').trim() + '\n'
  } catch (error) {
    return formatSVGCompact(svg)
  }
}

function formatSVGCompact(svg) {
  return svg.replace(/\n\s*/g, '').trim()
}

/* ============================
 *  MAIN SVG OPTIMIZER
 * ============================ */

function svgOptimizer(text, config = {}) {
  if (!text || typeof text !== 'string') {
    return {
      error: 'Invalid SVG input'
    }
  }

  // PIPELINE LOCK: Original → Normalize → Analyze → Phase 2 Optimize → Format

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

  // Phase 1: Normalize (whitespace, comments)
  const normalizedSvg = originalSvg
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/<!--.*?-->/g, '')
    .trim()

  // Phase 1.5: Analysis (facts about the SVG)
  const analysis = analyzeSVGStructure(originalSvg)
  const linting = lintSVG(originalSvg, analysis)
  const normalization = detectNormalization(originalSvg, normalizedSvg)
  const stats = calculateOptimizationStats(originalSvg, normalizedSvg)

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

  // Phase 2: Advanced optimizations
  let optimizedSvg = normalizedSvg
  const stepResults = []
  let anyStepExecuted = false
  let idMappings = {}

  if (config.phase2 && config.phase2.enabled) {
    const level = config.phase2.level || 'safe'
    const presetConfig = getPhase2Config(level)
    const overrides = config.phase2.overrides || {}
    
    const finalConfig = { ...presetConfig }
    Object.keys(overrides).forEach(key => {
      if (overrides[key] !== undefined) {
        finalConfig[key] = overrides[key]
      }
    })

    // Step: removeUnusedDefs
    if (finalConfig.removeUnusedDefs.enabled && analysis.references.idsDefined.length > 0) {
      const defCount = analysis.references.idsDefined.filter(id => !analysis.references.idsReferenced.includes(id)).length
      const { result: defsRemoved, bytesRemoved } = removeUnusedDefs(optimizedSvg, analysis.references)
      
      const executed = bytesRemoved > 0
      stepResults.push({
        step: 'removeUnusedDefs',
        possible: defCount > 0,
        safe: true,
        executed,
        reason: executed ? `Removed ${defCount} unused definition(s)` : `No unused definitions found`,
        bytesRemoved
      })
      
      if (executed) {
        optimizedSvg = defsRemoved
        anyStepExecuted = true
      }
    }

    // Step: attributeCleanup
    if (finalConfig.attributeCleanup.enabled) {
      const { result: cleaned, bytesRemoved } = cleanupAttributes(optimizedSvg)
      const executed = bytesRemoved > 0

      stepResults.push({
        step: 'attributeCleanup',
        possible: true,
        safe: true,
        executed,
        reason: executed ? `Removed ${bytesRemoved} bytes of redundant attributes` : `No redundant attributes found`,
        bytesRemoved
      })

      if (executed) {
        optimizedSvg = cleaned
        anyStepExecuted = true
      }
    }

    // Step: removeEmptyGroups (always safe, removes structural clutter)
    if (finalConfig.removeEmptyGroups && finalConfig.removeEmptyGroups.enabled) {
      if (/<g\b[^>]*>\s*<\/g>/i.test(optimizedSvg)) {
        const { result: noEmptyGroups, bytesRemoved } = removeEmptyGroups(optimizedSvg)
        const executed = bytesRemoved > 0

        stepResults.push({
          step: 'removeEmptyGroups',
          possible: true,
          safe: true,
          executed,
          reason: executed ? `Removed empty group elements` : `No empty groups found`,
          bytesRemoved
        })

        if (executed) {
          optimizedSvg = noEmptyGroups
          anyStepExecuted = true
        }
      }
    }

    // Step: precisionReduction
    if (finalConfig.precisionReduction.enabled) {
      const geometryBlocked = []
      const textBlocked = []

      if (safetyFlags.hasFilters && finalConfig.precisionReduction.decimals < 2) {
        geometryBlocked.push('filters (sensitive to coordinate changes)')
      }
      if (safetyFlags.hasMasks && finalConfig.precisionReduction.decimals < 2) {
        geometryBlocked.push('masks (visual clipping may shift)')
      }
      if (safetyFlags.hasText && finalConfig.precisionReduction.decimals < 3) {
        textBlocked.push('text (may cause font rendering issues)')
      }

      const isPossible = stats.precision.originalDecimals !== null && stats.precision.originalDecimals > 0
      const geometrySafe = geometryBlocked.length === 0
      const textSafe = textBlocked.length === 0
      let executed = false
      let bytesRemoved = 0

      if (geometrySafe && isPossible && stats.precision.originalDecimals > finalConfig.precisionReduction.decimals) {
        const { result: reduced, bytesRemoved: removed } = reducePrecision(optimizedSvg, finalConfig.precisionReduction.decimals)

        if (removed > 0) {
          optimizedSvg = reduced
          executed = true
          bytesRemoved = removed
          anyStepExecuted = true
        }
      }

      const allSafe = geometrySafe && textSafe
      const reasons = []
      if (executed) {
        reasons.push(`Reduced from ${stats.precision.originalDecimals} to ${finalConfig.precisionReduction.decimals} decimals`)
        if (safetyFlags.hasText && !textSafe) {
          reasons.push('Text attributes were preserved at higher precision')
        }
      } else if (!allSafe) {
        if (geometryBlocked.length > 0) {
          reasons.push(`Geometry blocked by: ${geometryBlocked.join(', ')}`)
        }
        if (textBlocked.length > 0) {
          reasons.push(`Text blocked by: ${textBlocked.join(', ')}`)
        }
      } else {
        reasons.push(`No precision reduction needed (already at or below ${finalConfig.precisionReduction.decimals} decimals)`)
      }

      stepResults.push({
        step: 'precisionReduction',
        possible: isPossible,
        safe: allSafe,
        executed,
        scopes: {
          geometry: { safe: geometrySafe, blocked: geometryBlocked },
          text: { safe: textSafe, blocked: textBlocked }
        },
        reason: reasons.join('; '),
        bytesRemoved
      })
    }

    // Step: shapeConversion
    if (finalConfig.shapeConversion && finalConfig.shapeConversion.enabled) {
      const hasShapes = ['circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line'].some(
        tag => analysis.elements[tag] > 0
      )
      const isSafe = true
      let executed = false
      let bytesRemoved = 0

      if (isSafe && hasShapes) {
        const { result: converted, bytesRemoved: removed } = convertShapesToPaths(optimizedSvg)

        if (removed > 0) {
          optimizedSvg = converted
          executed = true
          bytesRemoved = removed
          anyStepExecuted = true
        }
      }

      stepResults.push({
        step: 'shapeConversion',
        possible: hasShapes,
        safe: isSafe,
        executed,
        reason: executed
          ? `Converted shapes to paths, removed ${bytesRemoved} bytes`
          : `No shapes to convert or no size reduction achieved`,
        bytesRemoved
      })
    }

    // Step: pathMerging
    if (finalConfig.pathMerging && finalConfig.pathMerging.enabled) {
      const pathCount = analysis.elements.path || 0
      const hasAnimations = safetyFlags.hasAnimations
      const hasFilters = safetyFlags.hasFilters
      const hasMasks = safetyFlags.hasMasks

      // Path merging rules:
      // - Only block if stroke differs, fill-rule differs, transform differs, OR has animations
      // - Safe to merge if only same fill/stroke/fill-rule/transform
      // - Filters/masks/animations on individual paths block merging for those specific paths
      const isSafe = !hasAnimations
      let executed = false
      let bytesRemoved = 0

      if (isSafe && pathCount > 1) {
        const { result: merged, bytesRemoved: removed } = mergePaths(optimizedSvg)

        if (removed > 0) {
          optimizedSvg = merged
          executed = true
          bytesRemoved = removed
          anyStepExecuted = true
        }
      }

      const blockedReasons = []
      if (hasAnimations) blockedReasons.push('animations')
      if (hasFilters) blockedReasons.push('filter elements present (paths with filters may not merge)')
      if (hasMasks) blockedReasons.push('mask elements present (paths with masks may not merge)')

      stepResults.push({
        step: 'pathMerging',
        possible: pathCount > 1,
        safe: isSafe,
        executed,
        blockedBy: isSafe ? undefined : blockedReasons,
        reason: executed
          ? `Merged compatible paths (same fill, stroke, fill-rule, transform), removed ${bytesRemoved} bytes`
          : isSafe
          ? `No mergeable paths found (paths must have identical fill, stroke, fill-rule, and transform)`
          : `Blocked: ${blockedReasons.join('; ')}`,
        bytesRemoved
      })
    }

    // Step: idCleanup (unused-only or minify mode)
    if (finalConfig.idCleanup && finalConfig.idCleanup.enabled && analysis.references.idsDefined.length > 0) {
      if (finalConfig.idCleanup.mode === 'unused-only') {
        const unusedIds = analysis.references.idsDefined.filter(id => !analysis.references.idsReferenced.includes(id))
        const isSafe = true
        let executed = false
        let bytesRemoved = 0

        if (unusedIds.length > 0) {
          const { result: cleaned, bytesRemoved: removed } = removeUnusedIds(optimizedSvg, analysis.references)

          if (removed > 0) {
            optimizedSvg = cleaned
            executed = true
            bytesRemoved = removed
            anyStepExecuted = true
          }
        }

        stepResults.push({
          step: 'idCleanup',
          possible: unusedIds.length > 0,
          safe: isSafe,
          executed,
          reason: executed
            ? `Removed ${unusedIds.length} unused ID(s) entirely`
            : `No unused IDs to remove`,
          bytesRemoved
        })
      } else if (finalConfig.idCleanup.mode === 'minify') {
        const isSafe = !safetyFlags.hasBrokenReferences
        let executed = false
        let bytesRemoved = 0

        if (isSafe) {
          const { result: minified, bytesRemoved: removed, idMap } = minifyIds(optimizedSvg, analysis.references)
          idMappings = idMap

          if (removed > 0) {
            optimizedSvg = minified
            executed = true
            bytesRemoved = removed
            anyStepExecuted = true
          }
        }

        stepResults.push({
          step: 'idCleanup',
          possible: analysis.references.idsDefined.length > 0,
          safe: isSafe,
          executed,
          warning: 'ID minification renames all IDs to single letters (a, b, c...). External CSS/JS selectors will break. Use with caution in production.',
          blockedBy: isSafe ? undefined : ['brokenReferences'],
          reason: executed
            ? `Minified ${analysis.references.idsDefined.length} IDs to short names`
            : isSafe
            ? `No ID minification applied`
            : `Blocked: SVG has broken ID references that could be broken further by minification`,
          bytesRemoved
        })
      }
    }

    // Step: Cascading cleanup (remove unreferenced IDs from elements, then remove empty groups)
    // This runs after ID cleanup in aggressive mode to expose and remove empty containers
    if (level === 'aggressive' && finalConfig.idCleanup && finalConfig.idCleanup.enabled) {
      let cascadingBytesRemoved = 0

      // First: Rebuild reference graph with current SVG state (after ID minification if applicable)
      const currentReferences = trackReferences(optimizedSvg)

      // Remove unreferenced ID attributes from elements
      if (currentReferences.idsDefined.length > 0) {
        const unreferencedIds = currentReferences.idsDefined.filter(id => !currentReferences.idsReferenced.includes(id))

        if (unreferencedIds.length > 0) {
          const { result: idsRemoved, bytesRemoved: removed } = removeUnreferencedIds(optimizedSvg, currentReferences)

          if (removed > 0) {
            optimizedSvg = idsRemoved
            cascadingBytesRemoved += removed
            anyStepExecuted = true
          }
        }
      }

      // Then: Remove empty groups that have no rendering-relevant attributes
      if (finalConfig.removeEmptyGroups && finalConfig.removeEmptyGroups.enabled) {
        const { result: cascaded, bytesRemoved: removed } = cascadingCleanup(optimizedSvg)

        if (removed > 0) {
          optimizedSvg = cascaded
          cascadingBytesRemoved += removed
          anyStepExecuted = true
        }
      }

      // Report cascading cleanup as a single step
      if (cascadingBytesRemoved > 0) {
        stepResults.push({
          step: 'cascadingCleanup',
          possible: true,
          safe: true,
          executed: true,
          reason: 'Removed unreferenced ID attributes and empty groups without rendering-relevant attributes',
          bytesRemoved: cascadingBytesRemoved
        })
      }
    }
  }

  // Calculate final stats (comparing originalSvg to optimizedSvg)
  const finalStats = calculateOptimizationStats(originalSvg, optimizedSvg)

  // Generate diff (now with ID mapping info)
  const diff = generateDiff(originalSvg, optimizedSvg, idMappings)

  // Determine optimization result state
  let optimizationResult = 'no_changes'
  if (stepResults.length > 0) {
    const executedSteps = stepResults.filter(s => s.executed).length
    if (executedSteps === stepResults.length) {
      optimizationResult = 'changes_applied'
    } else if (executedSteps > 0) {
      optimizationResult = 'partial_changes'
    } else {
      optimizationResult = 'no_changes'
    }
  } else if (!validation.isValid) {
    optimizationResult = 'blocked'
  }

  // Phase 3: Format output (optimizedSvg is always compact)
  const outputFormat = config.outputFormat || 'compact'
  let outputSvg = optimizedSvg

  if (outputFormat === 'pretty') {
    outputSvg = formatSVGPretty(optimizedSvg)
  } else {
    outputSvg = formatSVGCompact(optimizedSvg)
  }

  // Track which optimizations were actually applied
  const appliedOptimizations = stepResults
    .filter(step => step.executed)
    .map(step => step.step)

  // Potential future optimizations that weren't applied
  const potentialOptimizations = {
    precisionReduction: {
      possible: finalStats.precision.originalDecimals !== null && finalStats.precision.originalDecimals > 0,
      safe: !(safetyFlags.hasText || safetyFlags.hasFilters || safetyFlags.hasMasks),
      executed: stepResults.some(s => s.step === 'precisionReduction' && s.executed)
    },
    shapeConversion: {
      possible: Object.keys(analysis.elements).some(tag => ['circle', 'ellipse', 'rect', 'polygon', 'polyline', 'line'].includes(tag)),
      safe: true,
      executed: stepResults.some(s => s.step === 'shapeConversion' && s.executed)
    },
    pathMerging: {
      possible: (analysis.elements.path || 0) > 1,
      safe: !safetyFlags.hasAnimations && !safetyFlags.hasFilters && !safetyFlags.hasMasks,
      executed: stepResults.some(s => s.step === 'pathMerging' && s.executed)
    },
    removeUnusedDefs: {
      possible: analysis.references.idsDefined.some(id => !analysis.references.idsReferenced.includes(id)),
      safe: true,
      executed: stepResults.some(s => s.step === 'removeUnusedDefs' && s.executed)
    }
  }

  return {
    // Pipeline results
    originalSvg,
    optimizedSvg,     // Always compact, internal canonical form
    outputSvg,        // User-facing, formatted

    // Execution state
    optimizationResult,
    stepResults,
    appliedOptimizations,

    // Analysis
    validation,
    linting,
    analysis,
    normalization,

    // Statistics
    stats: finalStats,
    diff,

    // Safety & future optimization opportunities
    safetyFlags,
    potentialOptimizations,

    // Configuration
    outputFormat
  }
}

module.exports = {
  validateSVG,
  lintSVG,
  analyzeSVGStructure,
  calculateOptimizationStats,
  generateDiff,
  detectNormalization,
  trackReferences,
  extractViewport,
  formatSVGPretty,
  formatSVGSimplePretty: formatSVGPretty,
  formatSVGCompact,
  svgOptimizer,
  getPhase2Config
}
