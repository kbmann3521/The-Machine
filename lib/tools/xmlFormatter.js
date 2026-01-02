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

/* ============================
 *  XML CONVERSION FUNCTIONS
 * ============================ */

/**
 * Clean parsed XML from fast-xml-parser:
 * - Remove XML declaration (?xml)
 * - Remove whitespace-only text nodes
 * - Recursively clean nested objects
 */
function cleanParsedXml(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanParsedXml(item))
  }

  const cleaned = {}

  for (const [key, value] of Object.entries(obj)) {
    // Skip XML declaration
    if (key === '?xml') {
      continue
    }

    // Skip whitespace-only text nodes
    if (key === '#text' && typeof value === 'string' && value.trim() === '') {
      continue
    }

    // Recursively clean nested objects
    if (typeof value === 'object' && value !== null) {
      cleaned[key] = cleanParsedXml(value)
    } else if (key === '#text' && typeof value === 'string') {
      // Trim text content
      cleaned[key] = value.trim()
    } else {
      cleaned[key] = value
    }
  }

  return cleaned
}

/**
 * Get semantic text key name based on parent context (for human-friendly conversion)
 */
function getSemanticTextKey(parentKey, isCDATA = false) {
  // CDATA always uses 'content'
  if (isCDATA) {
    return 'content'
  }

  if (!parentKey) return 'value'

  const parentLower = parentKey.toLowerCase()

  // Semantic naming based on parent tag
  if (parentLower.includes('maintainer') || parentLower.includes('author')) {
    return 'name'
  }
  if (parentLower.includes('template') || parentLower.includes('script')) {
    return 'content'
  }
  if (parentLower.includes('message') || parentLower.includes('error')) {
    return 'text'
  }

  return 'value'
}

/**
 * Get plural form of singular key (feature->features, protocol->protocols)
 */
function getPluralKey(singularKey) {
  if (singularKey.endsWith('s')) {
    return singularKey // Already plural or ends with s
  }
  if (singularKey.endsWith('y')) {
    return singularKey.slice(0, -1) + 'ies'
  }
  return singularKey + 's'
}

/**
 * Get singular form of plural key (features->feature, protocols->protocol)
 */
function getSingularKey(pluralKey) {
  if (pluralKey.endsWith('ies')) {
    return pluralKey.slice(0, -3) + 'y'
  }
  if (pluralKey.endsWith('s') && !pluralKey.endsWith('ss')) {
    return pluralKey.slice(0, -1)
  }
  return pluralKey
}

/**
 * Normalize scalar values (handles empty strings -> null)
 */
function normalizeValue(value, isCDATA = false) {
  if (typeof value === 'string') {
    // For CDATA, normalize indentation but preserve line structure
    if (isCDATA) {
      return normalizeCDATAIndentation(value)
    }

    const trimmed = value.trim()

    // Convert empty strings to null
    if (trimmed === '' || trimmed === null || trimmed === undefined) {
      return null
    }

    // Convert "true"/"false" to booleans
    if (trimmed === 'true' || trimmed === 'false') {
      return trimmed === 'true'
    }

    // Convert numeric strings to appropriate numeric type
    if (!isNaN(trimmed) && trimmed !== '') {
      return parseFloat(trimmed)
    }

    return trimmed
  }
  return value
}

/**
 * Sort object keys semantically for human-friendly reading
 * Groups keys by importance: identity → description → config → relations → content → rest
 */
