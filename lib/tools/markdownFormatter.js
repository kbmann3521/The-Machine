// lib/tools/markdownFormatter.js

let htmlEntities = null;
let jsStringEscape = null;
let jsonEscaping = null;

try {
  if (typeof window === 'undefined') {
    htmlEntities = require('html-entities');
    jsStringEscape = require('js-string-escape');
    jsonEscaping = require('json-escaping');
  }
} catch (error) {
  // Encoding packages not available
}

const { htmlEncoder, htmlDecoder } = require('./htmlFormatter');

/* ============================
 *  VALIDATION
 * ============================ */

function validateMarkdown(text) {
  const errors = [];
  let offset = 0;

  // Check for unmatched bracket pairs
  const brackets = { '[': ']', '(': ')' };
  const stack = [];
  const codeBlocks = [];
  let inCodeBlock = false;
  let codeBlockStart = 0;

  for (let i = 0; i < text.length; i++) {
    if (text.substr(i, 3) === '```') {
      if (inCodeBlock) {
        codeBlocks.push({ start: codeBlockStart, end: i });
        inCodeBlock = false;
      } else {
        codeBlockStart = i;
        inCodeBlock = true;
      }
      i += 2;
    }
  }

  if (inCodeBlock) {
    errors.push({
      type: 'error',
      category: 'syntax',
      line: text.slice(0, codeBlockStart).split('\n').length,
      column: text.slice(0, codeBlockStart).split('\n').pop().length + 1,
      message: 'Unclosed code block (```)',
    });
  }

  // Check for unmatched link/image syntax
  const linkMatches = [...text.matchAll(/!?\[([^\]]*)\]/g)];
  linkMatches.forEach(match => {
    const isImage = match[0].startsWith('!');
    const closeBracket = match.index + match[0].length;
    if (closeBracket < text.length && text[closeBracket] === '(') {
      let parenCount = 1;
      let i = closeBracket + 1;
      while (i < text.length && parenCount > 0) {
        if (text[i] === '(') parenCount++;
        if (text[i] === ')') parenCount--;
        i++;
      }
      if (parenCount !== 0) {
        const lineNum = text.slice(0, match.index).split('\n').length;
        const colNum = match.index - text.slice(0, match.index).lastIndexOf('\n');
        errors.push({
          type: 'error',
          category: 'syntax',
          line: lineNum,
          column: colNum,
          message: `Unclosed ${isImage ? 'image' : 'link'} reference`,
        });
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateHtml(text) {
  const errors = [];
  const tagStack = [];
  const selfClosingTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;
  let inTag = false;
  let tagStart = 0;

  for (let i = 0; i < text.length; i++) {
    if (text[i] === '<') {
      inTag = true;
      tagStart = i;
    } else if (text[i] === '>' && inTag) {
      const tagContent = text.slice(tagStart, i + 1);
      inTag = false;

      const tagMatch = tagContent.match(/^<\/?(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        const isClosing = tagContent.startsWith('</');
        const isSelfClosing = selfClosingTags.test(tagName) || tagContent.endsWith('/>');

        if (isClosing) {
          if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
            const lineNum = text.slice(0, tagStart).split('\n').length;
            const colNum = tagStart - text.slice(0, tagStart).lastIndexOf('\n');
            errors.push({
              type: 'error',
              category: 'syntax',
              line: lineNum,
              column: colNum,
              message: `Unexpected closing tag </${tagName}>`,
            });
          } else {
            tagStack.pop();
          }
        } else if (!isSelfClosing) {
          tagStack.push(tagName);
        }
      }
    }
  }

  if (tagStack.length > 0) {
    const unclosed = tagStack[tagStack.length - 1];
    errors.push({
      type: 'error',
      category: 'syntax',
      line: -1,
      column: -1,
      message: `Unclosed tag <${unclosed}>`,
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/* ============================
 *  LINTING
 * ============================ */

function lintMarkdown(text) {
  const warnings = [];

  // Check for common markdown issues
  lines = text.split('\n');
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for trailing whitespace
    if (/\s+$/.test(line)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        line: lineNum,
        column: line.length,
        message: 'Line has trailing whitespace',
      });
    }

    // Check for inconsistent heading spacing
    if (/^#+[^ ]/.test(line)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        line: lineNum,
        column: 1,
        message: 'Heading should have space after # symbols',
      });
    }

    // Check for hard line breaks
    if (line.endsWith('  ') || line.endsWith('\t')) {
      const match = line.match(/( {2,}|\t+)$/);
      if (match) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          line: lineNum,
          column: line.length - match[1].length + 1,
          message: 'Unexpected hard line break syntax',
        });
      }
    }
  });

  return {
    total: warnings.length,
    warnings,
  };
}

