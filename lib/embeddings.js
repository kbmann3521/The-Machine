import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate an embedding for the given text using OpenAI's text-embedding-3-small model
 * Returns a 1536-dimensional vector
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8191), // OpenAI limit
    })

    return response.data[0].embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw error
  }
}

/**
 * Format an embedding array for storage in pgvector format
 * pgvector expects: "[x1,x2,x3,...]" as a string
 */
export function formatEmbeddingForStorage(embedding) {
  if (!Array.isArray(embedding)) {
    throw new Error('Embedding must be an array')
  }

  return '[' + embedding.join(',') + ']'
}

/**
 * Parse a pgvector embedding string back to an array
 */
export function parseEmbeddingFromStorage(embeddingString) {
  if (typeof embeddingString === 'string') {
    try {
      return JSON.parse(embeddingString)
    } catch (e) {
      // Try pgvector format: "[x1,x2,...]"
      const cleaned = embeddingString.replace(/^\[|\]$/g, '')
      return cleaned.split(',').map(v => parseFloat(v.trim()))
    }
  }

  // Already an array
  if (Array.isArray(embeddingString)) {
    return embeddingString
  }

  throw new Error('Invalid embedding format')
}

/**
 * Batch generate embeddings for multiple texts
 */
export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error('Texts must be a non-empty array')
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: texts.map(t => t.slice(0, 8191)), // OpenAI limit per text
    })

    return response.data.map(item => item.embedding)
  } catch (error) {
    console.error('Error generating embeddings:', error)
    throw error
  }
}
