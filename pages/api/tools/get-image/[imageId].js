import sharp from 'sharp'

export default async function handler(req, res) {
  const { imageId } = req.query

  if (!imageId) {
    return res.status(400).json({ error: 'No image ID provided' })
  }

  try {
    // Retrieve image from cache
    const imageCache = global.imageCache || {}
    const cacheEntry = imageCache[imageId]

    if (!cacheEntry) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Check expiration
    if (cacheEntry.expiresAt && cacheEntry.expiresAt < Date.now()) {
      delete imageCache[imageId]
      return res.status(410).json({ error: 'Image has expired' })
    }

    // Parse transformation parameters
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`)
    
    const width = searchParams.get('w') ? parseInt(searchParams.get('w'), 10) : null
    const height = searchParams.get('h') ? parseInt(searchParams.get('h'), 10) : null
    const scale = searchParams.get('scale') ? parseInt(searchParams.get('scale'), 10) : 100
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q'), 10) : 80

    // Convert data URL to buffer
    const base64Data = cacheEntry.imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Get metadata to calculate dimensions
    const metadata = await sharp(buffer).metadata()

    // Calculate target dimensions
    const scaleRatio = scale / 100
    let resizeWidth = width ? Math.round(width * scaleRatio) : metadata.width
    let resizeHeight = height ? Math.round(height * scaleRatio) : metadata.height

    // Clamp to max image size
    const maxDim = Math.max(metadata.width, metadata.height)
    if (resizeWidth > metadata.width) resizeWidth = metadata.width
    if (resizeHeight > metadata.height) resizeHeight = metadata.height

    // Apply transformation
    const outputBuffer = await sharp(buffer)
      .resize(resizeWidth, resizeHeight, {
        fit: 'cover',
        position: 'center',
        withoutEnlargement: true,
      })
      .jpeg({ quality: Math.min(Math.max(quality, 10), 100) })
      .toBuffer()

    // Set response headers for caching (1 hour)
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600, immutable')
    res.setHeader('Content-Length', outputBuffer.length)

    res.status(200).send(outputBuffer)
  } catch (error) {
    console.error('Image retrieval error:', error)
    res.status(500).json({ error: error.message })
  }
}
