/**
 * Parses bulk IP input into individual entries
 * Supports multiple separators: newlines, semicolons, commas, tabs, whitespace
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

  // Check for semicolons
  if (trimmed.includes(';')) {
    return trimmed.split(';').filter(s => s.trim()).length > 1
  }

  // Check for multiple comma-separated items (at least 2 items)
  // But be careful: single IPv4 addresses don't have commas in them
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map(p => p.trim()).filter(p => p)
    return parts.length > 1
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

  // Try to split by primary separator
  let parts = []

  // Primary: newline (most common for pasted lists)
  if (trimmed.includes('\n')) {
    parts = trimmed.split('\n')
  }
  // Secondary: semicolon
  else if (trimmed.includes(';')) {
    parts = trimmed.split(';')
  }
  // Tertiary: comma
  else if (trimmed.includes(',')) {
    parts = trimmed.split(',')
  }
  // Quaternary: tabs
  else if (trimmed.includes('\t')) {
    parts = trimmed.split('\t')
  }
  // Fallback: whitespace (space, multiple spaces)
  else if (trimmed.includes(' ') && !trimmed.includes('/') && !trimmed.includes('-')) {
    // Only split by spaces if it doesn't look like a CIDR or range
    parts = trimmed.split(/\s+/)
  }
  // Single entry
  else {
    parts = [trimmed]
  }

  // Clean and deduplicate entries
  const seen = new Set()
  entries = parts
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .filter(part => {
      // Deduplicate
      if (seen.has(part.toLowerCase())) {
        return false
      }
      seen.add(part.toLowerCase())
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
 * Classifies an entry as IPv4, IPv6, CIDR, Hostname, Range, or Invalid
 * @param {string} entry - Single input entry
 * @returns {string} - Classification type
 */
export function classifyInputEntry(entry) {
  if (!entry || typeof entry !== 'string') return 'Invalid'

  const trimmed = entry.trim()

  // IPv4 CIDR (e.g., 192.168.1.0/24)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(trimmed)) {
    return 'CIDR'
  }

  // IPv4 range (e.g., 192.168.1.1-192.168.1.10 or 192.168.1.1 to 192.168.1.10)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\s*[-–—]\s*\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\s+to\s+\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
    return 'Range'
  }

  // IPv6 CIDR (e.g., 2001:db8::/32)
  if (/:\/\d{1,3}$/.test(trimmed)) {
    return 'CIDR'
  }

  // IPv6 (contains colons and hex chars)
  if (/^[0-9a-fA-F:]*:[0-9a-fA-F:]*/.test(trimmed)) {
    return 'IPv6'
  }

  // IPv4 (four octets)
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)) {
    return 'IPv4'
  }

  // Hostname (contains letters, dots, hyphens, numbers)
  if (/^[a-zA-Z0-9]([a-zA-Z0-9-]*\.)*[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed) && !trimmed.match(/^\d+\.\d+/)) {
    return 'Hostname'
  }

  return 'Invalid'
}

/**
 * Filters bulk results by type, privacy, and search text
 * @param {Array} results - Array of result objects with input, type, classification, etc.
 * @param {Object} filters - Filter criteria
 * @param {string} filters.typeFilter - Filter by type (IPv4, IPv6, CIDR, Hostname, Range, Invalid, or empty for all)
 * @param {string} filters.privacyFilter - Filter by privacy (Public, Private, Special, or empty for all)
 * @param {string} filters.searchText - Search in input or normalized value
 * @returns {Array} - Filtered results
 */
export function filterBulkResults(results, filters = {}) {
  if (!Array.isArray(results)) return []

  let filtered = [...results]

  // Filter by type
  if (filters.typeFilter && filters.typeFilter !== 'All') {
    filtered = filtered.filter(result => result.inputType === filters.typeFilter)
  }

  // Filter by privacy
  if (filters.privacyFilter && filters.privacyFilter !== 'All') {
    filtered = filtered.filter(result => {
      if (filters.privacyFilter === 'Public') {
        return result.classification?.isPublic === true
      } else if (filters.privacyFilter === 'Private') {
        return result.classification?.isPrivate === true
      } else if (filters.privacyFilter === 'Special') {
        return !result.classification?.isPublic && !result.classification?.isPrivate
      }
      return true
    })
  }

  // Filter by search text
  if (filters.searchText && filters.searchText.trim()) {
    const searchLower = filters.searchText.toLowerCase()
    filtered = filtered.filter(result => {
      const input = (result.input || '').toLowerCase()
      const normalized = (result.normalized || '').toLowerCase()
      const hostname = (result.hostname || '').toLowerCase()
      return input.includes(searchLower) || normalized.includes(searchLower) || hostname.includes(searchLower)
    })
  }

  return filtered
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

  // Define CSV columns based on available data
  const headers = [
    'Input',
    'Type',
    'Normalized/CIDR',
    'Classification',
    'Scope',
    'Private',
    'Public',
    'Valid',
    'Notes',
  ]

  const rows = results.map(result => {
    const normalized = result.normalized || result.input || ''
    const type = result.inputType || 'Unknown'
    const classif = result.classification?.type || 'N/A'
    const scope = result.classification?.scope || ''
    const isPrivate = result.classification?.isPrivate ? 'Yes' : 'No'
    const isPublic = result.classification?.isPublic ? 'Yes' : 'No'
    const isValid = result.isValid === false ? 'No' : result.isValid ? 'Yes' : 'N/A'
    const notes = result.classification?.range || ''

    return [
      `"${result.input}"`,
      type,
      `"${normalized}"`,
      classif,
      scope,
      isPrivate,
      isPublic,
      isValid,
      `"${notes}"`,
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

/**
 * Generates a summary of bulk results
 * @param {Array} results - Array of result objects
 * @returns {Object} - Summary statistics
 */
export function generateBulkSummary(results) {
  if (!Array.isArray(results)) {
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      byType: {},
      byPrivacy: {},
    }
  }

  const summary = {
    total: results.length,
    valid: 0,
    invalid: 0,
    byType: {},
    byPrivacy: {},
  }

  results.forEach(result => {
    // Count valid/invalid
    if (result.isValid !== false) {
      summary.valid++
    } else {
      summary.invalid++
    }

    // Count by type
    const type = result.inputType || 'Unknown'
    summary.byType[type] = (summary.byType[type] || 0) + 1

    // Count by privacy
    if (result.classification?.isPrivate) {
      summary.byPrivacy['Private'] = (summary.byPrivacy['Private'] || 0) + 1
    } else if (result.classification?.isPublic) {
      summary.byPrivacy['Public'] = (summary.byPrivacy['Public'] || 0) + 1
    } else {
      summary.byPrivacy['Special'] = (summary.byPrivacy['Special'] || 0) + 1
    }
  })

  return summary
}
