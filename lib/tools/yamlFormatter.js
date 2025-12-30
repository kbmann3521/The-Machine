/**
 * ============================================================================
 * YAML Formatter: AST-Based Architecture
 * ============================================================================
 *
 * This formatter uses a structural (AST-based) approach instead of line-by-line
 * regex manipulation. This ensures proper YAML formatting that respects the
 * language's semantic structure.
 *
 * Architecture Pipeline:
 * 1. Parse Input → YAML Document (AST via yaml.parseDocument)
 * 2. Validate → Check doc.errors for syntax issues
 * 3. Transform → Stringify with mode-specific options
 * 4. Lint → Custom style checks on output
 *
 * Libraries:
 * - Primary: 'yaml' (eemeli/yaml) - Full AST support, comment preservation
 * - Fallback: 'js-yaml' - Basic parsing only, for validation
 * - Conversion: '@iarna/toml' - TOML output support
 *
 * Why AST-based?
 * • YAML is structural, not just formatted text
 * • Preserves comments, anchors, flow/block style
 * • Handles edge cases (flow collections, scalars, etc.)
 * • Matches behavior of Prettier, VS Code, IDE tools
 *
 * ============================================================================
 */

let yamlModule = null
let tomlModule = null
let yamlLintModule = null

try {
  yamlModule = require('yaml')
} catch (error) {
  try {
    yamlModule = require('js-yaml')
  } catch (fallbackError) {
    // YAML parsing packages not available
  }
}

try {
  tomlModule = require('@iarna/toml')
} catch (error) {
  // TOML module not available
}

try {
  if (typeof window === 'undefined') {
    yamlLintModule = require('yaml-lint')
  }
} catch (error) {
  // yaml-lint module not available
}

function performStyleLinting(text) {
  const warnings = []
  const lines = text.split('\n')
  let baseIndent = null
  const indentLevels = new Set()

  lines.forEach((line, lineNum) => {
    const lineNum1Based = lineNum + 1

    // Check for trailing whitespace
    if (line.length > 0 && line !== line.trimEnd()) {
      warnings.push({
        line: lineNum1Based,
        column: line.trimEnd().length + 1,
        message: 'Trailing whitespace detected',
      })
    }

    // Skip empty lines for indentation checks
    if (line.trim().length === 0) {
      return
    }

    // Check indentation consistency
    const leadingSpaces = line.match(/^ */)[0].length
    const content = line.trim()

    if (leadingSpaces > 0) {
      if (baseIndent === null && leadingSpaces > 0) {
        baseIndent = leadingSpaces
      }
      indentLevels.add(leadingSpaces)
    }

    // Check for multiple spaces before/after colons (unless it's a URL)
    if (content.includes(':') && !content.includes('://')) {
      const colonMatch = content.match(/:\s{2,}/)
      if (colonMatch) {
        const colonPos = line.indexOf(colonMatch[0])
        warnings.push({
          line: lineNum1Based,
          column: colonPos + 1,
          message: 'Multiple spaces after colon (use single space)',
        })
      }
    }

    // Check for spaces before colon (e.g., "key : value" instead of "key: value")
    if (content.match(/\s+:\s/) && !content.startsWith('-')) {
      const colonPos = content.indexOf(':')
      if (colonPos > 0 && content[colonPos - 1] === ' ') {
        warnings.push({
          line: lineNum1Based,
          column: line.indexOf(content) + colonPos,
          message: 'No space before colon allowed',
        })
      }
    }

    // Check for missing space after hyphen in arrays
    if (content.startsWith('-') && content.length > 1 && content[1] !== ' ' && content[1] !== '\n') {
      warnings.push({
        line: lineNum1Based,
        column: 2,
        message: 'Space required after hyphen in array items',
      })
    }
  })

  // Check if indentation is consistent (multiples of 2 or 4)
  if (baseIndent && baseIndent > 0) {
    const validIndents = [2, 4]
    const baseUnit = validIndents.find(unit => baseIndent % unit === 0) || 2

    for (const level of indentLevels) {
      if (level > 0 && level % baseUnit !== 0) {
        // Find the line with this indentation
        const lineWithIndent = lines.findIndex(l => l.match(/^ */)[0].length === level && l.trim().length > 0)
        if (lineWithIndent >= 0) {
          warnings.push({
            line: lineWithIndent + 1,
            column: level + 1,
            message: `Inconsistent indentation (not a multiple of ${baseUnit} spaces)`,
          })
        }
      }
    }
  }

  return warnings
}

