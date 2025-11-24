import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured, returning empty visibility map')
      return res.status(200).json({ visibilityMap: {} })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, show_in_recommendations')

    if (error) {
      console.warn('Supabase query error, returning empty visibility map:', error)
      return res.status(200).json({ visibilityMap: {} })
    }

    // Create a map of tool IDs to visibility status
    const visibilityMap = {}
    if (tools && Array.isArray(tools)) {
      tools.forEach(tool => {
        visibilityMap[tool.id] = tool.show_in_recommendations !== false
      })
    }

    res.status(200).json({
      visibilityMap,
    })
  } catch (error) {
    console.error('Error fetching tool visibility:', error)
    // Return empty visibility map on error instead of 500 - allows app to function with fallback
    res.status(200).json({ visibilityMap: {} })
  }
}
