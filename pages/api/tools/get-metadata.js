import { TOOLS } from '../../../lib/tools'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Build metadata from local TOOLS using show_in_recommendations flag
  const toolMetadata = {}
  Object.entries(TOOLS).forEach(([toolId, toolData]) => {
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
      example: toolData.example || '',
    }
  })

  res.status(200).json({
    tools: toolMetadata,
    count: Object.keys(toolMetadata).length,
  })
}
