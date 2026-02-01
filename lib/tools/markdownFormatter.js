// lib/tools/markdownFormatter.js

const { classifyMarkdownHtmlInput, ContentMode } = require('../contentClassifier');
// parse5 is an ESM module, we'll use dynamic import

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

async function validateHtml(text) {
  const errors = [];

  try {
    // Parse the HTML using parse5 (WHATWG spec-compliant)
    // This handles all the edge cases: unclosed tags, embedded script/style, attributes with quotes, etc.
    console.log('[validateHtml] Starting validation');
    const parse5Module = await import('parse5');
    const parse5 = parse5Module.default || parse5Module;
    console.log('[validateHtml] parse5 loaded, parsing text');
    const ast = parse5.parse(text, { sourceCodeLocationInfo: true });
    console.log('[validateHtml] Parsing complete, errors:', errors.length);

    // Helper function to walk the AST and collect unclosed/mismatched tags
    // parse5 automatically fixes malformed HTML per WHATWG spec, but we can detect user errors
    const unclosedTags = new Set();
    const openTags = [];

    function traverse(node) {
      if (node.type === 'tag' || (node.nodeName && node.childNodes)) {
        // Check for unclosed tags by looking at the source location info
        // If a tag was auto-closed by the parser, it means the user didn't close it
        if (node.sourceCodeLocation && node.sourceCodeLocation.startTag) {
          const tagName = node.nodeName || node.name;

          // void elements (self-closing) are expected to not have end tags
          const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];

          // If there's no end tag but it's not a void element, it was implicitly closed
          if (!node.sourceCodeLocation.endTag && !voidElements.includes(tagName)) {
            // Only report if this was user-created HTML, not inserted by parser
            // We can detect this by checking if the tag is not html/body/head (parser-inserted)
            if (!['html', 'head', 'body'].includes(tagName)) {
              // parse5 uses 0-based line numbers, convert to 1-based for CodeMirror
              const lineNum = (node.sourceCodeLocation.startTag?.line ?? 0) + 1;
              const colNum = (node.sourceCodeLocation.startTag?.col ?? 0) + 1;
              console.log('[validateHtml] Unclosed tag:', tagName, 'sourceCodeLocation:', node.sourceCodeLocation, 'lineNum:', lineNum, 'colNum:', colNum);

              // Only report once per tag
              const key = `${tagName}:${lineNum}:${colNum}`;
              if (!unclosedTags.has(key)) {
                unclosedTags.add(key);
                errors.push({
                  type: 'error',
                  category: 'syntax',
                  line: lineNum,
                  column: colNum,
                  message: `Tag <${tagName}> is not properly closed`,
                });
              }
            }
          }
        }

        // Recursively traverse child nodes
        if (node.childNodes && Array.isArray(node.childNodes)) {
          node.childNodes.forEach(child => traverse(child));
        }
      }
    }

    traverse(ast);

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (err) {
    // If parse5 throws, there's a critical syntax error
    return {
      isValid: false,
      errors: [{
        type: 'error',
        category: 'syntax',
        line: 1,
        column: 1,
        message: `HTML parsing error: ${err.message}`,
      }],
    };
  }
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

async function lintHtml(text) {
  const warnings = [];
  const lines = text.split('\n');

  try {
    // Parse HTML using parse5
    console.log('[lintHtml] Starting linting with', lines.length, 'lines');
    const parse5Module = await import('parse5');
    const parse5 = parse5Module.default || parse5Module;
    const ast = parse5.parse(text, { sourceCodeLocationInfo: true });
    console.log('[lintHtml] parse5 parse complete');

    // Helper to extract text content from a node
    const getTextContent = (node) => {
      if (node.type === 'text') return node.value;
      if (node.childNodes && Array.isArray(node.childNodes)) {
        return node.childNodes.map(getTextContent).join('');
      }
      return '';
    };

    // Helper to get attribute value (case-insensitive)
    const getAttrValue = (node, attrName) => {
      if (!node.attrs) return null;
      const attr = node.attrs.find(a => a.name.toLowerCase() === attrName.toLowerCase());
      return attr ? attr.value : null;
    };

    // Helper to check if node has attribute
    const hasAttr = (node, attrName) => {
      if (!node.attrs) return false;
      return node.attrs.some(a => a.name.toLowerCase() === attrName.toLowerCase());
    };

    // Traverse AST and collect violations
    const h1s = [];
    const headings = [];
    const inputs = [];
    const labels = [];
    const ids = new Set();
    const formStack = [];
    let inForm = false;

    // Build a simple position map by finding opening tags in the text
    // This approach directly scans the HTML source for accurate line/column positions
    const buildPositionMap = (tagName) => {
      const positions = [];
      // Match opening tag: <tagName ... or <tagName>
      const regexStr = `<${tagName}(\\s[^>]*)?>|<${tagName}>`;
      const regex = new RegExp(regexStr, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        const textBefore = text.substring(0, match.index);
        const lines = textBefore.split('\n');
        const lineNum = lines.length;
        const colNum = lines[lines.length - 1].length + 1;
        positions.push({ lineNum, colNum });
      }

      return positions;
    };

    // Cache position maps for reuse
    const tagPositions = {
      img: buildPositionMap('img'),
      button: buildPositionMap('button'),
      a: buildPositionMap('a'),
      label: buildPositionMap('label'),
      input: buildPositionMap('input'),
      h1: buildPositionMap('h1'),
      h2: buildPositionMap('h2'),
      h3: buildPositionMap('h3'),
      h4: buildPositionMap('h4'),
      h5: buildPositionMap('h5'),
      h6: buildPositionMap('h6'),
      form: buildPositionMap('form'),
      font: buildPositionMap('font'),
    };

    console.log('[lintHtml] Built position maps. img:', tagPositions.img.length, 'button:', tagPositions.button.length);

    let tagCountByName = {}; // Track which occurrence we're on for each tag type

    const getNextPosition = (tagName) => {
      if (!tagCountByName[tagName]) tagCountByName[tagName] = 0;
      const positions = tagPositions[tagName] || [];
      const pos = positions[tagCountByName[tagName]] || { lineNum: 1, colNum: 1 };
      if (tagCountByName[tagName] < positions.length - 1) {
        tagCountByName[tagName]++;
      }
      return pos;
    };

    const traverse = (node, inFormContext = false) => {
      if (!node || !node.nodeName) return;

      const tagName = node.nodeName.toLowerCase();
      // Get position from our pre-built map
      const pos = getNextPosition(tagName);
      const lineNum = pos.lineNum;
      const colNum = pos.colNum;

      if (tagName === 'img' || tagName === 'button') {
        console.log('[lintHtml] Tag:', tagName, 'pos:', { lineNum, colNum });
      }

      // Track form context
      if (tagName === 'form') {
        formStack.push(true);
        inFormContext = true;
      }

      // Collect IDs
      if (hasAttr(node, 'id')) {
        ids.add(getAttrValue(node, 'id'));
      }

      // H1 check (multiple h1 tags)
      if (tagName === 'h1') {
        h1s.push({ lineNum, colNum });
      }

      // Heading level checks
      if (/^h[1-6]$/.test(tagName)) {
        const level = parseInt(tagName[1]);
        headings.push({ level, lineNum, colNum, tagName });
      }

      // Label with for attribute
      if (tagName === 'label' && hasAttr(node, 'for')) {
        labels.push({
          forValue: getAttrValue(node, 'for'),
          lineNum,
          colNum,
        });
      }

      // Input missing name (in form context)
      if (tagName === 'input' && !hasAttr(node, 'name')) {
        inputs.push({
          lineNum,
          colNum,
          inForm: inFormContext,
        });
      }

      // Image tag accessibility
      if (tagName === 'img') {
        if (!hasAttr(node, 'alt')) {
          console.log('[lintHtml] Creating missing-alt warning at', { lineNum, colNum });
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'missing-alt',
            severity: 'high',
            line: lineNum,
            column: colNum,
            message: 'Image tag missing alt attribute (accessibility issue)',
          });
        } else {
          const altValue = getAttrValue(node, 'alt');
          if (!altValue || altValue.trim() === '') {
            warnings.push({
              type: 'warning',
              category: 'lint',
              ruleId: 'empty-alt',
              severity: 'high',
              line: lineNum,
              column: colNum,
              message: 'Image alt attribute should not be empty (provide meaningful description)',
            });
          }
        }
      }

      // Link accessibility
      if (tagName === 'a' && !hasAttr(node, 'href')) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'missing-href',
          severity: 'high',
          line: lineNum,
          column: colNum,
          message: 'Link tag missing href attribute',
        });
      }

      // Button accessibility
      if (tagName === 'button') {
        const hasAccessibleLabel = hasAttr(node, 'aria-label') || hasAttr(node, 'aria-labelledby');
        const textContent = getTextContent(node).trim();
        if (!textContent && !hasAccessibleLabel) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'empty-button',
            severity: 'high',
            line: lineNum,
            column: colNum,
            message: 'Button should have visible text or aria-label/aria-labelledby attribute',
          });
        }
      }

      // Deprecated tags
      const deprecatedTags = ['font', 'center', 'marquee', 'blink', 'embed', 'param', 'applet', 'basefont', 'big', 'strike', 'tt'];
      if (deprecatedTags.includes(tagName)) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'deprecated-tag',
          severity: 'medium',
          line: lineNum,
          column: colNum,
          message: `Deprecated tag <${tagName}> should be replaced with semantic or CSS alternatives`,
        });
      }

      // Deprecated attributes
      const deprecatedAttrs = ['align', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'valign'];
      if (node.attrs) {
        node.attrs.forEach(attr => {
          if (deprecatedAttrs.includes(attr.name.toLowerCase())) {
            warnings.push({
              type: 'warning',
              category: 'lint',
              ruleId: 'deprecated-attribute',
              severity: 'medium',
              line: lineNum,
              column: colNum,
              message: `Deprecated attribute ${attr.name}= should be replaced with CSS`,
            });
          }

          // Inline styles
          if (attr.name.toLowerCase() === 'style') {
            warnings.push({
              type: 'warning',
              category: 'lint',
              ruleId: 'inline-style',
              severity: 'low',
              line: lineNum,
              column: colNum,
              message: 'Avoid inline styles; use CSS classes instead',
            });
          }

          // Inline event handlers
          const eventHandlers = ['onclick', 'onload', 'onmouseover', 'onchange', 'onerror', 'onfocus', 'onblur', 'onsubmit'];
          if (eventHandlers.includes(attr.name.toLowerCase())) {
            warnings.push({
              type: 'warning',
              category: 'lint',
              ruleId: 'inline-handler',
              severity: 'low',
              line: lineNum,
              column: colNum,
              message: `Avoid inline event handlers (${attr.name}); use JavaScript event listeners instead`,
            });
          }
        });
      }

      // Recurse into children (but skip script/style content)
      if (node.childNodes && Array.isArray(node.childNodes) && tagName !== 'script' && tagName !== 'style') {
        node.childNodes.forEach(child => traverse(child, inFormContext));
      }

      // Track form exit
      if (tagName === 'form') {
        formStack.pop();
      }
    };

    traverse(ast);

    // Post-processing: check h1 counts
    if (h1s.length > 1) {
      h1s.forEach((h1, idx) => {
        if (idx > 0) {
          warnings.push({
            type: 'warning',
            category: 'lint',
            ruleId: 'multiple-h1',
            severity: 'high',
            line: h1.lineNum,
            column: h1.colNum,
            message: 'Document should have only one <h1> tag',
          });
        }
      });
    }

    // Check heading level increments
    let lastHeadingLevel = 0;
    headings.forEach(heading => {
      if (lastHeadingLevel > 0 && heading.level > lastHeadingLevel + 1) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'heading-increment',
          severity: 'medium',
          line: heading.lineNum,
          column: heading.colNum,
          message: `Heading level skipped: H${lastHeadingLevel} → H${heading.level}`,
        });
      }
      lastHeadingLevel = heading.level;
    });

    // Check label-for references
    labels.forEach(label => {
      if (!ids.has(label.forValue)) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'label-for-missing',
          severity: 'high',
          line: label.lineNum,
          column: label.colNum,
          message: `Label references non-existent id="${label.forValue}"`,
        });
      }
    });

    // Check input names in forms
    inputs.forEach(input => {
      if (input.inForm) {
        warnings.push({
          type: 'warning',
          category: 'lint',
          ruleId: 'missing-name',
          severity: 'medium',
          line: input.lineNum,
          column: input.colNum,
          message: 'Input element missing name attribute (required for form submission)',
        });
      }
    });

    return {
      total: warnings.length,
      warnings,
    };
  } catch (err) {
    // If parsing fails, return empty warnings (parse5 is forgiving)
    return {
      total: 0,
      warnings: [],
    };
  }
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

    let trimmed = text.trim();
    if (!trimmed) {
      return { error: 'Empty input: Please provide Markdown or HTML content', hideOutput: true };
    }

    // Normalize HTML: close any unclosed style tags and document tags
    // This ensures incomplete HTML fragments are properly parsed throughout the pipeline
    if (trimmed.includes('<style')) {
      const openStyleCount = (trimmed.match(/<style[^>]*>/gi) || []).length
      const closeStyleCount = (trimmed.match(/<\/style>/gi) || []).length
      if (openStyleCount > closeStyleCount) {
        for (let i = 0; i < openStyleCount - closeStyleCount; i++) {
          trimmed += '\n</style>'
        }
      }
    }

    // Close document tags if they're missing
    if (!trimmed.match(/<\/body\s*>/i) && trimmed.includes('<')) {
      trimmed += '\n</body>'
    }
    if (!trimmed.match(/<\/html\s*>/i) && trimmed.includes('<')) {
      trimmed += '\n</html>'
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
        validationResult = await validateHtml(trimmed);
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
      // Note: No need to mask <style> tags anymore - parse5 handles it correctly
      if (containsMarkdownSyntax) {
        lintResult = lintMarkdown(trimmed);
      } else if (isPureHtml || (result.includes('<') && result.includes('>'))) {
        lintResult = await lintHtml(trimmed);
      }

      if (lintResult.warnings && lintResult.warnings.length > 0) {
        diagnostics.push(...lintResult.warnings);
      }
    }

    console.log('[markdownHtmlFormatter] Returning result with', diagnostics.length, 'diagnostics');
    console.log('[markdownHtmlFormatter] Diagnostics:', diagnostics.slice(0, 3));
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
