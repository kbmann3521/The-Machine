let sqlFormatterModule = null
let nodeSqlParserModule = null

try {
  sqlFormatterModule = require('sql-formatter')
} catch (error) {
  // sql-formatter package not available
}

try {
  nodeSqlParserModule = require('node-sql-parser')
} catch (error) {
  // node-sql-parser package not available
}

function sqlFormatter(text, config = {}) {
  const {
    language = 'postgresql',
    indent = '  ',
    keywordCase = 'upper',
    minify = false,
    showLint = true,
    showParsing = false,
    showTableAnalysis = false,
  } = config

  try {
    if (!text || typeof text !== 'string') {
      return { error: 'Invalid input: Please provide SQL text' }
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      return { error: 'Empty input: Please provide SQL text' }
    }

    let formattedSql = trimmedText

    // Use sql-formatter if available
    if (sqlFormatterModule && sqlFormatterModule.format) {
      try {
        formattedSql = sqlFormatterModule.format(trimmedText, {
          language,
          indent,
          keywordCase,
          linesBetweenQueries: minify ? 0 : 1,
        })
      } catch (error) {
        formattedSql = trimmedText
      }
    } else {
      // Fallback: basic formatting
      formattedSql = fallbackSqlFormat(trimmedText, indent, keywordCase)
    }

    // Apply minification if requested
    if (minify) {
      formattedSql = formattedSql.replace(/\s+/g, ' ').trim()
    }

    const result = {
      formatted: formattedSql,
    }

    // Add linting info if requested
    if (showLint) {
      result.lint = performSqlLinting(trimmedText, formattedSql)
    }

    // Add table and column analysis
    if (showTableAnalysis) {
      result.analysis = analyzeSqlQuery(trimmedText)
    }

    // Add parsing information if requested
    if (showParsing) {
      result.parseTree = parseSqlQuery(trimmedText)
    }

    return result
  } catch (error) {
    return {
      error: `Formatting error: ${error.message}`,
      formatted: text,
    }
  }
}

function fallbackSqlFormat(sql, indent = '  ', keywordCase = 'upper') {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
    'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'BETWEEN', 'LIKE',
    'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'OFFSET',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
    'UNION', 'INTERSECT', 'EXCEPT'
  ]

  let result = sql
  const keywordPattern = keywords.join('|')
  const regex = new RegExp(`\\b(${keywordPattern})\\b`, 'gi')

  result = result.replace(regex, (match) => {
    return keywordCase === 'upper' ? match.toUpperCase() : match.toLowerCase()
  })

  // Add line breaks for major clauses
  result = result.replace(/\s+(SELECT|FROM|WHERE|JOIN|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|UNION|INTERSECT|EXCEPT)\s+/gi, (match) => {
    return '\n' + match.trim() + ' '
  })

  // Handle commas in SELECT lists
  result = result.replace(/,\s*/g, ',\n' + indent)

  // Clean up multiple newlines
  result = result.replace(/\n\s*\n/g, '\n').trim()

  return result
}

function performSqlLinting(originalSql, formattedSql) {
  const warnings = []
  const lowerSql = originalSql.toLowerCase()

  // Check for missing semicolon
  if (!originalSql.trim().endsWith(';')) {
    warnings.push({
      level: 'info',
      message: 'Query does not end with a semicolon',
      suggestion: 'Add a semicolon at the end of the query',
    })
  }

  // Check for SELECT *
  if (/\bselect\s+\*/gi.test(originalSql)) {
    warnings.push({
      level: 'warning',
      message: 'Using SELECT * can impact performance',
      suggestion: 'Specify only the columns you need',
    })
  }

  // Check for missing ON clause in JOIN
  if (/\bjoin\b/gi.test(originalSql) && !/\bon\b/gi.test(originalSql)) {
    warnings.push({
      level: 'error',
      message: 'JOIN clause found without ON condition',
      suggestion: 'Add an ON clause to specify the join condition',
    })
  }

  // Check for lowercase keywords
  if (/\bselect\b|\bfrom\b|\bwhere\b/i.test(originalSql) && /\b[a-z]+\b/.test(originalSql.match(/\b(select|from|where)\b/i)?.[0] || '')) {
    const sqlLowerRegex = /(select|from|where|join|group|order|limit)\b/g
    const matches = originalSql.match(sqlLowerRegex) || []
    if (matches.some(m => m.toLowerCase() === m)) {
      warnings.push({
        level: 'style',
        message: 'SQL keywords should be uppercase for readability',
        suggestion: 'Use uppercase for SQL keywords',
      })
    }
  }

  // Check for logic issues
  if (/\bwhere\b.*\band\b.*\bor\b/gi.test(originalSql)) {
    warnings.push({
      level: 'info',
      message: 'Query contains both AND and OR - ensure proper precedence with parentheses',
      suggestion: 'Consider adding parentheses to clarify the logic',
    })
  }

  return {
    total: warnings.length,
    warnings,
  }
}

