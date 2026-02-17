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
      const { rfc_variant = 'standard', format = 'standard' } = config
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

      // 1. Handle RFC variants (Alphabet and Default Wrapping)
      if (rfc_variant === 'url' || format.includes('url-safe')) {
        result = result.replace(/\+/g, '-').replace(/\//g, '_')
      }

      // Default wrapping for specific RFCs
      let wrapLength = 0
      if (rfc_variant === 'mime') wrapLength = 76
      if (rfc_variant === 'original') wrapLength = 64

      // 2. Handle Format Variants (Overrides)
      if (format.includes('no-padding')) {
        result = result.replace(/=+$/, '')
      }

      if (format.includes('wrapped') || format.includes('line')) {
        wrapLength = 76 // Override with standard 76 if format explicitly requests wrapping
      }

      if (wrapLength > 0) {
        const regex = new RegExp(`.{1,${wrapLength}}`, 'g')
        result = result.match(regex)?.join('\n') || result
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
      id: 'rfc_variant',
      name: 'Variants',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'standard', label: 'Base64 (RFC 3548, RFC 4648)' },
        { value: 'url', label: 'Base64url (RFC 4648 §5)' },
        { value: 'mime', label: 'Transfer encoding for MIME (RFC 2045)' },
        { value: 'original', label: 'Original Base64 (RFC 1421)' }
      ]
    },
    {
      id: 'format',
      name: 'Format Variant',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'no-padding', label: 'Standard (No padding)' },
        { value: 'url-safe-no-padding', label: 'URL-Safe (No padding)' },
        { value: 'url-safe', label: 'URL-Safe (Padded)' },
        { value: 'line-wrapped', label: 'Line Wrapped (MIME)' }
      ]
    },
  ],
}

/**
 * Base32 transformer
 */
