/**
 * Unified IP Utilities Module
 * Combines all IPv4, IPv6, classification, and PTR generation utilities
 */

// IPv4 Utils
export {
  isValidIPv4,
  normalizeIPv4,
  parseIPv4Octets,
  ipv4ToInteger,
  integerToIPv4,
  ipv4ToHex,
  ipv4ToBinary,
  ipv4ToBinaryOctets,
  parseCIDR,
  prefixToMask,
  maskToPrefix,
  isIPInCIDR,
  cidrToNetmaskBinary,
  getWildcardMask,
  getNetworkAddress,
  getBroadcastAddress,
  getFirstHost,
  getLastHost,
  getTotalHosts,
  getUsableHosts,
  isNetworkAddress,
  isBroadcastAddress,
  detectIPv4Errors,
} from './ipv4Utils'

// IPv6 Utils
export {
  isValidIPv6,
  expandIPv6,
  compressIPv6,
  getIPVersion,
  detectIPv6Errors,
  isIPv4Mapped,
  getIPv4FromIPv6Mapped,
} from './ipv6Utils'

// Classification
export {
  classifyIPv4,
  classifyIPv6,
  classifyIP,
} from './ipClassification'

// PTR Generator
export {
  generateIPv4PTR,
  generateIPv6PTR,
  generatePTR,
  parseIPv4PTR,
  parseIPv6PTR,
  parsePTR,
} from './ptrGenerator'

// Combined diagnostics function
import { detectIPv4Errors } from './ipv4Utils'
import { detectIPv6Errors } from './ipv6Utils'
import { classifyIP } from './ipClassification'
import { generatePTR } from './ptrGenerator'

export function analyzeIP(ip) {
  if (!ip || typeof ip !== 'string') {
    return {
      input: ip,
      valid: false,
      errors: ['Invalid input'],
    }
  }

  const trimmed = ip.trim()

  // Try IPv4
  if (trimmed.includes('.')) {
    const { errors, warnings, tips } = detectIPv4Errors(trimmed)
    if (!errors.length) {
      const classification = classifyIP(trimmed)
      const ptr = generatePTR(trimmed)
      return {
        input: trimmed,
        version: 4,
        valid: true,
        errors,
        warnings,
        tips,
        classification,
        ptr,
      }
    }
    return {
      input: trimmed,
      version: 4,
      valid: false,
      errors,
      warnings,
      tips,
    }
  }

  // Try IPv6
  if (trimmed.includes(':')) {
    const { errors, warnings, tips } = detectIPv6Errors(trimmed)
    if (!errors.length) {
      const classification = classifyIP(trimmed)
      const ptr = generatePTR(trimmed)
      return {
        input: trimmed,
        version: 6,
        valid: true,
        errors,
        warnings,
        tips,
        classification,
        ptr,
      }
    }
    return {
      input: trimmed,
      version: 6,
      valid: false,
      errors,
      warnings,
      tips,
    }
  }

  return {
    input: trimmed,
    valid: false,
    errors: ['Input does not appear to be an IPv4 or IPv6 address'],
  }
}
