/**
 * Binary to Text Converter
 * Converts between binary and text with support for multiple encodings and formats
 */

/**
 * Detects if input is binary or text, and identifies the bit grouping pattern
 */
function detectInputType(input) {
  const trimmed = input.trim()

  // Check for 0b prefix format (highest priority)
  if (/^0b[01]+(\s+0b[01]+)*$/i.test(trimmed)) {
    return { type: 'binary_0b', format: '0b prefix', grouping: 'none' }
  }

  // Check if input contains ONLY binary digits and whitespace
  const binaryOnlyMatch = trimmed.replace(/\s+/g, '')
  if (/^[01]+$/.test(binaryOnlyMatch) && binaryOnlyMatch.length >= 8) {
    // Detect grouping pattern by examining spacing
    if (!/([ ]|$)/.test(trimmed.substring(0, 1))) {
      // No spaces = no grouping
      return { type: 'binary', format: 'No grouping', grouping: 'none' }
    }

    // Extract the first group to determine grouping size
    const groups = trimmed.split(/\s+/).filter(g => g)
    if (groups.length > 1) {
      const groupSize = groups[0].length
      const groupLabels = {
        4: '4 Bits',
        5: '5 Bits',
        6: '6 Bits',
        8: 'Byte',
        16: '2 Bytes',
        24: '3 Bytes',
        32: '4 Bytes',
      }
      const label = groupLabels[groupSize] || `${groupSize}-bit groups`
      return { type: 'binary', format: label, grouping: groupSize }
    }

    // No spaces = no grouping
    return { type: 'binary', format: 'No grouping', grouping: 'none' }
  }

  // If no binary patterns match, assume it's text
  return { type: 'text', format: 'Plain text', grouping: 'none' }
}

/**
 * Normalizes binary string to compact form (binary only, no spaces/prefixes)
 */
function normalizeBinaryInput(input) {
  let cleaned = input.trim()
  
  // Remove 0b prefixes
  cleaned = cleaned.replace(/0b/gi, '')
  
  // Remove all spaces
  cleaned = cleaned.replace(/\s+/g, '')
  
  return cleaned
}

/**
 * Decodes binary to text with specified encoding
 */
function binaryToText(binaryString, encoding = 'utf-8') {
  if (!binaryString || binaryString.length % 8 !== 0) {
    return { error: 'Invalid binary string: must have length divisible by 8' }
  }

  try {
    const bytes = []
    for (let i = 0; i < binaryString.length; i += 8) {
      const binary = binaryString.substr(i, 8)
      const byte = parseInt(binary, 2)
      if (isNaN(byte)) {
        return { error: `Invalid binary digits: ${binary}` }
      }
      bytes.push(byte)
    }

    const uint8Array = new Uint8Array(bytes)
    let result

    if (encoding === 'utf-16') {
      // UTF-16 requires pairs of bytes
      if (bytes.length % 2 !== 0) {
        return { error: 'UTF-16 requires even number of bytes' }
      }
      result = String.fromCharCode(...uint8Array)
    } else if (encoding === 'ascii') {
      // ASCII - each byte is a character
      result = String.fromCharCode(...uint8Array)
    } else {
      // UTF-8 (default)
      const decoder = new TextDecoder('utf-8')
      result = decoder.decode(uint8Array)
    }

    // Remove null terminators from end of string
    result = result.replace(/\x00+$/, '')

    return { success: true, text: result, byteCount: bytes.length }
  } catch (error) {
    return { error: `Decoding failed: ${error.message}` }
  }
}

/**
 * Helper function to group binary string
 */
function groupBinary(binaryString, groupSize) {
  if (groupSize === 'none') return binaryString
  const regex = new RegExp(`.{1,${groupSize}}`, 'g')
  return binaryString.match(regex).join(' ')
}

/**
 * Encodes text to binary with specified encoding
 */
