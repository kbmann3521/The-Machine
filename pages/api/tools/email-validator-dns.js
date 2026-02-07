const dns = require('dns').promises

// Get fetch (built-in for Node 18+, otherwise use node-fetch)
let fetchFn = fetch
try {
  if (typeof fetch === 'undefined') {
    fetchFn = require('node-fetch')
  }
} catch (e) {
  // Fetch not available, will fallback gracefully
}

// Helper function to query Google's public DNS API (DoH - DNS over HTTPS)
async function googleDohQuery(name, type) {
  if (typeof fetchFn === 'undefined') {
    throw new Error('fetch not available')
  }

  const url = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`
  const response = await fetchFn(url)
  if (!response.ok) throw new Error(`DNS query failed for ${name}`)
  const data = await response.json()
  return data.Answer || []
}

// Try to resolve using Node dns, fallback to Google DoH if it fails
async function resolveMxSafe(domain) {
  try {
    return await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
  } catch (e) {
    // Fallback to Google DoH
    const answers = await googleDohQuery(domain, 'MX')
    return answers.map(ans => ({
      exchange: ans.data.split(' ').slice(1).join(' ').replace(/\.$/, ''),
      priority: parseInt(ans.data.split(' ')[0])
    }))
  }
}

async function resolveTxtSafe(domain) {
  try {
    return await Promise.race([
      dns.resolveTxt(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
  } catch (e) {
    // Fallback to Google DoH
    const answers = await googleDohQuery(domain, 'TXT')
    // Google DoH returns: { data: "\"v=spf1 ...\"" }
    // Node's resolveTxt returns: [['v=spf1 ...']]
    // Convert to match Node format
    return answers.map(ans => {
      // Remove outer quotes from Google's response
      const cleaned = ans.data.replace(/^"(.*)"$/s, '$1')
      return [cleaned]
    })
  }
}

async function resolve4Safe(domain) {
  try {
    return await Promise.race([
      dns.resolve4(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
  } catch (e) {
    // Fallback to Google DoH
    const answers = await googleDohQuery(domain, 'A')
    return answers.map(ans => ans.data)
  }
}

async function resolve6Safe(domain) {
  try {
    return await Promise.race([
      dns.resolve6(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
  } catch (e) {
    // Fallback to Google DoH
    const answers = await googleDohQuery(domain, 'AAAA')
    return answers.map(ans => ans.data)
  }
}

function getParentDomain(domain) {
  const parts = domain.split('.')
  // Only extract parent if domain has more than 2 parts (is a subdomain)
  if (parts.length > 2) {
    return parts.slice(1).join('.')
  }
  return null
}

async function lookupDomainRecords(domain) {
  const result = {
    domain,
    domainExists: false,
    mxRecords: [],
    aRecords: [],
    aaaaRecords: [],
    spfRecord: null,
    dmarcRecord: null,
    mailHostType: null,
    receivable: false
  }

  // 1. Try MX records first
  try {
    const mxResult = await resolveMxSafe(domain)

    if (mxResult && mxResult.length > 0) {
      result.domainExists = true
      result.mailHostType = 'mx'
      result.receivable = true
      result.mxRecords = mxResult
        .map(record => {
          let hostname = ''
          if (typeof record === 'object') {
            hostname = record.exchange || record.hostname || ''
          } else if (typeof record === 'string') {
            hostname = record
          }

          return {
            priority: typeof record.priority === 'number' ? record.priority : parseInt(record.priority) || 10,
            hostname: String(hostname).trim()
          }
        })
        .sort((a, b) => a.priority - b.priority)
    }
  } catch (mxError) {
    // MX lookup failed, will try A/AAAA fallback
  }

  // 2. If no MX records, try A records (fallback)
  if (result.mxRecords.length === 0) {
    try {
      const aResult = await resolve4Safe(domain)

      if (aResult && aResult.length > 0) {
        result.domainExists = true
        result.aRecords = aResult.map(ip => ({
          address: ip,
          type: 'A'
        }))

        // Domain has A records but no MX - this is fallback delivery
        if (!result.mailHostType) {
          result.mailHostType = 'fallback'
          result.receivable = true
        }
      }
    } catch (aError) {
      // A lookup failed, try AAAA
    }
  }

  // 3. If no A records, try AAAA records (fallback)
  if (result.mxRecords.length === 0 && result.aRecords.length === 0) {
    try {
      const aaaaResult = await resolve6Safe(domain)

      if (aaaaResult && aaaaResult.length > 0) {
        result.domainExists = true
        result.aaaaRecords = aaaaResult.map(ip => ({
          address: ip,
          type: 'AAAA'
        }))

        // Domain has AAAA records but no MX - this is fallback delivery
        if (!result.mailHostType) {
          result.mailHostType = 'fallback'
          result.receivable = true
        }
      }
    } catch (aaaaError) {
      // AAAA lookup failed
    }
  }

  // If domain doesn't exist (no MX, A, or AAAA)
  if (!result.domainExists) {
    result.mailHostType = 'none'
    result.receivable = false
  }

  // 4. Try SPF record (TXT record)
  try {
    const txtResult = await resolveTxtSafe(domain)

    if (txtResult && txtResult.length > 0) {
      // SPF records are TXT records starting with 'v=spf1'
      const spfEntry = txtResult.find(record => {
        const txtValue = Array.isArray(record) ? record.join('') : record
        return txtValue.toLowerCase().startsWith('v=spf1')
      })
      if (spfEntry) {
        result.spfRecord = Array.isArray(spfEntry) ? spfEntry.join('') : spfEntry
      }
    }
  } catch (spfError) {
    // SPF lookup failed, continue
  }

  // 5. Try DMARC record (TXT record at _dmarc subdomain)
  try {
    const dmarcTxtResult = await resolveTxtSafe(`_dmarc.${domain}`)

    if (dmarcTxtResult && dmarcTxtResult.length > 0) {
      // DMARC records start with 'v=DMARC1'
      const dmarcEntry = dmarcTxtResult.find(record => {
        const txtValue = Array.isArray(record) ? record.join('') : record
        return txtValue.toLowerCase().startsWith('v=dmarc1')
      })
      if (dmarcEntry) {
        result.dmarcRecord = Array.isArray(dmarcEntry) ? dmarcEntry.join('') : dmarcEntry
      }
    }
  } catch (dmarcError) {
    // DMARC lookup failed, continue
  }

  return result
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { domain } = req.body

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Domain is required' })
  }

  try {
    // Look up the email domain
    const domainResult = await lookupDomainRecords(domain)

    // Check if this is a subdomain and look up parent
    const parentDomain = getParentDomain(domain)
    let parentDomainResult = null

    if (parentDomain) {
      parentDomainResult = await lookupDomainRecords(parentDomain)
    }

    return res.status(200).json({
      ...domainResult,
      parentDomain: parentDomainResult,
      success: true
    })
  } catch (error) {
    const errorResult = {
      domain,
      domainExists: false,
      mxRecords: [],
      aRecords: [],
      aaaaRecords: [],
      spfRecord: null,
      dmarcRecord: null,
      mailHostType: 'none',
      receivable: false,
      error: error.message || 'DNS lookup failed',
      success: true
    }

    const parentDomain = getParentDomain(domain)
    if (parentDomain) {
      errorResult.parentDomain = {
        domain: parentDomain,
        domainExists: false,
        mxRecords: [],
        aRecords: [],
        aaaaRecords: [],
        spfRecord: null,
        dmarcRecord: null,
        mailHostType: 'none',
        receivable: false
      }
    }

    return res.status(200).json(errorResult)
  }
}