/**
 * Main YAML formatter entry point
 *
 * Flow:
 * 1. Pre-clean: tabs → spaces, optionally remove comments
 * 2. Validate: Parse to AST, extract doc.errors for diagnostics
 * 3. Format: Apply mode-specific transformation (beautify, minify, convert)
 * 4. Lint: Run custom style checks on output
 * 5. Return: Formatted YAML + diagnostics for editor display
 */
function yamlFormatter(text, config) {
  const mode = config.mode || 'beautify'
  // CRITICAL: Never allow indent < 2 for YAML (YAML spec requires positive indent)
  const indentSize = Math.max(2, parseInt(config.indentSize) || 2)
  const showLinting = config.showLinting !== false
  const removeComments = config.removeComments === true
  const showValidation = true

  try {
    let result = {}
    let formatted = text
    let processingText = text

    // Auto-convert tabs to spaces (fixes invalid YAML indentation)
    processingText = processingText.replace(/\t/g, ' '.repeat(indentSize))

    // Apply comment removal if toggle is on
    if (removeComments) {
      processingText = yamlRemoveComments(processingText)
    }

    // STEP 1: Always perform validation on input (uses AST for proper error reporting)
    const validationResult = yamlValidate(processingText)
    const isWellFormed = typeof validationResult === 'string'
    result.isWellFormed = isWellFormed
    result.showValidation = showValidation
    result.showLinting = showLinting

    // STEP 2: Process based on mode
    switch (mode) {
      case 'beautify':
        formatted = yamlBeautify(processingText, indentSize)
        break
      case 'minify':
        formatted = yamlMinify(processingText)
        break
      case 'to-json':
        formatted = yamlToJson(processingText)
        break
      case 'to-toml':
        formatted = yamlToToml(processingText)
        break
      case 'to-env':
        formatted = yamlToEnv(processingText)
        break
      case 'flatten':
        formatted = yamlFlatten(processingText)
        break
      case 'detect-unsafe':
        formatted = yamlDetectUnsafe(processingText)
        break
      default:
        formatted = yamlBeautify(processingText, indentSize)
    }

    result.formatted = formatted

    // STEP 3: Build diagnostics array
    // This step ensures all position data is normalized to numbers
    // (not objects), and adds columnEnd for proper underline spans
    const diagnostics = []

    // Add validation errors/results
    if (!isWellFormed && validationResult.errors && Array.isArray(validationResult.errors)) {
      diagnostics.push(...validationResult.errors.map(e => {
        // CRITICAL FIX: Extract actual numbers from potentially nested position objects
        // Parser may return: { line: 9, col: 3 } or just 9
        // We normalize all to simple numbers to prevent "[object Object]" in UI
        let line = e.line
        let column = e.column
        let columnEnd = e.columnEnd

        // Ensure line is always a number
        if (typeof line !== 'number' || isNaN(line)) {
          line = typeof line === 'string' ? parseInt(line, 10) : 1
          if (isNaN(line)) line = 1
        }

        // Ensure column is always a number
        if (typeof column !== 'number' || isNaN(column)) {
          column = typeof column === 'string' ? parseInt(column, 10) : 1
          if (isNaN(column)) column = 1
        }

        // Ensure columnEnd is always a number
        if (typeof columnEnd !== 'number' || isNaN(columnEnd)) {
          columnEnd = column + 1
        }

        // Ensure message is always a non-empty string
        const message = (e.message || 'YAML syntax error').trim() || 'YAML syntax error'

        return {
          type: 'error',
          category: 'syntax',
          message: message,
          line: Math.max(1, Math.floor(line)),         // Ensure line is 1-based
          column: Math.max(1, Math.floor(column)),     // Ensure column is 1-based integer
          columnEnd: Math.max(column + 1, Math.floor(columnEnd)),  // For proper underline span
        }
      }))
    }

    // STEP 4: Perform custom style linting if enabled and YAML is well-formed
    let lintingWarnings = []
    if (showLinting && isWellFormed) {
      lintingWarnings = performStyleLinting(processingText)
      diagnostics.push(...lintingWarnings.map(w => {
        // CRITICAL: Ensure line and column are numbers
        let line = w.line
        let column = w.column

        // Ensure line is always a valid number
        if (typeof line !== 'number' || isNaN(line)) {
          line = typeof line === 'string' ? parseInt(line, 10) : 1
          if (isNaN(line)) line = 1
        }

        // Ensure column is always a valid number
        if (typeof column !== 'number' || isNaN(column)) {
          column = typeof column === 'string' ? parseInt(column, 10) : 1
          if (isNaN(column)) column = 1
        }

        return {
          type: 'warning',
          category: 'lint',
          message: w.message,
          line: Math.max(1, Math.floor(line)),
          column: Math.max(1, Math.floor(column)),
        }
      }))
    }

    result.diagnostics = diagnostics
    result.hideOutput = !isWellFormed
    return result
  } catch (error) {
    console.error('YAML Formatter Error:', error)
    return {
      error: error.message || 'Unknown error',
      hideOutput: true
    }
  }
}

