/**
 * Selector Scanner Utility
 *
 * Extracts selectors from canonical HTML to ensure consistent selector
 * detection across Markdown and HTML rendering modes.
 *
 * Key principle: Both Markdown and HTML inputs produce the same canonical
 * HTML output, so scanning the HTML string (not the rendered DOM) gives
 * identical results for both modes.
 *
 * Returns a deterministic, categorized list of common selectors users can target.
 */

/**
 * Scan HTML string and extract all usable selectors
 * This is the canonical method that works for BOTH Markdown and HTML modes
 * because both produce the same HTML output.
 *
 * @param {string} htmlString - The HTML string to scan (from formatter.formatted)
 * @returns {Object} { tags: string[], classes: string[], suggestions: { structure: [], headings: [], text: [], code: [] } }
 */
export function scanSelectorsFromHTML(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    return { tags: [], classes: [], suggestions: { structure: [], headings: [], text: [], code: [] } }
  }

  const tags = new Set()
  const classes = new Set()

  // Extract all tag names from opening tags
  const tagRegex = /<(\w+)[\s>]/gi
  let match
  while ((match = tagRegex.exec(htmlString)) !== null) {
    const tagName = match[1].toLowerCase()
    // Skip meta tags that don't need styling
    if (!['script', 'style', 'noscript'].includes(tagName)) {
      tags.add(tagName)
    }
  }

  // Extract all classes from class attributes
  const classRegex = /class=["']([^"']+)["']/gi
  while ((match = classRegex.exec(htmlString)) !== null) {
    const classList = match[1].split(/\s+/)
    classList.forEach(className => {
      // Keep user-visible classes, skip CSS Module and scope classes
      if (
        className &&
        !className.includes('__') && // Skip CSS Module classes
        className !== 'pwt-markdown-preview' &&
        className !== 'pwt-html-preview'
      ) {
        classes.add(className)
      }
    })
  }

  // Convert to sorted arrays for determinism
  const tagArray = Array.from(tags).sort()
  const classArray = Array.from(classes).sort()

  // Generate categorized suggestions based on tags and classes
  const suggestions = generateSuggestions(tagArray, classArray)

  return {
    tags: tagArray,
    classes: classArray,
    suggestions, // Categorized object: { structure, headings, text, code }
  }
}

/**
 * Scan a DOM element and extract all usable selectors
 * DEPRECATED: Use scanSelectorsFromHTML() instead for consistent detection
 *
 * This is kept for backward compatibility with live rendering updates,
 * but internally delegates to HTML scanning when possible.
 *
 * @param {HTMLElement} element - The root element to scan (typically .pwt-markdown-preview)
 * @returns {Object} { tags: string[], classes: string[], suggestions: object }
 */
export function scanSelectorsFromDOM(element) {
  if (!element) {
    return { tags: [], classes: [], suggestions: { structure: [], headings: [], text: [], code: [] } }
  }

  // Fallback: scan the DOM's innerHTML for consistency
  // This ensures that changes to the DOM structure don't affect selector detection
  const htmlString = element.innerHTML
  return scanSelectorsFromHTML(htmlString)
}

/**
 * Generate a curated list of suggestions for common Markdown elements
 * Organized by category (Structure, Headings, Text, Code) for better UX
 *
 * @param {string[]} tags - All tag names found
 * @param {string[]} classes - All classes found
 * @returns {Object} Categorized selectors { structure: [], headings: [], text: [], code: [] }
 */
function generateSuggestions(tags, classes) {
  const categorized = {
    structure: [],
    headings: [],
    text: [],
    code: [],
  }

  // Structure category - skip body (it's the wrapper container and conflicts with scoped CSS)
  // Note: .pwt-preview is automatically scoped by scopeCss(), so users write it without prefix
  // Always add the preview container selector - it applies to both HTML and Markdown modes
  categorized.structure.push('.pwt-preview')

  // Add table-related selectors (WITHOUT .pwt-preview prefix - scopeCss() adds it automatically)
  const structureTags = ['table', 'thead', 'tbody', 'tr', 'th', 'td', 'blockquote', 'hr']
  structureTags.forEach(tag => {
    if (tags.includes(tag)) {
      categorized.structure.push(tag)
    }
  })

  // Headings category (WITHOUT prefix - users just write h2, h3, etc)
  const headingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  headingTags.forEach(tag => {
    if (tags.includes(tag)) {
      categorized.headings.push(tag)
    }
  })

  // Text category (WITHOUT prefix - users just write button, input, a, etc)
  const textTags = ['p', 'em', 'strong', 'del', 'a', 'ul', 'ol', 'li', 'button', 'input', 'form', 'label', 'textarea', 'select', 'option', 'fieldset']
  textTags.forEach(tag => {
    if (tags.includes(tag)) {
      categorized.text.push(tag)
    }
  })

  // Code category (WITHOUT prefix)
  const codeTags = ['pre', 'code']
  codeTags.forEach(tag => {
    if (tags.includes(tag)) {
      categorized.code.push(tag)
    }
  })

  // Add language-specific code selectors
  // SKIP: language-* classes are internal syntax highlighting classes, not user-visible
  // classes.forEach(className => {
  //   if (className.startsWith('language-')) {
  //     categorized.code.push(`.pwt-markdown-preview .${className}`)
  //   }
  // })

  return categorized
}
