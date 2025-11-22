import { generateEmbedding } from '../../lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    // Generate a test embedding
    const testText = 'test writing tool embedding 1536 dimensions'
    console.log('Generating embedding for:', testText)
    
    const embedding = await generateEmbedding(testText)
    
    console.log('Generated embedding:')
    console.log('  Dimensions:', embedding.length)
    console.log('  Type:', typeof embedding)
    console.log('  Is Array:', Array.isArray(embedding))
    console.log('  Sample values:', embedding.slice(0, 5))
    
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({
        error: 'Invalid embedding generated',
        embedding,
      })
    }

    // Try to update a test tool
    console.log('\nAttempting to save to database...')
    const { data, error } = await supabase
      .from('tools')
      .update({ embedding })
      .eq('id', 'text-toolkit')
      .select()

    if (error) {
      return res.status(400).json({
        error: error.message,
        code: error.code,
      })
    }

    console.log('Update successful')

    // Now fetch it back
    const { data: fetchedTool, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .eq('id', 'text-toolkit')
      .single()

    if (fetchError) {
      return res.status(400).json({
        error: 'Could not fetch back',
        fetchError: fetchError.message,
      })
    }

    const fetchedEmbedding = fetchedTool.embedding
    
    res.status(200).json({
      success: true,
      saved: {
        dimensions: embedding.length,
        type: typeof embedding,
        isArray: Array.isArray(embedding),
      },
      fetched: {
        dimensions: Array.isArray(fetchedEmbedding) ? fetchedEmbedding.length : 'NOT ARRAY',
        type: typeof fetchedEmbedding,
        isArray: Array.isArray(fetchedEmbedding),
        sampleValues: Array.isArray(fetchedEmbedding) ? fetchedEmbedding.slice(0, 5) : null,
      },
      match: Array.isArray(embedding) && Array.isArray(fetchedEmbedding) && embedding.length === fetchedEmbedding.length,
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    })
  }
}
