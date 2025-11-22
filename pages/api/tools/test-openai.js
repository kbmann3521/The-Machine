import { generateEmbedding } from '../../../lib/embeddings'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const testText = 'test embedding validation'

    const embedding = await generateEmbedding(testText)

    if (!embedding || embedding.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Empty embedding returned',
        message: 'OpenAI API returned an invalid response',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'OpenAI API key is valid',
      embeddingDimensions: embedding.length,
      testText: testText,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const errorMessage = error.message || 'Unknown error'

    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key',
        message: 'Your OpenAI API key is invalid or expired',
        details: errorMessage,
      })
    }

    if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'You have hit the OpenAI API rate limit',
        details: errorMessage,
      })
    }

    if (errorMessage.includes('not configured')) {
      return res.status(500).json({
        success: false,
        error: 'API key not configured',
        message: 'OPENAI_API_KEY environment variable is not set',
        details: errorMessage,
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Test failed',
      message: 'Could not test OpenAI API key',
      details: errorMessage,
    })
  }
}