function analyzeSqlQuery(sql) {
  const analysis = {
    queryType: detectQueryType(sql),
    tables: extractTableNames(sql),
    columns: extractColumnNames(sql),
    hasJoin: /\bjoin\b/i.test(sql),
    hasSubquery: /\(.*select/i.test(sql),
    hasAggregation: /\b(count|sum|avg|max|min|group_concat)\s*\(/i.test(sql),
  }

  return analysis
}

function detectQueryType(sql) {
  const trimmed = sql.trim().toUpperCase()

  if (trimmed.startsWith('SELECT')) return 'SELECT'
  if (trimmed.startsWith('INSERT')) return 'INSERT'
  if (trimmed.startsWith('UPDATE')) return 'UPDATE'
  if (trimmed.startsWith('DELETE')) return 'DELETE'
  if (trimmed.startsWith('CREATE')) return 'CREATE'
  if (trimmed.startsWith('ALTER')) return 'ALTER'
  if (trimmed.startsWith('DROP')) return 'DROP'
  if (trimmed.startsWith('TRUNCATE')) return 'TRUNCATE'

  return 'UNKNOWN'
}

function extractTableNames(sql) {
  const tables = new Set()

  // Match patterns like "FROM table_name" or "JOIN table_name ON"
  const fromPattern = /\bfrom\s+([a-zA-Z0-9_`"'\[\]]+)/gi
  const joinPattern = /\bjoin\s+([a-zA-Z0-9_`"'\[\]]+)/gi
  const intoPattern = /\binto\s+([a-zA-Z0-9_`"'\[\]]+)/gi
  const updatePattern = /\bupdate\s+([a-zA-Z0-9_`"'\[\]]+)/gi

  let match

  while ((match = fromPattern.exec(sql)) !== null) {
    tables.add(cleanIdentifier(match[1]))
  }

  while ((match = joinPattern.exec(sql)) !== null) {
    tables.add(cleanIdentifier(match[1]))
  }

  while ((match = intoPattern.exec(sql)) !== null) {
    tables.add(cleanIdentifier(match[1]))
  }

  while ((match = updatePattern.exec(sql)) !== null) {
    tables.add(cleanIdentifier(match[1]))
  }

  return Array.from(tables)
}

function extractColumnNames(sql) {
  const columns = new Set()

  // Match SELECT clause columns
  const selectMatch = sql.match(/\bselect\s+(.*?)\s+from/i)
  if (selectMatch) {
    const selectPart = selectMatch[1]
    const columnList = selectPart.split(',').map(col => col.trim())

    columnList.forEach(col => {
      // Handle aliases (e.g., "column_name AS alias")
      const parts = col.split(/\s+as\s+/i)
      const columnName = parts[0].trim()
      if (columnName && columnName !== '*') {
        columns.add(cleanIdentifier(columnName))
      }
    })
  }

  // Match WHERE clause columns
  const wherePattern = /([a-zA-Z0-9_`"'\[\]]+)\s*[=<>!]+/g
  let match
  while ((match = wherePattern.exec(sql)) !== null) {
    const col = match[1].trim()
    if (col && !isKeyword(col)) {
      columns.add(cleanIdentifier(col))
    }
  }

  return Array.from(columns)
}

function cleanIdentifier(identifier) {
  // Remove quotes, brackets, backticks
  return identifier.replace(/^["'`\[\]]+|["'`\[\]]+$/g, '')
}

function isKeyword(word) {
  const keywords = ['select', 'from', 'where', 'and', 'or', 'not', 'in', 'is', 'null', 'true', 'false']
  return keywords.includes(word.toLowerCase())
}

function parseSqlQuery(sql) {
  if (!nodeSqlParserModule) {
    return { error: 'SQL parser not available' }
  }

  try {
    const parser = new nodeSqlParserModule.Parser()
    const ast = parser.parse(sql)
    return {
      success: true,
      structure: typeof ast === 'object' ? JSON.stringify(ast, null, 2) : ast,
    }
  } catch (error) {
    return {
      error: `Parse error: ${error.message}`,
    }
  }
}

module.exports = { sqlFormatter }
