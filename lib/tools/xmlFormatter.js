// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');

/* ============================
 *  VALIDATION (STRICT)
 * ============================ */

/**
 * STRICT XML validation using fast-xml-parser.
 * Returns { isValid: boolean, errors: [{ line, column, message }] }
 */
function strictValidate(xmlString) {
  const result = XMLValidator.validate(xmlString, {
    allowBooleanAttributes: true,
  });

  if (result === true) {
    return { isValid: true, errors: [] };
  }

  const err = result.err || {};
  return {
    isValid: false,
    errors: [
      {
        line: err.line || null,
        column: err.col || null,
        message: err.msg || 'Invalid XML',
      },
    ],
  };
}

/* ============================
 *  DIAGNOSTICS ENGINE (STRUCTURAL)
 * ============================ */

/**
 * Convert a character offset into { line, column }.
 * Lines/columns are 1-based.
 */
function offsetToLineCol(text, offset) {
  const upTo = text.slice(0, offset);
  const lines = upTo.split(/\r?\n/);
  const line = lines.length;
  const column = (lines[lines.length - 1] || '').length + 1;
  return { line, column };
}

/**
 * Collect structural / syntax diagnostics without trying to auto-repair.
 * Returns an array of diagnostics:
 * {
 *   type: 'error' | 'warning',
 *   category: 'structure' | 'syntax' | 'name' | 'attribute' | 'text',
 *   message: string,
 *   line: number | null,
 *   column: number | null
 * }
 */
