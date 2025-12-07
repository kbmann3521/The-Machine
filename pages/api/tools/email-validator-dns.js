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
    const addresses = await dns.resolveMx(domain)

    if (addresses && addresses.length > 0) {
      const mxRecords = addresses.map(record => ({
        priority: record.priority || 0,
        hostname: record.exchange || 'unknown'
      })).sort((a, b) => a.priority - b.priority)

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
