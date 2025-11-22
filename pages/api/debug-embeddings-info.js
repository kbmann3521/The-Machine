export default async function handler(req, res) {
  const info = {
    apiKeyConfigured: !!process.env.OPENAI_API_KEY,
    apiKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    apiKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 10) + '...' || 'NOT SET',
    environment: process.env.NODE_ENV,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40) + '...' || 'NOT SET',
    supabaseKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
  }

  // Test OpenAI API key
  if (info.apiKeyConfigured) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      })
      
      info.openAiApiTest = {
        status: response.ok ? 'SUCCESS' : 'FAILED',
        statusCode: response.status,
        message: response.ok ? 'API key is valid' : 'API key validation failed',
      }
    } catch (error) {
      info.openAiApiTest = {
        status: 'ERROR',
        message: error.message,
      }
    }

    // Test embedding generation
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: 'test',
        }),
      })

      const data = await response.json()

      if (response.ok && data.data && data.data[0] && data.data[0].embedding) {
        info.embeddingTest = {
          status: 'SUCCESS',
          dimensions: data.data[0].embedding.length,
          message: `Real OpenAI embedding: ${data.data[0].embedding.length} dimensions`,
        }
      } else {
        info.embeddingTest = {
          status: 'FAILED',
          error: data.error?.message || 'Unknown error',
        }
      }
    } catch (error) {
      info.embeddingTest = {
        status: 'ERROR',
        message: error.message,
      }
    }
  } else {
    info.openAiApiTest = { status: 'SKIPPED', message: 'API key not configured' }
    info.embeddingTest = { status: 'SKIPPED', message: 'API key not configured' }
  }

  res.status(200).json({
    configuration: info,
    nextSteps: getNextSteps(info),
  })
}

function getNextSteps(info) {
  if (!info.apiKeyConfigured) {
    return ['❌ OpenAI API key is NOT set. Add OPENAI_API_KEY to environment variables.']
  }

  if (info.openAiApiTest?.status !== 'SUCCESS') {
    return ['❌ OpenAI API key is invalid or has connectivity issues. Check your API key.']
  }

  if (info.embeddingTest?.status !== 'SUCCESS') {
    return ['❌ OpenAI embeddings API is not working. Check your account/quota.']
  }

  if (info.embeddingTest?.dimensions !== 1536) {
    return [`⚠️ Expected 1536 dimensions, got ${info.embeddingTest?.dimensions}. Model might be wrong.`]
  }

  return ['✅ All systems operational. Now regenerate embeddings with: npm run regenerate-embeddings']
}
