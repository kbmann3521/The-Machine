import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

// Cache tool metadata with TTL
let cachedToolMetadata = null
let cacheTimestamp = 0
const CACHE_TTL = 30 * 1000 // 30 seconds - short cache for visibility changes

export default async function handler(req, res) {
  // Allow cache clearing via ?clearCache=true
  if (req.query.clearCache === 'true') {
    cachedToolMetadata = null
    cacheTimestamp = 0
    console.log('Tool metadata cache cleared')
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Return cached result if available and not expired
  if (cachedToolMetadata && Date.now() - cacheTimestamp < CACHE_TTL) {
    return res.status(200).json({ tools: cachedToolMetadata })
  }

  try {
    let toolMetadata = {}

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
          .select('id, name, description, category, input_types, output_type, show_in_recommendations')
          .order('name')

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Supabase query timeout')), 3000)
        )

        const { data: supabaseTools, error } = await Promise.race([supabasePromise, timeoutPromise])

        if (!error && supabaseTools && Array.isArray(supabaseTools)) {
          // Successfully fetched from Supabase - use this data
          supabaseTools.forEach(tool => {
            if (tool && tool.id) {
              toolMetadata[tool.id] = {
                id: tool.id,
                name: tool.name || TOOLS[tool.id]?.name || tool.id,
                description: tool.description || TOOLS[tool.id]?.description || '',
                category: tool.category || TOOLS[tool.id]?.category || 'general',
                inputTypes: tool.input_types || TOOLS[tool.id]?.inputTypes || ['text'],
                outputType: tool.output_type || TOOLS[tool.id]?.outputType || 'text',
                show_in_recommendations: tool.show_in_recommendations !== false,
                // Include detailed description from local TOOLS if available
                detailedDescription: TOOLS[tool.id]?.detailedDescription || null,
                configSchema: TOOLS[tool.id]?.configSchema || [],
                example: TOOLS[tool.id]?.example || '',
              }
            }
          })
        }
      } catch (err) {
        console.error('Error fetching tool metadata from Supabase:', err.message)
        // Silently continue - we'll use local fallback
      }
    }

    // IMPORTANT: Only use tools from Supabase, DO NOT add local TOOLS
    // Supabase is the source of truth for tool visibility and deletion
    // Local TOOLS config is only used for filling in missing UI details (detailedDescription, configSchema, example)
    Object.keys(toolMetadata).forEach(toolId => {
      const localTool = TOOLS[toolId]
      if (localTool) {
        // Enrich Supabase tool data with local UI details
        toolMetadata[toolId].detailedDescription = localTool.detailedDescription || null
        toolMetadata[toolId].configSchema = localTool.configSchema || []
        toolMetadata[toolId].example = localTool.example || ''
      }
    })

    // Cache the result
    cachedToolMetadata = toolMetadata
    cacheTimestamp = Date.now()

    res.status(200).json({
      tools: toolMetadata,
      count: Object.keys(toolMetadata).length,
    })
  } catch (error) {
    console.error('Error in get-metadata handler:', error)

    // If we already have cached toolMetadata from Supabase, return it
    if (toolMetadata && Object.keys(toolMetadata).length > 0) {
      cachedToolMetadata = toolMetadata
      cacheTimestamp = Date.now()

      res.status(200).json({
        tools: toolMetadata,
        count: Object.keys(toolMetadata).length,
      })
    } else {
      // Emergency fallback: return what we can from local TOOLS
      // Note: This will include all tools in lib/tools.js
      console.warn('Using emergency local TOOLS fallback - Supabase data unavailable')
      const fallbackMetadata = {}
      Object.entries(TOOLS).forEach(([toolId, toolData]) => {
        fallbackMetadata[toolId] = {
          id: toolId,
          name: toolData.name || toolId,
          description: toolData.description || '',
          category: toolData.category || 'general',
          inputTypes: toolData.inputTypes || ['text'],
          outputType: toolData.outputType || 'text',
          showInRecommendations: toolData.show_in_recommendations !== false,
          detailedDescription: toolData.detailedDescription || null,
          configSchema: toolData.configSchema || [],
          example: toolData.example || '',
        }
      })

      // Cache and return fallback
      cachedToolMetadata = fallbackMetadata
      cacheTimestamp = Date.now()

      res.status(200).json({
        tools: fallbackMetadata,
        count: Object.keys(fallbackMetadata).length,
      })
    }
  }
}