function yamlBeautify(text, indentSize) {
  try {
    // Check if input is flattened YAML (key.path = value format)
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // For flattened YAML, just clean up whitespace and align values
      return beautifyFlattenedYaml(text)
    }

    // For traditional YAML: parse to AST, then stringify with proper options
    // This preserves structure, comments, anchors, and formats correctly
    if (!yamlModule) {
      return { error: 'YAML parsing package not available' }
    }

    // Use parseDocument to get AST (not just parse for data)
    const parseDoc = yamlModule.parseDocument || yamlModule.parse

    // Try using parseDocument if available (from 'yaml' library)
    let output = ''
    if (yamlModule.parseDocument) {
      const doc = yamlModule.parseDocument(text, {
        keepCstNodes: true,
        keepNodeTypes: true
      })

      // Stringify with beautification options
      output = doc.toString({
        indent: indentSize,           // 2 or 4 spaces
        lineWidth: 0,                 // Disable line wrapping
        minContentWidth: 0,
        defaultStringType: 'PLAIN'
      })
    } else {
      // Fallback for js-yaml: line-based approach (not ideal, but works)
      const lines = text.split('\n')
      const formatted = lines.map(line => {
        const spaces = line.match(/^ */)[0].length
        const content = line.trim()
        if (!content) return ''
        const newIndent = Math.round(spaces / 2) * indentSize
        return ' '.repeat(newIndent) + content
      })
      output = formatted.join('\n')
    }

    return output
  } catch (error) {
    return { error: error.message }
  }
}

function beautifyFlattenedYaml(text) {
  const lines = text.split('\n').filter(l => l.trim())

  // Just clean up whitespace without changing spacing
  return lines
    .map(line => {
      const [key, value] = line.split('=')
      if (!key || !value) return ''
      // Trim both sides and rejoin with consistent spacing
      return `${key.trim()} = ${value.trim()}`
    })
    .filter(l => l.length > 0)
    .join('\n')
}

/**
 * Minify YAML: Compact but readable format
 *
 * Important: YAML minification ≠ compression to single line.
 * Instead, it means:
 * • Remove comments
 * • Remove blank lines
 * • Normalize spacing (key: value, - item)
 * • Trim trailing whitespace
 * • Keep indent = 2 (minimum valid)
 *
 * YAML cannot be serialized with indent: 0 (invalid per YAML spec).
 * This is fundamentally different from JSON minification.
 */
