/**
 * Base Converter - Auto-detect input base and convert to multiple bases
 * Supports binary (2), octal (8), decimal (10), hexadecimal (16), and custom bases
 */

/**
 * Detects the base of input using prefixes and digit patterns
 */
function detectInputBase(input) {
  let trimmed = input.trim()

  // Remove sign first for prefix detection
  let isNegative = false
  let sign = ''
  if (trimmed.startsWith('-') || trimmed.startsWith('+')) {
    isNegative = trimmed.startsWith('-')
    sign = trimmed[0]
    trimmed = trimmed.substring(1)
  }

  const trimmedLower = trimmed.toLowerCase()

  // Check for explicit prefixes (highest priority)
  if (trimmedLower.startsWith('0b')) {
    return { base: 2, stripped: sign + trimmedLower.slice(2), detected: true, prefix: '0b' }
  }
  if (trimmedLower.startsWith('0o')) {
    return { base: 8, stripped: sign + trimmedLower.slice(2), detected: true, prefix: '0o' }
  }
  if (trimmedLower.startsWith('0x')) {
    return { base: 16, stripped: sign + trimmedLower.slice(2), detected: true, prefix: '0x' }
  }

  // For pattern detection, work with already lowercased and sign-removed version
  // Remove decimal point for digit analysis
  const integerPart = trimmedLower.split('.')[0]
  const digitsOnly = integerPart.replace(/\s|_/g, '')

  // Check for hex digits (A-F)
  if (/[a-f]/.test(digitsOnly)) {
    return { base: 16, stripped: sign + trimmedLower, detected: true, reason: 'contains A-F' }
  }

  // Check if only binary digits (0-1)
  if (/^[01\s_]+$/.test(digitsOnly) && digitsOnly.length > 1) {
    return { base: 2, stripped: sign + trimmedLower, detected: true, reason: 'binary pattern' }
  }

  // Check if only octal digits (0-7)
  if (/^[0-7\s_]+$/.test(digitsOnly)) {
    // Ambiguous: could be octal or decimal
    // Default to decimal unless it looks like octal (leading 0)
    if (digitsOnly.startsWith('0') && digitsOnly.length > 1) {
      return { base: 8, stripped: sign + trimmedLower, detected: true, reason: 'octal pattern', confidence: 'medium' }
    }
  }

  // Default to decimal
  return { base: 10, stripped: sign + trimmedLower, detected: true, reason: 'default' }
}

/**
 * Validates base (2-36)
 */
function validateBase(base) {
  const b = parseInt(base, 10)
  if (isNaN(b) || b < 2 || b > 36 || !Number.isInteger(b)) {
    return { valid: false, error: `Base must be between 2 and 36` }
  }
  return { valid: true }
}

/**
 * Gets valid charset for a base
 */
function getCharsetForBase(base) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return charset.substring(0, base)
}

/**
 * Validates that all digits are valid for the given base
 */
function validateInputForBase(input, base) {
  const charset = getCharsetForBase(base)
  const cleanInput = input.replace(/[^0-9A-Za-z.+-]/g, '')
  
  let integerPart = cleanInput
  if (cleanInput.includes('.')) {
    ;[integerPart] = cleanInput.split('.')
  }
  
  const checkInt = integerPart.replace(/^[+-]/, '')
  
  for (const char of checkInt) {
    if (!charset.includes(char.toUpperCase())) {
      return {
        valid: false,
        error: `Invalid digit '${char}' for base ${base}. Valid digits: ${charset}`
      }
    }
  }
  
  return { valid: true }
}

/**
 * Converts fractional part between bases
 */
function convertFractionalPart(fractionalStr, fromBase, toBase, precision = 15) {
  if (!fractionalStr) return ''
  
  let fractional = 0
  let power = 1
  
  for (const digit of fractionalStr) {
    const digitValue = parseInt(digit, fromBase)
    fractional += digitValue * Math.pow(fromBase, -power)
    power++
  }
  
  let result = ''
  for (let i = 0; i < precision && fractional > 0; i++) {
    fractional *= toBase
    const digit = Math.floor(fractional)
    result += digit.toString(toBase).toUpperCase()
    fractional -= digit
  }
  
  return result
}

/**
 * Converts a number from one base to another
 */
function convertBase(intValue, fromBase, toBase, fractionalPart = '') {
  let intResult = intValue.toString(toBase).toUpperCase()
  let fracResult = ''
  
  if (fractionalPart) {
    fracResult = convertFractionalPart(fractionalPart, fromBase, toBase)
  }
  
  return fracResult ? `${intResult}.${fracResult}` : intResult
}

/**
 * Applies output formatting (case and grouping)
 */
