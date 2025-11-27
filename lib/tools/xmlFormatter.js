// lib/tools/xmlFormatter.js

const { XMLValidator } = require('fast-xml-parser');
const xmlFormatter = require('xml-formatter');

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
 *
 * (Trim whitespace handled later in formatting/minify step.)
 */
function applyCleanupOptions(xmlString, options = {}) {
  let out = xmlString;

  const {
    removeDeclaration = false,
    removeComments = false,
    removeCDATA = false,
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

  return out;
}

/* ============================
 *  SAFE MINIFY / TRIM WHITESPACE
 * ============================ */

/**
 * Safe minifier:
 * - Removes whitespace *between* tags
 * - Removes indentation and blank lines
 * - Preserves text and CDATA exactly
 */
function safeMinifyXML(xml) {
  let result = '';
  let i = 0;
  const len = xml.length;

  while (i < len) {
    // CDATA handling: copy block verbatim
    if (xml.startsWith('<![CDATA[', i)) {
      const endIdx = xml.indexOf(']]>', i);
      if (endIdx === -1) {
        // malformed CDATA; just append rest
        result += xml.slice(i);
        break;
      }
      result += xml.slice(i, endIdx + 3);
      i = endIdx + 3;
      continue;
    }

    const ch = xml[i];

    if (ch === '<') {
      // remove any trailing whitespace we might have just added (between tags)
      let j = result.length - 1;
      while (j >= 0 && /\s/.test(result[j])) {
        result = result.slice(0, j);
        j--;
      }

      // copy tag content until '>'
      const closeIdx = xml.indexOf('>', i);
      if (closeIdx === -1) {
        result += xml.slice(i);
        break;
      }
      result += xml.slice(i, closeIdx + 1);
      i = closeIdx + 1;
    } else if (/\s/.test(ch)) {
      // whitespace outside tags
      let j = i;
      while (j < len && /\s/.test(xml[j])) j++;

      // lookahead: if next non-whitespace is '<', this whitespace is purely inter-tag → drop it
      if (j < len && xml[j] === '<') {
        i = j;
      } else {
        // part of actual text node → preserve exactly
        result += xml.slice(i, j);
        i = j;
      }
    } else {
      result += ch;
      i++;
    }
  }

  return result.trim();
}

/* ============================
 *  FINAL FORMATTING
 * ============================ */

/**
 * Beautify / minify / none.
 * Respects indentSize: "2" | "4" | "tab"
 * trimWhitespaceBetweenTags affects ONLY minify/none, not beautify.
 */
function formatFinalXML(
  xmlString,
  mode = 'beautify',
  indentSize = '2',
  trimWhitespaceBetweenTags = false
) {
  if (mode === 'minify') {
    // Always produce compact safe-minified XML
    const compact = safeMinifyXML(xmlString);
    return compact;
  }

  if (mode === 'beautify') {
    // Beautify with xml-formatter. Indent setting respected here.
    const indentMap = {
      '2': '  ', // two spaces
      '4': '    ', // four spaces
      tab: '\t', // real tab char
    };
    const indentation = indentMap[indentSize] || indentMap['2'];

    try {
      return xmlFormatter(xmlString, {
        indentation,
        collapseContent: false, // keep multi-line/pretty CDATA & content (Option B)
        lineSeparator: '\n',
      });
    } catch (e) {
      // If xml-formatter throws, just return original string.
      return xmlString;
    }
  }

  // mode === 'none' (or "clean" mapped to "none")
  if (trimWhitespaceBetweenTags) {
    return safeMinifyXML(xmlString);
  }

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
  const trimWhitespaceBetweenTags = !!options.trimWhitespaceBetweenTags;

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

  // 4. Cleanup toggles (no trimWhitespace here)
  const cleanedXml = applyCleanupOptions(repairedXml, {
    removeDeclaration: options.removeDeclaration,
    removeComments: options.removeComments,
    removeCDATA: options.removeCDATA,
  });

  // 5. Final formatting (beautify/minify/none) + trimWhitespaceBetweenTags behavior
  const finalXml = formatFinalXML(
    cleanedXml,
    formatMode,
    indentSize,
    trimWhitespaceBetweenTags
  );

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
      trimWhitespaceBetweenTags,
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
  safeMinifyXML,
};
