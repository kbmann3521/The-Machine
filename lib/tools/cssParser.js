/**
 * CSS Parser Utility
 *
 * Parses CSS text into a rulesTree format compatible with the inspector.
 * Uses PostCSS for accurate position tracking (handles comments, formatting, etc.)
 */

let postcss = null
if (typeof window === 'undefined') {
  try {
    postcss = require('postcss')
  } catch (error) {
    console.warn('[cssParser] PostCSS not available, will fall back to regex parsing')
  }
}

/**
 * Calculate CSS specificity for a selector
 * Returns a score: (IDs × 100) + (classes/attributes × 10) + (elements × 1)
 * Examples:
 *   "div" = 1
 *   ".class" = 10
 *   "#id" = 100
 *   "div.class#id" = 111
 */
function calculateSpecificity(selector) {
  if (!selector || typeof selector !== 'string') return 0

  // Remove pseudo-elements (::before, ::after, etc.)
  let cleaned = selector.replace(/::[a-z-]+/gi, '')

  // Handle universal selector (*) as special case - always 0 specificity
  if (cleaned.trim() === '*') {
    return 0
  }

  let idCount = 0
  let classCount = 0
  let elementCount = 0

  // Count IDs (#id)
  idCount = (cleaned.match(/#[a-zA-Z0-9_-]+/g) || []).length

  // Count classes (.class) and attributes [attr]
  classCount = (cleaned.match(/\.[a-zA-Z0-9_-]+/g) || []).length
  classCount += (cleaned.match(/\[[^\]]*\]/g) || []).length

  // Count pseudo-classes (:hover, :focus, etc.) - they count as class
  classCount += (cleaned.match(/:[a-z-]+/gi) || []).length

  // Count elements (tags) - split by space/+/>/' combinators and count non-pseudo, non-id, non-class parts
  // First remove IDs, classes, and pseudo-classes to isolate element names
  const withoutSpecial = cleaned
    .replace(/#[a-zA-Z0-9_-]+/g, '')          // Remove IDs
    .replace(/\.[a-zA-Z0-9_-]+/g, '')         // Remove classes
    .replace(/:[a-z-]+/gi, '')                // Remove pseudo-classes
    .replace(/\*/g, '')                       // Remove universal selector

  // Now extract element names (tag names)
  const tags = withoutSpecial.match(/[a-z][a-z0-9-]*/gi) || []
  elementCount = tags.length

  // Calculate total specificity score (ensure non-negative)
  const score = (idCount * 100) + (classCount * 10) + elementCount
  return Math.max(0, score)
}

/**
 * Strip CSS comments from selector text
 * Removes block comments and line comments
 */
function stripCommentsFromSelector(selector) {
  if (!selector) return ''

  // Remove block comments /* */
  let cleaned = selector.replace(/\/\*[\s\S]*?\*\//g, '')

  // Remove line comments //
  cleaned = cleaned.replace(/\/\/.*$/gm, '')

  // Collapse multiple whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim()

  return cleaned
}

/**
 * Calculate line number from character position in text
 * @param {string} text - The full text to search in
 * @param {number} position - The character position
 * @returns {number} - The 1-based line number
 */
function getLineNumberAtPosition(text, position) {
  if (position <= 0) return 1
  // Count newlines before this position
  const beforeText = text.substring(0, position)
  // Count actual newline characters, then add 1 for the first line
  const lineNumber = (beforeText.match(/\n/g) || []).length + 1
  return lineNumber
}

/**
 * Parse CSS using PostCSS (preferred - handles comments, etc.)
 * @returns {Array} - Parsed rules with accurate line numbers
 */
function parseWithPostCss(css, options = {}) {
  if (!postcss) {
    return null // Fall back to regex parser
  }

  try {
    // Special handling: if CSS contains unspaced selectors like "*{",
    // normalize them for PostCSS compatibility
    let normalizedCss = css
    // Add space before opening braces if missing after selectors
    normalizedCss = normalizedCss.replace(/([a-z0-9\]\)"\'\*])(\{)/gi, '$1 $2')

    const root = postcss.parse(normalizedCss, { from: undefined })
    const rules = []
    let ruleIndex = 0
    const lineOffset = options.lineOffset || 0

    root.each(node => {
      if (node.type === 'rule') {
        let selector = node.selector?.trim()
        if (!selector || selector.startsWith('@')) {
          return
        }

        // Normalize selector whitespace: ensure space before opening brace is preserved
        // This handles edge cases like "*{" which should parse as "*"
        selector = selector.replace(/\s+/g, ' ').trim()

        // Split comma-separated selectors
        const selectorList = selector.split(',').map(s => s.trim()).filter(s => s)

        selectorList.forEach(sel => {
          const declarations = []
          node.each(decl => {
            if (decl.type === 'decl') {
              declarations.push({
                property: decl.prop,
                value: decl.value,
                loc: {
                  startLine: decl.source?.start?.line,
                  endLine: decl.source?.end?.line,
                },
              })
            }
          })

          rules.push({
            type: 'rule',
            ruleIndex: ruleIndex++,
            selector: sel,
            declarations,
            loc: {
              startLine: (node.source?.start?.line || 0) + lineOffset,
              endLine: (node.source?.end?.line || 0) + lineOffset,
            },
            specificity: calculateSpecificity(sel),
            origin: {
              source: options.origin || 'css',
              containerId: options.containerId || 'default',
            },
          })
        })
      } else if (node.type === 'atrule' && node.name === 'media') {
        // Handle @media rules
        const children = []
        node.each(child => {
          if (child.type === 'rule') {
            const selector = child.selector?.trim()
            if (selector && !selector.startsWith('@')) {
              const selectorList = selector.split(',').map(s => s.trim()).filter(s => s)
              selectorList.forEach(sel => {
                const declarations = []
                child.each(decl => {
                  if (decl.type === 'decl') {
                    declarations.push({
                      property: decl.prop,
                      value: decl.value,
                    })
                  }
                })

                children.push({
                  type: 'rule',
                  ruleIndex: ruleIndex++,
                  selector: sel,
                  declarations,
                  loc: {
                    startLine: (child.source?.start?.line || 0) + lineOffset,
                    endLine: (child.source?.end?.line || 0) + lineOffset,
                  },
                  specificity: calculateSpecificity(sel),
                })
              })
            }
          }
        })

        if (children.length > 0) {
          rules.push({
            type: 'atrule',
            ruleIndex: ruleIndex++,
            name: node.name,
            params: node.params,
            atRule: {
              name: node.name,
              params: node.params,
            },
            children,
            loc: {
              startLine: (node.source?.start?.line || 0) + lineOffset,
              endLine: (node.source?.end?.line || 0) + lineOffset,
            },
          })
        }
      } else if (node.type === 'atrule' && (node.name === 'keyframes' || node.name === 'font-face' || node.name === 'supports')) {
        // Handle @keyframes, @font-face, @supports and other at-rules
        // For these, we preserve the entire structure as-is without scoping
        const atRuleContent = []

        node.each(child => {
          if (child.type === 'rule') {
            const selector = child.selector?.trim()
            if (selector) {
              const declarations = []
              child.each(decl => {
                if (decl.type === 'decl') {
                  declarations.push({
                    property: decl.prop,
                    value: decl.value,
                  })
                }
              })

              atRuleContent.push({
                type: 'rule',
                selector: selector,
                declarations,
              })
            }
          } else if (child.type === 'decl') {
            // Handle direct declarations in at-rules (like in @font-face)
            atRuleContent.push({
              type: 'decl',
              property: child.prop,
              value: child.value,
            })
          }
        })

        if (atRuleContent.length > 0 || node.name === 'keyframes') {
          rules.push({
            type: 'atrule',
            ruleIndex: ruleIndex++,
            name: node.name,
            params: node.params,
            atRule: {
              name: node.name,
              params: node.params,
            },
            children: atRuleContent,
            loc: {
              startLine: (node.source?.start?.line || 0) + lineOffset,
              endLine: (node.source?.end?.line || 0) + lineOffset,
            },
          })
        }
      }
    })

    return rules
  } catch (error) {
    console.warn('[parseWithPostCss] Error:', error.message)
    return null
  }
}

/**
 * Simple CSS rule parser (fallback)
 * Extracts rules from CSS text without complex AST operations
 * IMPORTANT: Parses in document order to preserve @keyframes position
 *
 * @param {string} css - The CSS text to parse
 * @param {Object} options - Optional configuration
 * @param {string} options.origin - Rule origin: "html" (embedded) or "css" (from CSS tab)
 * @param {string} options.containerId - Unique id for <style> block or CSS document
 * @param {number} options.lineOffset - Line number offset (for CSS extracted from HTML <style> tags)
 * @returns {Array} - Array of parsed rules with origin metadata
 */
function parseSimpleCss(css, options = {}) {
  if (!css || typeof css !== 'string') {
    return []
  }

  const rules = []
  let ruleIndex = 0
  const lineOffset = options.lineOffset || 0

  // Collect all rule positions (both regular rules and @keyframes) in document order
  const rulePositions = []

  // Find all @keyframes with their positions
  let keyframesRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{/g
  let keyframesMatch
  while ((keyframesMatch = keyframesRegex.exec(css)) !== null) {
    const keyframesStart = keyframesMatch.index
    const keyframesName = keyframesMatch[1]
    const braceStart = keyframesStart + keyframesMatch[0].length - 1

    // Find matching closing brace
    let braceCount = 1
    let braceEnd = braceStart + 1
    while (braceEnd < css.length && braceCount > 0) {
      if (css[braceEnd] === '{') braceCount++
      else if (css[braceEnd] === '}') braceCount--
      if (braceCount > 0) braceEnd++
    }

    if (braceCount === 0) {
      rulePositions.push({
        type: 'keyframes',
        start: keyframesStart,
        end: braceEnd + 1,
        name: keyframesName,
        content: css.substring(braceStart + 1, braceEnd),
      })
    }
  }

  // Find all regular CSS rules with their positions
  const ruleRegex = /([^{}@]+?)\s*\{\s*([^}]*)\}/g
  let ruleMatch
  while ((ruleMatch = ruleRegex.exec(css)) !== null) {
    // Check if this rule is inside a @keyframes
    const isInsideKeyframes = rulePositions.some(
      kf => ruleMatch.index >= kf.start && ruleMatch.index < kf.end
    )
    if (isInsideKeyframes) {
      continue
    }

    let selectorText = ruleMatch[1].trim()
    // Skip empty selectors or @rules
    if (!selectorText || selectorText.startsWith('@')) {
      continue
    }

    rulePositions.push({
      type: 'rule',
      start: ruleMatch.index,
      end: ruleMatch.index + ruleMatch[0].length,
      selector: selectorText,
      declarations: ruleMatch[2].trim(),
    })
  }

  // Sort by position to maintain document order
  rulePositions.sort((a, b) => a.start - b.start)

  // Process rules in document order
  for (const rulePos of rulePositions) {
    if (rulePos.type === 'keyframes') {
      // Parse @keyframes
      const keyframeSelectorsRegex = /([0-9.%a-z]+)\s*\{([^}]*)\}/gi
      const keyframeChildren = []
      let kMatch

      while ((kMatch = keyframeSelectorsRegex.exec(rulePos.content)) !== null) {
        const keyframeSelector = kMatch[1].trim()
        const keyframeDecls = kMatch[2].trim()

        const declarations = []
        const declRegex = /([a-z\-]+)\s*:\s*([^;]+)/gi
        let declMatch

        while ((declMatch = declRegex.exec(keyframeDecls)) !== null) {
          declarations.push({
            property: declMatch[1].trim(),
            value: declMatch[2].trim(),
            loc: {},
          })
        }

        keyframeChildren.push({
          type: 'rule',
          selector: keyframeSelector,
          declarations,
        })
      }

      if (keyframeChildren.length > 0) {
        rules.push({
          type: 'atrule',
          ruleIndex: ruleIndex++,
          name: 'keyframes',
          params: rulePos.name,
          atRule: {
            name: 'keyframes',
            params: rulePos.name,
          },
          children: keyframeChildren,
          loc: {
            startLine: getLineNumberAtPosition(css, rulePos.start) + lineOffset,
            endLine: getLineNumberAtPosition(css, rulePos.end) + lineOffset,
          },
          origin: {
            source: options.origin || 'css',
            containerId: options.containerId || 'default',
          },
        })
      }
    } else {
      // Parse regular rule
      let selectorText = rulePos.selector
      const declarationsText = rulePos.declarations

      // Strip comments from selector text
      selectorText = stripCommentsFromSelector(selectorText)

      // Skip if selector became empty after cleaning
      if (!selectorText) {
        continue
      }

      // Parse declarations: property: value;
      const declarations = []
      const declRegex = /([a-z\-]+)\s*:\s*([^;]+)/gi
      let declMatch

      while ((declMatch = declRegex.exec(declarationsText)) !== null) {
        declarations.push({
          property: declMatch[1].trim(),
          value: declMatch[2].trim(),
          loc: {},
        })
      }

      // Handle multiple selectors separated by commas
      const selectorList = selectorText.split(',').map(s => s.trim())

      selectorList.forEach(selector => {
        if (!selector) return

        rules.push({
          type: 'rule',
          ruleIndex: ruleIndex++,
          selector,
          declarations,
          loc: {
            startLine: getLineNumberAtPosition(css, rulePos.start) + lineOffset,
            endLine: getLineNumberAtPosition(css, rulePos.end) + lineOffset,
          },
          specificity: calculateSpecificity(selector),
          // Origin tracking - tells inspector where this rule came from
          origin: {
            source: options.origin || 'css', // 'html' for <style> blocks, 'css' for CSS tab
            containerId: options.containerId || 'default', // unique id for this source container
          },
        })
      })
    }
  }

  return rules
}

/**
 * Convert CSS text into a rulesTree structure
 *
 * @param {string} css - The CSS text to parse
 * @param {Object} options - Optional configuration
 * @param {string} options.origin - 'html' or 'css'
 * @param {string} options.containerId - Unique ID for this source container
 * @param {number} options.lineOffset - Line offset for HTML-embedded CSS
 * @returns {Object[]} - Array of rule objects with origin metadata
 */
export function parseCssToRulesTree(css, options = {}) {
  if (!css || typeof css !== 'string') {
    return []
  }

  try {
    // Try PostCSS first (more accurate for comments, formatting)
    let rules = parseWithPostCss(css, options)
    let parserUsed = 'PostCSS'

    // Fall back to regex parser if PostCSS not available or failed
    if (!rules) {
      rules = parseSimpleCss(css, options)
      parserUsed = 'Regex'
    }

    const offsetInfo = options.lineOffset ? ` (offset: ${options.lineOffset})` : ''
    console.log(`[parseCssToRulesTree] (${parserUsed}) Parsed ${rules.length} rules`, options.origin ? `(${options.origin})` : '', offsetInfo)
    return rules
  } catch (error) {
    console.warn('[parseCssToRulesTree] Error parsing CSS:', error.message)
    return []
  }
}

/**
 * Extract CSS from HTML and parse it into a rulesTree
 *
 * @param {string} html - The HTML string containing <style> tags
 * @returns {Object[]} - Array of rule objects with origin="html" for each <style> block
 */
export function extractAndParseCssFromHtml(html) {
  if (!html || typeof html !== 'string') {
    console.log('[extractAndParseCssFromHtml] No HTML input')
    return []
  }

  // Import the extractor function
  // Note: This needs to be imported from cssExtractor.js
  // For now, we'll inline the logic to avoid circular dependency
  const allRules = []
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi

  let match
  let styleBlockIndex = 0

  while ((match = styleRegex.exec(html)) !== null) {
    let cssContent = match[1].trim()  // Get content between <style> and </style>

    // Normalize CSS: add space before opening braces if missing (e.g., *{ → * {)
    // This ensures compatibility with all CSS parsers and linters
    cssContent = cssContent.replace(/([a-z0-9\]\)"\'\*])(\{)/gi, '$1 $2')

    if (cssContent) {
      // Calculate the line where this CSS content starts in the HTML
      // Find position of the closing > of the opening <style> tag
      const positionOfClosingBracket = match[0].indexOf('>')
      const cssStartPosition = match.index + positionOfClosingBracket + 1
      const beforeCss = html.substring(0, cssStartPosition)

      // Count newlines to find which line the CSS content starts on
      const lineWhereStyleEnds = (beforeCss.match(/\n/g) || []).length + 1

      // PostCSS will report line numbers starting from 1 within the CSS text
      // So we need to offset by: (lineWhereStyleEnds - 1) to place line 1 of CSS at correct HTML line
      // Add 1 if there's a newline right after the > tag
      const hasNewlineAfterTag = html[cssStartPosition] === '\n' ? 1 : 0
      const lineOffset = lineWhereStyleEnds + hasNewlineAfterTag - 1

      // Generate unique container ID for this <style> block
      const containerId = `html-style-${styleBlockIndex}`

      // Parse this CSS block with origin metadata
      // PostCSS will provide accurate line numbers accounting for comments, etc.
      const blockRules = parseCssToRulesTree(cssContent, {
        origin: 'html',
        containerId: containerId,
        lineOffset: lineOffset
      })

      allRules.push(...blockRules)
      styleBlockIndex++
    }
  }

  if (allRules.length === 0) {
    console.log('[extractAndParseCssFromHtml] No <style> tags found in HTML')
    return []
  }

  console.log('[extractAndParseCssFromHtml] Found', allRules.length, 'rules from', styleBlockIndex, 'style blocks')
  return allRules
}
