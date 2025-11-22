import { generateEmbedding } from '../../lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../lib/tools.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Classify input to get category for boosting
async function classifyInputForCategory(inputText) {
  try {
    const response = await fetch('http://localhost:3000/api/tools/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputText }),
    })

    if (!response.ok) return null

    const data = await response.json()
    return data.category || null
  } catch (e) {
    console.warn('Classification failed:', e.message)
    return null
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { inputText } = req.body

  if (!inputText) {
    return res.status(400).json({ error: 'No input provided' })
  }

  try {
    // Generate embedding from the original user input (not classification summary)
    // This ensures semantic relevance to what the user actually provided
    const embedding = await generateEmbedding(inputText)

    // Also detect input category for relevance boosting
    const inputCategory = await classifyInputForCategory(inputText)

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

        let similarity = cosineSimilarity(embedding, toolEmbedding)

        // Apply aggressive category boosting if input category detected
        if (inputCategory) {
          const toolData = TOOLS[tool.id]
          if (toolData && toolData.category === inputCategory) {
            // For ambiguous/generic inputs, category match is very important
            // Boost similarity significantly for category matches
            if (similarity < 0.5) {
              // Low semantic similarity: boost by 50-100%
              similarity = Math.min(1, similarity + 0.4)
            } else {
              // Higher semantic similarity: boost by 30%
              similarity = Math.min(1, similarity * 1.3)
            }
          }
        }

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
