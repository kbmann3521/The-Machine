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
      return res.status(200).json({
        domainExists: true,
        mxRecords: addresses.map(record => ({
          priority: record.priority,
          hostname: record.exchange
        }))
      })
    } else {
      return res.status(200).json({
        domainExists: false,
        mxRecords: []
      })
    }
  } catch (error) {
    return res.status(200).json({
      domainExists: false,
      mxRecords: [],
      error: 'Domain does not exist or has no MX records'
    })
  }
}
