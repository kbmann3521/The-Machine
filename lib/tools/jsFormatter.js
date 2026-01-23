// Initialize optional modules
let prettierModule = null;
let babelParserModule = null;
let babelGeneratorModule = null; // no longer used, but kept if you reuse later
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
  // Modules not available
}

/* ============================
 *  HELPER: OFFSET → LINE/COLUMN
 * ============================ */

function offsetToLineCol(text, offset) {
  const upTo = text.slice(0, offset);
  const lines = upTo.split(/\r?\n/);
  const line = lines.length;
  const column = (lines[lines.length - 1] || '').length + 1;
  return { line, column };
}

/* ============================
 *  STRUCTURAL DIAGNOSTICS (NO AUTO-REPAIR)
 * ============================ */

/**
 * Walks the raw JS code and finds:
 * - Unmatched (), {}, []
 * - Extra closing ), }, ]
 * - Unterminated strings (' " `)
 * - Unterminated block comments /* ... *\/
 * - Unterminated template literals
 *
 * Returns diagnostics:
 * {
 *   type: 'error',
 *   category: 'structure' | 'string' | 'comment' | 'template',
 *   message: string,
 *   line: number,
 *   column: number
 * }
 */
function collectStructuralDiagnosticsJS(code) {
  const diagnostics = [];

  const stack = []; // { char, offset }

  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    const next = code[i + 1];
    const prev = code[i - 1];

    // Line comments
    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      }
      continue;
    }

    // Block comments
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    // Single-quoted string
    if (inSingle) {
      if (ch === "'" && prev !== '\\') {
        inSingle = false;
      }
      continue;
    }

    // Double-quoted string
    if (inDouble) {
      if (ch === '"' && prev !== '\\') {
        inDouble = false;
      }
      continue;
    }

    // Template literal (we treat entire template as opaque; we don't parse ${} deeply)
    if (inTemplate) {
      if (ch === '`' && prev !== '\\') {
        inTemplate = false;
      }
      continue;
    }

    // We are NOT inside string/comment/template: detect entries

    // Start of line comment
    if (ch === '/' && next === '/') {
      inLineComment = true;
      i++;
      continue;
    }

    // Start of block comment
    if (ch === '/' && next === '*') {
      inBlockComment = true;
      i++;
      continue;
    }

    // Start of strings
    if (ch === "'" && prev !== '\\') {
      inSingle = true;
      continue;
    }
    if (ch === '"' && prev !== '\\') {
      inDouble = true;
      continue;
    }
    if (ch === '`' && prev !== '\\') {
      inTemplate = true;
      continue;
    }

    // Bracket tracking
    if (ch === '(' || ch === '{' || ch === '[') {
      stack.push({ char: ch, offset: i });
      continue;
    }

    if (ch === ')' || ch === '}' || ch === ']') {
      if (stack.length === 0) {
        const loc = offsetToLineCol(code, i);
        diagnostics.push({
          type: 'error',
          category: 'structure',
          message: `Unmatched closing '${ch}'.`,
          line: loc.line,
          column: loc.column,
        });
        continue;
      }

      const top = stack[stack.length - 1];
      const matchMap = { ')': '(', '}': '{', ']': '[' };

      if (top.char !== matchMap[ch]) {
        const loc = offsetToLineCol(code, i);
        diagnostics.push({
          type: 'error',
          category: 'structure',
          message: `Mismatched closing '${ch}' for opening '${top.char}'.`,
          line: loc.line,
          column: loc.column,
        });
        // pop anyway so we can keep going
        stack.pop();
      } else {
        stack.pop();
      }
    }
  }

  // Unterminated constructs at EOF
  if (inSingle) {
    const loc = offsetToLineCol(code, code.lastIndexOf("'"));
    diagnostics.push({
      type: 'error',
      category: 'string',
      message: 'Unterminated single-quoted string literal.',
      line: loc.line,
      column: loc.column,
    });
  }
  if (inDouble) {
    const loc = offsetToLineCol(code, code.lastIndexOf('"'));
    diagnostics.push({
      type: 'error',
      category: 'string',
      message: 'Unterminated double-quoted string literal.',
      line: loc.line,
      column: loc.column,
    });
  }
  if (inTemplate) {
    const loc = offsetToLineCol(code, code.lastIndexOf('`'));
    diagnostics.push({
      type: 'error',
      category: 'template',
      message: 'Unterminated template literal.',
      line: loc.line,
      column: loc.column,
    });
  }
  if (inBlockComment) {
    const loc = offsetToLineCol(code, code.lastIndexOf('/*'));
    diagnostics.push({
      type: 'error',
      category: 'comment',
      message: 'Unterminated block comment.',
      line: loc.line,
      column: loc.column,
    });
  }

  // Any leftover opening brackets
  for (const open of stack) {
    const loc = offsetToLineCol(code, open.offset);
    diagnostics.push({
      type: 'error',
      category: 'structure',
      message: `Unclosed '${open.char}' bracket.`,
      line: loc.line,
      column: loc.column,
    });
  }

  return diagnostics;
}

