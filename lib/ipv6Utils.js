/**
 * IPv6 Utility Functions
 * Pure deterministic calculations for IPv6 operations
 */

/**
 * Validates if a string is a valid IPv6 address
 */
export function isValidIPv6(ip) {
  if (typeof ip !== 'string') return false

  // Basic IPv6 validation using regex
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/

  return ipv6Regex.test(ip)
}

/**
 * Expands compressed IPv6 to full form
 * e.g., "2001:db8::1" -> "2001:0db8:0000:0000:0000:0000:0000:0001"
 */
export function expandIPv6(ip) {
  if (!isValidIPv6(ip)) return null

  let expanded = ip

  // Handle :: expansion
  if (expanded.includes('::')) {
    const parts = expanded.split(':')
    const emptyIndex = parts.findIndex((p, i) => p === '' && parts[i + 1] === '')

    if (emptyIndex === 0 || emptyIndex === parts.length - 2) {
      // :: is at the start or end
      const nonEmptyGroups = parts.filter(p => p !== '')
      const missingGroups = 8 - nonEmptyGroups.length
      const zeros = Array(missingGroups).fill('0000')

      if (emptyIndex === 0) {
        expanded = [...zeros, ...nonEmptyGroups].join(':')
      } else {
        expanded = [...nonEmptyGroups, ...zeros].join(':')
      }
    } else {
      // :: is in the middle
      const beforeDouble = expanded.substring(0, expanded.indexOf('::'))
      const afterDouble = expanded.substring(expanded.indexOf('::') + 2)

      const beforeParts = beforeDouble ? beforeDouble.split(':') : []
      const afterParts = afterDouble ? afterDouble.split(':') : []
      const totalParts = beforeParts.length + afterParts.length
      const missingGroups = 8 - totalParts
      const zeros = Array(missingGroups).fill('0000')

      expanded = [...beforeParts, ...zeros, ...afterParts].join(':')
    }
  }

  // Pad each group to 4 characters
  return expanded
    .split(':')
    .map(group => group.padStart(4, '0'))
    .join(':')
}

/**
 * Compresses IPv6 to shortest form
 * e.g., "2001:0db8:0000:0000:0000:0000:0000:0001" -> "2001:db8::1"
 */
export function compressIPv6(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return null

  const groups = expanded.split(':').map(g => g.replace(/^0+/, '') || '0')

  // Find longest sequence of zeros
  let maxStart = -1
  let maxLength = 0
  let currentStart = -1
  let currentLength = 0

  groups.forEach((g, i) => {
    if (g === '0') {
      if (currentStart === -1) {
        currentStart = i
        currentLength = 1
      } else {
        currentLength++
      }
    } else {
      if (currentLength > maxLength) {
        maxStart = currentStart
        maxLength = currentLength
      }
      currentStart = -1
      currentLength = 0
    }
  })

  if (currentLength > maxLength) {
    maxStart = currentStart
    maxLength = currentLength
  }

  if (maxLength > 1) {
    const before = groups.slice(0, maxStart).join(':')
    const after = groups.slice(maxStart + maxLength).join(':')

    if (before && after) {
      return `${before}::${after}`
    } else if (before) {
      return `${before}::`
    } else if (after) {
      return `::${after}`
    } else {
      return '::'
    }
  }

  return groups.join(':')
}

/**
 * Gets the version (4 or 6)
 */
export function getIPVersion(ip) {
  if (typeof ip !== 'string') return null
  if (isValidIPv6(ip)) return 6
  if (ip.includes('.') && isValidIPv4Like(ip)) return 4
  return null
}

/**
 * Simple IPv4-like check (for determining version)
 */
function isValidIPv4Like(ip) {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => {
    const num = parseInt(p, 10)
    return p !== '' && !Number.isNaN(num) && num >= 0 && num <= 255
  })
}

/**
 * Gets IPv6 hextets (groups) as array
 */
export function getIPv6Hextets(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return null
  return expanded.split(':')
}

/**
 * Converts IPv6 to binary representation
 * Returns 128-bit binary string
 */
export function ipv6ToBinary(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return null

  const hextets = expanded.split(':')
  const binaryParts = hextets.map(hextet => {
    const num = parseInt(hextet, 16)
    return num.toString(2).padStart(16, '0')
  })

  return binaryParts.join('')
}

/**
 * Converts IPv6 to binary with dots (8 bits per group)
 */
export function ipv6ToBinaryDotted(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return null

  const hextets = expanded.split(':')
  const binaryParts = hextets.map(hextet => {
    const num = parseInt(hextet, 16)
    return num.toString(2).padStart(16, '0')
  })

  const fullBinary = binaryParts.join('')
  return fullBinary.replace(/(.{8})/g, '$1.').replace(/\.$/, '')
}

/**
 * Detects common IPv6 input errors with standardized structure
 */
