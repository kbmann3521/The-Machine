// lib/tools/cssFormatter.js

let postcssModule = null
let cssnanoModule = null
let autoprefixerModule = null
let stylelintModule = null
let csstreeModule = null

// Load each module independently so one failure doesn't cascade to others
if (typeof window === 'undefined') {
  // PostCSS - core parsing/formatting
  try {
    postcssModule = require('postcss')
  } catch (error) {
    // postcss not available; formatter will use fallback
  }

  // cssnano - minification
  try {
    cssnanoModule = require('cssnano')
  } catch (error) {
    // cssnano not available; minification will use fallback
  }

  // Autoprefixer - vendor prefixes
  try {
    autoprefixerModule = require('autoprefixer')
  } catch (error) {
    // autoprefixer not available; autoprefixing will be skipped
  }

  // Stylelint - linting
  try {
    stylelintModule = require('stylelint')
  } catch (error) {
    // stylelint not available; linting will be skipped
  }

  // css-tree - validation
  try {
    csstreeModule = require('css-tree')
  } catch (error) {
    // css-tree not available; validation will default to true
  }
}

console.log('css-tree available?', !!csstreeModule)

/* ============================
 *  SEMANTIC ANALYSIS (PHASE 2)
 * ============================ */

/**
 * Calculate specificity score for a CSS selector (heuristic).
 * #id → +100
 * .class / [attr] / :pseudo → +10
 * element → +1
 */
