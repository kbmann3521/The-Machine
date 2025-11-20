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
      'plain-text-stripper', 'slug-generator', 'reverse-text', 'html-entities-converter', 'find-replace', 'remove-extras', 'text-analyzer',
      'uuid-generator', 'regex-tester', 'hash-generator', 'timestamp-converter', 'password-generator', 'csv-json-converter',
      'markdown-html-converter', 'xml-formatter', 'yaml-formatter', 'url-parser', 'jwt-decoder', 'qr-code-generator',
      'text-diff-checker', 'color-converter', 'checksum-calculator'
    ]

    if (inputImage) {
      topToolIds = ['image-resizer', 'word-counter', 'case-converter', 'find-replace', 'remove-extras']
    } else if (lowerInput.includes('html') || (lowerInput.includes('<') && lowerInput.includes('>'))) {
      // HTML content detected - moved first to catch "html" keyword
      topToolIds = ['html-formatter', 'html-entities-converter', 'plain-text-stripper', 'markdown-html-converter', 'word-counter', 'case-converter', 'find-replace', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'json-formatter', 'slug-generator', 'reverse-text']
    } else if (lowerInput.includes('json') || (lowerInput.includes('{') && lowerInput.includes('}'))) {
      // JSON content detected
      topToolIds = ['json-formatter', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    } else if (lowerInput.includes('http') || lowerInput.includes('url') || lowerInput.includes('%') || lowerInput.includes('?')) {
      // URL content detected
      topToolIds = ['url-converter', 'url-parser', 'base64-converter', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text']
    } else if (lowerInput.match(/^[a-z0-9+/]*={0,2}$/i) && lowerInput.length > 4) {
      // Potential Base64 content
      topToolIds = ['base64-converter', 'url-converter', 'word-counter', 'case-converter', 'plain-text-stripper', 'find-replace', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    } else if (lowerInput.includes('regex') || lowerInput.includes('pattern') || lowerInput.includes('match')) {
      topToolIds = ['regex-tester', 'find-replace', 'word-counter', 'plain-text-stripper', ...topToolIds.filter(t => !['regex-tester', 'find-replace', 'word-counter', 'plain-text-stripper'].includes(t))]
    } else if (lowerInput.includes('uuid') || lowerInput.includes('guid') || lowerInput.includes('identifier')) {
      topToolIds = ['uuid-generator', ...topToolIds.filter(t => t !== 'uuid-generator')]
    } else if (lowerInput.includes('csv') || lowerInput.includes('comma')) {
      topToolIds = ['csv-json-converter', 'json-formatter', ...topToolIds.filter(t => !['csv-json-converter', 'json-formatter'].includes(t))]
    } else if (lowerInput.includes('yaml') || lowerInput.includes('yml') || lowerInput.includes('config')) {
      topToolIds = ['yaml-formatter', 'xml-formatter', ...topToolIds.filter(t => !['yaml-formatter', 'xml-formatter'].includes(t))]
    } else if (lowerInput.includes('xml')) {
      topToolIds = ['xml-formatter', 'html-formatter', ...topToolIds.filter(t => !['xml-formatter', 'html-formatter'].includes(t))]
    } else if (lowerInput.includes('markdown') || lowerInput.includes('.md')) {
      topToolIds = ['markdown-html-converter', 'html-formatter', ...topToolIds.filter(t => !['markdown-html-converter', 'html-formatter'].includes(t))]
    } else if (lowerInput.includes('color') || lowerInput.includes('rgb') || lowerInput.includes('hex') || /^#[0-9a-f]{6}/i.test(lowerInput)) {
      topToolIds = ['color-converter', ...topToolIds.filter(t => t !== 'color-converter')]
    } else if (lowerInput.includes('jwt') || lowerInput.includes('token')) {
      topToolIds = ['jwt-decoder', 'base64-converter', ...topToolIds.filter(t => !['jwt-decoder', 'base64-converter'].includes(t))]
    } else if (lowerInput.includes('timestamp') || lowerInput.includes('unix') || /^\d{10}/.test(lowerInput)) {
      topToolIds = ['timestamp-converter', ...topToolIds.filter(t => t !== 'timestamp-converter')]
    } else if (lowerInput.includes('hash') || lowerInput.includes('md5') || lowerInput.includes('sha')) {
      topToolIds = ['hash-generator', 'checksum-calculator', ...topToolIds.filter(t => !['hash-generator', 'checksum-calculator'].includes(t))]
    } else if (lowerInput.includes('password') || lowerInput.includes('secure')) {
      topToolIds = ['password-generator', ...topToolIds.filter(t => t !== 'password-generator')]
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