function textToBinary(text, encoding = 'utf-8', format = 'compact') {
  if (!text || typeof text !== 'string') {
    return { error: 'Invalid input: must be a string' }
  }

  try {
    let bytes

    if (encoding === 'utf-16') {
      // UTF-16 encoding
      bytes = []
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        bytes.push((code >> 8) & 0xFF)
        bytes.push(code & 0xFF)
      }
    } else if (encoding === 'ascii') {
      // ASCII encoding
      bytes = []
      for (let i = 0; i < text.length; i++) {
        const code = text.charCodeAt(i)
        if (code > 127) {
          return { error: `Character '${text[i]}' is not valid ASCII` }
        }
        bytes.push(code)
      }
    } else {
      // UTF-8 encoding (default)
      const encoder = new TextEncoder()
      bytes = Array.from(encoder.encode(text))
    }

    // Format the binary output
    const binaryString = bytes.map(b => b.toString(2).padStart(8, '0')).join('')

    return {
      success: true,
      binary: binaryString,
      formatted: binaryString,
      byteCount: bytes.length,
      format: 'compact'
    }
  } catch (error) {
    return { error: `Encoding failed: ${error.message}` }
  }
}

/**
 * Main binary-to-text converter function
 */
function binaryConverter(text, config = {}) {
  if (!text || typeof text !== 'string') {
    return { error: 'Please enter binary or text to convert', output: '' }
  }

  const input = text.trim()
  if (!input) {
    return { error: 'Input cannot be empty', output: '' }
  }

  const autoDetect = config.autoDetect !== false
  const encoding = config.charEncoding || 'utf-8'

  try {
    // Auto-detect direction
    let mode = config.mode
    const detected = detectInputType(input)
    if (autoDetect || mode === 'auto' || !mode) {
      mode = detected.type === 'text' ? 'textToBinary' : 'binaryToText'
    }

    if (mode === 'textToBinary') {
      // Convert text to binary
      const binaryFormat_config = config.binaryFormat || 'compact'
      const conversionResult = textToBinary(input, encoding, binaryFormat_config)
      if (conversionResult.error) {
        return { error: conversionResult.error, output: '' }
      }

      // Generate all binary grouping format variants
      const binaryFormats = {
        'No Grouping': conversionResult.binary,
        '4 Bits': groupBinary(conversionResult.binary, 4),
        '5 Bits': groupBinary(conversionResult.binary, 5),
        '6 Bits': groupBinary(conversionResult.binary, 6),
        'Byte': groupBinary(conversionResult.binary, 8),
        '2 Bytes': groupBinary(conversionResult.binary, 16),
        '3 Bytes': groupBinary(conversionResult.binary, 24),
        '4 Bytes': groupBinary(conversionResult.binary, 32),
      }

      return {
        mode: 'encode',
        output: conversionResult.binary,
        input: input,
        charEncoding: encoding,
        formats: binaryFormats,
        metadata: {
          'Mode': 'Text → Binary',
          'Input Format': detected.format,
          'Character Encoding': encoding.toUpperCase(),
          'Byte Count': conversionResult.byteCount,
        },
      }
    } else {
      // Convert binary to text
      const normalized = normalizeBinaryInput(input)
      const conversionResult = binaryToText(normalized, encoding)
      if (conversionResult.error) {
        return { error: conversionResult.error, output: '' }
      }

      // Generate all binary grouping format variants
      const binaryFormats = {
        'No Grouping': normalized,
        '4 Bits': groupBinary(normalized, 4),
        '5 Bits': groupBinary(normalized, 5),
        '6 Bits': groupBinary(normalized, 6),
        'Byte': groupBinary(normalized, 8),
        '2 Bytes': groupBinary(normalized, 16),
        '3 Bytes': groupBinary(normalized, 24),
        '4 Bytes': groupBinary(normalized, 32),
      }

      return {
        mode: 'decode',
        output: conversionResult.text,
        input: input,
        charEncoding: encoding,
        formats: binaryFormats,
        metadata: {
          'Mode': 'Binary → Text',
          'Character Encoding': encoding.toUpperCase(),
          'Input Format': detected.format,
          'Byte Count': conversionResult.byteCount,
        },
      }
    }
  } catch (error) {
    return {
      error: `Conversion failed: ${error.message || 'Unknown error'}`,
      output: ''
    }
  }
}

module.exports = { binaryConverter, binaryToText, textToBinary, detectInputType, normalizeBinaryInput }
