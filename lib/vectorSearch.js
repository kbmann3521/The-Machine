import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from './embeddings'

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

    const query = supabase
      .from('tools')
      .select(
        'id, name, description, category, input_types, output_type, 1 - (embedding <-> $1::vector) as similarity',
        { count: 'exact' }
      )
      .order('similarity', { ascending: false })
      .limit(limit)

    const { data: results, error } = await query.rpc('search_tools', {
      query_embedding: embedding,
      match_count: limit,
    })

    if (error && error.code !== 'PGRST202') {
      console.error('Vector search RPC error:', error)
      // Fallback to regular similarity query if RPC doesn't exist
      return await fallbackVectorSearch(embedding, limit)
    }

    if (!results || results.length === 0) {
      return []
    }

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
  } catch (error) {
    console.error('Vector search error:', error)
    return []
  }
}

export async function fallbackVectorSearch(embedding, limit) {
  try {
    // Direct SQL query if RPC doesn't exist
    const { data: results, error } = await supabase
      .rpc('vector_search', {
        query_embedding: embedding,
        similarity_threshold: 0.0,
        match_count: limit,
      })
      .catch(() => {
        // If RPC still fails, return empty - we'll fall back to pattern matching
        return { data: [], error: 'RPC not available' }
      })

    if (error || !results) {
      return []
    }

    return results.map((tool) => ({
      toolId: tool.id,
      name: tool.name,
      description: tool.description,
      similarity: tool.similarity || 0.5,
    }))
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

        // Store embedding directly as array for vector column
        const { error } = await supabase
          .from('tools')
          .update({ embedding })
          .eq('id', tool.id)

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
