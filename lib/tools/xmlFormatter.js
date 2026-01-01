// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

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
 *  NORMALIZATION (xmldom)
 * ============================ */

/**
 * Normalize XML by stripping all formatting.
 * Only call this if XML is already known to be valid.
 *
 * Uses xmldom to parse the XML into a DOM and serialize it back,
 * removing all user formatting (indentation, line breaks, spacing).
 * This gives the beautifier a clean structural representation.
 */
function serializeXML(xmlString) {
  try {
    const parser = new DOMParser({
      errorHandler: {
        warning: () => {},
        error: () => {},
        fatalError: () => {},
      },
    });

    const dom = parser.parseFromString(xmlString, 'application/xml');
    const serializer = new XMLSerializer();
    return serializer.serializeToString(dom);
  } catch (err) {
    // If serialization fails (shouldn't happen if validation passed),
    // fall back to original string
    return xmlString;
  }
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
 * Implements error deduplication: each independent error is primary,
 * but cascading nesting errors collapse to one primary + secondary.
 *
 * Returns an array of diagnostics:
 * {
 *   type: 'error' | 'warning',
 *   category: 'structure' | 'syntax' | 'name' | 'attribute' | 'text',
 *   message: string,
 *   line: number | null,
 *   column: number | null,
 *   primary?: boolean,      // Independent/root error
 *   secondary?: boolean,    // Caused by primary structural error
 *   errorId?: string,       // Unique ID for this error
 *   causedBy?: string       // References primary errorId
 * }
 *
 * STRATEGY:
 * - Attribute/text/name errors are always PRIMARY (independent)
 * - Structure errors (unclosed/mismatched tags) get ONE primary + subsequent secondary
 * - This matches compiler behavior: syntactic issues are separate from structural cascades
 */
function collectStructuralDiagnostics(xmlString) {
  const errors = [];
  let activePrimaryStructuralError = null; // Track the first fatal structural error

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
              primary: true, // Attribute errors are always independent/primary
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
              primary: true, // Attribute errors are always independent/primary
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
                  primary: true, // Unescaped chars are always independent/primary
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
                  primary: true, // Unescaped chars are always independent/primary
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
                  primary: true, // Control chars are always independent/primary
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
          if (!activePrimaryStructuralError) {
            activePrimaryStructuralError = { id: 'INVALID_CLOSING_TAG', line: loc.line, column: loc.column };
            errors.push({
              type: 'error',
              category: 'structure',
              message: 'Closing tag is missing a valid name.',
              line: loc.line,
              column: loc.column,
              primary: true,
              errorId: activePrimaryStructuralError.id,
            });
          } else {
            errors.push({
              type: 'error',
              category: 'structure',
              message: 'Subsequent structure errors may be caused by earlier issues.',
              secondary: true,
              causedBy: activePrimaryStructuralError.id,
            });
          }
          continue;
        }

        if (stack.length === 0) {
          const loc = offsetToLineCol(xmlString, tok.start);
          if (!activePrimaryStructuralError) {
            activePrimaryStructuralError = { id: `UNMATCHED_CLOSING_${name}`, line: loc.line, column: loc.column };
            errors.push({
              type: 'error',
              category: 'structure',
              message: `Closing tag </${name}> has no matching opening tag.`,
              line: loc.line,
              column: loc.column,
              primary: true,
              errorId: activePrimaryStructuralError.id,
            });
          } else {
            // Only add secondary summary if not already added for this error
            if (!errors.some(e => e.secondary && e.causedBy === activePrimaryStructuralError.id)) {
              errors.push({
                type: 'error',
                category: 'structure',
                message: 'Subsequent structure errors may be caused by earlier issues.',
                secondary: true,
                causedBy: activePrimaryStructuralError.id,
              });
            }
          }
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
              if (!activePrimaryStructuralError) {
                activePrimaryStructuralError = {
                  id: `MISMATCHED_CLOSING_${name}_${top.name}`,
                  line: loc.line,
                  column: loc.column
                };
                errors.push({
                  type: 'error',
                  category: 'structure',
                  message: `Closing tag </${name}> does not match the most recent open tag <${top.name}>.`,
                  line: loc.line,
                  column: loc.column,
                  primary: true,
                  errorId: activePrimaryStructuralError.id,
                });
              } else {
                // Already have a primary error, treat this as secondary
                if (!errors.some(e => e.secondary && e.causedBy === activePrimaryStructuralError.id)) {
                  errors.push({
                    type: 'error',
                    category: 'structure',
                    message: 'Subsequent structure errors may be caused by earlier issues.',
                    secondary: true,
                    causedBy: activePrimaryStructuralError.id,
                  });
                }
              }
            } else {
              // Everything above idx is unclosed before this closing tag
              // Report the first unclosed as primary, rest as secondary
              for (let i = stack.length - 1; i > idx; i--) {
                const unclosed = stack[i];
                const loc = offsetToLineCol(xmlString, unclosed.offset);
                if (!activePrimaryStructuralError) {
                  activePrimaryStructuralError = {
                    id: `UNCLOSED_${unclosed.name}`,
                    line: loc.line,
                    column: loc.column
                  };
                  errors.push({
                    type: 'error',
                    category: 'structure',
                    message: `Tag <${unclosed.name}> is not closed.`,
                    line: loc.line,
                    column: loc.column,
                    primary: true,
                    errorId: activePrimaryStructuralError.id,
                  });
                } else {
                  // Only add one secondary summary, not per unclosed tag
                  if (!errors.some(e => e.secondary && e.causedBy === activePrimaryStructuralError.id)) {
                    errors.push({
                      type: 'error',
                      category: 'structure',
                      message: 'Subsequent structure errors may be caused by earlier issues.',
                      secondary: true,
                      causedBy: activePrimaryStructuralError.id,
                    });
                  }
                  break; // Stop processing further cascades
                }
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
          primary: true, // Text content errors are always independent/primary
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
          primary: true, // Text content errors are always independent/primary
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
          primary: true, // Text content errors are always independent/primary
        });
      }
    }
  }

  // Remaining unclosed tags on stack
  for (const unclosed of stack) {
    const loc = offsetToLineCol(xmlString, unclosed.offset);
    if (!activePrimaryStructuralError) {
      activePrimaryStructuralError = {
        id: `UNCLOSED_${unclosed.name}`,
        line: loc.line,
        column: loc.column
      };
      errors.push({
        type: 'error',
        category: 'structure',
        message: `Tag <${unclosed.name}> is never closed.`,
        line: loc.line,
        column: loc.column,
        primary: true,
        errorId: activePrimaryStructuralError.id,
      });
    } else {
      // Already have a primary structural error, add one secondary summary and stop
      if (!errors.some(e => e.secondary && e.causedBy === activePrimaryStructuralError.id)) {
        errors.push({
          type: 'error',
          category: 'structure',
          message: 'Subsequent structure errors may be caused by earlier issues.',
          secondary: true,
          causedBy: activePrimaryStructuralError.id,
        });
      }
      break; // Stop processing more unclosed tags
    }
  }

  return errors;
}

