/**
 * IPv4 Utility Functions
 * Pure deterministic calculations for IPv4 operations
 */

/**
 * Validates if a string is a valid IPv4 address
 */
export function isValidIPv4(ip) {
  if (typeof ip !== 'string') return false
  const parts = ip.split('.')
  if (parts.length !== 4) return false

  return parts.every(part => {
    const num = parseInt(part, 10)
    return part !== '' && !Number.isNaN(num) && num >= 0 && num <= 255 && part === num.toString()
  })
}

/**
 * Parses IPv4 into octets array
 */
export function parseIPv4Octets(ip) {
  if (!isValidIPv4(ip)) return null

  return ip.split('.').map(part => parseInt(part, 10))
}

/**
 * Normalizes/canonicalizes IPv4 address
 * Removes leading zeros and formats properly
 */
export function normalizeIPv4(ip) {
  if (!isValidIPv4(ip)) return null

  const parts = ip.split('.')
  return parts
    .map(part => {
      const num = parseInt(part, 10)
      return num.toString()
    })
    .join('.')
}

/**
 * Converts IPv4 address to 32-bit integer
 */
export function ipv4ToInteger(ip) {
  if (!isValidIPv4(ip)) return null

  const parts = ip.split('.')
  let result = 0
  for (let i = 0; i < 4; i++) {
    result = result * 256 + parseInt(parts[i], 10)
  }
  return result
}

/**
 * Converts 32-bit integer to IPv4 address
 */
export function integerToIPv4(num) {
  if (typeof num !== 'number' || num < 0 || num > 4294967295) return null

  const parts = []
  for (let i = 3; i >= 0; i--) {
    parts.push(Math.floor(num / Math.pow(256, i)) % 256)
  }
  return parts.join('.')
}

/**
 * Converts IPv4 to hexadecimal representation
 */
export function ipv4ToHex(ip) {
  const int = ipv4ToInteger(ip)
  if (int === null) return null
  return '0x' + int.toString(16).toUpperCase().padStart(8, '0')
}

/**
 * Converts IPv4 to binary representation (dotted format)
 */
export function ipv4ToBinary(ip) {
  const int = ipv4ToInteger(ip)
  if (int === null) return null
  return int.toString(2).padStart(32, '0')
}

/**
 * Converts IPv4 to binary octets array
 */
export function ipv4ToBinaryOctets(ip) {
  const octets = parseIPv4Octets(ip)
  if (!octets) return null

  return octets.map(octet => octet.toString(2).padStart(8, '0'))
}

/**
 * Parses CIDR notation and returns network info
 * e.g., "192.168.1.0/24" -> { ip, prefix, mask, ... }
 */
export function parseCIDR(cidr) {
  const [ip, prefixStr] = cidr.split('/')
  if (!ip || !prefixStr) return null

  const prefix = parseInt(prefixStr, 10)
  if (prefix < 0 || prefix > 32 || !isValidIPv4(ip)) return null

  const ipInt = ipv4ToInteger(ip)
  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0

  return {
    ip: normalizeIPv4(ip),
    prefix,
    mask: integerToIPv4(maskInt),
    maskInt,
    network: integerToIPv4(ipInt & maskInt),
    broadcast: integerToIPv4((ipInt | ~maskInt) >>> 0),
    firstHost: integerToIPv4((ipInt & maskInt) + 1),
    lastHost: integerToIPv4((ipInt | ~maskInt) - 1),
    totalHosts: Math.max(0, Math.pow(2, 32 - prefix) - 2),
  }
}

/**
 * Converts prefix length to netmask
 * e.g., 24 -> "255.255.255.0"
 */
export function prefixToMask(prefix) {
  if (prefix < 0 || prefix > 32 || !Number.isInteger(prefix)) return null

  const maskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return integerToIPv4(maskInt)
}

/**
 * Converts netmask to prefix length
 * e.g., "255.255.255.0" -> 24
 */
export function maskToPrefix(mask) {
  if (!isValidIPv4(mask)) return null

  const maskInt = ipv4ToInteger(mask)
  let prefix = 0
  let remaining = maskInt

  while (remaining > 0) {
    if ((remaining & 1) === 0) {
      break
    }
    remaining = remaining >>> 1
    prefix++
  }

  // Validate continuous 1s
  const validMaskInt = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  if (validMaskInt !== maskInt) return null

  return 32 - prefix
}

/**
 * Checks if IP is in CIDR range
 */
export function isIPInCIDR(ip, cidr) {
  if (!isValidIPv4(ip)) return false

  const parsed = parseCIDR(cidr)
  if (!parsed) return false

  const ipInt = ipv4ToInteger(ip)
  const networkInt = ipv4ToInteger(parsed.network)
  const maskInt = parsed.maskInt

  return (ipInt & maskInt) === (networkInt & maskInt)
}

/**
 * Converts CIDR prefix to netmask binary representation
 * e.g., 24 -> "11111111.11111111.11111111.00000000"
 */
export function cidrToNetmaskBinary(cidr) {
  if (cidr < 0 || cidr > 32 || !Number.isInteger(cidr)) return null
  const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0
  const binary = maskInt.toString(2).padStart(32, '0')
  return binary.replace(/(.{8})/g, '$1.').replace(/\.$/, '')
}

