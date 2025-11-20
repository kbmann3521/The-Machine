// Simple hash-based embedding generator for mock implementation
// Replace this with real OpenAI embeddings after installing 'openai' package
function simpleHashEmbedding(text) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  const embedding = new Array(16)
  for (let i = 0; i < 16; i++) {
    embedding[i] = Math.sin(hash + i) * 0.5 + 0.5
  }
  return embedding
}

export async function generateEmbedding(text) {
  try {
    // TODO: Uncomment below after installing openai package (npm install openai)
    // import { OpenAI } from 'openai'
    // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    // const response = await openai.embeddings.create({
    //   model: 'text-embedding-3-small',
    //   input: text,
    // })
    // return response.data[0].embedding

    // Mock implementation - returns deterministic hash-based embedding
    return simpleHashEmbedding(text)
  } catch (error) {
    console.error('Embedding error:', error)
    return simpleHashEmbedding(text)
  }
}

export function cosineSimilarity(a, b) {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  
  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)
  
  if (normA === 0 || normB === 0) return 0
  return dotProduct / (normA * normB)
}
