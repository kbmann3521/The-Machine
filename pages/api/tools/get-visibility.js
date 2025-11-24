import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured')
      return res.status(200).json({ visibilityMap: {} })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Use a simple select query without filters
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, show_in_recommendations')
      .order('id')

    if (error) {
      console.error('Supabase error:', error.code, error.message)
      // Return empty visibility map on error - app will use local defaults as fallback
      return res.status(200).json({ visibilityMap: {} })
    }

    if (!tools || !Array.isArray(tools)) {
      console.warn('Invalid tools data received from Supabase')
      return res.status(200).json({ visibilityMap: {} })
    }

    // Create a map of tool IDs to visibility status
    const visibilityMap = {}
    tools.forEach(tool => {
      visibilityMap[tool.id] = tool.show_in_recommendations !== false
    })

    res.status(200).json({
      visibilityMap,
    })
  } catch (error) {
    console.error('Unexpected error in get-visibility:', error?.message)
    // Return empty visibility map on error instead of 500 - allows app to function with fallback
    res.status(200).json({ visibilityMap: {} })
  }
}
