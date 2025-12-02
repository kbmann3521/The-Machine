import { createClient } from '@supabase/supabase-js'


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { toolId, marked } = req.body

  // Validate input
  if (!toolId || typeof marked !== 'boolean') {
    return res.status(400).json({ error: 'Missing or invalid toolId or marked flag' })
  }

  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return res.status(503).json({ error: 'Database not configured' })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    )

    // Update the mark_for_delete flag in database
    // Also set show_in_recommendations to false when marking for deletion
    const updateData = { mark_for_delete: marked }
    if (marked) {
      updateData.show_in_recommendations = false
    }

    const { data, error } = await supabase
      .from('tools')
      .update(updateData)
      .eq('id', toolId)
      .select()

    if (error) {
      console.error('Error updating tool mark_for_delete:', error)
      return res.status(400).json({ error: error.message })
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Tool not found' })
    }

    return res.status(200).json({
      success: true,
      tool: data[0],
      marked,
      message: marked
        ? `Tool marked for deletion`
        : `Deletion marking removed`,
    })
  } catch (error) {
    console.error('Error in mark-for-delete handler:', error)
    return res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
