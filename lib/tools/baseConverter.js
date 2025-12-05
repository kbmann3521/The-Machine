/**
 * Base Converter - Convert numbers between different bases (2-36)
 * Supports integers, decimals, negative numbers, and large numbers with BigInt
 */

/**
 * Validates that a base is valid (2-36)
 */
function validateBase(base) {
  const b = parseInt(base, 10)
  if (isNaN(b) || b < 2 || b > 36 || !Number.isInteger(b)) {
    return { valid: false, error: `Base must be an integer between 2 and 36, got ${base}` }
  }
  return { valid: true }
}

/**
 * Gets the character set for a given base
 */
function getCharsetForBase(base) {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return charset.substring(0, base)
}

/**
 * Validates that all digits in input are valid for the source base
 */
function validateInputForBase(input, fromBase) {
  const charset = getCharsetForBase(fromBase)
  const cleanInput = input.replace(/[^0-9A-Za-z.+-]/g, '')
  
  let integerPart = cleanInput
  let hasDecimal = false
  let decimalPart = ''
  
  if (cleanInput.includes('.')) {
    ;[integerPart, decimalPart] = cleanInput.split('.')
    hasDecimal = true
  }
  
  // Remove sign for validation
  const checkInt = integerPart.replace(/^[+-]/, '')
  
  for (const char of checkInt) {
    if (!charset.includes(char.toUpperCase())) {
      return {
        valid: false,
        error: `Invalid digit '${char}' for base ${fromBase}. Valid digits are: ${charset}`
      }
    }
  }
  
  if (hasDecimal) {
    for (const char of decimalPart) {
      if (!charset.includes(char.toUpperCase())) {
        return {
          valid: false,
          error: `Invalid digit '${char}' in decimal part for base ${fromBase}. Valid digits are: ${charset}`
        }
      }
    }
  }
  
  return { valid: true }
}

/**
 * Converts fractional part from one base to another
 */
function convertFractionalPart(fractionalStr, fromBase, toBase, precision = 10) {
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
 * Main base converter function
 */
export default function baseConverter(text, config = {}) {
  // Validate input
  if (!text || typeof text !== 'string') {
    return { error: 'Please enter a number to convert' }
  }
  
  const input = text.trim()
  if (!input) {
    return { error: 'Input cannot be empty' }
  }
  
  // Parse config
  const fromBase = parseInt(config.fromBase, 10) || 10
  const toBase = parseInt(config.toBase, 10) || 16
  const outputCase = config.outputCase || 'uppercase' // 'uppercase' | 'lowercase'
  const grouping = config.grouping || 'none' // 'none' | 'space' | 'underscore'
  const groupSize = parseInt(config.groupSize, 10) || 4
  
  // Validate bases
  const fromBaseValidation = validateBase(fromBase)
  if (!fromBaseValidation.valid) {
    return { error: fromBaseValidation.error }
  }
  
  const toBaseValidation = validateBase(toBase)
  if (!toBaseValidation.valid) {
    return { error: toBaseValidation.error }
  }
  
  // Validate input digits
  const inputValidation = validateInputForBase(input, fromBase)
  if (!inputValidation.valid) {
    return { error: inputValidation.error }
  }
  
  try {
    let isNegative = false
    let cleanInput = input
    
    // Check for sign
    if (input.startsWith('-') || input.startsWith('+')) {
      isNegative = input.startsWith('-')
      cleanInput = input.substring(1)
    }
    
    let integerResult = ''
    let fractionalResult = ''
    
    // Handle decimal point
    if (cleanInput.includes('.')) {
      const [intPart, fracPart] = cleanInput.split('.')
      
      // Convert integer part
      const intValue = parseInt(intPart, fromBase)
      if (isNaN(intValue)) {
        return { error: `Could not parse integer part '${intPart}' as base ${fromBase}` }
      }
      integerResult = intValue.toString(toBase).toUpperCase()
      
      // Convert fractional part
      if (fracPart) {
        fractionalResult = convertFractionalPart(fracPart, fromBase, toBase, 15)
      }
    } else {
      // Integer only
      const value = parseInt(cleanInput, fromBase)
      if (isNaN(value)) {
        return { error: `Could not parse '${cleanInput}' as base ${fromBase}` }
      }
      integerResult = value.toString(toBase).toUpperCase()
    }
    
    // Apply output case
    let result = integerResult
    if (fractionalResult) {
      result += '.' + fractionalResult
    }
    
    if (outputCase === 'lowercase') {
      result = result.toLowerCase()
    }
    
    // Apply grouping
    if (grouping !== 'none') {
      const separator = grouping === 'space' ? ' ' : '_'
      
      // Group integer part
      let [intPart, fracPart] = result.split('.')
      const groupedInt = intPart
        .split('')
        .reverse()
        .join('')
        .match(new RegExp(`.{1,${groupSize}}`, 'g'))
        ?.join(separator)
        .split('')
        .reverse()
        .join('')
      
      result = groupedInt || intPart
      if (fracPart) {
        result += '.' + fracPart
      }
    }
    
    // Add sign back
    if (isNegative) {
      result = '-' + result
    }
    
    return {
      input,
      fromBase,
      toBase,
      result,
      details: {
        hasDecimal: cleanInput.includes('.'),
        isNegative,
        integerPart: integerResult,
        fractionalPart: fractionalResult || null
      }
    }
  } catch (error) {
    return {
      error: `Conversion failed: ${error.message || 'Unknown error'}`
    }
  }
}