const base32Transformer = {
  id: 'base32',
  name: 'Base32',
  encode: (data, config = {}) => {
    try {
      const { variant = 'rfc4648', format = 'standard' } = config
      let bytes = []
      if (typeof Buffer !== 'undefined') {
        bytes = typeof data === 'string' ? Array.from(Buffer.from(data, 'utf-8')) : Array.from(data)
      } else {
        bytes = typeof data === 'string' ? Array.from(new TextEncoder().encode(data)) : Array.from(data)
      }

      let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      if (variant === 'base32hex') {
        alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV'
      } else if (variant === 'crockford') {
        alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
      } else if (variant === 'z-base-32') {
        alphabet = 'ybndrfg8ejkmcpqxot1uwisza345h769'
      }

      let bits = 0
      let value = 0
      let output = ''

      for (let i = 0; i < bytes.length; i++) {
        value = (value << 8) | bytes[i]
        bits += 8
        while (bits >= 5) {
          output += alphabet[(value >>> (bits - 5)) & 31]
          bits -= 5
        }
      }

      if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31]
      }

      // Default padding logic
      if (variant !== 'crockford' && variant !== 'z-base-32') {
        while (output.length % 8 !== 0) {
          output += '='
        }
      }

      let result = output

      // Apply format variants
      if (format.includes('url-safe') || format.includes('no-padding')) {
        result = result.replace(/=+$/, '')
      }

      if (format.includes('wrapped') || format.includes('line')) {
        // Default to 76 characters for line wrapping
        result = result.match(/.{1,76}/g)?.join('\n') || result
      }

      return result
    } catch (error) {
      return { error: `Base32 encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      const { variant = 'rfc4648' } = config
      let input = typeof data === 'string' ? data : String.fromCharCode(...data)

      // Clean up input: remove whitespace and padding
      input = input.replace(/\s/g, '').replace(/=+$/, '')

      if (variant !== 'z-base-32') {
        input = input.toUpperCase()
      }

      let alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
      if (variant === 'base32hex') {
        alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUV'
      } else if (variant === 'crockford') {
        alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
        input = input.replace(/O/g, '0').replace(/[IL]/g, '1')
      } else if (variant === 'z-base-32') {
        alphabet = 'ybndrfg8ejkmcpqxot1uwisza345h769'
      }

      const lookup = {}
      for (let i = 0; i < alphabet.length; i++) {
        lookup[alphabet[i]] = i
      }

      let bits = 0
      let value = 0
      const output = []

      for (let i = 0; i < input.length; i++) {
        const char = input[i]
        if (char === ' ' || char === '-') continue
        const val = lookup[char]
        if (val === undefined) continue

        value = (value << 5) | val
        bits += 5
        if (bits >= 8) {
          output.push((value >>> (bits - 8)) & 255)
          bits -= 8
        }
      }

      return String.fromCharCode(...output)
    } catch (error) {
      return { error: `Base32 decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'variant',
      name: 'Variant',
      type: 'select',
      default: 'rfc4648',
      options: [
        { value: 'rfc4648', label: 'RFC 4648 (Standard)' },
        { value: 'base32hex', label: 'Base32Hex' },
        { value: 'crockford', label: 'Crockford' },
        { value: 'z-base-32', label: 'z-base-32' },
      ]
    },
    {
      id: 'format',
      name: 'Format Variant',
      type: 'select',
      default: 'standard',
      options: [
        { value: 'standard', label: 'Standard' },
        { value: 'no-padding', label: 'URL Safe (No padding)' },
        { value: 'line-wrapped', label: 'Line Wrapped (76 chars)' },
        { value: 'url-safe-wrapped', label: 'URL Safe Wrapped' }
      ]
    }
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
 * Octal transformer
 */
const octalTransformer = {
  id: 'octal',
  name: 'Octal',
  encode: (data, config = {}) => {
    try {
      const { separator = ' ' } = config
      let bytes = []
      if (typeof Buffer !== 'undefined') {
        bytes = typeof data === 'string' ? Array.from(Buffer.from(data, 'utf-8')) : Array.from(data)
      } else {
        bytes = typeof data === 'string' ? Array.from(new TextEncoder().encode(data)) : Array.from(data)
      }
      return bytes.map(b => b.toString(8).padStart(3, '0')).join(separator)
    } catch (error) {
      return { error: `Octal encoding failed: ${error.message}` }
    }
  },
  decode: (data) => {
    try {
      const input = typeof data === 'string' ? data : String.fromCharCode(...data)
      const codes = input.match(/[0-7]+/g) || []
      const bytes = codes.map(c => parseInt(c, 8))
      return String.fromCharCode(...bytes)
    } catch (error) {
      return { error: `Octal decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'separator',
      name: 'Separator',
      type: 'select',
      default: ' ',
      options: [
        { value: ' ', label: 'Space' },
        { value: ', ', label: 'Comma' },
        { value: '', label: 'None' },
      ]
    }
  ],
}

/**
 * Decimal transformer
 */
const decimalTransformer = {
  id: 'decimal',
  name: 'Decimal',
  encode: (data, config = {}) => {
    try {
      const { separator = ' ' } = config
      let bytes = []
      if (typeof Buffer !== 'undefined') {
        bytes = typeof data === 'string' ? Array.from(Buffer.from(data, 'utf-8')) : Array.from(data)
      } else {
        bytes = typeof data === 'string' ? Array.from(new TextEncoder().encode(data)) : Array.from(data)
      }
      return bytes.map(b => b.toString(10)).join(separator)
    } catch (error) {
      return { error: `Decimal encoding failed: ${error.message}` }
    }
  },
  decode: (data) => {
    try {
      const input = typeof data === 'string' ? data : String.fromCharCode(...data)
      const codes = input.match(/\d+/g) || []
      const bytes = codes.map(c => parseInt(c, 10))
      return String.fromCharCode(...bytes)
    } catch (error) {
      return { error: `Decimal decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'separator',
      name: 'Separator',
      type: 'select',
      default: ' ',
      options: [
        { value: ' ', label: 'Space' },
        { value: ', ', label: 'Comma' },
        { value: '', label: 'None' },
      ]
    }
  ],
}

/**
 * Roman Numerals transformer
 */
const romanTransformer = {
  id: 'roman',
  name: 'Roman Numerals',
  encode: (data, config = {}) => {
    try {
      const { separator = ' ' } = config
      let bytes = []
      if (typeof Buffer !== 'undefined') {
        bytes = typeof data === 'string' ? Array.from(Buffer.from(data, 'utf-8')) : Array.from(data)
      } else {
        bytes = typeof data === 'string' ? Array.from(new TextEncoder().encode(data)) : Array.from(data)
      }
      return bytes.map(b => toRoman(b)).join(separator)
    } catch (error) {
      return { error: `Roman encoding failed: ${error.message}` }
    }
  },
  decode: (data) => {
    try {
      const input = typeof data === 'string' ? data : String.fromCharCode(...data)
      const symbols = input.split(/[\s,]+/).filter(s => s.length > 0)
      const bytes = symbols.map(s => fromRoman(s.toUpperCase()))
      return String.fromCharCode(...bytes)
    } catch (error) {
      return { error: `Roman decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'separator',
      name: 'Separator',
      type: 'select',
      default: ' ',
      options: [
        { value: ' ', label: 'Space' },
        { value: ', ', label: 'Comma' },
        { value: '', label: 'None' },
      ]
    }
  ],
}

/**
 * Helper for Roman Numerals
 */
function toRoman(num) {
  if (num === 0) return 'N'
  const lookup = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 }
  let roman = ''
  for (let i in lookup) {
    while (num >= lookup[i]) {
      roman += i
      num -= lookup[i]
    }
  }
  return roman
}

function fromRoman(roman) {
  if (roman === 'N') return 0
  const lookup = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 }
  let num = 0
  for (let i = 0; i < roman.length; i++) {
    const cur = lookup[roman[i]]
    const next = lookup[roman[i + 1]]
    if (cur < next) {
      num -= cur
    } else {
      num += cur
    }
  }
  return num
}

/**
 * Caesar Cipher transformer
 */
const caesarTransformer = {
  id: 'caesar',
  name: 'Caesar Cipher',
  encode: (data, config = {}) => {
    try {
      const { shift = 3, strategy = 'preserve', foreignChars = 'include', alphabet = 'abcdefghijklmnopqrstuvwxyz' } = config
      const text = typeof data === 'string' ? data : String.fromCharCode(...data)
      return shiftCaesar(text, parseInt(shift), { strategy, foreignChars, alphabet })
    } catch (error) {
      return { error: `Caesar encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      const { shift = 3, strategy = 'preserve', foreignChars = 'include', alphabet = 'abcdefghijklmnopqrstuvwxyz' } = config
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
      default: 'abcdefghijklmnopqrstuvwxyz',
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
    alphabet = 'abcdefghijklmnopqrstuvwxyz'
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
 * Affine Cipher transformer
 */
const affineTransformer = {
  id: 'affine',
  name: 'Affine Cipher',
  encode: (data, config = {}) => {
    try {
      const { a = 5, b = 8, strategy = 'preserve', foreignChars = 'include', alphabet = 'abcdefghijklmnopqrstuvwxyz' } = config
      const text = typeof data === 'string' ? data : String.fromCharCode(...data)
      return applyAffine(text, parseInt(a), parseInt(b), { strategy, foreignChars, alphabet, direction: 'encode' })
    } catch (error) {
      return { error: `Affine encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      const { a = 5, b = 8, strategy = 'preserve', foreignChars = 'include', alphabet = 'abcdefghijklmnopqrstuvwxyz' } = config
      const text = typeof data === 'string' ? data : String.fromCharCode(...data)
      return applyAffine(text, parseInt(a), parseInt(b), { strategy, foreignChars, alphabet, direction: 'decode' })
    } catch (error) {
      return { error: `Affine decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'a',
      name: 'Key A (Multiplicative)',
      type: 'number',
      default: 5,
      min: 1,
    },
    {
      id: 'b',
      name: 'Key B (Additive)',
      type: 'number',
      default: 8,
      min: 0,
    },
    {
      id: 'alphabet',
      name: 'Alphabet',
      type: 'text',
      default: 'abcdefghijklmnopqrstuvwxyz',
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
 * Helper for Affine Cipher
 */
function applyAffine(text, a, b, config = {}) {
  const {
    strategy = 'preserve',
    foreignChars = 'include',
    alphabet = 'abcdefghijklmnopqrstuvwxyz',
    direction = 'encode'
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

  const m = alphabet.length
  if (m === 0) return result

  // Validate 'a' is coprime to 'm'
  const gcd = (x, y) => {
    while (y) {
      x %= y;
      [x, y] = [y, x];
    }
    return x;
  }

  if (gcd(a % m, m) !== 1) {
    throw new Error(`Key 'a' (${a}) and alphabet length (${m}) must be coprime.`)
  }

  let aInv = 1
  if (direction === 'decode') {
    for (let x = 1; x < m; x++) {
      if (((a % m) * (x % m)) % m === 1) {
        aInv = x
        break
      }
    }
  }

  return result.split('').map(c => {
    const isUpperCase = c === c.toUpperCase()

    // Strict mode: Ignore capitals from transformation
    if (strategy === 'strict' && isUpperCase) {
      return c
    }

    const index = alphabet.indexOf(c)
    if (index !== -1) {
      let newIndex
      if (direction === 'encode') {
        newIndex = (a * index + b) % m
      } else {
        newIndex = (aInv * (index - b + m)) % m
      }
      return alphabet[(newIndex + m) % m]
    }

    return c
  }).join('')
}

/**
 * Morse Code transformer
 */
const morseTransformer = {
  id: 'morse',
  name: 'Morse Code',
  encode: (data, config = {}) => {
    try {
      const { short = '.', long = '-', charSeparator = ' ', space = '/' } = config
      const text = typeof data === 'string' ? data.toUpperCase() : String.fromCharCode(...data).toUpperCase()

      const MORSE_MAP = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--',
        '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..',
        '9': '----.', '0': '-----', '.': '.-.-.-', ',': '--..--', '?': '..--..',
        "'": '.----.', '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
        '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-', '+': '.-.-.',
        '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
        ' ': space
      }

      return text.split('').map(char => {
        const code = MORSE_MAP[char]
        if (!code) return ''
        if (char === ' ') return code
        return code.replace(/\./g, short).replace(/-/g, long)
      }).filter(c => c !== '').join(charSeparator).trim()
    } catch (error) {
      return { error: `Morse encoding failed: ${error.message}` }
    }
  },
  decode: (data, config = {}) => {
    try {
      const { short = '.', long = '-', charSeparator = ' ', space = '/' } = config
      const input = typeof data === 'string' ? data : String.fromCharCode(...data)

      const REVERSE_MORSE_MAP = {
        '.-': 'A', '-...': 'B', '-.-.': 'C', '-..': 'D', '.': 'E', '..-.': 'F',
        '--.': 'G', '....': 'H', '..': 'I', '.---': 'J', '-.-': 'K', '.-..': 'L',
        '--': 'M', '-.': 'N', '---': 'O', '.--.': 'P', '--.-': 'Q', '.-.': 'R',
        '...': 'S', '-': 'T', '..-': 'U', '...-': 'V', '.--': 'W', '-..-': 'X',
        '-.--': 'Y', '--..': 'Z', '.----': '1', '..---': '2', '...--': '3',
        '....-': '4', '.....': '5', '-....': '6', '--...': '7', '---..': '8',
        '----.': '9', '-----': '0', '.-.-.-': '.', '--..--': ',', '..--..': '?',
        '.----.': "'", '-.-.--': '!', '-..-.': '/', '-.--.': '(', '-.--.-': ')',
        '.-...': '&', '---...': ':', '-.-.-.': ';', '-...-': '=', '.-.-.': '+',
        '-....-': '-', '..--.-': '_', '.-..-.': '"', '...-..-': '$', '.--.-.': '@'
      }

      // Escape separators for regex
      const escapedWordSep = space.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const escapedCharSep = charSeparator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      const words = input.split(new RegExp(escapedWordSep, 'g'))
      return words.map(word => {
        const chars = word.trim().split(new RegExp(escapedCharSep, 'g'))
        return chars.map(char => {
          if (!char.trim()) return ''
          // Escape user defined short/long for regex normalization
          const escapedShort = short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const escapedLong = long.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const normalizedChar = char.trim()
            .replace(new RegExp(escapedShort, 'g'), '.')
            .replace(new RegExp(escapedLong, 'g'), '-')
          return REVERSE_MORSE_MAP[normalizedChar] || ''
        }).join('')
      }).join(' ')
    } catch (error) {
      return { error: `Morse decoding failed: ${error.message}` }
    }
  },
  options: [
    {
      id: 'short',
      name: 'SHORT',
      type: 'text',
      default: '.',
    },
    {
      id: 'long',
      name: 'LONG',
      type: 'text',
      default: '-',
    },
    {
      id: 'space',
      name: 'SPACE',
      type: 'text',
      default: '/',
    }
  ],
}

/**
 * Available transformers registry
 */
const TRANSFORMERS = {
  base64: base64Transformer,
  base32: base32Transformer,
  url: urlTransformer,
  hex: hexTransformer,
  binary: binaryTransformer,
  ascii: asciiTransformer,
  caesar: caesarTransformer,
  affine: affineTransformer,
  octal: octalTransformer,
  decimal: decimalTransformer,
  roman: romanTransformer,
  morse: morseTransformer,
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
