/**
 * Hex to Text Converter
 * Converts between hexadecimal and text with support for multiple encodings and formats
 */

/**
 * Detects if input is hex or text, and identifies the byte grouping pattern
 */
function detectInputType(input) {
  const trimmed = input.trim()

  // Check for C format (\xHH) - highest priority
  if (/^\\x[0-9a-f]{2}(?:\s*\\x[0-9a-f]{2})*$/i.test(trimmed)) {
    return { type: 'cformat', format: 'C format (\\xHH)' }
  }

  // Check for 0x prefix format (0x48, 0x65, ...)
  if (/^0x[0-9a-f]{2}(?:(?:\s|,)\s*0x[0-9a-f]{2})*$/i.test(trimmed)) {
    return { type: 'hex0x', format: 'With 0x Prefix' }
  }

  // Check if input contains ONLY hex digits and whitespace
  const hexOnlyMatch = trimmed.replace(/\s+/g, '')
  if (/^[0-9a-f]+$/i.test(hexOnlyMatch) && hexOnlyMatch.length % 2 === 0 && hexOnlyMatch.length > 0) {
    // Check if no spaces (compact format)
    if (!/ /.test(trimmed)) {
      return { type: 'hex', format: 'No Grouping' }
    }

    // Extract groups from space-separated hex
    const groups = trimmed.split(/\s+/).filter(g => g)
    if (groups.length > 1) {
      const groupSizeChars = groups[0].length
      const groupSizeBytes = groupSizeChars / 2  // Each byte = 2 hex chars
      const groupLabels = {
        1: 'Byte',
        2: '2 Bytes',
        3: '3 Bytes',
        4: '4 Bytes',
      }
      const label = groupLabels[groupSizeBytes] || `${groupSizeBytes} Bytes`
      return { type: 'hex', format: label }
    }

    return { type: 'hex', format: 'No Grouping' }
  }

  // If no hex patterns match, assume it's text
  return { type: 'text', format: 'Plain text' }
}

/**
 * Normalizes hex string to compact form (hex only, no spaces/prefixes)
 */
function normalizeHexInput(input, format = 'auto') {
  let cleaned = input.trim()
  
  if (format === 'cformat' || (format === 'auto' && /^\\x/.test(cleaned))) {
    // C format: \x48\x65\x6C\x6C\x6F
    cleaned = cleaned.replace(/\\x/g, '').replace(/\s/g, '')
  } else if (format === 'hex0x' || (format === 'auto' && /^0x/.test(cleaned))) {
    // 0x format: 0x48, 0x65, ...
    cleaned = cleaned.replace(/0x/gi, '').replace(/[,\s]/g, '')
  } else if (format === 'space' || (format === 'auto' && / /.test(cleaned))) {
    // Space-separated: 48 65 6C
    cleaned = cleaned.replace(/\s+/g, '')
  }
  
  return cleaned.toUpperCase()
}

/**
 * Decodes hex to text with specified encoding
 */
