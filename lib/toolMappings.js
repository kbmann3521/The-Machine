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
  ],

  json: [
    'json-formatter',
  ],

  html: [
    'markdown-html-formatter',
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
    'markdown-html-formatter',
    'text-toolkit',
  ],

  markdown_html: [
    'markdown-html-formatter',
    'text-toolkit',
  ],

  markdown_clean: [
    'markdown-html-formatter',
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
  ],

  octal_number: [
    'base-converter',
  ],

  binary: [
    'base-converter',
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
 */
export function getToolBaseWeight(toolId, inputType) {
  const mapped = inputTypeToTools[inputType] || []

  // Text toolkit is the "king" of plain_text
  if (toolId === 'text-toolkit' && inputType === 'plain_text') {
    return 0.90
  }

  // Markdown: markdown-html-formatter should win strongly over text-toolkit
  if (inputType === 'markdown') {
    if (toolId === 'markdown-html-formatter') return 0.95
    if (toolId === 'text-toolkit') return 0.30  // Penalize text-toolkit for markdown
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

  // Text Toolkit: Only boost if input looks like real English
  // Otherwise penalize to avoid false positives with ciphers
  if (toolId === 'text-toolkit') {
    // Penalize text-toolkit when markdown is detected
    if (inputType === 'markdown') {
      return -0.30  // Markdown should go to markdown-html-formatter
    }
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

  // Binary converter gets a small boost for binary input
  if (toolId === 'binary-converter' && inputType === 'binary') {
    return 0.20
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
