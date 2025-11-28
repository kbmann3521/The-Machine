// lib/tools/jsFormatter.js

// =============================
// OPTIONAL MODULE LOADING
// =============================
let prettierModule = null;
let babelParserModule = null;
let babelGeneratorModule = null;
let terserModule = null;
let obfuscatorModule = null;
let eslintModule = null;

try {
  if (typeof window === 'undefined') {
    prettierModule = require('prettier');
    babelParserModule = require('@babel/parser');
    babelGeneratorModule = require('@babel/generator').default;
    terserModule = require('terser');
    obfuscatorModule = require('javascript-obfuscator');
    eslintModule = require('eslint');
  }
} catch (error) {
  // Optional modules not available (e.g., client-side build)
}

/* ============================
 *  VALIDATION (STRICT)
 * ============================ */

/**
 * STRICT JS validation using @babel/parser
 * Returns { isValid: boolean, errors: [{ line, column, message }] }
 */
function strictValidateJs(code) {
  // If parser not available (e.g. browser), treat as valid to avoid hard failures
  if (!babelParserModule) {
    return { isValid: true, errors: [] };
  }

  try {
    babelParserModule.parse(code, {
      sourceType: 'unambiguous',
      errorRecovery: false,
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'decorators-legacy',
        'dynamicImport',
        'exportDefaultFrom',
        'exportNamespaceFrom',
        'objectRestSpread',
        'optionalCatchBinding',
        'optionalChaining',
        'nullishCoalescingOperator',
        'topLevelAwait',
      ],
    });

    return {
      isValid: true,
      errors: [],
    };
  } catch (err) {
    const loc = err.loc || {};
    return {
      isValid: false,
      errors: [
        {
          line: loc.line || null,
          column: loc.column || null,
          message: err.message || 'Invalid JavaScript',
        },
      ],
    };
  }
}

/* ============================
 *  AUTO-REPAIR STAGES
 * ============================ */

/**
 * STAGE 0 — Normalize line endings, strip BOM, and remove non-printable control chars.
 */
function normalizeWhitespaceAndBom(code) {
  let out = code;

  // Normalize CRLF -> LF
  out = out.replace(/\r\n/g, '\n');

  // Strip BOM if present
  if (out.charCodeAt(0) === 0xfeff) {
    out = out.slice(1);
  }

  // Remove dangerous ASCII control characters (but keep tabs/newlines)
  out = out.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  return out;
}

/**
 * STAGE 0.5 — Replace curly quotes and weird unicode spaces with safe ASCII equivalents.
 */
function normalizeSmartCharacters(code) {
  let out = code;

  // Curly single quotes → normal '
  out = out.replace(/[\u2018\u2019\u201B]/g, "'");
  // Curly double quotes → normal "
  out = out.replace(/[\u201C\u201D]/g, '"');
  // Non-breaking space / weird spaces → normal space
  out = out.replace(/[\u00A0\u2007\u202F]/g, ' ');

  return out;
}

/**
 * STAGE 1 — Remove trailing whitespace per line.
 */
function stripTrailingWhitespace(code) {
  return code
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+$/g, ''))
    .join('\n');
}

/**
 * STAGE 2 — Reserved for soft token fixes (placeholder for future heuristics).
 */
function softFixJs(code) {
  // For now we keep this very conservative.
  // If you want, we can add more heuristic repairs later (e.g., stray commas, etc.)
  return code;
}

/**
 * AUTO-REPAIR PIPELINE
 *
 * Similar idea to autoRepairXML – small, safe, layered repairs, then strict validation.
 */
function autoRepairJs(inputCode) {
  const stage0 = normalizeWhitespaceAndBom(inputCode);
  const stage05 = normalizeSmartCharacters(stage0);
  const stage1 = stripTrailingWhitespace(stage05);
  const stage2 = softFixJs(stage1);

  const candidate = stage2;
  const validation = strictValidateJs(candidate);

  if (!validation.isValid) {
    return {
      ok: false,
      stage: 'validate',
      error:
        'Unable to fully auto-repair JavaScript. It still has syntax errors.',
      validation,
      repairedCode: candidate,
    };
  }

  return {
    ok: true,
    stage: 'success',
    validation,
    repairedCode: candidate,
  };
}

/* ============================
 *  LINTING (LIGHTWEIGHT)
 * ============================ */

/**
 * Very lightweight "lint" pass, independent of ESLint.
 * Returns an array of warning strings, similar to lintXML().
 */
