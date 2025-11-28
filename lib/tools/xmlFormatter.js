// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');

/* ============================
 *  VALIDATION
 * ============================ */

function strictValidate(xmlString) {
  const result = XMLValidator.validate(xmlString, {
    allowBooleanAttributes: true,
  });

  if (result === true) return { isValid: true, errors: [] };

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

function fixCdataMissingClosures(xml) {
  return xml.replace(
    /<([a-zA-Z0-9:_-]+)>\s*<!\[CDATA\[([\s\S]*?)\]\]>(?!\s*<\/\1>)/g,
    (_m, tag, content) => `<${tag}><![CDATA[${content}]]></${tag}>`
  );
}

function fixBrokenTagClosures(xml) {
  let out = xml;

  out = out.replace(/<\/([a-zA-Z0-9:_-]+)\s+(?=>)/g, '</$1>');
  out = out.replace(/<\/([a-zA-Z0-9:_-]+)\s*$/gm, '</$1>');
  out = out.replace(/<([a-zA-Z0-9:_-]+)([^>\n]*?)\n/g, '<$1$2>\n');
  out = out.replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, '<$1$2>');

  // NEW FIX: auto-close broken siblings like <person> ... <person>
  out = out.replace(
    /<([a-zA-Z0-9:_-]+)([^>]*)>([\s\S]*?)<\1([^>]*)>/g,
    (m, tag, a1, between, a2) => {
      if (!between.includes(`</${tag}>`)) {
        return `<${tag}${a1}>${between}</${tag}><${tag}${a2}>`;
      }
      return m;
    }
  );

  return out;
}

function sanitizeLoose(xml) {
  const parts = xml.split(/(<!\[CDATA\[[\s\S]*?\]\]>)/g);
  return parts
    .map((part, idx) => {
      if (idx % 2 === 1) return part;
      return part
        .replace(/&(?!(amp|lt|gt|apos|quot);)/g, '&amp;')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    })
    .join('');
}

function softFix(xml) {
  return xml;
}

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
  if (!rootMatch) warnings.push('No clear root element detected.');

  const topLevelTags = trimmed.match(/^<([a-zA-Z_][\w.\-:]*)[\s>]/gm);
  if (topLevelTags && topLevelTags.length > 1) {
    warnings.push('Multiple top-level elements detected.');
  }

  return warnings;
}

/* ============================
 *  CLEANUP OPTIONS
 * ============================ */

function applyCleanupOptions(xmlString, options = {}) {
  let out = xmlString;

  if (options.removeDeclaration) {
    out = out.replace(/<\?xml[^>]*\?>\s*/i, '');
  }

  if (options.removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (options.removeCDATA) {
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  }

  if (options.trimWhitespaceBetweenTags) {
    out = out.replace(/>\s+</gm, '><');
  }

  return out;
}

/* ============================
 *  CUSTOM BEAUTIFIERS
 * ============================ */

// NEW — preserve whitespace EXACTLY as user typed (no collapsing)
function beautifyXmlPreserveWhitespace(xmlString, indentUnit = '  ') {
  return xmlString
    .split('\n')
    .map((line) => line) // passthrough
    .join('\n');
}

// Existing advanced beautifier
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

  const isWhitespaceText = (t) => t.indexOf('<') === -1 && t.trim() === '';
  const isCdata = (t) => t.startsWith('<![CDATA[');
  const isComment = (t) => t.startsWith('<!--');
  const isTag =
    (t) => t.startsWith('<') && t.endsWith('>') && !isCdata(t) && !isComment(t);
  const isDecl = (t) => t.startsWith('<?');
  const isCloseTag = (t) => /^<\/[^>]+>$/.test(t.trim());
  const isSelfClosing = (t) => /^<[^!?][^>]*?\/>$/.test(t.trim());

  const getTagName = (t) => {
    const m = t.trim().match(/^<\??\/?\s*([^\s>\/]+)/);
    return m ? m[1] : null;
  };

  const inlineContentKind = (t) => {
    if (isCdata(t)) {
      return t.indexOf('\n') === -1 ? 'cdata' : null;
    }
    if (t.indexOf('<') === -1 && t.indexOf('\n') === -1 && t.trim() !== '') {
      return 'text';
    }
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
            outLines.push(
              indentUnit.repeat(level) +
                tok.trim() +
                contentTok.trim() +
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
      const inner = raw.slice('<![CDATA['.length, -']]>'.length);
      const lines = inner.split('\n');

      const nonEmpty = lines.filter((l) => l.trim() !== '');
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
 *  MINIFY (ULTRA TIGHT)
 * ============================ */

function minifyXmlStandard(xmlString) {
  let out = xmlString;

  out = out.replace(/<!--[\s\S]*?-->/g, ''); // comments gone
  out = out.replace(/>\s+</g, '><'); // collapse
  out = out.replace(/\s+/g, ' '); // normalize interior
  out = out.replace(/\s*([<>])\s*/g, '$1'); // strip around <> borders
  return out.trim();
}

/* ============================
 *  FINAL FORMATTING (BEAUTIFY / MINIFY / NONE)
 * ============================ */

function formatFinalXML(xmlString, mode = 'beautify', indentSize = '2', options = {}) {
  const indentMap = {
    '2': '  ',
    '4': '    ',
    tab: '\t',
  };

  const indentation = indentMap[indentSize] || indentMap['2'];

  if (mode === 'minify') {
    return minifyXmlStandard(xmlString);
  }

  if (mode === 'beautify') {
    if (!options.trimWhitespaceBetweenTags) {
      return beautifyXmlPreserveWhitespace(xmlString, indentation);
    }
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
  const max = Math.max(origLines.length, newLines.length);

  for (let i = 0; i < max; i++) {
    const o = origLines[i] || '';
    const n = newLines[i] || '';
    if (o !== n) diff.push({ line: i + 1, original: o, repaired: n });
  }

  return diff;
}

function generateRepairSummary(diff) {
  const messages = [];

  diff.forEach(({ original, repaired, line }) => {
    const o = original.trim();
    const r = repaired.trim();

    if (/^<[^>]+$/.test(o) && />$/.test(r)) {
      messages.push(`Added missing '>' for tag on line ${line}.`);
      return;
    }

    if (
      /<([a-zA-Z0-9:_-]+)>.*<\1>/.test(o) &&
      /<([a-zA-Z0-9:_-]+)>.*<\/\1>/.test(r)
    ) {
      messages.push(`Converted mistaken opening tag into closing tag on line ${line}.`);
      return;
    }

    if (o.includes('&') && !o.includes('&amp;') && r.includes('&amp;')) {
      messages.push(`Escaped bare '&' on line ${line}.`);
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

  const validation = {
    original: strictValidate(inputXml),
    repaired: strictValidate(repairedXml),
  };

  const lintWarnings = lintXML(repairedXml);

  const cleanedXml = applyCleanupOptions(repairedXml, options);

  const finalXml = formatFinalXML(cleanedXml, formatMode, indentSize, options);

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
      ...options,
      formatMode,
      indentSize,
    },
  };
}

/* ============================
 *  EXPORTS
 * ============================ */

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