function semanticallySortObject(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj
  }

  const keys = Object.keys(obj)
  const sorted = {}

  // Define field categories with priorities
  const fieldCategories = {
    // ROOT LEVEL
    version: { priority: 0, fields: ['version'] },
    environment: { priority: 0.5, fields: ['environment'] },
    coreConfig: { priority: 1, fields: ['application'] },
    features: { priority: 1.5, fields: ['features'] },
    server: { priority: 2, fields: ['server'] },
    logging: { priority: 2.3, fields: ['logging'] },
    limits: { priority: 2.6, fields: ['limits', 'thresholds'] },
    templates: { priority: 3, fields: ['templates'] },
    advanced: { priority: 3.5, fields: ['advanced', 'experimental', 'debug', 'optional'] },

    // WITHIN SECTIONS
    identity: { priority: 10, fields: ['name', 'id', 'key', 'identifier', 'title'] },
    config: { priority: 11, fields: ['enabled', 'disabled', 'active', 'status', 'state', 'type', 'kind', 'level'] },
    path: { priority: 12, fields: ['path', 'location', 'url', 'host', 'port', 'email', 'units', 'value'] },
    descriptive: { priority: 13, fields: ['description', 'label', 'summary', 'comment', 'doc', 'documentation', 'info', 'details', 'message', 'text', 'content'] },
    relations: { priority: 14, fields: ['maintainer', 'author', 'owner', 'parent', 'creator', 'contact', 'manager'] },
  }

  // Create a priority map for each key
  const keyPriority = {}
  keys.forEach(key => {
    const lowerKey = key.toLowerCase()
    let priority = 1000  // Default: very low priority (for unmatched fields)

    // Check each category
    for (const [categoryName, categoryData] of Object.entries(fieldCategories)) {
      for (const fieldName of categoryData.fields) {
        if (lowerKey === fieldName || lowerKey.includes(fieldName)) {
          priority = categoryData.priority
          break
        }
      }
      if (priority < 1000) break
    }

    keyPriority[key] = priority
  })

  // Sort keys by priority, then alphabetically
  const sortedKeys = keys.sort((a, b) => {
    const priorityDiff = keyPriority[a] - keyPriority[b]
    if (priorityDiff !== 0) return priorityDiff
    return a.localeCompare(b)
  })

  // Rebuild object with sorted keys
  for (const key of sortedKeys) {
    const value = obj[key]
    // Recursively sort nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sorted[key] = semanticallySortObject(value)
    } else if (Array.isArray(value)) {
      // For arrays, sort each object element
      sorted[key] = value.map(item => {
        if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
          return semanticallySortObject(item)
        }
        return item
      })
    } else {
      sorted[key] = value
    }
  }

  return sorted
}

/**
 * Normalize CDATA block indentation
 * Removes ALL leading indentation from XML source
 * YAML handles visual indentation later via block scalar (|-)
 */
function normalizeCDATAIndentation(cdataText) {
  if (!cdataText) {
    return ''
  }

  const lines = cdataText.split('\n')

  // Remove leading and trailing blank lines
  while (lines.length && !lines[0].trim()) {
    lines.shift()
  }
  while (lines.length && !lines[lines.length - 1].trim()) {
    lines.pop()
  }

  if (!lines.length) {
    return ''
  }

  // Compute minimum indentation across all non-blank lines
  let minIndent = Infinity
  for (const line of lines) {
    if (!line.trim()) continue
    const match = line.match(/^(\s*)/)
    minIndent = Math.min(minIndent, match[1].length)
  }

  // Strip indentation completely (rebase to column 0)
  if (minIndent === Infinity) {
    minIndent = 0
  }

  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
}

/**
 * Transform parsed XML to human-friendly YAML/JSON structure
 * Handles plural/singular conversion, semantic naming, attribute unprefixing, etc.
 */
