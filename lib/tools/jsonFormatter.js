// lib/tools/jsonFormatter.js

let yamlModule = null
let json2csvModule = null
let xmlbuilder2Module = null
let jsonpathPlusModule = null

try {
  yamlModule = require('yaml')
} catch (e) {
  try {
    yamlModule = require('js-yaml')
  } catch (fallbackError) {
    // YAML module not available
  }
}

try {
  json2csvModule = require('json2csv')
} catch (e) { }

try {
  xmlbuilder2Module = require('xmlbuilder2')
} catch (e) { }

try {
  jsonpathPlusModule = require('jsonpath-plus')
} catch (e) { }

/* ===========================================
   JSON VALIDATION
   =========================================== */

function validateJSON(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Empty input',
      message: 'Please provide JSON content to validate',
    }
  }

  try {
    JSON.parse(trimmed)
    return {
      isValid: true,
      message: 'Valid JSON',
      size: trimmed.length,
      lines: trimmed.split('\n').length,
    }
  } catch (error) {
    const match = error.message.match(/position (\d+)/)
    const position = match ? parseInt(match[1]) : null
    return {
      isValid: false,
      error: error.message,
      position,
      snippet: position ? trimmed.substring(Math.max(0, position - 20), position + 20) : null,
    }
  }
}

/* ===========================================
   JSON KEY SORTING
   =========================================== */

function sortKeysRecursive(obj) {
  if (Array.isArray(obj)) {
    return obj.map(sortKeysRecursive)
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sortKeysRecursive(obj[key])
        return acc
      }, {})
  }
  return obj
}

function sortJSONKeys(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)
    const sorted = sortKeysRecursive(parsed)
    const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
    return JSON.stringify(sorted, null, spaces)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   JSON FLATTENING
   =========================================== */

function flattenRecursive(obj, prefix = '') {
  const flattened = {}

  function flatten(current, prop) {
    if (current === null || current === undefined) {
      flattened[prop] = current
    } else if (Array.isArray(current)) {
      if (current.length === 0) {
        flattened[prop] = []
      } else {
        current.forEach((item, index) => {
          flatten(item, `${prop}[${index}]`)
        })
      }
    } else if (typeof current === 'object') {
      let isEmpty = true
      for (const key in current) {
        isEmpty = false
        const newKey = prop ? `${prop}.${key}` : key
        flatten(current[key], newKey)
      }
      if (isEmpty) {
        flattened[prop] = {}
      }
    } else {
      flattened[prop] = current
    }
  }

  flatten(obj, prefix)
  return flattened
}

function flattenJSON(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)
    const flattened = flattenRecursive(parsed)
    const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
    return JSON.stringify(flattened, null, spaces)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   JSON UNFLATTENING
   =========================================== */

function unflattenRecursive(obj) {
  const result = {}

  for (const key in obj) {
    const keys = key.split(/[\.\[\]]/).filter(Boolean)
    let current = result

    keys.forEach((k, index) => {
      if (index === keys.length - 1) {
        current[k] = obj[key]
      } else {
        if (!current[k] || typeof current[k] !== 'object') {
          current[k] = isNaN(keys[index + 1]) ? {} : []
        }
        current = current[k]
      }
    })
  }

  return result
}

function unflattenJSON(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)
    const unflattened = unflattenRecursive(parsed)
    const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
    return JSON.stringify(unflattened, null, spaces)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   REMOVE NULL VALUES
   =========================================== */

function removeNullRecursive(obj, options) {
  if (Array.isArray(obj)) {
    let filtered = obj
      .map(item => removeNullRecursive(item, options))
      .filter(item => {
        if (item === null && options.removeNull) return false
        // removeEmptyArrays also removes empty objects
        if (Array.isArray(item) && item.length === 0 && options.removeEmptyArrays) return false
        if (typeof item === 'object' && item !== null && !Array.isArray(item) && Object.keys(item).length === 0 && options.removeEmptyArrays) return false
        if (typeof item === 'string' && item === '' && options.removeEmptyStrings) return false
        return true
      })
    return filtered
  }

  if (obj !== null && typeof obj === 'object') {
    const result = {}
    for (const key in obj) {
      const value = removeNullRecursive(obj[key], options)
      if (value === null && options.removeNull) continue
      // removeEmptyArrays also removes empty objects
      if (Array.isArray(value) && value.length === 0 && options.removeEmptyArrays) continue
      if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0 && options.removeEmptyArrays) continue
      if (typeof value === 'string' && value === '' && options.removeEmptyStrings) continue
      result[key] = value
    }
    return result
  }

  return obj
}