function yamlMinify(text) {
  try {
    // Check if input is flattened YAML
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // For flattened YAML, just remove extra spaces
      const lines = text.split('\n')
      return lines
        .map(line => {
          if (/=/.test(line)) {
            const [key, value] = line.split('=')
            return `${key.trim()}=${value.trim()}`
          }
          return line.trim()
        })
        .filter(line => line.length > 0)
        .join('\n')
    }

    // For traditional YAML: use AST-based minification
    if (!yamlModule) {
      return { error: 'YAML parsing package not available' }
    }

    if (yamlModule.parseDocument) {
      // Use yaml library's parseDocument for proper AST-based minify
      const doc = yamlModule.parseDocument(text, {
        keepCstNodes: false,
        keepNodeTypes: false
      })

      // Stringify with minification options
      // ⚠️ IMPORTANT: indent MUST be > 0. Never use indent: 0 for YAML.
      const output = doc.toString({
        indent: 2,                    // Minimum valid indent (YAML spec)
        lineWidth: 0,                 // Disable line wrapping
        minContentWidth: 0,
        flowCollectionPadding: false,
        defaultStringType: 'PLAIN'
      })

      // Post-process: Remove comments and blank lines
      // This gives us the "minified" appearance while keeping structure valid
      return output
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          // Skip blank lines and comment-only lines
          return trimmed.length > 0 && !trimmed.startsWith('#')
        })
        .join('\n')
    } else {
      // Fallback for js-yaml: reconstruct with minimal whitespace
      // Parse to data, then stringify back with indent: 2
      const parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
      const output = yamlModule.stringify
        ? yamlModule.stringify(parsed, { indent: 2 })
        : yamlModule.dump(parsed, { indent: 2 })

      // Remove blank lines and comments
      return output
        .split('\n')
        .filter(line => {
          const trimmed = line.trim()
          return trimmed.length > 0 && !trimmed.startsWith('#')
        })
        .join('\n')
    }
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Compute absolute character offsets for each line start
 *
 * CodeMirror uses flat document offsets internally.
 * We need this to convert parser's absolute offsets to line/column.
 *
 * Example with newlines at positions 20 and 45:
 *   lineOffsets = [0, 21, 46, ...]
 *   lineOffsets[0] = 0 (line 1 starts at offset 0)
 *   lineOffsets[1] = 21 (line 2 starts at offset 21, right after \n at 20)
 */
function computeLineOffsets(text) {
  const offsets = [0]
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      offsets.push(i + 1)
    }
  }
  return offsets
}

/**
 * Convert absolute character offset to line/column coordinates
 *
 * @param {number} offset - Absolute character offset (0-based, from start of document)
 * @param {Array<number>} lineOffsets - Line start offsets (from computeLineOffsets)
 * @returns {{line: number, column: number}} 1-based line/column
 */
function offsetToLineCol(offset, lineOffsets) {
  let line = 0
  while (line + 1 < lineOffsets.length && lineOffsets[line + 1] <= offset) {
    line++
  }
  return {
    line: line + 1,                           // Convert to 1-based
    column: offset - lineOffsets[line] + 1   // Offset within line + 1 for 1-based
  }
}

/**
 * Normalize YAML parser error positions using absolute offsets
 *
 * The yaml.parseDocument() library provides:
 * • pos: [startOffset, endOffset] - absolute character positions
 * • linePos: { line, col } - line/column (sometimes incorrect for complex errors)
 *
 * We PREFER pos because it's derived from the actual parser token positions.
 * linePos is a fallback only.
 *
 * Return: { line, column, columnEnd, message }
 * - line: 1-based line number
 * - column: 1-based start column
 * - columnEnd: 1-based end column (for proper underline span)
 */
function normalizeYamlErrorPosition(err, sourceText, lineOffsets) {
  // If we don't have lineOffsets, build them now
  if (!lineOffsets) {
    lineOffsets = computeLineOffsets(sourceText)
  }

  let result = {
    line: 1,
    column: 1,
    columnEnd: 2,
    message: err.message || 'YAML syntax error'
  }

  // PREFERRED: Use pos if available (absolute character offsets)
  // This is the most accurate way to locate errors
  if (Array.isArray(err.pos) && err.pos.length >= 2) {
    const startPos = err.pos[0]
    const endPos = err.pos[1]

    const start = offsetToLineCol(startPos, lineOffsets)
    const end = offsetToLineCol(endPos, lineOffsets)

    result.line = start.line
    result.column = start.column

    // If error spans multiple lines, just highlight to end of start line
    // Otherwise, highlight to end position
    if (end.line > start.line) {
      // Multi-line error: highlight from start col to end of that line
      const lineText = sourceText.split('\n')[start.line - 1] || ''
      result.columnEnd = lineText.length + 1
    } else {
      // Same line: highlight to end position
      result.columnEnd = end.column
    }
  }
  // FALLBACK: Use linePos if pos is not available
  else if (err.linePos && typeof err.linePos === 'object') {
    result.line = err.linePos.line || 1
    result.column = err.linePos.col || 1
    result.columnEnd = (err.linePos.col || 1) + 1
  }
  // LAST RESORT: Parse from message (for js-yaml compatibility)
  else {
    const lineMatch = err.message?.match(/line (\d+)/i)
    const colMatch = err.message?.match(/column (\d+)/i)

    if (lineMatch) result.line = Math.max(1, parseInt(lineMatch[1], 10))
    if (colMatch) result.column = Math.max(1, parseInt(colMatch[1], 10))
    result.columnEnd = result.column + 1
  }

  // Ensure all values are valid positive integers
  result.line = Math.max(1, Math.floor(result.line || 1))
  result.column = Math.max(1, Math.floor(result.column || 1))
  result.columnEnd = Math.max(result.column + 1, Math.floor(result.columnEnd || result.column + 1))

  return result
}