export function detectIPv6Errors(input) {
  const errors = []
  const warnings = []
  const tips = []

  if (!input || typeof input !== 'string') {
    return {
      errors: [{ code: 'INVALID_INPUT_TYPE', message: 'Invalid input type', severity: 'error' }],
      warnings,
      tips,
    }
  }

  const trimmed = input.trim()

  // Check for multiple ::
  const doubleColonCount = (trimmed.match(/::/g) || []).length
  if (doubleColonCount > 1) {
    errors.push({
      code: 'MULTIPLE_DOUBLE_COLONS',
      message: 'Multiple :: (double colon) found. Only one :: is allowed per address.',
      severity: 'error',
    })
  }

  // Check for too many groups
  const groups = trimmed.split(':').filter(g => g !== '')
  if (groups.length > 8) {
    errors.push({
      code: 'TOO_MANY_GROUPS',
      message: `Too many groups: ${groups.length} found, maximum 8 allowed`,
      severity: 'error',
    })
  }

  // Check for invalid characters in groups
  groups.forEach((group, idx) => {
    if (!/^[0-9a-fA-F]*$/.test(group)) {
      errors.push({
        code: 'INVALID_HEX_CHARS',
        message: `Group ${idx + 1}: Contains invalid characters (must be hex)`,
        severity: 'error',
      })
    }
    if (group.length > 4) {
      errors.push({
        code: 'GROUP_TOO_LONG',
        message: `Group ${idx + 1}: Too many characters (max 4 hex digits)`,
        severity: 'error',
      })
    }
  })

  // Check for invalid compression
  if (trimmed.includes(':::')) {
    errors.push({
      code: 'INVALID_COMPRESSION',
      message: 'Invalid compression: ::: found (should be ::)',
      severity: 'error',
    })
  }

  if (trimmed === '::') {
    warnings.push({
      code: 'UNSPECIFIED_ADDRESS',
      message: 'Unspecified address (::) - only valid in specific contexts',
      severity: 'warning',
    })
  }

  if (trimmed === '::1') {
    tips.push({
      code: 'LOOPBACK_ADDRESS',
      message: '✓ This is the loopback address',
      severity: 'info',
    })
  }

  if (trimmed.startsWith('fe80:')) {
    tips.push({
      code: 'LINK_LOCAL_ADDRESS',
      message: '✓ This is a link-local address',
      severity: 'info',
    })
  }

  if (trimmed.startsWith('fc') || trimmed.startsWith('fd')) {
    tips.push({
      code: 'UNIQUE_LOCAL_ADDRESS',
      message: '✓ This is a unique local address (ULA)',
      severity: 'info',
    })
  }

  if (trimmed !== input) {
    warnings.push({
      code: 'WHITESPACE_TRIMMED',
      message: 'Input had leading/trailing whitespace which was trimmed',
      severity: 'warning',
    })
  }

  if (!errors.length && isValidIPv6(trimmed)) {
    tips.push({
      code: 'VALID_IPV6',
      message: '✓ Valid IPv6 address format',
      severity: 'info',
    })
  }

  return { errors, warnings, tips }
}

/**
 * Checks if IPv6 is IPv4-mapped
 */
export function isIPv4Mapped(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return false
  return expanded.toLowerCase().includes('0000:0000:0000:0000:0000:ffff:')
}

/**
 * Extracts IPv4 from IPv4-mapped IPv6
 */