function removeNullValues(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)
    const cleaned = removeNullRecursive(parsed, {
      removeNull: true,
      removeEmptyArrays: config.removeEmptyArrays,
      removeEmptyStrings: config.removeEmptyStrings,
    })
    const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
    return JSON.stringify(cleaned, null, spaces)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   JSON TO YAML
   =========================================== */

function jsonToYAML(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)

    if (!yamlModule) {
      return 'Error: YAML package not available. Please ensure yaml or js-yaml is installed.'
    }

    // Handle both 'yaml' package (stringify) and 'js-yaml' package (dump)
    if (typeof yamlModule.stringify === 'function') {
      return yamlModule.stringify(parsed)
    } else if (typeof yamlModule.dump === 'function') {
      return yamlModule.dump(parsed)
    } else {
      return 'Error: YAML module has no stringify or dump method'
    }
  } catch (error) {
    return `Error: ${error.message}`
  }
}

/* ===========================================
   JSON COMPRESSION
   =========================================== */

function compressJSON(text) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)
    const minified = JSON.stringify(parsed)
    const compressed = Buffer.from(minified).toString('base64')
    return {
      _compressMode: true,
      success: true,
      original: minified,
      originalSize: minified.length,
      compressed,
      compressedSize: compressed.length,
      ratio: ((1 - compressed.length / minified.length) * 100).toFixed(2),
    }
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   JSON DECOMPRESSION
   =========================================== */

function decompressJSON(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  // Validate Base64 format
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  if (!base64Regex.test(trimmed)) {
    return 'Error: Invalid Base64 format - contains invalid characters'
  }

  // Base64 length must be divisible by 4
  if (trimmed.length % 4 !== 0) {
    return 'Error: Invalid Base64 format - length must be divisible by 4'
  }

  try {
    const buffer = Buffer.from(trimmed, 'base64')

    // Check if decoded data is valid UTF-8
    try {
      const decompressed = buffer.toString('utf-8')

      // Verify the string doesn't contain replacement characters indicating failed decoding
      if (decompressed.includes('\ufffd')) {
        return 'Error: Decoded data is not valid UTF-8 - the Base64 might be corrupted or not represent UTF-8 JSON'
      }

      const parsed = JSON.parse(decompressed)
      const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
      return JSON.stringify(parsed, null, spaces)
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        return `Error: Decoded Base64 is not valid JSON - ${parseError.message}`
      }
      throw parseError
    }
  } catch (error) {
    return `Error: Invalid Base64 or JSON - ${error.message}`
  }
}

/* ===========================================
   JSON TO CSV
   =========================================== */

function jsonToCSV(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)

    if (!json2csvModule) {
      return 'Error: json2csv package not available.'
    }

    const { Parser } = json2csvModule
    const parser = new Parser()
    const csv = parser.parse(parsed)
    return csv
  } catch (error) {
    return `Error: ${error.message}`
  }
}

/* ===========================================
   JSON TO XML
   =========================================== */

function jsonToXML(text, config) {
  const trimmed = text.trim()
  if (!trimmed) return ''

  try {
    const parsed = JSON.parse(trimmed)

    if (!xmlbuilder2Module) {
      return 'Error: xmlbuilder2 package not available.'
    }

    const { create } = xmlbuilder2Module
    const root = create({ version: '1.0' })

    const convertToXML = (obj, parent) => {
      if (obj === null || obj === undefined) {
        return
      }

      if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => {
            const itemElement = parent.ele('item')
            convertToXML(item, itemElement)
          })
        } else {
          Object.entries(obj).forEach(([key, value]) => {
            const element = parent.ele(key)
            convertToXML(value, element)
          })
        }
      } else {
        parent.txt(String(obj))
      }
    }

    const rootElement = root.ele('root')
    convertToXML(parsed, rootElement)

    const xml = root.end({ prettyPrint: true })
    return xml
  } catch (error) {
    return `Error: ${error.message}`
  }
}

/* ===========================================
   JSON MINIFICATION
   =========================================== */

function jsonMinifier(text) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const parsed = JSON.parse(text)
    return JSON.stringify(parsed)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   JSON BEAUTIFICATION
   =========================================== */