/* ============================
 *  STRICT SYNTAX CHECK (BABEL)
 * ============================ */

function detectSyntaxErrors(code) {
  if (!babelParserModule) {
    return { status: 'unknown', errors: [] };
  }

  const errors = [];

  try {
    babelParserModule.parse(code, {
      sourceType: 'unambiguous',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      errorRecovery: false,
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'logicalAssignment',
        ['pipelineOperator', { proposal: 'minimal' }],
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    });
    return { status: 'valid', errors: [] };
  } catch (error) {
    const lineNum = error.loc?.line || 'unknown';
    const colNum = (typeof error.loc?.column === 'number' ? error.loc.column + 1 : 'unknown');

    errors.push({
      line: lineNum,
      column: colNum,
      message: error.message,
      code: 'SyntaxError',
    });

    return { status: 'invalid', errors };
  }
}

/* ============================
 *  LINT (ESLINT) – EXISTING CODE
 * ============================ */

async function lintJavaScript(code) {
  const warnings = [];

  if (typeof window !== 'undefined') {
    return {
      total: 0,
      warnings,
    };
  }

  try {
    if (!eslintModule) {
      return {
        total: 0,
        warnings,
      };
    }

    const { Linter } = eslintModule;
    const linter = new Linter();

    // Configure ESLint rules
    const rules = {
      'no-console': ['warn', { allow: [] }],
      'no-var': 'warn',
      eqeqeq: 'off',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'off',
      semi: ['warn', 'always'],
      quotes: ['warn', 'single'],
      indent: 'off',
      'linebreak-style': 'off',
      'comma-dangle': ['warn', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never'
      }],
      'no-trailing-spaces': 'warn',
      'space-before-function-paren': ['warn', { anonymous: 'always', named: 'never' }],
    };

    const config = {
      rules,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
          globalReturn: true,
        },
      },
      env: {
        browser: true,
        node: true,
        es2020: true,
      },
    };

    const messages = linter.verify(code, config, { filename: 'input.js' });

    // Debug logging
    if (messages.length > 0) {
      console.log('[jsFormatter] ESLint detected', messages.length, 'issues:', messages.map(m => `${m.ruleId} (line ${m.line})`).join(', '));
    }

    // Convert ESLint messages to warning format
    messages.forEach((msg) => {
      // Friendly message for console warnings
      if (msg.ruleId === 'no-console') {
        warnings.push({
          level: 'warning',
          message: 'Console statement detected. This is not an error — it only appears because the "no-console" lint rule is active.',
          detail: 'You may safely ignore this warning. Many codebases disable this rule in development.',
          ruleId: msg.ruleId,
          line: msg.line,
          column: msg.column,
          category: 'lint',
        });
        return;
      }

      let level = 'info';
      if (msg.severity === 2) {
        level = 'error';
      } else if (msg.severity === 1) {
        level = 'warning';
      }

      warnings.push({
        level,
        message: msg.message,
        ruleId: msg.ruleId || 'unknown',
        line: msg.line,
        column: msg.column,
        category: 'lint',
      });
    });

    return {
      total: warnings.length,
      warnings,
    };
  } catch (error) {
    return {
      total: 0,
      warnings,
    };
  }
}

/* ============================
 *  FORMAT / MINIFY / OBFUSCATE (NO AUTO-REPAIR)
 * ============================ */

