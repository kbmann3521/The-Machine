export default async function handler(req, res) {
  const { imageId } = req.query

  if (!imageId) {
    return res.status(400).json({ error: 'No image ID provided' })
  }

  try {
    // Retrieve image from cache
    const imageCache = global.imageCache || {}
    const imageData = imageCache[imageId]

    if (!imageData) {
      return res.status(404).json({ error: 'Image not found' })
    }

    // Convert data URL to buffer
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Set appropriate headers
    res.setHeader('Content-Type', 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    res.setHeader('Content-Length', buffer.length)

    res.status(200).send(buffer)
  } catch (error) {
    console.error('Image retrieval error:', error)
    res.status(500).json({ error: error.message })
  }
}
