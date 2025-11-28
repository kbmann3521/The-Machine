// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');
const prettData = require('pretty-data');
const pd = prettData.pd;

/* ============================
 *  VALIDATION
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
 *  AUTO-REPAIR STAGES
 * ============================ */

/**
 * STAGE 0 — Fix accidental opening tags that should be closing tags.
 * Example: <name>John<name>  →  <name>John</name>
 */
function fixAccidentalOpeningTags(xml) {
  return xml.replace(
    /<([a-zA-Z0-9:_-]+)>([\s\S]*?)<\1>/g,
    (match, tag, between) => {
      if (!between.includes(`</${tag}>`)) {
        return `<${tag}>${between}</${tag}>`;
      }
      return match;
    }
  );
}

/**
 * STAGE 0.5 — Fix elements that wrap a CDATA block but are missing their closing tag.
 * Example: <bio><![CDATA[...]]>  →  <bio><![CDATA[...]]></bio>
 */
function fixCdataMissingClosures(xml) {
  return xml.replace(
    /<([a-zA-Z0-9:_-]+)>\s*<!\[CDATA\[([\s\S]*?)\]\]>(?!\s*<\/\1>)/g,
    (_m, tag, content) => `<${tag}><![CDATA[${content}]]></${tag}>`
  );
}

/**
 * STAGE 1 — Fix broken tag closures (missing ">", dangling closing tags, etc.)
 */
function fixBrokenTagClosures(xml) {
  return xml
    // Fix closing tags with extra space: </name   > → </name>
    .replace(/<\/([a-zA-Z0-9:_-]+)\s+(?=>)/g, '</$1>')
    // Fix closing tags missing > at end of line: "</name" → "</name>"
    .replace(/<\/([a-zA-Z0-9:_-]+)\s*$/gm, '</$1>')
    // Fix opening tags missing > before newline: "<name\n" → "<name>\n"
    .replace(/<([a-zA-Z0-9:_-]+)([^>\n]*?)\n/g, '<$1$2>\n')
    // Fix opening tags missing > at end of line/file: "<tag attr="x"" → "<tag attr="x">'
    .replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, '<$1$2>');
}

/**
 * STAGE 2 — Sanitize illegal characters & bare '&' outside CDATA.
 */
function sanitizeLoose(xml) {
  const parts = xml.split(/(<!\[CDATA\[[\s\S]*?\]\]>)/g);
  return parts
    .map((part, idx) => {
      // Odd indices are CDATA blocks; leave them untouched
      if (idx % 2 === 1 && part.startsWith('<![CDATA[')) return part;
      return part
        .replace(/&(?!(amp|lt|gt|apos|quot);)/g, '&amp;')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    })
    .join('');
}

/**
 * STAGE 3 — Reserved for soft token fixes (kept conservative).
 */
function softFix(xml) {
  return xml;
}

/**
 * AUTO-REPAIR PIPELINE
 *
 * Returns:
 *  - ok: true/false
 *  - stage: 'success' | 'validate'
 *  - repairedXml: string
 *  - validation: { isValid, errors }
 */
function autoRepairXML(inputXml) {
  const stage0 = fixAccidentalOpeningTags(inputXml);
  const stage05 = fixCdataMissingClosures(stage0);
  const stage1 = fixBrokenTagClosures(stage05);
  const stage2 = sanitizeLoose(stage1);
  const stage3 = softFix(stage2);

  const candidate = stage3;
  const validation = strictValidate(candidate);

  if (!validation.isValid) {
    return {
      ok: false,
      stage: 'validate',
      error: 'Unable to fully auto-repair XML. Still not well-formed.',
      validation,
      repairedXml: candidate,
    };
  }

  return {
    ok: true,
    stage: 'success',
    validation,
    repairedXml: candidate,
  };
}

/* ============================
 *  LINTING
 * ============================ */