function lintHtml(text) {
  const warnings = [];

  // Check for common HTML issues
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;

    // Check for trailing whitespace
    if (/\s+$/.test(line)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        line: lineNum,
        column: line.length,
        message: 'Line has trailing whitespace',
      });
    }

    // Check for deprecated attributes
    if (/\s(align|bgcolor|border|cellpadding|cellspacing|valign|width|height|name|value)=/i.test(line)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        line: lineNum,
        column: 1,
        message: 'Line contains deprecated HTML attributes',
      });
    }

    // Check for missing alt attributes on images
    if (/<img[^>]*>/i.test(line) && !(/alt=/i.test(line))) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        line: lineNum,
        column: 1,
        message: 'Image tag missing alt attribute',
      });
    }
  });

  return {
    total: warnings.length,
    warnings,
  };
}

/* ============================
 *  ENCODE/DECODE MODES
 * ============================ */

function applyEncodeDecodeMode(input, mode) {
  switch (mode) {
    case 'encode-entities':
      if (htmlEntities && htmlEntities.encode) {
        return htmlEntities.encode(input);
      }
      return htmlEncoder(input);

    case 'decode-entities':
      if (htmlEntities && htmlEntities.decode) {
        return htmlEntities.decode(input);
      }
      return htmlDecoder(input);

    case 'encode-html-attr':
      if (htmlEntities && htmlEntities.encode) {
        let result = htmlEntities.encode(input);
        // For HTML attributes, replace &apos; with &#39; (HTML spec requirement)
        result = result.replace(/&apos;/g, '&#39;');
        return result;
      }
      const attrMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };
      return input.replace(/[&<>"']/g, char => attrMap[char] || char);

    case 'encode-js-string':
      if (jsStringEscape) {
        return jsStringEscape(input);
      }
      return input
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');

    case 'encode-json':
      if (jsonEscaping && jsonEscaping.escapeString) {
        return jsonEscaping.escapeString(input);
      }
      return JSON.stringify(input).slice(1, -1);

    default:
      return input;
  }
}

/* ============================
 *  MARKDOWN TO HTML CONVERTER
 * ============================ */

function simpleMarkdownToHtml(text) {
  let html = text;
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gm, '<em>$1</em>');
  html = html.replace(/__(.*?)__/gm, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/gm, '<em>$1</em>');

  html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>');

  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}

/* ============================
 *  HTML TO MARKDOWN CONVERTER
 * ============================ */

function simpleHtmlToMarkdown(text) {
  let markdown = text;
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
  markdown = markdown.replace(/<a[^>]*href=['"](.*?)['"](.*?)>(.*?)<\/a>/gi, '[$3]($1)');
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1');
  markdown = markdown.replace(/<p[^>]*>/gi, '');
  markdown = markdown.replace(/<\/p>/gi, '');
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');
  markdown = markdown.replace(/<[^>]+>/g, '');
  return markdown;
}

/* ============================
 *  HTML BEAUTIFIER
 * ============================ */

function simpleBeautifyHtml(text, indent) {
  const indentStr = indent === 'tab' ? '\t' : indent === '4spaces' ? '    ' : '  ';
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
        result += indentStr.repeat(indentLevel) + tagContent + '\n';
        stack.pop();
      } else {
        result += indentStr.repeat(indentLevel) + tagContent + '\n';
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
 *  MARKDOWN BEAUTIFIER
 * ============================ */

function simpleBeautifyMarkdown(text) {
  const lines = text.split('\n');
  const formatted = [];
  let prevWasEmpty = false;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!prevWasEmpty) {
        formatted.push('');
        prevWasEmpty = true;
      }
    } else {
      formatted.push(trimmed);
      prevWasEmpty = false;
    }
  });

  return formatted.join('\n').trim();
}

/* ============================
 *  MAIN MARKDOWN + HTML FORMATTER
 * ============================ */

