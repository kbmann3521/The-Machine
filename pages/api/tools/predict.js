import { generateEmbedding, cosineSimilarity, detectInputPatterns, levenshteinDistance } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'

// Map input patterns to relevant tool IDs
const patternToTools = {
  urlEncoded: ['url-converter', 'url-parser'],
  url: ['url-parser', 'url-converter'],
  json: ['json-formatter', 'escape-unescape'],
  base64: ['base64-converter', 'escape-unescape'],
  html: ['html-formatter', 'html-entities-converter', 'plain-text-stripper'],
  xml: ['xml-formatter', 'plain-text-stripper'],
  csv: ['csv-json-converter'],
  markdown: ['markdown-html-converter', 'plain-text-stripper'],
  regex: ['regex-tester', 'find-replace'],
  yaml: ['yaml-formatter'],
  timestamp: ['timestamp-converter'],
  ipAddress: ['ip-validator'],
  jwt: ['jwt-decoder', 'base64-converter'],
  email: ['email-validator'],
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

    // Fetch tools from Supabase to check show_in_recommendations flag
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: supabaseTools, error: supabaseError } = await supabase
      .from('tools')
      .select('id, show_in_recommendations')

    // Create a map of tools to check show_in_recommendations
    const visibilityMap = {}
    if (supabaseTools) {
      supabaseTools.forEach(tool => {
        visibilityMap[tool.id] = tool.show_in_recommendations !== false
      })
    }

    // Detect patterns in input
    const patterns = detectInputPatterns(inputContent)
    const detectedPatternKeys = Object.entries(patterns)
      .filter(([_, detected]) => detected)
      .map(([key, _]) => key)

    // Generate embedding for user input
    const inputEmbedding = await generateEmbedding(inputContent)

    // Calculate scores for all tools
    const toolEntries = Object.entries(TOOLS).filter(([toolId]) => {
      // Exclude generator tools
      if (generatorTools.includes(toolId)) return false
      // Exclude tools with show_in_recommendations = false (default to true if not in Supabase)
      return visibilityMap[toolId] !== false
    })
    
    const toolScores = await Promise.all(
      toolEntries.map(async ([toolId, toolData]) => {
        let patternScore = 0
        let vectorScore = 0
        let fuzzyScore = 0
        let finalScore = 0

        // For image input, prioritize image-capable tools
        if (inputImage) {
          if (toolId === 'image-resizer') {
            finalScore = 0.99
          } else if (toolData.inputTypes?.includes('image')) {
            finalScore = 0.90
          } else {
            finalScore = 0.1
          }
        } else {
          // 1. PATTERN MATCHING (40% weight)
          // Check if tool matches detected input patterns
          for (const pattern of detectedPatternKeys) {
            if (patternToTools[pattern]?.includes(toolId)) {
              patternScore = Math.max(patternScore, 0.95)
            }
          }

          // Get tool's placeholder/example text
          const toolPlaceholder = toolData.example || toolData.description || toolData.name

          // 2. FUZZY MATCHING (20% weight)
          // Fuzzy match input against tool's placeholder/example text
          fuzzyScore = levenshteinDistance(inputContent, toolPlaceholder)

          // 3. VECTOR SEMANTIC MATCHING (40% weight)
          // Compare embeddings of input and tool placeholder/example
          const toolEmbedding = await generateEmbedding(toolPlaceholder)
          vectorScore = cosineSimilarity(inputEmbedding, toolEmbedding)

          // Combine scores with weights
          finalScore = (patternScore * 0.4) + (fuzzyScore * 0.2) + (vectorScore * 0.4)
        }

        return {
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: Math.max(0, Math.min(1, finalScore)), // Clamp to 0-1 range
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
