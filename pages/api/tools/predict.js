import { generateEmbedding } from '../../../lib/embeddings'
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
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/match_tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          query_embedding: userEmbedding,
          match_count: 5,
        }),
      })

      if (response.ok) {
        const toolsData = await response.json()

        if (Array.isArray(toolsData) && toolsData.length > 0) {
          const predictedTools = toolsData.map(tool => ({
            toolId: tool.id,
            name: tool.name,
            description: tool.description,
            similarity: Math.min(0.95, Math.max(0.5, tool.similarity || 0.75)),
          }))

          return res.status(200).json({
            predictedTools,
            inputContent,
          })
        }
      }
    } catch (vectorError) {
      console.log('Vector search error, using fallback:', vectorError.message)
    }

    // Fallback: Smart keyword-based tool ranking
    const lowerInput = inputContent.toLowerCase()
    let topToolIds = [
      'word-counter', 'case-converter', 'base64-converter', 'url-converter', 'html-formatter', 'json-formatter',
      'plain-text-stripper', 'slug-generator', 'reverse-text', 'html-entities-converter', 'find-replace', 'remove-extras', 'text-analyzer'
    ]

    if (inputImage) {
      topToolIds = ['image-resizer', 'word-counter', 'case-converter', 'find-replace', 'remove-extras']
    } else if (lowerInput.includes('<') && lowerInput.includes('>')) {
      // HTML content detected
      topToolIds = ['html-formatter', 'html-entities-converter', 'plain-text-stripper', 'word-counter', 'case-converter', 'find-replace', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'json-formatter', 'slug-generator', 'reverse-text']
    } else if (lowerInput.includes('{') && lowerInput.includes('}')) {
      // JSON content detected
      topToolIds = ['json-formatter', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    } else if (lowerInput.includes('http') || lowerInput.includes('%') || lowerInput.includes('?')) {
      // URL content detected
      topToolIds = ['url-converter', 'base64-converter', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    } else if (lowerInput.match(/^[a-z0-9+/]*={0,2}$/i) && lowerInput.length > 4) {
      // Potential Base64 content
      topToolIds = ['base64-converter', 'url-converter', 'word-counter', 'case-converter', 'plain-text-stripper', 'find-replace', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    }

    const fallbackTools = topToolIds
      .filter(id => TOOLS[id])
      .map((id, index) => ({
        toolId: id,
        name: TOOLS[id].name,
        description: TOOLS[id].description,
        similarity: Math.max(0.5, 0.9 - index * 0.08),
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