function calculateSpecificity(selector) {
  let score = 0
  // ID selectors: 100 points each
  score += (selector.match(/#/g) || []).length * 100
  // Classes, attributes, pseudo-classes: 10 points each
  score += (selector.match(/\./g) || []).length * 10
  score += (selector.match(/\[/g) || []).length * 10
  score += (selector.match(/:/g) || []).length * 10
  // Element selectors: 1 point each
  const elemCount = (selector.match(/^[a-z]/i) ? 1 : 0) +
    (selector.match(/\s+[a-z]/gi) || []).length
  score += elemCount
  return score
}

/**
 * Analyze CSS AST to extract structured metadata and rules tree.
 *
 * Returns:
 * {
 *   totalRules: number,
 *   uniqueSelectors: string[],
 *   uniqueProperties: string[],
 *   variables: { name: string, value: string, line: number }[],
 *   mediaQueries: { query: string, breakpoint: string | null, line: number, ruleCount: number }[],
 *   atRules: { name: string, params: string, line: number }[],
 *   maxNestingDepth: number,
 *   duplicateDeclarations: { prop: string, selectors: string[], locations: { line, column }[] }[],
 *   specificity: { selector: string, score: number }[],
 *   rulesTree: CssRuleNode[]
 * }
 */
function analyzeCss(text) {
  if (!postcssModule) {
    return getEmptyAnalysis()
  }

  try {
    const root = postcssModule.parse(text)

    const analysis = {
      totalRules: 0,
      uniqueSelectors: [],
      uniqueProperties: new Set(),
      variables: {
        declared: [],
        used: [],
      },
      mediaQueries: [],
      atRules: [],
      maxNestingDepth: 0,
      duplicateDeclarations: [],
      specificity: [],
      rulesTree: [],
    }

    const selectorMap = {} // Track selectors: selector -> properties
    const propertyMap = {} // Track properties: prop -> [{ selector, line, column }]
    const visitedSelectors = new Set()

    // Helper: Extract breakpoint from media query
    const extractBreakpoint = (params) => {
      const match = params.match(/\(max-width:\s*(\d+(?:px|em|rem)?)\)/)
      if (match) return match[1]
      const match2 = params.match(/\(min-width:\s*(\d+(?:px|em|rem)?)\)/)
      if (match2) return match2[1]
      return null
    }

    // Helper: Calculate max nesting depth
    let maxDepth = 0
    const calculateDepth = (node, currentDepth = 0) => {
      maxDepth = Math.max(maxDepth, currentDepth)
      if (node.nodes) {
        node.nodes.forEach(child => {
          calculateDepth(child, currentDepth + 1)
        })
      }
    }

    // Helper: Build rules tree from AST node
    const buildRuleNode = (node) => {
      if (node.type === 'rule') {
        // Validate selector exists and is a string
        if (!node.selector || typeof node.selector !== 'string') {
          return null
        }

        const declarations = []
        node.each((decl) => {
          if (decl.type === 'decl') {
            declarations.push({
              property: decl.prop,
              value: decl.value,
              loc: {
                startLine: decl.source?.start?.line,
                endLine: decl.source?.end?.line,
              },
            })
          }
        })

        return {
          type: 'rule',
          selector: node.selector,
          specificity: calculateSpecificity(node.selector),
          declarations,
          children: [],
          loc: {
            startLine: node.source?.start?.line,
            endLine: node.source?.end?.line,
          },
        }
      } else if (node.type === 'atrule') {
        const children = []
        if (node.nodes) {
          node.nodes.forEach(child => {
            const childNode = child.type === 'rule' ? buildRuleNode(child) : (child.type === 'atrule' ? buildRuleNode(child) : null)
            if (childNode) {
              children.push(childNode)
            }
          })
        }

        return {
          type: 'atrule',
          atRule: {
            name: node.name,
            params: node.params || '',
          },
          children,
          loc: {
            startLine: node.source?.start?.line,
            endLine: node.source?.end?.line,
          },
        }
      }
      return null
    }

    // Walk the AST and build rules tree
    root.each((node, idx) => {
      if (node.type === 'rule') {
        analysis.totalRules++

        // Extract selector
        const selector = node.selector
        if (!visitedSelectors.has(selector)) {
          visitedSelectors.add(selector)
          analysis.uniqueSelectors.push(selector)
        }

        // Track specificity
        analysis.specificity.push({
          selector,
          score: calculateSpecificity(selector),
        })

        // Track declarations
        node.each((decl) => {
          if (decl.type === 'decl') {
            const prop = decl.prop.toLowerCase()
            analysis.uniqueProperties.add(prop)

            // Track for duplicate detection
            if (!propertyMap[prop]) {
              propertyMap[prop] = []
            }
            propertyMap[prop].push({
              selector,
              line: decl.source?.start?.line,
              column: decl.source?.start?.column,
              value: decl.value,
            })
          }
        })

        // Add to rules tree
        const ruleNode = buildRuleNode(node)
        if (ruleNode) {
          analysis.rulesTree.push(ruleNode)
        }

        calculateDepth(node)
      } else if (node.type === 'atrule') {
        // Track at-rule
        analysis.atRules.push({
          name: node.name,
          params: node.params || '',
          line: node.source?.start?.line,
        })

        // Special handling for @media
        if (node.name === 'media') {
          let ruleCount = 0
          if (node.nodes) {
            node.nodes.forEach(child => {
              if (child.type === 'rule') ruleCount++
            })
          }

          analysis.mediaQueries.push({
            query: node.params,
            breakpoint: extractBreakpoint(node.params),
            line: node.source?.start?.line,
            ruleCount,
          })
        }

        // Add to rules tree
        const atRuleNode = buildRuleNode(node)
        if (atRuleNode) {
          analysis.rulesTree.push(atRuleNode)
        }

        // Track at-rule variables (@supports, @keyframes)
        calculateDepth(node)
      }
    })

    // Extract declared CSS variables (:root --var)
    root.each((node) => {
      if (node.type === 'rule' && (node.selector === ':root' || node.selector.includes(':root'))) {
        node.each((decl) => {
          if (decl.type === 'decl' && decl.prop.startsWith('--')) {
            analysis.variables.declared.push({
              name: decl.prop,
              value: decl.value,
              loc: {
                startLine: decl.source?.start?.line,
                endLine: decl.source?.end?.line,
              },
              scope: node.selector,
            })
          }
        })
      }
    })

    // Extract variable usage (where var(--something) is used)
    const varUsageRegex = /var\s*\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g
    root.each((node) => {
      if (node.type === 'rule') {
        const selector = node.selector
        node.each((decl) => {
          if (decl.type === 'decl') {
            const matches = decl.value.matchAll(varUsageRegex)
            for (const match of matches) {
              const varName = match[1]
              analysis.variables.used.push({
                name: varName,
                loc: {
                  startLine: decl.source?.start?.line,
                  endLine: decl.source?.end?.line,
                },
                selector: selector,
                property: decl.prop,
              })
            }
          }
        })
      }
    })

    // Detect duplicate declarations
    Object.entries(propertyMap).forEach(([prop, occurrences]) => {
      if (occurrences.length > 1) {
        // Group by value to find actual duplicates
        const byValue = {}
        occurrences.forEach(occ => {
          if (!byValue[occ.value]) {
            byValue[occ.value] = []
          }
          byValue[occ.value].push(occ)
        })

        // Only flag if same property + value appears in same selector
        Object.entries(byValue).forEach(([value, dups]) => {
          const bySelectorValue = {}
          dups.forEach(dup => {
            const key = `${dup.selector}|${value}`
            if (!bySelectorValue[key]) {
              bySelectorValue[key] = []
            }
            bySelectorValue[key].push(dup)
          })

          Object.entries(bySelectorValue).forEach(([key, selectorDups]) => {
            if (selectorDups.length > 1) {
              analysis.duplicateDeclarations.push({
                prop,
                value,
                selectors: [...new Set(selectorDups.map(d => d.selector))],
                locations: selectorDups.map(d => ({ line: d.line, column: d.column })),
              })
            }
          })
        })
      }
    })

    // Set max nesting depth from calculation
    analysis.maxNestingDepth = maxDepth

    // Convert Set to Array for JSON serialization
    analysis.uniqueProperties = Array.from(analysis.uniqueProperties).sort()

    // Phase 7D: Annotate rulesTree with numeric indices for disabled property tracking
    // This allows UI components to reference rules by ruleIndex (e.g., "1-padding" format)
    // IMPORTANT: Assign index, increment, then pass next index to children to avoid duplicates
    const annotateWithIndex = (rules, startIndex = 0) => {
      if (!rules || !Array.isArray(rules)) return startIndex

      let index = startIndex
      for (const rule of rules) {
        if (!rule) {
          index++
          continue
        }

        // Assign current index to this rule
        rule.ruleIndex = index
        index++

        // Annotate nested rules in at-rules (e.g., @media) starting at next index
        // This ensures children have unique indices (not duplicate with parent)
        if (rule.children && Array.isArray(rule.children)) {
          index = annotateWithIndex(rule.children, index)
        }
      }
      return index
    }

    if (analysis.rulesTree && Array.isArray(analysis.rulesTree)) {
      annotateWithIndex(analysis.rulesTree)
    }

    return analysis
  } catch (error) {
    console.debug('CSS analysis error:', error.message)
    return getEmptyAnalysis()
  }
}

function getEmptyAnalysis() {
  return {
    totalRules: 0,
    uniqueSelectors: [],
    uniqueProperties: [],
    variables: {
      declared: [],
      used: [],
    },
    mediaQueries: [],
    atRules: [],
    maxNestingDepth: 0,
    duplicateDeclarations: [],
    specificity: [],
    rulesTree: [],
  }
}

/* ============================
 *  VALIDATION (STRICT-ish)
 * ============================ */

/**
 * Validate CSS using css-tree parser.
 * css-tree catches syntax errors like unclosed blocks, invalid selectors, etc.
 * Returns:
 * {
 *   isValid: boolean,
 *   errors: [{ line, column, message }]
 * }
 */
function validateCss(text) {
  if (!csstreeModule) {
    return { isValid: true, errors: [] }
  }

  try {
    csstreeModule.parse(text, {
      positions: true,
      onParseError: (err) => { throw err }
    })

    return { isValid: true, errors: [] }
  } catch (err) {
    return {
      isValid: false,
      errors: [
        {
          line: err.line || null,
          column: err.column || null,
          message: err.message || 'Invalid CSS'
        }
      ]
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
  if (!postcssModule) {
    console.debug('postcss module not available')
    return text
  }

  if (!autoprefixerModule) {
    console.debug('autoprefixer module not available')
    return text
  }

  let autoprefixerConfig = {}

  if (browsers) {
    let browsersList = browsers

    if (typeof browsers === 'string') {
      browsersList = browsers
        .split(',')
        .map(b => b.trim())
        .filter(Boolean)
    }

    if (Array.isArray(browsersList) && browsersList.length > 0) {
      autoprefixerConfig = { overrideBrowserslist: browsersList }
    }
  }

  try {
    const plugins = [autoprefixerModule(autoprefixerConfig)]
    const result = await postcssModule(plugins).process(text, { from: undefined })
    return result.css
  } catch (error) {
    console.debug('autoprefixer error:', error.message)
    return text
  }
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

  console.debug('cssFormatter config:', { addAutoprefix, browsers, mode, indentSize })

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
        console.debug('Running autoprefix with browsers:', browsers)
        working = await autoprefixCss(working, browsers)
        console.debug('After autoprefix, CSS changed:', working !== processingText)
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

    // Phase 2: Semantic analysis
    const analysis = isWellFormed ? analyzeCss(processingText) : getEmptyAnalysis()

    return {
      formatted,
      isWellFormed,
      showValidation,
      showLinting,
      validation: validationResult,
      lint: lintResult,
      diagnostics,
      analysis, // Phase 2: CSS metadata extraction
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
  analyzeCss,
}