function lintJsHeuristic(code) {
  const warnings = [];

  if (/var\s+/.test(code)) {
    warnings.push('Uses "var" declarations. Consider using "let" or "const".');
  }

  if (/==[^=]/.test(code)) {
    warnings.push(
      'Found "==" comparisons. Consider using "===" for strict equality.'
    );
  }

  if (/console\.log\s*\(/.test(code)) {
    warnings.push('Found console.log statements. Remove or guard them for prod.');
  }

  if (/debugger\s*;/.test(code)) {
    warnings.push('Found "debugger;" statements. Remove them for production.');
  }

  return warnings;
}

/* ============================
 *  CLEANUP OPTIONS
 * ============================ */

function applyCleanupOptionsJs(code, options = {}) {
  let out = code;

  const {
    removeComments = false,
    removeConsole = false,
    trimTrailingWhitespace = false,
  } = options;

  if (removeComments) {
    // Remove /* ... */ and // ... comments (non-string-aware, but works in most cases)
    out = out.replace(/\/\*[\s\S]*?\*\//g, '');
    out = out.replace(/(^|\s+)\/\/[^\n]*/g, '$1');
  }

  if (removeConsole) {
    // Naive removal of console.{log,info,warn,error,...} lines
    out = out.replace(
      /^[ \t]*console\.(log|info|warn|error|debug|trace)\s*\([^;]*\);\s*$/gm,
      ''
    );
  }

  if (trimTrailingWhitespace) {
    out = stripTrailingWhitespace(out);
  }

  return out;
}

/* ============================
 *  BEAUTIFY / MINIFY / OBFUSCATE
 * ============================ */

function formatWithPrettier(code, config = {}) {
  if (!prettierModule) {
    // Prettier not available – return code as-is.
    return code;
  }

  const {
    indentSize = '2',
    useSemicolons = true,
    singleQuotes = false,
    trailingComma = 'es5',
    printWidth = '80',
    bracketSpacing = true,
    arrowParens = 'always',
  } = config;

  const useTabs = indentSize === 'tab';
  const tabWidth = useTabs ? 2 : Number(indentSize) || 2;

  try {
    return prettierModule.format(code, {
      parser: 'babel-ts',
      semi: !!useSemicolons,
      singleQuote: !!singleQuotes,
      trailingComma: trailingComma || 'es5',
      printWidth: Number(printWidth) || 80,
      bracketSpacing: !!bracketSpacing,
      arrowParens: arrowParens || 'always',
      useTabs,
      tabWidth,
    });
  } catch (err) {
    // If Prettier fails (often due to syntax), just return the original code.
    return code;
  }
}

function minifyJsUltra(code, { safeMinify = false } = {}) {
  if (!terserModule) {
    // Fallback: simple whitespace squish if Terser not available.
    return code
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}();,:])\s*/g, '$1')
      .trim();
  }

  const options = safeMinify
    ? {
      compress: false,
      mangle: false,
      format: {
        comments: false,
      },
    }
    : {
      compress: true,
      mangle: true,
      format: {
        comments: false,
      },
    };

  try {
    const result = terserModule.minify(code, options);
    if (result.error) {
      return code;
    }
    return (result.code || '').trim();
  } catch (err) {
    return code;
  }
}

function obfuscateJs(code, obfuscatorOptions = {}) {
  if (!obfuscatorModule) return code;

  try {
    const result = obfuscatorModule.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
      deadCodeInjection: false,
      ...obfuscatorOptions,
    });
    return result.getObfuscatedCode();
  } catch (err) {
    return code;
  }
}

/**
 * FINAL formatting by mode:
 * - "format" / "beautify" → Prettier
 * - "minify"             → Terser / fallback
 * - "obfuscate"          → javascript-obfuscator / fallback
 */
