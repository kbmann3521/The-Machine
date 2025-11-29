// Initialize optional modules
let prettierModule = null
let babelParserModule = null
let babelGeneratorModule = null
let terserModule = null
let obfuscatorModule = null
let eslintModule = null

try {
  if (typeof window === 'undefined') {
    prettierModule = require('prettier')
    babelParserModule = require('@babel/parser')
    babelGeneratorModule = require('@babel/generator').default
    terserModule = require('terser')
    obfuscatorModule = require('javascript-obfuscator')
    eslintModule = require('eslint')
  }
} catch (error) {
  // Modules not available
}

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
    showAnalysis = true,
    showLinting = false,
    compressCode = false,
    removeComments = false,
    removeConsole = false,
    showRepairInfo = true,
  } = config

  try {
    if (!text || typeof text !== 'string') {
      return { error: 'Invalid input: Please provide JavaScript code' }
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return { error: 'Empty input: Please provide JavaScript code' }
    }

    const result = {}

    switch (mode) {
      case 'format': {
        let codeToFormat = trimmedText
        let wasRepaired = false
        let repairMethod = null
        let repairResult = null

        // Step 1: Try auto-repair first
        repairResult = await autoRepairJavaScript(trimmedText)
        if (repairResult.wasRepaired) {
          codeToFormat = repairResult.code
          wasRepaired = true
          repairMethod = repairResult.method
        }

        // Step 2: Format the code (repaired or original)
        result.formatted = await formatJavaScript(codeToFormat, config)

        if (removeComments) {
          result.formatted = removeJsComments(result.formatted)
        }
        if (removeConsole) {
          result.formatted = removeJsConsole(result.formatted)
        }

        // Step 3: Show repair info (what was auto-repaired)
        if (showRepairInfo) {
          result.repaired = {
            wasRepaired: wasRepaired,
            method: wasRepaired ? repairMethod : null,
            repairs: wasRepaired ? (repairResult.repairs || []) : [],
          }
        }

        // Step 4: Run syntax check on REPAIRED code (not original) - only show remaining errors
        if (showErrors) {
          result.errors = detectSyntaxErrors(codeToFormat)
        }

        // Step 5: Analysis and linting on formatted output
        if (showAnalysis) {
          result.analysis = analyzeJavaScript(result.formatted)
        }
        if (showLinting) {
          result.linting = await lintJavaScript(result.formatted)
        }
        break
      }

      case 'minify': {
        result.minified = await minifyJavaScript(trimmedText, { compressCode })
        if (showErrors) {
          result.errors = detectSyntaxErrors(trimmedText)
        }
        if (showAnalysis) {
          result.analysis = analyzeJavaScript(result.minified)
        }
        if (showLinting) {
          result.linting = await lintJavaScript(result.minified)
        }
        break
      }

      case 'obfuscate': {
        result.obfuscated = obfuscateJavaScript(trimmedText)
        if (showErrors) {
          result.errors = detectSyntaxErrors(trimmedText)
        }
        if (showLinting) {
          result.linting = await lintJavaScript(result.obfuscated)
        }
        break
      }

      default:
        return { error: 'Unknown mode' }
    }

    return result
  } catch (error) {
    return {
      error: `Processing error: ${error.message}`,
    }
  }
}

function repairWithBabel(code) {
  if (!babelParserModule || !babelGeneratorModule) {
    return null
  }

  try {
    const ast = babelParserModule.parse(code, {
      sourceType: 'unambiguous',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      errorRecovery: true,
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'logicalAssignment',
        ['pipelineOperator', { proposal: 'minimal' }],
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    })

    const generated = babelGeneratorModule(ast, {}, code)
    return generated && generated.code ? generated.code : null
  } catch (error) {
    return null
  }
}

function getRepairDifferences(original, repaired) {
  const originalLines = original.split('\n')
  const repairedLines = repaired.split('\n')
  const repairs = []

  for (let i = 0; i < Math.max(originalLines.length, repairedLines.length); i++) {
    const origLine = originalLines[i] || ''
    const repLine = repairedLines[i] || ''

    if (origLine !== repLine) {
      repairs.push({
        lineNumber: i + 1,
        original: origLine,
        repaired: repLine,
      })
    }
  }

  return repairs
}

async function autoRepairJavaScript(code) {
  const originalCode = code

  try {
    if (prettierModule) {
      try {
        const repaired = await prettierModule.format(code, { parser: 'babel' })
        if (repaired && repaired !== originalCode) {
          const repairs = getRepairDifferences(originalCode, repaired)
          return {
            code: repaired,
            wasRepaired: true,
            method: 'prettier',
            repairs: repairs,
          }
        }
      } catch (e) {
        // Fall through to Babel repair
      }
    }

    const babelRepaired = repairWithBabel(code)
    if (babelRepaired && babelRepaired !== originalCode) {
      const repairs = getRepairDifferences(originalCode, babelRepaired)
      return {
        code: babelRepaired,
        wasRepaired: true,
        method: 'babel-recovery',
        repairs: repairs,
      }
    }

    return { code: originalCode, wasRepaired: false, method: null, repairs: [] }
  } catch (error) {
    return { code: originalCode, wasRepaired: false, method: null, repairs: [] }
  }
}

