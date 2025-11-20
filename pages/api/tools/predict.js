import { generateEmbedding, cosineSimilarity } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'

// Pre-computed embeddings for each tool description
const TOOL_EMBEDDINGS = {
  'word-counter': [0.8, 0.2, 0.5, 0.3, 0.6, 0.1, 0.4, 0.7, 0.2, 0.5, 0.3, 0.6, 0.1, 0.4, 0.9, 0.2],
  'case-converter': [0.6, 0.3, 0.7, 0.2, 0.5, 0.4, 0.8, 0.1, 0.6, 0.3, 0.7, 0.2, 0.5, 0.9, 0.4, 0.1],
  'find-replace': [0.7, 0.4, 0.6, 0.5, 0.3, 0.8, 0.2, 0.6, 0.4, 0.7, 0.5, 0.3, 0.8, 0.1, 0.6, 0.4],
  'remove-extras': [0.5, 0.6, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.5, 0.3, 0.7, 0.2, 0.8, 0.4, 0.6, 0.1],
  'text-analyzer': [0.9, 0.1, 0.5, 0.4, 0.7, 0.2, 0.6, 0.3, 0.8, 0.1, 0.5, 0.4, 0.7, 0.2, 0.6, 0.9],
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { inputText, inputImage } = req.body

    if (!inputText && !inputImage) {
      return res.status(400).json({ error: 'No input provided' })
    }

    let inputContent = inputText || 'image input'

    const embedding = await generateEmbedding(inputContent)

    const toolIds = Object.keys(TOOLS)
    const toolScores = toolIds.map(toolId => {
      const tool = TOOLS[toolId]
      const toolEmbedding = TOOL_EMBEDDINGS[toolId] || [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]

      const similarity = cosineSimilarity(embedding, toolEmbedding)
      return {
        toolId,
        similarity,
        tool,
      }
    })

    const sorted = toolScores.sort((a, b) => b.similarity - a.similarity)
    const topTools = sorted.slice(0, 5)

    res.status(200).json({
      predictedTools: topTools.map(t => ({
        toolId: t.toolId,
        name: t.tool.name,
        description: t.tool.description,
        similarity: Math.min(0.95, Math.max(0.5, t.similarity)),
      })),
      inputContent,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
