/**
 * Strict, sentence-aware "number + unit" detector for unit-converter routing.
 * Only matches short inputs that look like "100kg", "100 kg", "72°F", "5ft", etc.
 * Does NOT match plain English sentences or binary/hex blobs.
 */

export function looksLikeNumberWithUnit(input) {
  if (!input || typeof input !== 'string') return false

  const text = input.trim().toLowerCase()
  if (!text) return false

  // 0. Reject obvious sentences or long phrases
  const words = text.split(/\s+/)
  const wordCount = words.length

  // "there are 100 dogs here" → reject
  if (wordCount > 3) return false

  // If we see common English glue words, treat as plain text, not unit
  const englishStopwords = /\b(the|and|or|but|are|is|was|were|have|has|had|here|there|this|that|these|those|with|without|from|into|onto|about|dogs?|cats?)\b/
  if (englishStopwords.test(text)) return false

  // 1. Match patterns like:
  // "100kg", "100 kg", "100-kg", "72f", "72°f", "5ft", "5'11\""
  const mainMatch = text.match(/^([-+]?\d*\.?\d+)\s*([a-z°'"%-]+)$/i)
  if (!mainMatch) return false

  const numericPart = mainMatch[1]
  const unitPartRaw = mainMatch[2]

  // 2. Reject pure binary or hex-like stuff
  const pureDigits = /^[0-9]+$/.test(text)
  const binaryLike = /^[01]+$/.test(text)
  const hexLike = /^[0-9a-f]+$/i.test(text)

  if (pureDigits || binaryLike || hexLike) return false

  const unitPart = unitPartRaw.toLowerCase()

  // 3. Canonical valid unit tokens (mathjs-compatible / common)
  const VALID_UNITS = [
    // length
    'mm', 'cm', 'm', 'km', 'in', 'inch', 'ft', 'yard', 'yd', 'mile', 'mi',
    // mass
    'mg', 'g', 'gram', 'grams', 'kg', 'kilogram', 'kilograms',
    'lb', 'lbs', 'pound', 'pounds', 'oz', 'ounce', 'ounces',
    // temperature
    'c', '°c', 'degc', 'celsius',
    'f', '°f', 'degf', 'fahrenheit',
    'k', 'kelvin',
    // volume
    'ml', 'milliliter', 'milliliters',
    'l', 'liter', 'litre', 'liters', 'litres',
    'gallon', 'gallons', 'gal',
    // time
    's', 'sec', 'secs', 'second', 'seconds',
    'min', 'mins', 'minute', 'minutes',
    'hr', 'hrs', 'hour', 'hours',
    'day', 'days',
    // special symbols often attached to numbers
    '\'', '"', '°', '%'
  ]

  if (VALID_UNITS.includes(unitPart)) {
    return true
  }

  // 4. VERY small fuzzy allowance for obvious misspellings
  //    e.g., "kilogam" → "kilogram"
  const levenshtein = (a, b) => {
    const dp = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0)
    )
    for (let i = 0; i <= a.length; i++) dp[i][0] = i
    for (let j = 0; j <= b.length; j++) dp[0][j] = j
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        dp[i][j] =
          a[i - 1] === b[j - 1]
            ? dp[i - 1][j - 1]
            : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
      }
    }
    return dp[a.length][b.length]
  }

  for (const canonical of VALID_UNITS) {
    if (levenshtein(unitPart, canonical) <= 1) {
      return true
    }
  }

  return false
}

export default {
  looksLikeNumberWithUnit,
}