async function formatJavaScript(code, config) {
  if (!prettierModule) {
    return fallbackJsFormat(code, config)
  }

  try {
    const options = {
      parser: 'babel',
      semi: config.useSemicolons !== false,
      singleQuote: config.singleQuotes === true,
      trailingComma: config.trailingComma || 'es5',
      printWidth: parseInt(config.printWidth) || 80,
      bracketSpacing: config.bracketSpacing !== false,
      arrowParens: config.arrowParens || 'always',
      useTabs: config.indentSize === 'tab',
      tabWidth: config.indentSize === 'tab' ? 2 : parseInt(config.indentSize) || 2,
    }

    const formatted = await prettierModule.format(code, options)
    return formatted && typeof formatted === 'string' ? formatted : fallbackJsFormat(code, config)
  } catch (error) {
    return fallbackJsFormat(code, config)
  }
}

function removeJsComments(code) {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''
  let inTemplate = false

  while (i < code.length) {
    const char = code[i]
    const nextChar = code[i + 1]

    if ((char === '"' || char === "'") && code[i - 1] !== '\\') {
      if (!inTemplate) {
        inString = !inString
        if (inString) {
          stringChar = char
        }
      }
      result += char
      i++
      continue
    }

    if (char === '`' && code[i - 1] !== '\\') {
      inTemplate = !inTemplate
      result += char
      i++
      continue
    }

    if (inString || inTemplate) {
      result += char
      i++
      continue
    }

    if (char === '/' && nextChar === '/') {
      i += 2
      while (i < code.length && code[i] !== '\n') {
        i++
      }
      if (code[i] === '\n') {
        result += '\n'
        i++
      }
      continue
    }

    if (char === '/' && nextChar === '*') {
      i += 2
      while (i < code.length - 1) {
        if (code[i] === '*' && code[i + 1] === '/') {
          i += 2
          break
        }
        if (code[i] === '\n') {
          result += '\n'
        }
        i++
      }
      continue
    }

    result += char
    i++
  }

  return result
}

function removeJsConsole(code) {
  let result = ''
  let i = 0
  let inString = false
  let stringChar = ''
  let inTemplate = false

  while (i < code.length) {
    const char = code[i]

    if ((char === '"' || char === "'") && code[i - 1] !== '\\') {
      if (!inTemplate) {
        inString = !inString
        if (inString) {
          stringChar = char
        }
      }
      result += char
      i++
      continue
    }

    if (char === '`' && code[i - 1] !== '\\') {
      inTemplate = !inTemplate
      result += char
      i++
      continue
    }

    if (inString || inTemplate) {
      result += char
      i++
      continue
    }

    const remaining = code.substring(i)
    const consoleMatch = remaining.match(/^console\s*\.\s*(log|error|warn|info|debug|trace)\s*\(/)

    if (consoleMatch) {
      i += consoleMatch[0].length
      let parenCount = 1
      let foundEnd = false

      while (i < code.length && parenCount > 0) {
        const c = code[i]

        if (c === '"' || c === "'" || c === '`') {
          const startChar = c
          result = ''
          i++
          while (i < code.length) {
            const sc = code[i]
            if (sc === startChar && code[i - 1] !== '\\') {
              i++
              break
            }
            i++
          }
          continue
        }

        if (c === '(') parenCount++
        if (c === ')') parenCount--

        if (parenCount === 0) {
          foundEnd = true
        }
        i++
      }

      if (foundEnd && code[i] === ';') {
        i++
      }

      while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
        i++
      }

      if (code[i] === '\n') {
        i++
      }

      continue
    }

    result += char
    i++
  }

  return result
}

async function minifyJavaScript(code, config = {}) {
  if (!terserModule || !code) {
    return code
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
    })

    if (result.error) {
      return code
    }

    return result.code || code
  } catch (error) {
    return code
  }
}

function obfuscateJavaScript(code) {
  if (!obfuscatorModule) {
    return fallbackJsMinify(code)
  }

  try {
    const obfuscated = obfuscatorModule.obfuscate(code, {
      compact: true,
      controlFlowFlattening: false,
    })

    return obfuscated.getObfuscatedCode()
  } catch (error) {
    return code
  }
}

function detectSyntaxErrors(code) {
  if (!babelParserModule) {
    return { status: 'unknown', errors: [] }
  }

  const errors = []

  try {
    babelParserModule.parse(code, {
      sourceType: 'module',
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: true,
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'logicalAssignment',
        ['pipelineOperator', { proposal: 'minimal' }],
        'optionalChaining',
        'nullishCoalescingOperator',
      ],
    })
    return { status: 'valid', errors: [] }
  } catch (error) {
    const lines = code.split('\n')
    const lineNum = error.pos ? code.substring(0, error.pos).split('\n').length : error.loc?.line || 'unknown'
    const colNum = error.loc?.column || 'unknown'

    errors.push({
      line: lineNum,
      column: colNum,
      message: error.message,
      code: 'SyntaxError',
    })

    return { status: 'invalid', errors }
  }
}

