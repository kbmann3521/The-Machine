/**
 * Hard Detection Layer
 *
 * Detects input types using regex patterns and heuristics.
 * Catches 80-90% of cases instantly without LLM.
 *
 * Uses detection matrix instead of early returns for better arbitration.
 */

import { looksLikeNumberWithUnit } from './unitDetection'

// Regular expressions for all structured and numeric input types
export const patterns = {
  // Priority 1: Highly unique formats
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  url: /^(https?:\/\/|ftp:\/\/|www\.)[^\s]+$/i,

  // IPv4: standard notation
  ipv4: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,

  // IPv6: various formats (condensed, full, loopback ::1, link-local fe80::, etc.)
  ipv6: /^(([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}|::1|::ffff:[0-9.]+)$/i,

  // IPv4 CIDR notation (e.g., 192.168.0.0/24)
  ipv4_cidr: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\/([0-9]|[1-2][0-9]|3[0-2])$/,

  // IPv6 CIDR notation (e.g., 2001:db8::/32)
  ipv6_cidr: /^(([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}|::)\/([0-9]|[1-9][0-9]|1[0-2][0-9])$/i,

  // IP range with "to" (e.g., 192.168.1.1 to 192.168.1.10)
  ip_range_to: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s+to\s+(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/i,

  // IP range with dash (e.g., 10.0.0.1 - 10.0.0.255)
  ip_range_dash: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\s*-\s*(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,

  // Hostname/domain name (e.g., example.com, google.com, github.com)
  hostname: /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,

  // Legacy combined IP pattern for backward compatibility
  ip: /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$|^(([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}|::1|::ffff:[0-9.]+)$/i,

  uuid: /^urn:uuid:/i,

  uuid_standard: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,

  uuid_no_hyphens: /^[0-9a-f]{32}$/i,

  uuid_like: /^[0-9a-f]{8}-[0-9a-f\w]{4}-[0-9a-f\w]{4}-[0-9a-f\w]{4}-[0-9a-f\w]{12}$/i,

  uuid_with_invalid_chars: /^[0-9a-f\w]{8}-[0-9a-f\w]{4}-[0-9a-f\w]{4}-[0-9a-f\w]{4}-[0-9a-f\w]{12}$/i,

  uuid_repeated_hex: /^[0-9a-f]{32,64}$/i,

  uuid_partial: /^[0-9a-f]{8}-[0-9a-f]{4}(?:-[0-9a-f]{4})?(?:-[0-9a-f]{4})?$/i,

  jwt: /^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*$/,

  base64_image: /^data:image\/[a-z]+;base64,/i,

  hex_color:
    /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)$/,

  cron:
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,

  http_status_code:
    /^(100|101|102|200|201|202|203|204|205|206|300|301|302|303|304|305|307|308|400|401|402|403|404|405|406|408|409|410|411|412|413|414|415|416|417|418|422|429|500|501|502|503|504|505|506|507|508|510|511)$/,

  http_status_description: /(payload too large|unauthorized|not found|forbidden|server error|bad request|rate limit|timeout|gateway|internal server error|service unavailable)/i,

  http_status_log: /→|[\s:](200|201|204|301|302|304|400|401|403|404|500|502|503)(?:\s|$)/i,

  http_status_bulk: /^[\s\d,]+$/,  // Comma/space separated codes like "200, 201, 404"

  mime: /^[a-z]+\/[a-z0-9+.-]+(?:\s*;\s*charset=.+)?$/i,

  url_encoded: /%[0-9A-Fa-f]{2}/,

  // Structured markup & data formats (check SVG before XML/HTML)
  svg: /^\s*<svg/i,
  xml: /^\s*(<\?xml|<[a-z_][a-z0-9_-]*[\s\/>])/i,

  html:
    /^\s*<(?!svg|xml)(?:!DOCTYPE|(?:html|head|body|div|p|span|a|button|form|input|table|tr|td|th|img|h[1-6]|ul|ol|li|nav|header|footer|section|article)[^a-z])/i,

  json: /^\s*({|\[)/,

  // YAML: top-level keys, nested keys, or list items
  yaml:
    /^([a-zA-Z0-9_-]+\s*:\s*.+|[a-zA-Z0-9_-]+\s*:\s*$|\s{2,}[a-zA-Z0-9_-]+\s*:\s*.+|-\s+[a-zA-Z0-9_-]+)/m,

  markdown:
    /(#{1,6}\s|^[-*]\s|^\d+\.\s|\[.+\]\(.+\)|\*\*|__|\*[^*\s]|\w\*[^*]|_[^_\s]|\w_[^_]|`{1,3}[^`]+`{1,3}|^\|.*\|)/m,

  csv: /[^,\n]+,[^,\n]+/,

  css: /^[\s]*[.#]?[a-z0-9-]+\s*{[\s\S]*}|^[\s]*[a-z-]+\s*:\s*[^;]+;/im,

  sql: /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|TRUNCATE|WITH|MERGE|CALL)\s/i,

  http_header: /^[a-z0-9-]+:\s*.+$/im,

  http_response: /^HTTP\/\d+(\.\d+)?\s+\d{3}/i,

  http_headers_multi: /^[A-Za-z0-9-]+:\s*.+\n[A-Za-z0-9-]+:\s*.+/,

  // Code formats – expanded JS detection
  js: /(^\s*(function|const|let|var|async|import|export|class|return|if|else|for|while|do|switch|try|catch)\b)|(\bconsole\.\w+)|(\w+\s*\.\s*\w+\s*\()|(\w+\s*=>\s*[{(])|(\bfunction\s*\()|({[\s\S]{10,}[\s\S]*})/m,

  regex: /^[\^$.*+?{}()[\]\\|]/,

  // HTML entities (must come after HTML/XML/SVG checks)
  html_entities: /&(?:[a-z0-9]+|#[0-9]{1,7}|#x[0-9a-f]{1,6});/i,

  // Numeric and symbolic formats (be restrictive)
  binary: /^[01]+$/,

  hex_number:
    /^0x[0-9a-fA-F]+$|^[0-9a-fA-F]*[a-fA-F]+[0-9a-fA-F]*$/,

  octal: /^0[0-7]+$/,

  // Base64 (long string of valid base64 characters)
  base64: /^[A-Za-z0-9+/]*={0,2}$/,

  // Time formats
  time_24h: /^([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?$/,

  time_12h:
    /^(0?[1-9]|1[0-2]):[0-5][0-9](?::[0-5][0-9])?\s?(AM|PM|am|pm)$/i,

  timestamp_iso:
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?$/,

  timestamp_unix: /^\d{10}(?:\d{3})?$/,

  // Date + Time + Timezone (e.g., "2024-01-15 1pm PST", "Jan 15, 2024 1:30pm UTC")
  date_time_tz: /^(.+?)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)\s*([a-z]{2,4})$|^(.+?)\s+(\d{1,2}):(\d{2})\s+([a-z]{2,4})$/i,

  // Time + Timezone only (e.g., "1pm PST", "13:45 UTC", "2:30 pm EST")
  time_tz: /^(\d{1,2})(?::(\d{2}))?\s*(am|pm|AM|PM)\s*([a-z]{2,4})$|^(\d{1,2}):(\d{2})\s+([a-z]{2,4})$/i,

  // Date + Time without timezone (e.g., "2024-01-15 14:30", "2024-01-15 14:30:00")
  date_time: /^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}(?::\d{2})?$|^\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?$|^\d{2}\.\d{2}\.\d{4}\s+\d{1,2}:\d{2}(?::\d{2})?$/,

  date:
    /^\d{4}-\d{2}-\d{2}$|^\d{4}\/\d{2}\/\d{2}$|^\d{4}\.\d{2}\.\d{2}$|^\d{2}-\d{2}-\d{4}$|^\d{2}\/\d{2}\/\d{4}$|^\d{2}\.\d{2}\.\d{4}$|^\d{2}-\d{2}-\d{2}$|\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{1,2},?\s\d{4}/i,

  // File sizes and units
  file_size:
    /^\d+(?:\.\d+)?\s*(B|KB|MB|GB|TB|KIB|MIB|GIB|TIB)$/i,

  // Math expression (we'll use a separate, stricter heuristic)
  math_expression: /^[\d+\-*/()\s.^]+$/,

  // Path-like formats
  filepath: /^(?:\/|[A-Za-z]:\\|\.\/|\.\.\/)[^\s<>"|?*]+$/,
  jsonpath: /^\$(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[[^\]]+\])+$/,

  // File extension (we'll whitelist in logic)
  file_extension: /^\s*([a-z0-9]{1,10})\s*$/i,
}

/**
 * Detects if text is likely a Caesar cipher by trying shifts 1-25
 * and checking if any shift produces English words
 */
function detectCaesar(str) {
  const isLetters = /^[A-Za-z\s]+$/.test(str)
  if (!isLetters) return false

  const words = str.split(/\s+/)

  // Only check short-ish inputs to avoid false positives
  if (str.length < 4 || words.length > 10) return false

  // Mini English word list
  const englishWords = new Set([
    'the',
    'hello',
    'world',
    'and',
    'for',
    'you',
    'this',
    'that',
    'is',
    'a',
    'to',
    'in',
    'of',
    'on',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'it',
    'me',
    'he',
    'she',
    'we',
    'they',
    'are',
    'was',
    'were',
    'can',
    'could',
    'would',
    'should',
    'will',
    'may',
    'but',
    'or',
    'as',
    'if',
    'my',
    'by',
    'from',
    'up',
    'with',
    'about',
    'out',
    'just',
    'now',
    'how',
    'which',
    'who',
    'what',
    'where',
    'when',
    'why',
    'all',
    'each',
    'every',
    'both',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'not',
    'only',
    'own',
    'so',
    'than',
    'very',
    'can',
    'just',
    'should',
    'now',
    'our',
    'before',
    'after',
    'through',
    'during',
    'including',
    'without',
    'been',
    'being',
    'get',
    'got',
    'make',
    'made',
    'see',
    'saw',
    'come',
    'came',
    'go',
    'went',
    'know',
    'knew',
    'take',
    'took',
    'think',
    'thought',
    'say',
    'said',
    'tell',
    'told',
    'give',
    'gave',
    'find',
    'found',
    'use',
    'used',
  ])

  // Try all 25 shifts (1-25, SKIP 13 which is ROT13)
  for (let shift = 1; shift < 26; shift++) {
    if (shift === 13) continue // Skip ROT13 - handled separately

    let decoded = ''
    for (let char of str) {
      if (/[A-Za-z]/.test(char)) {
        const base = char === char.toUpperCase() ? 65 : 97
        const code = ((char.charCodeAt(0) - base - shift + 26) % 26) + base
        decoded += String.fromCharCode(code)
      } else {
        decoded += char
      }
    }

    // Count English matches
    const decodedWords = decoded
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 0)

    const matches = decodedWords.filter(w => englishWords.has(w)).length

    // Require at least 2 English word matches or 50% of words to be English words
    // This prevents false positives like "to" → "up" from casual English text
    const matchRatio = decodedWords.length > 0 ? matches / decodedWords.length : 0
    if (matches >= 2 || matchRatio >= 0.5) {
      return true
    }
  }

  return false
}

/**
 * Detects if text is ROT13 encoded
 * ROT13 is Caesar cipher with shift 13
 */
function detectRot13(str) {
  const isLetters = /^[A-Za-z\s]+$/.test(str)
  if (!isLetters) return false

  const words = str.split(/\s+/)

  // Only check short-ish inputs
  if (str.length < 4 || words.length > 10) return false

  const englishWords = new Set([
    'the',
    'hello',
    'world',
    'and',
    'for',
    'you',
    'this',
    'that',
    'is',
    'a',
    'to',
    'in',
    'of',
    'on',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'it',
    'me',
    'he',
    'she',
    'we',
    'they',
    'are',
    'was',
    'were',
    'can',
    'could',
    'would',
    'should',
    'will',
    'may',
    'but',
    'or',
    'as',
    'if',
    'my',
    'by',
    'from',
    'up',
    'with',
    'about',
    'out',
    'just',
    'now',
    'how',
    'which',
    'who',
    'what',
    'where',
    'when',
    'why',
    'all',
    'each',
    'every',
    'both',
    'few',
    'more',
    'most',
    'other',
    'some',
    'such',
    'no',
    'nor',
    'not',
    'only',
    'own',
    'so',
    'than',
    'very',
    'our',
    'before',
    'after',
    'through',
    'during',
    'including',
    'without',
    'been',
    'being',
    'get',
    'got',
    'make',
    'made',
    'see',
    'saw',
    'come',
    'came',
    'go',
    'went',
    'know',
    'knew',
    'take',
    'took',
    'think',
    'thought',
    'say',
    'said',
    'tell',
    'told',
    'give',
    'gave',
    'find',
    'found',
    'use',
    'used',
  ])

  // ROT13 is shift 13
  const shift = 13
  let decoded = ''
  for (let char of str) {
    if (/[A-Za-z]/.test(char)) {
      const base = char === char.toUpperCase() ? 65 : 97
      const code = ((char.charCodeAt(0) - base - shift + 26) % 26) + base
      decoded += String.fromCharCode(code)
    } else {
      decoded += char
    }
  }

  const decodedWords = decoded
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 0)

  const matches = decodedWords.filter(w => englishWords.has(w)).length

  // Require at least 2 English word matches or 50% of words to be English words
  // This prevents false positives from casual English text
  const matchRatio = decodedWords.length > 0 ? matches / decodedWords.length : 0
  return matches >= 2 || matchRatio >= 0.5
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
    /\b(function|const|let|var|class|return|if|else|for|while)\b/.test(
      trimmed
    ) ||
    /^<\w+[\s>]/.test(trimmed) ||
    /^[\[\{].*[\]\}]$/.test(trimmed)

  if (!hasLetters || !hasWord) return false
  if (looksNumeric || looksSymbolicOnly) return false
  if (looksLikeCodeOrMarkup) return false

  return true
}

/**
 * Detects if text contains significant Unicode characters (emojis, non-ASCII symbols)
 * that would be useful for the ascii-unicode-converter tool
 */
export function isUnicodeText(input) {
  const trimmed = input.trim()
  if (!trimmed) return false

  // Check for non-ASCII characters (emoji, accented letters, symbols from other scripts)
  // This regex matches any character outside the ASCII range (0x00-0x7F)
  const nonAsciiPattern = /[^\x00-\x7F]/

  return nonAsciiPattern.test(trimmed)
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

  // ============ PRIORITY 1: Highly structured formats ============

  if (patterns.email.test(trimmed)) {
    add('email', 0.99, 'Email address format detected')
  }

  if (patterns.url.test(trimmed)) {
    add('url', 0.97, 'URL format detected')
  }

  if (patterns.ip.test(trimmed)) {
    add('ip', 0.97, 'IPv4 or IPv6 address detected')
  }

  // UUID detection - multiple patterns for various formats
  if (patterns.uuid.test(trimmed)) {
    add('uuid', 0.98, 'URN UUID format detected')
  }

  if (patterns.uuid_standard.test(trimmed)) {
    add('uuid', 0.99, 'Standard UUID format detected')
  }

  if (patterns.uuid_no_hyphens.test(trimmed)) {
    add('uuid', 0.99, 'Hex UUID format (no hyphens) detected')
  }

  if (patterns.uuid_repeated_hex.test(trimmed)) {
    add('uuid', 0.94, 'Long hex string (possibly repeated UUID) detected')
  }

  if (patterns.uuid_like.test(trimmed)) {
    add('uuid', 0.93, 'UUID-like format detected (may be invalid)')
  }

  if (patterns.uuid_with_invalid_chars.test(trimmed)) {
    add('uuid', 0.91, 'UUID-like with possible invalid characters detected')
  }

  if (patterns.uuid_partial.test(trimmed)) {
    add('uuid', 0.89, 'Partial/truncated UUID format detected')
  }

  if (patterns.jwt.test(trimmed)) {
    add('jwt', 0.99, 'JWT token detected')
  }

  if (patterns.base64_image.test(trimmed)) {
    add('base64_image', 0.99, 'Base64-encoded image detected')
  }

  if (patterns.hex_color.test(trimmed)) {
    add('hex_color', 0.97, 'Hex color or RGBA color detected')
  }

  if (patterns.mime.test(trimmed)) {
    add('mime', 0.97, 'MIME type detected')
  }

  // File extension → file_type (for MIME Type Lookup)
  if (patterns.file_extension.test(trimmed)) {
    const ext = trimmed.toLowerCase()
    const COMMON_EXTS = new Set([
      'pdf',
      'png',
      'jpg',
      'jpeg',
      'gif',
      'svg',
      'webp',
      'txt',
      'csv',
      'json',
      'xml',
      'html',
      'htm',
      'js',
      'ts',
      'css',
      'scss',
      'less',
      'zip',
      'rar',
      '7z',
      'tar',
      'gz',
      'mp3',
      'wav',
      'flac',
      'mp4',
      'mov',
      'avi',
      'mkv',
      'webm',
      'ttf',
      'otf',
      'woff',
      'woff2',
      'doc',
      'docx',
      'xls',
      'xlsx',
      'ppt',
      'pptx',
    ])
    if (COMMON_EXTS.has(ext)) {
      add('file_type', 0.93, 'File extension detected')
    }
  }

  // Markup formats
  if (patterns.svg?.test(trimmed)) {
    add('svg', 0.97, 'SVG markup detected')
  }

  if (patterns.xml.test(trimmed)) {
    add('xml', 0.97, 'XML markup detected')
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

  if (patterns.yaml.test(trimmed)) {
    add('yaml', 0.96, 'YAML format detected')
  }

  // CSV detection - but exclude SQL queries that have commas
  if (!patterns.sql.test(trimmed)) {
    const lines = trimmed.split('\n').filter(l => l.trim())

    // Check for multi-line CSV: multiple lines with consistent commas
    if (lines.length > 1) {
      const commaCounts = lines.map(l => (l.match(/,/g) || []).length)
      const avgCommas = commaCounts.reduce((a, b) => a + b, 0) / commaCounts.length
      const consistentCommas = commaCounts.every(c => Math.abs(c - avgCommas) <= 2)

      if (consistentCommas && avgCommas >= 1) {
        add('csv', 0.95, 'Multi-line CSV format detected')
      }
    } else if (patterns.csv.test(trimmed)) {
      // Single line with comma
      add('csv', 0.92, 'CSV format detected')
    }
  }

  if (patterns.markdown.test(trimmed)) {
    add('markdown', 0.90, 'Markdown syntax detected')
  }

  if (patterns.css.test(trimmed)) {
    add('css', 0.93, 'CSS style or declaration detected')
  }

  // SQL detection - prioritized over CSV due to higher confidence
  if (patterns.sql.test(trimmed)) {
    add('sql', 0.96, 'SQL statement detected')
  }

  // HTTP response status line (HTTP/1.1 200 OK, etc.)
  if (patterns.http_response.test(trimmed)) {
    add('http_header', 0.98, 'HTTP response with status line detected')
  }

  // Multiple HTTP headers (multi-line with colon-separated key-value pairs)
  if (patterns.http_headers_multi.test(trimmed)) {
    add('http_header', 0.97, 'HTTP headers format detected')
  }

  if (patterns.http_header.test(trimmed)) {
    add('http_header', 0.85, 'HTTP header field detected')
  }

  if (patterns.regex.test(trimmed)) {
    add('regex', 0.95, 'Regex-like pattern detected')
  }

  // HTML entities detection: only classify as html_entities if NO actual HTML tags present
  // HTML entities detection: RULE 3 - DO NOT classify if HTML/Markdown structure exists
  // Only classify as html_entities if:
  // - Entities exist AND
  // - NO HTML tags present AND
  // - NO Markdown formatting present
  if (patterns.html_entities.test(trimmed)) {
    // Check if there are actual HTML tags (opening tags, closing tags, doctype, comments, etc.)
    // Match: <div>, </div>, <!DOCTYPE>, <!--, <svg, <?xml, etc.
    const hasHtmlTags = /<[!/a-z]/i.test(trimmed)

    // Check if there's Markdown structure (headings, lists, formatting)
    const hasMarkdown = patterns.markdown.test(trimmed)

    // Only classify as html_entities if NO HTML tags and NO Markdown structure
    if (!hasHtmlTags && !hasMarkdown) {
      // Pure entity-encoded text with no markup structure
      add('html_entities', 0.93, 'HTML entities detected')
    }
  }

  if (patterns.url_encoded.test(trimmed)) {
    add('url_encoded', 0.94, 'URL-encoded text detected')
  }

  if (patterns.cron.test(trimmed)) {
    add('cron', 0.96, 'Cron expression detected')
  }

  if (patterns.jsonpath.test(trimmed)) {
    add('jsonpath', 0.92, 'JSONPath expression detected')
  }

  if (patterns.filepath.test(trimmed)) {
    add('filepath', 0.90, 'File path-like input detected')
  }

  if (patterns.js.test(trimmed)) {
    add('js', 0.96, 'JavaScript-like code detected')
  }

  // ============ TIME / DATE / TIMESTAMP ============

  // Date + Time + Timezone (highest priority for time-normalizer)
  if (patterns.date_time_tz?.test(trimmed)) {
    add('timestamp', 0.98, 'Date + Time + Timezone format detected')
  }

  // Time + Timezone only
  if (patterns.time_tz?.test(trimmed)) {
    add('timestamp', 0.97, 'Time + Timezone format detected')
  }

  // Date + Time without timezone
  if (patterns.date_time?.test(trimmed)) {
    add('timestamp', 0.95, 'Date + Time format detected')
  }

  if (patterns.time_12h?.test(trimmed)) {
    add('time_12h', 0.96, '12-hour time format detected')
  }

  if (patterns.time_24h?.test(trimmed)) {
    add('time_24h', 0.96, '24-hour time format detected')
  }

  if (patterns.timestamp_iso.test(trimmed)) {
    add('timestamp', 0.96, 'ISO-8601 timestamp detected')
  }

  if (patterns.timestamp_unix.test(trimmed)) {
    add('timestamp', 0.96, 'Unix timestamp detected')
  }

  if (patterns.date.test(trimmed)) {
    add('date', 0.94, 'Date format detected')
  }

  // ============ FILE SIZE / UNITS ============

  if (patterns.file_size?.test(trimmed)) {
    add('file_size', 0.95, 'File size format detected')
  }

  // Unit detection using strict matcher – after binary/hex, before plain integer
  if (looksLikeNumberWithUnit(trimmed)) {
    add(
      'unit_value',
      0.98,
      'Value with unit detected (strict pattern)'
    )
  }

  // ============ NUMERIC / BASE-LIKE ============

  if (patterns.binary?.test(trimmed) && trimmed.length >= 8) {
    add('binary', 0.97, 'Binary number detected')
  }

  if (patterns.hex_number?.test(trimmed)) {
    add('hex_number', 0.92, 'Hexadecimal number detected')
  }

  if (patterns.octal?.test(trimmed)) {
    add('octal_number', 0.90, 'Octal number detected')
  }

  // Base64 – only for sufficiently long strings to avoid collisions
  if (
    trimmed.length > 20 &&
    patterns.base64.test(trimmed) &&
    /^[A-Za-z0-9+/=]+$/.test(trimmed)
  ) {
    add('base64', 0.92, 'Base64 string detected')
  }

  // HTTP status code – must beat plain integer
  if (patterns.http_status_code.test(trimmed)) {
    add(
      'http_status_code',
      0.99,
      'HTTP status code detected'
    )
  }

  // HTTP status logs (with arrows or timestamps)
  if (patterns.http_status_log.test(trimmed)) {
    add('http_status_code', 0.96, 'HTTP status code in log entry detected')
  }

  // HTTP status descriptions (like "payload too large", "unauthorized", etc.)
  if (patterns.http_status_description.test(trimmed)) {
    add('http_status_code', 0.94, 'HTTP status description detected')
  }

  // Bulk HTTP status codes (comma or space separated like "200, 201, 404" or "400 401 403")
  if (patterns.http_status_bulk.test(trimmed)) {
    const codePattern = /(100|101|102|200|201|202|203|204|205|206|300|301|302|303|304|305|307|308|400|401|402|403|404|405|406|408|409|410|411|412|413|414|415|416|417|418|422|429|500|501|502|503|504|505|506|507|508|510|511)/g
    const matches = trimmed.match(codePattern)
    if (matches && matches.length >= 2) {
      add('http_status_code', 0.95, 'Bulk HTTP status codes detected')
    }
  }

  // Multi-line numbers (for number-formatter bulk input)
  const lines = trimmed.split('\n').filter(l => l.trim())
  if (lines.length > 1 && lines.every(l => /^-?\d+\.?\d*$/.test(l.trim()))) {
    add('float', 0.95, 'Multi-line numeric list detected')
  }

  // Numeric formats (integer / float)
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    add('float', 0.90, 'Floating-point numeric value')
  } else if (/^-?\d+\.?\d*$/.test(trimmed)) {
    add('integer', 0.90, 'Integer-like numeric value')

    // Potential IP integer (32-bit unsigned range)
    const n = Number(trimmed)
    if (Number.isFinite(n) && n >= 0 && n <= 4294967295) {
      add(
        'potential_ip_integer',
        0.93,
        'Integer in IPv4 32-bit range'
      )
    }

    // Unix timestamp-like (10 or 13 digits)
    if (
      (trimmed.length === 10 || trimmed.length === 13) &&
      patterns.timestamp_unix.test(trimmed)
    ) {
      add('timestamp', 0.96, 'Unix timestamp detected')
    }
  }

  // Math expression – only digits, spaces, operators, parentheses, ^, and must contain an operator
  const mathLike =
    /^[\d+\-*/().\s^]+$/.test(trimmed) &&
    /[+\-*/^]/.test(trimmed) &&
    !/[a-zA-Z]/.test(trimmed)

  if (mathLike) {
    add('math_expression', 0.93, 'Math expression detected')
  }

  // ============ CIPHER DETECTION (before plain text) ============
  // IMPORTANT: Check ROT13 FIRST because it's shift-13 (a Caesar subset)
  // If ROT13 matches, we mark it as rot13_encoded with higher priority
  // Then check Caesar for OTHER shifts (1-12, 14-25)

  if (detectRot13(trimmed)) {
    add('rot13_encoded', 0.99, 'ROT13 encoded text detected')
  } else if (detectCaesar(trimmed)) {
    // Only flag as Caesar if ROT13 didn't match
    add('caesar_encoded', 0.97, 'Caesar cipher (non-ROT13) detected')
  }

  // ============ UNICODE / EMOJI DETECTION ============

  if (isUnicodeText(trimmed)) {
    add('unicode_text', 0.95, 'Unicode characters or emoji detected')
  }

  // ============ PLAIN TEXT / FALLBACK ============

  if (isLikelyPlainText(trimmed)) {
    add('plain_text', 0.88, 'Plain English text detected')
  }

  // If nothing matched strongly, return null
  if (!candidates.length) return null

  // Post-processing: boost SQL confidence if multiple SQL keywords detected
  const sqlKeywordMatches = (trimmed.match(/(SELECT|FROM|WHERE|JOIN|GROUP|ORDER|LIMIT|INSERT|UPDATE|DELETE|CREATE|ON|AND|OR|UNION)/gi) || []).length

  // Check for JavaScript patterns: function declarations, var/const/let, console, arrow functions, etc.
  const jsKeywordMatches = (trimmed.match(/(^|\s)(function|const|let|var|async|import|export|class|return|if|else|for|while|do|switch|case|break|continue|try|catch|throw|new|typeof|instanceof)\b/gi) || []).length
  const jsPatterns = (trimmed.match(/(console\.\w+|=>|function\s*\(|obj\.|this\.|\.prototype|\/\/|\/\*|\*\/)/gi) || []).length
  const hasObjectBraces = /\{\s*\w+\s*:\s*(?:"[^"]*"|'[^']*'|function|\{)/i.test(trimmed) // JS object pattern

  for (const c of candidates) {
    if (c.type === 'sql' && sqlKeywordMatches >= 2) {
      c.confidence = 0.98  // Boost high for multi-keyword SQL
      c.reason = 'SQL statement with multiple keywords detected'
    }

    // Boost JS confidence if clear JavaScript keywords are present
    if (c.type === 'js') {
      let boost = 0
      if (jsKeywordMatches >= 2) {
        boost = 0.05  // Boost if multiple JS keywords found
        c.reason += ' (boosted: multiple JS keywords detected)'
      }
      if (hasObjectBraces) {
        boost += 0.03  // Additional boost for JS object syntax
        c.reason += ' (boosted: JavaScript object syntax detected)'
      }
      if (jsPatterns >= 2) {
        boost += 0.02  // Additional boost for JS patterns (console, =>)
        c.reason += ' (boosted: JavaScript patterns detected)'
      }
      c.confidence = Math.min(0.99, c.confidence + boost)
    }

    // Penalize YAML if JavaScript keywords/patterns are detected
    if (c.type === 'yaml') {
      if (jsKeywordMatches >= 1) {
        c.confidence -= 0.25
        c.reason += ' (penalized: JavaScript keywords detected)'
      }
      if (hasObjectBraces) {
        c.confidence -= 0.15
        c.reason += ' (penalized: JavaScript object syntax detected)'
      }
    }

    // Penalize unit_value if text is sentence-like
    if (c.type === 'unit_value') {
      const wordCount = trimmed.split(/\s+/).length
      if (wordCount > 3) {
        c.confidence -= 0.25
        c.reason += ' (penalized for multi-word sentence)'
      }
    }

    // Penalize CSV if SQL keywords detected
    if (c.type === 'csv' && /^(SELECT|FROM|WHERE|JOIN|GROUP|ORDER|LIMIT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(trimmed)) {
      c.confidence -= 0.15
      c.reason += ' (penalized - SQL keywords detected)'
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
  isUnicodeText,
  patterns,
}