function collectStructuralDiagnostics(xmlString) {
  const errors = [];

  // Tokenize into: text, comment, cdata, declaration, tag, processing-instruction
  const tokenRe =
    /(<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?xml[\s\S]*?\?>|<\?[^>]*\?>|<[^>]+>)/g;

  const tokens = [];
  let lastIndex = 0;
  let m;

  while ((m = tokenRe.exec(xmlString)) !== null) {
    if (m.index > lastIndex) {
      tokens.push({
        type: 'text',
        value: xmlString.slice(lastIndex, m.index),
        start: lastIndex,
        end: m.index,
      });
    }

    const raw = m[0];
    let type = 'tag';
    if (raw.startsWith('<![CDATA[')) type = 'cdata';
    else if (raw.startsWith('<!--')) type = 'comment';
    else if (/^<\?xml/i.test(raw)) type = 'decl';
    else if (raw.startsWith('<?')) type = 'pi'; // processing instruction
    else type = 'tag';

    tokens.push({
      type,
      value: raw,
      start: m.index,
      end: m.index + raw.length,
    });

    lastIndex = m.index + raw.length;
  }

  if (lastIndex < xmlString.length) {
    tokens.push({
      type: 'text',
      value: xmlString.slice(lastIndex),
      start: lastIndex,
      end: xmlString.length,
    });
  }

  const stack = []; // open element stack: { name, offset }
  const namePattern = /^[A-Za-z_][\w.\-:]*$/;

  for (const tok of tokens) {
    if (tok.type === 'tag') {
      const t = tok.value;
      const trimmed = t.trim();

      const isClose = /^<\s*\//.test(trimmed);
      const isSelfClosing = /\/>\s*$/.test(trimmed);

      const nameMatch = trimmed.match(/^<\s*\/?\s*([^\s/>]+)/);
      const name = nameMatch ? nameMatch[1] : null;

      if (!name) {
        const loc = offsetToLineCol(xmlString, tok.start);
        errors.push({
          type: 'error',
          category: 'syntax',
          message: 'Unable to determine tag name.',
          line: loc.line,
          column: loc.column,
        });
      } else if (!namePattern.test(name)) {
        const nameOffsetInToken = trimmed.indexOf(name);
        const globalOffset = tok.start + nameOffsetInToken;
        const loc = offsetToLineCol(xmlString, globalOffset);
        errors.push({
          type: 'error',
          category: 'name',
          message: `Invalid XML tag name "${name}". Tag names must start with a letter or underscore and contain only letters, digits, hyphens, underscores, periods, or colons.`,
          line: loc.line,
          column: loc.column,
        });
      }

      // Attribute diagnostics for opening / self-closing tags
      if (!isClose) {
        let inner = trimmed.replace(/^<\s*\/?\s*[^\s/>]+/, '');
        inner = inner.replace(/\/?>\s*$/, '');

        const seenAttrs = new Set();

        const attrRe =
          /([A-Za-z_][\w.\-:]*)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/g;
        let ma;
        while ((ma = attrRe.exec(inner)) !== null) {
          const attrName = ma[1];
          const valuePart = ma[2] || '';

          // Approximate attr position in full string
          const innerIdx = inner.indexOf(attrName, ma.index);
          const trimmedIdx = trimmed.indexOf(inner.trim());
          const tagOffset =
            trimmedIdx === -1 ? 0 : trimmedIdx + innerIdx;
          const globalOffset = tok.start + tagOffset;
          const loc = offsetToLineCol(xmlString, globalOffset);

          if (seenAttrs.has(attrName)) {
            errors.push({
              type: 'error',
              category: 'attribute',
              message: `Duplicate attribute "${attrName}" on <${name}>.`,
              line: loc.line,
              column: loc.column,
            });
          } else {
            seenAttrs.add(attrName);
          }

          if (valuePart && !/=\s*("|')/.test(valuePart)) {
            errors.push({
              type: 'error',
              category: 'attribute',
              message: `Attribute "${attrName}" on <${name}> has an unquoted value. XML requires attribute values to be quoted.`,
              line: loc.line,
              column: loc.column,
            });
          }

          // Extract and validate attribute value content (strict XML compliance)
          if (valuePart) {
            const valueMatch = valuePart.match(/=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/);
            if (valueMatch) {
              const attrValue = valueMatch[1] || valueMatch[2] || valueMatch[3] || '';

              // Check for unescaped & (bare ampersand not part of entity reference)
              const bareAmpRe = /&(?!(amp|lt|gt|apos|quot);)/g;
              let ampMatch;
              while ((ampMatch = bareAmpRe.exec(attrValue)) !== null) {
                const ampOffset = globalOffset + (valueMatch[1] !== undefined ? 1 : valueMatch[2] !== undefined ? 1 : 0) + ampMatch.index;
                const ampLoc = offsetToLineCol(xmlString, ampOffset);
                errors.push({
                  type: 'error',
                  category: 'attribute',
                  message: `Unescaped "&" in attribute "${attrName}". Use &amp; instead.`,
                  line: ampLoc.line,
                  column: ampLoc.column,
                });
              }

              // Check for unescaped < inside attribute values
              if (attrValue.includes('<')) {
                const ltIdx = attrValue.indexOf('<');
                const ltOffset = globalOffset + (valueMatch[1] !== undefined ? 1 : valueMatch[2] !== undefined ? 1 : 0) + ltIdx;
                const ltLoc = offsetToLineCol(xmlString, ltOffset);
                errors.push({
                  type: 'error',
                  category: 'attribute',
                  message: `Unescaped "<" in attribute "${attrName}". Use &lt; instead.`,
                  line: ltLoc.line,
                  column: ltLoc.column,
                });
              }

              // Check for control characters in attribute values
              const ctrlRe = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
              let ctrlMatch;
              while ((ctrlMatch = ctrlRe.exec(attrValue)) !== null) {
                const ctrlOffset = globalOffset + (valueMatch[1] !== undefined ? 1 : valueMatch[2] !== undefined ? 1 : 0) + ctrlMatch.index;
                const ctrlLoc = offsetToLineCol(xmlString, ctrlOffset);
                errors.push({
                  type: 'error',
                  category: 'attribute',
                  message: `Invalid control character in attribute "${attrName}".`,
                  line: ctrlLoc.line,
                  column: ctrlLoc.column,
                });
              }
            }
          }
        }
      }

      // Stack / nesting diagnostics
      if (!isClose && !isSelfClosing) {
        // Opening tag
        if (name) {
          stack.push({ name, offset: tok.start });
        }
      } else if (isClose) {
        // Closing tag
        if (!name) {
          const loc = offsetToLineCol(xmlString, tok.start);
          errors.push({
            type: 'error',
            category: 'structure',
            message: 'Closing tag is missing a valid name.',
            line: loc.line,
            column: loc.column,
          });
          continue;
        }

        if (stack.length === 0) {
          const loc = offsetToLineCol(xmlString, tok.start);
          errors.push({
            type: 'error',
            category: 'structure',
            message: `Closing tag </${name}> has no matching opening tag.`,
            line: loc.line,
            column: loc.column,
          });
        } else {
          const top = stack[stack.length - 1];
          if (top.name === name) {
            // Normal close
            stack.pop();
          } else {
            // Find if this name exists deeper in the stack
            const idx = stack.map((s) => s.name).lastIndexOf(name);
            if (idx === -1) {
              const loc = offsetToLineCol(xmlString, tok.start);
              errors.push({
                type: 'error',
                category: 'structure',
                message: `Closing tag </${name}> does not match the most recent open tag <${top.name}>.`,
                line: loc.line,
                column: loc.column,
              });
            } else {
              // Everything above idx is unclosed before this closing tag
              for (let i = stack.length - 1; i > idx; i--) {
                const unclosed = stack[i];
                const loc = offsetToLineCol(xmlString, unclosed.offset);
                errors.push({
                  type: 'error',
                  category: 'structure',
                  message: `Tag <${unclosed.name}> is not closed before </${name}>.`,
                  line: loc.line,
                  column: loc.column,
                });
              }
              stack.length = idx; // drop unclosed
              stack.pop(); // pop the matching element
            }
          }
        }
      }
    } else if (tok.type === 'text') {
      const text = tok.value;
      let match;

      // Unescaped bare '&'
      const bareAmpRe = /&(?!(amp|lt|gt|apos|quot);)/g;
      while ((match = bareAmpRe.exec(text)) !== null) {
        const offset = tok.start + match.index;
        const loc = offsetToLineCol(xmlString, offset);
        errors.push({
          type: 'error',
          category: 'text',
          message:
            'Unescaped "&" character in text node. Use &amp; or a proper entity reference.',
          line: loc.line,
          column: loc.column,
        });
      }

      // Unescaped '<' in text
      const ltRe = /</g;
      while ((match = ltRe.exec(text)) !== null) {
        const offset = tok.start + match.index;
        const loc = offsetToLineCol(xmlString, offset);
        errors.push({
          type: 'error',
          category: 'text',
          message:
            'Unescaped "<" character in text node. Use &lt; or ensure this starts a valid tag.',
          line: loc.line,
          column: loc.column,
        });
      }

      // Control characters
      const ctrlRe = /[\x00-\x08\x0B\x0C\x0E-\x1F]/g;
      while ((match = ctrlRe.exec(text)) !== null) {
        const offset = tok.start + match.index;
        const loc = offsetToLineCol(xmlString, offset);
        errors.push({
          type: 'error',
          category: 'text',
          message: 'Invalid control character in text node.',
          line: loc.line,
          column: loc.column,
        });
      }
    }
  }

  // Remaining unclosed tags on stack
  for (const unclosed of stack) {
    const loc = offsetToLineCol(xmlString, unclosed.offset);
    errors.push({
      type: 'error',
      category: 'structure',
      message: `Tag <${unclosed.name}> is never closed.`,
      line: loc.line,
      column: loc.column,
    });
  }

  return errors;
}

/**
 * High-level diagnostics aggregator:
 * - strictValidate (fast-xml-parser)
 * - structural diagnostics (custom)
 * - lint warnings (simple heuristic checks)
 */
function diagnoseXML(xmlString) {
  const strict = strictValidate(xmlString);
  const structuralErrors = collectStructuralDiagnostics(xmlString);
  const lintWarnings = lintXML(xmlString);

  const strictDiagnostics = strict.isValid
    ? []
    : strict.errors.map((e) => ({
        type: 'error',
        category: 'strict',
        message: e.message || 'Invalid XML',
        line: e.line || null,
        column: e.column || null,
      }));

  const lintDiagnostics = lintWarnings.map((warning) => ({
    type: 'warning',
    category: 'lint',
    message: warning.message,
    warningType: warning.type,
    line: warning.line,
    column: warning.column,
  }));

  const diagnostics = [
    ...structuralErrors,
    ...strictDiagnostics,
    ...lintDiagnostics,
  ];

  return {
    isWellFormed: strict.isValid,
    strict,
    structuralErrors,
    lintWarnings,
    diagnostics,
  };
}

/* ============================
 *  LINTING (HIGH-LEVEL / HEURISTIC)
 * ============================ */

function lintXML(xmlString) {
  const warnings = [];
  const trimmed = xmlString.trim();

  if (!trimmed.startsWith('<?xml')) {
    warnings.push({
      message: 'No XML declaration found (e.g., <?xml version="1.0"?>).',
      type: 'missing-declaration',
      line: null,
      column: null,
    });
  }

  const rootMatch = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/m);
  if (!rootMatch) {
    warnings.push({
      message: 'No clear root element detected.',
      type: 'no-root',
      line: null,
      column: null,
    });
  }

  const topLevelTags = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/gm);
  if (topLevelTags && topLevelTags.length > 1) {
    warnings.push({
      message: 'Multiple top-level elements detected. XML should normally have a single root element.',
      type: 'multiple-roots',
      line: null,
      column: null,
    });
  }

  return warnings;
}

