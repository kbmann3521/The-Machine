// lib/tools/sqlFormatter.js

let sqlFormatterModule = null
let nodeSqlParserModule = null

try {
  sqlFormatterModule = require('sql-formatter')
} catch (e) { }

try {
  nodeSqlParserModule = require('node-sql-parser')
} catch (e) { }

/* ===========================================
   VALIDATION (STRICT SQL PARSING)
   =========================================== */

function validateSql(sql, dialect = 'postgresql') {
  if (!nodeSqlParserModule) {
    return { isValid: true, errors: [] }
  }

  try {
    const parser = new nodeSqlParserModule.Parser()
    parser.parse(sql, { database: dialect })
    return { isValid: true, errors: [] }
  } catch (err) {
    let line = err.location?.start?.line || null
    let column = err.location?.start?.column || null

    return {
      isValid: false,
      errors: [
        {
          line,
          column,
          message: err.message.replace(/\n.*/s, '')
        }
      ]
    }
  }
}

/* ===========================================
   CHECK COMPATIBLE DIALECTS
   =========================================== */

function checkCompatibleDialects(sql) {
  if (!nodeSqlParserModule) {
    return []
  }

  const allDialects = [
    'postgresql',
    'mysql',
    'tsql',
    'sqlite',
    'mariadb',
    'plsql',
    'bigquery',
    'redshift'
  ]

  const compatible = []

  for (const dialect of allDialects) {
    try {
      const parser = new nodeSqlParserModule.Parser()
      parser.parse(sql, { database: dialect })
      compatible.push(dialect)
    } catch (err) {
      // This dialect doesn't work, skip it
    }
  }

  return compatible
}

/* ===========================================
   STRUCTURAL DIAGNOSTICS
   =========================================== */

function collectStructuralDiagnostics(sql) {
  const errors = []

  // Unbalanced parentheses
  let stack = []
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i]
    if (char === '(') stack.push(i)
    if (char === ')') {
      if (stack.length === 0) {
        const { line, column } = offsetToLineCol(sql, i)
        errors.push({
          type: 'error',
          category: 'structure',
          message: "Closing parenthesis ')' has no matching '('",
          line,
          column
        })
      } else {
        stack.pop()
      }
    }
  }

  // Unclosed parens
  for (const openIndex of stack) {
    const { line, column } = offsetToLineCol(sql, openIndex)
    errors.push({
      type: 'error',
      category: 'structure',
      message: "Opening parenthesis '(' is never closed",
      line,
      column
    })
  }

  // Bad semicolon count (multiple statements not allowed)
  const semicolons = sql.split(';').length - 1
  if (semicolons > 1) {
    errors.push({
      type: 'warning',
      category: 'structure',
      message: 'Multiple SQL statements detected — formatter only handles one query',
      line: null,
      column: null
    })
  }

  return errors
}

/* Convert offset → line/column */
function offsetToLineCol(text, offset) {
  const before = text.slice(0, offset)
  const lines = before.split(/\r?\n/)
  let line = lines.length
  let column = lines[lines.length - 1].length + 1
  return { line, column }
}

/* ===========================================
   LINTING RULES (STYLE / BEST PRACTICES)
   =========================================== */

function performSqlLinting(sql) {
  const warnings = []
  const lower = sql.toLowerCase()

  // Rule: SELECT *
  if (/\bselect\s+\*/i.test(sql)) {
    warnings.push({
      type: 'warning',
      category: 'lint',
      message: 'Avoid SELECT * — it reduces performance and clarity',
      line: null,
      column: null
    })
  }

  // Rule: missing semicolon
  if (!sql.trim().endsWith(';')) {
    warnings.push({
      type: 'info',
      category: 'lint',
      message: 'Query does not end with a semicolon',
      line: null,
      column: null
    })
  }

  // Rule: JOIN missing ON
  if (/\bjoin\b/i.test(sql) && !/\bon\b/i.test(sql)) {
    warnings.push({
      type: 'error',
      category: 'lint',
      message: 'JOIN clause is missing an ON condition',
      line: null,
      column: null
    })
  }

  // Rule: Mixed AND + OR without parentheses
  if (/\bwhere\b/i.test(sql) && /\band\b/i.test(sql) && /\bor\b/i.test(sql)) {
    warnings.push({
      type: 'info',
      category: 'lint',
      message: 'WHERE contains both AND and OR — consider using parentheses',
      line: null,
      column: null
    })
  }

  // Rule: Lowercase SQL keywords
  if (/\bselect\b|\bfrom\b|\bwhere\b/.test(sql) && sql.match(/\bselect\b/i)) {
    const keyword = sql.match(/\b(select|from|where)\b/i)?.[0]
    if (keyword && keyword === keyword.toLowerCase()) {
      warnings.push({
        type: 'warning',
        category: 'lint',
        message: 'SQL keywords should be uppercase for readability',
        line: null,
        column: null
      })
    }
  }

  return warnings
}

/* ===========================================
   SQL QUERY ANALYSIS
   =========================================== */

