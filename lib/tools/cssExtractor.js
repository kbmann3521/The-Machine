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
 * @param {string} html - The HTML string to clean
 * @returns {string} - HTML with <style> tags removed
 */
export function removeStyleTagsFromHtml(html) {
  if (!html || typeof html !== 'string') return html

  // Remove all <style> tags and their content
  return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
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