async function jsFormatter(text, config = {}) {
  let {
    mode = 'format',
    indentSize = '2',
    useSemicolons = true,
    singleQuotes = false,
    trailingComma = 'es5',
    printWidth = '80',
    bracketSpacing = true,
    arrowParens = 'always',
    showAnalysis = true,
    showLinting = false,
    compressCode = false,
    removeComments = false,
    removeConsole = false,
  } = config;

  // When in minify mode, disable/override formatting options
  if (mode === 'minify') {
    useSemicolons = false;
    singleQuotes = false;
    bracketSpacing = false;
    indentSize = '2';
    printWidth = '80';
    trailingComma = 'none';
    arrowParens = 'always';
    showLinting = false;
  }

  // Validation always runs
  const showErrors = true;

  try {
    if (!text || typeof text !== 'string') {
      return { error: 'Invalid input: Please provide JavaScript code' };
    }

    const trimmedText = text.trim();
    if (!trimmedText) {
      return { error: 'Empty input: Please provide JavaScript code' };
    }

    const result = {};

    // STEP 1: Validate INPUT
    const inputStructuralErrors = collectStructuralDiagnosticsJS(trimmedText);
    const inputSyntax = showErrors ? detectSyntaxErrors(trimmedText) : { status: 'unknown', errors: [] };
    const inputIsWellFormed = inputStructuralErrors.length === 0 && inputSyntax.status !== 'invalid';

    // Build input diagnostics array
    const inputDiagnostics = [];
    inputDiagnostics.push(...inputStructuralErrors);
    if (inputSyntax.status === 'invalid') {
      inputSyntax.errors.forEach((e) => {
        inputDiagnostics.push({
          type: 'error',
          category: 'syntax',
          message: e.message,
          line: e.line,
          column: e.column,
          code: e.code || 'SyntaxError',
        });
      });
    }

    let outputCode = trimmedText;
    let outputDiagnostics = [];
    let outputLinting = { total: 0, warnings: [] };

    // STEP 2 & 3: Format and validate OUTPUT (only if input is well-formed)
    if (inputIsWellFormed) {
      switch (mode) {
        case 'format': {
          let formatted = trimmedText;

          formatted = await formatJavaScript(trimmedText, {
            indentSize,
            useSemicolons,
            singleQuotes,
            trailingComma,
            printWidth,
            bracketSpacing,
            arrowParens,
          });

          if (removeComments) {
            formatted = removeJsComments(formatted);
          }
          if (removeConsole) {
            formatted = removeJsConsole(formatted);
          }

          result.formatted = formatted;
          outputCode = formatted;

          if (showAnalysis) {
            result.analysis = analyzeJavaScript(formatted);
          }

          break;
        }

        case 'minify': {
          let minified = await minifyJavaScript(trimmedText, { compressCode });

          result.minified = minified;
          outputCode = minified;

          if (showAnalysis) {
            result.analysis = analyzeJavaScript(minified);
          }

          break;
        }

        case 'obfuscate': {
          let obfuscated = obfuscateJavaScript(trimmedText);

          result.obfuscated = obfuscated;
          outputCode = obfuscated;

          break;
        }

        default:
          return { error: 'Unknown mode' };
      }

      // Validate the OUTPUT to catch any issues introduced by formatting
      const outputStructuralErrors = collectStructuralDiagnosticsJS(outputCode);
      const outputSyntax = showErrors ? detectSyntaxErrors(outputCode) : { status: 'unknown', errors: [] };

      outputDiagnostics.push(...outputStructuralErrors);
      if (outputSyntax.status === 'invalid') {
        outputSyntax.errors.forEach((e) => {
          outputDiagnostics.push({
            type: 'error',
            category: 'syntax',
            message: e.message,
            line: e.line,
            column: e.column,
            code: e.code || 'SyntaxError',
          });
        });
      }

      // STEP 4: Lint the OUTPUT (only if input was well-formed)
      if (showLinting) {
        outputLinting = await lintJavaScript(outputCode);
      }
    }

    // Build final consolidated diagnostics from both input and output
    const diagnostics = [];

    // Add input validation errors (always show, even if formatting fails)
    diagnostics.push(...inputDiagnostics);

    // Add output validation errors (only if formatting succeeded)
    if (inputIsWellFormed) {
      diagnostics.push(...outputDiagnostics);
    }

    // Add lint warnings from output (only if input was well-formed)
    if (inputIsWellFormed && showLinting && outputLinting && Array.isArray(outputLinting.warnings)) {
      outputLinting.warnings.forEach((w) => {
        diagnostics.push({
          type: w.level === 'error' ? 'error' : 'warning',
          category: 'lint',
          message: w.message,
          line: w.line,
          column: w.column,
          ruleId: w.ruleId,
        });
      });
    }

    // Attach diagnostics + legacy fields
    if (showErrors) {
      result.errors = inputSyntax; // { status, errors }
    }
    if (showLinting && inputIsWellFormed) {
      result.linting = outputLinting; // { total, warnings }
    }

    result.diagnostics = diagnostics; // unified array
    result.isWellFormed = inputIsWellFormed;
    result.inputDiagnostics = inputDiagnostics; // separate input validation
    result.outputDiagnostics = outputDiagnostics; // separate output validation
    result.showLinting = showLinting; // pass through linting flag
    result.showValidation = showErrors; // pass through validation flag

    return result;
  } catch (error) {
    return {
      error: `Processing error: ${error.message}`,
    };
  }
}