/* ============================
 *  CLEANUP OPTIONS
 * ============================ */

function applyCleanupOptions(xmlString, options = {}) {
  let out = xmlString;

  const {
    removeDeclaration = false,
    removeComments = false,
    removeCDATA = false,
  } = options;

  if (removeDeclaration) {
    out = out.replace(/<\?xml[^>]*\?>\s*/i, '');
  }

  if (removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (removeCDATA) {
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, (match, content) => {
      const inner = content;

      // If inner content has no special XML chars, just trim and return
      if (!/[<>&]/.test(inner)) return inner.trim();

      // Try to validate as raw XML fragment wrapped in a dummy root
      const snippet = `<root>${inner}</root>`;
      const result = XMLValidator.validate(snippet, {
        allowBooleanAttributes: true,
      });

      if (result === true) return inner;

      // Fallback: escape as text
      return inner
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    });
  }

  return out;
}


/* ============================
 *  Collapse empty elements into <tag/>
 * ============================ */

function collapseEmptyElements(xml) {
  return xml.replace(
    /<([A-Za-z0-9:_-]+)([^>]*)>\s*<\/\1>/g,
    (m, tag, attrs) => {
      if (!attrs.trim()) return `<${tag}/>`;
      return m;
    }
  );
}

/* ============================
 *  CUSTOM BEAUTIFIER
 * ============================ */

