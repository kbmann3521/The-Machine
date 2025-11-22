import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body

  // Authentication check
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.EMBEDDING_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (action === 'clear') {
      // Clear all embeddings
      const { data, error } = await supabase
        .from('tools')
        .update({ embedding: null })
        .neq('id', '')

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Failed to clear embeddings',
          details: error.message,
        })
      }

      res.status(200).json({
        success: true,
        message: 'All embeddings cleared',
        affectedRows: data?.length || 0,
      })
    } else if (action === 'check') {
      // Check current embedding status
      const { data: tools, error } = await supabase
        .from('tools')
        .select('id, embedding')
        .limit(100)

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Failed to check embeddings',
          details: error.message,
        })
      }

      const analysis = {
        total: tools.length,
        null: 0,
        invalidDimensions: [],
        validDimensions: [],
      }

      tools.forEach((tool) => {
        if (!tool.embedding) {
          analysis.null++
        } else {
          try {
            let embedding = tool.embedding

            if (typeof embedding === 'string') {
              embedding = JSON.parse(embedding)
            }

            if (Array.isArray(embedding)) {
              if (embedding.length === 1536) {
                analysis.validDimensions.push(tool.id)
              } else {
                analysis.invalidDimensions.push({
                  id: tool.id,
                  dimensions: embedding.length,
                })
              }
            }
          } catch (e) {
            analysis.invalidDimensions.push({
              id: tool.id,
              error: 'Failed to parse',
            })
          }
        }
      })

      res.status(200).json({
        success: true,
        analysis,
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid action. Use "clear" or "check"',
      })
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
