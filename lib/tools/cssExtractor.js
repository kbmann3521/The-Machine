/**
 * CSS Extractor Utility
 *
 * Extracts CSS from <style> tags in HTML content.
 * Used to support self-contained HTML files with embedded CSS.
 *
 * This allows users to paste HTML + CSS together, and the tool will:
 * 1. Extract the CSS from <style> tags
 * 2. Merge it with user-entered CSS in the CSS tab
 * 3. Properly scope and apply it in the preview
 */

/**
 * Extract all CSS from <style> tags in HTML with line number tracking
 *
 * @param {string} html - The HTML string to scan
 * @returns {Array} - Array of { css, lineOffset } for each <style> block
 */
export function extractCssFromHtmlWithLineNumbers(html) {
  if (!html || typeof html !== 'string') return []

  const cssBlocks = []

  // Match all <style> tags, including those with attributes
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi

  let match
  while ((match = styleRegex.exec(html)) !== null) {
    const cssContent = match[1]
    // Trim but preserve the original content for line counting
    const trimmedCss = cssContent.trim()
    if (trimmedCss) {
      // Calculate which line the opening <style> tag is on
      const beforeStyle = html.substring(0, match.index)
      const lineOffset = beforeStyle.split('\n').length

      cssBlocks.push({
        css: trimmedCss,
        lineOffset: lineOffset,
      })
    }
  }

  return cssBlocks
}

/**
 * Extract all CSS from <style> tags in HTML
 *
 * @param {string} html - The HTML string to scan
 * @returns {string} - Combined CSS from all <style> tags (in order)
 */
export function extractCssFromHtml(html) {
  if (!html || typeof html !== 'string') return ''

  const cssBlocks = extractCssFromHtmlWithLineNumbers(html)

  // Join all CSS blocks with newlines
  return cssBlocks.map(block => block.css).join('\n\n')
}

/**
 * Remove <style> tags from HTML
 * Useful for preventing double-rendering of styles
 *
 * IMPORTANT: This function is quote-aware to avoid removing <style> tags
 * that appear inside iframe srcdoc attributes.
 *
 * @param {string} html - The HTML string to clean
 * @returns {string} - HTML with <style> tags removed (except those in srcdoc)
 */
export function removeStyleTagsFromHtml(html) {
  if (!html || typeof html !== 'string') return html

  let result = ''
  let i = 0
  let inQuote = false
  let quoteChar = null

  while (i < html.length) {
    // Track if we're inside a quoted attribute value
    const char = html[i]
    const prevChar = i > 0 ? html[i - 1] : ''

    // Update quote tracking
    if ((char === '"' || char === "'") && prevChar !== '\\') {
      if (!inQuote) {
        inQuote = true
        quoteChar = char
      } else if (char === quoteChar) {
        inQuote = false
        quoteChar = null
      }
    }

    // If we're not inside a quote and we find a <style> tag, skip it
    if (!inQuote && html.substring(i).match(/^<style[\s>]/i)) {
      // Find the closing </style> tag
      const styleTagStart = i
      const styleEndRegex = /<\/style\s*>/i
      const styleEndMatch = html.substring(i).match(styleEndRegex)

      if (styleEndMatch) {
        // Skip past </style>
        i += html.substring(i).indexOf(styleEndMatch[0]) + styleEndMatch[0].length
        continue
      } else {
        // No closing tag found, just add the character
        result += char
        i++
      }
    } else {
      // Not a <style> tag or we're inside a quote, just add the character
      result += char
      i++
    }
  }

  return result
}

/**
 * Extract CSS selectors from CSS text
 * Used to populate the inspector panel with selectors from embedded <style> tags
 *
 * @param {string} css - The CSS string to parse
 * @returns {string[]} - Array of selectors
 */
export function extractSelectorsFromCss(css) {
  if (!css || typeof css !== 'string') return []

  const selectors = new Set()

  // Simple regex-based selector extraction
  // Matches anything before an opening brace that's not an @rule
  const ruleRegex = /(?:^|\n)\s*([^@\n{}][^{]*?)\s*\{/g

  let match
  while ((match = ruleRegex.exec(css)) !== null) {
    let selector = match[1].trim()

    // Skip empty selectors
    if (!selector) continue

    // For multiple selectors separated by commas, split and add each
    const selectorList = selector.split(',')
    selectorList.forEach(sel => {
      sel = sel.trim()
      if (sel) {
        selectors.add(sel)
      }
    })
  }

  return Array.from(selectors).sort()
}

/**
 * Check if HTML contains <style> tags
 *
 * @param {string} html - The HTML string to check
 * @returns {boolean} - True if <style> tags are found
 */
export function hasStyleTags(html) {
  if (!html || typeof html !== 'string') return false
  return /<style[^>]*>/i.test(html)
}