function transformXmlToHumanFriendlyYaml(obj, parentKey = null, isArrayElement = false) {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformXmlToHumanFriendlyYaml(item, parentKey, true))
  }

  const result = {}
  let textContent = null
  let hasCDATA = false
  const childElementKeys = []  // Track which keys are child elements (not attributes)

  // CRITICAL: Process all keys exactly once
  for (const [key, value] of Object.entries(obj)) {
    // Skip XML declaration
    if (key === '?xml') continue

    // Skip namespace attributes
    if (key.startsWith('@_') && (key.includes('xmlns') || key.includes('xsi'))) {
      continue
    }

    // Extract text content (but DON'T add to result yet)
    if (key === '#text') {
      if (typeof value === 'string') {
        textContent = value
        // Detect CDATA by content
        if (value.includes('&lt;') || value.includes('&gt;') || value.includes('<') || value.includes('>')) {
          hasCDATA = true
        } else {
          // Regular text: trim it
          textContent = value.trim()
        }
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        textContent = String(value)
      }
      continue  // Critical: Never add #text to result
    }

    // Extract CDATA content
    if (key === '#cdata') {
      if (typeof value === 'string') {
        textContent = value
      } else {
        textContent = String(value)
      }
      hasCDATA = true
      continue  // Critical: Never add #cdata to result
    }

    // Process attributes (convert from @_name to name)
    if (key.startsWith('@_')) {
      const attrName = key.substring(2)
      const attrValue = value

      // Type coercion for attributes
      if (attrValue === 'true') {
        result[attrName] = true
      } else if (attrValue === 'false') {
        result[attrName] = false
      } else if (!isNaN(attrValue) && attrValue !== '') {
        result[attrName] = parseFloat(attrValue)
      } else {
        result[attrName] = attrValue
      }
      continue
    }

    // Track this as a child element
    childElementKeys.push(key)

    // Process child elements
    if (Array.isArray(value)) {
      // Array of elements - transform each and keep as array
      result[key] = value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return transformXmlToHumanFriendlyYaml(item, key, true)
        }
        return normalizeValue(item)
      })
    } else if (typeof value === 'object' && value !== null) {
      // Nested object element
      const childTransformed = transformXmlToHumanFriendlyYaml(value, key, false)

      // Check if this is a singular wrapper that should be flattened
      if (typeof childTransformed === 'object' && !Array.isArray(childTransformed)) {
        const childKeys = Object.keys(childTransformed)

        // Only flatten if exactly one child key and it's the singular form of parent
        if (childKeys.length === 1) {
          const onlyKey = childKeys[0]
          let onlyVal = childTransformed[onlyKey]
          const singularOfParent = getSingularKey(key)

          if (onlyKey === singularOfParent) {
            // FLATTEN: Convert to array if not already
            result[key] = Array.isArray(onlyVal) ? onlyVal : [onlyVal]
          } else {
            result[key] = childTransformed
          }
        } else {
          result[key] = childTransformed
        }
      } else {
        result[key] = childTransformed
      }
    } else {
      // Scalar value
      result[key] = normalizeValue(value)
    }
  }

  // Handle text content based on what we have
  if (textContent) {
    const hasChildElements = childElementKeys.length > 0
    const attributeCount = Object.keys(result).filter(k => !childElementKeys.includes(k)).length
    const hasAttributes = attributeCount > 0

    // CDATA is never prose—it always goes straight to content key
    if (hasCDATA) {
      const textKey = getSemanticTextKey(parentKey, true)
      result[textKey] = normalizeCDATAIndentation(textContent)
      const sortedResult = semanticallySortObject(result)
      return Object.keys(sortedResult).length > 0 ? sortedResult : null
    }

    if (hasChildElements) {
      // Mixed content: text + child elements
      result.message = textContent.replace(/\s+/g, ' ').trim()
    } else if (hasAttributes) {
      // Element has ONLY attributes + text (no child elements)
      if (textContent) {
        const textKey = getSemanticTextKey(parentKey, false)
        result[textKey] = normalizeValue(textContent)
      }
    } else {
      // Element is ONLY text (no attributes, no children)
      return normalizeValue(textContent)
    }
  }

  // Final cleanup: Remove XML artifact keys
  delete result['#text']
  delete result['#cdata']
  delete result['#comment']

  // Apply semantic field ordering for better readability
  const sortedResult = semanticallySortObject(result)

  return Object.keys(sortedResult).length > 0 ? sortedResult : null
}

/**
 * Transform to human-friendly JSON (reuses YAML transformation)
 */
function transformXmlToHumanFriendlyJson(obj) {
  return transformXmlToHumanFriendlyYaml(obj)
}

/**
 * Convert XML to JSON
 */
function xmlToJson(xmlString, options = {}) {
  try {
    const { XMLParser } = require('fast-xml-parser')
    const preserveStructure = options.preserveXmlStructure === true

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      trimValues: false,
      parseTrueNumberOnly: false,
    })

    const json = parser.parse(xmlString)

    if (preserveStructure) {
      // Lossless mode: keep @_ and #text artifacts
      const cleaned = cleanParsedXml(json)
      return JSON.stringify(cleaned, null, 2)
    } else {
      // Human-friendly mode: transform to clean JSON
      const transformed = transformXmlToHumanFriendlyJson(json)
      return JSON.stringify(transformed, null, 2)
    }
  } catch (error) {
    return { error: 'Failed to convert XML to JSON: ' + error.message }
  }
}

/**
 * Fallback XML to JSON converter (for when fast-xml-parser is unavailable)
 */
