import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Clear all embeddings
    const { data, error } = await supabase
      .from('tools')
      .update({ embedding: null })
      .neq('id', '') // Match all rows

    if (error) {
      return res.status(400).json({
        error: error.message,
      })
    }

    res.status(200).json({
      success: true,
      message: 'All embeddings cleared from database',
      affectedRows: data?.length || 'unknown',
    })
  } catch (error) {
    res.status(500).json({
      error: error.message,
    })
  }
}
