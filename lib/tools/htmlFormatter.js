// lib/tools/htmlFormatter.js

let htmlEntities = null;

try {
  if (typeof window === 'undefined') {
    htmlEntities = require('html-entities');
  }
} catch (error) {
  // Encoding packages not available
}

/* ============================
 *  HTML ENCODER/DECODER
 * ============================ */

function htmlEncoder(text) {
  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'\/]/g, char => entityMap[char]);
}

function htmlDecoder(text) {
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#x2F;': '/',
  };
  let result = text;
  Object.keys(entityMap).forEach(entity => {
    result = result.replace(new RegExp(entity, 'g'), entityMap[entity]);
  });
  return result;
}

/* ============================
 *  HTML MINIFIER
 * ============================ */

function htmlMinifier(text, config) {
  let result = text;

  if (config.removeComments !== false) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (config.removeNewlines !== false) {
    result = result.replace(/>\s+</g, '><');
    result = result.replace(/\s+/g, ' ');
  }

  return result.trim();
}

/* ============================
 *  HTML BEAUTIFIER
 * ============================ */

function htmlBeautifier(text, config) {
  const indent = config.indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(config.indentSize) || 2);
  let result = '';
  let indentLevel = 0;

  const selfClosingTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

  text = text.replace(/>\s+</g, '><');

  const stack = [];
  let inTag = false;
  let tagContent = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '<') {
      inTag = true;
      tagContent = '<';
    } else if (char === '>' && inTag) {
      tagContent += '>';
      inTag = false;

      const isClosing = tagContent.startsWith('</');
      const tagName = (tagContent.match(/^<\/?(\w+)/) || [])[1] || '';

      if (isClosing) {
        indentLevel = Math.max(0, indentLevel - 1);
        result += indent.repeat(indentLevel) + tagContent + '\n';
        stack.pop();
      } else {
        result += indent.repeat(indentLevel) + tagContent + '\n';
        if (!selfClosingTags.test(tagName) && !tagContent.endsWith('/>')) {
          stack.push(tagName);
          indentLevel++;
        }
      }

      tagContent = '';
    } else if (inTag) {
      tagContent += char;
    }
  }

  return result.trim();
}

/* ============================
 *  MAIN FORMATTER
 * ============================ */

function htmlFormatter(text, config = {}) {
  const { mode = 'beautify', indentSize = '2', removeComments = true } = config;

  try {
    if (!text || typeof text !== 'string') {
      return { error: 'Invalid input: Please provide HTML code', hideOutput: true };
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return { error: 'Empty input: Please provide HTML code', hideOutput: true };
    }

    if (mode === 'minify') {
      return htmlMinifier(trimmed, { removeComments });
    } else {
      return htmlBeautifier(trimmed, { indentSize });
    }
  } catch (error) {
    return { error: `HTML formatting error: ${error.message}`, hideOutput: true };
  }
}

module.exports = {
  htmlFormatter,
  htmlEncoder,
  htmlDecoder,
  htmlMinifier,
  htmlBeautifier,
};
