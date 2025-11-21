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

    // Generate embedding for user input
    const inputEmbedding = await generateEmbedding(inputContent)

    // Generator tools to exclude
    const generatorTools = [
      'random-string-generator',
      'variable-name-generator',
      'function-name-generator',
      'api-endpoint-generator',
      'lorem-ipsum-generator',
      'uuid-generator',
      'hash-generator',
      'password-generator',
      'qr-code-generator',
    ]

    // Calculate vector similarity scores for all tools
    const toolEntries = Object.entries(TOOLS).filter(([toolId]) => !generatorTools.includes(toolId))
    
    const toolScores = await Promise.all(
      toolEntries.map(async ([toolId, toolData]) => {
        let similarity = 0

        // For image input, prioritize image-capable tools
        if (inputImage) {
          if (toolId === 'image-resizer') {
            similarity = 0.99
          } else if (toolData.inputTypes?.includes('image')) {
            similarity = 0.90
          } else {
            // Non-image tools get lower score for image input
            similarity = 0.1
          }
        } else {
          // Use vector embedding similarity for text input
          const toolPlaceholder = toolData.example || toolData.description || toolData.name
          const toolEmbedding = await generateEmbedding(toolPlaceholder)
          similarity = cosineSimilarity(inputEmbedding, toolEmbedding)

          // Boost similarity if tool description matches content type
          if (toolData.description) {
            const descriptionEmbedding = await generateEmbedding(toolData.description)
            const descriptionSimilarity = cosineSimilarity(inputEmbedding, descriptionEmbedding)
            // Weighted average: 70% placeholder/example match, 30% description match
            similarity = similarity * 0.7 + descriptionSimilarity * 0.3
          }
        }

        return {
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: Math.max(0, Math.min(1, similarity)), // Clamp to 0-1 range
        }
      })
    )

    // Sort tools by similarity in descending order
    const sortedTools = toolScores.sort((a, b) => b.similarity - a.similarity)

    res.status(200).json({
      predictedTools: sortedTools,
      inputContent,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
