// API endpoint: /api/fetch-jwks
// Fetches JWKS from issuer URL (server-side to avoid CORS)
// Supports caching with configurable TTL

const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const cache = new Map()

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query

  // Validate URL parameter
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid url parameter' })
  }

  try {
    // Validate it's an HTTPS URL
    const urlObj = new URL(url)
    if (urlObj.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only HTTPS URLs are supported' })
    }

    // Check cache
    const cached = cache.get(url)
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return res.status(200).json(cached.data)
    }

    // Fetch JWKS from the URL
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PioneerWebTools-JWTDecoder/1.0',
      },
      timeout: 5000, // 5 second timeout
    })

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Failed to fetch JWKS: ${response.statusText}`,
      })
    }

    const jwks = await response.json()

    // Validate JWKS structure
    if (!jwks || typeof jwks !== 'object') {
      return res.status(400).json({ error: 'Invalid JWKS format' })
    }

    // Cache the response
    cache.set(url, {
      data: jwks,
      fetchedAt: Date.now(),
    })

    return res.status(200).json(jwks)
  } catch (error) {
    console.error(`[JWKS API] Error fetching ${url}:`, error)

    // Distinguish between different error types
    let errorMessage = 'Failed to fetch JWKS'
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Issuer domain not found'
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused'
    } else if (error.name === 'AbortError') {
      errorMessage = 'Request timeout'
    }

    return res.status(500).json({ error: errorMessage })
  }
}