/**
 * High-level diagnostics aggregator:
 * - strictValidate (fast-xml-parser)
 * - structural diagnostics (custom)
 * - lint warnings (Tier 1 + Tier 2 based on settings)
 *
 * @param {string} xmlString - The XML to diagnose
 * @param {string} formatMode - The formatting mode (for mode-aware linting)
 * @param {Object} options - Lint options { strictMode: boolean }
 */
function diagnoseXML(xmlString, formatMode = 'beautify', options = {}) {
  const strict = strictValidate(xmlString);
  const structuralErrors = collectStructuralDiagnostics(xmlString);
  const lintWarnings = lintXML(xmlString, formatMode, options);

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
 *  LINTING ARCHITECTURE
 * ============================ */

/**
 * LINTING TIERS:
 *
 * Tier 0: Validation (hard errors, blocks formatting) — NOT linting, handled by collectStructuralDiagnostics()
 * Tier 1: Safe, objective lints (non-blocking, educational, no false positives) — collectXmlLintsBasic()
 * Tier 2: Opinionated style lints (future, opt-in) — collectXmlLintsStrict() [STUB]
 *
 * Only Tier 1 is implemented by default.
 * Tier 2 requires explicit user opt-in (future "Strict Style Mode").
 */

/**
 * TIER 1: Safe, objective lints (non-blocking, widely accepted)
 *
 * Rules:
 * 1. Empty element long-form: <tag></tag> → <tag/>
 * 2. Mixed indentation: tabs + spaces in same file
 * 3. Redundant CDATA: plain text wrapped in CDATA
 * 4. Redundant wrapper: single-child elements
 * 5. Inconsistent attribute order: same element type with different attr order
 *
 * @param {string} xmlString - The XML to lint
 * @returns {Array} Array of warning objects with line/column
 */
function collectXmlLintsBasic(xmlString) {
  const warnings = [];
  const lines = xmlString.split(/\r?\n/);

  // ==================== LINT 1: Empty element long-form ====================
  // Pattern: <tag></tag> where tag has no attributes
  const emptyElementRe = /<([a-zA-Z_][\w.\-:]*)([^>]*)>\s*<\/\1>/g;
  let match;
  while ((match = emptyElementRe.exec(xmlString)) !== null) {
    const tagName = match[1];
    const attrs = match[2].trim();

    // Only suggest self-closing if no attributes
    if (!attrs) {
      const loc = offsetToLineCol(xmlString, match.index);
      warnings.push({
        message: `Empty element <${tagName}></${tagName}> can be written as self-closing: <${tagName}/>`,
        type: 'empty-element-style',
        tier: 1,
        line: loc.line,
        column: loc.column,
      });
    }
  }

  // ==================== LINT 2: Mixed indentation (tabs + spaces) ====================
  let hasSpaces = false;
  let hasTabs = false;
  let firstTabLine = null;
  let firstSpaceLine = null;

  lines.forEach((line, idx) => {
    const leadingWhitespace = line.match(/^[ \t]+/);
    if (leadingWhitespace) {
      if (leadingWhitespace[0].includes('\t')) {
        hasTabs = true;
        if (!firstTabLine) firstTabLine = idx + 1;
      }
      if (leadingWhitespace[0].includes(' ')) {
        hasSpaces = true;
        if (!firstSpaceLine) firstSpaceLine = idx + 1;
      }
    }
  });

  if (hasSpaces && hasTabs) {
    warnings.push({
      message: 'Mixed indentation detected (both tabs and spaces found)',
      type: 'mixed-indentation',
      tier: 1,
      line: Math.min(firstSpaceLine, firstTabLine),
      column: 1,
      details: `Spaces first used on line ${firstSpaceLine}, tabs on line ${firstTabLine}`,
    });
  }

  // ==================== LINT 3: Redundant CDATA for plain text ====================
  // Pattern: <![CDATA[...]]> containing only plain text (no special XML chars)
  const cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g;
  while ((match = cdataRe.exec(xmlString)) !== null) {
    const content = match[1];
    // CDATA is redundant if it contains no special chars that need CDATA
    const needsCdata = /[<>&]|]]>/.test(content);

    if (!needsCdata) {
      const loc = offsetToLineCol(xmlString, match.index);
      warnings.push({
        message: 'CDATA section contains plain text and may be unnecessary',
        type: 'redundant-cdata',
        tier: 1,
        line: loc.line,
        column: loc.column,
        details: 'CDATA is only needed when content contains <, >, &, or ]]>',
      });
    }
  }

  // ==================== LINT 4: Redundant wrapper (single child) ====================
  // Pattern: <wrapper><child>...</child></wrapper> where wrapper only has one child
  // Simplified: match basic structure and count direct children
  const wrapperRe = /<([a-zA-Z_][\w.\-:]*)[^>]*>\s*<([a-zA-Z_][\w.\-:]*)[^>]*>[\s\S]*?<\/\2>\s*<\/\1>/g;

  while ((match = wrapperRe.exec(xmlString)) !== null) {
    const wrapperName = match[1];
    const childName = match[2];
    const fullMatch = match[0];

    // Count opening tags of the wrapper (should be 1 + the child opening tag)
    // If there are additional opening tags at same depth, it's not a single child
    const innerContent = fullMatch.slice(
      fullMatch.indexOf('>') + 1,
      fullMatch.lastIndexOf('</')
    );

    // Count opening element tags in inner content (not closing tags, comments, PI, CDATA)
    const openingTags = innerContent.match(/<[a-zA-Z_]/g) || [];

    // Should be exactly 1 opening tag (the child element)
    if (openingTags.length === 1) {
      const loc = offsetToLineCol(xmlString, match.index);
      warnings.push({
        message: `Wrapper element <${wrapperName}> contains only single child <${childName}> and may be flattenable`,
        type: 'redundant-wrapper',
        tier: 1,
        line: loc.line,
        column: loc.column,
      });
    }
  }

  // ==================== LINT 5: Inconsistent attribute order ====================
  // Pattern: Same element type with different attribute ordering
  // e.g., <server port="x" host="y"/> vs <server host="y" port="x"/>
  const elementAttrRe = /<([a-zA-Z_][\w.\-:]*)([^/>]*)/g;
  const elementAttrs = {}; // Map: elementName -> Set of attribute orders seen

  while ((match = elementAttrRe.exec(xmlString)) !== null) {
    const tagName = match[1];
    const attrString = match[2];

    // Extract attribute names in order
    const attrNames = [];
    const attrNameRe = /([a-zA-Z_][\w.\-:]*)\s*=/g;
    let attrMatch;
    while ((attrMatch = attrNameRe.exec(attrString)) !== null) {
      attrNames.push(attrMatch[1]);
    }

    if (attrNames.length > 0) {
      const attrOrder = attrNames.join('|');

      if (!elementAttrs[tagName]) {
        elementAttrs[tagName] = new Set();
        elementAttrs[tagName].add(attrOrder);
      } else {
        elementAttrs[tagName].add(attrOrder);
      }
    }
  }

  // Find inconsistencies
  Object.entries(elementAttrs).forEach(([tagName, orders]) => {
    if (orders.size > 1) {
      // Find first occurrence of this element type for line number
      const elementRe = new RegExp(`<${tagName}[^>]*`, 'g');
      const firstMatch = elementRe.exec(xmlString);
      if (firstMatch) {
        const loc = offsetToLineCol(xmlString, firstMatch.index);
        const orderArray = Array.from(orders);
        warnings.push({
          message: `Attribute order is inconsistent for <${tagName}> elements (${orderArray.length} different orders found)`,
          type: 'inconsistent-attr-order',
          tier: 1,
          line: loc.line,
          column: loc.column,
          details: `Found: ${orderArray.join(' | ')}`,
        });
      }
    }
  });

  return warnings;
}