function lintXML(xmlString) {
  const warnings = [];
  const trimmed = xmlString.trim();

  if (!trimmed.startsWith('<?xml')) {
    warnings.push('No XML declaration found (e.g., <?xml version="1.0"?>).');
  }

  const rootMatch = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/m);
  if (!rootMatch) {
    warnings.push('No clear root element detected.');
  }

  const topLevelTags = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/gm);
  if (topLevelTags && topLevelTags.length > 1) {
    warnings.push(
      'Multiple top-level elements detected. XML should normally have a single root element.'
    );
  }

  return warnings;
}

/* ============================
 *  CLEANUP OPTIONS
 * ============================ */

/**
 * Cleanup toggles:
 * - removeDeclaration
 * - removeComments
 * - removeCDATA
 * - trimWhitespaceBetweenTags
 */
function applyCleanupOptions(xmlString, options = {}) {
  let out = xmlString;

  const {
    removeDeclaration = false,
    removeComments = false,
    removeCDATA = false,
    trimWhitespaceBetweenTags = false,
  } = options;

  if (removeDeclaration) {
    // remove declaration + trailing whitespace/newline
    out = out.replace(/<\?xml[^>]*\?>\s*/i, '');
  }

  if (removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (removeCDATA) {
    // unwrap CDATA but keep content
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  }

  if (trimWhitespaceBetweenTags) {
    // collapse whitespace BETWEEN tags (preserve content inside tags)
    out = out.replace(/>\s+</gm, '><');
  }

  return out;
}

/* ============================
 *  CUSTOM BEAUTIFIER (STANDARD STYLE)
 * ============================ */

/**
 * Beautify XML with:
 * - Style A CDATA blocks
 * - Inline simple text nodes: <name>John</name>
 * - Inline single-line CDATA nodes: <bio><![CDATA[...]]></bio>
 */
function beautifyXmlStandard(xmlString, indentUnit = '  ') {
  const tokenRe = /(<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<[^>]+>)/g;
  const tokens = [];
  let pos = 0;
  let m;

  // Tokenize into [text, tag/comment/CDATA, text, ...]
  while ((m = tokenRe.exec(xmlString)) !== null) {
    if (m.index > pos) {
      tokens.push(xmlString.slice(pos, m.index));
    }
    tokens.push(m[0]);
    pos = m.index + m[0].length;
  }
  if (pos < xmlString.length) {
    tokens.push(xmlString.slice(pos));
  }

  const isWhitespaceText = (tok) =>
    tok.indexOf('<') === -1 && tok.trim() === '';

  const isCdata = (tok) => tok.startsWith('<![CDATA[');

  const isComment = (tok) => tok.startsWith('<!--');

  const isTag = (tok) =>
    tok.startsWith('<') &&
    tok.endsWith('>') &&
    !isCdata(tok) &&
    !isComment(tok);

  const isDecl = (tok) => tok.startsWith('<?');

  const isCloseTag = (tok) => /^<\/[^>]+>$/.test(tok.trim());

  const isSelfClosing = (tok) =>
    /^<[^!?][^>]*?\/>$/.test(tok.trim());

  const getTagName = (tok) => {
    const match = tok.trim().match(/^<\??\/?\s*([^\s>\/]+)/);
    return match ? match[1] : null;
  };

  // 'text' or 'cdata' when safe to inline, else null
  const inlineContentKind = (tok) => {
    if (isCdata(tok)) {
      return tok.indexOf('\n') === -1 ? 'cdata' : null;
    }
    if (
      tok.indexOf('<') === -1 &&
      tok.indexOf('\n') === -1 &&
      tok.trim() !== ''
    ) {
      return 'text';
    }
    return null;
  };

  const outLines = [];
  let level = 0;
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];

    // Skip pure whitespace text
    if (isWhitespaceText(tok)) {
      i += 1;
      continue;
    }

    // XML declaration / comments
    if (isComment(tok) || isDecl(tok)) {
      outLines.push(indentUnit.repeat(level) + tok.trim());
      i += 1;
      continue;
    }

    // Opening tag (non-self-closing)
    if (isTag(tok) && !isCloseTag(tok) && !isSelfClosing(tok)) {
      const name = getTagName(tok);

      // Try to detect inline content: <tag>TEXT|single-line-CDATA</tag>
      let j = i + 1;
      while (j < tokens.length && isWhitespaceText(tokens[j])) {
        j += 1;
      }

      let inlined = false;

      if (j < tokens.length) {
        const kind = inlineContentKind(tokens[j]);
        if (kind) {
          const contentTok = tokens[j];
          let j2 = j + 1;

          while (j2 < tokens.length && isWhitespaceText(tokens[j2])) {
            j2 += 1;
          }

          if (
            j2 < tokens.length &&
            isCloseTag(tokens[j2]) &&
            getTagName(tokens[j2]) === name
          ) {
            const contentStr =
              kind === 'text' ? contentTok.trim() : contentTok;

            const line =
              indentUnit.repeat(level) +
              tok.trim() +
              contentStr +
              tokens[j2].trim();

            outLines.push(line);
            i = j2 + 1;
            inlined = true;
          }
        }
      }

      if (inlined) {
        continue;
      }

      // Normal block opening tag
      outLines.push(indentUnit.repeat(level) + tok.trim());
      level += 1;
      i += 1;
      continue;
    }

    // Closing tag
    if (isCloseTag(tok)) {
      level = Math.max(0, level - 1);
      outLines.push(indentUnit.repeat(level) + tok.trim());
      i += 1;
      continue;
    }

    // Self-closing tag or other generic tag
    if (isSelfClosing(tok) || isTag(tok)) {
      outLines.push(indentUnit.repeat(level) + tok.trim());
      i += 1;
      continue;
    }

    // CDATA
    if (isCdata(tok)) {
      if (tok.indexOf('\n') !== -1) {
        // Style A block CDATA
        const inner = tok.slice('<![CDATA['.length, -']]>'.length);
        const innerLines = inner.split('\n');

        outLines.push(indentUnit.repeat(level) + '<![CDATA[');
        innerLines.forEach((line) => {
          if (line.trim() !== '') {
            outLines.push(
              indentUnit.repeat(level + 1) + line.replace(/\s+$/g, '')
            );
          }
        });
        outLines.push(indentUnit.repeat(level) + ']]>');
      } else {
        // Single-line CDATA
        outLines.push(indentUnit.repeat(level) + tok.trim());
      }
      i += 1;
      continue;
    }

    // Text content (non-whitespace)
    const textLines = tok.split('\n');
    textLines.forEach((line) => {
      if (line.trim() !== '') {
        outLines.push(indentUnit.repeat(level) + line.trim());
      }
    });
    i += 1;
  }

  return outLines.join('\n');
}

