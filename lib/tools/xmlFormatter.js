// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');
const prettData = require('pretty-data');
const pd = prettData.pd;
const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');

/* ============================
 *  VALIDATION
 * ============================ */

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
  return xml
    .replace(/<\/([a-zA-Z0-9:_-]+)\s+(?=>)/g, '</$1>')
    .replace(/<\/([a-zA-Z0-9:_-]+)\s*$/gm, '</$1>')
    .replace(/<([a-zA-Z0-9:_-]+)([^>\n]*?)\n/g, '<$1$2>\n')
    .replace(/<([a-zA-Z0-9:_-]+)([^>]*)$/gm, '<$1$2>');
}

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
  if (!rootMatch) {
    warnings.push('No clear root element detected.');
  }

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

  const {
    removeDeclaration = false,
    removeComments = false,
    removeCDATA = false,
    trimWhitespaceBetweenTags = false,
  } = options;

  if (removeDeclaration) {
    out = out.replace(/<\?xml[^>]*\?>\s*/i, '');
  }

  if (removeComments) {
    out = out.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (removeCDATA) {
    out = out.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  }

  if (trimWhitespaceBetweenTags) {
    out = out.replace(/>\s+</gm, '><');
  }

  return out;
}

/* ============================
 *  NEW: STANDARD XML PRETTY PRINTER
 * ============================ */

function prettyPrintXML(xmlString, indent = '  ') {
  const parser = new DOMParser({
    errorHandler: { warning: null, error: null, fatalError: null }
  });

  const dom = parser.parseFromString(xmlString, 'application/xml');
  const serializer = new XMLSerializer();
  const xml = serializer.serializeToString(dom);

  const lines = xml
    .replace(/(>)(<)/g, '$1\n$2')
    .split('\n');

  let level = 0;
  const prettyLines = [];

  for (let line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('</')) {
      level--;
    }

    prettyLines.push(indent.repeat(level) + trimmed);

    if (
      trimmed.startsWith('<') &&
      !trimmed.startsWith('</') &&
      !trimmed.endsWith('/>') &&
      !trimmed.includes('></')
    ) {
      level++;
    }
  }

  return prettyLines.join('\n');
}

/* ============================
 *  FINAL FORMATTING
 * ============================ */

function formatFinalXML(xmlString, mode = 'beautify', indentSize = '2') {
  const indentMap = { '2': '  ', '4': '    ', tab: '\t' };
  const indentation = indentMap[indentSize] || indentMap['2'];

  if (mode === 'minify') return pd.xmlmin(xmlString, false);
  if (mode === 'none') return xmlString;

  // ⭐ Standard pretty-print (xmllint style)
  return prettyPrintXML(xmlString, indentation);
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

  diff.forEach(({ original, repaired, line }) => {
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
      messages.push(`Converted mistaken opening tag into closing tag on line ${line}.`);
      return;
    }

    if (o.includes('&') && !o.includes('&amp;') && r.includes('&amp;')) {
      messages.push(`Escaped bare '&' on line ${line}.`);
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

  const validation = {
    original: strictValidate(inputXml),
    repaired: strictValidate(repairedXml),
  };

  const lintWarnings = lintXML(repairedXml);

  const cleanedXml = applyCleanupOptions(repairedXml, options);

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
