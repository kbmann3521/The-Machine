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
    'markdown-html-converter',
    'markdown-linter',
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
    'number-formatter',
    'base-converter',
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
  ],

  date: [
    'timestamp-converter',
  ],

  hex_color: [
    'color-converter',
    'hex-rgba-converter',
  ],

  ip: [
    'ip-validator',
    'ip-range-calculator',
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
 * Get the bias weight for a tool (special handling for Text Toolkit)
 */
export function getToolBiasWeight(toolId, inputType) {
  // Text Toolkit gets a MASSIVE boost for plain text
  if (toolId === 'text-toolkit' && inputType === 'plain_text') {
    return 0.40 // +40% bias
  }
  
  // Structured tools don't get bias
  return 0
}

export default {
  inputTypeToTools,
  getToolsForInputType,
  shouldUseSemanticSearch,
  getToolBiasWeight,
}
