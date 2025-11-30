// lib/tools/cssFormatter.js

let postcssModule = null
let cssnanoModule = null
let autoprefixerModule = null
let stylelintModule = null
let csstreeModule = null

try {
  if (typeof window === 'undefined') {
    postcssModule = require('postcss')
    cssnanoModule = require('cssnano')
    autoprefixerModule = require('autoprefixer')
    stylelintModule = require('stylelint')
    csstreeModule = require('css-tree')
  }
} catch (error) {
  // Optional modules not available; formatter will gracefully degrade
}

/* ============================
 *  VALIDATION (STRICT-ish)
 * ============================ */

/**
 * Validate CSS using PostCSS parser.
 * PostCSS catches syntax errors like unclosed blocks, invalid selectors, etc.
 * Returns:
 * {
 *   isValid: boolean,
 *   errors: [{ line, column, message }]
 * }
 */
function validateCss(text) {
  if (!postcssModule) {
    // If PostCSS isn't available, just assume valid
    return { isValid: true, errors: [] }
  }

  try {
    postcssModule.parse(text)
    return { isValid: true, errors: [] }
  } catch (err) {
    const isCssError = err && err.name === 'CssSyntaxError'
    const line = isCssError ? err.line || null : null
    const column = isCssError ? err.column || null : null
    const message =
      (isCssError && (err.reason || err.message)) ||
      err.message ||
      'Invalid CSS'

    return {
      isValid: false,
      errors: [
        {
          line,
          column,
          message,
        },
      ],
    }
  }
}

/* ============================
 *  LINTING (STYLELINT)
 * ============================ */

/**
 * Lint CSS using stylelint (if available).
 * Returns:
 * {
 *   total: number,
 *   warnings: [
 *     { line, column, rule, severity, text }
 *   ]
 * }
 */
async function lintCss(text) {
  if (!stylelintModule || typeof stylelintModule.lint !== 'function') {
    console.debug('stylelint module not available')
    return { total: 0, warnings: [] }
  }

  try {
    const data = await stylelintModule.lint({
      code: text,
      config: {
        rules: {
          // Syntax & Structure checks
          'block-no-empty': true,
          'declaration-block-no-duplicate-properties': true,

          // Color checks
          'color-no-invalid-hex': true,
          'color-named': 'never',

          // Property checks
          'property-no-unknown': true,

          // Value checks
          'unit-no-unknown': true,

          // Selector checks
          'selector-type-no-unknown': true,
          'selector-pseudo-element-no-unknown': true,

          // At-rule checks
          'at-rule-no-unknown': null,
        },
      },
    })

    const result = data.results && data.results[0]
    const warnings = (result && result.warnings) || []

    console.debug(`stylelint found ${warnings.length} warnings`)

    return {
      total: warnings.length,
      warnings: warnings.map((w) => ({
        line: w.line,
        column: w.column,
        rule: w.rule,
        severity: w.severity || 'warning',
        text: w.text,
      })),
    }
  } catch (err) {
    console.debug('stylelint error:', err.message)
    // If stylelint blows up, return a generic message
    return { total: 0, warnings: [] }
  }
}

/* ============================
 *  COMMENT REMOVAL
 * ============================ */

function removeCssComments(text) {
  // Simple /* ... */ remover; fine for formatter use
  return text.replace(/\/\*[\s\S]*?\*\//g, '')
}

/* ============================
 *  BEAUTIFY (POSTCSS)
 * ============================ */

/**
 * Beautify CSS using PostCSS parser and formatter
 */
async function beautifyCss(text, indentSize = '2') {
  if (!postcssModule) {
    // Fallback: simple formatting
    return simpleBeautifyCss(text, indentSize)
  }

  try {
    const indent = indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize, 10) || 2)

    // Parse CSS
    const root = postcssModule.parse(text)

    // Format by walking through all nodes
    let result = ''
    let depth = 0

    const walk = (node) => {
      if (node.type === 'rule') {
        result += indent.repeat(depth) + node.selector + ' {\n'
        depth++

        // Format declarations
        node.each((child) => {
          if (child.type === 'decl') {
            result += indent.repeat(depth) + child.prop + ': ' + child.value + ';\n'
          } else if (child.type === 'comment') {
            result += indent.repeat(depth) + '/* ' + child.text + ' */\n'
          }
        })

        depth--
        result += indent.repeat(depth) + '}\n'
      } else if (node.type === 'atrule') {
        result += indent.repeat(depth) + '@' + node.name
        if (node.params) {
          result += ' ' + node.params
        }
        result += ' {\n'

        if (node.nodes) {
          depth++
          node.each(walk)
          depth--
        }

        result += indent.repeat(depth) + '}\n'
      } else if (node.type === 'comment') {
        result += indent.repeat(depth) + '/* ' + node.text + ' */\n'
      }
    }

    root.each(walk)

    return result.trim()
  } catch (error) {
    // If PostCSS fails, fall back to simple beautify
    return simpleBeautifyCss(text, indentSize)
  }
}

/**
 * Simple fallback CSS beautifier (without PostCSS)
 */
