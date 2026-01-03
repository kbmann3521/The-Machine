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
  const lines = text.split('\n');
  let lastHeadingLevel = 0;
  let headingTexts = new Set();
  let inCodeBlock = false;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmedLine = line.trim();

    // Track code blocks - don't lint inside them
    if (trimmedLine.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      return;
    }
    if (inCodeBlock) {
      return;
    }

    // 1. Hard line breaks (double space at end) - includes trailing whitespace check
    if (/\s{2,}$/.test(line) || line.endsWith('\t')) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'hard-line-break',
        line: lineNum,
        column: line.lastIndexOf(line.match(/\s+$/)[0]) + 1,
        message: 'Hard line break detected (two spaces at end of line)',
      });
    } else if (/\s+$/.test(line)) {
      // Only warn about trailing whitespace if it's not a hard line break
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'trailing-whitespace',
        line: lineNum,
        column: line.lastIndexOf(line.match(/\s+$/)[0]) + 1,
        message: 'Line has trailing whitespace',
      });
    }

    // 3. Heading checks
    // First, detect if line looks like it's trying to be a heading (starts with #)
    const potentialHeadingMatch = trimmedLine.match(/^(#{1,6})(.*)$/);
    if (potentialHeadingMatch) {
      const hashes = potentialHeadingMatch[1];
      const rest = potentialHeadingMatch[2];
      const level = hashes.length;

      // Check for missing space after hashes (the critical fix)
      if (!rest.startsWith(' ') && rest.length > 0) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'heading-space',
          line: lineNum,
          column: level + 1,
          message: 'Heading must have a space after # symbols',
        });
      }

      // Only process as valid heading if it has proper spacing
      const validHeadingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (validHeadingMatch) {
        const headingText = validHeadingMatch[2].trim();

        // Check for skipped heading levels
        if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'heading-increment',
            line: lineNum,
            column: level + 1,
            message: `Heading level skipped: jumped from H${lastHeadingLevel} to H${level}`,
          });
        }

        // Check for punctuation at end of heading
        if (/[.!?;:,]$/.test(headingText)) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'heading-punctuation',
            line: lineNum,
            column: trimmedLine.length,
            message: 'Heading should not end with punctuation',
          });
        }

        // Check for duplicate headings
        if (headingTexts.has(headingText.toLowerCase())) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'duplicate-heading',
            line: lineNum,
            column: level + 1,
            message: 'Duplicate heading detected',
          });
        }
        headingTexts.add(headingText.toLowerCase());
        lastHeadingLevel = level;
      }
    }

    // 4. Multiple H1s
    if (/^#\s+/.test(trimmedLine) && lineNum > 1) {
      const previousH1 = lines.slice(0, idx).some(l => /^#\s+/.test(l.trim()));
      if (previousH1) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'no-multiple-h1',
          line: lineNum,
          column: 2,
          message: 'Document should have only one H1 heading',
        });
      }
    }

    // 5. Bare URLs (not in angle brackets)
    const bareUrlMatch = trimmedLine.match(/(?<![\[\(<])https?:\/\/[^\s\]">]+/);
    if (bareUrlMatch && !trimmedLine.includes(`[${bareUrlMatch[0]}`)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'bare-url',
        line: lineNum,
        column: line.indexOf(bareUrlMatch[0]) + 1,
        message: 'URL should be wrapped in angle brackets <> or markdown link []() syntax',
      });
    }

    // 6. List issues
    if (/^\s*[-*+]\s+/.test(line)) {
      // Check indentation consistency
      const indent = line.match(/^(\s*)/)[1].length;
      if (indent % 2 !== 0 && indent % 4 !== 0) {
        // Warn on odd indents (should be multiples of 2 or 4)
        // Only warn on deeper nesting, not top level
        if (indent > 0) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'list-indent',
            line: lineNum,
            column: indent + 1,
            message: 'List indentation should be 2 or 4 spaces',
          });
        }
      }

      // Check for missing space after marker
      if (/^\s*[-*+][^\s]/.test(line)) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'list-marker-space',
          line: lineNum,
          column: line.indexOf(line.match(/[-*+]/)[0]) + 2,
          message: 'List item must have a space after marker',
        });
      }
    }

    // 7. Numbered list issues
    if (/^\s*\d+\.\s+/.test(line)) {
      // Check for space after period
      if (/^\s*\d+\.[^\s]/.test(line)) {
        const numMatch = trimmedLine.match(/^\d+/);
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'ordered-list-space',
          line: lineNum,
          column: (numMatch ? numMatch[0].length : 1) + 2,
          message: 'Ordered list must have a space after period',
        });
      }
    }

    // 8. Unmatched brackets/parentheses (basic check)
    const openBrackets = (trimmedLine.match(/\[/g) || []).length;
    const closeBrackets = (trimmedLine.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'unmatched-brackets',
        line: lineNum,
        column: (trimmedLine.indexOf('[') >= 0 ? trimmedLine.indexOf('[') : trimmedLine.indexOf(']')) + 1,
        message: 'Unmatched square brackets detected',
      });
    }

    const openParens = (trimmedLine.match(/\(/g) || []).length;
    const closeParens = (trimmedLine.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'unmatched-parens',
        line: lineNum,
        column: (trimmedLine.indexOf('(') >= 0 ? trimmedLine.indexOf('(') : trimmedLine.indexOf(')')) + 1,
        message: 'Unmatched parentheses detected',
      });
    }

    // 9. Link syntax issues
    if (/\[.+?\]/.test(trimmedLine) && !/\[.+?\]\(.+?\)/.test(trimmedLine)) {
      // Has brackets but no matching parentheses
      const bracketMatch = trimmedLine.match(/\[.+?\]/);
      if (bracketMatch) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'link-syntax',
          line: lineNum,
          column: trimmedLine.indexOf(bracketMatch[0]) + bracketMatch[0].length + 1,
          message: 'Link text in brackets should be followed by URL in parentheses',
        });
      }
    }

    // 10. Table issues (basic)
    if (/\|/.test(trimmedLine)) {
      const cellCount = trimmedLine.split('|').length - 1;
      // Check if it looks like a table but is incomplete
      if (cellCount < 3 && !trimmedLine.startsWith('|')) {
        // Probably not a real table attempt, skip
      } else if (cellCount % 2 === 0) {
        // Could be a table row
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'table-format',
          line: lineNum,
          column: trimmedLine.indexOf('|') + 1,
          message: 'Table row should start and end with |',
        });
      }
    }

    // 11. Emphasis consistency (basic)
    const asterisks = (trimmedLine.match(/\*/g) || []).length;
    const underscores = (trimmedLine.match(/_/g) || []).length;
    if (asterisks % 2 !== 0) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'unmatched-emphasis',
        line: lineNum,
        column: trimmedLine.indexOf('*') + 1,
        message: 'Unmatched emphasis asterisks (should be paired)',
      });
    }
    if (underscores % 2 !== 0 && !trimmedLine.includes('_blank')) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'unmatched-emphasis',
        line: lineNum,
        column: trimmedLine.indexOf('_') + 1,
        message: 'Unmatched emphasis underscores (should be paired)',
      });
    }

    // 12. Empty lines between elements
    if (trimmedLine === '' && idx > 0 && idx < lines.length - 1) {
      const prevLine = lines[idx - 1].trim();
      const nextLine = lines[idx + 1].trim();
      if (prevLine === '' && nextLine === '') {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'excessive-blank-lines',
          line: lineNum,
          column: 1,
          message: 'Excessive blank lines detected',
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

    // LINTING (on original input, before beautification)
    if (showLinting && validationResult.isValid) {
      let lintResult = { total: 0, warnings: [] };
      // Lint the original input to catch real issues
      if (isMarkdown) {
        lintResult = lintMarkdown(trimmed);
      } else if (isHtml || result.includes('<') && result.includes('>')) {
        lintResult = lintHtml(trimmed);
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
};
