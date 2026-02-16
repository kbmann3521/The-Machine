/**
 * Encoder & Decoder - Unified encoding tool with composable transformers
 * Converts between text/bytes with support for multiple encoding transformers
 */

/**
 * Base64 transformer
 */
const base64Transformer = {
  id: 'base64',
  name: 'Base64',
  encode: (data, config = {}) => {
    try {
      const { variant = 'standard' } = config
      let base64 = ''

      // Use Buffer if available (Node.js/API), otherwise fallback
      if (typeof Buffer !== 'undefined') {
        if (typeof data === 'string') {
          base64 = Buffer.from(data, 'utf-8').toString('base64')
        } else if (data instanceof Uint8Array) {
          base64 = Buffer.from(data).toString('base64')
        }
      } else {
        // Browser fallback
        if (typeof data === 'string') {
          base64 = btoa(unescape(encodeURIComponent(data)))
        } else {
          return { error: 'Invalid input type for browser base64 encoding' }
        }
      }

      if (!base64) return { error: 'Encoding failed' }

      // Apply variants
      let result = base64

      if (variant.includes('url-safe')) {
        result = result.replace(/\+/g, '-').replace(/\//g, '_')
      }

      if (variant.includes('no-padding')) {
        result = result.replace(/=+$/, '')
      }

      if (variant.includes('wrapped') || variant.includes('line')) {
        // Default to 76 characters for line wrapping (MIME style)
        result = result.match(/.{1,76}/g)?.join('\n') || result
      }

      return result
    } catch (error) {
      return { error: `Base64 encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      let input = ''
      if (typeof data === 'string') {
        input = data.trim()
      } else if (data instanceof Uint8Array) {
        if (typeof Buffer !== 'undefined') {
          input = Buffer.from(data).toString('utf-8').trim()
        } else {
          input = String.fromCharCode(...data).trim()
        }
      }

      // Pre-process for flexibility (handle URL-safe and missing padding)
      let normalized = input.replace(/\s/g, '') // Remove all whitespace
        .replace(/-/g, '+')
        .replace(/_/g, '/')

      // Fix padding
      while (normalized.length % 4 !== 0) {
        normalized += '='
      }

      if (typeof Buffer !== 'undefined') {
        return Buffer.from(normalized, 'base64').toString('utf-8')
      } else {
        return decodeURIComponent(escape(atob(normalized)))
      }
    } catch (error) {
      return { error: `Base64 decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'variant',
      name: 'Format Variant',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'standard', label: 'Standard Base64' },
        { value: 'url-safe', label: 'URL-Safe Base64' },
        { value: 'no-padding', label: 'No Padding' },
        { value: 'url-safe-no-padding', label: 'URL-Safe No Padding' },
        { value: 'line-wrapped', label: 'Line Wrapped (76 chars)' },
        { value: 'url-safe-wrapped', label: 'URL-Safe Wrapped' },
        { value: 'wrapped-no-padding', label: 'Wrapped No Padding' }
      ]
    },
  ],
}

/**
 * URL encoder transformer
 */
const urlTransformer = {
  id: 'url',
  name: 'URL Encoding',
  encode: (data) => {
    try {
      if (typeof data === 'string') {
        return encodeURIComponent(data)
      } else if (data instanceof Uint8Array) {
        let text = String.fromCharCode(...data)
        return encodeURIComponent(text)
      }
      return { error: 'Invalid input type for URL encoding' }
    } catch (error) {
      return { error: `URL encoding failed: ${error.message}` }
    }
  },
  decode: (data) => {
    try {
      if (typeof data === 'string') {
        return decodeURIComponent(data)
      } else if (data instanceof Uint8Array) {
        let text = String.fromCharCode(...data)
        return decodeURIComponent(text)
      }
      return { error: 'Invalid input type for URL decoding' }
    } catch (error) {
      return { error: `URL decoding failed: ${error.message}` }
    }
  },
  options: [],
}

/**
 * Hex transformer
 */
