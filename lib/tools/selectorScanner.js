/**
 * Selector Scanner Utility
 * 
 * Scans rendered Markdown HTML to extract tag names and classes
 * for CSS targeting suggestions in the preview editor.
 * 
 * Returns a deterministic list of common selectors users can target.
 */

/**
 * Scan a DOM element and extract all usable selectors
 * @param {HTMLElement} element - The root element to scan (typically .pwt-markdown-preview)
 * @returns {Object} { tags: string[], classes: string[] }
 */
export function scanSelectorsFromDOM(element) {
  if (!element) {
    return { tags: [], classes: [], suggestions: [] }
  }

  const tags = new Set()
  const classes = new Set()

  // Walk all elements recursively
  function walk(node) {
    if (node.nodeType !== 1) return // Skip non-element nodes

    const tagName = node.tagName.toLowerCase()

    // Collect tag names (skip script, style, etc.)
    if (!['script', 'style', 'noscript'].includes(tagName)) {
      tags.add(tagName)
    }

    // Collect classes, but filter out CSS Module scoped classes
    // CSS Modules generate class names like "markdown-renderer.module__h1___abc123"
    // We want user-visible classes like "language-bash"
    if (node.classList && node.classList.length > 0) {
      Array.from(node.classList).forEach(className => {
        // Skip CSS module classes (they typically contain __ or start with renderer/other module names)
        // Keep classes that look like user-friendly descriptors
        if (!className.includes('__') && className !== 'pwt-markdown-preview') {
          classes.add(className)
        }
      })
    }

    // Recurse into children
    Array.from(node.childNodes).forEach(child => walk(child))
  }

  walk(element)

  // Convert to sorted arrays for determinism
  const tagArray = Array.from(tags).sort()
  const classArray = Array.from(classes).sort()

  // Generate suggested selectors
  const suggestions = generateSuggestions(tagArray, classArray)

  return {
    tags: tagArray,
    classes: classArray,
    suggestions,
  }
}

/**
 * Generate a curated list of suggestions for common Markdown elements
 * @param {string[]} tags - All tag names found
 * @param {string[]} classes - All classes found
 * @returns {string[]} Suggested selectors
 */
function generateSuggestions(tags, classes) {
  const suggestions = [
    '.pwt-markdown-preview', // Root wrapper
  ]

  // Add common heading selectors
  ;['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
    if (tags.includes(tag)) {
      suggestions.push(`.pwt-markdown-preview ${tag}`)
    }
  })

  // Add other common Markdown elements
  const commonTags = ['p', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'a', 'table']
  commonTags.forEach(tag => {
    if (tags.includes(tag)) {
      suggestions.push(`.pwt-markdown-preview ${tag}`)
    }
  })

  // Add specific class selectors
  classes.forEach(className => {
    // Language classes are useful (e.g., .language-bash)
    if (className.startsWith('language-')) {
      suggestions.push(`.pwt-markdown-preview .${className}`)
    }
  })

  return suggestions
}

/**
 * Scan HTML string (fallback when DOM access isn't available)
 * Uses regex-based deterministic parsing instead of DOM manipulation
 * @param {string} htmlString - The rendered HTML as a string
 * @returns {Object} { tags: string[], classes: string[], suggestions: string[] }
 */
export function scanSelectorsFromHTML(htmlString) {
  if (!htmlString || typeof htmlString !== 'string') {
    return { tags: [], classes: [], suggestions: [] }
  }

  const tags = new Set()
  const classes = new Set()

  // Match all opening tags: <tag ... or <tag>
  const tagRegex = /<(\w+)[\s>]/gi
  let match
  while ((match = tagRegex.exec(htmlString)) !== null) {
    const tagName = match[1].toLowerCase()
    if (!['script', 'style', 'noscript'].includes(tagName)) {
      tags.add(tagName)
    }
  }

  // Match all class attributes: class="..." or class='...'
  const classRegex = /class=["']([^"']+)["']/gi
  while ((match = classRegex.exec(htmlString)) !== null) {
    const classList = match[1].split(/\s+/)
    classList.forEach(className => {
      if (
        className &&
        !className.includes('__') && // Skip CSS Module classes
        className !== 'pwt-markdown-preview'
      ) {
        classes.add(className)
      }
    })
  }

  const tagArray = Array.from(tags).sort()
  const classArray = Array.from(classes).sort()
  const suggestions = generateSuggestions(tagArray, classArray)

  return {
    tags: tagArray,
    classes: classArray,
    suggestions,
  }
}
