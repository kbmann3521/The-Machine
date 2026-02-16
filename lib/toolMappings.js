/**
 * Tool Candidate Selection by Input Type
 *
 * Maps each input type to the set of tools that should be considered.
 * This ensures the right tools are queried for semantic search.
 */

import { looksEnglish } from './englishWords'

export const inputTypeToTools = {
  // STRUCTURED TYPES

  email: [
    'email-validator',
  ],

  url: [
    'url-toolkit',
    'encoder-decoder',
  ],

  json: [
    'json-formatter',
  ],

  html: [
    'web-playground',
  ],

  css: [
    'css-formatter',
  ],

  js: [
    'js-formatter',
  ],

  xml: [
    'xml-formatter',
  ],

  yaml: [
    'yaml-formatter',
  ],

  markdown: [
    'web-playground',
    'text-toolkit',
  ],

  markdown_html: [
    'web-playground',
    'text-toolkit',
  ],

  markdown_clean: [
    'web-playground',
    'text-toolkit',
  ],

  svg: [
    'svg-optimizer',
  ],

  csv: [
    'csv-json-converter',
  ],

  jwt: [
    'jwt-decoder',
  ],

  base64: [
    'base64-converter',
    'encoder-decoder',
  ],

  html_entities: [
  ],

  sql: [
    'sql-formatter',
  ],

  cron: [
    'cron-tester',
  ],

  mime: [
    'mime-type-lookup',
  ],

  file_type: [
    'mime-type-lookup',
  ],

  http_header: [
    'http-header-parser',
  ],

  http_status_code: [
    'http-status-lookup',
  ],

  regex: [
    'regex-tester',
  ],

  url_encoded: [
    'escape-unescape',
  ],

  base64_image: [
    'image-to-base64',
    'base64-converter',
    'encoder-decoder',
  ],

  // NUMERIC / SYMBOLIC TYPES

  integer: [
    'number-formatter',
    'base-converter',
  ],

  base_convertible_int: [
    'base-converter',
  ],

  potential_ip_integer: [
  ],

  float: [
    'number-formatter',
  ],

  math_expression: [
    'math-evaluator',
  ],

  time_24h: [
    'time-normalizer',
  ],

  time_12h: [
    'time-normalizer',
  ],

  file_size: [
    'file-size-converter',
  ],

  unit_value: [
    'unit-converter',
  ],

  hex_number: [
    'base-converter',
    'hexadecimal-converter',
    'encoder-decoder',
  ],

  octal_number: [
    'base-converter',
  ],

  binary: [
    'binary-converter',
    'base-converter',
    'encoder-decoder',
  ],

  timestamp: [
    'time-normalizer',
  ],

  date: [
    'time-normalizer',
  ],

  hex_color: [
    'color-converter',
    'hex-rgba-converter',
  ],

  ip: [
    'ip-address-toolkit',
  ],

  uuid: [
    'uuid-validator',
  ],

  filepath: [
  ],

  jsonpath: [
    'json-formatter',
  ],
  
  // TEXTUAL TYPES (plain_text gets special treatment with bias)

  plain_text: [
    'text-toolkit', // Primary, gets +40% bias
    'rot13-cipher',
    'caesar-cipher',
    'ascii-unicode-converter',
    'escape-unescape',
    'regex-tester',
    'base64-converter',
    'encoder-decoder',
  ],
  
  ambiguous_text: [
    'text-toolkit',
  ],

  unicode_text: [
    'ascii-unicode-converter',
  ],

  rot13_encoded: [
    'rot13-cipher',
    'caesar-cipher',
    'text-toolkit',
  ],

  caesar_encoded: [
    'caesar-cipher',
    'rot13-cipher',
    'text-toolkit',
  ],
}

/**
 * Get tools for an input type
 */
export function getToolsForInputType(inputType) {
  return inputTypeToTools[inputType] || []
}

/**
 * Base heuristic weight per tool, given an inputType.
 * This is the "matrix" piece – every tool gets a score, but mapped tools get more.
 *
 * QR Code Generator is a universal fallback:
 * - URLs: ~75% of real-world QR codes
 * - Plain text: ~5-7%
 * - Email/Phone: ~2-3%
 * - Contacts: ~3-5%
 * - Everything else: fallback weight
 */