const hexTransformer = {
  id: 'hex',
  name: 'Hexadecimal',
  encode: (data, config = {}) => {
    try {
      const { grouping = 'none' } = config
      let bytes = []

      if (typeof Buffer !== 'undefined') {
        if (typeof data === 'string') {
          bytes = Array.from(Buffer.from(data, 'utf-8'))
        } else if (data instanceof Uint8Array) {
          bytes = Array.from(data)
        }
      } else {
        if (typeof data === 'string') {
          const encoder = new TextEncoder()
          bytes = Array.from(encoder.encode(data))
        } else {
          bytes = Array.from(data)
        }
      }

      const hex = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase())

      if (grouping === 'none') {
        return hex.join('')
      }

      if (grouping === '0x-prefix') {
        return hex.map(h => '0x' + h).join(' ')
      }

      if (grouping === 'c-format') {
        return '{ ' + hex.map(h => '0x' + h).join(', ') + ' }'
      }

      // Grouping by bytes
      const byteCount = parseInt(grouping)
      const groups = []
      for (let i = 0; i < hex.length; i += byteCount) {
        groups.push(hex.slice(i, i + byteCount).join(''))
      }
      return groups.join(' ')
    } catch (error) {
      return { error: `Hex encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      let input = ''
      if (typeof data === 'string') {
        input = data.trim()
      } else if (data instanceof Uint8Array) {
        input = String.fromCharCode(...data).trim()
      }

      // Clean up common hex formats (0x prefixes, commas, braces, spaces)
      let hexString = input
        .replace(/0x/gi, '')
        .replace(/[,{}]/g, '')
        .replace(/\s+/g, '')

      if (!/^[0-9a-f]*$/i.test(hexString)) {
        return { error: 'Invalid hexadecimal input' }
      }

      if (hexString.length % 2 !== 0) {
        hexString = '0' + hexString
      }

      const bytes = []
      for (let i = 0; i < hexString.length; i += 2) {
        bytes.push(parseInt(hexString.substr(i, 2), 16))
      }
      return String.fromCharCode(...bytes)
    } catch (error) {
      return { error: `Hex decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'grouping',
      name: 'Format / Grouping',
      type: 'select',
      default: 'none',
      options: [
        { value: 'none', label: 'No Grouping' },
        { value: '1', label: 'Byte' },
        { value: '2', label: '2 Bytes' },
        { value: '3', label: '3 Bytes' },
        { value: '4', label: '4 Bytes' },
        { value: '0x-prefix', label: '0x Prefix' },
        { value: 'c-format', label: 'C Format' },
      ]
    },
  ],
}

/**
 * Binary transformer
 */
