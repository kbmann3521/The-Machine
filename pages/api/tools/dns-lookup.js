/**
 * DNS Lookup API
 * Performs A, AAAA, and PTR lookups using Cloudflare DNS-over-HTTPS
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { input } = req.body

  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Invalid input' })
  }

  try {
    const trimmed = input.trim()
    const results = {}

    // Check if input is a hostname or IP
    const isIPv4 = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(trimmed)
    const isIPv6 = /^[0-9a-fA-F:]+$/.test(trimmed)
    const isHostname = !isIPv4 && !isIPv6 && trimmed.includes('.')

    if (isHostname) {
      // Forward DNS lookup (hostname -> IP)
      results.forward = await performForwardDNSLookup(trimmed)
    } else if (isIPv4 || isIPv6) {
      // Reverse DNS lookup (IP -> hostname)
      results.reverse = await performReverseDNSLookup(trimmed)
    }

    return res.status(200).json({ success: true, data: results })
  } catch (error) {
    console.error('DNS lookup error:', error)
    return res.status(500).json({
      error: 'DNS lookup failed',
      message: error.message,
    })
  }
}

/**
 * Performs forward DNS lookup (hostname -> A/AAAA records)
 */
async function performForwardDNSLookup(hostname) {
  const results = {
    hostname,
    aRecords: [],
    aaaaRecords: [],
    metadata: {},
  }

  try {
    // Query A records (IPv4)
    const aResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A&do=false`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    )

    if (!aResponse.ok) {
      throw new Error(`DNS query failed with status ${aResponse.status}`)
    }

    const aData = await aResponse.json()

    if (aData.Answer) {
      results.aRecords = aData.Answer.filter(record => record.type === 1).map(record => ({
        value: record.data,
        ttl: record.TTL,
        type: 'A',
      }))
    }

    results.metadata.aStatus = aData.Status === 0 ? 'NOERROR' : 'ERROR'

    // Query AAAA records (IPv6)
    const aaaaResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=AAAA&do=false`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    )

    if (!aaaaResponse.ok) {
      throw new Error(`DNS query failed with status ${aaaaResponse.status}`)
    }

    const aaaaData = await aaaaResponse.json()

    if (aaaaData.Answer) {
      results.aaaaRecords = aaaaData.Answer.filter(record => record.type === 28).map(record => ({
        value: record.data,
        ttl: record.TTL,
        type: 'AAAA',
      }))
    }

    results.metadata.aaaaStatus = aaaaData.Status === 0 ? 'NOERROR' : 'ERROR'

    // Query MX records for reference
    const mxResponse = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=MX&do=false`,
      {
        headers: {
          'Accept': 'application/dns-json',
        },
      }
    )

    if (mxResponse.ok) {
      const mxData = await mxResponse.json()
      results.hasMX = mxData.Answer && mxData.Answer.length > 0
    }

    return results
  } catch (error) {
    console.error('Forward DNS lookup error:', error)
    return { ...results, error: error.message }
  }
}

/**
 * Performs reverse DNS lookup (IP -> PTR/hostname)
 */
async function performReverseDNSLookup(ip) {
  const results = {
    ip,
    hostname: null,
    metadata: {},
  }

  try {
    // Convert IP to reverse DNS format
    const reverseDomain = ipToReverseDomain(ip)
    if (!reverseDomain) {
      return { ...results, error: 'Invalid IP address format' }
    }

    const response = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(reverseDomain)}&type=PTR`,
      {
        headers: { 'Accept': 'application/json' },
      }
    )
    const data = await response.json()

    if (data.Answer && data.Answer.length > 0) {
      // Extract hostname from PTR record (remove trailing dot)
      results.hostname = data.Answer[0].data.replace(/\.$/, '')
      results.metadata.ttl = data.Answer[0].TTL
    }

    results.metadata.status = data.Status === 0 ? 'NOERROR' : data.Status === 3 ? 'NXDOMAIN' : 'ERROR'

    return results
  } catch (error) {
    console.error('Reverse DNS lookup error:', error)
    return { ...results, error: error.message }
  }
}

/**
 * Converts an IPv4 or IPv6 address to reverse DNS format
 */
function ipToReverseDomain(ip) {
  // IPv4: 192.168.1.1 -> 1.1.168.192.in-addr.arpa
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
  const ipv4Match = ip.match(ipv4Regex)

  if (ipv4Match) {
    const [, a, b, c, d] = ipv4Match
    return `${d}.${c}.${b}.${a}.in-addr.arpa`
  }

  // IPv6: simplified conversion (full implementation would expand :: and reverse nibbles)
  if (ip.includes(':')) {
    // For IPv6, we'd need more complex logic. For now, return basic format.
    // This is a simplified version - full implementation would be more complex
    return null
  }

  return null
}