function yamlValidate(text) {
  try {
    const sourceLines = text.split('\n')
    const lineOffsets = computeLineOffsets(text)

    // First, try to parse with the actual YAML parser
    if (yamlModule) {
      // Use parseDocument if available (from 'yaml' library) - gives us proper error objects
      if (yamlModule.parseDocument) {
        const doc = yamlModule.parseDocument(text, {
          keepCstNodes: true,
          keepNodeTypes: true
        })

        // Check for parse errors in the document
        if (doc.errors && doc.errors.length > 0) {
          const errors = doc.errors.map(err => {
            // Use the new offset-based normalization
            const pos = normalizeYamlErrorPosition(err, text, lineOffsets)

            // Clean up error message for better display in UI
            let message = err.message || 'YAML syntax error'

            // Just keep the first line, remove code snippets
            if (message && message.includes('\n')) {
              message = message.split('\n')[0]
            }

            // Extract the actual problematic text from the source for better error messaging
            // If we have good line/column positions, show what's actually wrong
            if (pos.line > 0 && pos.line <= sourceLines.length) {
              const problemLine = sourceLines[pos.line - 1]
              if (problemLine && pos.column > 0) {
                // Extract the token at the error position
                const lineStart = pos.column - 1
                const problematicText = problemLine.substring(lineStart, pos.columnEnd - 1)

                if (problematicText && problematicText.trim()) {
                  // Check if it looks like a key:value pair without space
                  if (problematicText.match(/\w+:\S/)) {
                    message = `Missing space after ':' in '${problematicText}'`
                  } else if (problematicText.includes(':')) {
                    message = `Syntax error in '${problematicText}': ${message}`
                  }
                }
              }
            }

            // Final fallback - ensure we always have a message
            message = (message || 'YAML syntax error').trim() || 'YAML syntax error'

            return {
              line: pos.line,
              column: pos.column,
              columnEnd: pos.columnEnd,
              message: message,
            }
          })
          return {
            valid: false,
            errors: errors,
          }
        }

        // Document parsed successfully
        return 'Valid YAML syntax'
      } else {
        // Fallback to parse/load method (js-yaml)
        try {
          const parse = yamlModule.parse || yamlModule.load
          parse(text)
          return 'Valid YAML syntax'
        } catch (parseError) {
          // js-yaml doesn't provide pos offsets, so we parse from error message
          let message = parseError.message || 'Invalid YAML syntax'
          let line = null
          let column = null

          const lineMatch = message.match(/line (\d+)/i)
          const colMatch = message.match(/column (\d+)/i) || message.match(/at (\d+)/i)

          if (lineMatch) line = parseInt(lineMatch[1], 10)
          if (colMatch) column = parseInt(colMatch[1], 10)

          // Ensure line and column are valid numbers
          if (!line || isNaN(line)) line = 1
          if (!column || isNaN(column)) column = 1

          // Clean up message: extract just the first line
          let cleanMessage = message.split('\n')[0]

          let columnEnd = column + 1

          // Try to refine the COLUMN position using the source line
          // IMPORTANT: Trust the parser's line number. Only refine column/columnEnd.
          if (line && cleanMessage) {
            const lines = text.split('\n')

            if (lines[line - 1]) {
              const problemLine = lines[line - 1]

              // Look for missing space after colon pattern
              if (problemLine.includes(':') && !problemLine.includes('://')) {
                // Pattern: "key:value" (missing space after colon)
                const badColonMatch = problemLine.match(/(\w+):(\S+)/)
                if (badColonMatch) {
                  const matchStart = badColonMatch.index
                  const matchText = badColonMatch[0]

                  // Column is 1-based
                  column = matchStart + 1
                  columnEnd = matchStart + matchText.length + 1

                  // Improve message with the actual problematic text
                  cleanMessage = `Missing space after ':' in '${matchText}'`
                } else {
                  // Fallback: highlight just the first key on this line
                  const keyMatch = problemLine.match(/^(\s*)(\w+):/)
                  if (keyMatch) {
                    const indent = keyMatch[1].length
                    const key = keyMatch[2]
                    column = indent + 1
                    columnEnd = indent + key.length + 2
                  }
                }
              }
            }
          }

          // Ensure all position values are proper integers
          let finalLine = Math.max(1, Math.floor(line))
          let finalColumn = Math.max(1, Math.floor(column))
          let finalColumnEnd = Math.max(finalColumn + 1, Math.floor(columnEnd))

          // Additional safety: ensure they're valid numbers
          if (isNaN(finalLine)) finalLine = 1
          if (isNaN(finalColumn)) finalColumn = 1
          if (isNaN(finalColumnEnd)) finalColumnEnd = finalColumn + 1

          // Ensure message is never empty
          const finalMessage = (cleanMessage.trim() || 'YAML syntax error') || 'YAML syntax error'

          return {
            valid: false,
            errors: [{
              line: finalLine,
              column: finalColumn,
              columnEnd: finalColumnEnd,
              message: finalMessage,
            }],
          }
        }
      }
    }

    // Fallback to custom validation if YAML parser not available
    const lines = text.split('\n')
    const errors = []

    // Check if input is flattened YAML (key.path = value format)
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // Validate flattened YAML format
      lines.forEach((line, lineNum) => {
        if (line.trim().length === 0) return

        const content = line.trim()

        // Must have equals sign
        if (!content.includes('=')) {
          errors.push({
            line: lineNum + 1,
            message: 'Flattened YAML must have format: key.path = value',
            column: 1,
          })
          return
        }

        const [key, value] = content.split('=')
        if (!key || !key.trim()) {
          errors.push({
            line: lineNum + 1,
            message: 'Key cannot be empty',
            column: 1,
          })
        }

        if (!value || !value.trim()) {
          errors.push({
            line: lineNum + 1,
            message: 'Value cannot be empty',
            column: key.length + 2,
          })
        }

        // Validate key format (alphanumeric, dots, underscores)
        if (!/^[a-z_][a-z0-9_.]*$/i.test(key.trim())) {
          errors.push({
            line: lineNum + 1,
            message: 'Invalid key format. Keys must start with letter or underscore, contain only alphanumerics, dots, and underscores',
            column: 1,
          })
        }
      })

      if (errors.length === 0) {
        return 'Valid flattened YAML syntax'
      } else {
        return {
          valid: false,
          errors: errors,
          summary: `Found ${errors.length} error(s)`,
        }
      }
    }

    // Validate traditional YAML format using custom rules
    let expectedIndent = 0

    lines.forEach((line, lineNum) => {
      if (line.trim().length === 0) return

      const leadingSpaces = line.match(/^ */)[0].length
      const content = line.trim()

      if (content.startsWith('-')) {
        if (leadingSpaces % 2 !== 0) {
          errors.push({
            line: lineNum + 1,
            message: 'List items should be indented by an even number of spaces',
            column: leadingSpaces + 1,
          })
        }
      }

      if (content.includes(':')) {
        const colonPos = content.indexOf(':')
        if (colonPos === 0) {
          errors.push({
            line: lineNum + 1,
            message: 'Key cannot start with colon',
            column: 1,
          })
        }
        if (content[colonPos + 1] && content[colonPos + 1] !== ' ' && content[colonPos + 1] !== '\n') {
          errors.push({
            line: lineNum + 1,
            message: 'Space required after colon in key-value pairs',
            column: colonPos + 2,
          })
        }
      }

      const indentDiff = Math.abs(leadingSpaces - expectedIndent)
      if (indentDiff > 0 && indentDiff !== 2 && indentDiff !== 4) {
        expectedIndent = leadingSpaces
      } else {
        expectedIndent = leadingSpaces
      }
    })

    if (errors.length === 0) {
      return 'Valid YAML syntax'
    } else {
      return {
        valid: false,
        errors: errors,
        summary: `Found ${errors.length} error(s)`,
      }
    }
  } catch (error) {
    return { error: error.message }
  }
}