function fallbackXmlToJson(text) {
  try {
    let result = {}
    const trimmed = text.trim()

    function parseElement(str, depth = 0) {
      const obj = {}
      let remaining = str

      const rootTagMatch = remaining.match(/<(\w+)([^>]*)>/)
      if (!rootTagMatch) {
        return obj
      }

      const tagName = rootTagMatch[1]
      const attrsStr = rootTagMatch[2]
      const closeTag = '</' + tagName + '>'

      const attrs = {}
      const attrRegex = /(\w+)="([^"]*)"/g
      let attrMatch
      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2]
      }

      const startIdx = remaining.indexOf('>') + 1
      const endIdx = remaining.lastIndexOf(closeTag)

      if (endIdx === -1) {
        return { [tagName]: attrs }
      }

      const content = remaining.substring(startIdx, endIdx)
      const children = {}
      let textContent = content

      const childRegex = /<(\w+)([^>]*)>[\s\S]*?<\/\1>/g
      let childMatch
      while ((childMatch = childRegex.exec(content)) !== null) {
        const childName = childMatch[1]
        const childStr = childMatch[0]
        const parsed = parseElement(childStr, depth + 1)

        if (children[childName]) {
          if (!Array.isArray(children[childName])) {
            children[childName] = [children[childName]]
          }
          children[childName].push(parsed[childName] || childStr)
        } else {
          children[childName] = parsed[childName] || childStr
        }

        textContent = textContent.replace(childStr, '')
      }

      textContent = textContent.trim()

      const element = { ...attrs }

      if (Object.keys(children).length > 0) {
        Object.assign(element, children)
      }

      if (textContent) {
        if (Object.keys(element).length === 0) {
          obj[tagName] = textContent
        } else {
          element['#text'] = textContent
          obj[tagName] = element
        }
      } else {
        obj[tagName] = element
      }

      return obj
    }

    result = parseElement(trimmed)
    return JSON.stringify(result, null, 2)
  } catch (error) {
    return { error: 'Failed to convert XML to JSON: ' + error.message }
  }
}

/**
 * Convert XML to YAML
 */
function xmlToYaml(xmlString, conversionMode = 'lossless') {
  try {
    const { XMLParser } = require('fast-xml-parser')
    const yaml = require('yaml')

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      trimValues: false,
    })

    const json = parser.parse(xmlString)

    if (conversionMode === 'lossy') {
      const transformed = transformXmlToHumanFriendlyYaml(json)
      return yaml.stringify(transformed)
    }

    const cleaned = cleanParsedXml(json)
    return yaml.stringify(cleaned)
  } catch (error) {
    return { error: 'Failed to convert XML to YAML: ' + error.message }
  }
}

/**
 * Serialize object to TOML format
 */
function serializeToToml(obj, path = '') {
  const tomlLines = []
  const sections = []  // Regular tables [parent.child]
  const arrayOfTables = []  // Array tables [[parent.item]]

  // Categorize entries: scalars, nested tables, and arrays
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = path ? `${path}.${key}` : key

    if (value === null || value === undefined) {
      tomlLines.push(`${key} = null`)
    } else if (typeof value === 'string') {
      // Check if string contains newlines (like CDATA content)
      if (value.includes('\n')) {
        // Use triple-quoted multiline string
        tomlLines.push(`${key} = """${value}"""`)
      } else {
        // Regular escaped string
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
        tomlLines.push(`${key} = "${escaped}"`)
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      tomlLines.push(`${key} = ${value}`)
    } else if (Array.isArray(value)) {
      // Check if this is an array of objects (array-of-tables) or simple array
      if (value.length > 0 && typeof value[0] === 'object' && !Array.isArray(value[0])) {
        // Array of objects → [[fullPath]] syntax
        for (const item of value) {
          arrayOfTables.push({ path: fullPath, item })
        }
      } else {
        // Simple array → inline syntax with proper spacing
        const serialized = JSON.stringify(value).replace(/,/g, ', ')
        tomlLines.push(`${key} = ${serialized}`)
      }
    } else if (typeof value === 'object') {
      // Nested table → will emit as [fullPath]
      sections.push({ path: fullPath, value })
    }
  }

  // Build output: scalars, then sections, then arrays of tables
  let output = ''

  // Add top-level scalars
  if (tomlLines.length > 0) {
    output += tomlLines.join('\n')
  }

  // Add regular nested tables [parent.child]
  for (const { path: sectionPath, value } of sections) {
    if (output && !output.endsWith('\n\n')) {
      output += '\n'
    }
    output += `\n[${sectionPath}]\n`
    const sectionContent = serializeToToml(value, sectionPath)
    output += sectionContent
  }

  // Add arrays of tables [[parent.item]]
  for (const { path: arrayPath, item } of arrayOfTables) {
    if (output && !output.endsWith('\n\n')) {
      output += '\n'
    }
    output += `\n[[${arrayPath}]]\n`
    const itemContent = serializeToToml(item, arrayPath)
    output += itemContent
  }

  return output
}