function analyzeSqlQuery(sql) {
  const lower = sql.toLowerCase()

  // Detect query type
  let queryType = 'UNKNOWN'
  if (/^\s*select\b/i.test(sql)) {
    queryType = 'SELECT'
  } else if (/^\s*insert\b/i.test(sql)) {
    queryType = 'INSERT'
  } else if (/^\s*update\b/i.test(sql)) {
    queryType = 'UPDATE'
  } else if (/^\s*delete\b/i.test(sql)) {
    queryType = 'DELETE'
  } else if (/^\s*create\b/i.test(sql)) {
    queryType = 'CREATE'
  } else if (/^\s*drop\b/i.test(sql)) {
    queryType = 'DROP'
  } else if (/^\s*alter\b/i.test(sql)) {
    queryType = 'ALTER'
  }

  // Detect JOINs
  const hasJoin = /\b(inner\s+)?join\b|\bleft\s+join\b|\bright\s+join\b|\bfull\s+join\b/i.test(sql)

  // Detect subqueries
  const hasSubquery = /\(\s*select\b/i.test(sql)

  // Detect aggregation
  const hasAggregation = /\b(sum|count|avg|min|max|group_concat)\s*\(/i.test(sql)

  // Extract tables (simple regex-based extraction)
  const tables = []
  const tableMatches = sql.match(/\b(?:from|join|into|update)\s+([`"\']?[\w\.\*]+[`"\']?)/gi)
  if (tableMatches) {
    tableMatches.forEach((match) => {
      const table = match.replace(/\b(?:from|join|into|update)\s+/i, '').trim()
      if (table && table !== '*' && !tables.includes(table)) {
        tables.push(table)
      }
    })
  }

  // Extract columns (simple regex-based extraction)
  const columns = []
  const columnMatches = sql.match(/\b([a-zA-Z_]\w*)\s*\./g)
  if (columnMatches) {
    columnMatches.forEach((match) => {
      const col = match.replace(/\s*\.$/, '').trim()
      if (col && !columns.includes(col)) {
        columns.push(col)
      }
    })
  }

  return {
    queryType,
    hasJoin,
    hasSubquery,
    hasAggregation,
    tables,
    columns
  }
}

/* ===========================================
   PARSE TREE GENERATION
   =========================================== */

function parseSqlQuery(sql) {
  if (!nodeSqlParserModule) {
    return {
      error: 'node-sql-parser not available'
    }
  }

  try {
    const parser = new nodeSqlParserModule.Parser()
    const ast = parser.parse(sql)
    return {
      structure: JSON.stringify(ast, null, 2),
      error: null
    }
  } catch (err) {
    return {
      error: err.message.replace(/\n.*/s, ''),
      structure: null
    }
  }
}

/* ===========================================
   SQL FORMATTER (MAIN TOOL)
   =========================================== */

function sqlFormatter(text, config = {}) {
  const {
    language = 'postgresql',
    indent = '  ',
    keywordCase = 'upper',
    minify = false,
    showLint = true,
    showTableAnalysis = true,
    showParsing = false
  } = config

  try {
    const originalSql = text || ''
    const trimmed = originalSql.trim()

    if (!trimmed) {
      return { error: 'Empty SQL input', hideOutput: true }
    }

    /* ===============================================
       STEP 1 — VALIDATION (STRICT PARSER)
       =============================================== */
    const validation = validateSql(trimmed, language)
    const isWellFormed = validation.isValid

    /* ===============================================
       STEP 2 — STRUCTURAL DIAGNOSTICS
       =============================================== */
    const structuralErrors = collectStructuralDiagnostics(trimmed)

    /* ===============================================
       STEP 3 — LINTING (COLLECT WARNINGS)
       =============================================== */
    let lintWarnings = performSqlLinting(trimmed)

    /* ===============================================
       STEP 4 — BUILD DIAGNOSTICS ARRAY
       =============================================== */
    const diagnostics = []

    // Add validation errors
    diagnostics.push(
      ...validation.errors.map(e => ({
        type: 'error',
        category: 'syntax',
        message: e.message,
        line: e.line,
        column: e.column
      }))
    )

    // Add structural errors
    diagnostics.push(...structuralErrors)

    // Add lint warnings
    diagnostics.push(...lintWarnings)

    /* ===============================================
       STEP 5 — ONLY FORMAT IF VALID
       =============================================== */
    let formatted = trimmed
    if (isWellFormed && sqlFormatterModule) {
      try {
        let tabWidth = 2
        if (indent === '\t') {
          tabWidth = 1
        } else if (typeof indent === 'string') {
          tabWidth = indent.length
        }

        formatted = sqlFormatterModule.format(trimmed, {
          language,
          tabWidth,
          keywordCase,
          linesBetweenQueries: minify ? 0 : 1
        })
      } catch (e) { }
    }

    if (minify) {
      formatted = formatted.replace(/\s+/g, ' ').trim()
    }

    const result = {
      formatted,
      isWellFormed,
      hideOutput: !isWellFormed,
      diagnostics,
      showValidation: true,
      showLinting: showLint
    }

    /* ===============================================
       STEP 6 — ADD LINT OBJECT (For UI rendering)
       =============================================== */
    if (showLint) {
      const lintingWarnings = diagnostics.filter(d => d.type === 'warning' || (d.type === 'info' && d.category === 'lint'))
      result.lint = {
        warnings: lintingWarnings.map(w => ({
          level: w.type === 'info' ? 'info' : 'warning',
          message: w.message,
          suggestion: null
        })),
        total: lintingWarnings.length
      }
    }

    /* ===============================================
       STEP 7 — ADD ANALYSIS (For UI rendering)
       =============================================== */
    if (showTableAnalysis) {
      result.analysis = analyzeSqlQuery(trimmed)
    }

    /* ===============================================
       STEP 8 — ADD PARSE TREE (For UI rendering)
       =============================================== */
    if (showParsing) {
      result.parseTree = parseSqlQuery(trimmed)
    }

    return result
  } catch (error) {
    return {
      error: error.message,
      hideOutput: true
    }
  }
}

module.exports = { sqlFormatter }
