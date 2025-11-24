/**
 * Hard Detection Layer
 *
 * Detects input types using regex patterns and heuristics.
 * Catches 80-90% of cases instantly without LLM.
 *
 * Uses detection matrix instead of early returns for better arbitration
 */

import { looksLikeNumberWithUnit } from './unitDetection'

// Regular expressions for all structured and numeric input types
const patterns = {
  // Priority 1: Highly unique formats
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  url: /^(https?:\/\/|www\.)[^\s]+$/i,
  ip: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4})$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  jwt: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,
  base64_image: /^data:image\/[a-z]+;base64,/i,
  hex_color: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/,
  cron: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  http_status_code: /^(100|101|102|200|201|202|203|204|205|206|300|301|302|303|304|305|307|308|400|401|402|403|404|405|406|408|409|410|411|412|413|414|415|416|417|418|422|429|500|501|502|503|504|505|506|507|508|510|511)$/,
  mime: /^[a-z]+\/[a-z0-9+.-]+(?:\s*;\s*charset=.+)?$/i,
  url_encoded: /%[0-9A-Fa-f]{2}/,

  // Structured markup & data formats (check SVG before XML/HTML)
  svg: /^\s*<svg/i,
  xml: /^\s*<\?xml/,
  html: /^\s*<(?!svg|xml)(?:!DOCTYPE|(?:html|head|body|div|p|span|a|button|form|input|table|tr|td|th|img|h[1-6]|ul|ol|li|nav|header|footer|section|article)[^a-z])/i,
  json: /^\s*({|\[)/,
  yaml: /^([a-z_][a-z0-9_-]*\s*:|\-\s|[a-z_][a-z0-9_.]*\s*=)/im,
  flattened_yaml: /^[a-z_][a-z0-9_.]*\s*=\s*(.+)$/im,
  markdown: /(#{1,6}\s|^[-*]\s|^\d+\.\s|\[.+\]\(.+\)|\*\*|__|\*[^*\s]|\w\*[^*]|_[^_\s]|\w_[^_]|`|~~|^\|)/m,
  csv: /^[^,\n]+,[^,\n]+/,
  css: /^[\s]*[.#]?[a-z0-9-]+\s*{[\s\S]*}|^[\s]*[a-z-]+\s*:\s*[^;]+;/im,
  sql: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|WITH)\s/i,
  http_header: /^[a-z0-9-]+:\s*.+$/im,

  // Code formats
  js: /^\s*(function|const|let|var|async|import|export|class)\s|^\s*{\s*[\s\S]*}/m,
  regex: /^[\^$.*+?{}()\[\]\\|]/,

  // HTML entities (must come after HTML/XML/SVG checks)
  html_entities: /&(?:[a-z0-9]+|#[0-9]{1,7}|#x[0-9a-f]{1,6});/i,

  // Numeric and symbolic formats (be restrictive)
  binary: /^[01]+$/,
  hex_number: /^0x[0-9a-fA-F]+$|^[0-9a-fA-F]*[a-fA-F]+[0-9a-fA-F]*$/,
  octal: /^0[0-7]+$/,

  // Base64 (long string of valid base64 characters)
  base64: /^[A-Za-z0-9+/]*={0,2}$/,

  // Time formats
  time_24h: /^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/,
  time_12h: /^(0?[1-9]|1[0-2]):[0-5][0-9](?::[0-5][0-9])?\s?(AM|PM|am|pm)$/i,
  timestamp_iso: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/,
  timestamp_unix: /^\d{10}(?:\d{3})?$/,
  date: /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}/i,

  // File sizes and units
  file_size: /^\d+(?:\.\d+)?\s*(B|KB|MB|GB|TB|KIB|MIB|GIB|TIB)$/i,

  // Math expression
  math_expression: /^[\d+\-*/()\s.^sqrt|sin|cos|tan|log|ln|exp|abs|floor|ceil|min|max]+$/,

  // Path-like formats
  filepath: /^(?:\/|C:\\|\.\/|\.\.\/)[^\s<>"|?*]+$/,
  jsonpath: /^\$(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[[^\]]+\])+$/,
}

export function isLikelyPlainText(input) {
  const trimmed = input.trim()
  if (!trimmed) return false

  const hasLetters = /[a-zA-Z]/.test(trimmed)
  const hasWord = /\b[a-z]{2,}\b/i.test(trimmed)

  const looksNumeric = /^-?[\d.]+$/.test(trimmed)
  const looksSymbolicOnly = /^[\s\W]+$/.test(trimmed)

  // Contains obvious code/markup signals?
  const looksLikeCodeOrMarkup =
    /[{<>};]/.test(trimmed) ||
    /\b(function|const|let|var|class|return|if|else|for|while)\b/.test(trimmed) ||
    /^<\w+[\s>]/.test(trimmed) ||
    /^[\[\{].*[\]\}]$/.test(trimmed)

  if (!hasLetters || !hasWord) return false
  if (looksNumeric || looksSymbolicOnly) return false
  if (looksLikeCodeOrMarkup) return false

  return true
}

/**
 * Detection matrix: returns best candidate + all candidates
 */
export function hardDetectMatrix(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) return null

  const candidates = []

  const add = (type, confidence, reason, extra = {}) => {
    candidates.push({
      type,
      confidence,
      reason,
      source: 'hard',
      ...extra,
    })
  }

  // Priority 1: Highly structured formats
  if (patterns.email.test(trimmed)) {
    add('email', 0.99, 'Email address format detected')
  }

  if (patterns.url.test(trimmed)) {
    add('url', 0.97, 'URL format detected')
  }

  if (patterns.ip.test(trimmed)) {
    add('ip', 0.97, 'IPv4 or IPv6 address detected')
  }

  if (patterns.uuid.test(trimmed)) {
    add('uuid', 0.99, 'UUID/GUID format detected')
  }

  // Markup formats
  if (patterns.svg?.test(trimmed)) {
    add('svg', 0.97, 'SVG markup detected')
  }

  if (patterns.xml.test(trimmed)) {
    add('xml', 0.95, 'XML markup detected')
  }

  if (patterns.html.test(trimmed)) {
    add('html', 0.96, 'HTML markup detected')
  }

  // Structured data
  if (patterns.json.test(trimmed)) {
    try {
      JSON.parse(trimmed)
      add('json', 0.99, 'Valid JSON detected')
    } catch {
      add('json', 0.75, 'JSON-like structure detected')
    }
  }

  // Time formats
  if (patterns.time_12h?.test(trimmed)) {
    add('time_12h', 0.96, '12-hour time format detected')
  }

  if (patterns.time_24h?.test(trimmed)) {
    add('time_24h', 0.96, '24-hour time format detected')
  }

  // File sizes and units
  if (patterns.file_size?.test(trimmed)) {
    add('file_size', 0.95, 'File size format detected')
  }

  // Binary / hex / base-like numbers FIRST, before unit detection
  if (patterns.binary?.test(trimmed) && trimmed.length >= 8) {
    add('binary', 0.97, 'Binary number detected')
  }

  if (patterns.hex_number?.test(trimmed)) {
    add('hex_number', 0.92, 'Hexadecimal number detected')
  }

  // Unit detection using strict matcher – after binary/hex, before plain integer
  if (looksLikeNumberWithUnit(trimmed)) {
    add('unit_value', 0.94, 'Value with unit detected (strict pattern)')
  }

  // Numeric formats
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    add('integer', 0.90, 'Integer-like numeric value')
  }

  if (/^-?\d+\.\d+$/.test(trimmed)) {
    add('float', 0.90, 'Floating-point numeric value')
  }

  // Plain text detection
  if (isLikelyPlainText(trimmed)) {
    add('plain_text', 0.88, 'Plain English text detected')
  }

  // If nothing matched strongly, return null
  if (!candidates.length) return null

  // Small post-processing: penalize unit_value if text is sentence-like
  for (const c of candidates) {
    if (c.type === 'unit_value') {
      const wordCount = trimmed.split(/\s+/).length
      if (wordCount > 3) {
        c.confidence -= 0.25
        c.reason += ' (penalized for multi-word sentence)'
      }
    }
  }

  // Pick best by confidence
  candidates.sort((a, b) => b.confidence - a.confidence)
  const best = candidates[0]

  return { best, candidates }
}

/**
 * Backwards-compatible: simplest single-type call
 */
export function hardDetect(input) {
  const result = hardDetectMatrix(input)
  if (!result) return null
  return result.best
}

export default {
  hardDetect,
  hardDetectMatrix,
  isLikelyPlainText,
  patterns,
}
