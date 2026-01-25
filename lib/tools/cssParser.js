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
    const root = postcss.parse(css, { from: undefined })
    const rules = []
    let ruleIndex = 0
    const lineOffset = options.lineOffset || 0

    root.each(node => {
      if (node.type === 'rule') {
        const selector = node.selector?.trim()
        if (!selector || selector.startsWith('@')) {
          return
        }

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

  // Match CSS rules: selector { declarations }
  // This regex finds content before opening brace, then captures declarations
  const ruleRegex = /([^{}@]+?)\s*\{\s*([^}]*)\}/g
  let match

  while ((match = ruleRegex.exec(css)) !== null) {
    let selectorText = match[1].trim()
    const declarationsText = match[2].trim()

    // Skip empty selectors or @rules
    if (!selectorText || selectorText.startsWith('@')) {
      continue
    }

    // Strip comments from selector text
    selectorText = stripCommentsFromSelector(selectorText)

    // Skip if selector became empty after cleaning
    if (!selectorText) {
      continue
    }

    // Calculate line numbers based on match position in CSS text, then apply offset
    const startLine = getLineNumberAtPosition(css, match.index) + lineOffset
    const endLine = getLineNumberAtPosition(css, match.index + match[0].length) + lineOffset

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
          startLine,
          endLine,
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
    const cssContent = match[1].trim()  // Get content between <style> and </style>

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
