import { generateEmbedding, cosineSimilarity } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'

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
      const toolDescription = `${tool.name}: ${tool.description}`
      
      const descriptionEmbedding = tool._embedding || [0.5] 
      
      const similarity = cosineSimilarity(embedding, descriptionEmbedding)
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
        similarity: t.similarity,
      })),
      inputContent,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
