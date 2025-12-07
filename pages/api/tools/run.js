import { runTool, filterWarningsBasedOnSettings } from '../../../lib/tools'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { toolId, inputText, inputImage, config } = req.body

    if (!toolId) {
      return res.status(400).json({ error: 'Missing toolId' })
    }

    const noInputRequiredTools = [
      'random-string-generator',
      'variable-name-generator',
      'function-name-generator',
      'api-endpoint-generator',
      'lorem-ipsum-generator',
    ]

    const requiresInput = !noInputRequiredTools.includes(toolId)
    if (requiresInput && !inputText && !inputImage) {
      return res.status(400).json({ error: 'Missing inputText or inputImage' })
    }

    const result = await runTool(toolId, inputText, config || {}, inputImage)

    // Handle tools that return validation metadata (like CSV converter)
    let finalResult = result
    let warnings = []

    if (result && typeof result === 'object' && result.output !== undefined && result.warnings !== undefined) {
      finalResult = result.output
      warnings = result.warnings || []
    }

    res.status(200).json({
      success: true,
      toolId,
      result: finalResult,
      warnings,
      metadata: result && typeof result === 'object' ? {
        warningCount: result.warningCount,
        criticalWarnings: result.criticalWarnings,
        error: result.error,
      } : {},
    })
  } catch (error) {
    console.error('Tool execution error:', error)
    res.status(500).json({ error: error.message })
  }
}
