const dns = require('dns').promises

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { domain } = req.body

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Domain is required' })
  }

  try {
    // Set a timeout for DNS lookups
    const timeoutMs = 5000
    const createTimeoutPromise = () => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS lookup timeout')), timeoutMs)
    )

    let mxRecords = []
    let aRecords = []
    let aaaaRecords = []
    let spfRecord = null
    let dmarcRecord = null
    let mailHostType = null
    let receivable = false
    let domainExists = false

    // 1. Try MX records first
    try {
      const mxResult = await Promise.race([
        dns.resolveMx(domain),
        createTimeoutPromise()
      ])

      if (mxResult && mxResult.length > 0) {
        domainExists = true
        mailHostType = 'mx'
        receivable = true
        mxRecords = mxResult
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
    if (mxRecords.length === 0) {
      try {
        const aResult = await Promise.race([
          dns.resolve4(domain),
          createTimeoutPromise()
        ])

        if (aResult && aResult.length > 0) {
          domainExists = true
          aRecords = aResult.map(ip => ({
            address: ip,
            type: 'A'
          }))

          // Domain has A records but no MX - this is fallback delivery
          if (!mailHostType) {
            mailHostType = 'fallback'
            receivable = true
          }
        }
      } catch (aError) {
        // A lookup failed, try AAAA
      }
    }

    // 3. If no A records, try AAAA records (fallback)
    if (mxRecords.length === 0 && aRecords.length === 0) {
      try {
        const aaaaResult = await Promise.race([
          dns.resolve6(domain),
          createTimeoutPromise()
        ])

        if (aaaaResult && aaaaResult.length > 0) {
          domainExists = true
          aaaaRecords = aaaaResult.map(ip => ({
            address: ip,
            type: 'AAAA'
          }))

          // Domain has AAAA records but no MX - this is fallback delivery
          if (!mailHostType) {
            mailHostType = 'fallback'
            receivable = true
          }
        }
      } catch (aaaaError) {
        // AAAA lookup failed
      }
    }

    // If domain doesn't exist (no MX, A, or AAAA)
    if (!domainExists) {
      mailHostType = 'none'
      receivable = false
    }

    // 4. Try SPF record (TXT record)
    try {
      const txtResult = await Promise.race([
        dns.resolveTxt(domain),
        createTimeoutPromise()
      ])

      if (txtResult && txtResult.length > 0) {
        // SPF records are TXT records starting with 'v=spf1'
        const spfEntry = txtResult.find(record => {
          const txtValue = Array.isArray(record) ? record.join('') : record
          return txtValue.toLowerCase().startsWith('v=spf1')
        })
        if (spfEntry) {
          spfRecord = Array.isArray(spfEntry) ? spfEntry.join('') : spfEntry
        }
      }
    } catch (spfError) {
      // SPF lookup failed, continue
    }

    // 5. Try DMARC record (TXT record at _dmarc subdomain)
    try {
      const dmarcTxtResult = await Promise.race([
        dns.resolveTxt(`_dmarc.${domain}`),
        createTimeoutPromise()
      ])

      if (dmarcTxtResult && dmarcTxtResult.length > 0) {
        // DMARC records start with 'v=DMARC1'
        const dmarcEntry = dmarcTxtResult.find(record => {
          const txtValue = Array.isArray(record) ? record.join('') : record
          return txtValue.toLowerCase().startsWith('v=dmarc1')
        })
        if (dmarcEntry) {
          dmarcRecord = Array.isArray(dmarcEntry) ? dmarcEntry.join('') : dmarcEntry
        }
      }
    } catch (dmarcError) {
      // DMARC lookup failed, continue
    }

    return res.status(200).json({
      domain,
      domainExists,
      mxRecords,
      aRecords,
      aaaaRecords,
      spfRecord,
      dmarcRecord,
      mailHostType,  // 'mx' | 'fallback' | 'none'
      receivable,    // boolean: can receive mail
      success: true
    })
  } catch (error) {
    return res.status(200).json({
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
    })
  }
}