function beautifyXmlStandard(xmlString, indentUnit = '  ') {
  const tokenRe = /(<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<[^>]+>)/g;
  const tokens = [];
  let pos = 0;
  let m;

  while ((m = tokenRe.exec(xmlString)) !== null) {
    if (m.index > pos) tokens.push(xmlString.slice(pos, m.index));
    tokens.push(m[0]);
    pos = m.index + m[0].length;
  }
  if (pos < xmlString.length) tokens.push(xmlString.slice(pos));

  const isWhitespaceText = (tok) =>
    tok.indexOf('<') === -1 && tok.trim() === '';

  const isCdata = (tok) => tok.startsWith('<![CDATA[');
  const isComment = (tok) => tok.startsWith('<!--');
  const isDecl = (tok) => tok.startsWith('<?');
  const isTag = (tok) =>
    tok.startsWith('<') && tok.endsWith('>') && !isCdata(tok) && !isComment(tok);

  const isCloseTag = (tok) => /^<\/[^>]+>$/.test(tok.trim());
  const isSelfClosing = (tok) => /^<[^!?][^>]*?\/>$/.test(tok.trim());

  const getTagName = (tok) => {
    const match = tok.trim().match(/^<\??\/?\s*([^\s>\/]+)/);
    return match ? match[1] : null;
  };

  const inlineContentKind = (tok) => {
    if (isCdata(tok)) return tok.indexOf('\n') === -1 ? 'cdata' : null;
    if (tok.indexOf('<') === -1 && tok.indexOf('\n') === -1 && tok.trim() !== '')
      return 'text';
    return null;
  };

  const outLines = [];
  let level = 0;
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];

    if (isWhitespaceText(tok)) {
      i++;
      continue;
    }

    if (isComment(tok) || isDecl(tok)) {
      outLines.push(indentUnit.repeat(level) + tok.trim());
      i++;
      continue;
    }

    if (isTag(tok) && !isCloseTag(tok) && !isSelfClosing(tok)) {
      const name = getTagName(tok);

      let j = i + 1;
      while (j < tokens.length && isWhitespaceText(tokens[j])) j++;

      let inlined = false;

      if (j < tokens.length) {
        const kind = inlineContentKind(tokens[j]);
        if (kind) {
          const contentTok = tokens[j];
          let j2 = j + 1;

          while (j2 < tokens.length && isWhitespaceText(tokens[j2])) j2++;

          if (
            j2 < tokens.length &&
            isCloseTag(tokens[j2]) &&
            getTagName(tokens[j2]) === name
          ) {
            const contentStr = contentTok.trim();

            outLines.push(
              indentUnit.repeat(level) +
                tok.trim() +
                contentStr +
                tokens[j2].trim()
            );
            i = j2 + 1;
            inlined = true;
          }
        }
      }

      if (inlined) continue;

      outLines.push(indentUnit.repeat(level) + tok.trim());
      level++;
      i++;
      continue;
    }

    if (isCloseTag(tok)) {
      level = Math.max(0, level - 1);
      outLines.push(indentUnit.repeat(level) + tok.trim());
      i++;
      continue;
    }

    if (isSelfClosing(tok) || isTag(tok)) {
      outLines.push(indentUnit.repeat(level) + tok.trim());
      i++;
      continue;
    }

    if (isCdata(tok)) {
      const raw = tok;
      const innerRaw = raw.slice('<![CDATA['.length, -']]>'.length);
      const lines = innerRaw.split('\n');

      const nonEmpty = lines.filter((l) => l.trim().length > 0);
      let minIndent = Infinity;
      nonEmpty.forEach((l) => {
        const indent = l.match(/^\s*/)[0].length;
        if (indent < minIndent) minIndent = indent;
      });
      if (!Number.isFinite(minIndent)) minIndent = 0;

      const cleaned = lines.map((l) =>
        l.length === 0 ? '' : l.slice(minIndent)
      );

      outLines.push(indentUnit.repeat(level) + '<![CDATA[');
      cleaned.forEach((l) => {
        if (l.trim() !== '') {
          outLines.push(
            indentUnit.repeat(level + 1) + l.replace(/\s+$/g, '')
          );
        }
      });
      outLines.push(indentUnit.repeat(level) + ']]>');
      i++;
      continue;
    }

    const textLines = tok.split('\n');
    textLines.forEach((line) => {
      if (line.trim() !== '') {
        outLines.push(indentUnit.repeat(level) + line.trim());
      }
    });
    i++;
  }

  return outLines.join('\n');
}