/**
 * Convert XML to TOML
 */
function xmlToToml(xmlString, options = {}) {
  try {
    const { XMLParser } = require('fast-xml-parser')

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      allowBooleanAttributes: true,
      trimValues: false,
    })

    const json = parser.parse(xmlString)
    const preserveStructure = options.preserveXmlStructure === true

    if (preserveStructure) {
      // Lossless: keep @_ and #text artifacts
      const cleaned = cleanParsedXml(json)
      const toml = require('@iarna/toml')
      return toml.stringify(cleaned)
    } else {
      // Lossy (default): use human-friendly transformation
      const transformed = transformXmlToHumanFriendlyJson(json)

      // Extract root element
      const rootKey = Object.keys(transformed)[0]
      const rootObj = transformed[rootKey]

      // Serialize using custom TOML serializer
      return serializeToToml(rootObj)
    }
  } catch (error) {
    return { error: 'Failed to convert XML to TOML: ' + error.message }
  }
}

/**
 * Serialize DOM node to XML string
 */
function serializeNode(node) {
  let result = ''

  if (node.nodeType === 1) {
    result = '<' + node.tagName
    if (node.attributes) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i]
        result += ' ' + attr.name + '="' + attr.value + '"'
      }
    }

    if (node.childNodes && node.childNodes.length === 0) {
      result += '/>'
    } else {
      result += '>'
      if (node.childNodes) {
        for (let i = 0; i < node.childNodes.length; i++) {
          result += serializeNode(node.childNodes[i])
        }
      }
      result += '</' + node.tagName + '>'
    }
  } else if (node.nodeType === 3) {
    result = node.data
  } else if (node.nodeType === 8) {
    result = '<!--' + node.data + '-->'
  }

  return result
}

/**
 * Execute XPath query on XML document
 */
function xmlXPath(text, config) {
  try {
    const query = config?.xpathQuery || ''

    if (!query) {
      return { error: 'XPath query is required. Example: /root/item[@id="1"]' }
    }

    const trimmed = text.trim()
    const results = []

    // Try to use xpath and xmldom if available
    let xpath, DOMParser
    try {
      xpath = require('xpath')
      const xmldom = require('@xmldom/xmldom')
      DOMParser = xmldom.DOMParser
    } catch (e) {
      // Fall back if libraries aren't available
      return fallbackXmlXPath(trimmed, query)
    }

    if (xpath && DOMParser) {
      try {
        const doc = new DOMParser().parseFromString(trimmed, 'text/xml')
        const nodes = xpath.select(query, doc)

        if (nodes && nodes.length > 0) {
          results.push(...nodes.map(node => {
            if (node.nodeType === 3) return node.data
            const str = node.toString()
            return str || node.toXml?.() || serializeNode(node)
          }))
        }
      } catch (e) {
        return fallbackXmlXPath(trimmed, query)
      }
    } else {
      return fallbackXmlXPath(trimmed, query)
    }

    if (results.length === 0) {
      return { results: [], message: 'No matches found for XPath: ' + query }
    }

    return { results: results, count: results.length, query: query }
  } catch (error) {
    return { error: 'XPath query failed: ' + error.message }
  }
}

/**
 * Fallback XPath evaluation using regex heuristics
 */
