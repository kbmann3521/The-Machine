import { supabaseAdmin } from '../../../lib/supabase-client'

export default async function handler(req, res) {
  try {
    const client = supabaseAdmin
    
    if (!client) {
      return res.status(500).json({ 
        error: 'Supabase admin client not initialized',
        hasAdminClient: !!supabaseAdmin 
      })
    }

    const { data, error } = await client
      .from('media_files')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(400).json({ 
        error: error.message,
        details: error 
      })
    }

    return res.status(200).json({
      count: data?.length || 0,
      data: data || [],
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    return res.status(500).json({ 
      error: err.message,
      stack: err.stack 
    })
  }
}
