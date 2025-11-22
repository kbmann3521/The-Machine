import { generateEmbedding } from '../../lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../lib/tools.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { inputText } = req.body

  if (!inputText) {
    return res.status(400).json({ error: 'No input provided' })
  }

  try {
    // Generate embedding for input
    const embedding = await generateEmbedding(inputText)

    if (!embedding || embedding.length === 0) {
      return res.status(400).json({ error: 'Failed to generate embedding' })
    }

    // Fetch all tools with embeddings
    const { data: allTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description, embedding')

    if (fetchError) {
      return res.status(400).json({ error: fetchError.message })
    }

    // Parse embeddings (they're stored as strings or JSON) and calculate similarity
    const toolScores = allTools
      .filter(tool => {
        // Only include tools with embeddings
        return tool.embedding && tool.embedding !== null && tool.embedding !== 'null'
      })
      .map(tool => {
        let toolEmbedding
        
        // Parse embedding if it's a string
        if (typeof tool.embedding === 'string') {
          try {
            toolEmbedding = JSON.parse(tool.embedding)
          } catch (e) {
            console.warn(`Could not parse embedding for ${tool.id}:`, e.message)
            return null
          }
        } else {
          toolEmbedding = tool.embedding
        }

        // Calculate cosine similarity
        if (!Array.isArray(toolEmbedding) || toolEmbedding.length === 0) {
          return null
        }

        const similarity = cosineSimilarity(embedding, toolEmbedding)

        return {
          toolId: tool.id,
          name: tool.name,
          description: tool.description,
          similarity: Math.max(0, Math.min(1, similarity)),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.similarity - a.similarity)

    res.status(200).json({
      success: true,
      results: toolScores.slice(0, 10),
      metadata: {
        embeddingDimensions: embedding.length,
        toolsSearched: allTools.length,
        toolsWithValidEmbeddings: toolScores.length,
      },
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    res.status(500).json({
      error: error.message,
    })
  }
}

function cosineSimilarity(a, b) {
  let dotProduct = 0
  let normA = 0
  let normB = 0

  const minLength = Math.min(a.length, b.length)
  for (let i = 0; i < minLength; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (normA * normB)
}
