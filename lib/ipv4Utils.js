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

  // Check if there are leading zero warnings
  const hasLeadingZeroWarnings = warnings.some(w => w.code === 'LEADING_ZERO')

  // Helpful tips
  if (!errors.length && parts.length === 4) {
    // If there are leading zero warnings, suggest normalization instead of "valid format"
    if (hasLeadingZeroWarnings) {
      tips.push({
        code: 'NORMALIZE_SUGGESTION',
        message: 'Consider removing leading zeros to avoid octal interpretation.',
        severity: 'info',
      })
    } else {
      tips.push({
        code: 'VALID_IPV4',
        message: '✓ Valid IPv4 address format',
        severity: 'info',
      })
    }
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

/**
 * Classifies CIDR network type for engineering documentation
 * Returns meaningful labels like "Host route", "Point-to-point", "Standard LAN", etc.
 */
export function getCIDRType(cidr) {
  if (cidr < 0 || cidr > 32 || !Number.isInteger(cidr)) return null

  if (cidr === 32) return { type: 'Host route', description: 'Single host (/32)' }
  if (cidr === 31) return { type: 'Point-to-point', description: 'RFC 3021 - Point-to-point link' }
  if (cidr === 30) return { type: 'Small subnet', description: 'Typically for point-to-point or small networks' }
  if (cidr === 29) return { type: 'Small subnet', description: '6 usable hosts' }
  if (cidr === 28) return { type: 'Small subnet', description: '14 usable hosts' }
  if (cidr === 27) return { type: 'Small subnet', description: '30 usable hosts' }
  if (cidr === 26) return { type: 'Standard subnet', description: '62 usable hosts' }
  if (cidr === 25) return { type: 'Standard subnet', description: '126 usable hosts' }
  if (cidr === 24) return { type: 'Standard LAN', description: 'Class C equivalent - 254 usable hosts' }
  if (cidr === 23) return { type: 'Standard subnet', description: '2 /24 blocks - 510 usable hosts' }
  if (cidr === 22) return { type: 'Standard subnet', description: '4 /24 blocks - 1022 usable hosts' }
  if (cidr === 21) return { type: 'Large subnet', description: '8 /24 blocks - 2046 usable hosts' }
  if (cidr === 20) return { type: 'Large subnet', description: '16 /24 blocks - 4094 usable hosts' }
  if (cidr === 19) return { type: 'Large subnet', description: '32 /24 blocks - 8190 usable hosts' }
  if (cidr === 18) return { type: 'Large subnet', description: '64 /24 blocks - 16382 usable hosts' }
  if (cidr === 17) return { type: 'Large subnet', description: '128 /24 blocks - 32766 usable hosts' }
  if (cidr === 16) return { type: 'Class B equivalent', description: '256 /24 blocks - 65534 usable hosts' }
  if (cidr < 16) return { type: 'Supernet', description: 'Larger than /16' }
  if (cidr >= 0 && cidr < 9) return { type: 'Supernet', description: 'Class A or larger scope' }

  return { type: 'Standard subnet', description: 'Standard subnetting' }
}

/**
 * Checks if cidrA is a subnet of cidrB
 * e.g., 10.0.0.0/25 is a subnet of 10.0.0.0/24 → true
 */
export function isSubnetOf(cidrA, prefixA, cidrB, prefixB) {
  if (!isValidIPv4(cidrA) || !isValidIPv4(cidrB)) return false
  if (prefixA > prefixB) return false // Subnet must have larger prefix (more specific)

  const networkA = getNetworkAddress(cidrA, prefixA)
  const networkB = getNetworkAddress(cidrB, prefixB)

  if (!networkA || !networkB) return false

  const intA = ipv4ToInteger(networkA)
  const intB = ipv4ToInteger(networkB)

  // Check if network B fully contains network A
  const maskB = prefixB === 0 ? 0 : (0xffffffff << (32 - prefixB)) >>> 0
  return (intA & maskB) === intB
}

/**
 * Checks if cidrA is a supernet of cidrB
 * e.g., 10.0.0.0/24 is a supernet of 10.0.0.0/25 → true
 */
export function isSupernetOf(cidrA, prefixA, cidrB, prefixB) {
  if (!isValidIPv4(cidrA) || !isValidIPv4(cidrB)) return false
  return isSubnetOf(cidrB, prefixB, cidrA, prefixA)
}

/**
 * Finds the minimal covering subnet for a range of IPs
 * Always returns the smallest subnet that contains both start and end IPs
 * Uses deterministic algorithm based on bit matching
 */
export function findCoveringSubnet(startIP, endIP) {
  if (!isValidIPv4(startIP) || !isValidIPv4(endIP)) return null

  const startInt = ipv4ToInteger(startIP)
  const endInt = ipv4ToInteger(endIP)

  // Ensure minInt <= maxInt for consistent processing
  const minInt = Math.min(startInt, endInt)
  const maxInt = Math.max(startInt, endInt)

  // Handle edge case: identical IPs
  if (minInt === maxInt) {
    return {
      subnet: `${startIP}/32`,
      prefix: 32,
      networkAddr: startIP,
      broadcastAddr: startIP,
    }
  }

  // Find the XOR of min and max to identify differing bits
  const xorValue = minInt ^ maxInt

  // Find the highest (most significant) bit position that differs
  // We count from bit 31 down to bit 0
  let highestDifferingBit = -1
  for (let i = 31; i >= 0; i--) {
    // Safe bit extraction: (xorValue >>> i) shifts right by i positions, & 1 gets the bit
    const bit = (xorValue >>> i) & 1
    if (bit === 1) {
      highestDifferingBit = i
      break
    }
  }

  // Prefix length: if highest differing bit is at position i, we need all bits from 31 down to (i+1)
  // That's (31 - (i+1)) + 1 = 32 - (i+1) = 31 - i bits... wait, let me recalculate
  // Bits 31, 30, 29, ..., (i+1) = that's (31 - (i+1) + 1) = (31 - i) bits total
  // So prefix = 31 - i... no wait, that's not right either.
  // Let's think: bit positions are 31 (most significant) down to 0 (least significant)
  // If bit i is the highest differing bit, we want bits 31 through i+1 as network
  // Bits from 31 to (i+1) inclusive = 31 - (i+1) + 1 = 31 - i bits
  // Wait, that's still confusing. Let me use an example:
  // If highest differing bit is at position 3 (i=3), we want the first 28 bits as network
  // Bits 31, 30, ..., 4 = that's 28 bits = 31 - 3 = 28
  // So prefix = 32 - (3 + 1) = 32 - 4 = 28... Hmm, that's different
  // Actually: we have positions 0-31. If bit 3 differs, we want positions 4-31 as network
  // That's (31 - 4 + 1) = 28 bits = prefix 28
  // Formula: prefix = (31 - highestDifferingBit)... no wait
  // If position is i, network bits are from i+1 to 31, that's (31 - i) bits... hmm
  // Let me recalculate: positions 4 to 31 = 31 - 4 + 1 = 28 bits. Yes!
  // So if i = 3: prefix = 31 - 3 = 28 ✓ ... wait no, 31 - 3 = 28, that works!
  // Actually I need to think about this differently:
  // Bit positions: ... 5, 4, 3, 2, 1, 0
  // If position 3 differs, we want the first (31 - 3) = 28 bits
  // prefix = 31 - highestDifferingBit
  // No wait, that gives 31 - 3 = 28, but we're counting from 0, so...
  // Actually: bit at position i means we need bits 31 down to (i+1)
  // Count: 31, 30, ..., i+1 = (31 - (i+1) + 1) = 31 - i bits
  // Hmm, 31 - 3 = 28. So prefix = 31 - highestDifferingBit? Let me check:
  // If i = 3: prefix = 31 - 3 = 28 ✓
  // If i = 0: prefix = 31 - 0 = 31 ✓ (only the last bit differs)
  // If i = 31: prefix = 31 - 31 = 0 ✓ (most significant bit differs, no network bits)
  // Great! But wait, we'd never reach i=31 unless all IPs are completely different
  // Actually, I had it backwards. Let me reconsider one more time:
  // If xorValue has a bit set at position i, that means min and max differ at bit i
  // To contain both, we need to "round out" to include bit i+1, i+2, ..., 31 as host bits? No...
  // We need bits 31 through (i+1) as network bits to ensure the subnet contains both
  // That's 31 - (i+1) + 1 = 31 - i bits
  // So prefix = 31 - i
  // Wait, but that doesn't match the CIDR /28 format...
  // /28 means 28 network bits and 4 host bits. 28 + 4 = 32. That's a full IPv4.
  // So if we have 28 network bits, the last 4 bits are host bits (positions 0, 1, 2, 3)
  // And position 3 is the highest host bit.
  // If min=192.168.1.1=...00001 and max=192.168.1.10=...01010
  // The highest differing bit is bit 3 (value 8: 01010 has it, 00001 doesn't)
  // So we need network bits up to but not including bit 3
  // That means bits 31 down to 4 are network = 28 bits = /28
  // So: prefix = 32 - (highestDifferingBit + 1) = 32 - 4 = 28 ✓
  const prefix = 32 - (highestDifferingBit + 1)

  // Create mask with first 'prefix' bits as 1
  let mask = 0
  if (prefix === 32) {
    mask = 0xFFFFFFFF
  } else if (prefix > 0) {
    // Build mask: 1s for first 'prefix' bits, 0s for the rest
    mask = 0
    for (let i = 0; i < prefix; i++) {
      mask |= (1 << (31 - i))
    }
    mask = mask >>> 0
  }

  // Extract network address by ANDing with mask
  const networkInt = minInt & mask

  // Calculate broadcast address
  const hostMask = (~mask) >>> 0
  const broadcastInt = (networkInt | hostMask) >>> 0

  // Verify entire range fits within this subnet
  if (networkInt <= minInt && maxInt <= broadcastInt) {
    const networkAddr = integerToIPv4(networkInt)
    const broadcastAddr = integerToIPv4(broadcastInt)

    return {
      subnet: `${networkAddr}/${prefix}`,
      prefix,
      networkAddr,
      broadcastAddr,
    }
  }

  // Fallback if verification fails
  return {
    subnet: '0.0.0.0/0',
    prefix: 0,
    networkAddr: '0.0.0.0',
    broadcastAddr: '255.255.255.255',
  }
}

/**
 * Validates CIDR notation in strict mode
 * In strict mode, host bits must be zero
 */
export function validateCIDRStrict(ip, cidr) {
  if (!isValidIPv4(ip) || cidr < 0 || cidr > 32) return { valid: false }

  const networkAddr = getNetworkAddress(ip, cidr)
  if (!networkAddr || networkAddr !== ip) {
    return {
      valid: false,
      issue: `Host bits must be zero for network route ${ip}/${cidr}`,
      suggestion: `Use ${networkAddr}/${cidr} instead`,
    }
  }

  return { valid: true }
}