export function getToolBaseWeight(toolId, inputType) {
  const mapped = inputTypeToTools[inputType] || []

  // QR Code Generator: Always visible as universal fallback
  // Must be >= 0.6 to pass frontend filter, but lower than most specific tools
  if (toolId === 'qr-code-generator') {
    return 0.62  // Just above the 0.6 frontend threshold
  }

  // Text toolkit is the "king" of plain_text
  if (toolId === 'text-toolkit' && inputType === 'plain_text') {
    return 0.90
  }

  // Markdown: web-playground should win strongly over text-toolkit
  if (inputType === 'markdown') {
    if (toolId === 'web-playground') return 0.95
    if (toolId === 'text-toolkit') return 0.30  // Penalize text-toolkit for markdown
    return 0.10
  }

  // CSS: css-formatter should win, text-toolkit should not appear
  if (inputType === 'css') {
    if (toolId === 'css-formatter') return 0.95
    if (toolId === 'text-toolkit') return 0.10  // Penalize text-toolkit for CSS
    return 0.10
  }

  // Cipher handling: Break ties between ROT13 and Caesar
  // ROT13 input: ROT13 should win over Caesar
  if (inputType === 'rot13_encoded') {
    if (toolId === 'rot13-cipher') return 0.95
    if (toolId === 'caesar-cipher') return 0.70
    return 0.10
  }

  // Caesar input: Caesar should win over ROT13
  if (inputType === 'caesar_encoded') {
    if (toolId === 'caesar-cipher') return 0.95
    if (toolId === 'rot13-cipher') return 0.70
    return 0.10
  }

  // URL Toolkit: Primary tool for URL inputs
  if (inputType === 'url') {
    if (toolId === 'url-toolkit') return 0.95
    if (mapped.includes(toolId)) return 0.75
    return 0.10
  }

  // For structured types, primary tools should be strong
  if (mapped.includes(toolId)) {
    return 0.75
  }

  // Give a small base to everything else so they can still appear at the bottom
  return 0.10
}

/**
 * Bias adjusts after base/semantic. Can be negative.
 */
export function getToolBiasWeight(toolId, inputType, rawInput = '') {
  const trimmed = (rawInput || '').trim().toLowerCase()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0

  // Text Toolkit: ONLY activate for actual plain text types
  // Should NOT activate for code, markup, structured data, or anything else
  if (toolId === 'text-toolkit') {
    // Only apply positive bias for types where text-toolkit is intended
    const textToolkitTypes = ['plain_text', 'ambiguous_text', 'unicode_text', 'rot13_encoded', 'caesar_encoded']

    if (!textToolkitTypes.includes(inputType)) {
      // Strong penalty for any non-plain-text input (code, markup, structured data, etc)
      return -0.75  // Disable text-toolkit for code/markup/structured data
    }

    // For actual plain text types, only give positive bias if it actually looks like English
    if (!looksEnglish(trimmed)) {
      return -0.40 // strong negative bias for non-English text
    }
    return 0.50 // positive bias for true English sentences
  }

  // Unit converter should be penalized when the input looks like a sentence
  if (toolId === 'unit-converter') {
    if (wordCount > 3) {
      return -0.50 // strong penalty for sentence-like inputs
    }
    if (wordCount <= 3 && inputType === 'unit_value') {
      return 0.10 // slight positive nudge when we *know* it's a unit
    }
  }

  // Binary converter gets a boost for binary input
  if (toolId === 'binary-converter' && inputType === 'binary') {
    return 0.20
  }

  // If we see only 0s and 1s but it wasn't detected as binary (edge case)
  if (toolId === 'binary-converter' && /^[01\s]+$/.test(rawInput.trim()) && rawInput.trim().length > 8) {
    return 0.10  // Small boost just in case
  }

  // Base-converter should NOT be suggested for inputs with spaces
  // Base-converter only takes single numbers, not space-separated values
  if (toolId === 'base-converter' && /\s/.test(rawInput.trim())) {
    return -0.65  // Strong penalty - this tool can't handle multi-value input
  }

  // Hexadecimal-converter should win over base-converter for hex input
  if (toolId === 'hexadecimal-converter' && inputType === 'hex_number') {
    return 0.20  // Boost to prioritize hex-converter for hex data
  }


  return 0
}

/**
 * Check if input type should get semantic search
 */
export function shouldUseSemanticSearch(inputType) {
  // Only use semantic search for plain text or ambiguous inputs
  return inputType === 'plain_text' || inputType === 'ambiguous_text'
}

export default {
  inputTypeToTools,
  getToolsForInputType,
  getToolBaseWeight,
  getToolBiasWeight,
  shouldUseSemanticSearch,
}