function yamlToJson(text) {
  try {
    let parsed = null

    // Check if input is flattened YAML (key.path = value format)
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // Parse flattened YAML format
      parsed = parseFlattenedYaml(text)
    } else {
      // Parse traditional YAML format
      if (!yamlModule) {
        return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
      }

      // Use parseDocument if available (better AST handling)
      if (yamlModule.parseDocument) {
        const doc = yamlModule.parseDocument(text)
        parsed = doc.toJSON()
      } else {
        // Fallback to parse/load
        parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
      }
    }

    return JSON.stringify(parsed, null, 2)
  } catch (error) {
    return { error: `Failed to convert YAML to JSON: ${error.message}` }
  }
}

function yamlToToml(text) {
  try {
    if (!tomlModule) {
      return { error: '@iarna/toml package not available. Please install @iarna/toml.' }
    }

    let parsed = null

    // Check if input is flattened YAML (key.path = value format)
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // Parse flattened YAML format
      parsed = parseFlattenedYaml(text)
    } else {
      // Parse traditional YAML format using AST approach
      if (!yamlModule) {
        return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
      }

      if (yamlModule.parseDocument) {
        const doc = yamlModule.parseDocument(text)
        parsed = doc.toJSON()
      } else {
        parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
      }
    }

    let tomlOutput = tomlModule.stringify(parsed)

    // Clean up formatting for better readability
    // Replace numeric separators (8_080 -> 8080) for small numbers
    tomlOutput = tomlOutput.replace(/(\d{1,3})_(\d{3})(?!\d)/g, '$1$2')

    // Compact array formatting: [ "a", "b" ] -> ["a", "b"]
    tomlOutput = tomlOutput.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']')

    return tomlOutput
  } catch (error) {
    return { error: `Failed to convert YAML to TOML: ${error.message}` }
  }
}

