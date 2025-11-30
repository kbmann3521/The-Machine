/* ===========================================
   CSS FORMATTER
   =========================================== */

function cssFormatter(text, config = {}) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const mode = config.mode || 'beautify'

  if (mode === 'minify') {
    return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,])\s*/g, '$1').trim()
  }

  // Beautify mode
  return text.replace(/\{/g, ' {\n  ').replace(/;/g, ';\n  ').replace(/\}/g, '\n}').replace(/\n\s*\n/g, '\n')
}

module.exports = { cssFormatter }
