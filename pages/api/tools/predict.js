import { generateEmbedding } from '../../../lib/embeddings'
import { supabase } from '../../../lib/supabase'
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

    const userEmbedding = await generateEmbedding(inputContent)

    // Query Supabase for similar tools using vector search
    const { data: toolsData, error: toolsError } = await supabase.rpc('match_tools', {
      query_embedding: userEmbedding,
      match_count: 5,
    })

    if (toolsError) {
      console.log('Vector search not available, using fallback method:', toolsError.message)

      // Fallback: return all tools with similarity scores
      const { data: allTools } = await supabase
        .from('tools')
        .select('id, name, description, embedding')

      if (allTools && allTools.length > 0) {
        const toolScores = allTools
          .map(tool => {
            const similarity = cosineSimilarity(userEmbedding, tool.embedding)
            return {
              toolId: tool.id,
              name: tool.name,
              description: tool.description,
              similarity,
            }
          })
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5)

        return res.status(200).json({
          predictedTools: toolScores,
          inputContent,
        })
      }
    }

    // Use vector search results
    if (toolsData && toolsData.length > 0) {
      const predictedTools = toolsData.map(tool => ({
        toolId: tool.id,
        name: tool.name,
        description: tool.description,
        similarity: tool.similarity || 0.75,
      }))

      return res.status(200).json({
        predictedTools,
        inputContent,
      })
    }

    // Fallback: return top tools in order
    const topToolIds = ['word-counter', 'case-converter', 'find-replace', 'remove-extras', 'text-analyzer']
    const fallbackTools = topToolIds
      .filter(id => TOOLS[id])
      .map((id, index) => ({
        toolId: id,
        name: TOOLS[id].name,
        description: TOOLS[id].description,
        similarity: 0.9 - index * 0.1,
      }))

    res.status(200).json({
      predictedTools: fallbackTools,
      inputContent,
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return 0.5
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  normA = Math.sqrt(normA)
  normB = Math.sqrt(normB)

  if (normA === 0 || normB === 0) return 0.5
  return dotProduct / (normA * normB)
}