export function getIPv4FromIPv6Mapped(ip) {
  if (!isIPv4Mapped(ip)) return null

  const expanded = expandIPv6(ip).toLowerCase()
  const match = expanded.match(/ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
  if (!match) return null

  const high = parseInt(match[1], 16)
  const low = parseInt(match[2], 16)

  return `${Math.floor(high / 256)}.${high % 256}.${Math.floor(low / 256)}.${low % 256}`
}

/**
 * Parses IPv6 with zone index (link-local scope identifier)
 * Handles formats like: fe80::1%eth0, fe80::1%3
 * Returns { address, zoneId } or null if invalid
 */
export function parseIPv6WithZone(ip) {
  if (typeof ip !== 'string') return null

  const zoneMatch = ip.match(/^(.+?)(%(.+))$/)
  if (!zoneMatch) {
    // No zone, just validate as regular IPv6
    if (isValidIPv6(ip)) {
      return { address: ip, zoneId: null, normalizedWithoutZone: ip }
    }
    return null
  }

  const address = zoneMatch[1]
  const zoneId = zoneMatch[3]

  if (!isValidIPv6(address)) return null
  if (!zoneId) return null

  return {
    address,
    zoneId,
    normalizedWithoutZone: compressIPv6(address),
    normalizedWithZone: `${compressIPv6(address)}%${zoneId}`,
  }
}

/**
 * Classifies special IPv6 address types
 * Detects 6to4, Teredo, ULA, etc.
 */
export function classifyIPv6Special(ip) {
  const expanded = expandIPv6(ip)
  if (!expanded) return null

  const upper = expanded.toUpperCase()

  // 6to4: 2002::/16
  if (upper.startsWith('2002:')) {
    return {
      type: '6to4',
      description: 'IPv6 Rapid Deployment (6to4)',
      scope: 'Global unicast',
      rfc: 'RFC 3056',
    }
  }

  // Teredo: 2001:0::/32
  if (upper.startsWith('2001:0000:')) {
    return {
      type: 'Teredo',
      description: 'Teredo tunneling',
      scope: 'Global unicast',
      rfc: 'RFC 4380',
    }
  }

  // ULA (Unique Local Address): fc00::/7
  if (upper.startsWith('FC') || upper.startsWith('FD')) {
    return {
      type: 'ULA',
      description: 'Unique Local Address',
      scope: 'Site-local',
      rfc: 'RFC 4193',
    }
  }

  // Link-local: fe80::/10
  if (upper.startsWith('FE80:') || upper.startsWith('FE81:') || upper.startsWith('FE82:') || upper.startsWith('FE83:')) {
    return {
      type: 'Link-local',
      description: 'Link-local address',
      scope: 'Link-local',
      rfc: 'RFC 4291',
    }
  }

  // Loopback: ::1
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return {
      type: 'Loopback',
      description: 'Loopback address',
      scope: 'Loopback',
      rfc: 'RFC 4291',
    }
  }

  // Unspecified: ::
  if (expanded === '0000:0000:0000:0000:0000:0000:0000:0000') {
    return {
      type: 'Unspecified',
      description: 'Unspecified address',
      scope: 'Unspecified',
      rfc: 'RFC 4291',
    }
  }

  // Multicast: ff00::/8
  if (upper.startsWith('FF')) {
    return {
      type: 'Multicast',
      description: 'Multicast address',
      scope: 'Multicast',
      rfc: 'RFC 4291',
    }
  }

  // Global unicast (default)
  return {
    type: 'Global unicast',
    description: 'Global unicast address',
    scope: 'Global',
    rfc: 'RFC 4291',
  }
}

/**
 * Gets IPv6 CIDR network address and broadcast
 * For IPv6, we calculate network from prefix, but "broadcast" concept doesn't apply
 */
export function getIPv6NetworkAddress(ip, prefix) {
  if (!isValidIPv6(ip) || prefix < 0 || prefix > 128) return null

  const expanded = expandIPv6(ip)
  if (!expanded) return null

  const hextets = expanded.split(':')
  const binaryString = hextets
    .map(h => parseInt(h, 16).toString(2).padStart(16, '0'))
    .join('')

  const networkBinary = binaryString
    .substring(0, prefix)
    .padEnd(128, '0')

  const networkHextets = []
  for (let i = 0; i < 8; i++) {
    const hextet = networkBinary.substring(i * 16, (i + 1) * 16)
    networkHextets.push(parseInt(hextet, 2).toString(16).padStart(4, '0'))
  }

  return compressIPv6(networkHextets.join(':'))
}

/**
 * Gets the first address in IPv6 CIDR block
 * Usually the network address itself
 */
export function getIPv6FirstAddress(ip, prefix) {
  return getIPv6NetworkAddress(ip, prefix)
}

/**
 * Gets the last address in IPv6 CIDR block
 * All host bits set to 1
 */
export function getIPv6LastAddress(ip, prefix) {
  if (!isValidIPv6(ip) || prefix < 0 || prefix > 128) return null

  const expanded = expandIPv6(ip)
  if (!expanded) return null

  const hextets = expanded.split(':')
  const binaryString = hextets
    .map(h => parseInt(h, 16).toString(2).padStart(16, '0'))
    .join('')

  const lastBinary = binaryString
    .substring(0, prefix)
    .padEnd(128, '1')

  const lastHextets = []
  for (let i = 0; i < 8; i++) {
    const hextet = lastBinary.substring(i * 16, (i + 1) * 16)
    lastHextets.push(parseInt(hextet, 2).toString(16).padStart(4, '0'))
  }

  return compressIPv6(lastHextets.join(':'))
}

/**
 * Calculates number of IPv6 hosts in a CIDR block
 * Returns object with regular notation and scientific notation
 */
export function getIPv6HostCount(prefix) {
  if (prefix < 0 || prefix > 128) return null

  // Can't use Math.pow for large numbers, use BigInt
  try {
    const hostBits = 128 - prefix
    const count = BigInt(2) ** BigInt(hostBits)
    const countStr = count.toString()

    // Format as scientific notation if very large
    if (hostBits > 50) {
      const exponent = hostBits
      return {
        raw: countStr,
        scientific: `2^${hostBits}`,
        approximate: `~1.3 × 10^${Math.floor(hostBits * 0.301)}`,
      }
    }

    return { raw: countStr, scientific: `2^${hostBits}` }
  } catch (e) {
    return { raw: 'Infinity', scientific: `2^${128 - prefix}` }
  }
}
