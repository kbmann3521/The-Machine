/**
 * Checksum Calculator - Professional-grade checksums and hashes
 * Supports: CRC32, CRC32C, CRC16, Adler-32, MD5, SHA-1/256/512, and more
 */

const crypto = require('crypto')

/**
 * CRC32 lookup table generation
 */
const makeCRC32Table = () => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
}

const CRC32_TABLE = makeCRC32Table()

/**
 * Input validation and detection
 */
function detectInputMode(input) {
  const trimmed = input.trim()
  
  // Check for Base64 (must be fairly clean)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
  if (base64Regex.test(trimmed) && trimmed.length % 4 === 0 && trimmed.length >= 4) {
    try {
      Buffer.from(trimmed, 'base64')
      return { mode: 'base64', detected: true, input: trimmed }
    } catch (e) {
      // Not valid base64
    }
  }
  
  // Check for hex (spaces/colons optional)
  const hexOnlyRegex = /^[0-9A-Fa-f\s:]*$/
  if (hexOnlyRegex.test(trimmed) && trimmed.length > 0) {
    const cleaned = trimmed.replace(/[\s:]/g, '')
    if (cleaned.length % 2 === 0 && cleaned.length > 0) {
      try {
        Buffer.from(cleaned, 'hex')
        return { mode: 'hex', detected: true, input: cleaned }
      } catch (e) {
        // Not valid hex
      }
    }
  }
  
  // Check for binary (0s and 1s only, reasonably long)
  const binaryRegex = /^[01\s]*$/
  if (binaryRegex.test(trimmed) && trimmed.length > 8) {
    const cleaned = trimmed.replace(/\s/g, '')
    if (cleaned.length % 8 === 0) {
      return { mode: 'binary', detected: true, input: cleaned }
    }
  }
  
  // Default to text
  return { mode: 'text', detected: false, input: trimmed }
}

/**
 * Parse input bytes based on mode
 */
function parseInputBytes(input, mode) {
  try {
    switch (mode) {
      case 'hex':
        const cleanHex = input.replace(/[\s:]/g, '')
        if (cleanHex.length % 2 !== 0) {
          return { error: 'Hex input must have even number of characters' }
        }
        if (!/^[0-9A-Fa-f]*$/.test(cleanHex)) {
          return { error: 'Invalid hex characters' }
        }
        return { bytes: Buffer.from(cleanHex, 'hex'), encoding: 'hex' }
      
      case 'base64':
        if (input.length % 4 !== 0) {
          return { error: 'Base64 input length must be multiple of 4' }
        }
        return { bytes: Buffer.from(input, 'base64'), encoding: 'base64' }
      
      case 'binary':
        const cleaned = input.replace(/\s/g, '')
        if (cleaned.length % 8 !== 0) {
          return { error: 'Binary input must be multiple of 8 bits' }
        }
        if (!/^[01]*$/.test(cleaned)) {
          return { error: 'Binary input must contain only 0s and 1s' }
        }
        const buf = Buffer.alloc(cleaned.length / 8)
        for (let i = 0; i < cleaned.length; i += 8) {
          buf[i / 8] = parseInt(cleaned.substr(i, 8), 2)
        }
        return { bytes: buf, encoding: 'binary' }
      
      case 'text':
        return { bytes: Buffer.from(input, 'utf8'), encoding: 'utf-8' }
      
      default:
        return { error: `Unknown input mode: ${mode}` }
    }
  } catch (e) {
    return { error: `Failed to parse ${mode} input: ${e.message}` }
  }
}

/**
 * CRC32 (IEEE 802.3 standard)
 */
function crc32(bytes) {
  let crc = 0 ^ -1
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC32_TABLE[(crc ^ bytes[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

/**
 * CRC32-C (Castagnoli)
 */
function crc32c(bytes) {
  const poly = 0x1edc6f41
  let crc = 0 ^ -1
  for (let i = 0; i < bytes.length; i++) {
    crc = crc ^ bytes[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ poly : crc >>> 1
    }
  }
  return (crc ^ -1) >>> 0
}

/**
 * CRC16 (X.25)
 */
function crc16(bytes) {
  let crc = 0xffff
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >> 1) ^ 0xa001 : crc >> 1
    }
  }
  return crc & 0xffff
}

/**
 * CRC16-CCITT
 */
function crc16ccitt(bytes) {
  let crc = 0xffff
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i] << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
    }
  }
  return crc & 0xffff
}

/**
 * CRC8
 */
function crc8(bytes) {
  let crc = 0
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x80 ? (crc << 1) ^ 0x07 : crc << 1
      crc &= 0xff
    }
  }
  return crc
}

/**
 * Adler-32
 */
function adler32(bytes) {
  const MOD_ADLER = 65521
  let a = 1, b = 0
  for (let i = 0; i < bytes.length; i++) {
    a = (a + bytes[i]) % MOD_ADLER
    b = (b + a) % MOD_ADLER
  }
  return ((b << 16) | a) >>> 0
}

