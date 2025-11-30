// lib/tools/yamlFormatter.js

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

function yamlFormatter(text, config) {
  const mode = config.mode || 'beautify'
  const indentSize = parseInt(config.indentSize) || 2
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

    // STEP 1: Always perform validation on input
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
    const diagnostics = []

    // Add validation errors/results
    if (!isWellFormed && validationResult.errors) {
      diagnostics.push(...validationResult.errors.map(e => ({
        type: 'error',
        category: 'syntax',
        message: e.message,
        line: e.line,
        column: e.column,
      })))
    }

    // STEP 4: Perform custom style linting if enabled and YAML is well-formed
    let lintingWarnings = []
    if (showLinting && isWellFormed) {
      lintingWarnings = performStyleLinting(processingText)
      diagnostics.push(...lintingWarnings.map(w => ({
        type: 'warning',
        category: 'lint',
        message: w.message,
        line: w.line,
        column: w.column,
      })))
    }

    result.diagnostics = diagnostics
    result.hideOutput = !isWellFormed
    return result
  } catch (error) {
    return { error: error.message, hideOutput: true }
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

    // For traditional YAML, use indentation-based formatting
    const lines = text.split('\n')
    const formatted = lines.map(line => {
      const spaces = line.match(/^ */)[0].length
      const content = line.trim()

      if (!content) return ''

      const newIndent = Math.round(spaces / 2) * indentSize
      return ' '.repeat(newIndent) + content
    })

    return formatted.join('\n')
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

function yamlMinify(text) {
  try {
    const lines = text.split('\n')
    return lines
      .map(line => {
        // For flattened YAML, preserve the = but remove extra spaces
        if (/=/.test(line)) {
          const [key, value] = line.split('=')
          return `${key.trim()}=${value.trim()}`
        }
        return line.trim()
      })
      .filter(line => line.length > 0 && !line.startsWith('#'))
      .join('\n')
  } catch (error) {
    return { error: error.message }
  }
}

function yamlValidate(text) {
  try {
    // First, try to parse with the actual YAML parser
    if (yamlModule) {
      try {
        const parse = yamlModule.parse || yamlModule.load
        parse(text)
        // If parsing succeeds, YAML is valid
        return 'Valid YAML syntax'
      } catch (parseError) {
        // Parsing failed - extract error details
        let message = parseError.message || 'Invalid YAML syntax'
        let line = null
        let column = null

        // Extract line and column from error message
        const lineMatch = message.match(/line (\d+)/i)
        const colMatch = message.match(/column (\d+)/i) || message.match(/at (\d+)/i)

        if (lineMatch) line = parseInt(lineMatch[1], 10)
        if (colMatch) column = parseInt(colMatch[1], 10)

        // Clean up the error message - extract just the main error description
        let cleanMessage = message

        // Remove everything after the code snippet (the part with ^^^^^^)
        cleanMessage = cleanMessage.split('\n')[0]

        // Remove the "at line X, column Y:" part and just keep the core message
        cleanMessage = cleanMessage.replace(/\sat line \d+,\s*column \d+\s*:/i, '')

        // Try to provide more specific error hints
        if (line && cleanMessage) {
          const lines = text.split('\n')
          if (lines[line - 1]) {
            const problemLine = lines[line - 1]

            // Check for missing space after colon (e.g., "host:localhost" instead of "host: localhost")
            if (/:\S/.test(problemLine) && !problemLine.includes('://')) {
              const match = problemLine.match(/(\w+):(\S+)/)
              if (match) {
                cleanMessage = `Missing space after colon. "${match[0]}" should be "${match[1]}: ${match[2]}"`
              }
            }
          }
        }

        return {
          valid: false,
          errors: [{
            line: line || 1,
            column: column || 1,
            message: cleanMessage.trim(),
          }],
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
      parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
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
      // Parse traditional YAML format
      if (!yamlModule) {
        return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
      }
      parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
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
      // Parse traditional YAML format
      if (!yamlModule) {
        return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
      }
      parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
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

    // Parse traditional YAML format
    if (!yamlModule) {
      return { error: 'YAML parsing package not available. Please install yaml or js-yaml.' }
    }
    const parsed = yamlModule.parse ? yamlModule.parse(text) : yamlModule.load(text)
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
      if (yamlModule.stringify) {
        return yamlModule.stringify(obj)
      } else if (yamlModule.dump) {
        return yamlModule.dump(obj)
      }
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
