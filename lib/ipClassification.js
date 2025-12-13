/**
 * RFC Classification System for IPv4 and IPv6
 * Classifies IPs according to RFC standards
 */

import { ipv4ToInteger, isValidIPv4 } from './ipv4Utils'
import { isValidIPv6, expandIPv6, normalizeIPv6WithIPv4Notation } from './ipv6Utils'

/**
 * Classifies IPv4 address according to RFCs
 */
export function classifyIPv4(ip) {
  if (!isValidIPv4(ip)) return null

  const int = ipv4ToInteger(ip)

  // 0.0.0.0/8 - Current Network (RFC 1122)
  if (int >= 0 && int <= 16777215) {
    return {
      type: 'Current Network',
      subtype: 'This Host/Network',
      rfc: 'RFC 1122',
      scope: 'This Network',
      isPrivate: true,
    }
  }

  // 10.0.0.0/8 - Private Network (RFC 1918)
  if (int >= 167772160 && int <= 184549375) {
    return {
      type: 'Private',
      subtype: 'Class A Private',
      rfc: 'RFC 1918',
      scope: 'Private Network',
      isPrivate: true,
      range: '10.0.0.0 - 10.255.255.255',
    }
  }

  // 127.0.0.0/8 - Loopback (RFC 1122)
  if (int >= 2130706432 && int <= 2147483647) {
    return {
      type: 'Loopback',
      subtype: 'Local Loopback',
      rfc: 'RFC 1122',
      scope: 'This Host',
      isLoopback: true,
    }
  }

  // 169.254.0.0/16 - Link-Local / APIPA (RFC 3927)
  if (int >= 2851995648 && int <= 2852061183) {
    return {
      type: 'Link-Local',
      subtype: 'APIPA (Automatic Private IP Addressing)',
      rfc: 'RFC 3927',
      scope: 'Link-Local',
      isLinkLocal: true,
    }
  }

  // 172.16.0.0/12 - Private Network (RFC 1918)
  if (int >= 2886729728 && int <= 2887778303) {
    return {
      type: 'Private',
      subtype: 'Class B Private',
      rfc: 'RFC 1918',
      scope: 'Private Network',
      isPrivate: true,
      range: '172.16.0.0 - 172.31.255.255',
    }
  }

  // 192.0.0.0/24 - Documentation/TEST-NET-1 (RFC 5737)
  if (int >= 3221225472 && int <= 3221225727) {
    return {
      type: 'Documentation',
      subtype: 'TEST-NET-1',
      rfc: 'RFC 5737',
      scope: 'Documentation/Examples',
      isDocumentation: true,
    }
  }

  // 192.0.2.0/24 - Documentation (RFC 5737)
  if (int >= 3221226240 && int <= 3221226495) {
    return {
      type: 'Documentation',
      subtype: 'TEST-NET-2',
      rfc: 'RFC 5737',
      scope: 'Documentation/Examples',
      isDocumentation: true,
    }
  }

  // 192.168.0.0/16 - Private Network (RFC 1918)
  if (int >= 3232235520 && int <= 3232301055) {
    return {
      type: 'Private',
      subtype: 'Class C Private',
      rfc: 'RFC 1918',
      scope: 'Private Network',
      isPrivate: true,
      range: '192.168.0.0 - 192.168.255.255',
    }
  }

  // 198.18.0.0/15 - Benchmarking (RFC 2544)
  if (int >= 3232235776 && int <= 3232236031) {
    return {
      type: 'Benchmarking',
      subtype: 'Performance Testing',
      rfc: 'RFC 2544',
      scope: 'Benchmarking',
    }
  }

  // 198.51.100.0/24 - Documentation (RFC 5737)
  if (int >= 3325256704 && int <= 3325256959) {
    return {
      type: 'Documentation',
      subtype: 'TEST-NET-3',
      rfc: 'RFC 5737',
      scope: 'Documentation/Examples',
      isDocumentation: true,
    }
  }

  // 203.0.113.0/24 - Documentation (RFC 5737)
  if (int >= 3405691776 && int <= 3405692031) {
    return {
      type: 'Documentation',
      subtype: 'TEST-NET-3',
      rfc: 'RFC 5737',
      scope: 'Documentation/Examples',
      isDocumentation: true,
    }
  }

  // 224.0.0.0/4 - Multicast (RFC 5771)
  if (int >= 3758096384 && int <= 4026531839) {
    const subtype = classifyMulticast(ip)
    return {
      type: 'Multicast',
      subtype,
      rfc: 'RFC 5771',
      scope: 'Multicast',
      isMulticast: true,
    }
  }

  // 240.0.0.0/4 - Reserved (RFC 1112)
  if (int >= 4026531840 && int <= 4294967295) {
    return {
      type: 'Reserved',
      subtype: 'Future Use',
      rfc: 'RFC 1112',
      scope: 'Reserved',
    }
  }

  // Public IP
  return {
    type: 'Public',
    subtype: 'Global Unicast',
    rfc: null,
    scope: 'Public Internet',
    isPrivate: false,
  }
}

/**
 * Classifies IPv6 address according to RFCs
 */