/**
 * Fletcher-16
 */
function fletcher16(bytes) {
  let sum1 = 0, sum2 = 0
  for (let i = 0; i < bytes.length; i++) {
    sum1 = (sum1 + bytes[i]) % 255
    sum2 = (sum2 + sum1) % 255
  }
  return ((sum2 << 8) | sum1) >>> 0
}

/**
 * Fletcher-32
 */
function fletcher32(bytes) {
  let sum1 = 0, sum2 = 0
  for (let i = 0; i < bytes.length; i += 2) {
    const word = bytes[i] | (bytes[i + 1] ? bytes[i + 1] << 8 : 0)
    sum1 = (sum1 + word) % 0xffffffff
    sum2 = (sum2 + sum1) % 0xffffffff
  }
  return ((sum2 << 16) | sum1) >>> 0
}

/**
 * Simple checksum (sum of all bytes)
 */
function simpleChecksum(bytes) {
  let sum = 0
  for (let i = 0; i < bytes.length; i++) {
    sum += bytes[i]
  }
  return sum >>> 0
}

/**
 * BSD checksum
 */
function bsdChecksum(bytes) {
  let checksum = 0
  for (let i = 0; i < bytes.length; i++) {
    checksum = (checksum >> 1) + ((checksum & 1) << 15)
    checksum = (checksum + bytes[i]) & 0xffff
  }
  return checksum
}

/**
 * Format number as different output types
 */
function formatOutput(value, format = 'hex') {
  const numValue = parseInt(value, 10)
  
  switch (format) {
    case 'decimal':
      return numValue.toString(10)
    
    case 'hex':
      return '0x' + numValue.toString(16).toUpperCase().padStart(8, '0')
    
    case 'hex-plain':
      return numValue.toString(16).toUpperCase().padStart(8, '0')
    
    case 'binary':
      return numValue.toString(2).padStart(32, '0')
    
    case 'bytes-be': {
      const hex = numValue.toString(16).padStart(8, '0')
      const bytes = []
      for (let i = 0; i < 8; i += 2) {
        bytes.push(hex.substr(i, 2))
      }
      return bytes.join(' ').toUpperCase()
    }
    
    case 'bytes-le': {
      const hex = numValue.toString(16).padStart(8, '0')
      const bytes = []
      for (let i = 6; i >= 0; i -= 2) {
        bytes.push(hex.substr(i, 2))
      }
      return bytes.join(' ').toUpperCase()
    }
    
    default:
      return numValue.toString(16).toUpperCase()
  }
}

/**
 * Get algorithm metadata
 */
function getAlgorithmMetadata(algorithm) {
  const metadata = {
    'crc32': {
      name: 'CRC32 (IEEE 802.3)',
      polynomial: '0xEDB88320',
      initialValue: '0xFFFFFFFF',
      finalXor: '0xFFFFFFFF',
      bits: 32,
      description: 'Cyclic Redundancy Check 32-bit (IEEE standard)',
    },
    'crc32c': {
      name: 'CRC32-C (Castagnoli)',
      polynomial: '0x1EDC6F41',
      initialValue: '0xFFFFFFFF',
      finalXor: '0xFFFFFFFF',
      bits: 32,
      description: 'CRC32 variant used in iSCSI, SCTP',
    },
    'crc16': {
      name: 'CRC16 (X.25)',
      polynomial: '0xA001',
      initialValue: '0xFFFF',
      finalXor: '0x0000',
      bits: 16,
      description: 'CRC16 X.25 variant',
    },
    'crc16ccitt': {
      name: 'CRC16-CCITT',
      polynomial: '0x1021',
      initialValue: '0xFFFF',
      finalXor: '0x0000',
      bits: 16,
      description: 'CRC16 CCITT variant',
    },
    'crc8': {
      name: 'CRC8',
      polynomial: '0x07',
      initialValue: '0x00',
      finalXor: '0x00',
      bits: 8,
      description: 'CRC8 checksum',
    },
    'adler32': {
      name: 'Adler-32',
      polynomial: null,
      initialValue: 'A=1, B=0',
      finalXor: '(B << 16) | A',
      bits: 32,
      description: 'Fast checksum similar to CRC32',
    },
    'fletcher16': {
      name: 'Fletcher-16',
      polynomial: null,
      initialValue: 'Sum1=0, Sum2=0',
      finalXor: '(Sum2 << 8) | Sum1',
      bits: 16,
      description: 'Fletcher checksum for 16-bit output',
    },
    'fletcher32': {
      name: 'Fletcher-32',
      polynomial: null,
      initialValue: 'Sum1=0, Sum2=0',
      finalXor: '(Sum2 << 16) | Sum1',
      bits: 32,
      description: 'Fletcher checksum for 32-bit output',
    },
    'simple': {
      name: 'Simple Checksum',
      polynomial: null,
      initialValue: '0',
      finalXor: 'None',
      bits: 32,
      description: 'Sum of all bytes',
    },
    'bsd': {
      name: 'BSD Checksum',
      polynomial: null,
      initialValue: '0',
      finalXor: 'None',
      bits: 16,
      description: 'BSD system checksum',
    },
    'md5': {
      name: 'MD5',
      polynomial: null,
      initialValue: 'N/A',
      finalXor: 'N/A',
      bits: 128,
      description: 'MD5 cryptographic hash (deprecated, use SHA)',
    },
    'sha1': {
      name: 'SHA-1',
      polynomial: null,
      initialValue: 'N/A',
      finalXor: 'N/A',
      bits: 160,
      description: 'SHA-1 cryptographic hash (deprecated for most uses)',
    },
    'sha256': {
      name: 'SHA-256',
      polynomial: null,
      initialValue: 'N/A',
      finalXor: 'N/A',
      bits: 256,
      description: 'SHA-256 cryptographic hash (NIST standard)',
    },
    'sha512': {
      name: 'SHA-512',
      polynomial: null,
      initialValue: 'N/A',
      finalXor: 'N/A',
      bits: 512,
      description: 'SHA-512 cryptographic hash',
    },
  }
  return metadata[algorithm] || {}
}

