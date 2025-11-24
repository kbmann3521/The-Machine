import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    let visibilityMap = {}

    // First, try to fetch from Supabase if configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          {
            auth: {
              persistSession: false,
            },
          }
        )

        const { data: tools, error } = await supabase
          .from('tools')
          .select('id, show_in_recommendations')

        if (!error && tools && Array.isArray(tools)) {
          // Successfully fetched from Supabase - use this data
          tools.forEach(tool => {
            if (tool && tool.id) {
              visibilityMap[tool.id] = tool.show_in_recommendations !== false
            }
          })
        } else if (error) {
          console.warn('Supabase fetch failed, falling back to local config:', error?.message)
          // Fall through to use local config
        }
      } catch (err) {
        console.warn('Supabase connection failed, falling back to local config:', err?.message)
        // Fall through to use local config
      }
    }

    // If we don't have visibility data from Supabase, use local TOOLS config
    if (Object.keys(visibilityMap).length === 0) {
      Object.entries(TOOLS).forEach(([toolId, toolData]) => {
        visibilityMap[toolId] = toolData.show_in_recommendations !== false
      })
    }

    res.status(200).json({
      visibilityMap,
    })
  } catch (error) {
    console.error('Unexpected error in get-visibility:', error?.message)
    // Return empty visibility map on error instead of 500 - allows app to function with fallback
    res.status(200).json({ visibilityMap: {} })
  }
}
