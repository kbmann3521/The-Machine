import { runTool } from '../../../lib/tools'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { toolId, inputText, config } = req.body

    if (!toolId || !inputText) {
      return res.status(400).json({ error: 'Missing toolId or inputText' })
    }

    const result = runTool(toolId, inputText, config || {})

    res.status(200).json({
      success: true,
      toolId,
      result,
    })
  } catch (error) {
    console.error('Tool execution error:', error)
    res.status(500).json({ error: error.message })
  }
}