function fallbackXmlXPath(text, query) {
  try {
    const results = []
    const trimmed = text.trim()

    if (query.startsWith('//')) {
      const nodeName = query.slice(2).split('[')[0].split('@')[0].split('/')[0]
      const regex = new RegExp('<' + nodeName + '([^>]*)>([\\s\\S]*?)<\\/' + nodeName + '>', 'g')
      let match
      while ((match = regex.exec(trimmed)) !== null) {
        results.push(match[0])
      }
    } else if (query.startsWith('/')) {
      const parts = query.split('/').filter(p => p)
      let searchText = trimmed
      let currentResults = [searchText]

      for (const part of parts) {
        const newResults = []
        const cleanPart = part.split('[')[0].split('@')[0]

        for (const content of currentResults) {
          const regex = new RegExp('<' + cleanPart + '([^>]*)>([\\s\\S]*?)<\\/' + cleanPart + '>', 'g')
          let match
          while ((match = regex.exec(content)) !== null) {
            newResults.push(match[0])
          }
        }

        currentResults = newResults
      }

      results.push(...currentResults)
    }

    if (results.length === 0) {
      return { results: [], message: 'No matches found for XPath: ' + query }
    }

    return { results: results, count: results.length, query: query }
  } catch (error) {
    return { error: 'XPath query failed: ' + error.message }
  }
}

/* ============================
 *  LEGACY XML HELPER FUNCTIONS (kept for compatibility)
 * ============================ */

function xmlBeautify(text, indentSize, config) {
  try {
    let trimmed = text.trim()

    if (config?.removeXMLDeclaration) {
      trimmed = trimmed.replace(/<\?xml[^?]*\?>/, '').trim()
    }

    if (config?.removeComments) {
      trimmed = trimmed.replace(/<!--[\s\S]*?-->/g, '')
    }

    if (config?.removeCDATA) {
      trimmed = trimmed.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    }

    let xmlParser
    try {
      if (typeof window === 'undefined') {
        xmlParser = require('fast-xml-parser')
      }
    } catch (e) {
      // xmlParser not available
    }

    if (xmlParser && xmlParser.validate(trimmed) === true) {
      const indentChar = indentSize === '\t' ? '\t' : indentSize
      const builder = xmlParser.j2xParser({
        arrayName: 'item',
        formatCb: (tagName) => tagName,
        indentBy: indentChar,
        supressEmptyNode: false,
        ignoreAttributes: false,
        processEntities: true,
      })

      const parsed = xmlParser.parse(trimmed)
      let result = xmlParser.build(parsed, {
        indentBy: indentChar,
        supressEmptyNode: false,
        ignoreAttributes: false,
      })

      if (result.startsWith('<?xml')) {
        const xmlDeclEnd = result.indexOf('?>')
        if (xmlDeclEnd !== -1) {
          result = result.substring(xmlDeclEnd + 2).trim()
        }
      }

      return result
    } else {
      return fallbackXmlBeautify(trimmed, indentSize, config)
    }
  } catch (error) {
    return fallbackXmlBeautify(text, indentSize, config)
  }
}

function fallbackXmlBeautify(text, indentSize, config) {
  try {
    let trimmed = text.trim()
    let formatted = ''
    let indent = 0
    let i = 0

    while (i < trimmed.length) {
      if (trimmed[i] === '<') {
        const closeIdx = trimmed.indexOf('>', i)
        if (closeIdx === -1) break

        const tag = trimmed.substring(i, closeIdx + 1)

        if (tag.startsWith('<!--')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<![CDATA[')) {
          const cdataEnd = trimmed.indexOf(']]>', i)
          if (cdataEnd !== -1) {
            const cdata = trimmed.substring(i, cdataEnd + 3)
            formatted += indentSize.repeat(indent) + cdata + '\n'
            i = cdataEnd + 3
          } else {
            i = closeIdx + 1
          }
          continue
        }

        if (tag.startsWith('<?')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<!')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('</')) {
          indent = Math.max(0, indent - 1)
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
        } else if (tag.endsWith('/>')) {
          formatted += indentSize.repeat(indent) + tag + '\n'
          i = closeIdx + 1
        } else {
          const tagName = tag.slice(1, -1).split(/\s+/)[0]
          formatted += indentSize.repeat(indent) + tag
          i = closeIdx + 1

          const nextTagIdx = trimmed.indexOf('<', i)
          if (nextTagIdx !== -1) {
            const textBetween = trimmed.substring(i, nextTagIdx)
            const closingTag = '</' + tagName + '>'

            if (textBetween.trim() && trimmed.substring(nextTagIdx).startsWith(closingTag)) {
              formatted += textBetween + closingTag + '\n'
              i = nextTagIdx + closingTag.length
              continue
            } else if (!textBetween.trim()) {
              formatted += '\n'
              indent++
            } else {
              formatted += textBetween + '\n'
              i = nextTagIdx
              indent++
              continue
            }
          } else {
            formatted += '\n'
            indent++
          }
        }
      } else {
        i++
      }
    }

    return formatted.trim()
  } catch (error) {
    return { error: 'Failed to beautify XML: ' + error.message }
  }
}

function xmlMinify(text, config) {
  try {
    let result = text

    if (config?.removeComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '')
    }

    if (config?.removeCDATA) {
      result = result.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '')
    }

    if (config?.removeXMLDeclaration) {
      result = result.replace(/<\?xml[^?]*\?>/g, '')
    }

    result = result.replace(/>\s+</g, '><').trim()

    return result.trim()
  } catch (error) {
    return { error: 'Failed to minify XML: ' + error.message }
  }
}

