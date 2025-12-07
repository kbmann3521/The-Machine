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
    // Set a timeout for DNS lookup
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS lookup timeout')), 5000)
    )

    const addresses = await Promise.race([
      dns.resolveMx(domain),
      timeoutPromise
    ])

    if (addresses && addresses.length > 0) {
      const mxRecords = addresses
        .map(record => {
          // Node.js dns.resolveMx returns objects with 'exchange' property
          // Ensure we extract it properly
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

      return res.status(200).json({
        domainExists: true,
        mxRecords: mxRecords,
        success: true
      })
    } else {
      return res.status(200).json({
        domainExists: false,
        mxRecords: [],
        success: true
      })
    }
  } catch (error) {
    // Try A record lookup as fallback
    try {
      const aRecords = await dns.resolve4(domain)
      if (aRecords && aRecords.length > 0) {
        return res.status(200).json({
          domainExists: true,
          mxRecords: [],
          aRecords: aRecords,
          note: 'Domain has A records but no MX records',
          success: true
        })
      }
    } catch (aError) {
      // Fall through
    }

    return res.status(200).json({
      domainExists: false,
      mxRecords: [],
      error: 'DNS lookup failed',
      success: true
    })
  }
}