/* ============================
 *  MINIFY (ONE LINE)
 * ============================ */

function minifyXmlUltra(xmlString) {
  let out = xmlString;

  // 1. Collapse ALL >   < into ><
  out = out.replace(/>\s+</g, '><');

  // 2. Remove ALL newlines and tabs
  out = out.replace(/[\n\r\t]/g, '');

  // 3. Remove spaces directly inside tags:
  //    <tag>   text   </tag>  --> <tag>text</tag>
  out = out.replace(/>\s+([^<\s][^<]*?)\s+</g, '>$1<');

  // 4. Remove any space before <tag
  out = out.replace(/\s+</g, '<');

  // 5. Remove any space after >
  out = out.replace(/>\s+/g, '>');

  // 6. Trim ends
  return out.trim();
}

/* ============================
 *  FINAL FORMATTING
 * ============================ */

function formatFinalXML(xmlString, mode = 'beautify', indentSize = '2') {
  const indentMap = {
    '2': '  ',
    '4': '    ',
    tab: '\t',
  };
  const indentation = indentMap[indentSize] || indentMap['2'];

  if (mode === 'minify') {
    return minifyXmlUltra(xmlString);
  }

  if (mode === 'beautify') {
    return beautifyXmlStandard(xmlString, indentation);
  }

  return xmlString;
}

