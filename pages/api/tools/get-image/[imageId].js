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
    const maxWidth = searchParams.get('maxW') ? parseInt(searchParams.get('maxW'), 10) : null
    const scale = searchParams.get('scale') ? parseInt(searchParams.get('scale'), 10) : null
    const quality = searchParams.get('q') ? parseInt(searchParams.get('q'), 10) : 80
    const maintainAspect = searchParams.get('aspect') === '1'

    // Convert data URL to buffer
    const base64Data = cacheEntry.imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Create sharp instance
    let pipeline = sharp(buffer)

    // Get metadata to calculate dimensions
    const metadata = await pipeline.metadata()
    let resizeWidth = metadata.width
    let resizeHeight = metadata.height

    // Calculate target dimensions based on parameters
    if (scale) {
      const scaleRatio = scale / 100
      resizeWidth = Math.round(metadata.width * scaleRatio)
      resizeHeight = Math.round(metadata.height * scaleRatio)
    } else if (maxWidth && metadata.width > maxWidth) {
      const aspectRatio = metadata.height / metadata.width
      resizeWidth = maxWidth
      resizeHeight = Math.round(maxWidth * aspectRatio)
    } else if (width && height) {
      resizeWidth = width
      resizeHeight = height
      
      // If maintaining aspect ratio, adjust height based on width
      if (maintainAspect) {
        const aspectRatio = metadata.height / metadata.width
        resizeHeight = Math.round(width * aspectRatio)
      }
    } else if (width) {
      resizeWidth = width
      if (maintainAspect) {
        const aspectRatio = metadata.height / metadata.width
        resizeHeight = Math.round(width * aspectRatio)
      }
    }

    // Apply transformations
    pipeline = pipeline.resize(resizeWidth, resizeHeight, {
      fit: 'cover',
      position: 'center',
      withoutEnlargement: true,
    })

    // Convert to JPEG with quality
    const outputBuffer = await pipeline
      .jpeg({ quality: Math.min(Math.max(quality, 1), 100) })
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
