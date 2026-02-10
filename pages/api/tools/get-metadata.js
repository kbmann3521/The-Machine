import { TOOLS } from '../../../lib/tool-metadata'
import { getToolExampleForMetadata } from '../../../lib/tools'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Disable caching for tool metadata to ensure fresh config schema
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')

  // Build metadata from local TOOLS using show_in_recommendations flag
  const toolMetadata = {}
  Object.entries(TOOLS).forEach(([toolId, toolData]) => {
    // Use getToolExampleForMetadata to ensure consistent examples from TOOL_EXAMPLES
    // This makes TOOL_EXAMPLES the single source of truth for all examples
    const example = getToolExampleForMetadata(toolId) || toolData.example || ''

    toolMetadata[toolId] = {
      id: toolId,
      name: toolData.name || toolId,
      description: toolData.description || '',
      category: toolData.category || 'general',
      inputTypes: toolData.inputTypes || ['text'],
      outputType: toolData.outputType || 'text',
      show_in_recommendations: toolData.show_in_recommendations !== false,
      detailedDescription: toolData.detailedDescription || null,
      configSchema: toolData.configSchema || [],
      example: example,
    }
  })

  res.status(200).json({
    tools: toolMetadata,
    count: Object.keys(toolMetadata).length,
  })
}