/* ============================
 *  MAIN PIPELINE (NO AUTO-REPAIR)
 * ============================ */

function processXmlTool(inputXml, options = {}) {
  const formatMode = options.formatMode || 'beautify';
  const indentSize = options.indentSize || '2';
  const showValidation = true; // Always validate
  const showLinting = options.showLinting !== false;

  // STEP 1: Validate INPUT
  const inputDiagnostics = diagnoseXML(inputXml);
  const inputIsWellFormed = inputDiagnostics.isWellFormed;

  let outputDiagnostics = {
    diagnostics: [],
    isWellFormed: true,
    strict: { isValid: true, errors: [] },
  };

  // STEP 2 & 3: Format and validate OUTPUT (only if input is well-formed)
  let cleanedXml = inputXml;
  let collapsedXml = inputXml;
  let finalXml = inputXml;

  if (inputIsWellFormed) {
    // 2. Cleanup options
    cleanedXml = applyCleanupOptions(inputXml, options);

    // 3. Optionally collapse empty elements
    collapsedXml = collapseEmptyElements(cleanedXml);

    // 4. Format (beautify/minify)
    finalXml = formatFinalXML(collapsedXml, formatMode, indentSize);

    // Validate the OUTPUT to catch any issues introduced by formatting
    outputDiagnostics = diagnoseXML(finalXml);
  }

  // Build final consolidated diagnostics
  const finalDiagnostics = [];

  // Add input validation errors (always show)
  finalDiagnostics.push(...inputDiagnostics.diagnostics);

  // Add output validation errors (only if formatting succeeded)
  if (inputIsWellFormed) {
    finalDiagnostics.push(...outputDiagnostics.diagnostics);
  }

  // STEP 4: Lint the OUTPUT (only if input was well-formed)
  let outputLinting = { total: 0, warnings: [] };
  if (inputIsWellFormed && showLinting) {
    outputLinting = lintXML(finalXml);
  }

  // Add lint warnings to diagnostics
  if (inputIsWellFormed && showLinting && outputLinting.warnings) {
    outputLinting.warnings.forEach((w) => {
      finalDiagnostics.push({
        type: 'warning',
        category: 'lint',
        message: w.message,
        line: w.line,
        column: w.column,
      });
    });
  }

  // Backwards-compatible validation object
  const validation = {
    original: inputDiagnostics.strict,
    repaired: inputDiagnostics.strict,
    structuralErrors: inputDiagnostics.structuralErrors,
  };

  return {
    ok: true,
    stage: 'done',
    originalXml: inputXml,
    cleanedXml,
    collapsedXml,
    finalXml,
    lintWarnings: outputLinting.warnings || [],
    validation,
    diagnostics: finalDiagnostics,
    inputDiagnostics: inputDiagnostics.diagnostics,
    outputDiagnostics: outputDiagnostics.diagnostics,
    repairInfo: null, // auto-repair removed
    showValidation,
    showLinting,
    isWellFormed: inputIsWellFormed,
    optionsApplied: {
      removeDeclaration: !!options.removeDeclaration,
      removeComments: !!options.removeComments,
      removeCDATA: !!options.removeCDATA,
      formatMode,
      indentSize,
    },
  };
}

module.exports = {
  strictValidate,
  diagnoseXML,
  collectStructuralDiagnostics,
  lintXML,
  applyCleanupOptions,
  collapseEmptyElements,
  formatFinalXML,
  processXmlTool,
};