function formatFinalJs(code, mode = 'format', config = {}) {
  if (mode === 'minify') {
    return minifyJsUltra(code, { safeMinify: !!config.safeMinify });
  }

  if (mode === 'obfuscate') {
    return obfuscateJs(code, config.obfuscatorOptions || {});
  }

  // default / "format" / "beautify"
  return formatWithPrettier(code, config);
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

function generateRepairSummaryJs(diff) {
  const messages = [];

  diff.forEach((d) => {
    const { original, repaired, line } = d;
    const o = original.trim();
    const r = repaired.trim();

    if (
      /[\u2018\u2019\u201B\u201C\u201D]/.test(original) &&
      !/[\u2018\u2019\u201B\u201C\u201D]/.test(repaired)
    ) {
      messages.push(`Normalized curly quotes to straight quotes on line ${line}.`);
      return;
    }

    if ((/console\.log/.test(o) || /console\./.test(o)) && !/console\./.test(r)) {
      messages.push(`Removed console debugging statement(s) around line ${line}.`);
      return;
    }

    if (/\/\//.test(o) || /\/\*/.test(o)) {
      if (!/\/\//.test(r) && !/\/\*/.test(r)) {
        messages.push(`Removed comments around line ${line}.`);
        return;
      }
    }

    if (o && !r) {
      messages.push(`Removed an empty or whitespace-only line at line ${line}.`);
      return;
    }
  });

  // Remove duplicates
  return [...new Set(messages)];
}

/* ============================
 *  MAIN PIPELINE
 * ============================ */

/**
 * Main JS formatter tool.
 *
 * @param {string} text   - Input JS/TS code
 * @param {object} config - Configuration
 *
 * config supports:
 *   - mode: 'format' | 'beautify' | 'minify' | 'obfuscate'
 *   - indentSize: '2' | '4' | 'tab'
 *   - useSemicolons: boolean
 *   - singleQuotes: boolean
 *   - trailingComma: 'none' | 'es5' | 'all'
 *   - printWidth: string/number
 *   - bracketSpacing: boolean
 *   - arrowParens: 'always' | 'avoid'
 *   - showErrors: boolean
 *   - removeComments: boolean
 *   - removeConsole: boolean
 *   - trimTrailingWhitespace: boolean
 *   - safeMinify: boolean
 *   - obfuscatorOptions: object
 */
async function jsFormatter(text, config = {}) {
  const {
    mode = 'format',
    indentSize = '2',
    useSemicolons = true,
    singleQuotes = false,
    trailingComma = 'es5',
    printWidth = '80',
    bracketSpacing = true,
    arrowParens = 'always',
    showErrors = true,
    removeComments = false,
    removeConsole = false,
    trimTrailingWhitespace = false,
    safeMinify = false,
    obfuscatorOptions = {},
  } = config;

  const formatMode =
    mode === 'beautify' || mode === 'format' || mode === 'pretty'
      ? 'format'
      : mode;

  let repairedCode = text;
  let repairInfo = null;

  // AUTO-REPAIR (similar toggle to autoRepair XML)
  const autoRepairEnabled = config.autoRepair !== false;

  if (autoRepairEnabled) {
    const repairResult = autoRepairJs(text);
    repairedCode = repairResult.repairedCode || text;

    const diff = computeDiffLines(text, repairedCode);
    const summary = generateRepairSummaryJs(diff);

    repairInfo = {
      ...repairResult,
      originalCode: text,
      repairedCode,
      diff,
      summary,
      wasRepaired: diff.length > 0,
    };
  }

  // VALIDATION snapshots (original + repaired)
  const originalValidation = strictValidateJs(text);
  const repairedValidation = strictValidateJs(repairedCode);

  const validation = {
    original: originalValidation,
    repaired: repairedValidation,
  };

  // Heuristic lint
  const lintWarnings = lintJsHeuristic(repairedCode);

  // Cleanup options
  const cleanedCode = applyCleanupOptionsJs(repairedCode, {
    removeComments,
    removeConsole,
    trimTrailingWhitespace,
  });

  // Final formatting (beautify/minify/obfuscate)
  const finalCode = formatFinalJs(cleanedCode, formatMode, {
    indentSize,
    useSemicolons,
    singleQuotes,
    trailingComma,
    printWidth,
    bracketSpacing,
    arrowParens,
    safeMinify,
    obfuscatorOptions,
  });

  // Optionally, you can surface validation errors in an "errors" field
  let errors = [];
  if (showErrors) {
    if (!validation.repaired.isValid) {
      errors = validation.repaired.errors;
    } else if (!validation.original.isValid) {
      // original broken but repaired ok; still might want to show original error
      errors = validation.original.errors;
    }
  }

  return {
    ok: true,
    stage: 'done',
    originalCode: text,
    repairedCode,
    cleanedCode,
    finalCode,
    lintWarnings,
    validation,
    repairInfo,
    errors,
    optionsApplied: {
      mode: formatMode,
      indentSize,
      useSemicolons,
      singleQuotes,
      trailingComma,
      printWidth,
      bracketSpacing,
      arrowParens,
      removeComments,
      removeConsole,
      trimTrailingWhitespace,
      safeMinify,
      autoRepair: autoRepairEnabled,
    },
  };
}

module.exports = {
  jsFormatter,
  strictValidateJs,
  autoRepairJs,
  lintJsHeuristic,
  applyCleanupOptionsJs,
  formatFinalJs,
  computeDiffLines,
  generateRepairSummaryJs,
};
