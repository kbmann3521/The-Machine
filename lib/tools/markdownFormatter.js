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
  const { convertTo = 'none', indent = '2spaces', minify = false, encodeDecode = 'none' } = config;

  let result = text;
  let isMarkdown = false;
  let isHtml = false;

  // Detect input type
  const markdownPatterns = /^#{1,6}\s|^\s*[-*]\s|^\s*\d+\.|^>\s|```|~~|__.*__|\*\*.*\*\*|\[.*\]\(.*\)/m;
  const htmlPatterns = /<[a-z][\w\s="'/:.-]*>/i;

  isMarkdown = markdownPatterns.test(text);
  isHtml = htmlPatterns.test(text);

  // Convert if needed - only attempt conversion if libraries are available in server context
  if (convertTo === 'html' && isMarkdown) {
    // Use fallback: simple markdown to HTML conversion
    result = simpleMarkdownToHtml(text);
  } else if (convertTo === 'markdown' && isHtml) {
    // Try to load turndown (only works in server context)
    if (typeof window === 'undefined') {
      try {
        const TurndownService = require('turndown');
        const turndownService = new TurndownService();
        result = turndownService.turndown(text);
      } catch (e) {
        // Fallback: simple HTML to markdown conversion
        result = simpleHtmlToMarkdown(text);
      }
    } else {
      result = simpleHtmlToMarkdown(text);
    }
  }

  // Format the result
  if (minify) {
    // Minify
    if (result.includes('<') && result.includes('>')) {
      // Simple HTML minification (synchronous)
      result = result
        .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
        .replace(/>\s+</g, '><') // Remove space between tags
        .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
        .replace(/\n/g, '') // Remove newlines
        .trim();
    } else {
      // Markdown minification - remove extra whitespace and blank lines
      result = result
        .replace(/\n\n+/g, '\n\n') // Limit consecutive blank lines
        .replace(/^\s+/m, '') // Remove leading whitespace
        .replace(/\s+$/m, '') // Remove trailing whitespace
        .replace(/  +/g, ' ') // Collapse multiple spaces
        .trim();
    }
  } else {
    // Beautify
    if (result.includes('<') && result.includes('>')) {
      // HTML beautification
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
      // Markdown formatting - normalize line breaks and indentation
      result = simpleBeautifyMarkdown(result);
    }
  }

  // Apply encoding/decoding if selected
  if (encodeDecode !== 'none') {
    result = applyEncodeDecodeMode(result, encodeDecode);
  }

  return result;
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
