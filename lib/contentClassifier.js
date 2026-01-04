/**
 * Shared Markdown/HTML classification helpers
 * Determines whether an input is pure Markdown, pure HTML, or mixed authoring content.
 */

const ContentMode = {
  MARKDOWN: 'markdown',
  HTML: 'html',
  MIXED: 'mixed',
}

const HTML_TAG_REGEX = /<\/?([a-zA-Z][\w:-]*)(?:\s[^<>]*?)?>/g
const HTML_COMMENT_REGEX = /<!--[\s\S]*?-->/
const DOCTYPE_REGEX = /<!doctype\s+html>/i
const CODE_FENCE_REGEX = /```[\s\S]*?```/g
const TILDE_FENCE_REGEX = /~~~[\s\S]*?~~~/g
const INLINE_CODE_REGEX = /`[^`]*`/g

const VOID_HTML_TAGS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
  'meta', 'param', 'source', 'track', 'wbr'
])

const KNOWN_HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'footer', 'form',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd', 'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'meta', 'meter',
  'nav', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'picture', 'pre', 'progress',
  'q',
  'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video', 'wbr'
])

const MARKDOWN_SIGNATURES = [
  /(^|\n)#{1,6}\s+\S+/,                  // ATX headings
  /(^|\n)[^\n]+\n={2,}\s*(\n|$)/,       // Setext H1
  /(^|\n)[^\n]+\n-{2,}\s*(\n|$)/,       // Setext H2
  /(^|\n)([*+-])\s+\S+/,                 // Bullet list
  /(^|\n)\d+\.\s+\S+/,                 // Ordered list
  /(^|\n)>+\s+\S+/,                      // Blockquote
  /`{3,}/,                                 // Fenced code
  /~{3,}/,                                 // Tilde fence
  /\*\*[^*]+\*\*/,                       // Bold
  /__[^^_]+__/,                            // Bold underscore
  /~~[^~]+~~/,                             // Strikethrough
  /(^|\n)\|.+\|\n\|[-:|\s]+\|/,         // Tables
  /!\[[^\]]*\]\([^\)]+\)/,             // Images
  /\[[^\]]+\]\([^\)]+\)/,             // Links
  /__[^_]+__/,                             // Bold (underscore)
]

function stripCodeBlocks(value) {
  return value
    .replace(CODE_FENCE_REGEX, ' ')
    .replace(TILDE_FENCE_REGEX, ' ')
}

function stripInlineCode(value) {
  return value.replace(INLINE_CODE_REGEX, ' ')
}

function hasMatchingClosingTag(lowerText, lowerTag, startIndex) {
  if (!lowerTag) return false
  return lowerText.indexOf(`</${lowerTag}`, startIndex) !== -1
}

function detectHtml(text) {
  if (!text) return false
  if (DOCTYPE_REGEX.test(text) || HTML_COMMENT_REGEX.test(text)) {
    return true
  }

  const sanitized = stripInlineCode(stripCodeBlocks(text))
  const lowerSanitized = sanitized.toLowerCase()
  HTML_TAG_REGEX.lastIndex = 0
  let match
  while ((match = HTML_TAG_REGEX.exec(sanitized))) {
    const [raw, tagName] = match
    if (!tagName) continue

    const lowerTag = tagName.toLowerCase()
    const hasAttributes = /\s+[a-zA-Z_:][\w:.-]*=/.test(raw)
    const isClosing = raw.startsWith('</')
    const isSelfClosing = raw.endsWith('/>')
    const isCustomElement = lowerTag.includes('-')
    const isCapitalized = /^[A-Z]/.test(tagName)
    const isVoid = VOID_HTML_TAGS.has(lowerTag)

    if (isClosing || isSelfClosing || hasAttributes || isCustomElement || isCapitalized || isVoid) {
      return true
    }

    if (KNOWN_HTML_TAGS.has(lowerTag)) {
      const remainderIndex = match.index + raw.length
      if (hasMatchingClosingTag(lowerSanitized, lowerTag, remainderIndex)) {
        return true
      }
    }
  }
  return false
}

function detectMarkdown(text) {
  if (!text) return false
  return MARKDOWN_SIGNATURES.some(pattern => pattern.test(text))
}

function classifyMarkdownHtmlInput(input) {
  const text = (input || '').trim()
  if (!text) {
    return {
      mode: ContentMode.MARKDOWN,
      hasHtml: false,
      hasMarkdown: false,
    }
  }

  const hasHtml = detectHtml(text)
  const hasMarkdown = detectMarkdown(text)

  let mode = ContentMode.MARKDOWN
  if (hasHtml && hasMarkdown) {
    mode = ContentMode.MIXED
  } else if (hasHtml) {
    mode = ContentMode.HTML
  } else {
    mode = ContentMode.MARKDOWN
  }

  return {
    mode,
    hasHtml,
    hasMarkdown,
  }
}

module.exports = {
  classifyMarkdownHtmlInput,
  ContentMode,
}