function xmlValidate(text) {
  try {
    const trimmed = text.trim()
    const errors = []

    if (!trimmed.startsWith('<')) {
      return { status: 'invalid', errors: [{ level: 'error', message: 'Invalid XML: Does not start with < character', line: 1, column: 1 }] }
    }

    let depth = 0
    const tagStack = []
    let i = 0
    let lineNum = 1

    while (i < trimmed.length) {
      if (trimmed[i] === '\n') {
        lineNum++
      }

      if (trimmed[i] === '<') {
        const closeIdx = trimmed.indexOf('>', i)
        if (closeIdx === -1) {
          errors.push({ level: 'error', message: 'Unclosed tag at position ' + i, line: lineNum, column: i - trimmed.lastIndexOf('\n', i) })
          break
        }

        const tag = trimmed.substring(i, closeIdx + 1)

        if (tag.startsWith('<!--')) {
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<![CDATA[')) {
          const cdataEnd = trimmed.indexOf(']]>', i)
          if (cdataEnd === -1) {
            errors.push({ level: 'error', message: 'Unclosed CDATA section', line: lineNum, column: 1 })
            break
          }
          i = cdataEnd + 3
          continue
        }

        if (tag.startsWith('<?')) {
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('<!')) {
          i = closeIdx + 1
          continue
        }

        if (tag.startsWith('</')) {
          const tagName = tag.slice(2, -1).trim().split(/\s/)[0]
          if (tagStack.length === 0 || tagStack[tagStack.length - 1] !== tagName) {
            errors.push({ level: 'error', message: 'Mismatched closing tag: </' + tagName + '>', line: lineNum, column: 1 })
          } else {
            tagStack.pop()
            depth--
          }
        } else if (tag.endsWith('/>')) {
          // Self-closing tag
        } else {
          const tagName = tag.slice(1, -1).trim().split(/\s/)[0]
          tagStack.push(tagName)
          depth++
        }

        i = closeIdx + 1
      } else {
        i++
      }
    }

    if (tagStack.length > 0) {
      errors.push({ level: 'error', message: 'Unclosed tags: ' + tagStack.join(', '), line: lineNum, column: 1 })
    }

    if (errors.length === 0) {
      return { status: 'valid', errors: [] }
    }

    return { status: 'invalid', errors }
  } catch (error) {
    return { status: 'error', errors: [{ level: 'error', message: 'Validation error: ' + error.message, line: 1, column: 1 }] }
  }
}

function getXmlRepairDifferences(original, repaired) {
  const normalizeForComparison = (xml) => {
    return xml.replace(/\s+/g, ' ').trim()
  }

  const normalizedOrig = normalizeForComparison(original)
  const normalizedRepaired = normalizeForComparison(repaired)

  if (normalizedOrig === normalizedRepaired) {
    return []
  }

  return [{
    lineNumber: 1,
    original: original.trim(),
    repaired: repaired.trim(),
    comprehensive: true
  }]
}

function autoRepairXml(xml) {
  const originalXml = xml

  try {
    let xmlParser
    try {
      if (typeof window === 'undefined') {
        xmlParser = require('fast-xml-parser')
      }
    } catch (e) {
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    if (!xmlParser || !xmlParser.XMLParser || !xmlParser.XMLBuilder) {
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    // STEP 1: Check if already valid using strict parser
    const strictParser = new xmlParser.XMLParser({
      ignoreAttributes: false,
      allowBooleanAttributes: true,
    })

    let isValid = false
    try {
      strictParser.parse(originalXml)
      isValid = true
    } catch (e) {
      isValid = false
    }

    // If already valid, skip repair to preserve comments/CDATA
    if (isValid) {
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    // STEP 2: Create tolerant parser for repair
    const tolerantParser = new xmlParser.XMLParser({
      ignoreAttributes: false,
      preserveOrder: true,
      allowBooleanAttributes: true,
      commentPropName: '#comment',
      cdataPropName: '#cdata',
      alwaysCreateTextNode: true,
      trimValues: false,
    })

    let parsed
    try {
      parsed = tolerantParser.parse(originalXml)
    } catch (err) {
      return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
    }

    // STEP 3: Rebuild XML from repaired AST
    const builder = new xmlParser.XMLBuilder({
      ignoreAttributes: false,
      preserveOrder: true,
      suppressBooleanAttributes: false,
      format: false,
      commentPropName: '#comment',
      cdataPropName: '#cdata',
    })

    let repairedXml = builder.build(parsed)

    // STEP 4: Validate the rebuilt XML to ensure it's actually valid
    let isRepairedValid = false
    try {
      strictParser.parse(repairedXml)
      isRepairedValid = true
    } catch (e) {
      isRepairedValid = false
    }

    // Only return repair if the result is valid and different from original
    if (isRepairedValid && repairedXml !== originalXml) {
      const repairDiffs = getXmlRepairDifferences(originalXml, repairedXml)
      return {
        xml: repairedXml,
        wasRepaired: true,
        method: 'fast-xml-parser-recover',
        repairs: repairDiffs,
      }
    }

    return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
  } catch (error) {
    return { xml: originalXml, wasRepaired: false, method: null, repairs: [] }
  }
}

function applyXmlCleanup(xml, config) {
  let result = xml

  if (config?.removeComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '')
  }

  if (config?.removeCDATA) {
    result = result.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  }

  if (config?.removeXMLDeclaration) {
    result = result.replace(/<\?xml[^?]*\?>/g, '')
  }

  return result.trim()
}

function xmlLint(text) {
  try {
    const warnings = []
    const trimmed = text.trim()

    if (!trimmed.startsWith('<')) {
      return { total: 0, warnings, status: 'invalid', error: 'Invalid XML' }
    }

    const tagRegex = /<(\w+)([^>]*)>/g
    let match

    while ((match = tagRegex.exec(trimmed)) !== null) {
      const tagName = match[1]
      const attrsStr = match[2]

      if (attrsStr) {
        const attrs = attrsStr.match(/(\w+)=/g)
        if (attrs && attrs.length > 1) {
          const attrNames = attrs.map(a => a.slice(0, -1))
          const sorted = [...attrNames].sort()
          if (JSON.stringify(attrNames) !== JSON.stringify(sorted)) {
            warnings.push({
              level: 'warning',
              message: 'Attributes not in alphabetical order in <' + tagName + '>',
              ruleId: 'attribute-order',
              line: trimmed.substring(0, match.index).split('\n').length,
              column: 1
            })
          }
        }
      }
    }

    const indentMatch = trimmed.match(/^(\s+)/)
    if (indentMatch) {
      const indent = indentMatch[1]
      if (indent.length % 2 !== 0 && indent.length % 4 !== 0 && indent !== '\t') {
        warnings.push({
          level: 'warning',
          message: 'Inconsistent indentation',
          ruleId: 'indent-consistency',
          line: 1,
          column: 1
        })
      }
    }

    return { total: warnings.length, warnings, status: warnings.length === 0 ? 'valid' : 'invalid' }
  } catch (error) {
    return { total: 0, warnings: [], status: 'error', error: 'Linting failed: ' + error.message }
  }
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
  cleanParsedXml,
  getSemanticTextKey,
  getPluralKey,
  getSingularKey,
  normalizeValue,
  semanticallySortObject,
  normalizeCDATAIndentation,
  transformXmlToHumanFriendlyYaml,
  transformXmlToHumanFriendlyJson,
  xmlToJson,
  fallbackXmlToJson,
  xmlToYaml,
  serializeToToml,
  xmlToToml,
  serializeNode,
  xmlXPath,
  fallbackXmlXPath,
  xmlBeautify,
  fallbackXmlBeautify,
  xmlMinify,
  xmlValidate,
  xmlLint,
  autoRepairXml,
  applyXmlCleanup,
  getXmlRepairDifferences,
};