function parseFlattenedYaml(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const obj = {}

  lines.forEach(line => {
    const [path, value] = line.split('=').map(s => s.trim())
    if (!path || !value) return

    const keys = path.split('.')
    let current = obj

    keys.slice(0, -1).forEach(key => {
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    })

    const lastKey = keys[keys.length - 1]
    try {
      current[lastKey] = JSON.parse(value)
    } catch {
      current[lastKey] = value.replace(/^"|"$/g, '')
    }
  })

  return obj
}

function yamlToEnv(text) {
  try {
    let parsed = null

    // Check if input is flattened YAML (key.path = value format)
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // Parse flattened YAML format
      parsed = parseFlattenedYaml(text)
    } else {
      // Parse traditional YAML format using AST approach
      if (!yamlModule) {
        return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
      }

      if (yamlModule.parseDocument) {
        const doc = yamlModule.parseDocument(text)
        parsed = doc.toJSON()
      } else {
        parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
      }
    }

    const envVars = yamlToEnvHelper(parsed)
    return envVars.join('\n')
  } catch (error) {
    return { error: `Failed to convert YAML to ENV: ${error.message}` }
  }
}

function yamlToEnvHelper(obj) {
  const envVars = []

  function flattenObj(obj, prefix = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const envKey = prefix ? `${prefix}_${key.toUpperCase()}` : key.toUpperCase()

      if (value === null || value === undefined) {
        envVars.push(`${envKey}=`)
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        flattenObj(value, envKey)
      } else if (Array.isArray(value)) {
        envVars.push(`${envKey}=${JSON.stringify(value)}`)
      } else {
        const strValue = String(value)
        const needsQuotes = strValue.includes(' ') || strValue.includes('\n')
        envVars.push(`${envKey}=${needsQuotes ? `"${strValue}"` : strValue}`)
      }
    })
  }

  flattenObj(obj)
  return envVars
}

