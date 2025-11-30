// lib/tools/cssFormatter.js

let postcssModule = null
let cssnanoModule = null
let autoprefixerModule = null
let stylelintModule = null

try {
  if (typeof window === 'undefined') {
    postcssModule = require('postcss')
    cssnanoModule = require('cssnano')
    autoprefixerModule = require('autoprefixer')
    stylelintModule = require('stylelint')
  }
} catch (error) {
  // Optional modules not available; formatter will gracefully degrade
}

/* ============================
 *  VALIDATION (STRICT-ish)
 * ============================ */

/**
 * List of valid CSS properties (common ones)
 */
const VALID_CSS_PROPERTIES = new Set([
  // Colors & Backgrounds
  'background', 'background-color', 'background-image', 'background-position', 'background-repeat',
  'background-size', 'background-attachment', 'background-clip', 'background-origin',
  'color', 'opacity',

  // Text
  'font', 'font-family', 'font-size', 'font-style', 'font-variant', 'font-weight',
  'font-stretch', 'line-height', 'letter-spacing', 'word-spacing', 'text-align',
  'text-decoration', 'text-decoration-color', 'text-decoration-line', 'text-decoration-style',
  'text-indent', 'text-overflow', 'text-shadow', 'text-transform', 'white-space',

  // Box Model
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color', 'border-radius', 'border-collapse',
  'border-spacing', 'border-image', 'box-shadow', 'box-sizing',
  'height', 'width', 'max-height', 'max-width', 'min-height', 'min-width',

  // Layout
  'display', 'position', 'top', 'right', 'bottom', 'left', 'z-index',
  'float', 'clear', 'overflow', 'overflow-x', 'overflow-y', 'visibility',
  'clip', 'clip-path',

  // Flexbox
  'flex', 'flex-basis', 'flex-direction', 'flex-grow', 'flex-shrink', 'flex-wrap',
  'align-content', 'align-items', 'align-self', 'justify-content', 'justify-items',
  'gap', 'row-gap', 'column-gap',

  // Grid
  'grid', 'grid-area', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows',
  'grid-column', 'grid-column-end', 'grid-column-start', 'grid-row',
  'grid-row-end', 'grid-row-start', 'grid-template', 'grid-template-areas',
  'grid-template-columns', 'grid-template-rows',

  // Effects & Transforms
  'transform', 'transform-origin', 'transform-style',
  'transition', 'transition-delay', 'transition-duration', 'transition-property',
  'transition-timing-function', 'animation', 'animation-delay', 'animation-direction',
  'animation-duration', 'animation-fill-mode', 'animation-iteration-count',
  'animation-name', 'animation-play-state', 'animation-timing-function',
  'filter', 'backdrop-filter',

  // Lists
  'list-style', 'list-style-image', 'list-style-position', 'list-style-type',
  'counter-reset', 'counter-increment',

  // Tables
  'table-layout', 'caption-side', 'empty-cells', 'vertical-align',

  // Content
  'content', 'quotes', 'cursor',

  // Printing
  'page-break-after', 'page-break-before', 'page-break-inside', 'orphans', 'widows',
])

/**
 * Validate CSS using PostCSS parser and check for common issues.
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

  const errors = []

  try {
    const root = postcssModule.parse(text)

    // Walk through all declarations to check for unknown properties
    root.walkDecls((decl) => {
      const prop = decl.prop.toLowerCase()

      // Ignore vendor prefixes
      if (prop.startsWith('-webkit-') || prop.startsWith('-moz-') ||
          prop.startsWith('-ms-') || prop.startsWith('-o-') || prop.startsWith('-khtml-')) {
        return
      }

      // Check if property is known
      if (!VALID_CSS_PROPERTIES.has(prop) && !prop.startsWith('--')) {
        errors.push({
          line: decl.source?.start?.line || null,
          column: decl.source?.start?.column || null,
          message: `Unknown property "${prop}"`,
        })
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
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
    return { total: 0, warnings: [] }
  }

  try {
    const data = await stylelintModule.lint({
      code: text,
      codeFilename: 'input.css',
      config: {
        rules: {
          // === Syntax & Structure ===
          'block-no-empty': true,
          'declaration-block-no-duplicate-properties': true,
          'declaration-block-trailing-semicolon': 'always',

          // === Colors ===
          'color-no-invalid-hex': true,
          'color-named': ['never', { ignore: ['inside-function'] }],

          // === Properties ===
          'property-no-unknown': true,
          'property-no-vendor-prefix': true,

          // === Values ===
          'unit-no-unknown': true,
          'function-no-unknown': null,

          // === Selectors ===
          'selector-type-no-unknown': true,
          'selector-max-id': 1,
          'selector-pseudo-element-no-unknown': true,

          // === At-rules ===
          'at-rule-no-unknown': null,
          'at-rule-no-vendor-prefix': true,

          // === Strings ===
          'string-no-newline': true,

          // === Case ===
          'color-hex-case': 'lower',
          'function-name-case': 'lower',
          'property-case': 'lower',
          'selector-pseudo-class-case': 'lower',
          'selector-type-case': 'lower',
          'unit-case': 'lower',

          // === Spacing & Format ===
          'block-opening-brace-space-before': 'always',
          'declaration-colon-space-after': 'always',
          'declaration-colon-space-before': 'never',
          'declaration-block-single-line-max-declarations': null,
          'indentation': null,
          'max-empty-lines': 1,
          'number-leading-zero': 'always',
          'number-no-trailing-zeros': true,
        },
      },
    })

    const result = data.results && data.results[0]
    const warnings = (result && result.warnings) || []

    return {
      total: warnings.length,
      warnings: warnings.map((w) => ({
        line: w.line,
        column: w.column,
        rule: w.rule,
        severity: w.severity,
        text: w.text,
      })),
    }
  } catch (_) {
    // If stylelint blows up for any reason, just skip linting
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
 *  BEAUTIFY (FALLBACK FORMATTER)
 * ============================ */

/**
 * Simple CSS beautifier:
 * - Indents blocks on '{' / '}'
 * - Newlines after ';' and '}'
 */
function beautifyCss(text, indentSize = '2') {
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
        formatted = beautifyCss(working, indentSize)
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

    // Linting warnings (only if valid CSS)
    let lintResult = { total: 0, warnings: [] }
    if (showLinting && isWellFormed) {
      lintResult = await lintCss(formatted)
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
