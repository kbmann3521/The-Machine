export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.body

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL provided' })
  }

  try {
    const urlObj = new URL(url)
    const redirectChain = []
    let currentUrl = url
    const maxRedirects = 10
    const timeout = 5000

    for (let i = 0; i < maxRedirects; i++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(currentUrl, {
          method: 'HEAD',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (URL Toolkit Redirect Detector)',
          },
        })

        clearTimeout(timeoutId)

        redirectChain.push({
          url: currentUrl,
          status: response.status,
          statusText: response.statusText,
          isRedirect: [301, 302, 303, 307, 308].includes(response.status),
        })

        // Check for redirect
        const location = response.headers.get('location')
        if (location && [301, 302, 303, 307, 308].includes(response.status)) {
          // Resolve relative URLs
          try {
            currentUrl = new URL(location, currentUrl).href
          } catch (e) {
            break
          }
        } else {
          // Not a redirect, we're done
          break
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          redirectChain.push({
            url: currentUrl,
            status: 'timeout',
            statusText: 'Request timeout',
            isRedirect: false,
          })
        } else {
          redirectChain.push({
            url: currentUrl,
            status: 'error',
            statusText: error.message,
            isRedirect: false,
          })
        }
        break
      }
    }

    if (redirectChain.length > maxRedirects) {
      redirectChain.pop()
      redirectChain.push({
        url: 'Max redirects exceeded',
        status: 'error',
        statusText: 'Too many redirects',
        isRedirect: false,
      })
    }

    return res.status(200).json({
      success: true,
      redirectChain,
      chainLength: redirectChain.length,
      finalUrl: redirectChain[redirectChain.length - 1]?.url || url,
      hasRedirects: redirectChain.some(r => r.isRedirect),
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to detect redirects: ' + error.message,
    })
  }
}
