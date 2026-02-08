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

async function resolveCnameSafe(domain) {
  try {
    return await Promise.race([
      dns.resolveCname(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
  } catch (e) {
    // Fallback to Google DoH
    const answers = await googleDohQuery(domain, 'CNAME')
    return answers.map(ans => ans.data.replace(/\.$/, ''))
  }
}

async function resolveNsSafe(domain) {
  try {
    return await Promise.race([
      dns.resolveNs(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
    ])
  } catch (e) {
    // Fallback to Google DoH
    const answers = await googleDohQuery(domain, 'NS')
    return answers.map(ans => ans.data.replace(/\.$/, ''))
  }
}

async function resolveDnskeySafe(domain) {
  try {
    // Google DoH is most reliable for DNSKEY queries
    const answers = await googleDohQuery(domain, 'DNSKEY')
    return answers.length > 0 // Return true if DNSKEY records exist
  } catch (e) {
    // If DNSKEY lookup fails, assume DNSSEC not enabled
    return false
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

function isReputableNsProvider(nameserver) {
  if (!nameserver) return false

  const ns = nameserver.toLowerCase()

  // Major DNS providers (reputable, enterprise-grade)
  const reputableProviders = [
    // Cloudflare
    'cloudflare.com',
    'ns1.cloudflare.com',
    'ns2.cloudflare.com',
    'ns3.cloudflare.com',
    'ns4.cloudflare.com',

    // AWS Route 53
    'awsdns',

    // Google Cloud DNS & Google Domains
    'ns-cloud-',
    'google.com',
    'googledomains.com',

    // Akamai
    'akam.net',
    'akamaized.net',

    // Azure / Microsoft
    'ns1.microsoft.com',
    'ns2.microsoft.com',
    'ns3.microsoft.com',

    // Namecheap
    'namecheap.com',

    // GoDaddy
    'secureserver.net',
    'domaincontrol.com',

    // Network Solutions
    'networksolutions.com',

    // DNSimple
    'dnsimple.com',

    // Rackspace
    'rackspace.com',

    // Linode
    'linode.com',

    // Digitalocean
    'digitalocean.com',

    // Vultr
    'vultr.com',

    // DirectNIC
    'directnic.com',

    // Quad9
    'quad9.net'
  ]

  return reputableProviders.some(provider => ns.includes(provider))
}

async function lookupDomainRecords(domain) {
  const result = {
    domain,
    domainExists: false,
    mxRecords: [],
    aRecords: [],
    aaaaRecords: [],
    nsRecords: [],
    spfRecord: null,
    dmarcRecord: null,
    dnssecEnabled: false,
    mailHostType: null,
    receivable: false
  }

  // 1. Parallelize initial lookups (MX, A, AAAA, SPF, DMARC, NS, DNSSEC all at once)
  const [mxResult, aResult, aaaaResult, txtResult, dmarcTxtResult, nsResult, dnssecResult] = await Promise.allSettled([
    resolveMxSafe(domain),
    resolve4Safe(domain),
    resolve6Safe(domain),
    resolveTxtSafe(domain),
    resolveTxtSafe(`_dmarc.${domain}`),
    resolveNsSafe(domain),
    resolveDnskeySafe(domain)
  ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null))

  // Process MX records
  if (mxResult && mxResult.length > 0) {
    result.domainExists = true
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
          hostname: String(hostname).trim(),
          isCname: false // Will be updated after CNAME check
        }
      })
      .filter(record => record.hostname.length > 0) // Only keep records with non-empty hostnames
      .sort((a, b) => a.priority - b.priority)

    // Parallelize CNAME checks for all MX records at once
    const cnameChecks = result.mxRecords.map(mxRecord =>
      resolveCnameSafe(mxRecord.hostname)
        .then(cnames => {
          if (cnames && cnames.length > 0) {
            mxRecord.isCname = true
          }
        })
        .catch(() => {
          // If CNAME lookup fails, assume it's not a CNAME
        })
    )
    await Promise.all(cnameChecks)

    // Only set as 'mx' if we have valid MX records with hostnames
    if (result.mxRecords.length > 0) {
      result.mailHostType = 'mx'
      result.receivable = true
    }
  }

  // Process A records (fallback if no MX)
  if (result.mxRecords.length === 0 && aResult && aResult.length > 0) {
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

  // Process AAAA records (fallback if no MX and A)
  if (result.mxRecords.length === 0 && result.aRecords.length === 0 && aaaaResult && aaaaResult.length > 0) {
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

  // If domain doesn't exist (no MX, A, or AAAA)
  if (!result.domainExists) {
    result.mailHostType = 'none'
    result.receivable = false
  }

  // Process SPF record
  if (txtResult && txtResult.length > 0) {
    const spfEntry = txtResult.find(record => {
      const txtValue = Array.isArray(record) ? record.join('') : record
      return txtValue.toLowerCase().startsWith('v=spf1')
    })
    if (spfEntry) {
      result.spfRecord = Array.isArray(spfEntry) ? spfEntry.join('') : spfEntry
    }
  }

  // Process DMARC record
  if (dmarcTxtResult && dmarcTxtResult.length > 0) {
    const dmarcEntry = dmarcTxtResult.find(record => {
      const txtValue = Array.isArray(record) ? record.join('') : record
      return txtValue.toLowerCase().startsWith('v=dmarc1')
    })
    if (dmarcEntry) {
      result.dmarcRecord = Array.isArray(dmarcEntry) ? dmarcEntry.join('') : dmarcEntry
    }
  }

  // Process NS records
  if (nsResult && nsResult.length > 0) {
    result.nsRecords = nsResult.map(ns => {
      // Normalize NS name (remove trailing dot)
      const normalized = typeof ns === 'string' ? ns.replace(/\.$/, '') : ns
      return {
        nameserver: normalized
      }
    })
  }

  // Process DNSSEC
  result.dnssecEnabled = dnssecResult === true

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
    // Check if this is a subdomain
    const parentDomain = getParentDomain(domain)

    // Parallelize domain and parent domain lookups
    const [domainResult, parentDomainResult] = await Promise.allSettled([
      lookupDomainRecords(domain),
      parentDomain ? lookupDomainRecords(parentDomain) : Promise.resolve(null)
    ]).then(results => [
      results[0].status === 'fulfilled' ? results[0].value : null,
      results[1].status === 'fulfilled' ? results[1].value : null
    ])

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
      nsRecords: [],
      spfRecord: null,
      dmarcRecord: null,
      dnssecEnabled: false,
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
