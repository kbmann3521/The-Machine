import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, show_in_recommendations')

    if (error) {
      throw error
    }

    // Create a map of tool IDs to visibility status
    const visibilityMap = {}
    if (tools) {
      tools.forEach(tool => {
        visibilityMap[tool.id] = tool.show_in_recommendations !== false
      })
    }

    res.status(200).json({
      visibilityMap,
    })
  } catch (error) {
    console.error('Error fetching tool visibility:', error)
    res.status(500).json({ error: error.message })
  }
}