/* ============================
 *  FINAL FORMATTING
 * ============================ */

/**
 * Beautify / minify / none.
 * Respects indentSize: "2" | "4" | "tab"
 */
function formatFinalXML(xmlString, mode = 'beautify', indentSize = '2') {
  if (mode === 'minify') {
    // xmlmin second arg = removeComments; we let cleanup control comments
    return pd.xmlmin(xmlString, false);
  }

  const indentMap = {
    '2': '  ', // two spaces
    '4': '    ', // four spaces
    tab: '\t',
  };
  const indentation = indentMap[indentSize] || indentMap['2'];

  if (mode === 'beautify') {
    return beautifyXmlStandard(xmlString, indentation);
  }

  // "none"
  return xmlString;
}

/* ============================
 *  DIFF + SUMMARY
 * ============================ */

/**
 * Simple line-based diff.
 * Returns [{ line, original, repaired }]
 */
function computeDiffLines(original, repaired) {
  const origLines = original.split(/\r?\n/);
  const newLines = repaired.split(/\r?\n/);

  const diff = [];
  const maxLen = Math.max(origLines.length, newLines.length);

  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i] || '';
    const n = newLines[i] || '';
    if (o !== n) {
      diff.push({ line: i + 1, original: o, repaired: n });
    }
  }

  return diff;
}

