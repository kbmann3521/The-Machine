// lib/tools/markdownFormatter.js

const { classifyMarkdownHtmlInput, ContentMode } = require('../contentClassifier');

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

  let inComment = false;
  let commentStart = 0;

  for (let i = 0; i < text.length; i++) {
    // Check for comment start
    if (!inComment && text.substr(i, 4) === '<!--') {
      inComment = true;
      commentStart = i;
      i += 3; // Skip ahead (loop will increment i)
      continue;
    }

    // Check for comment end
    if (inComment && text.substr(i, 3) === '-->') {
      inComment = false;
      i += 2; // Skip ahead (loop will increment i)
      continue;
    }

    // Skip tag parsing while inside a comment
    if (inComment) {
      continue;
    }

    // Parse tags only outside of comments
    if (text[i] === '<') {
      const tagStart = i;
      let tagEnd = -1;
      let inQuote = false;
      let quoteChar = null;

      // Find the closing '>' of this tag, accounting for quoted attributes
      for (let j = i + 1; j < text.length; j++) {
        const char = text[j];
        const prevChar = j > 0 ? text[j - 1] : '';

        // Handle quotes in attributes
        if ((char === '"' || char === "'") && prevChar !== '\\') {
          if (!inQuote) {
            inQuote = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuote = false;
            quoteChar = null;
          }
        }

        // Look for closing '>' only if we're not inside a quoted attribute
        if (char === '>' && !inQuote) {
          tagEnd = j;
          break;
        }
      }

      // Skip this '<' if we didn't find a matching '>'
      if (tagEnd === -1) {
        continue;
      }

      const tagContent = text.slice(tagStart, tagEnd + 1);
      i = tagEnd; // Move cursor past the tag

      const tagMatch = tagContent.match(/^<\/?(\w+)/);
      if (tagMatch) {
        const tagName = tagMatch[1].toLowerCase();
        const isClosing = tagContent.startsWith('</');
        const isSelfClosing = selfClosingTags.test(tagName) || tagContent.endsWith('/>');

        const lineNum = text.slice(0, tagStart).split('\n').length;
        const colNum = tagStart - text.slice(0, tagStart).lastIndexOf('\n');

        if (isClosing) {
          if (tagStack.length === 0 || tagStack[tagStack.length - 1].name !== tagName) {
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
          tagStack.push({ name: tagName, line: lineNum, column: colNum });
        }
      }
    }
  }

  // Report unclosed tags with their original location
  if (tagStack.length > 0) {
    tagStack.forEach((unclosedTag) => {
      errors.push({
        type: 'error',
        category: 'syntax',
        line: unclosedTag.line,
        column: unclosedTag.column,
        message: `Unclosed tag <${unclosedTag.name}> (opened on line ${unclosedTag.line})`,
      });
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

/* ============================
 *  SEMANTIC VALIDATION (MOVED TO LINTING)
 * ============================ */

// NOTE: Semantic HTML checks (multiple H1, heading levels, etc.)
// have been moved to lintHtml() as advisory warnings.
// This ensures they never block validation or prevent linting from running.

/* ============================
 *  LINTING (HTML)
 * ============================ */

function lintHtml(text) {
  const warnings = [];
  const lines = text.split('\n');

  // ========================================
  // SEMANTIC STRUCTURE CHECKS (document-level)
  // ========================================

  // Multiple H1 tags
  let h1Count = 0;
  let h1Positions = [];
  const h1Regex = /<h1[^>]*>/gi;
  let h1Match;
  while ((h1Match = h1Regex.exec(text)) !== null) {
    h1Count++;
    const lineNum = text.slice(0, h1Match.index).split('\n').length;
    h1Positions.push({ count: h1Count, lineNum });
    if (h1Count > 1) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'multiple-h1',
        severity: 'high',
        line: lineNum,
        column: 1,
        message: 'Document should have only one <h1> tag',
      });
    }
  }

  // Heading level skips
  let lastHeadingLevel = 0;
  const headingRegex = /<h([1-6])[^>]*>/gi;
  let headingMatch;
  while ((headingMatch = headingRegex.exec(text)) !== null) {
    const level = parseInt(headingMatch[1]);
    const lineNum = text.slice(0, headingMatch.index).split('\n').length;

    if (lastHeadingLevel > 0 && level > lastHeadingLevel + 1) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'heading-increment',
        severity: 'medium',
        line: lineNum,
        column: 1,
        message: `Heading level skipped: H${lastHeadingLevel} → H${level}`,
      });
    }

    lastHeadingLevel = level;
  }

  // Label-for cross-reference validation (accessibility)
  const idSet = new Set();
  const labelFors = [];

  // Collect all IDs in the document
  const idRegex = /\bid=["']([^"']+)["']/gi;
  let idMatch;
  while ((idMatch = idRegex.exec(text)) !== null) {
    idSet.add(idMatch[1]);
  }

  // Collect all labels with for attributes
  const labelRegex = /<label[^>]*\bfor=["']([^"']+)["'][^>]*>/gi;
  let labelMatch;
  while ((labelMatch = labelRegex.exec(text)) !== null) {
    const forValue = labelMatch[1];
    const lineNum = text.slice(0, labelMatch.index).split('\n').length;
    labelFors.push({ forValue, lineNum, label: labelMatch[0] });
  }

  // Verify each label references an existing ID
  labelFors.forEach(label => {
    if (!idSet.has(label.forValue)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'label-for-missing',
        severity: 'high',
        line: label.lineNum,
        column: 1,
        message: `Label references non-existent id="${label.forValue}"`,
      });
    }
  });

  // Form context detection (for input name requirements)
  // Track which lines are inside <form> tags for context-aware linting
  const formRanges = [];
  const formOpenRegex = /<form[\s>]/gi;
  const formCloseRegex = /<\/form\s*>/gi;
  let formOpenMatch;
  let formCloseMatch;

  // Find all form opening tags
  const formOpens = [];
  while ((formOpenMatch = formOpenRegex.exec(text)) !== null) {
    const lineNum = text.slice(0, formOpenMatch.index).split('\n').length;
    formOpens.push(lineNum);
  }

  // Find all form closing tags
  const formCloses = [];
  while ((formCloseMatch = formCloseRegex.exec(text)) !== null) {
    const lineNum = text.slice(0, formCloseMatch.index).split('\n').length;
    formCloses.push(lineNum);
  }

  // Build ranges of lines that are inside forms
  for (let i = 0; i < formOpens.length; i++) {
    const openLine = formOpens[i];
    const closeLine = formCloses[i] || lines.length; // If no close tag, assume to EOF
    formRanges.push({ start: openLine, end: closeLine });
  }

  // Helper function to check if a line is inside a form
  const isInsideForm = (lineNum) => {
    return formRanges.some(range => lineNum >= range.start && lineNum <= range.end);
  };

  // ========================================
  // LINE-BY-LINE LINTING (best practices & accessibility)
  // ========================================

  // Second pass: lint all lines for best practices and accessibility
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmedLine = line.trim();

    // ========================================
    // 0. RAW TEXT THAT LOOKS LIKE HTML
    // ========================================

    // Detect raw text like "Unclosed tag <h1>" that contains HTML-like syntax
    // This helps users understand why they might be getting validation errors
    if (!trimmedLine.startsWith('<!--') && !trimmedLine.startsWith('<!')) {
      // Look for patterns like "<tagname>" in text that's not pure markup
      const tagLikeMatch = trimmedLine.match(/<([a-z][a-z0-9]*)[^>]*>/i);

      if (tagLikeMatch) {
        const tagContent = tagLikeMatch[0];
        const tagName = tagLikeMatch[1].toLowerCase();
        const beforeTag = trimmedLine.slice(0, trimmedLine.indexOf(tagContent)).trim();
        const afterTag = trimmedLine.slice(trimmedLine.indexOf(tagContent) + tagContent.length).trim();

        // Only warn if this looks like documentation/text, not markup
        // (e.g., "Unclosed tag <h1>" where there's text before the tag)
        const looksLikeDocumentation = beforeTag.length > 0 && !/^<\w/.test(beforeTag);

        if (looksLikeDocumentation) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'raw-html-in-text',
            severity: 'high',
            line: lineNum,
            column: line.indexOf(tagContent) + 1,
            message: `Text contains '${tagContent}' which is interpreted as HTML. Escape it (&lt;${tagName}&gt;) or wrap the line in an HTML comment (<!-- -->) if it's documentation.`,
          });
        }
      }
    }

    // ========================================
    // 1. WHITESPACE & FORMATTING
    // ========================================

    // Trailing whitespace
    if (/\s+$/.test(line) && trimmedLine.length > 0) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'trailing-whitespace',
        severity: 'low',
        line: lineNum,
        column: line.length - (line.match(/\s+$/)[0].length),
        message: 'Line has trailing whitespace',
      });
    }

    // ========================================
    // 2. ACCESSIBILITY RULES
    // ========================================

    // Missing or empty alt attributes on images
    if (/<img[^>]*>/i.test(trimmedLine)) {
      const imgMatch = trimmedLine.match(/<img[^>]*>/i);
      if (imgMatch) {
        const imgTag = imgMatch[0];

        if (!/alt=/i.test(imgTag)) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'missing-alt',
            severity: 'high',
            line: lineNum,
            column: line.indexOf(imgMatch[0]) + 1,
            message: 'Image tag missing alt attribute (accessibility issue)',
          });
        } else if (/alt=["']["']/i.test(imgTag) || /alt=["']\s*["']/i.test(imgTag)) {
          // Empty alt attribute
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'empty-alt',
            severity: 'high',
            line: lineNum,
            column: line.indexOf(imgMatch[0]) + 1,
            message: 'Image alt attribute should not be empty (provide meaningful description)',
          });
        }
      }
    }

    // Missing href on links
    if (/<a[^>]*>/i.test(trimmedLine)) {
      const aMatch = trimmedLine.match(/<a[^>]*>/i);
      if (aMatch && !/href=/i.test(aMatch[0])) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'missing-href',
          severity: 'high',
          line: lineNum,
          column: line.indexOf(aMatch[0]) + 1,
          message: 'Link tag missing href attribute',
        });
      }
    }

    // Input element missing name attribute
    if (/<input\b/i.test(trimmedLine)) {
      const inputMatch = trimmedLine.match(/<input\b[^>]*/i);
      if (inputMatch && !/name=/i.test(inputMatch[0])) {
        // Check if input is inside a <form> tag
        const inForm = isInsideForm(lineNum);
        const severity = inForm ? 'medium' : 'low';
        const message = inForm
          ? 'Input element missing name attribute (required for form submission)'
          : 'Input element missing name attribute (may be needed for form interaction)';

        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'missing-name',
          severity,
          line: lineNum,
          column: line.indexOf(inputMatch[0]) + 1,
          message,
        });
      }
    }

    // Button with missing text
    if (/<button[^>]*>/i.test(trimmedLine)) {
      const buttonMatch = trimmedLine.match(/<button[^>]*>.*?<\/button>/i);
      if (buttonMatch) {
        const buttonContent = buttonMatch[0].replace(/<[^>]*>/g, '').trim();
        // Check for accessible labels: aria-label or aria-labelledby (NOT title)
        const hasAccessibleLabel = /(aria-label|aria-labelledby)=/i.test(buttonMatch[0]);
        if (!buttonContent && !hasAccessibleLabel) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'empty-button',
            severity: 'high',
            line: lineNum,
            column: line.indexOf(buttonMatch[0]) + 1,
            message: 'Button should have visible text or aria-label/aria-labelledby attribute',
          });
        }
      }
    }

    // ========================================
    // 3. DEPRECATED TAGS
    // ========================================

    const deprecatedTags = ['font', 'center', 'marquee', 'blink', 'embed', 'param', 'applet', 'basefont', 'big', 'strike', 'tt'];
    deprecatedTags.forEach(tag => {
      const tagRegex = new RegExp(`<${tag}[^>]*>|</${tag}>`, 'i');
      if (tagRegex.test(trimmedLine)) {
        const match = trimmedLine.match(tagRegex);
        if (match) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'deprecated-tag',
            severity: 'medium',
            line: lineNum,
            column: line.indexOf(match[0]) + 1,
            message: `Deprecated tag <${tag}> should be replaced with semantic or CSS alternatives`,
          });
        }
      }
    });

    // ========================================
    // 4. DEPRECATED ATTRIBUTES
    // ========================================

    const deprecatedAttrs = ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'valign'];
    deprecatedAttrs.forEach(attr => {
      const attrRegex = new RegExp(`\\s${attr}=`, 'i');
      if (attrRegex.test(trimmedLine)) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'deprecated-attribute',
          severity: 'medium',
          line: lineNum,
          column: line.search(attrRegex) + 1,
          message: `Deprecated attribute ${attr}= should be replaced with CSS`,
        });
      }
    });

    // ========================================
    // 5. AUTHORING QUALITY
    // ========================================

    // Inline styles
    if (/\sstyle\s*=/i.test(trimmedLine)) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'inline-style',
        severity: 'low',
        line: lineNum,
        column: line.search(/\sstyle\s*=/i) + 1,
        message: 'Avoid inline styles; use CSS classes instead',
      });
    }

    // Inline event handlers
    const eventHandlers = ['onclick', 'onload', 'onmouseover', 'onchange', 'onerror', 'onfocus', 'onblur', 'onsubmit'];
    eventHandlers.forEach(handler => {
      const handlerRegex = new RegExp(`\\s${handler}\\s*=`, 'i');
      if (handlerRegex.test(trimmedLine)) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'inline-handler',
          severity: 'low',
          line: lineNum,
          column: line.search(handlerRegex) + 1,
          message: `Avoid inline event handlers (${handler}); use JavaScript event listeners instead`,
        });
      }
    });

    // Potential div soup (excessive divs without semantic meaning)
    const divCount = (trimmedLine.match(/<div[^>]*>/gi) || []).length;
    if (divCount > 2) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        ruleId: 'excessive-divs',
        severity: 'low',
        line: lineNum,
        column: line.indexOf('<div') + 1,
        message: 'Multiple <div> tags on one line; consider using semantic HTML tags',
      });
    }
  });

  return {
    total: warnings.length,
    warnings,
  };
}



