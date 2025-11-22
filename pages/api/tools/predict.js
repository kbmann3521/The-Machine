import { generateEmbedding, cosineSimilarity, detectInputPatterns, levenshteinDistance } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

async function getVisibilityMap() {
  const { data: supabaseTools } = await supabase
    .from('tools')
    .select('id, show_in_recommendations')

  const visibilityMap = {}
  if (supabaseTools) {
    supabaseTools.forEach(tool => {
      visibilityMap[tool.id] = tool.show_in_recommendations !== false
    })
  }
  return visibilityMap
}

async function useSemanticPrediction(inputContent) {
  try {
    // Try to use the semantic pipeline
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tools/predict-semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: inputContent }),
    })

    if (response.ok) {
      const data = await response.json()
      if (data.predictedTools && data.predictedTools.length > 0) {
        return data.predictedTools
      }
    }
  } catch (error) {
    console.warn('Semantic prediction not available, falling back to pattern matching:', error.message)
  }

  return null
}

async function usePatternMatching(inputContent, visibilityMap) {
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

  const patterns = detectInputPatterns(inputContent)
  const detectedPatternKeys = Object.entries(patterns)
    .filter(([_, detected]) => detected)
    .map(([key, _]) => key)

  // Check if input is plain English text (writing)
  const isPlainEnglish = /[.!?]|[a-z]\s+[a-z]|the\s|and\s|or\s|is\s|a\s|to\s/i.test(inputContent) &&
                         inputContent.length > 10 &&
                         detectedPatternKeys.length === 0

  const inputEmbedding = await generateEmbedding(inputContent)

  const toolEntries = Object.entries(TOOLS).filter(([toolId]) => {
    if (generatorTools.includes(toolId)) return false
    return visibilityMap[toolId] !== false
  })

  const toolScores = await Promise.all(
    toolEntries.map(async ([toolId, toolData]) => {
      let patternScore = 0
      let vectorScore = 0
      let fuzzyScore = 0

      // 1. PATTERN MATCHING (40% weight)
      for (const pattern of detectedPatternKeys) {
        if (patternToTools[pattern]?.includes(toolId)) {
          patternScore = Math.max(patternScore, 0.95)
        }
      }

      const toolPlaceholder = toolData.example || toolData.description || toolData.name

      // 2. FUZZY MATCHING (20% weight)
      fuzzyScore = levenshteinDistance(inputContent, toolPlaceholder)

      // 3. VECTOR SEMANTIC MATCHING (40% weight)
      const toolEmbedding = await generateEmbedding(toolPlaceholder)
      vectorScore = cosineSimilarity(inputEmbedding, toolEmbedding)

      let finalScore = (patternScore * 0.4) + (fuzzyScore * 0.2) + (vectorScore * 0.4)

      // BONUS: Boost writing tools when input is plain English
      if (isPlainEnglish && toolData.category === 'writing') {
        finalScore = Math.min(1, finalScore + 0.35)
      }

      return {
        toolId,
        name: toolData.name,
        description: toolData.description,
        similarity: Math.max(0, Math.min(1, finalScore)),
      }
    })
  )

  const results = toolScores.sort((a, b) => b.similarity - a.similarity)

  // If plain English detected, ensure Text Toolkit is at the top
  if (isPlainEnglish) {
    const textToolkitIndex = results.findIndex(t => t.toolId === 'text-toolkit')
    if (textToolkitIndex > 0) {
      const textToolkit = results[textToolkitIndex]
      results.unshift(textToolkit)
      results.splice(textToolkitIndex + 1, 1)
    } else if (textToolkitIndex === -1) {
      // Add Text Toolkit if missing
      results.unshift({
        toolId: 'text-toolkit',
        name: TOOLS['text-toolkit'].name,
        description: TOOLS['text-toolkit'].description,
        similarity: 0.98,
      })
    }
  }

  return results
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
    const visibilityMap = await getVisibilityMap()

    let predictedTools = []

    // For image input, prioritize image-capable tools
    if (inputImage) {
      const imageTools = Object.entries(TOOLS)
        .filter(([toolId, toolData]) => {
          if (toolId === 'image-resizer') return true
          return toolData.inputTypes?.includes('image')
        })
        .map(([toolId, toolData]) => ({
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: toolId === 'image-resizer' ? 0.99 : 0.90,
        }))

      predictedTools = imageTools.filter(t => visibilityMap[t.toolId] !== false)
    } else {
      // Try semantic prediction first
      const semanticResults = await useSemanticPrediction(inputContent)

      if (semanticResults && semanticResults.length > 0) {
        predictedTools = semanticResults
        console.log('✓ Using semantic prediction for:', inputContent.substring(0, 50))
      } else {
        // Fallback to pattern matching
        console.warn('⚠ Falling back to pattern matching for:', inputContent.substring(0, 50))
        predictedTools = await usePatternMatching(inputContent, visibilityMap)
      }
    }

    res.status(200).json({
      predictedTools,
      inputContent,
      _debug: {
        usedSemantic: predictedTools.length > 0 && predictedTools[0].toolId === 'text-toolkit',
        topMatch: predictedTools[0]?.name,
      },
    })
  } catch (error) {
    console.error('Prediction error:', error)
    res.status(500).json({ error: error.message })
  }
}
