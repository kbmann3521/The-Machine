/**
 * CSS Scoper utility
 *
 * Automatically scopes CSS rules to a specific container class
 * without requiring users to manually prefix their selectors.
 *
 * Example:
 *   Input: "h1 { color: red; }"
 *   Output: ".pwt-markdown-preview h1 { color: red; }"
 */

/**
 * Parse CSS and scope all selectors to a container
 *
 * Doubles the scope class to increase specificity, allowing user styles
 * to override default styles without requiring !important.
 *
 * @param {string} css - The CSS string to scope
 * @param {string} scopeClass - The class to use as scope (e.g., ".pwt-markdown-preview")
 * @returns {string} - The scoped CSS
 */
export function scopeCss(css, scopeClass = '.pwt-markdown-preview') {
  if (!css || typeof css !== 'string') return ''

  // Remove leading dot from scope class if present (we'll add it back)
  const cleanScope = scopeClass.startsWith('.') ? scopeClass : `.${scopeClass}`
  // Double the scope class to increase specificity without !important
  const doubleScopedClass = `${cleanScope}${cleanScope}`

  let result = ''
  let i = 0

  while (i < css.length) {
    // Skip whitespace at the start
    while (i < css.length && /\s/.test(css[i])) {
      result += css[i]
      i++
    }

    if (i >= css.length) break

    // Check for @rules (like @media, @keyframes, etc.)
    if (css[i] === '@') {
      // Parse the entire @rule block
      const atRuleStart = i
      let braceCount = 0

      // Find the opening brace of the @rule
      while (i < css.length && css[i] !== '{') {
        i++
      }

      if (i >= css.length) break

      const atRuleHeader = css.substring(atRuleStart, i + 1) // Include the '{'
      i++ // Skip the '{'
      braceCount = 1

      // Find matching closing brace
      const contentStart = i
      while (i < css.length && braceCount > 0) {
        if (css[i] === '{') braceCount++
        else if (css[i] === '}') braceCount--
        if (braceCount > 0) i++
      }

      const atRuleContent = css.substring(contentStart, i)

      // For media queries, recursively scope the inner rules
      if (atRuleHeader.includes('@media')) {
        const scopedContent = scopeCss(atRuleContent, scopeClass)
        result += atRuleHeader + scopedContent + '}\n'
      } else if (atRuleHeader.includes('@keyframes') || atRuleHeader.includes('@font-face') || atRuleHeader.includes('@supports')) {
        // For @keyframes, @font-face, @supports - don't scope inner content at all
        // These rules contain keyframe selectors (0%, 50%, 100%) or font descriptors that shouldn't be scoped
        result += atRuleHeader + atRuleContent + '}\n'
      } else {
        // For other @rules, don't scope the inner content
        result += atRuleHeader + atRuleContent + '}\n'
      }
      i++ // Skip the closing brace
      continue
    }

    // Parse selector until we find '{'
    const selectorStart = i
    let braceFound = false
    while (i < css.length && css[i] !== '{') {
      i++
    }

    if (i >= css.length) break

    let selector = css.substring(selectorStart, i).trim()

    // Check if the selector already has the scope class
    if (selector.includes(cleanScope)) {
      // Already scoped, add it as-is
      result += selector + ' '
    } else {
      // Need to scope it
      // Split by comma for multiple selectors
      const selectors = selector.split(',').map(sel => {
        sel = sel.trim()
        if (!sel) return ''

        // Special case: if selector is 'body', 'html', or ':root', apply styles to the preview container itself
        // This allows users to style the background and layout of the entire preview area
        if (sel === 'body' || sel === 'html' || sel === ':root') {
          return cleanScope
        }

        // For all other selectors, prepend the doubled scope class with descendant combinator
        // This increases specificity from (0,2,0) to (0,3,0) for simple selectors
        return `${doubleScopedClass} ${sel}`
      }).filter(s => s)

      result += selectors.join(', ') + ' '
    }

    // Find the opening brace
    i++ // Skip the '{'
    result += '{'

    // Copy the declaration block as-is, handling nested braces
    let braceCount = 1
    const declBlockStart = i
    while (i < css.length && braceCount > 0) {
      if (css[i] === '{') {
        braceCount++
      } else if (css[i] === '}') {
        braceCount--
      }
      i++
    }

    const declBlock = css.substring(declBlockStart, i - 1)
    result += declBlock + '}\n'
  }

  return result
}

/**
 * Check if CSS appears to already be scoped
 * @param {string} css - The CSS string to check
 * @param {string} scopeClass - The class to check for
 * @returns {boolean} - True if the CSS appears to be scoped
 */
export function isCssScoped(css, scopeClass = '.pwt-markdown-preview') {
  if (!css || typeof css !== 'string') return true
  const cleanScope = scopeClass.startsWith('.') ? scopeClass : `.${scopeClass}`
  return css.includes(cleanScope)
}
