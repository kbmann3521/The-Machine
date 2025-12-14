/**
 * Real-time IP input type detection
 * Identifies what type of IP input the user is entering (IPv4, IPv6, CIDR, Range, etc.)
 */

import { isValidIPv4, parseCIDR } from './ipv4Utils'
import { isValidIPv6 } from './ipv6Utils'

export function detectIPInputType(input) {
  if (!input || typeof input !== 'string') {
    return null
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  // Check for CIDR notation (IPv4 or IPv6)
  if (trimmed.includes('/')) {
    const parsed = parseCIDR(trimmed)
    if (parsed && !parsed.error) {
      const version = isValidIPv4(parsed.address) ? '4' : isValidIPv6(parsed.address) ? '6' : null
      if (version) {
        return {
          type: 'CIDR',
          description: `IPv${version} CIDR notation (/${parsed.prefix})`,
          version: parseInt(version),
          confidence: 0.95,
        }
      }
    }
  }

  // Check for IP range (e.g., "192.168.1.1 - 192.168.1.10" or "192.168.1.1-192.168.1.10")
  const rangeMatch = trimmed.match(/^([0-9a-fA-F:.]+)\s*[-–—]\s*([0-9a-fA-F:.]+)$/)
  if (rangeMatch) {
    const [, startIP, endIP] = rangeMatch
    const startValid = isValidIPv4(startIP) || isValidIPv6(startIP)
    const endValid = isValidIPv4(endIP) || isValidIPv6(endIP)

    if (startValid && endValid) {
      const version = isValidIPv4(startIP) ? '4' : '6'
      return {
        type: 'Range',
        description: `IPv${version} address range`,
        version: parseInt(version),
        confidence: 0.95,
      }
    }
  }

  // Check for single IPv4
  if (isValidIPv4(trimmed)) {
    // Additional detection for what kind of IPv4
    const octets = trimmed.split('.')
    const isCIDRCandidate = trimmed.includes('.')

    return {
      type: 'IPv4',
      description: 'Single IPv4 address',
      version: 4,
      confidence: 0.99,
    }
  }

  // Check for single IPv6
  if (isValidIPv6(trimmed)) {
    const isCompressed = !trimmed.includes('::') || trimmed.split(':').length < 8
    const format = isCompressed ? 'compressed' : 'expanded'

    return {
      type: 'IPv6',
      description: `Single IPv6 address (${format})`,
      version: 6,
      confidence: 0.99,
    }
  }

  // Detect partial/candidate input for real-time feedback
  // IPv4 candidate
  const ipv4Candidate = /^(\d{1,3})(\.(\d{1,3})){0,3}(\.\d{0,3})?$/.test(trimmed)
  if (ipv4Candidate && trimmed.match(/^\d/)) {
    return {
      type: 'IPv4 Candidate',
      description: 'Looks like IPv4 address',
      version: 4,
      confidence: 0.7,
      isPartial: true,
    }
  }

  // IPv6 candidate
  const ipv6Candidate = /^[0-9a-fA-F:]*:?[0-9a-fA-F:]*$/.test(trimmed)
  if (ipv6Candidate && trimmed.includes(':')) {
    return {
      type: 'IPv6 Candidate',
      description: 'Looks like IPv6 address',
      version: 6,
      confidence: 0.7,
      isPartial: true,
    }
  }

  // CIDR candidate
  const cidrCandidate = /\/\d{1,3}$/.test(trimmed)
  if (cidrCandidate) {
    const baseIP = trimmed.split('/')[0]
    const prefix = trimmed.split('/')[1]

    if (isValidIPv4(baseIP) || isValidIPv6(baseIP)) {
      const version = isValidIPv4(baseIP) ? '4' : '6'
      return {
        type: 'CIDR Candidate',
        description: `IPv${version} CIDR notation (/${prefix})`,
        version: parseInt(version),
        confidence: 0.85,
        isPartial: true,
      }
    }
  }

  // Range candidate
  const rangeCandidateMatch = trimmed.match(/^([0-9a-fA-F:.]+)\s*[-–—]\s*/)
  if (rangeCandidateMatch) {
    const startIP = rangeCandidateMatch[1]
    if (isValidIPv4(startIP) || isValidIPv6(startIP)) {
      const version = isValidIPv4(startIP) ? '4' : '6'
      return {
        type: 'Range Candidate',
        description: `IPv${version} address range`,
        version: parseInt(version),
        confidence: 0.8,
        isPartial: true,
      }
    }
  }

  return null
}
