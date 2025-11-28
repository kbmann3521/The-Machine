// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');

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
 *
 * Extended to support attributes on the first tag:
 * <person id="1"> ... <person>  →  <person id="1"> ... </person>
 */
function fixAccidentalOpeningTags(xml) {
  return xml.replace(
    /<([a-zA-Z0-9:_-]+)([^>]*)>([\s\S]*?)<\1>/g,
    (match, tag, attrs, between) => {
      if (between.includes(`</${tag}>`)) return match;
      return `<${tag}${attrs}>${between}</${tag}>`;
    }
  );
}

/**
 * STAGE 0.5 — Fix elements that wrap a CDATA block but are missing their closing tag.
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
    .replace(/<\/([a-zA-Z0-9:_-]+)\s+(?=>)/g, '</$1>')
    .replace(/<\/([a-zA-Z0-9:_-]+)\s*$/gm, '</$1>')
    .replace(/<([a-zA-Z0-9:_-]+)([^>\n]*?)\n/g, '<$1$2>\n')
    .replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, '<$1$2>');
}

/**
 * STAGE 2 — Sanitize illegal characters & bare '&' outside CDATA.
 */
function sanitizeLoose(xml) {
  const parts = xml.split(/(<!\[CDATA\[[\s\S]*?\]\]>)/g);
  return parts
    .map((part, idx) => {
      if (idx % 2 === 1 && part.startsWith('<![CDATA[')) return part;
      return part
        .replace(/&(?!(amp|lt|gt|apos|quot);)/g, '&amp;')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    })
    .join('');
}

/**
 * STAGE 3 — Reserved for soft token fixes
 */
function softFix(xml) {
  return xml;
}

/**
 * AUTO-REPAIR PIPELINE
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

      if (!/[<>&]/.test(inner)) return inner.trim();

      const snippet = `<root>${inner}</root>`;
      const result = XMLValidator.validate(snippet, {
        allowBooleanAttributes: true,
      });

      if (result === true) return inner;

      return inner
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    });
  }

  return out;
}

/* ============================
 *  NEW: Collapse empty elements into <tag/>
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
 *  DIFF + SUMMARY
 * ============================ */

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

function generateRepairSummary(diff) {
  const messages = [];

  diff.forEach((d) => {
    const { original, repaired, line } = d;
    const o = original.trim();
    const r = repaired.trim();

    if (/<[/]?[a-zA-Z0-9:_-]+[^>]*$/.test(o) && />\s*$/.test(r)) {
      messages.push(`Added missing '>' for tag on line ${line}.`);
      return;
    }

    if (
      /<([a-zA-Z0-9:_-]+)>.*<\1>/.test(o) &&
      /<([a-zA-Z0-9:_-]+)>.*<\/\1>/.test(r)
    ) {
      messages.push(
        `Converted mistaken opening tag into closing tag on line ${line}.`
      );
      return;
    }

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

function processXmlTool(inputXml, options = {}) {
  const formatMode = options.formatMode || 'beautify';
  const autoRepairEnabled = options.autoRepair !== false;
  const indentSize = options.indentSize || '2';

  let repairedXml = inputXml;
  let repairInfo = null;

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

  const originalValidation = strictValidate(inputXml);
  const repairedValidation = strictValidate(repairedXml);

  const validation = {
    original: originalValidation,
    repaired: repairedValidation,
  };

  const lintWarnings = lintXML(repairedXml);

  const cleanedXml = applyCleanupOptions(repairedXml, options);

  // NEW: collapse empty elements to <tag/>
  const collapsedXml = collapseEmptyElements(cleanedXml);

  const finalXml = formatFinalXML(collapsedXml, formatMode, indentSize);

  return {
    ok: true,
    stage: 'done',
    originalXml: inputXml,
    repairedXml,
    cleanedXml,
    collapsedXml,
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