/* ============================
 *  MARKDOWN TO HTML CONVERTER
 *  Using remark + rehype for structural correctness
 * ============================ */

const remarkPipelineCache = {
  gfm: null,
  standard: null,
}

function ensureProcessorSetData(processor) {
  if (processor && typeof processor.setData !== 'function') {
    processor.setData = function setData(key, value) {
      if (arguments.length === 1) {
        return this.data(key);
      }
      this.data(key, value);
      return this;
    };
  }
  return processor;
}

/**
 * Initialize the remark pipeline asynchronously
 * Caches the processor for reuse
 */
async function initRemarkPipeline(enableGfm = true) {
  if (typeof window !== 'undefined') {
    return null; // Client-side, not available
  }

  const cacheKey = enableGfm ? 'gfm' : 'standard';
  const cachedProcessor = remarkPipelineCache[cacheKey];
  if (cachedProcessor) {
    return ensureProcessorSetData(cachedProcessor);
  }

  try {
    const { remark } = await import('remark');
    const remarkRehype = await import('remark-rehype');
    const rehypeSanitize = await import('rehype-sanitize');
    const rehypeStringify = await import('rehype-stringify');
    const remarkGfm = enableGfm ? await import('remark-gfm') : null;

    // Create and cache the processor
    const processor = ensureProcessorSetData(remark());

    if (enableGfm && remarkGfm) {
      processor.use(remarkGfm.default || remarkGfm);
    }

    processor
      .use((remarkRehype.default || remarkRehype), {
        // Allow safe HTML tags (same as sanitization schema)
        passThrough: ['raw']
      })
      .use((rehypeSanitize.default || rehypeSanitize), {
        // Sanitization schema - allow safe markdown-generated tags
        tagNames: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'strong', 'em', 'code', 'pre',
          'ul', 'ol', 'li',
          'blockquote',
          'a',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'hr', 'del', 'ins'
        ],
        attributes: {
          a: ['href', 'title'],
          img: ['src', 'alt', 'title'],
          code: ['className'],
          span: ['className']
        },
        dataAttributes: true
      })
      .use((rehypeStringify.default || rehypeStringify));

    remarkPipelineCache[cacheKey] = processor;
    return processor;
  } catch (error) {
    console.warn('Failed to initialize remark pipeline:', error.message);
    return null;
  }
}

