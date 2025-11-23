/**
 * Hard Detection Layer
 * 
 * Detects input types using regex patterns and heuristics.
 * Catches 80-90% of cases instantly without LLM.
 * 
 * Returns: { type, confidence, reason } or null if no match
 */

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
  xml: /^\s*<\?xml/, // Must start with <?xml declaration
  html: /^\s*<(?!svg|xml)(?:!DOCTYPE|(?:html|head|body|div|p|span|a|button|form|input|table|tr|td|th|img|h[1-6]|ul|ol|li|nav|header|footer|section|article)[^a-z])/i,
  json: /^\s*({|\[)/, // Starts with { or [
  yaml: /^([a-z_][a-z0-9_-]*\s*:|\-\s)/im,
  markdown: /^(#{1,6}\s|[-*]\s|\d+\.\s|\[.+\]\(.+\)|`.+`|\*\*|__|~~)/m,
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
  binary: /^[01]+$/, // Only 0 and 1
  hex_number: /^0x[0-9a-fA-F]+$|^[0-9a-fA-F]*[a-fA-F]+[0-9a-fA-F]*$/, // 0x prefix OR contains A-F
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
  unit_value: /^\d+(?:\.\d+)?\s*(?:[a-z°µ²³\/\-°]+)s?$/i,

  // Math expression
  math_expression: /^[\d+\-*/()\s.^sqrt|sin|cos|tan|log|ln|exp|abs|floor|ceil|min|max]+$/,

  // Path-like formats
  filepath: /^(?:\/|C:\\|\.\/|\.\.\/)[^\s<>"|?*]+$/,
  jsonpath: /^\$(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[[^\]]+\])+$/,
}

/**
 * List of valid units (for validation)
 */
const validUnits = new Set([
  'kg', 'g', 'mg', 'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces', 'ton', 'tonne', 'stone', 'st', 't',
  'm', 'meter', 'metres', 'metre', 'km', 'kilometer', 'cm', 'mm', 'ft', 'feet', 'foot', 'mi', 'mile', 'miles', 'yd', 'yard', 'yards', 'in', 'inch', 'inches', 'µm', 'nm', 'nanometer',
  'c', 'celsius', 'f', 'fahrenheit', 'k', 'kelvin',
  'ms', 'kmh', 'mph', 'knot', 'knots',
  'l', 'liter', 'litre', 'ml', 'gal', 'gallon', 'cup', 'pint', 'fl-oz', 'floz',
  'bar', 'psi', 'pa', 'pascal', 'atm', 'atmosphere', 'torr',
  'j', 'joule', 'joules', 'cal', 'calorie', 'calories', 'btu', 'kj', 'kwh', 'wh', 'erg', 'ergs', 'hp',
  's', 'sec', 'second', 'seconds', 'min', 'minute', 'minutes', 'h', 'hr', 'hour', 'hours', 'day', 'days', 'week', 'weeks', 'month', 'months', 'year', 'years',
  'b', 'byte', 'bytes', 'bit', 'bits', 'kb', 'mb', 'gb', 'tb', 'pb',
  'hectare', 'hectares', 'ha', 'acre', 'acres'
])

function isValidUnit(unitString) {
  const lower = unitString.toLowerCase().replace(/s$/, '') // Remove trailing 's' and lowercase
  return validUnits.has(lower) || validUnits.has(lower + 's')
}

/**
 * Multi-layer markdown intent analysis
 * Determines if input is intentional markdown (for HTML conversion) or messy text (for cleanup)
 *
 * PRIORITY LOGIC:
 * 1. Check if markdown is VALID/WELL-FORMED first (independent of noise)
 * 2. If valid + has markdown features → STRONGLY match with markdown_html
 * 3. If invalid or broken → match with markdown_clean
 * 4. Noise detection used to boost markdown_clean confidence, not as primary gate
 */
function analyzeMarkdownIntent(input) {
  const trimmed = input.trim()
  const lines = trimmed.split('\n')

  // Step 1: Count markdown features
  const features = {
    headings: (trimmed.match(/^#{1,6}\s/m) || []).length > 0,
    lists: (trimmed.match(/^[-*]\s/m) || []).length > 0,
    orderedLists: (trimmed.match(/^\d+\.\s/m) || []).length > 0,
    blockquotes: (trimmed.match(/^>\s/m) || []).length > 0,
    codeFences: (trimmed.match(/```/g) || []).length >= 2,
    inlineCode: (trimmed.match(/`[^`]+`/g) || []).length > 0,
    emphasis: (trimmed.match(/\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_/g) || []).length > 0,
    links: (trimmed.match(/\[[^\]]+\]\([^)]+\)/g) || []).length > 0,
    images: (trimmed.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length > 0,
    tables: (trimmed.match(/\|.*\|/g) || []).length >= 3,
  }

  const featureCount = Object.values(features).filter(Boolean).length

  // Step 2: Check if markdown is VALID/WELL-FORMED (FIRST PRIORITY)
  const isValidMarkdown = checkMarkdownValidity(trimmed, lines, features)

  // Step 3: Check for noise/corruption patterns (used for confidence boosting, not as gate)
  const hasNoisePatterns = detectMarkdownNoise(trimmed)

  // Step 4: Analyze structure consistency and density
  const consistencyScore = checkMarkdownConsistency(trimmed, lines, features)
  const meaningfulHTML = features.headings || features.lists || features.blockquotes || features.links

  // ===== DECISION LOGIC =====
  // Priority 1: Tables and code blocks ALWAYS mean markdown_html (highest intent signal)
  if (features.tables) {
    return { type: 'markdown_html', confidence: 0.95, reason: 'Markdown table detected - intent: convert to HTML' }
  }

  if (features.codeFences) {
    return { type: 'markdown_html', confidence: 0.94, reason: 'Fenced code block detected - intent: convert to HTML' }
  }

  // Priority 2: Structured combinations (headers + lists/quotes) = always conversion
  if (features.headings && (features.lists || features.orderedLists || features.blockquotes)) {
    return { type: 'markdown_html', confidence: 0.93, reason: 'Structured markdown documentation detected - intent: convert to HTML' }
  }

  // Priority 3: VALID MARKDOWN WITH INTENT
  // If markdown is VALID (well-formed, intentional), match strongly with markdown_html
  // This is the key insight: valid markdown means the user INTENDED markdown, not accidental symbols
  if (isValidMarkdown && featureCount >= 1) {
    // Higher confidence if consistent structure
    const confidence = consistencyScore > 0.6 ? 0.89 : 0.85
    return { type: 'markdown_html', confidence, reason: 'Valid, intentional markdown detected - intent: convert to HTML' }
  }

  // Priority 4: INVALID/BROKEN MARKDOWN WITH NOISE
  // If markdown is INVALID or has noise/corruption, match with markdown_clean
  // This handles: unmatched symbols, OCR artifacts, messy spacing, broken formatting
  if ((featureCount >= 1 && !isValidMarkdown) || hasNoisePatterns) {
    // Higher confidence if we detect clear noise patterns
    const confidence = hasNoisePatterns ? 0.88 : 0.82
    return { type: 'markdown_clean', confidence, reason: 'Broken or messy markdown detected - intent: clean text' }
  }

  // Priority 5: Valid markdown features but minimal structure
  // Edge case: has features but super minimal (shouldn't normally hit this)
  if (isValidMarkdown) {
    return { type: 'markdown_html', confidence: 0.76, reason: 'Minimal valid markdown - intent: convert to HTML' }
  }

  // No clear markdown intent
  return null
}

/**
 * Detect noise patterns that indicate messy/OCR text rather than intentional markdown
 */
function detectMarkdownNoise(input) {
  // Unusual spacing (3+ spaces, or leading/trailing spaces on lines)
  if (/\s{3,}|^\s{2,}|\s{2,}$/m.test(input)) {
    return true
  }

  // OCR-like spacing (spaces inside words, e.g., "Th is te xt")
  if (/\b\w+\s{1,2}\w+\s{1,2}\w+\s{1,2}\w+/.test(input)) {
    return true
  }

  // Repeated characters (4+ asterisks/underscores in a row)
  if (/\*{4,}|_{4,}|-{4,}/.test(input)) {
    return true
  }

  // Broken markdown symbols (unmatched emphasis) - BUT allow valid emphasis
  const asteriskCount = (input.match(/\*/g) || []).length
  const underscoreCount = (input.match(/_/g) || []).length
  const hasValidEmphasis = /\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__|_[^_]+_/.test(input)

  if (!hasValidEmphasis) {
    // Only flag as noise if there are unmatched symbols AND no valid emphasis
    if (asteriskCount % 2 !== 0 || (underscoreCount % 2 !== 0 && underscoreCount > 2)) {
      return true
    }
  }

  // Markdown symbols inside words (likely OCR artifact) - but be careful with contractions
  // e.g., don't flag things like "don*t" if it's clearly a typo context
  const wordsWithMarkdown = (input.match(/\w\*\w/g) || []).length
  if (wordsWithMarkdown > 2) { // More than 2 = suspicious
    return true
  }

  // Broken code fences (odd number = unclosed)
  const codeFences = (input.match(/```/g) || []).length
  if (codeFences === 1 || (codeFences > 2 && codeFences % 2 !== 0)) {
    return true
  }

  // Unclosed inline code (odd backticks)
  const backtickCount = (input.match(/`/g) || []).length
  if (backtickCount === 1 || (backtickCount % 2 !== 0 && backtickCount > 0)) {
    return true
  }

  // Misaligned table pipes (more than 2 consecutive pipes)
  if (/\|\|{2,}/.test(input)) {
    return true
  }

  // Heading-like but no space after # (e.g., #hello instead of # hello)
  if (/#[a-zA-Z]/.test(input)) {
    return true
  }

  // Excessive line breaks (more than 2 in a row)
  if (/\n\n\n+/.test(input)) {
    return true
  }

  return false
}

/**
 * Check if markdown structure appears intentional and consistent
 */
function checkMarkdownConsistency(input, lines, features) {
  let consistencyScore = 0
  let inconsistencyPenalty = 0

  // Check list consistency (all items at same level)
  const listLines = lines.filter(l => /^[-*]\s/.test(l))
  const orderedListLines = lines.filter(l => /^\d+\.\s/.test(l))

  if (listLines.length >= 2) {
    const allSameMarker = listLines.every(l => l.match(/^[-*]/)[0] === listLines[0].match(/^[-*]/)[0])
    if (allSameMarker) {
      consistencyScore += 0.3
    } else {
      // Mixed list markers = inconsistent
      inconsistencyPenalty += 0.2
    }
  }

  // Check if there are partial/broken lists (list item followed by non-list)
  if (listLines.length > 0) {
    const listIndices = lines.map((l, i) => /^[-*]\s/.test(l) ? i : -1).filter(i => i >= 0)
    const hasGapsBetweenItems = listIndices.some((idx, i, arr) => {
      if (i < arr.length - 1) {
        return arr[i + 1] - idx > 2 // More than 1 line gap
      }
      return false
    })
    if (hasGapsBetweenItems) {
      inconsistencyPenalty += 0.1
    }
  }

  // Check heading hierarchy
  const headingLines = lines.filter(l => /^#{1,6}\s/.test(l))
  if (headingLines.length >= 2) {
    const levels = headingLines.map(l => l.match(/^#+/)[0].length)
    const isValidHierarchy = levels.every((level, i) => i === 0 || level >= levels[i - 1] - 1)
    if (isValidHierarchy) {
      consistencyScore += 0.3
    } else {
      inconsistencyPenalty += 0.15
    }
  }

  // Check if bold/italic markers are properly paired
  const boldMatches = input.match(/\*\*[^*]+\*\*|__[^_]+__/g) || []
  const italicMatches = input.match(/\*[^*]+\*|_[^_]+_/g) || []

  if (boldMatches.length >= 1 || italicMatches.length >= 1) {
    consistencyScore += 0.2
  }

  // Check link format consistency (properly formatted links)
  const links = input.match(/\[[^\]]+\]\([^)]+\)/g) || []
  if (links.length >= 1) consistencyScore += 0.2

  // Check table consistency
  if (features.tables) {
    const tableLines = lines.filter(l => /\|.*\|/.test(l))
    if (tableLines.length >= 3) {
      // Check if separator line exists
      const hasSeparator = tableLines.some(l => /\|\s*-+\s*\|/.test(l))
      if (hasSeparator) {
        consistencyScore += 0.25
      } else {
        inconsistencyPenalty += 0.2
      }
    }
  }

  // Penalize excessive line breaks
  const excessiveBreaks = (input.match(/\n\n\n+/g) || []).length > 0
  if (excessiveBreaks) {
    inconsistencyPenalty += 0.15
  }

  const finalScore = Math.max(0, consistencyScore - inconsistencyPenalty)
  return Math.min(finalScore, 1)
}

/**
 * Calculate ratio of markdown formatting to plain text
 */
function calculateMarkdownDensity(input, featureCount) {
  // Count actual markdown syntax characters
  const headingChars = (input.match(/^#+\s/m) || []).length * 5
  const listChars = (input.match(/^[-*]\s/m) || []).length * 4
  const linkChars = (input.match(/\[[^\]]+\]\([^)]+\)/g) || []).length * 15
  const codeChars = (input.match(/```/g) || []).length * 10
  const emphasisChars = (input.match(/\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_/g) || []).length * 5
  const tableChars = (input.match(/\|.*\|/g) || []).length * 8

  const markdownChars = headingChars + listChars + linkChars + codeChars + emphasisChars + tableChars
  const totalChars = input.replace(/\s/g, '').length

  if (totalChars === 0) return 0

  const charRatio = Math.min(markdownChars / totalChars, 0.3) // Cap at 30%
  const featureRatio = featureCount > 0 ? Math.min(featureCount / 6, 1) : 0

  return (charRatio * 0.4 + featureRatio * 0.6) // Weight features more heavily
}

/**
 * Check if markdown is VALID/WELL-FORMED (not broken)
 * Returns true if markdown syntax appears intentionally used and correct
 */
function checkMarkdownValidity(input, lines, features) {
  // First check for obvious noise/corruption patterns
  const hasObnoxiousNoise = detectMarkdownNoise(input)

  // Check heading format
  if (features.headings) {
    const invalidHeadings = lines.filter(l => /^#+/.test(l) && !/^#{1,6}\s/.test(l))
    if (invalidHeadings.length > 0) {
      return false // Headings without space after #
    }
  }

  // Check emphasis markers are paired
  const asteriskCount = (input.match(/\*/g) || []).length
  const underscoreCount = (input.match(/_/g) || []).length

  if (asteriskCount % 2 !== 0) {
    return false // Unmatched asterisks
  }
  if (underscoreCount % 2 !== 0 && underscoreCount > 2) {
    return false // Unmatched underscores (allow 1 for like name_var)
  }

  // Check backticks are paired
  const backticks = (input.match(/`/g) || []).length
  if (backticks % 2 !== 0) {
    return false // Unclosed inline code
  }

  // Check code fences are paired
  const codeFences = (input.match(/```/g) || []).length
  if (codeFences > 0 && codeFences % 2 !== 0) {
    return false // Unclosed code block
  }

  // Check tables have proper format
  if (features.tables) {
    const tableLines = lines.filter(l => /\|.*\|/.test(l))
    if (tableLines.length >= 3) {
      const hasSeparator = tableLines.some(l => /\|\s*-+\s*\|/.test(l))
      if (!hasSeparator) {
        return false // Table without separator line is malformed
      }
    }
  }

  // If we have obvious noise AND no clear markdown structure, it's not valid
  if (hasObnoxiousNoise && Object.values(features).filter(Boolean).length === 0) {
    return false
  }

  // If any markdown features exist and none of the validity checks failed, it's valid
  const hasAnyMarkdown = Object.values({ headings: features.headings, lists: features.lists, orderedLists: features.orderedLists, codeFences: features.codeFences, emphasis: features.emphasis, links: features.links }).some(Boolean)
  return hasAnyMarkdown
}

/**
 * Check if content reads like documentation
 */
function checkDocumentationPattern(input, lines) {
  // Look for typical documentation structures
  const hasCapitalizedHeadings = lines.some(l => /^#{1,6}\s+[A-Z]/.test(l))
  const hasSectionHeaders = lines.filter(l => /^#{1,6}\s+/.test(l)).length >= 2
  const hasLogicalFlow = lines.length >= 5

  // Look for documentation keywords
  const docKeywords = /overview|introduction|usage|features|example|requirements|installation|how to|getting started|guidelines|reference|configuration|tutorial/i
  const hasDocKeywords = docKeywords.test(input)

  return (hasCapitalizedHeadings && hasSectionHeaders && hasLogicalFlow) || hasDocKeywords
}

/**
 * Run hard detection on input
 * Returns the detected type with confidence, or null if no match
 */
export function hardDetect(input) {
  const trimmed = input.trim()
  
  if (!trimmed) {
    return null
  }

  // Check each pattern in order of priority
  // Priority 1: Most unique formats (lowest false positive rate)
  
  if (patterns.email.test(trimmed)) {
    return { type: 'email', confidence: 0.98, reason: 'Email address format detected' }
  }
  
  if (patterns.url.test(trimmed)) {
    return { type: 'url', confidence: 0.96, reason: 'URL format detected' }
  }
  
  if (patterns.ip.test(trimmed)) {
    return { type: 'ip', confidence: 0.97, reason: 'IPv4 or IPv6 address detected' }
  }
  
  if (patterns.uuid.test(trimmed)) {
    return { type: 'uuid', confidence: 0.99, reason: 'UUID/GUID format detected' }
  }
  
  if (patterns.jwt.test(trimmed)) {
    return { type: 'jwt', confidence: 0.95, reason: 'JWT token format detected' }
  }
  
  if (patterns.hex_color.test(trimmed)) {
    return { type: 'hex_color', confidence: 0.97, reason: 'Hex color or RGB format detected' }
  }
  
  if (patterns.cron.test(trimmed)) {
    return { type: 'cron', confidence: 0.94, reason: 'Cron expression format detected' }
  }
  
  if (patterns.http_status_code.test(trimmed)) {
    return { type: 'http_status_code', confidence: 0.98, reason: 'HTTP status code detected' }
  }

  if (patterns.mime.test(trimmed)) {
    return { type: 'mime', confidence: 0.92, reason: 'MIME type format detected' }
  }

  // Image base64 (check before regular base64)
  if (patterns.base64_image.test(trimmed)) {
    return { type: 'base64_image', confidence: 0.98, reason: 'Image base64 data detected' }
  }

  // Markup and structured data - CHECK SVG BEFORE XML/HTML
  if (patterns.svg.test(trimmed)) {
    return { type: 'svg', confidence: 0.97, reason: 'SVG markup detected' }
  }

  // XML detection (check before HTML since it's more specific with <?xml>)
  if (patterns.xml.test(trimmed)) {
    return { type: 'xml', confidence: 0.95, reason: 'XML markup detected' }
  }

  // HTML detection (common HTML tags)
  if (patterns.html.test(trimmed)) {
    return { type: 'html', confidence: 0.96, reason: 'HTML markup detected' }
  }

  // Generic XML detection (custom tags with closing tags)
  if (/^\s*<([a-z][a-z0-9-]*)[^>]*>[\s\S]*<\/\1\s*>/i.test(trimmed)) {
    return { type: 'xml', confidence: 0.85, reason: 'XML-like markup detected' }
  }

  if (patterns.json.test(trimmed)) {
    // Try to parse to confirm it's valid JSON
    try {
      JSON.parse(trimmed)
      return { type: 'json', confidence: 0.99, reason: 'Valid JSON detected' }
    } catch {
      // If it fails, could still be JSON-like
      if (patterns.json.test(trimmed)) {
        return { type: 'json', confidence: 0.75, reason: 'JSON-like structure detected' }
      }
    }
  }

  // Time formats (check before headers/yaml since they can be ambiguous with colons)
  if (patterns.time_12h.test(trimmed)) {
    return { type: 'time_12h', confidence: 0.96, reason: '12-hour time format detected' }
  }

  if (patterns.time_24h.test(trimmed)) {
    return { type: 'time_24h', confidence: 0.96, reason: '24-hour time format detected' }
  }

  // HTTP Header check before YAML (since "Header: value" looks like YAML)
  if (patterns.http_header.test(trimmed) && trimmed.includes(':') && !trimmed.includes('\n')) {
    return { type: 'http_header', confidence: 0.88, reason: 'HTTP header format detected' }
  }

  // Markdown detection with multi-layer intent analysis (before YAML to avoid false positives)
  if (patterns.markdown.test(trimmed)) {
    const markdownAnalysis = analyzeMarkdownIntent(trimmed)
    if (markdownAnalysis) {
      return markdownAnalysis
    }
  }

  // YAML detection (stricter: must have key: value pattern, not just dashes which are markdown lists)
  if (patterns.yaml.test(trimmed) && /^[a-z_][a-z0-9_-]*\s*:/im.test(trimmed)) {
    return { type: 'yaml', confidence: 0.88, reason: 'YAML format detected' }
  }

  // CSV detection: has commas and multiple lines
  if (trimmed.includes(',') && trimmed.split('\n').length >= 2) {
    const lines = trimmed.split('\n')
    const firstLine = lines[0]
    const hasCommaInFirstLine = firstLine.includes(',')
    const hasCommaInOtherLines = lines.slice(1).some(l => l.includes(','))
    if (hasCommaInFirstLine && hasCommaInOtherLines) {
      return { type: 'csv', confidence: 0.88, reason: 'CSV format detected' }
    }
  }

  if (patterns.css.test(trimmed)) {
    return { type: 'css', confidence: 0.87, reason: 'CSS syntax detected' }
  }

  if (patterns.sql.test(trimmed)) {
    return { type: 'sql', confidence: 0.93, reason: 'SQL query detected' }
  }

  if (patterns.js.test(trimmed)) {
    return { type: 'js', confidence: 0.89, reason: 'JavaScript code detected' }
  }

  // HTML entities (after markup checks)
  if (patterns.html_entities.test(trimmed)) {
    return { type: 'html_entities', confidence: 0.80, reason: 'HTML entities detected' }
  }

  // Math expression (check before regex since they can overlap with parentheses)
  if (patterns.math_expression.test(trimmed) && /[+\-*/()\^]/.test(trimmed) && !trimmed.includes('[') && !trimmed.includes('\\') && !/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return { type: 'math_expression', confidence: 0.85, reason: 'Math expression detected' }
  }

  // Regex pattern (must be checked before URL encoding due to potential overlap)
  if (patterns.regex.test(trimmed) && trimmed.length > 5 && /[\[\](){}.*?+\\^$|]/.test(trimmed)) {
    return { type: 'regex', confidence: 0.85, reason: 'Regular expression pattern detected' }
  }

  // URL encoding (% sequences)
  if (patterns.url_encoded.test(trimmed)) {
    return { type: 'url_encoded', confidence: 0.90, reason: 'URL-encoded string detected' }
  }

  // Base64: Only if it's a reasonably long base64-like string
  if (patterns.base64.test(trimmed) && trimmed.length > 20) {
    return { type: 'base64', confidence: 0.85, reason: 'Base64 encoded data detected' }
  }

  // Timestamps and dates (after time formats)
  if (patterns.timestamp_iso.test(trimmed)) {
    return { type: 'timestamp', confidence: 0.98, reason: 'ISO timestamp detected' }
  }

  if (patterns.date.test(trimmed)) {
    return { type: 'timestamp', confidence: 0.87, reason: 'Date format detected' }
  }

  if (patterns.timestamp_unix.test(trimmed) && trimmed.length >= 10) {
    const ts = parseInt(trimmed, 10)
    // Check if it's a valid IPv4 integer (0 to 4,294,967,295)
    const isValidIpv4Integer = ts >= 0 && ts <= 4294967295

    // Check if it falls within ±50 years from now
    const now = Math.floor(Date.now() / 1000)
    const fiftyYearsInSeconds = 50 * 365.25 * 24 * 3600 // ~1,577,836,800 seconds
    const minTimestamp = now - fiftyYearsInSeconds
    const maxTimestamp = now + fiftyYearsInSeconds
    const isWithinTimestampRange = ts >= minTimestamp && ts <= maxTimestamp

    // If it's within timestamp range, classify as timestamp (even if it's also a valid IP)
    if (isWithinTimestampRange) {
      return { type: 'timestamp', confidence: 0.90, reason: 'Unix timestamp detected' }
    }

    // If it's a valid IPv4 integer but NOT in timestamp range, classify as IP integer
    if (isValidIpv4Integer) {
      return { type: 'potential_ip_integer', confidence: 0.90, reason: 'Valid IPv4 address in integer form' }
    }
  }

  // Numeric and Symbolic Formats (CRITICAL: Do not classify as plain_text)

  // Binary: Only if it's mostly 0s and 1s and reasonably long
  if (patterns.binary.test(trimmed) && trimmed.length >= 8) {
    return { type: 'binary', confidence: 0.97, reason: 'Binary number detected' }
  }

  if (patterns.hex_number.test(trimmed)) {
    return { type: 'hex_number', confidence: 0.92, reason: 'Hexadecimal number detected' }
  }

  if (patterns.octal.test(trimmed) && trimmed.length > 1) {
    return { type: 'octal', confidence: 0.88, reason: 'Octal number detected' }
  }
  
  // File sizes and units
  if (patterns.file_size.test(trimmed)) {
    return { type: 'file_size', confidence: 0.95, reason: 'File size format detected' }
  }
  
  if (patterns.unit_value.test(trimmed)) {
    // Extract the unit part and validate it
    const unitMatch = trimmed.match(/\s([a-z°µ²³\/\-°]+)s?$/i)
    if (unitMatch && isValidUnit(unitMatch[1])) {
      return { type: 'unit_value', confidence: 0.94, reason: 'Value with unit detected' }
    }
  }
  
  // Math expression
  if (patterns.math_expression.test(trimmed) && /[+\-*/()\^]/.test(trimmed)) {
    return { type: 'math_expression', confidence: 0.88, reason: 'Math expression detected' }
  }
  
  // Path-like formats
  if (patterns.filepath.test(trimmed)) {
    return { type: 'filepath', confidence: 0.86, reason: 'File path format detected' }
  }
  
  if (patterns.jsonpath.test(trimmed)) {
    return { type: 'jsonpath', confidence: 0.90, reason: 'JSONPath expression detected' }
  }
  
  // Single file extension/type detection (like "pdf", "docx", "jpg")
  if (/^[a-z0-9]{1,10}$/i.test(trimmed)) {
    // Only match if it's 1-10 characters, alphanumeric, looks like a real extension
    // Common extensions to validate
    const commonExtensions = /^(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|json|xml|html|css|js|py|java|cpp|c|php|rb|go|rs|ts|tsx|jsx|vue|sql|zip|rar|7z|tar|gz|jpg|jpeg|png|gif|bmp|svg|ico|mp3|mp4|avi|mov|mkv|wav|flac|aac|m4a|wma|exe|msi|app|dmg|deb|iso|bin|img|dll|so|a|lib|h|hpp|o|class|jar|apk|aar|aab|pb|proto|yaml|yml|ini|cfg|conf|env|log|tmp|bak|old|new)$/i

    // If it matches a common extension, consider it a file type
    if (commonExtensions.test(trimmed)) {
      return { type: 'file_type', confidence: 0.93, reason: 'File type/extension detected' }
    }
  }

  // Unicode/non-Latin script detection (before plain number detection)
  if (/[\u0080-\uFFFF]/.test(trimmed) && /[a-zA-Z]/.test(trimmed) === false) {
    // Contains non-ASCII Unicode characters and no Latin letters
    return { type: 'unicode_text', confidence: 0.85, reason: 'Non-Latin Unicode text detected' }
  }

  // ROT13 and Caesar cipher detection removed
  // These were triggering false positives on plain English text
  // (e.g., "example example" or "lorem ipsum")
  // Tool detection will still suggest them with lower confidence if needed

  // Plain numeric detection (must not be confused with other types)
  if (/^-?\d+\.?\d*$/.test(trimmed) && trimmed.length > 0) {
    return { type: 'integer', confidence: 0.98, reason: 'Integer number detected' }
  }

  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return { type: 'float', confidence: 0.98, reason: 'Floating-point number detected' }
  }

  // No structured format matched
  // Check if it looks like plain English text
  if (isLikelyPlainText(trimmed)) {
    return { type: 'plain_text', confidence: 0.85, reason: 'Plain English text detected' }
  }

  // No match: return null and let fallback layers handle it
  return null
}

/**
 * Utility function to check if input is likely plain text
 * Only after all hard detection fails
 */
export function isLikelyPlainText(input) {
  const trimmed = input.trim()
  
  // If it's all whitespace, not plain text
  if (!trimmed) return false
  
  // If it contains letters and looks like natural language, it's plain text
  const hasLetters = /[a-zA-Z]/.test(trimmed)
  const hasWords = /\b[a-z]{2,}\b/i.test(trimmed)
  
  // Avoid common false positives
  const looksLikeSymbolic = /^[\s\W]*$/.test(trimmed) // Only symbols/whitespace
  const looksLikeNumeric = /^-?[\d.]+$/.test(trimmed) // Pure number
  
  return hasLetters && hasWords && !looksLikeSymbolic && !looksLikeNumeric
}

export default {
  hardDetect,
  isLikelyPlainText,
  patterns,
}
