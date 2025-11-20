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
    let topToolIds = []

    if (inputImage) {
      topToolIds = ['image-resizer', 'image-to-base64']
    } else if (lowerInput.includes('html') || (lowerInput.includes('<') && lowerInput.includes('>'))) {
      topToolIds = ['html-formatter', 'html-entities-converter', 'plain-text-stripper', 'markdown-html-converter', 'word-counter', 'case-converter', 'find-replace', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'json-formatter', 'slug-generator', 'reverse-text']
    } else if (lowerInput.includes('json') || (lowerInput.includes('{') && lowerInput.includes('}'))) {
      topToolIds = ['json-formatter', 'json-path-extractor', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'base64-converter', 'url-converter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    } else if (lowerInput.includes('http://') || lowerInput.includes('https://') || lowerInput.includes('url') || lowerInput.includes('://')) {
      topToolIds = ['url-parser', 'url-converter', 'base64-converter', 'plain-text-stripper', 'word-counter', 'find-replace', 'case-converter', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text']
    } else if (lowerInput.match(/^[a-z0-9+/]*={0,2}$/i) && lowerInput.length > 4) {
      topToolIds = ['base64-converter', 'url-converter', 'word-counter', 'case-converter', 'plain-text-stripper', 'find-replace', 'remove-extras', 'text-analyzer', 'json-formatter', 'html-formatter', 'slug-generator', 'reverse-text', 'html-entities-converter']
    } else if (lowerInput.includes('regex') || lowerInput.includes('pattern') || lowerInput.includes('match')) {
      topToolIds = ['regex-tester', 'find-replace', 'word-counter', 'text-analyzer', 'plain-text-stripper']
    } else if (lowerInput.includes('uuid') || lowerInput.includes('guid') || lowerInput.includes('identifier')) {
      topToolIds = ['uuid-generator', 'uuid-validator']
    } else if (lowerInput.includes('csv') || lowerInput.includes('comma')) {
      topToolIds = ['csv-json-converter', 'json-formatter']
    } else if (lowerInput.includes('yaml') || lowerInput.includes('yml') || lowerInput.includes('config')) {
      topToolIds = ['yaml-formatter', 'xml-formatter', 'json-formatter']
    } else if (lowerInput.includes('xml')) {
      topToolIds = ['xml-formatter', 'html-formatter', 'plain-text-stripper']
    } else if (lowerInput.includes('markdown') || lowerInput.includes('.md')) {
      topToolIds = ['markdown-html-converter', 'html-formatter', 'plain-text-stripper']
    } else if (lowerInput.includes('color') || lowerInput.includes('rgb') || lowerInput.includes('hex') || /^#[0-9a-f]{6}/i.test(lowerInput)) {
      topToolIds = ['color-converter']
    } else if (lowerInput.includes('jwt') || lowerInput.includes('token')) {
      topToolIds = ['jwt-decoder', 'base64-converter']
    } else if (lowerInput.includes('timestamp') || lowerInput.includes('unix') || /^\d{10}/.test(lowerInput)) {
      topToolIds = ['timestamp-converter', 'timezone-converter']
    } else if (lowerInput.includes('hash') || lowerInput.includes('md5') || lowerInput.includes('sha')) {
      topToolIds = ['hash-generator', 'checksum-calculator']
    } else if (lowerInput.includes('password') || lowerInput.includes('secure')) {
      topToolIds = ['password-generator']
    } else if (lowerInput.includes('qr') || lowerInput.includes('barcode')) {
      topToolIds = ['qr-code-generator']
    } else if (lowerInput.includes('base64') || lowerInput.includes('encode') || lowerInput.includes('decode')) {
      topToolIds = ['base64-converter', 'url-converter', 'html-entities-converter']
    } else if (lowerInput.includes('case') || lowerInput.includes('uppercase') || lowerInput.includes('lowercase')) {
      topToolIds = ['case-converter', 'slug-generator']
    } else if (lowerInput.includes('reverse')) {
      topToolIds = ['reverse-text']
    } else if (lowerInput.includes('slug') || lowerInput.includes('slug-friendly')) {
      topToolIds = ['slug-generator']
    } else if (lowerInput.includes('sql')) {
      topToolIds = ['sql-formatter']
    } else if (lowerInput.includes('css')) {
      topToolIds = ['css-formatter']
    } else if (lowerInput.includes('http')) {
      topToolIds = ['http-status-lookup', 'http-header-parser']
    } else if (lowerInput.includes('mime')) {
      topToolIds = ['mime-type-lookup']
    } else if (lowerInput.includes('escape') || lowerInput.includes('unescape')) {
      topToolIds = ['escape-unescape']
    } else if (lowerInput.includes('sort')) {
      topToolIds = ['sort-lines']
    } else if (lowerInput.includes('diff') || lowerInput.includes('compare')) {
      topToolIds = ['text-diff-checker']
    } else if (lowerInput.includes('unit') || lowerInput.includes('convert')) {
      topToolIds = ['unit-converter', 'file-size-converter', 'number-formatter']
    } else if (lowerInput.includes('cron')) {
      topToolIds = ['cron-tester']
    } else if (lowerInput.includes('ascii') || lowerInput.includes('unicode')) {
      topToolIds = ['ascii-unicode-converter']
    } else if (lowerInput.includes('punycode') || lowerInput.includes('domain')) {
      topToolIds = ['punycode-converter', 'url-parser']
    } else if (lowerInput.includes('binary') || lowerInput.includes('hex') || lowerInput.includes('octal')) {
      topToolIds = ['binary-converter', 'base-converter']
    } else if (lowerInput.includes('rot13') || lowerInput.includes('cipher') || lowerInput.includes('caesar')) {
      topToolIds = ['rot13-cipher', 'caesar-cipher']
    } else if (lowerInput.includes('svg')) {
      topToolIds = ['svg-optimizer']
    } else if (lowerInput.includes('whitespace') || lowerInput.includes('space')) {
      topToolIds = ['whitespace-visualizer', 'remove-extras']
    } else if (lowerInput.includes('math') || lowerInput.includes('calculate')) {
      topToolIds = ['math-evaluator']
    } else if (lowerInput.includes('keyword')) {
      topToolIds = ['keyword-extractor']
    }

    // If no specific pattern matched, use general tools
    if (topToolIds.length === 0) {
      topToolIds = [
        'word-counter', 'text-analyzer', 'case-converter', 'base64-converter', 'url-converter', 'html-formatter', 'json-formatter',
        'plain-text-stripper', 'slug-generator', 'reverse-text', 'html-entities-converter', 'find-replace', 'remove-extras',
        'uuid-generator', 'regex-tester', 'hash-generator', 'timestamp-converter', 'password-generator', 'csv-json-converter',
        'markdown-html-converter', 'xml-formatter', 'yaml-formatter', 'url-parser', 'jwt-decoder', 'qr-code-generator',
        'text-diff-checker', 'color-converter', 'checksum-calculator'
      ]
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