function formatOutput(value, outputCase = 'uppercase', grouping = 'none', groupSize = 4) {
  let result = value
  
  // Apply case
  if (outputCase === 'lowercase') {
    result = result.toLowerCase()
  }
  
  // Apply grouping
  if (grouping !== 'none') {
    const separator = grouping === 'space' ? ' ' : '_'
    const [intPart, fracPart] = result.split('.')
    
    const grouped = intPart
      .split('')
      .reverse()
      .join('')
      .match(new RegExp(`.{1,${groupSize}}`, 'g'))
      ?.join(separator)
      .split('')
      .reverse()
      .join('') || intPart
    
    result = fracPart ? `${grouped}.${fracPart}` : grouped
  }
  
  return result
}

/**
 * Main base converter function with auto-detection
 */
function baseConverter(text, config = {}) {
  if (!text || typeof text !== 'string') {
    return { error: 'Please enter a number to convert' }
  }
  
  const input = text.trim().replace(/,/g, '')
  if (!input) {
    return { error: 'Input cannot be empty' }
  }
  
  // Parse config
  const autoDetect = config.autoDetect !== false
  const outputCase = config.outputCase || 'uppercase'
  const grouping = config.grouping || 'none'
  const groupSize = parseInt(config.groupSize, 10) || 4
  const customToBase = config.toBase ? parseInt(config.toBase, 10) : null
  
  try {
    let fromBase, cleanInput, isNegative = false, detectionInfo

    // Detect or use manual input
    if (autoDetect) {
      detectionInfo = detectInputBase(input)
      fromBase = detectionInfo.base
      cleanInput = detectionInfo.stripped
    } else {
      fromBase = parseInt(config.fromBase, 10) || 10
      cleanInput = input
      detectionInfo = { base: fromBase, detected: false }
    }

    // Validate base
    const baseValidation = validateBase(fromBase)
    if (!baseValidation.valid) {
      return { error: baseValidation.error }
    }

    // Validate input digits (use cleanInput which has prefix stripped if auto-detected)
    const inputValidation = validateInputForBase(cleanInput, fromBase)
    if (!inputValidation.valid) {
      return { error: inputValidation.error }
    }
    
    // Parse sign
    if (cleanInput.startsWith('-') || cleanInput.startsWith('+')) {
      isNegative = cleanInput.startsWith('-')
      cleanInput = cleanInput.substring(1)
    }
    
    // Split integer and fractional parts
    let integerPart = cleanInput
    let fractionalPart = ''
    
    if (cleanInput.includes('.')) {
      ;[integerPart, fractionalPart] = cleanInput.split('.')
    }
    
    // Parse to decimal value (intermediate)
    const decimalInt = parseInt(integerPart || '0', fromBase)
    if (isNaN(decimalInt)) {
      return { error: `Could not parse '${integerPart}' as base ${fromBase}` }
    }
    
    // Convert to 4 common bases (always)
    const commonBases = {
      2: formatOutput(convertBase(decimalInt, fromBase, 2, fractionalPart), outputCase, grouping, groupSize),
      8: formatOutput(convertBase(decimalInt, fromBase, 8, fractionalPart), outputCase, grouping, groupSize),
      10: formatOutput(convertBase(decimalInt, fromBase, 10, fractionalPart), outputCase, grouping, groupSize),
      16: formatOutput(convertBase(decimalInt, fromBase, 16, fractionalPart), outputCase, grouping, groupSize),
    }
    
    // Add sign back
    if (isNegative) {
      Object.keys(commonBases).forEach(base => {
        commonBases[base] = '-' + commonBases[base]
      })
    }
    
    // Build result
    const result = {
      input,
      detectedBase: autoDetect ? fromBase : null,
      detectionReason: autoDetect ? detectionInfo.reason : null,
      conversions: {
        binary: commonBases[2],
        octal: commonBases[8],
        decimal: commonBases[10],
        hexadecimal: commonBases[16],
      },
    }
    
    // Add custom toBase if specified
    if (customToBase && ![2, 8, 10, 16].includes(customToBase)) {
      const customValidation = validateBase(customToBase)
      if (customValidation.valid) {
        result.conversions[`base_${customToBase}`] = formatOutput(
          convertBase(decimalInt, fromBase, customToBase, fractionalPart),
          outputCase,
          grouping,
          groupSize
        )
        if (isNegative) {
          result.conversions[`base_${customToBase}`] = '-' + result.conversions[`base_${customToBase}`]
        }
      }
    }
    
    // Add details
    result.details = {
      hasDecimal: cleanInput.includes('.'),
      isNegative,
      inputLength: cleanInput.replace(/[^0-9A-Za-z]/g, '').length,
    }
    
    return result
  } catch (error) {
    return {
      error: `Conversion failed: ${error.message || 'Unknown error'}`
    }
  }
}

module.exports = { baseConverter, detectInputBase }