function jsonBeautifier(text, config) {
  const trimmed = text.trim()
  if (!trimmed) {
    return ''
  }

  try {
    let parsed = JSON.parse(text)

    // Apply removal options if enabled (even in beautify mode)
    if (config.removeEmptyArrays || config.removeEmptyStrings) {
      parsed = removeNullRecursive(parsed, {
        removeNull: false,
        removeEmptyArrays: config.removeEmptyArrays,
        removeEmptyStrings: config.removeEmptyStrings,
      })
    }

    const spaces = config.indentSize === 'tab' ? '\t' : parseInt(config.indentSize) || 2
    return JSON.stringify(parsed, null, spaces)
  } catch (error) {
    return `Error: Invalid JSON format - ${error.message}`
  }
}

/* ===========================================
   JSON PATH EXTRACTION
   =========================================== */

function extractJsonPath(text, config) {
  try {
    const obj = JSON.parse(text)
    const pathExpression = config.jsonPath || ''

    if (!pathExpression) {
      return { error: 'Please provide a JSON path expression' }
    }

    if (jsonpathPlusModule) {
      const { JSONPath } = jsonpathPlusModule
      const results = JSONPath({ path: pathExpression, json: obj })

      if (results.length === 0) {
        return {
          path: pathExpression,
          value: null,
          message: 'No results found for the given path'
        }
      } else if (results.length === 1) {
        return {
          path: pathExpression,
          value: results[0]
        }
      } else {
        return {
          path: pathExpression,
          value: results,
          message: `Found ${results.length} matches`
        }
      }
    } else {
      // Fallback to simple dot notation if jsonpath-plus is not available
      const keys = pathExpression.split('.')
      let value = obj
      keys.forEach(k => {
        if (k) value = value[k]
      })
      return { path: pathExpression, value }
    }
  } catch (e) {
    return { error: 'Invalid JSON or path: ' + e.message }
  }
}

/* ===========================================
   MAIN JSON FORMATTER FUNCTION
   =========================================== */

function jsonFormatter(text, config = {}) {
  const trimmed = text.trim()

  if (!trimmed) {
    return {
      error: 'Empty JSON input',
      hideOutput: true
    }
  }

  // For decompress mode, skip JSON validation (input is Base64, not JSON)
  if (config.mode === 'decompress') {
    const formatted = decompressJSON(trimmed, config)
    return {
      formatted,
      isWellFormed: true,
      hideOutput: false,
      diagnostics: [],
      showValidation: config.showValidation !== false
    }
  }

  // For all other modes, validate the JSON
  const validation = validateJSON(trimmed)
  const isWellFormed = validation.isValid

  // Build diagnostics array
  const diagnostics = []

  if (!isWellFormed) {
    diagnostics.push({
      type: 'error',
      category: 'syntax',
      message: validation.error,
      position: validation.position,
    })
  }

  let formatted = trimmed

  // Only process if valid JSON
  if (isWellFormed) {
    try {
      switch (config.mode) {
        case 'minify':
          formatted = jsonMinifier(trimmed)
          break
        case 'beautify':
          formatted = jsonBeautifier(trimmed, config)
          break
        case 'sort-keys':
          formatted = sortJSONKeys(trimmed, config)
          break
        case 'flatten':
          formatted = flattenJSON(trimmed, config)
          break
        case 'unflatten':
          formatted = unflattenJSON(trimmed, config)
          break
        case 'remove-nulls':
          formatted = removeNullValues(trimmed, config)
          break
        case 'to-yaml':
          formatted = jsonToYAML(trimmed, config)
          break
        case 'to-csv':
          formatted = jsonToCSV(trimmed, config)
          break
        case 'to-xml':
          formatted = jsonToXML(trimmed, config)
          break
        case 'compress':
          formatted = compressJSON(trimmed)
          break
        case 'extract-path':
          formatted = extractJsonPath(trimmed, config)
          break
        default:
          formatted = jsonBeautifier(trimmed, config)
      }
    } catch (error) {
      return {
        error: error.message,
        hideOutput: true
      }
    }
  }

  const result = {
    formatted,
    isWellFormed,
    hideOutput: !isWellFormed,
    diagnostics,
    showValidation: config.showValidation !== false
  }

  return result
}

module.exports = { jsonFormatter }
