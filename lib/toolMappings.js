/**
 * Tool Candidate Selection by Input Type
 * 
 * Maps each input type to the set of tools that should be considered.
 * This ensures the right tools are queried for semantic search.
 */

export const inputTypeToTools = {
  // STRUCTURED TYPES

  email: [
    'email-validator',
  ],

  url: [
    'url-converter',
    'url-parser',
  ],

  json: [
    'json-formatter',
  ],

  html: [
    'markdown-html-formatter',
    'html-formatter',
    'html-entities-converter',
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
    'markdown-html-converter',
    'text-toolkit',
  ],

  markdown_html: [
    'markdown-html-formatter',
    'markdown-html-converter',
    'text-toolkit',
  ],

  markdown_clean: [
    'markdown-html-formatter',
    'text-toolkit',
    'markdown-html-converter',
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
    'html-entities-converter',
  ],

  sql: [
    'sql-formatter',
  ],

  cron: [
    'cron-evaluator',
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
    'url-converter',
  ],

  base64_image: [
    'image-to-base64',
    'base64-converter',
  ],

  // NUMERIC / SYMBOLIC TYPES

  integer: [
    'ip-integer-converter',
    'timestamp-converter',
    'number-formatter',
    'base-converter',
  ],

  potential_ip_integer: [
    'ip-integer-converter',
    'timestamp-converter',
  ],

  float: [
    'number-formatter',
  ],

  math_expression: [
    'math-evaluator',
  ],

  time_24h: [
    'timezone-converter',
    'timestamp-converter',
  ],

  time_12h: [
    'timezone-converter',
    'timestamp-converter',
  ],

  file_size: [
    'file-size-converter',
  ],

  unit_value: [
    'unit-converter',
  ],

  hex_number: [
    'base-converter',
    'binary-converter',
  ],

  octal_number: [
    'base-converter',
  ],

  binary: [
    'binary-converter',
    'base-converter',
  ],

  timestamp: [
    'timestamp-converter',
    'ip-integer-converter',
  ],

  date: [
    'timestamp-converter',
    'ip-integer-converter',
  ],

  hex_color: [
    'color-converter',
    'hex-rgba-converter',
  ],

  ip: [
    'ip-validator',
    'ip-range-calculator',
    'ip-integer-converter',
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
    'plain-text-stripper',
    'rot13-cipher',
    'caesar-cipher',
    'ascii-unicode-converter',
    'escape-unescape',
    'regex-tester',
    'markdown-linter',
    'base64-converter',
  ],
  
  ambiguous_text: [
    'text-toolkit',
    'plain-text-stripper',
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
 * Check if input type should get semantic search
 */
export function shouldUseSemanticSearch(inputType) {
  // Only use semantic search for plain text or ambiguous inputs
  return inputType === 'plain_text' || inputType === 'ambiguous_text'
}

/**
 * Get the bias weight for a tool (depends on both inputType and raw input)
 */
export function getToolBiasWeight(toolId, inputType, rawInput = '') {
  const trimmed = (rawInput || '').trim().toLowerCase()
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0

  // Text Toolkit should almost always win for plain English
  if (toolId === 'text-toolkit' && inputType === 'plain_text') {
    return 0.50 // +50% bias
  }

  // Unit converter should be penalized when the input looks like a sentence
  if (toolId === 'unit-converter') {
    if (wordCount > 3) {
      return -0.50 // strong penalty: "there are 100 dogs here"
    }
    // slight positive bias when input is very short and matches unit
    if (wordCount <= 3 && inputType === 'unit_value') {
      return 0.10
    }
  }

  // Binary converter: bonus for "binary" inputType
  if (toolId === 'binary-converter' && inputType === 'binary') {
    return 0.20
  }

  return 0
}

export default {
  inputTypeToTools,
  getToolsForInputType,
  shouldUseSemanticSearch,
  getToolBiasWeight,
}
