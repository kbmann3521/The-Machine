/**
 * Universal Number+Unit Detector
 * 
 * Detects ANY variation of number+unit input, even with misspellings,
 * weird spacing, and shorthand notations.
 */

export function looksLikeNumberWithUnit(input) {
  if (!input) return false

  const text = input.toLowerCase().trim()

  // 1. MUST contain a number
  const hasNumber = /[-+]?\d*\.?\d+/.test(text)
  if (!hasNumber) return false

  // 2. Potential unit tokens (huge coverage)
  const unitPatterns = [
    // length
    'in', 'inch', 'inches', '"', 'cm', 'cent', 'centi', 'centimeter', 'mm',
    'meter', 'metre', 'm', 'km', 'foot', 'feet', "'", 'ft', 'yard', 'yd',
    'mile', 'mi',
    // mass
    'kg', 'kgs', 'kilogram', 'gram', 'g', 'mg', 'lb', 'lbs', 'pound', 'oz', 'ounce',
    // temperature
    'c', '°c', 'fahrenheit', '°f', 'kelvin', 'k',
    // volume
    'l', 'liter', 'litre', 'ml', 'gallon', 'gal',
    // area
    'sqft', 'sq.', 'm2', 'cm2', 'km2',
    // time (rare for unit converter, but included)
    'sec', 's', 'min', 'hour', 'hr', 'day',
    // power/energy
    'w', 'kw', 'hp', 'cal', 'kcal', 'joule', 'j',
    // currency (optional)
    'usd', 'eur', '$',
  ]

  // 3. Build fuzzy pattern: unit may appear:
  //   - after number ("100in", "100 in", "100-inch")
  //   - before number ("in100" rare but possible)
  //   - with spaces or not
  const fuzzyUnitRegex = new RegExp(
    `(${unitPatterns.join('|')})`,
    'i'
  )

  // 4. Check if ANY unit-like token appears
  const hasUnitToken = fuzzyUnitRegex.test(text)

  if (hasUnitToken) return true

  // 5. BONUS: catch weird cases like "100kgs", "100punds", "100metars"
  //    → Looks like a number + some trailing letters
  if (/\d+[a-z]+$/.test(text)) return true

  // 6. BONUS: catch ° and ' and " by themselves
  if (/[\'\"\°]/.test(text) && hasNumber) return true

  return false
}

export default {
  looksLikeNumberWithUnit,
}