/**
 * Convert Markdown to HTML using remark pipeline (async)
 * Produces structurally correct HTML (no <p><h1> nesting)
 * Supports GitHub Flavored Markdown (tables, strikethrough, task lists)
 * Sanitizes output to prevent XSS
 */
async function simpleMarkdownToHtmlAsync(text, options = {}) {
  const { enableGfm = true } = options;
  const processor = await initRemarkPipeline(enableGfm);

  if (!processor) {
    throw new Error('Markdown to HTML conversion pipeline is unavailable in this environment.');
  }

  try {
    const html = await processor.process(text);
    return html.toString();
  } catch (error) {
    const reason = error?.message || 'Unknown error';
    throw Object.assign(new Error(`Markdown conversion failed: ${reason}`), { cause: error });
  }
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

const nodeHtmlMarkdownInstances = new Map();
let nodeHtmlMarkdownModule = null;

function convertHtmlToMarkdown(text, options = {}) {
  const { enableGfm = true } = options;
  const safeText = typeof text === 'string' ? text : '';

  if (!enableGfm || typeof window !== 'undefined') {
    return simpleHtmlToMarkdown(safeText);
  }

  try {
    if (!nodeHtmlMarkdownModule) {
      nodeHtmlMarkdownModule = require('node-html-markdown');
    }

    const NodeHtmlMarkdown =
      nodeHtmlMarkdownModule?.NodeHtmlMarkdown ||
      nodeHtmlMarkdownModule?.default ||
      nodeHtmlMarkdownModule;

    if (!NodeHtmlMarkdown) {
      throw new Error('Unable to load node-html-markdown');
    }

    const cacheKey = 'gfm-enabled';

    if (!nodeHtmlMarkdownInstances.has(cacheKey)) {
      nodeHtmlMarkdownInstances.set(
        cacheKey,
        new NodeHtmlMarkdown({
          bulletMarker: '-',
          codeFence: '```',
          keepDataImages: true,
          useInlineLinks: true,
          useLinkReferenceDefinitions: false,
        })
      );
    }

    const instance = nodeHtmlMarkdownInstances.get(cacheKey);
    return instance.translate(safeText);
  } catch (error) {
    console.warn('node-html-markdown conversion failed:', error?.message || error);
    return simpleHtmlToMarkdown(safeText);
  }
}

/* ============================
 *  HTML BEAUTIFIER
 * ============================ */

function simpleBeautifyHtml(text, indent) {
  const indentStr = indent === 'tab' ? '\t' : indent === '4spaces' ? '    ' : '  ';
  let result = '';
  let indentLevel = 0;
  const selfClosingTags = /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/i;

  const stack = [];
  let i = 0;

  while (i < text.length) {
    // Find the next tag start
    const tagStart = text.indexOf('<', i);
    if (tagStart === -1) {
      // No more tags, add remaining text as content
      const remaining = text.substring(i).trim();
      if (remaining) result += remaining + '\n';
      break;
    }

    // Add any text content before this tag
    const textBefore = text.substring(i, tagStart).trim();
    if (textBefore && textBefore !== '><') {
      result += indentStr.repeat(indentLevel) + textBefore + '\n';
    }

    // Find the tag end, accounting for quoted attributes
    let tagEnd = tagStart + 1;
    let inQuote = false;
    let quoteChar = null;

    while (tagEnd < text.length) {
      const char = text[tagEnd];
      const prevChar = tagEnd > 0 ? text[tagEnd - 1] : '';

      // Handle quotes in attributes
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuote) {
          inQuote = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuote = false;
        }
      }

      // Look for tag end only when not in quotes
      if (char === '>' && !inQuote) {
        break;
      }
      tagEnd++;
    }

    if (tagEnd >= text.length) break;

    const tagContent = text.substring(tagStart, tagEnd + 1);
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

    i = tagEnd + 1;
  }

  return result.trim();
}

