const handler = require('./pages/api/tools/generate-embeddings').default
const http = require('http')

async function regenerateEmbeddings() {
  const mockReq = {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.EMBEDDING_SECRET_KEY || 'embedding-secret-key-regenerate-all'}`
    }
  }

  let responseData = ''
  const mockRes = {
    status: (code) => ({
      json: (data) => {
        console.log(`Status ${code}:`, data)
        process.exit(code === 200 ? 0 : 1)
      }
    }),
    setHeader: () => {},
    write: (data) => {
      responseData += data
      console.log(data)
    },
    end: () => {
      console.log('\n✅ Embedding regeneration complete!')
      process.exit(0)
    }
  }

  try {
    await handler(mockReq, mockRes)
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

regenerateEmbeddings()