/**
 * Gets wildcard mask from netmask
 * e.g., "255.255.255.0" -> "0.0.0.255"
 */
export function getWildcardMask(netmask) {
  if (!isValidIPv4(netmask)) return null
  const maskInt = ipv4ToInteger(netmask)
  const wildcardInt = ~maskInt >>> 0
  return integerToIPv4(wildcardInt)
}

/**
 * Gets network address from IP and CIDR
 */
export function getNetworkAddress(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return null
  const ipInt = ipv4ToInteger(ip)
  const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0
  const networkInt = ipInt & maskInt
  return integerToIPv4(networkInt)
}

/**
 * Gets broadcast address from IP and CIDR
 */
export function getBroadcastAddress(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return null
  const ipInt = ipv4ToInteger(ip)
  const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0
  const wildcardInt = ~maskInt >>> 0
  const broadcastInt = ipInt | wildcardInt
  return integerToIPv4(broadcastInt >>> 0)
}

/**
 * Gets first usable host from IP and CIDR
 * Handles special cases: /31 and /32
 */
export function getFirstHost(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return null

  if (cidr === 32) {
    return ip
  }
  if (cidr === 31) {
    return ip
  }

  const networkAddr = getNetworkAddress(ip, cidr)
  if (!networkAddr) return null
  const networkInt = ipv4ToInteger(networkAddr)
  return integerToIPv4(networkInt + 1)
}

/**
 * Gets last usable host from IP and CIDR
 * Handles special cases: /31 and /32
 */
export function getLastHost(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return null

  if (cidr === 32) {
    return ip
  }
  if (cidr === 31) {
    const parts = ip.split('.')
    const ipInt = ipv4ToInteger(ip)
    const maskInt = (0xffffffff << (32 - cidr)) >>> 0
    const wildcardInt = ~maskInt >>> 0
    const broadcastInt = ipInt | wildcardInt
    return integerToIPv4(broadcastInt >>> 0)
  }

  const broadcastAddr = getBroadcastAddress(ip, cidr)
  if (!broadcastAddr) return null
  const broadcastInt = ipv4ToInteger(broadcastAddr)
  return integerToIPv4(broadcastInt - 1)
}

/**
 * Gets total number of hosts (2^(32-cidr))
 */
export function getTotalHosts(cidr) {
  if (cidr < 0 || cidr > 32 || !Number.isInteger(cidr)) return 0
  return Math.pow(2, 32 - cidr)
}

/**
 * Gets usable number of hosts
 * Special handling for /31 (RFC 3021) and /32
 */
export function getUsableHosts(cidr) {
  if (cidr < 0 || cidr > 32 || !Number.isInteger(cidr)) return 0
  if (cidr === 32) return 1
  if (cidr === 31) return 2
  return Math.max(0, Math.pow(2, 32 - cidr) - 2)
}

/**
 * Checks if an IP is the network address in a CIDR block
 */
export function isNetworkAddress(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return false
  const networkAddr = getNetworkAddress(ip, cidr)
  return ip === networkAddr
}

/**
 * Checks if an IP is the broadcast address in a CIDR block
 */
export function isBroadcastAddress(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return false
  const broadcastAddr = getBroadcastAddress(ip, cidr)
  return ip === broadcastAddr
}

/**
 * Detects common input errors with standardized structure
 */
export function detectIPv4Errors(input) {
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
  const parts = trimmed.split('.')

  // Check for leading zeros (octal notation)
  parts.forEach((part, idx) => {
    if (part.length > 1 && part[0] === '0' && /^\d+$/.test(part)) {
      warnings.push({
        code: 'LEADING_ZERO',
        message: `Octet ${idx + 1}: Leading zero detected. Value "${part}" may be interpreted as octal in some systems.`,
        severity: 'warning',
      })
    }
  })

  // Check for missing octets
  if (parts.length < 4) {
    errors.push({
      code: 'MISSING_OCTETS',
      message: `Missing octets: Expected 4 octets, found ${parts.length}`,
      severity: 'error',
    })
  } else if (parts.length > 4) {
    errors.push({
      code: 'TOO_MANY_OCTETS',
      message: `Too many octets: Expected 4 octets, found ${parts.length}`,
      severity: 'error',
    })
  }

  // Check for invalid octets
  parts.forEach((part, idx) => {
    if (part === '') {
      errors.push({
        code: 'EMPTY_OCTET',
        message: `Octet ${idx + 1}: Empty value`,
        severity: 'error',
      })
    } else if (!/^\d+$/.test(part)) {
      errors.push({
        code: 'NON_NUMERIC_OCTET',
        message: `Octet ${idx + 1}: Contains non-numeric characters`,
        severity: 'error',
      })
    } else {
      const num = parseInt(part, 10)
      if (num > 255) {
        errors.push({
          code: 'INVALID_OCTET_RANGE',
          message: `Octet ${idx + 1}: Value ${num} exceeds maximum (255)`,
          severity: 'error',
        })
      }
    }
  })

  // Helpful tips
  if (!errors.length && parts.length === 4) {
    tips.push({
      code: 'VALID_IPV4',
      message: '✓ Valid IPv4 address format',
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

  return { errors, warnings, tips }
}