function yamlFlatten(text) {
  try {
    // Check if input is already flattened YAML (key.path = value format)
    const isFlattenedYaml = /^[a-z_][a-z0-9_.]*\s*=/im.test(text)

    if (isFlattenedYaml) {
      // Already flattened - just return it formatted nicely
      return text
        .split('\n')
        .filter(l => l.trim())
        .join('\n')
    }

    // Parse traditional YAML format using AST approach
    if (!yamlModule) {
      return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
    }

    let parsed = null
    if (yamlModule.parseDocument) {
      const doc = yamlModule.parseDocument(text)
      parsed = doc.toJSON()
    } else {
      parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
    }

    return yamlFlattenHelper(parsed)
  } catch (error) {
    return { error: `Failed to flatten YAML: ${error.message}` }
  }
}

function yamlFlattenHelper(obj) {
  const flattened = []

  function flatten(obj, prefix = '') {
    Object.entries(obj).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key

      if (value === null || value === undefined) {
        flattened.push(`${path} = null`)
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        flatten(value, path)
      } else if (Array.isArray(value)) {
        flattened.push(`${path} = [${value.map(v => JSON.stringify(v)).join(', ')}]`)
      } else {
        flattened.push(`${path} = ${JSON.stringify(value)}`)
      }
    })
  }

  flatten(obj)
  return flattened.join('\n')
}

function yamlUnflatten(text) {
  try {
    const lines = text.split('\n').filter(l => l.trim())
    const obj = {}

    lines.forEach(line => {
      const [path, value] = line.split('=').map(s => s.trim())
      if (!path || !value) return

      const keys = path.split('.')
      let current = obj

      keys.slice(0, -1).forEach(key => {
        if (!current[key]) {
          current[key] = {}
        }
        current = current[key]
      })

      const lastKey = keys[keys.length - 1]
      try {
        current[lastKey] = JSON.parse(value)
      } catch {
        current[lastKey] = value.replace(/^"|"$/g, '')
      }
    })

    if (yamlModule) {
      let output = ''
      // Use stringify/dump with proper formatting
      if (yamlModule.stringify) {
        output = yamlModule.stringify(obj, {
          indent: 2,
          lineWidth: 0
        })
      } else if (yamlModule.dump) {
        output = yamlModule.dump(obj)
      }
      return output
    }
    return { error: 'YAML package not available. Please install yaml or js-yaml.' }
  } catch (error) {
    return { error: `Failed to unflatten YAML: ${error.message}` }
  }
}

function yamlRemoveComments(text) {
  try {
    const lines = text.split('\n')
    return lines
      .map(line => {
        const commentIndex = line.indexOf('#')
        if (commentIndex === -1) return line

        const beforeComment = line.substring(0, commentIndex)
        if (beforeComment.trim().length === 0) return ''

        return beforeComment.trimEnd()
      })
      .join('\n')
      .trim()
  } catch (error) {
    return { error: error.message }
  }
}

function yamlConvertTabs(text, indentSize) {
  try {
    const tabSpaces = ' '.repeat(indentSize)
    return text.replace(/\t/g, tabSpaces)
  } catch (error) {
    return { error: error.message }
  }
}

function yamlDetectUnsafe(text) {
  try {
    const unsafePatterns = [
      { pattern: /!!js\/function/, name: 'JavaScript function' },
      { pattern: /!!js\/regexp/, name: 'JavaScript regexp' },
      { pattern: /!!python\/object/, name: 'Python object' },
      { pattern: /!!python\/tuple/, name: 'Python tuple' },
      { pattern: /!!python\/unicode/, name: 'Python unicode' },
      { pattern: /!!map/, name: 'Explicit map tag' },
      { pattern: /!![a-zA-Z]+\/[a-zA-Z]+/, name: 'Custom object tag' },
    ]

    const findings = []
    const lines = text.split('\n')

    lines.forEach((line, lineNum) => {
      unsafePatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          findings.push({
            line: lineNum + 1,
            message: `Unsafe keyword detected: ${name}`,
            content: line.trim(),
          })
        }
      })
    })

    if (findings.length === 0) {
      return 'No unsafe YAML keywords detected'
    } else {
      return {
        safe: false,
        findings: findings,
        summary: `Found ${findings.length} unsafe keyword(s)`,
      }
    }
  } catch (error) {
    return { error: error.message }
  }
}

module.exports = {
  yamlFormatter,
}
