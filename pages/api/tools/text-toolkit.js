import { TOOLS, runTool } from '../../../lib/tools'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputText } = req.body

    if (!inputText) {
      return res.status(400).json({ error: 'Text input required' })
    }

    // Sub-tools to run with their default configs
    const subTools = {
      wordCounter: {
        toolId: 'word-counter',
        config: {},
      },
      reverseText: {
        toolId: 'reverse-text',
        config: {},
      },
      whitespaceVisualizer: {
        toolId: 'whitespace-visualizer',
        config: {},
      },
      caseConverter: {
        toolId: 'case-converter',
        config: { caseType: 'uppercase' },
      },
      textAnalyzer: {
        toolId: 'text-analyzer',
        config: { analyzeType: 'both' },
      },
      slugGenerator: {
        toolId: 'slug-generator',
        config: { separator: '-' },
      },
      sortLines: {
        toolId: 'sort-lines',
        config: { order: 'asc', removeDuplicates: false },
      },
    }

    // Run all sub-tools in parallel
    const results = await Promise.all(
      Object.entries(subTools).map(async ([key, { toolId, config }]) => {
        try {
          const toolResult = await runToolLogic(toolId, inputText, config)
          return {
            key,
            toolName: TOOLS[toolId].name,
            result: toolResult,
            error: null,
          }
        } catch (err) {
          return {
            key,
            toolName: TOOLS[toolId].name,
            result: null,
            error: err.message,
          }
        }
      })
    )

    // Combine all results
    const combinedResults = {}
    results.forEach(({ key, toolName, result, error }) => {
      combinedResults[key] = {
        toolName,
        result,
        error,
      }
    })

    res.status(200).json({
      success: true,
      results: combinedResults,
    })
  } catch (error) {
    console.error('Text Toolkit error:', error)
    res.status(500).json({ error: error.message })
  }
}
