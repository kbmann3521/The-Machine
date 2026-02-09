/**
 * Replaces template placeholders with actual tool metadata
 * @param {string} template - Template string with placeholders (e.g., "<tool-name>")
 * @param {object} tool - Tool metadata object with name, description, etc.
 * @returns {string} - Template with placeholders replaced
 */
export function replaceToolPlaceholders(template, tool) {
  if (!template || !tool) return template

  let result = template
  result = result.replace(/<tool-name>/g, tool.name || '')
  result = result.replace(/<tool-short-description>/g, tool.description || '')
  return result
}