/**
 * Main checksum calculator
 */
function checksumCalculator(text, config = {}) {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    return { error: 'Please enter data to checksum' }
  }

  const algorithm = config.algorithm || 'crc32'
  const autoDetect = config.autoDetect !== false
  let inputMode = config.inputMode || 'text'
  const outputFormat = config.outputFormat || 'hex'
  const compareMode = config.compareMode === true
  const compareText = config.compareText || ''
  
  // Auto-detect if enabled
  if (autoDetect) {
    const detected = detectInputMode(text)
    inputMode = detected.mode
  }
  
  // Parse input bytes
  const parsed = parseInputBytes(text, inputMode)
  if (parsed.error) {
    return { error: parsed.error }
  }
  
  const bytes = parsed.bytes
  const encoding = parsed.encoding
  
  try {
    let checksum
    let hashHex
    
    // Handle hash algorithms (MD5, SHA)
    if (['md5', 'sha1', 'sha256', 'sha512'].includes(algorithm)) {
      const hashAlgo = algorithm === 'md5' ? 'md5' : algorithm === 'sha1' ? 'sha1' : algorithm === 'sha256' ? 'sha256' : 'sha512'
      hashHex = crypto.createHash(hashAlgo).update(bytes).digest('hex').toUpperCase()
      checksum = hashHex
    } else {
      // Handle checksum algorithms
      switch (algorithm) {
        case 'crc32':
          checksum = crc32(bytes)
          break
        case 'crc32c':
          checksum = crc32c(bytes)
          break
        case 'crc16':
          checksum = crc16(bytes)
          break
        case 'crc16ccitt':
          checksum = crc16ccitt(bytes)
          break
        case 'crc8':
          checksum = crc8(bytes)
          break
        case 'adler32':
          checksum = adler32(bytes)
          break
        case 'fletcher16':
          checksum = fletcher16(bytes)
          break
        case 'fletcher32':
          checksum = fletcher32(bytes)
          break
        case 'simple':
          checksum = simpleChecksum(bytes)
          break
        case 'bsd':
          checksum = bsdChecksum(bytes)
          break
        default:
          return { error: `Unknown algorithm: ${algorithm}` }
      }
      hashHex = null
    }
    
    // Build output
    const result = {
      input: text,
      algorithm,
      inputMode,
      encoding,
      byteLength: bytes.length,
      conversions: {
        decimal: hashHex || checksum.toString(10),
        hex: hashHex || '0x' + checksum.toString(16).toUpperCase().padStart(8, '0'),
        hexPlain: hashHex || checksum.toString(16).toUpperCase().padStart(8, '0'),
      },
      metadata: getAlgorithmMetadata(algorithm),
      timestamp: new Date().toISOString(),
    }
    
    // Add byte representations for non-hash algorithms
    if (!hashHex && checksum !== undefined) {
      const hexStr = checksum.toString(16).padStart(8, '0').toUpperCase()
      const bytes = []
      for (let i = 0; i < 8; i += 2) {
        bytes.push(hexStr.substr(i, 2))
      }
      result.conversions.bytesBE = bytes.join(' ')
      result.conversions.bytesLE = bytes.reverse().join(' ')
      result.conversions.binary = checksum.toString(2).padStart(32, '0')
    }
    
    return result
  } catch (error) {
    return {
      error: `Checksum calculation failed: ${error.message}`
    }
  }
}

module.exports = { checksumCalculator }