/**
 * TIER 2: Opinionated style lints (STUB for future opt-in mode)
 *
 * Rules:
 * - Metadata ordering (name/version first)
 * - Boolean shorthand suggestions (enabled="true" → enabled)
 * - Numeric precision normalization (0001.2300 → 1.23)
 * - Enforced global attribute ordering
 *
 * @param {string} xmlString - The XML to lint
 * @returns {Array} Array of warning objects (currently stub)
 */
function collectXmlLintsStrict(xmlString) {
  // STUB: Will be implemented when user enables "Strict Style Mode"
  return [];
}

/**
 * Main linting orchestrator.
 * Decides which lint tiers to run based on format mode and user settings.
 *
 * @param {string} xmlString - The XML to lint
 * @param {string} formatMode - The formatting mode ('beautify', 'minify', etc.)
 * @param {Object} options - Lint options { strictMode: boolean }
 * @returns {Array} Array of warning objects
 */
function lintXML(xmlString, formatMode = 'beautify', options = {}) {
  const warnings = [];
  const trimmed = xmlString.trim();
  const isMinifyMode = formatMode === 'minify';
  const strictMode = options.strictMode === true;

  // ===== BASIC STRUCTURAL LINTS (always run unless minifying) =====
  // These are separate from Tier 1/2 because they're about document structure
  // (declaration, root element) not style.

  if (!isMinifyMode) {
    if (!trimmed.startsWith('<?xml')) {
      warnings.push({
        message: 'No XML declaration found (e.g., <?xml version="1.0"?>).',
        type: 'missing-declaration',
        tier: 0,
        line: null,
        column: null,
      });
    }

    const rootMatch = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/m);
    if (!rootMatch) {
      warnings.push({
        message: 'No clear root element detected.',
        type: 'no-root',
        tier: 0,
        line: null,
        column: null,
      });
    }

    const topLevelTags = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/gm);
    if (topLevelTags && topLevelTags.length > 1) {
      warnings.push({
        message: 'Multiple top-level elements detected. XML should normally have a single root element.',
        type: 'multiple-roots',
        tier: 0,
        line: null,
        column: null,
      });
    }
  }

  // ===== TIER 1: Safe, objective lints (always run) =====
  const basicLints = collectXmlLintsBasic(xmlString);
  warnings.push(...basicLints);

  // ===== TIER 2: Opinionated lints (only if strict mode enabled) =====
  if (strictMode) {
    const strictLints = collectXmlLintsStrict(xmlString);
    warnings.push(...strictLints);
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
  const strictMode = options.strictMode === true; // Tier 2 opinionated lints (opt-in)

  // STEP 1: Validate INPUT
  // Note: Input diagnostics always run with 'beautify' mode since we want to validate the user's input
  // regardless of their chosen output format. Mode-aware linting applies only to the output.
  const lintOptions = { strictMode };
  const inputDiagnostics = diagnoseXML(inputXml, 'beautify', lintOptions);
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

    // 4. Normalize structure using xmldom (strips all original formatting)
    // This gives the beautifier a pure structural representation
    let normalizedXml = collapsedXml;
    if (formatMode === 'beautify') {
      normalizedXml = serializeXML(collapsedXml);
    }

    // 5. Format (beautify/minify)
    finalXml = formatFinalXML(normalizedXml, formatMode, indentSize);

    // Validate the OUTPUT to catch any issues introduced by formatting
    // Use mode-aware linting: minify mode skips readability-based lints
    outputDiagnostics = diagnoseXML(finalXml, formatMode, lintOptions);
  }

  // Build final consolidated diagnostics
  const finalDiagnostics = [];

  // Add input validation errors (always show, but exclude lint warnings since we'll show output linting instead)
  const inputValidationOnly = inputDiagnostics.diagnostics.filter(d => d.category !== 'lint');
  finalDiagnostics.push(...inputValidationOnly);

  // Add output validation errors (only if formatting succeeded, but exclude lint warnings to avoid duplication)
  if (inputIsWellFormed) {
    // Filter out lint warnings from output diagnostics since we'll add them from the output linting step
    const outputValidationOnly = outputDiagnostics.diagnostics.filter(d => d.category !== 'lint');
    finalDiagnostics.push(...outputValidationOnly);
  }

  // STEP 4: Lint the OUTPUT (only if input was well-formed)
  // Use mode-aware linting: minify mode skips readability-based lints
  let outputLintWarnings = [];
  if (inputIsWellFormed && showLinting) {
    outputLintWarnings = lintXML(finalXml, formatMode, lintOptions);
  }

  // Add lint warnings to diagnostics (from output, not input)
  if (inputIsWellFormed && showLinting && outputLintWarnings.length > 0) {
    outputLintWarnings.forEach((w) => {
      finalDiagnostics.push({
        type: 'warning',
        category: 'lint',
        message: w.message,
        warningType: w.type,
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
    lintWarnings: outputLintWarnings,
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
  serializeXML,
  diagnoseXML,
  collectStructuralDiagnostics,
  lintXML,
  applyCleanupOptions,
  collapseEmptyElements,
  formatFinalXML,
  processXmlTool,
};
