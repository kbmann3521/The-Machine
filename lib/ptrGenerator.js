/**
 * PTR Pointer Generator
 * Generates reverse DNS names for IPv4 and IPv6 addresses
 */

import { isValidIPv4, normalizeIPv4 } from './ipv4Utils'
import { isValidIPv6, expandIPv6 } from './ipv6Utils'

/**
 * Generates IPv4 PTR record (reverse DNS)
 * e.g., 192.168.1.1 -> 1.1.168.192.in-addr.arpa
 */
export function generateIPv4PTR(ip) {
  if (!isValidIPv4(ip)) return null

  const normalized = normalizeIPv4(ip)
  const parts = normalized.split('.')

  // Reverse the octets and append .in-addr.arpa
  return `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`
}

/**
 * Generates IPv6 PTR record (reverse DNS)
 * e.g., 2001:db8::1 -> 1.0.0.0.0.0.0.0... .ip6.arpa
 * Reverses nibbles and appends .ip6.arpa
 */
export function generateIPv6PTR(ip) {
  if (!isValidIPv6(ip)) return null

  const expanded = expandIPv6(ip).toLowerCase()

  // Remove colons
  const hex = expanded.replace(/:/g, '')

  // Reverse nibbles
  const nibbles = hex.split('').reverse().join('.')

  return `${nibbles}.ip6.arpa`
}

/**
 * Generates PTR for any IP address (IPv4 or IPv6)
 */
export function generatePTR(ip) {
  if (!ip || typeof ip !== 'string') return null

  const trimmed = ip.trim()

  if (isValidIPv4(trimmed)) {
    return {
      version: 4,
      ptr: generateIPv4PTR(trimmed),
      type: 'in-addr.arpa',
    }
  }

  if (isValidIPv6(trimmed)) {
    return {
      version: 6,
      ptr: generateIPv6PTR(trimmed),
      type: 'ip6.arpa',
    }
  }

  return null
}

/**
 * Parses reverse DNS name and extracts original IP
 * e.g., 1.1.168.192.in-addr.arpa -> 192.168.1.1
 */
export function parseIPv4PTR(ptr) {
  if (!ptr || typeof ptr !== 'string') return null

  const trimmed = ptr.trim().toLowerCase()

  // Check if it ends with .in-addr.arpa
  if (!trimmed.endsWith('.in-addr.arpa')) {
    return null
  }

  // Remove .in-addr.arpa
  const reversed = trimmed.substring(0, trimmed.length - 13)

  // Split by dots
  const parts = reversed.split('.')

  // Should have 4 octets
  if (parts.length !== 4) {
    return null
  }

  // Validate each part is a number 0-255
  const valid = parts.every(part => {
    const num = parseInt(part, 10)
    return !Number.isNaN(num) && num >= 0 && num <= 255
  })

  if (!valid) {
    return null
  }

  // Reverse back to normal order
  return `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}`
}

/**
 * Parses IPv6 reverse DNS name
 * e.g., 1.0.0.0.0... .ip6.arpa -> 2001:db8::1
 */
export function parseIPv6PTR(ptr) {
  if (!ptr || typeof ptr !== 'string') return null

  const trimmed = ptr.trim().toLowerCase()

  // Check if it ends with .ip6.arpa
  if (!trimmed.endsWith('.ip6.arpa')) {
    return null
  }

  // Remove .ip6.arpa
  const nibbles = trimmed.substring(0, trimmed.length - 9)

  // Replace dots with nothing to get hex
  const reversedHex = nibbles.replace(/\./g, '')

  // Reverse to get original hex
  const hex = reversedHex.split('').reverse().join('')

  // Validate hex string (32 characters)
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    return null
  }

  // Convert to IPv6 format (add colons every 4 characters)
  const groups = []
  for (let i = 0; i < 8; i++) {
    groups.push(hex.substring(i * 4, i * 4 + 4))
  }

  return groups.join(':')
}

/**
 * Parses any reverse DNS name (IPv4 or IPv6)
 */
export function parsePTR(ptr) {
  if (!ptr || typeof ptr !== 'string') return null

  const trimmed = ptr.trim().toLowerCase()

  if (trimmed.endsWith('.in-addr.arpa')) {
    const ip = parseIPv4PTR(ptr)
    if (ip) {
      return {
        version: 4,
        ip,
        type: 'in-addr.arpa',
      }
    }
  }

  if (trimmed.endsWith('.ip6.arpa')) {
    const ip = parseIPv6PTR(ptr)
    if (ip) {
      return {
        version: 6,
        ip,
        type: 'ip6.arpa',
      }
    }
  }

  return null
}