/* ============================
 *  FORMAT HELPERS
 * ============================ */

async function formatJavaScript(code, cfg) {
  if (!prettierModule) {
    return fallbackJsFormat(code, cfg);
  }

  try {
    const options = {
      parser: 'babel',
      semi: cfg.useSemicolons !== false,
      singleQuote: cfg.singleQuotes === true,
      trailingComma: cfg.trailingComma || 'es5',
      printWidth: parseInt(cfg.printWidth) || 80,
      bracketSpacing: cfg.bracketSpacing !== false,
      arrowParens: cfg.arrowParens || 'always',
      useTabs: cfg.indentSize === 'tab',
      tabWidth: cfg.indentSize === 'tab' ? 2 : parseInt(cfg.indentSize) || 2,
    };

    const formatted = await prettierModule.format(code, options);
    return formatted && typeof formatted === 'string'
      ? formatted
      : fallbackJsFormat(code, cfg);
  } catch (error) {
    return fallbackJsFormat(code, cfg);
  }
}

function removeJsComments(code) {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    if ((char === '"' || char === "'") && code[i - 1] !== '\\') {
      if (!inTemplate) {
        inString = !inString;
        if (inString) {
          stringChar = char;
        }
      }
      result += char;
      i++;
      continue;
    }

    if (char === '`' && code[i - 1] !== '\\') {
      inTemplate = !inTemplate;
      result += char;
      i++;
      continue;
    }

    if (inString || inTemplate) {
      result += char;
      i++;
      continue;
    }

    if (char === '/' && nextChar === '/') {
      i += 2;
      while (i < code.length && code[i] !== '\n') {
        i++;
      }
      if (code[i] === '\n') {
        result += '\n';
        i++;
      }
      continue;
    }

    if (char === '/' && nextChar === '*') {
      i += 2;
      while (i < code.length - 1) {
        if (code[i] === '*' && code[i + 1] === '/') {
          i += 2;
          break;
        }
        if (code[i] === '\n') {
          result += '\n';
        }
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

function removeJsConsole(code) {
  let result = '';
  let i = 0;
  let inString = false;
  let stringChar = '';
  let inTemplate = false;

  while (i < code.length) {
    const char = code[i];

    if ((char === '"' || char === "'") && code[i - 1] !== '\\') {
      if (!inTemplate) {
        inString = !inString;
        if (inString) {
          stringChar = char;
        }
      }
      result += char;
      i++;
      continue;
    }

    if (char === '`' && code[i - 1] !== '\\') {
      inTemplate = !inTemplate;
      result += char;
      i++;
      continue;
    }

    if (inString || inTemplate) {
      result += char;
      i++;
      continue;
    }

    const remaining = code.substring(i);
    const consoleMatch = remaining.match(
      /^console\s*\.\s*(log|error|warn|info|debug|trace)\s*\(/
    );

    if (consoleMatch) {
      i += consoleMatch[0].length;
      let parenCount = 1;
      let foundEnd = false;

      while (i < code.length && parenCount > 0) {
        const c = code[i];

        if (c === '"' || c === "'" || c === '`') {
          const startChar = c;
          i++;
          while (i < code.length) {
            const sc = code[i];
            if (sc === startChar && code[i - 1] !== '\\') {
              i++;
              break;
            }
            i++;
          }
          continue;
        }

        if (c === '(') parenCount++;
        if (c === ')') parenCount--;

        if (parenCount === 0) {
          foundEnd = true;
        }
        i++;
      }

      if (foundEnd && code[i] === ';') {
        i++;
      }

      while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
        i++;
      }

      if (code[i] === '\n') {
        i++;
      }

      continue;
    }

    result += char;
    i++;
  }

  return result;
}

async function minifyJavaScript(code, config = {}) {
  if (!terserModule || !code) {
    return code;
  }

  try {
    const result = await terserModule.minify(code, {
      compress: {
        passes: config.compressCode ? 3 : 1,
        dead_code: true,
        unused: true,
      },
      mangle: true,
      format: {
        comments: false,
      },
    });

    if (result.error) {
      return code;
    }

    return result.code || code;
  } catch (error) {
    return code;
  }
}

function obfuscateJavaScript(code) {
  if (!obfuscatorModule) {
    return fallbackJsMinify(code);
  }

  try {
    const obfuscated = obfuscatorModule.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
    });

    return obfuscated.getObfuscatedCode();
  } catch (error) {
    return code;
  }
}

/* ============================
 *  ANALYSIS (UNCHANGED)
 * ============================ */

function analyzeJavaScript(code) {
  const analysis = {
    lineCount: code.split('\n').length,
    characterCount: code.length,
    characterCountNoSpaces: code.replace(/\s/g, '').length,
  };

  // Count functions
  const functionMatches =
    code.match(
      /\bfunction\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|const\s+\w+\s*=\s*(?:async\s*)?\w+\s*=>/g
    ) || [];
  const arrowFunctions =
    code.match(
      /(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(.*?\)\s*=>|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\w+\s*=>/g
    ) || [];

  analysis.functionCount = new Set(functionMatches.map((m) => m.match(/\w+/)[0])).size;
  analysis.arrowFunctionCount = arrowFunctions.length;

  // Count variables
  const varMatches = code.match(/(?:const|let|var)\s+(\w+)/g) || [];
  analysis.variableCount = new Set(varMatches.map((m) => m.match(/\w+$/)[0])).size;

  // Count imports/exports
  analysis.importCount = (code.match(/\bimport\s+/g) || []).length;
  analysis.exportCount = (code.match(/\bexport\s+/g) || []).length;

  // Check for async/await
  analysis.hasAsync =
    /\basync\s+function|\basync\s*\(|async\s+\w+\s*=>/g.test(code);

  // Check for classes
  analysis.classCount = (code.match(/\bclass\s+\w+/g) || []).length;

  // Count methods/properties
  analysis.methodCount = (code.match(/\w+\s*\([^)]*\)\s*{/g) || []).length;

  // Estimate cyclomatic complexity (simplified)
  const conditions =
    (code.match(/\b(if|else if|switch|case|catch|for|while|do)\b/g) || []).length;
  analysis.cyclomaticComplexity = Math.max(1, conditions + 1);

  // Longest line
  const lines = code.split('\n');
  analysis.longestLine = Math.max(...lines.map((l) => l.length));

  return analysis;
}

/* ============================
 *  FALLBACK FORMATTERS
 * ============================ */

function fallbackJsFormat(code, config) {
  const indent =
    config.indentSize === 'tab'
      ? '\t'
      : ' '.repeat(parseInt(config.indentSize) || 2);
  let result = '';
  let indentLevel = 0;
  let inString = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];

    if ((char === '"' || char === "'" || char === '`') && code[i - 1] !== '\\') {
      inString = !inString;
      if (inString) stringChar = char;
      result += char;
      continue;
    }

    if (inString) {
      result += char;
      continue;
    }

    if (char === '{') {
      result += ' {\n' + indent.repeat(indentLevel + 1);
      indentLevel++;
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1);
      result = result.replace(/[ \t]+$/g, '') + '\n' + indent.repeat(indentLevel) + '}';
    } else if (char === ';') {
      result += ';\n' + indent.repeat(indentLevel);
    } else if (char === '\n' || char === '\r') {
      continue;
    } else if (char === ' ' && result.trim()) {
      if (result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n') {
        result += ' ';
      }
    } else {
      result += char;
    }
  }

  return result.replace(/\n\s*\n/g, '\n').trim();
}

function fallbackJsMinify(code) {
  let result = code;
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  result = result.replace(/\/\/.*/g, '');
  result = result.replace(/\s+/g, ' ');
  result = result.replace(/\s*([{}();:,=])\s*/g, '$1');
  return result.trim();
}

module.exports = {
  jsFormatter,
};
