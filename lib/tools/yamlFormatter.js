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

    // Apply comment removal if toggle is on
    if (removeComments) {
      processingText = yamlRemoveComments(text)
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
      case 'unflatten':
        formatted = yamlUnflatten(processingText)
        break
      case 'convert-tabs':
        formatted = yamlConvertTabs(processingText, indentSize)
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

    // STEP 4: Perform linting if enabled and YAML is well-formed
    let lintingWarnings = []
    if (showLinting && isWellFormed && yamlLintModule) {
      try {
        lintingWarnings = yamlLintModule(processingText) || []
      } catch (lintError) {
        // Linting error - just skip linting
      }
      diagnostics.push(...lintingWarnings.map(w => ({
        type: 'warning',
        category: 'lint',
        message: w.message || w.toString(),
        line: w.line,
        column: w.column,
      })))
    }

    result.diagnostics = diagnostics
    return result
  } catch (error) {
    return { error: error.message }
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

    // Validate traditional YAML format
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

    return tomlModule.stringify(parsed)
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