export function classifyIPv6(ip) {
  if (!isValidIPv6(ip)) return null

  let expanded = expandIPv6(ip).toLowerCase()
  // ISSUE 3 FIX: Normalize IPv4-mapped addresses (::ffff:192.168.1.1 -> ::ffff:c0a8:0101)
  expanded = normalizeIPv6WithIPv4Notation(expanded)

  const compressed = ip.toLowerCase()

  // :: - Unspecified (RFC 4291)
  if (compressed === '::') {
    return {
      type: 'Unspecified',
      subtype: 'Unspecified Address',
      rfc: 'RFC 4291',
      scope: 'This Host',
    }
  }

  // ::1 - Loopback (RFC 4291)
  if (compressed === '::1') {
    return {
      type: 'Loopback',
      subtype: 'Loopback Address',
      rfc: 'RFC 4291',
      scope: 'This Host',
      isLoopback: true,
    }
  }

  // ::ffff:0:0/96 - IPv4-mapped IPv6 (RFC 4291)
  if (expanded.startsWith('0000:0000:0000:0000:0000:ffff:')) {
    return {
      type: 'IPv4-mapped IPv6',
      subtype: 'IPv4-mapped',
      rfc: 'RFC 4291',
      scope: 'IPv4/IPv6 Transition',
      isMapped: true,
      isDualStack: true,
    }
  }

  // fe80::/10 - Link-Local (RFC 4291)
  if (expanded.startsWith('fe80:')) {
    return {
      type: 'Link-Local',
      subtype: 'Link-Local Unicast',
      rfc: 'RFC 4291',
      scope: 'Link-Local',
      isLinkLocal: true,
    }
  }

  // fc00::/7 - Unique Local (RFC 4193)
  if (expanded.startsWith('fc') || expanded.startsWith('fd')) {
    return {
      type: 'Unique Local',
      subtype: 'Unique Local Address (ULA)',
      rfc: 'RFC 4193',
      scope: 'Private Network',
      isPrivate: true,
    }
  }

  // ff00::/8 - Multicast (RFC 4291)
  if (expanded.startsWith('ff')) {
    const multicastType = classifyIPv6Multicast(expanded)
    return {
      type: 'Multicast',
      subtype: multicastType,
      rfc: 'RFC 4291',
      scope: 'Multicast',
      isMulticast: true,
    }
  }

  // 2001:db8::/32 - Documentation (RFC 3849)
  if (expanded.startsWith('2001:0db8:')) {
    return {
      type: 'Documentation',
      subtype: 'Documentation Prefix',
      rfc: 'RFC 3849',
      scope: 'Documentation/Examples',
      isDocumentation: true,
    }
  }

  // 2001::/32 - TEREDO (RFC 4380)
  if (expanded.startsWith('2001:0000:')) {
    return {
      type: 'Transition',
      subtype: 'TEREDO Tunneling',
      rfc: 'RFC 4380',
      scope: 'IPv4/IPv6 Transition',
    }
  }

  // 2002::/16 - 6to4 (RFC 3056)
  if (expanded.startsWith('2002:')) {
    return {
      type: 'Transition',
      subtype: '6to4 Tunneling',
      rfc: 'RFC 3056',
      scope: 'IPv4/IPv6 Transition',
    }
  }

  // Public Global Unicast
  return {
    type: 'Global Unicast',
    subtype: 'Public IPv6',
    rfc: 'RFC 4291',
    scope: 'Public Internet',
    isPrivate: false,
  }
}

/**
 * Classifies multicast address within 224.0.0.0/4
 */
function classifyMulticast(ip) {
  const parts = ip.split('.')
  const secondOctet = parseInt(parts[1], 10)
  const thirdOctet = parseInt(parts[2], 10)

  if (secondOctet === 0 && thirdOctet === 0) {
    return 'Local Network Multicast'
  }

  if (ip === '224.0.0.1') {
    return 'All Hosts (Local)'
  }

  if (ip === '224.0.0.2') {
    return 'All Routers (Local)'
  }

  if (secondOctet >= 1 && secondOctet <= 127) {
    return 'Global Multicast'
  }

  if (secondOctet >= 128 && secondOctet <= 191) {
    return 'Source-Specific Multicast (SSM)'
  }

  return 'Multicast Address'
}

/**
 * Classifies IPv6 multicast scopes
 */
function classifyIPv6Multicast(expanded) {
  const scopeHexChar = expanded[3]

  const scopeMap = {
    '0': 'Reserved',
    '1': 'Interface-Local',
    '2': 'Link-Local',
    '3': 'Realm-Local',
    '4': 'Admin-Local',
    '5': 'Site-Local',
    '8': 'Organization-Local',
    'e': 'Global',
    'f': 'Reserved',
  }

  return scopeMap[scopeHexChar] || 'Multicast'
}

/**
 * Comprehensive classification for any IP (IPv4 or IPv6)
 */
export function classifyIP(ip) {
  if (!ip || typeof ip !== 'string') return null

  const trimmed = ip.trim()

  if (isValidIPv4(trimmed)) {
    return {
      version: 4,
      ...classifyIPv4(trimmed),
    }
  }

  if (isValidIPv6(trimmed)) {
    return {
      version: 6,
      ...classifyIPv6(trimmed),
    }
  }

  return null
}