const binaryTransformer = {
  id: 'binary',
  name: 'Binary',
  encode: (data, config = {}) => {
    try {
      const { grouping = '8' } = config
      let bytes = []

      if (typeof Buffer !== 'undefined') {
        if (typeof data === 'string') {
          bytes = Array.from(Buffer.from(data, 'utf-8'))
        } else if (data instanceof Uint8Array) {
          bytes = Array.from(data)
        }
      } else {
        if (typeof data === 'string') {
          const encoder = new TextEncoder()
          bytes = Array.from(encoder.encode(data))
        } else {
          bytes = Array.from(data)
        }
      }

      const binaryString = bytes.map(b => b.toString(2).padStart(8, '0')).join('')

      if (grouping === 'none') return binaryString

      const groupSize = parseInt(grouping)
      const regex = new RegExp(`.{1,${groupSize}}`, 'g')
      return binaryString.match(regex).join(' ')
    } catch (error) {
      return { error: `Binary encoding failed: ${error.message}` }
    }
  },
  decode: (data) => {
    try {
      let binaryString = ''
      if (typeof data === 'string') {
        binaryString = data.replace(/\s+/g, '')
      } else if (data instanceof Uint8Array) {
        binaryString = String.fromCharCode(...data).replace(/\s+/g, '')
      }

      if (!/^[01]*$/.test(binaryString)) {
        return { error: 'Invalid binary input' }
      }

      const bytes = []
      for (let i = 0; i < binaryString.length; i += 8) {
        const byte = binaryString.substr(i, 8)
        if (byte.length === 8) {
          bytes.push(parseInt(byte, 2))
        }
      }
      return String.fromCharCode(...bytes)
    } catch (error) {
      return { error: `Binary decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'grouping',
      name: 'Grouping',
      type: 'select',
      default: '8',
      options: [
        { value: 'none', label: 'No Grouping' },
        { value: '4', label: '4 Bits' },
        { value: '5', label: '5 Bits' },
        { value: '6', label: '6 Bits' },
        { value: '8', label: 'Byte' },
        { value: '16', label: '2 Bytes' },
        { value: '24', label: '3 Bytes' },
        { value: '32', label: '4 Bytes' },
      ]
    },
  ],
}

/**
 * ASCII/Unicode transformer
 */
const asciiTransformer = {
  id: 'ascii',
  name: 'ASCII/Unicode',
  encode: (data, config = {}) => {
    try {
      const { separator = ', ' } = config
      const text = typeof data === 'string' ? data : String.fromCharCode(...data)
      return text.split('').map(c => c.charCodeAt(0)).join(separator)
    } catch (error) {
      return { error: `ASCII encoding failed: ${error.message}` }
    }
  },
  decode: (data) => {
    try {
      const input = typeof data === 'string' ? data : String.fromCharCode(...data)
      const codes = input.match(/\d+/g) || []
      return codes.map(c => String.fromCharCode(parseInt(c))).join('')
    } catch (error) {
      return { error: `ASCII decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'separator',
      name: 'Separator',
      type: 'select',
      default: ', ',
      options: [
        { value: ', ', label: 'Comma' },
        { value: ' ', label: 'Space' },
        { value: '', label: 'None' },
      ]
    }
  ],
}

/**
 * Caesar Cipher transformer
 */
const caesarTransformer = {
  id: 'caesar',
  name: 'Caesar Cipher',
  encode: (data, config = {}) => {
    try {
      const { shift = 3, strategy = 'preserve', foreignChars = 'include', alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' } = config
      const text = typeof data === 'string' ? data : String.fromCharCode(...data)
      return shiftCaesar(text, parseInt(shift), { strategy, foreignChars, alphabet })
    } catch (error) {
      return { error: `Caesar encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      const { shift = 3, strategy = 'preserve', foreignChars = 'include', alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz' } = config
      const text = typeof data === 'string' ? data : String.fromCharCode(...data)
      return shiftCaesar(text, -parseInt(shift), { strategy, foreignChars, alphabet })
    } catch (error) {
      return { error: `Caesar decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'shift',
      name: 'Shift Amount',
      type: 'number',
      default: 3,
      min: 1,
      max: 25,
    },
    {
      id: 'alphabet',
      name: 'Alphabet',
      type: 'text',
      default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    },
    {
      id: 'strategy',
      name: 'Case Strategy',
      type: 'select',
      default: 'preserve',
      options: [
        { value: 'preserve', label: 'Preserve' },
        { value: 'ignore', label: 'Ignore' },
        { value: 'strict', label: 'Strict (No Shift)' },
      ]
    },
    {
      id: 'foreignChars',
      name: 'Foreign Characters',
      type: 'select',
      default: 'include',
      options: [
        { value: 'include', label: 'Include' },
        { value: 'ignore', label: 'Ignore' },
      ]
    }
  ],
}

/**
 * Helper for Caesar Cipher shift
 */
function shiftCaesar(text, shift, config = {}) {
  const {
    strategy = 'preserve',
    foreignChars = 'include',
    alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  } = config

  let result = text

  // Handle foreign characters (non-alphabet)
  if (foreignChars === 'ignore') {
    const alphabetSet = new Set(alphabet.split(''))
    result = result.split('').filter(c => alphabetSet.has(c)).join('')
  }

  // Handle case strategy
  if (strategy === 'ignore') {
    result = result.toLowerCase()
  }

  const alphabetLen = alphabet.length
  if (alphabetLen === 0) return result

  return result.split('').map(c => {
    const isUpperCase = c === c.toUpperCase()

    // Strict mode: Ignore capitals from shifting
    if (strategy === 'strict' && isUpperCase) {
      return c
    }

    const index = alphabet.indexOf(c)
    if (index !== -1) {
      const s = ((shift % alphabetLen) + alphabetLen) % alphabetLen
      const newIndex = (index + s) % alphabetLen
      return alphabet[newIndex]
    }

    return c
  }).join('')
}

/**
 * Available transformers registry
 */
const TRANSFORMERS = {
  base64: base64Transformer,
  url: urlTransformer,
  hex: hexTransformer,
  binary: binaryTransformer,
  ascii: asciiTransformer,
  caesar: caesarTransformer,
}

/**
 * Apply a chain of transformers
 */
function applyTransformerChain(input, transformers, direction = 'encode', transformerConfigs = {}) {
  let data = input
  let results = []

  for (const transformer of transformers) {
    const transformerModule = TRANSFORMERS[transformer.id]
    if (!transformerModule) {
      return { error: `Unknown transformer: ${transformer.id}` }
    }

    const transformerConfig = transformerConfigs[transformer.id] || {}
    const fn = direction === 'encode' ? transformerModule.encode : transformerModule.decode

    try {
      const result = fn(data, transformerConfig)
      if (result && result.error) {
        return { error: result.error }
      }
      data = result
      results.push({
        transformer: transformer.name,
        output: result,
      })
    } catch (error) {
      return { error: `${transformer.name} transformation failed: ${error.message}` }
    }
  }

  return {
    success: true,
    output: data,
    transformationSteps: results,
  }
}

/**
 * Detect input type (text vs bytes)
 */
function detectInputType(input) {
  if (typeof input === 'string') {
    return 'text'
  } else if (input instanceof Uint8Array) {
    return 'bytes'
  }
  return 'unknown'
}

/**
 * Main encoder/decoder tool function
 */
function encoderDecoder(input, config = {}) {
  if (input === undefined || input === null || input === '') {
    return { error: 'Please enter data to convert', output: '' }
  }

  const {
    direction = 'encode',
    transformers = [],
    transformerConfigs = {},
    finalOutputFormat = 'text',
    finalOutputConfig = {},
  } = config

  try {
    // Validate transformers (empty is allowed, but nothing will happen)
    if (!Array.isArray(transformers)) {
      return { error: 'Invalid transformers configuration', output: '' }
    }

    // Apply transformer chain
    const result = applyTransformerChain(input, transformers, direction, transformerConfigs)

    if (result.error) {
      return { error: result.error, output: '' }
    }

    let finalOutput = result.output

    // Apply final output formatting
    if (finalOutputFormat === 'hex') {
      const hexResult = hexTransformer.encode(finalOutput, finalOutputConfig)
      if (hexResult.error) return { error: hexResult.error, output: '' }
      finalOutput = hexResult
    } else if (finalOutputFormat === 'binary') {
      const binaryResult = binaryTransformer.encode(finalOutput, finalOutputConfig)
      if (binaryResult.error) return { error: binaryResult.error, output: '' }
      finalOutput = binaryResult
    }

    return {
      success: true,
      output: finalOutput,
      direction: direction,
      transformations: result.transformationSteps,
      metadata: {
        'Direction': direction === 'encode' ? 'Encode' : 'Decode',
        'Transformers Applied': transformers.length > 0 ? transformers.map(t => t.name).join(' → ') : 'None',
        'Final Format': finalOutputFormat.charAt(0).toUpperCase() + finalOutputFormat.slice(1),
        'Steps': result.transformationSteps.length,
      },
    }
  } catch (error) {
    return {
      error: `Conversion failed: ${error.message || 'Unknown error'}`,
      output: ''
    }
  }
}

module.exports = {
  encoderDecoder,
  TRANSFORMERS,
  applyTransformerChain,
  detectInputType,
}
