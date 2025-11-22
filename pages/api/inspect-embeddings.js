import { createClient } from '@supabase/supabase-js'
import { cosineSimilarity } from '../../lib/embeddings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function parseVectorString(vectorStr) {
  if (typeof vectorStr === 'string') {
    try {
      return JSON.parse(vectorStr)
    } catch (e) {
      return null
    }
  }
  return Array.isArray(vectorStr) ? vectorStr : null
}

export default async function handler(req, res) {
  try {
    // Get a few tools and their embeddings
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, name, description, embedding')
      .in('id', ['text-analyzer', 'word-counter', 'markdown-linter', 'case-converter'])

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const results = []
    
    for (const tool of tools) {
      const embedding = parseVectorString(tool.embedding)
      
      if (!embedding) {
        results.push({
          id: tool.id,
          name: tool.name,
          description: tool.description,
          embeddingValid: false,
          error: 'Could not parse embedding',
        })
        continue
      }

      results.push({
        id: tool.id,
        name: tool.name,
        description: tool.description,
        embeddingValid: true,
        dimensions: embedding.length,
        magnitude: Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)),
        mean: embedding.reduce((sum, v) => sum + v, 0) / embedding.length,
        min: Math.min(...embedding),
        max: Math.max(...embedding),
        firstValues: embedding.slice(0, 10),
      })
    }

    // Check if embeddings are basically identical (would indicate a problem)
    if (results.length >= 2) {
      const emb1 = parseVectorString(tools[0].embedding)
      const emb2 = parseVectorString(tools[1].embedding)
      
      if (emb1 && emb2) {
        const similarity = cosineSimilarity(emb1, emb2)
        results.push({
          comparison: {
            tool1: tools[0].id,
            tool2: tools[1].id,
            cosineSimilarity: similarity,
            warning: similarity > 0.95 ? 'Embeddings are too similar!' : 'Similarity looks reasonable',
          }
        })
      }
    }

    res.status(200).json({
      success: true,
      tools: results,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
