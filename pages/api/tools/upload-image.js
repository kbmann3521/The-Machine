export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageData } = req.body

    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' })
    }

    // Generate a unique ID for this image
    const imageId = Date.now() + Math.random().toString(36).substr(2, 9)
    
    // Create expiration timestamp (1 hour from now)
    const expiresAt = Date.now() + (60 * 60 * 1000) // 1 hour in milliseconds
    
    // Create in-memory cache (in production, use a real database/storage)
    global.imageCache = global.imageCache || {}
    global.imageCache[imageId] = {
      imageData: imageData,
      expiresAt: expiresAt,
      createdAt: Date.now(),
    }

    // Clean up expired images periodically
    cleanupExpiredImages()

    const url = `/api/tools/get-image/${imageId}`

    res.status(200).json({
      success: true,
      url: url,
      imageId: imageId,
      expiresAt: expiresAt,
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({ error: error.message })
  }
}

function cleanupExpiredImages() {
  const now = Date.now()
  const imageCache = global.imageCache || {}
  
  Object.keys(imageCache).forEach(imageId => {
    const cacheEntry = imageCache[imageId]
    if (cacheEntry.expiresAt && cacheEntry.expiresAt < now) {
      delete imageCache[imageId]
    }
  })
}