function simpleBeautifyCss(text, indentSize = '2') {
  const indent =
    indentSize === 'tab' ? '\t' : ' '.repeat(parseInt(indentSize, 10) || 2)

  let result = ''
  let level = 0
  let i = 0
  const len = text.length

  let inString = false
  let stringChar = null
  let inComment = false

  while (i < len) {
    const char = text[i]
    const next = text[i + 1]

    // Comment start
    if (!inString && !inComment && char === '/' && next === '*') {
      inComment = true
      result += '\n' + indent.repeat(level) + '/*'
      i += 2
      continue
    }

    // Comment end
    if (inComment) {
      result += char
      if (char === '*' && next === '/') {
        result += '/'
        i += 2
        inComment = false
        result += '\n' + indent.repeat(level)
      } else {
        i++
      }
      continue
    }

    // String start/end
    if (!inString && (char === '"' || char === "'")) {
      inString = true
      stringChar = char
      result += char
      i++
      continue
    } else if (inString) {
      result += char
      if (char === stringChar && text[i - 1] !== '\\') {
        inString = false
        stringChar = null
      }
      i++
      continue
    }

    // Structural characters
    if (char === '{') {
      result = result.trimEnd()
      result += ' {\n'
      level++
      result += indent.repeat(level)
    } else if (char === '}') {
      level = Math.max(0, level - 1)
      result = result.trimEnd()
      result += '\n' + indent.repeat(level) + '}\n' + indent.repeat(level)
    } else if (char === ';') {
      result = result.trimEnd()
      result += ';\n' + indent.repeat(level)
    } else if (char === '\n' || char === '\r') {
      // Collapse raw newlines; we'll reinsert our own
      if (result[result.length - 1] !== '\n') {
        result += '\n' + indent.repeat(level)
      }
    } else {
      result += char
    }

    i++
  }

  return result
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim()
}

/* ============================
 *  MINIFY (CSSNANO)
 * ============================ */

async function minifyCss(text) {
  if (!postcssModule || !cssnanoModule) {
    // Simple fallback: strip comments/whitespace
    return text
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([\{\};:,>+~])\s*/g, '$1')
      .trim()
  }

  const result = await postcssModule([cssnanoModule({ preset: 'default' })]).process(
    text,
    { from: undefined }
  )
  return result.css
}

/* ============================
 *  AUTOPREFIX (AUTOPREFIXER)
 * ============================ */

async function autoprefixCss(text, browsers) {
  if (!postcssModule || !autoprefixerModule) return text

  const plugins = [
    autoprefixerModule(
      browsers && Array.isArray(browsers) ? { overrideBrowserslist: browsers } : {}
    ),
  ]

  const result = await postcssModule(plugins).process(text, { from: undefined })
  return result.css
}

/* ============================
 *  MAIN FORMATTER
 * ============================ */

/**
 * cssFormatter entrypoint.
 *
 * config:
 * - mode: 'beautify' | 'minify'
 * - indentSize: '2' | '4' | 'tab'
 * - showValidation: boolean (default true)
 * - showLinting: boolean (default true)
 * - removeComments: boolean (strip block comments before processing)
 * - addAutoprefix: boolean(run Autoprefixer before beautify / minify)
 * - browsers: string[](optional overrideBrowserslist for Autoprefixer)
 */
async function cssFormatter(text, config = {}) {
  const {
    mode = 'beautify',
    indentSize = '2',
    showValidation = true,
    showLinting = true,
    removeComments: removeCommentsFlag = false,
    addAutoprefix = false,
    browsers = null,
  } = config

  try {
    if (!text || typeof text !== 'string') {
      return { error: 'Invalid input: Please provide CSS code', hideOutput: true }
    }

    const trimmed = text.trim()
    if (!trimmed) {
      return { error: 'Empty input: Please provide CSS code', hideOutput: true }
    }

    let processingText = trimmed

    if (removeCommentsFlag) {
      processingText = removeCssComments(processingText)
    }

    // 1. VALIDATION
    const validationResult = validateCss(processingText)
    const isWellFormed = validationResult.isValid

    // 2. FORMATTING PIPELINE (only if valid)
    let formatted = processingText

    if (isWellFormed) {
      let working = processingText

      if (addAutoprefix) {
        working = await autoprefixCss(working, browsers)
      }

      if (mode === 'minify') {
        formatted = await minifyCss(working)
      } else {
        formatted = await beautifyCss(working, indentSize)
      }
    }

    // 3. DIAGNOSTICS
    const diagnostics = []

    // Validation errors
    if (!validationResult.isValid && validationResult.errors) {
      diagnostics.push(
        ...validationResult.errors.map((e) => ({
          type: 'error',
          category: 'syntax',
          message: e.message,
          line: e.line,
          column: e.column,
        }))
      )
    }

    // Linting warnings (run on original input, only if input is well-formed)
    let lintResult = { total: 0, warnings: [] }
    if (showLinting && isWellFormed) {
      lintResult = await lintCss(processingText)
      diagnostics.push(
        ...lintResult.warnings.map((w) => ({
          type: w.severity === 'error' ? 'error' : 'warning',
          category: 'lint',
          message: w.text,
          line: w.line,
          column: w.column,
          rule: w.rule,
        }))
      )
    }

    return {
      formatted,
      isWellFormed,
      showValidation,
      showLinting,
      validation: validationResult,
      lint: lintResult,
      diagnostics,
      hideOutput: !isWellFormed, // can use this to hide the output panel on your UI
      optionsApplied: {
        mode,
        indentSize,
        removeComments: !!removeCommentsFlag,
        addAutoprefix: !!addAutoprefix,
      },
    }
  } catch (error) {
    return {
      error: `CSS processing error: ${error.message}`,
      hideOutput: true,
    }
  }
}

module.exports = {
  cssFormatter,
  validateCss,
  lintCss,
  beautifyCss,
  minifyCss,
  autoprefixCss,
}