function markdownHtmlFormatter(text, config) {
  const {
    convertTo = 'none',
    indent = '2spaces',
    minify = false,
    encodeDecode = 'none',
    showValidation = true,
    showLinting = true,
  } = config;

  try {
    if (!text || typeof text !== 'string') {
      return { error: 'Invalid input: Please provide Markdown or HTML content', hideOutput: true };
    }

    const trimmed = text.trim();
    if (!trimmed) {
      return { error: 'Empty input: Please provide Markdown or HTML content', hideOutput: true };
    }

    let result = trimmed;
    let isMarkdown = false;
    let isHtml = false;
    const diagnostics = [];

    // Detect input type
    const markdownPatterns = /^#{1,6}\s|^\s*[-*]\s|^\s*\d+\.|^>\s|```|~~|__.*__|\*\*.*\*\*|\[.*\]\(.*\)/m;
    const htmlPatterns = /<[a-z][\w\s="'/:.-]*>/i;

    isMarkdown = markdownPatterns.test(trimmed);
    isHtml = htmlPatterns.test(trimmed);

    // VALIDATION
    let validationResult = { isValid: true, errors: [] };
    if (showValidation) {
      if (isHtml) {
        validationResult = validateHtml(trimmed);
      } else if (isMarkdown) {
        validationResult = validateMarkdown(trimmed);
      }

      if (!validationResult.isValid) {
        diagnostics.push(
          ...validationResult.errors.map((e) => ({
            type: 'error',
            category: 'syntax',
            line: e.line,
            column: e.column,
            message: e.message,
          }))
        );
      }
    }

    // Format the content
    if (convertTo === 'html' && isMarkdown) {
      result = simpleMarkdownToHtml(trimmed);
    } else if (convertTo === 'markdown' && isHtml) {
      if (typeof window === 'undefined') {
        try {
          const TurndownService = require('turndown');
          const turndownService = new TurndownService();
          result = turndownService.turndown(trimmed);
        } catch (e) {
          result = simpleHtmlToMarkdown(trimmed);
        }
      } else {
        result = simpleHtmlToMarkdown(trimmed);
      }
    } else {
      result = trimmed;
    }

    // Apply minify/beautify
    if (minify) {
      if (result.includes('<') && result.includes('>')) {
        result = result
          .replace(/<!--[\s\S]*?-->/g, '')
          .replace(/>\s+</g, '><')
          .replace(/\s{2,}/g, ' ')
          .replace(/\n/g, '')
          .trim();
      } else {
        result = result
          .replace(/\n\n+/g, '\n\n')
          .replace(/^\s+/m, '')
          .replace(/\s+$/m, '')
          .replace(/  +/g, ' ')
          .trim();
      }
    } else {
      if (result.includes('<') && result.includes('>')) {
        if (typeof window === 'undefined') {
          try {
            const { html: beautifyHtml } = require('js-beautify');
            const indentSize = indent === '4spaces' ? 4 : indent === 'tab' ? 1 : 2;
            const indentChar = indent === 'tab' ? '\t' : ' ';

            result = beautifyHtml(result, {
              indent_size: indentSize,
              indent_char: indentChar,
              wrap_line_length: 80,
              preserve_newlines: true,
            });
          } catch (e) {
            result = simpleBeautifyHtml(result, indent);
          }
        } else {
          result = simpleBeautifyHtml(result, indent);
        }
      } else {
        result = simpleBeautifyMarkdown(result);
      }
    }

    // Apply encoding/decoding
    if (encodeDecode !== 'none') {
      result = applyEncodeDecodeMode(result, encodeDecode);
    }

    // LINTING
    if (showLinting && validationResult.isValid) {
      let lintResult = { total: 0, warnings: [] };
      if (result.includes('<') && result.includes('>')) {
        lintResult = lintHtml(result);
      } else {
        lintResult = lintMarkdown(result);
      }

      if (lintResult.warnings && lintResult.warnings.length > 0) {
        diagnostics.push(...lintResult.warnings);
      }
    }

    return {
      formatted: result,
      isWellFormed: validationResult.isValid,
      showValidation,
      showLinting,
      validation: validationResult,
      diagnostics,
    };
  } catch (error) {
    return { error: `Error: ${error.message}`, hideOutput: true };
  }
}

/* ============================
 *  SIMPLE MARKDOWN TO HTML
 * ============================ */

function markdownToHtml(text) {
  let html = text;

  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  html = html.replace(/\*\*(.*?)\*\*/gm, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gm, '<em>$1</em>');
  html = html.replace(/__(.*?)__/gm, '<strong>$1</strong>');
  html = html.replace(/_(.*?)_/gm, '<em>$1</em>');

  html = html.replace(/\[(.*?)\]\((.*?)\)/gm, '<a href="$2">$1</a>');

  html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

  html = html.replace(/\n\n/g, '</p><p>');
  html = '<p>' + html + '</p>';

  return html;
}

module.exports = {
  markdownHtmlFormatter,
  markdownToHtml,
  applyEncodeDecodeMode,
  simpleMarkdownToHtml,
  simpleHtmlToMarkdown,
  simpleBeautifyHtml,
  simpleBeautifyMarkdown,
};
