import { createClient } from '@supabase/supabase-js'
import { generateEmbedding, formatEmbeddingForStorage } from './embeddings'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function searchToolsWithVector(embeddingText, options = {}) {
  const {
    limit = 10,
    confidenceThreshold = 0.75,
    exceptToolIds = [],
  } = options

  try {
    const embedding = await generateEmbedding(embeddingText)

    // Try using the RPC search function if it exists
    try {
      const { data: results, error } = await supabase
        .rpc('search_tools', {
          query_embedding: embedding,
          match_count: limit,
        })

      if (!error && results && results.length > 0) {
        const filteredResults = results
          .filter(
            (tool) =>
              !exceptToolIds.includes(tool.id) &&
              tool.similarity >= confidenceThreshold
          )
          .map((tool) => ({
            toolId: tool.id,
            name: tool.name,
            description: tool.description,
            similarity: Math.max(0, Math.min(1, tool.similarity)),
          }))

        return filteredResults
      }
    } catch (e) {
      console.log('RPC search_tools not available, using fallback')
    }

    // Fallback: perform client-side similarity search
    return await fallbackVectorSearch(embedding, limit, exceptToolIds, confidenceThreshold)
  } catch (error) {
    console.error('Vector search error:', error)
    return []
  }
}

export async function fallbackVectorSearch(embedding, limit, exceptToolIds = [], confidenceThreshold = 0.0) {
  try {
    // Try the vector_search RPC function
    try {
      const { data: results, error } = await supabase
        .rpc('vector_search', {
          query_embedding: embedding,
          similarity_threshold: confidenceThreshold,
          match_count: limit,
        })

      if (!error && results && results.length > 0) {
        return results
          .filter((tool) => !exceptToolIds.includes(tool.id))
          .map((tool) => ({
            toolId: tool.id,
            name: tool.name,
            description: tool.description,
            similarity: tool.similarity || 0.5,
          }))
      }
    } catch (e) {
      console.log('RPC vector_search not available, using client-side similarity')
    }

    // Client-side fallback: retrieve all tools and calculate similarity
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, name, description, embedding')

    if (error || !tools) {
      return []
    }

    // Calculate cosine similarity for each tool
    const { cosineSimilarity } = await import('./embeddings')

    const results = tools
      .filter((tool) => !exceptToolIds.includes(tool.id) && tool.embedding)
      .map((tool) => {
        // Parse embedding if it's a string
        let toolEmbedding = tool.embedding
        if (typeof toolEmbedding === 'string') {
          try {
            // Parse pgvector string format: [x,y,z,...]
            toolEmbedding = JSON.parse(toolEmbedding)
          } catch (e) {
            return null
          }
        }

        if (!Array.isArray(toolEmbedding) || toolEmbedding.length !== 1536) {
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
      .filter((r) => r !== null && r.similarity >= confidenceThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)

    return results
  } catch (error) {
    console.error('Fallback vector search error:', error)
    return []
  }
}

export async function generateToolEmbeddings() {
  try {
    const { data: tools } = await supabase
      .from('tools')
      .select('id, name, description, example')

    if (!tools || tools.length === 0) {
      return { processed: 0, errors: [] }
    }

    const errors = []
    let processed = 0

    for (const tool of tools) {
      try {
        const embeddingText = `${tool.name}. ${tool.description || ''} ${tool.example || ''}`
        const embedding = await generateEmbedding(embeddingText)

        // Verify embedding dimensions
        if (!embedding || embedding.length !== 1536) {
          errors.push({
            toolId: tool.id,
            error: `Invalid embedding dimensions: ${embedding?.length || 0} (expected 1536)`,
          })
          continue
        }

        // Use the SQL function to update embedding with proper pgvector casting
        const { error } = await supabase.rpc('update_tool_embedding', {
          tool_id: tool.id,
          embedding_array: embedding,
        })

        if (error) {
          errors.push({ toolId: tool.id, error: error.message })
        } else {
          processed++
        }

        // Rate limiting for OpenAI API
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        errors.push({ toolId: tool.id, error: error.message })
      }
    }

    return { processed, errors, total: tools.length }
  } catch (error) {
    console.error('Error generating tool embeddings:', error)
    return { processed: 0, errors: [error.message] }
  }
}