function hexToText(hexString, encoding = 'utf-8') {
  if (!hexString || hexString.length % 2 !== 0) {
    return { error: 'Invalid hex string: must have even length' }
  }

  try {
    const bytes = []
    for (let i = 0; i < hexString.length; i += 2) {
      const hex = hexString.substr(i, 2)
      const byte = parseInt(hex, 16)
      if (isNaN(byte)) {
        return { error: `Invalid hex digits: ${hex}` }
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
 * Groups hex string by number of bytes
 */
function groupHexByBytes(hexString, byteCount) {
  if (byteCount === 'none' || !byteCount) return hexString
  const charsPerGroup = byteCount * 2 // Each byte = 2 hex chars
  const regex = new RegExp(`.{1,${charsPerGroup}}`, 'g')
  return hexString.match(regex).join(' ')
}

/**
 * Encodes text to hex with specified encoding
 */
function textToHex(text, encoding = 'utf-8', format = 'compact') {
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

    // Format the hex output
    let hexString = bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join('')
    let formatted

    if (format === 'space') {
      formatted = bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')
    } else if (format === 'with0x') {
      formatted = bytes.map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(', ')
    } else if (format === 'cformat') {
      formatted = bytes.map(b => '\\x' + b.toString(16).toUpperCase().padStart(2, '0')).join('')
    } else {
      formatted = hexString // compact
    }

    return {
      success: true,
      hex: hexString,
      formatted,
      byteCount: bytes.length,
      format: format === 'compact' ? 'Compact' : format === 'space' ? 'Space-separated' : format === 'with0x' ? '0x prefix' : 'C format'
    }
  } catch (error) {
    return { error: `Encoding failed: ${error.message}` }
  }
}

/**
 * Main hex-to-text converter function
 */
function hexToTextConverter(text, config = {}) {
  if (!text || typeof text !== 'string') {
    return { error: 'Please enter hex or text to convert', output: '' }
  }

  const input = text.trim()
  if (!input) {
    return { error: 'Input cannot be empty', output: '' }
  }

  const autoDetect = config.autoDetect !== false
  const encoding = config.charEncoding || 'utf-8'
  const hexFormat = config.hexFormat || 'auto'

  try {
    // Auto-detect direction
    let mode = config.mode
    const detected = detectInputType(input)
    if (autoDetect || mode === 'auto' || !mode) {
      mode = detected.type === 'text' ? 'textToHex' : 'hexToText'
    }

    if (mode === 'textToHex') {
      // Convert text to hex
      const hexFormat_config = config.hexFormat || 'compact'
      const conversionResult = textToHex(input, encoding, hexFormat_config)
      if (conversionResult.error) {
        return { error: conversionResult.error, output: '' }
      }

      return {
        mode: 'encode',
        output: conversionResult.hex,
        input: input,
        charEncoding: encoding,
        formats: {
          'No Grouping': conversionResult.hex,
          'Byte': groupHexByBytes(conversionResult.hex, 1),
          '2 Bytes': groupHexByBytes(conversionResult.hex, 2),
          '3 Bytes': groupHexByBytes(conversionResult.hex, 3),
          '4 Bytes': groupHexByBytes(conversionResult.hex, 4),
          'With 0x Prefix': conversionResult.hex.match(/.{1,2}/g).map(h => '0x' + h).join(', '),
          'C Format': conversionResult.hex.match(/.{1,2}/g).map(h => '\\x' + h).join(''),
        },
        metadata: {
          'Mode': 'Text → Hex',
          'Input Format': detected.format,
          'Character Encoding': encoding.toUpperCase(),
          'Byte Count': conversionResult.byteCount,
        },
      }
    } else {
      // Convert hex to text
      const normalized = normalizeHexInput(input, hexFormat)
      const conversionResult = hexToText(normalized, encoding)
      if (conversionResult.error) {
        return { error: conversionResult.error, output: '' }
      }

      // Also generate all hex format variants of the original hex input for the dropdown
      const hexFormats = {}
      hexFormats['No Grouping'] = normalized // Already normalized to compact
      hexFormats['Byte'] = groupHexByBytes(normalized, 1)
      hexFormats['2 Bytes'] = groupHexByBytes(normalized, 2)
      hexFormats['3 Bytes'] = groupHexByBytes(normalized, 3)
      hexFormats['4 Bytes'] = groupHexByBytes(normalized, 4)
      hexFormats['With 0x Prefix'] = normalized.match(/.{1,2}/g).map(h => '0x' + h).join(', ')
      hexFormats['C Format'] = normalized.match(/.{1,2}/g).map(h => '\\x' + h).join('')

      return {
        mode: 'decode',
        output: conversionResult.text,
        input: input,
        charEncoding: encoding,
        formats: hexFormats, // Include all hex format variants
        metadata: {
          'Mode': 'Hex → Text',
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

module.exports = { hexToTextConverter, hexToText, textToHex, detectInputType, normalizeHexInput }
