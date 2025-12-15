/**
 * Parses bulk time input into individual entries
 * Supports newline-separated times
 */

/**
 * Detects if input is bulk (multiple entries) or single
 * @param {string} input - Raw input string
 * @returns {boolean} - True if bulk input detected
 */
export function isBulkInput(input) {
  if (!input || typeof input !== 'string') return false

  const trimmed = input.trim()
  
  // Check for multiple lines (newline indicates bulk)
  if (trimmed.includes('\n')) {
    return trimmed.split('\n').filter(line => line.trim()).length > 1
  }

  return false
}

/**
 * Parses bulk input into array of cleaned entries
 * @param {string} input - Raw input string
 * @param {Object} options - Parser options
 * @param {number} options.softLimit - Soft warning limit (default 500)
 * @param {number} options.hardLimit - Hard cutoff limit (default 1000)
 * @returns {Object} - { entries, warnings, errors }
 */
export function parseBulkInput(input, options = {}) {
  const { softLimit = 500, hardLimit = 1000 } = options

  if (!input || typeof input !== 'string') {
    return {
      entries: [],
      warnings: [],
      errors: ['Invalid input'],
    }
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return {
      entries: [],
      warnings: [],
      errors: ['No input provided'],
    }
  }

  const warnings = []
  const errors = []
  let entries = []

  // Split by newlines (primary separator for time inputs)
  entries = trimmed.split('\n')

  // Clean and deduplicate entries
  const seen = new Set()
  entries = entries
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0)
    .filter(entry => {
      // Deduplicate
      if (seen.has(entry.toLowerCase())) {
        return false
      }
      seen.add(entry.toLowerCase())
      return true
    })

  // Check limits
  if (entries.length > hardLimit) {
    const removed = entries.length - hardLimit
    entries = entries.slice(0, hardLimit)
    errors.push(
      `Bulk mode is limited to ${hardLimit} entries to prevent performance issues. Removed ${removed} entries.`
    )
  } else if (entries.length > softLimit) {
    warnings.push(
      `Processing ${entries.length} entries. This may take a moment...`
    )
  }

  return {
    entries,
    warnings,
    errors,
  }
}

/**
 * Generates a summary of bulk time results
 * @param {Array} results - Array of result objects from timeNormalizer
 * @returns {Object} - Summary statistics
 */
export function generateBulkSummary(results) {
  if (!Array.isArray(results)) {
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      sameDayCount: 0,
      nextDayCount: 0,
      previousDayCount: 0,
      maxShift: null,
      minShift: null,
      timezones: {},
    }
  }

  const summary = {
    total: results.length,
    valid: 0,
    invalid: 0,
    sameDayCount: 0,
    nextDayCount: 0,
    previousDayCount: 0,
    maxShift: null,
    minShift: null,
    timezones: {},
  }

  results.forEach(result => {
    // Count valid/invalid
    if (result.error) {
      summary.invalid++
    } else {
      summary.valid++
    }

    // Count day shifts (based on the 'dayShift' property from timeNormalizer output)
    if (result.dayShift === 'same') {
      summary.sameDayCount++
    } else if (result.dayShift === 'next') {
      summary.nextDayCount++
    } else if (result.dayShift === 'previous') {
      summary.previousDayCount++
    }

    // Track timezone if detected
    if (result.detectedTimezoneAbbr) {
      const tz = result.detectedTimezoneAbbr
      summary.timezones[tz] = (summary.timezones[tz] || 0) + 1
    }

    // Track max/min shift (in hours)
    if (result.shiftHours !== undefined && !result.error) {
      if (summary.maxShift === null || result.shiftHours > summary.maxShift) {
        summary.maxShift = result.shiftHours
      }
      if (summary.minShift === null || result.shiftHours < summary.minShift) {
        summary.minShift = result.shiftHours
      }
    }
  })

  return summary
}

/**
 * Formats hours into a readable shift string
 * @param {number} hours - Number of hours
 * @returns {string} - Formatted string like "+5h" or "-3h"
 */
export function formatShift(hours) {
  if (hours === undefined || hours === null) return ''
  const sign = hours >= 0 ? '+' : ''
  return `${sign}${hours}h`
}

/**
 * Exports results to CSV format
 * @param {Array} results - Array of result objects
 * @returns {string} - CSV formatted string
 */
export function exportToCSV(results) {
  if (!Array.isArray(results) || results.length === 0) {
    return ''
  }

  const headers = [
    'Input',
    'Parsed (Local)',
    'Output (Target TZ)',
    'Shift',
    'Day Shift',
    'Status',
  ]

  const rows = results.map(result => {
    const input = result.input || ''
    const parsed = result.parsedReadable || ''
    const output = result.outputReadable || ''
    const shift = result.shiftHours !== undefined ? `${result.shiftHours}h` : ''
    const dayShift = result.dayShift || ''
    const status = result.error ? 'Invalid' : 'Valid'

    return [
      `"${input}"`,
      `"${parsed}"`,
      `"${output}"`,
      shift,
      dayShift,
      status,
    ].join(',')
  })

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Exports results to JSON format
 * @param {Array} results - Array of result objects
 * @returns {string} - JSON formatted string
 */
export function exportToJSON(results) {
  return JSON.stringify(results, null, 2)
}
