import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

// Cache visibility map with TTL
let cachedVisibilityMap = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Return cached result if available and not expired
  if (cachedVisibilityMap && Date.now() - cacheTimestamp < CACHE_TTL) {
    return res.status(200).json({ visibilityMap: cachedVisibilityMap })
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

        // Set a timeout for the Supabase request
        const supabasePromise = supabase
          .from('tools')
          .select('id, show_in_recommendations')

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase query timeout')), 2000)
        )

        const { data: tools, error } = await Promise.race([supabasePromise, timeoutPromise])

        if (!error && tools && Array.isArray(tools)) {
          // Successfully fetched from Supabase - use this data
          tools.forEach(tool => {
            if (tool && tool.id) {
              visibilityMap[tool.id] = tool.show_in_recommendations !== false
            }
          })
        }
      } catch (err) {
        // Silently continue - we'll use local fallback
      }
    }

    // If we don't have visibility data from Supabase, use local TOOLS config
    if (Object.keys(visibilityMap).length === 0) {
      Object.entries(TOOLS).forEach(([toolId, toolData]) => {
        visibilityMap[toolId] = toolData.show_in_recommendations !== false
      })
    }

    // Cache the result
    cachedVisibilityMap = visibilityMap
    cacheTimestamp = Date.now()

    res.status(200).json({
      visibilityMap,
    })
  } catch (error) {
    // Build fallback from local TOOLS config
    const fallbackMap = {}
    Object.entries(TOOLS).forEach(([toolId, toolData]) => {
      fallbackMap[toolId] = toolData.show_in_recommendations !== false
    })

    // Cache and return fallback
    cachedVisibilityMap = fallbackMap
    cacheTimestamp = Date.now()

    res.status(200).json({ visibilityMap: fallbackMap })
  }
}
