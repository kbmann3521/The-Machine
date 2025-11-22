export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: 'OPENAI_API_KEY not configured',
      apiKeySet: false,
    })
  }

  try {
    console.log('🔍 Testing OpenAI API directly...')
    console.log('API Key format:', apiKey.substring(0, 10) + '...')

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: 'test embedding validation',
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        status: response.status,
        error: data.error?.message || 'OpenAI API error',
        fullError: data.error,
        apiKey: apiKey.substring(0, 10) + '...',
      })
    }

    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      return res.status(400).json({
        success: false,
        error: 'Invalid response from OpenAI',
        response: data,
      })
    }

    const embedding = data.data[0].embedding

    res.status(200).json({
      success: true,
      status: 'OpenAI API is working',
      embeddingDimensions: embedding.length,
      sampleValues: embedding.slice(0, 5),
      totalTokensUsed: data.usage?.total_tokens || 0,
      isValidEmbedding: embedding.length === 1536,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Network or parsing error',
      message: error.message,
      errorType: error.constructor.name,
    })
  }
}