/**
 * Human-readable summary of what was fixed.
 */
function generateRepairSummary(diff) {
  const messages = [];

  diff.forEach((d) => {
    const { original, repaired, line } = d;
    const o = original.trim();
    const r = repaired.trim();

    // Added missing '>' for a tag
    if (
      /<[/]?[a-zA-Z0-9:_-]+[^>]*$/.test(o) && // looks like incomplete tag
      />\s*$/.test(r)
    ) {
      messages.push(`Added missing '>' for tag on line ${line}.`);
      return;
    }

    // Fixed duplicate opening tag to closing tag
    if (
      /<([a-zA-Z0-9:_-]+)>.*<\1>/.test(o) &&
      /<([a-zA-Z0-9:_-]+)>.*<\/\1>/.test(r)
    ) {
      messages.push(
        `Converted mistaken opening tag into closing tag on line ${line}.`
      );
      return;
    }

    // Escaped bare '&' (outside CDATA)
    if (o.includes('&') && !o.includes('&amp;') && r.includes('&amp;')) {
      messages.push(`Escaped bare '&' character on line ${line}.`);
      return;
    }
  });

  return [...new Set(messages)];
}

/* ============================
 *  MAIN PIPELINE
 * ============================ */

/**
 * High-level pipeline used by your tool hub.
 *
 * options:
 *   autoRepair?: boolean,
 *   removeDeclaration?: boolean,
 *   removeComments?: boolean,
 *   removeCDATA?: boolean,
 *   trimWhitespaceBetweenTags?: boolean,
 *   formatMode?: 'beautify' | 'minify' | 'none',
 *   indentSize?: '2' | '4' | 'tab'
 */
function processXmlTool(inputXml, options = {}) {
  const formatMode = options.formatMode || 'beautify';
  const autoRepairEnabled = options.autoRepair !== false;
  const indentSize = options.indentSize || '2';

  let repairedXml = inputXml;
  let repairInfo = null;

  // 1. Auto-repair (optional)
  if (autoRepairEnabled) {
    const repairResult = autoRepairXML(inputXml);
    repairedXml = repairResult.repairedXml || inputXml;

    const diff = computeDiffLines(inputXml, repairedXml);
    const summary = generateRepairSummary(diff);

    repairInfo = {
      ...repairResult,
      originalXml: inputXml,
      repairedXml,
      diff,
      summary,
      wasRepaired: diff.length > 0,
    };
  }

  // 2. Validation (original + repaired)
  const originalValidation = strictValidate(inputXml);
  const repairedValidation = strictValidate(repairedXml);

  const validation = {
    original: originalValidation,
    repaired: repairedValidation,
  };

  // 3. Linting (style hints)
  const lintWarnings = lintXML(repairedXml);

  // 4. Cleanup toggles
  const cleanedXml = applyCleanupOptions(repairedXml, options);

  // 5. Final formatting (beautify/minify/none)
  const finalXml = formatFinalXML(cleanedXml, formatMode, indentSize);

  return {
    ok: true,
    stage: 'done',
    originalXml: inputXml,
    repairedXml,
    cleanedXml,
    finalXml,
    lintWarnings,
    validation,
    repairInfo,
    optionsApplied: {
      removeDeclaration: !!options.removeDeclaration,
      removeComments: !!options.removeComments,
      removeCDATA: !!options.removeCDATA,
      trimWhitespaceBetweenTags: !!options.trimWhitespaceBetweenTags,
      formatMode,
      indentSize,
      autoRepair: autoRepairEnabled,
    },
  };
}

module.exports = {
  autoRepairXML,
  lintXML,
  applyCleanupOptions,
  formatFinalXML,
  processXmlTool,
  strictValidate,
  computeDiffLines,
  generateRepairSummary,
};