/* ============================
 *  MARKDOWN BEAUTIFIER
 * ============================ */

function simpleBeautifyMarkdown(text) {
  const lines = text.split('\n');
  const formatted = [];

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed) {
      formatted.push(trimmed);
    }
  });

  return formatted.join('\n').trim();
}

/* ============================
 *  MAIN MARKDOWN + HTML FORMATTER
 * ============================ */

async function markdownHtmlFormatter(text, config) {
  const {
    convertTo = 'none',
    indent = '2spaces',
    minify = false,
    showValidation = true,
    showLinting = true,
    enableGfm = true,
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
    const diagnostics = [];

    const classification = classifyMarkdownHtmlInput(trimmed);
    const contentMode = classification.mode;
    const isPureMarkdown = contentMode === ContentMode.MARKDOWN;
    const isPureHtml = contentMode === ContentMode.HTML;
    const isMixedContent = contentMode === ContentMode.MIXED;
    const containsMarkdownSyntax = isPureMarkdown || isMixedContent;

    // VALIDATION (Structural Only - Parser-Level Correctness)
    // =========================================================
    // Validation ONLY checks for broken syntax, unclosed tags, etc.
    // Semantic checks (multiple H1, heading order, etc.) are handled by linting.
    let validationResult = { isValid: true, errors: [] };
    if (showValidation) {
      if (isPureHtml) {
        // Structural validation (syntax, tag closure) - ONLY
        validationResult = validateHtml(trimmed);
      } else if (containsMarkdownSyntax) {
        validationResult = validateMarkdown(trimmed);
      }

      // Add all validation errors to diagnostics
      if (!validationResult.isValid) {
        diagnostics.push(
          ...validationResult.errors.map((e) => ({
            type: 'error',
            category: e.category || 'syntax',
            severity: e.severity || 'high',
            line: e.line,
            column: e.column,
            message: e.message,
            ruleId: e.ruleId,
          }))
        );
      }
    }

    // Format / convert the content when allowed
    let appliedConversion = 'none';
    if (convertTo === 'html' && isPureMarkdown) {
      result = await simpleMarkdownToHtmlAsync(trimmed, { enableGfm });
      appliedConversion = 'html';
    } else if (convertTo === 'markdown' && isPureHtml) {
      result = convertHtmlToMarkdown(trimmed, { enableGfm });
      appliedConversion = 'markdown';
    } else if (convertTo !== 'none') {
      const warningMessage = convertTo === 'html'
        ? 'Conversion to HTML is only available when the input is pure Markdown. Mixed content is left untouched.'
        : 'Conversion to Markdown is only available when the input is pure HTML. Mixed content is left untouched.';
      diagnostics.push({
        type: 'warning',
        category: 'conversion',
        severity: 'medium',
        line: null,
        column: null,
        message: warningMessage,
        ruleId: 'conversion-unavailable',
      });
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
          .replace(/^\s+/gm, '')
          .replace(/\s+$/gm, '')
          .replace(/  +/g, ' ')
          .trim();
      }
    } else {
      if (result.includes('<') && result.includes('>')) {
        // Handle HTML with potential iframes containing srcdoc
        // Strategy: extract srcdoc content, beautify outer HTML, restore srcdoc
        const iframeMap = new Map();
        let htmlWithoutIframeSrcdoc = result;
        let iframeCounter = 0;

        // Extract srcdoc content from iframes to protect it from beautification
        const srcdocRegex = /\bsrcdoc\s*=\s*(["'])([\s\S]*?)\1/g;
        let match;

        while ((match = srcdocRegex.exec(result)) !== null) {
          const srcdocContent = match[2];
          const placeholder = `__SRCDOC_PLACEHOLDER_${iframeCounter}__`;

          iframeMap.set(iframeCounter, srcdocContent);

          // Replace the srcdoc value with placeholder in the copy
          const srcdocAttr = match[0];
          const newAttr = `srcdoc="${placeholder}"`;
          htmlWithoutIframeSrcdoc = htmlWithoutIframeSrcdoc.replace(srcdocAttr, newAttr);

          iframeCounter++;
        }

        // Now beautify the HTML (with placeholders instead of actual srcdoc)
        if (typeof window === 'undefined') {
          try {
            const { html: beautifyHtml } = require('js-beautify');
            const indentSize = indent === '4spaces' ? 4 : indent === 'tab' ? 1 : 2;
            const indentChar = indent === 'tab' ? '\t' : ' ';

            htmlWithoutIframeSrcdoc = beautifyHtml(htmlWithoutIframeSrcdoc, {
              indent_size: indentSize,
              indent_char: indentChar,
              wrap_line_length: 80,
              preserve_newlines: false,
            });
          } catch (e) {
            htmlWithoutIframeSrcdoc = simpleBeautifyHtml(htmlWithoutIframeSrcdoc, indent);
          }
        } else {
          htmlWithoutIframeSrcdoc = simpleBeautifyHtml(htmlWithoutIframeSrcdoc, indent);
        }

        // Beautify and restore srcdoc content
        iframeMap.forEach((srcdocContent, index) => {
          const placeholder = `srcdoc="__SRCDOC_PLACEHOLDER_${index}__"`;

          // Beautify the srcdoc content too
          let beautifiedSrcdoc = srcdocContent;
          if (typeof window === 'undefined') {
            try {
              const { html: beautifyHtml } = require('js-beautify');
              const indentSize = indent === '4spaces' ? 4 : indent === 'tab' ? 1 : 2;
              const indentChar = indent === 'tab' ? '\t' : ' ';

              beautifiedSrcdoc = beautifyHtml(srcdocContent, {
                indent_size: indentSize,
                indent_char: indentChar,
                wrap_line_length: 80,
                preserve_newlines: false,
              });
            } catch (e) {
              beautifiedSrcdoc = simpleBeautifyHtml(srcdocContent, indent);
            }
          } else {
            beautifiedSrcdoc = simpleBeautifyHtml(srcdocContent, indent);
          }

          // Restore with beautified content
          const quote = beautifiedSrcdoc.includes('"') ? "'" : '"';
          const restored = `srcdoc=${quote}${beautifiedSrcdoc}${quote}`;
          htmlWithoutIframeSrcdoc = htmlWithoutIframeSrcdoc.replace(placeholder, restored);
        });

        result = htmlWithoutIframeSrcdoc;
      } else {
        result = simpleBeautifyMarkdown(result);
      }
    }

    // LINTING (Always Runs - Even If Validation Fails)
    // ==================================================
    // Linting provides advisory warnings about best practices, accessibility,
    // semantic structure, and code style. It runs regardless of validation status.
    if (showLinting) {
      let lintResult = { total: 0, warnings: [] };
      // Lint the original input to catch real issues
      if (containsMarkdownSyntax) {
        lintResult = lintMarkdown(trimmed);
      } else if (isPureHtml || (result.includes('<') && result.includes('>'))) {
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
      contentMode,
      classification,
      appliedConversion,
    };
  } catch (error) {
    return { error: `Error: ${error.message}`, hideOutput: true };
  }
}

module.exports = {
  markdownHtmlFormatter,
};