function analyzeJavaScript(code) {
  const analysis = {
    lineCount: code.split('\n').length,
    characterCount: code.length,
    characterCountNoSpaces: code.replace(/\s/g, '').length,
  }

  // Count functions
  const functionMatches = code.match(/\bfunction\s+\w+|const\s+\w+\s*=\s*(?:async\s*)?\(|const\s+\w+\s*=\s*(?:async\s*)?\w+\s*=>/g) || []
  const arrowFunctions = code.match(/(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\(.*?\)\s*=>|(?:const|let|var)\s+\w+\s*=\s*(?:async\s*)?\w+\s*=>/g) || []

  analysis.functionCount = new Set(functionMatches.map(m => m.match(/\w+/)[0])).size
  analysis.arrowFunctionCount = arrowFunctions.length

  // Count variables
  const varMatches = code.match(/(?:const|let|var)\s+(\w+)/g) || []
  analysis.variableCount = new Set(varMatches.map(m => m.match(/\w+$/)[0])).size

  // Count imports/exports
  analysis.importCount = (code.match(/\bimport\s+/g) || []).length
  analysis.exportCount = (code.match(/\bexport\s+/g) || []).length

  // Check for async/await
  analysis.hasAsync = /\basync\s+function|\basync\s*\(|async\s+\w+\s*=>/g.test(code)

  // Check for classes
  analysis.classCount = (code.match(/\bclass\s+\w+/g) || []).length

  // Count methods/properties
  analysis.methodCount = (code.match(/\w+\s*\([^)]*\)\s*{/g) || []).length

  // Estimate cyclomatic complexity (simplified)
  const conditions = (code.match(/\b(if|else if|switch|case|catch|for|while|do)\b/g) || []).length
  analysis.cyclomaticComplexity = Math.max(1, conditions + 1)

  // Longest line
  const lines = code.split('\n')
  analysis.longestLine = Math.max(...lines.map(l => l.length))

  return analysis
}

async function lintJavaScript(code) {
  const warnings = []

  if (typeof window !== 'undefined') {
    return {
      total: 0,
      warnings,
    }
  }

  try {
    if (!eslintModule) {
      return {
        total: 0,
        warnings,
      }
    }

    const { Linter } = eslintModule
    const linter = new Linter()

    // Configure ESLint rules
    const rules = {
      'no-console': ['warn', { allow: [] }],
      'no-var': 'warn',
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'prefer-const': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'off',
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single'],
      'indent': 'off',
      'linebreak-style': 'off',
      'comma-dangle': ['warn', 'never'],
      'no-trailing-spaces': 'warn',
      'space-before-function-paren': ['warn', { anonymous: 'always', named: 'never' }],
    }

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
    }

    const messages = linter.verify(code, config, { filename: 'input.js' })

    // Convert ESLint messages to warning format
    messages.forEach(msg => {
      let level = 'info'
      if (msg.severity === 2) {
        level = 'error'
      } else if (msg.severity === 1) {
        level = 'warning'
      }

      warnings.push({
        level,
        message: msg.message,
        ruleId: msg.ruleId || 'unknown',
        line: msg.line,
        column: msg.column,
      })
    })

    return {
      total: warnings.length,
      warnings,
    }
  } catch (error) {
    return {
      total: 0,
      warnings,
    }
  }
}

function fallbackJsFormat(code, config) {
  const indent = config.indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(config.indentSize) || 2)
  let result = ''
  let indentLevel = 0
  let inString = false
  let stringChar = ''

  for (let i = 0; i < code.length; i++) {
    const char = code[i]

    if ((char === '"' || char === "'" || char === '`') && code[i - 1] !== '\\') {
      inString = !inString
      if (inString) stringChar = char
      result += char
      continue
    }

    if (inString) {
      result += char
      continue
    }

    if (char === '{') {
      result += ' {\n' + indent.repeat(indentLevel + 1)
      indentLevel++
    } else if (char === '}') {
      indentLevel = Math.max(0, indentLevel - 1)
      result = result.trimRight() + '\n' + indent.repeat(indentLevel) + '}'
    } else if (char === ';') {
      result += ';\n' + indent.repeat(indentLevel)
    } else if (char === '\n' || char === '\r') {
      continue
    } else if (char === ' ' && result.trim()) {
      if (result[result.length - 1] !== ' ' && result[result.length - 1] !== '\n') {
        result += ' '
      }
    } else {
      result += char
    }
  }

  return result.replace(/\n\s*\n/g, '\n').trim()
}

function fallbackJsMinify(code) {
  let result = code
  result = result.replace(/\/\*[\s\S]*?\*\//g, '')
  result = result.replace(/\/\/.*/g, '')
  result = result.replace(/\s+/g, ' ')
  result = result.replace(/\s*([{}();:,=])\s*/g, '$1')
  return result.trim()
}

module.exports = {
  jsFormatter,
}
