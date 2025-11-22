export default async function handler(req, res) {
  try {
    console.log('🧪 Testing embedding generation...')
    console.log('API Key available:', !!process.env.OPENAI_API_KEY)
    console.log('API Key format:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...')

    const testText = 'test writing tool embedding'

    // Test 1: Direct API call
    console.log('\n📝 Test 1: Direct API call to OpenAI')
    const apiResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: testText,
      }),
    })

    console.log('API Response status:', apiResponse.status)
    const apiData = await apiResponse.json()

    if (!apiResponse.ok) {
      console.error('❌ API Error:', apiData.error?.message)
      return res.status(500).json({
        success: false,
        test1: {
          status: apiResponse.status,
          error: apiData.error?.message,
        },
      })
    }

    const directEmbedding = apiData.data?.[0]?.embedding

    console.log('Direct embedding received:')
    console.log('  - Dimensions:', directEmbedding?.length || 0)
    console.log('  - Type:', typeof directEmbedding)
    console.log('  - Is Array:', Array.isArray(directEmbedding))
    console.log('  - Sample:', directEmbedding?.slice(0, 5))

    // Test 2: Using the generateEmbedding function
    console.log('\n🔧 Test 2: Using generateEmbedding function')

    // Import the function in a way that works
    const { generateEmbedding } = await import('../lib/embeddings.js')

    const funcEmbedding = await generateEmbedding(testText)

    console.log('Function embedding received:')
    console.log('  - Dimensions:', funcEmbedding?.length || 0)
    console.log('  - Type:', typeof funcEmbedding)
    console.log('  - Is Array:', Array.isArray(funcEmbedding))
    console.log('  - Sample:', funcEmbedding?.slice(0, 5))

    res.status(200).json({
      success: true,
      directApiCall: {
        dimensions: directEmbedding?.length || 0,
        isValid: directEmbedding?.length === 1536,
        sample: directEmbedding?.slice(0, 3),
      },
      generateEmbeddingFunction: {
        dimensions: funcEmbedding?.length || 0,
        isValid: funcEmbedding?.length === 1536,
        sample: funcEmbedding?.slice(0, 3),
        isFallback: funcEmbedding?.length === 16,
      },
      comparison: {
        directMatchesFuncEmbedding: JSON.stringify(directEmbedding) === JSON.stringify(funcEmbedding),
        bothValid: directEmbedding?.length === 1536 && funcEmbedding?.length === 1536,
        functionIsFallback: funcEmbedding?.length === 16,
      },
    })
  } catch (error) {
    console.error('❌ Test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
      stack: error.stack,
    })
  }
}
