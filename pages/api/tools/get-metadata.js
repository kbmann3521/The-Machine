import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

// Cache tool metadata with TTL
let cachedToolMetadata = null
let cacheTimestamp = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default async function handler(req, res) {
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
                showInRecommendations: tool.show_in_recommendations !== false,
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

    // If we don't have tool metadata from Supabase, use local TOOLS config
    if (Object.keys(toolMetadata).length === 0) {
      Object.entries(TOOLS).forEach(([toolId, toolData]) => {
        toolMetadata[toolId] = {
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
    }

    // Cache the result
    cachedToolMetadata = toolMetadata
    cacheTimestamp = Date.now()

    res.status(200).json({
      tools: toolMetadata,
      count: Object.keys(toolMetadata).length,
    })
  } catch (error) {
    console.error('Error in get-metadata handler:', error)

    // Build fallback from local TOOLS config
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
