import { generateEmbedding, detectInputPatterns, levenshteinDistance } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function classifyInput(input) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tools/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })
    return await response.json()
  } catch (error) {
    console.error('Classification error:', error)
    return { input_type: 'text', content_summary: input.substring(0, 100) }
  }
}

async function extractIntent(input, inputType) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tools/extract-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, input_type: inputType }),
    })
    return await response.json()
  } catch (error) {
    console.error('Intent extraction error:', error)
    return {
      intent: 'text_analysis',
      sub_intent: 'general_analysis',
      confidence: 0.5,
    }
  }
}

function normalizeMeaning(classification, intent) {
  const parts = [
    `input_type: ${classification.input_type}`,
    `content: ${classification.content_summary}`,
    `intent: ${intent.intent}`,
    `sub_intent: ${intent.sub_intent}`,
  ]
  return parts.join(', ')
}

async function vectorSearchTools(embeddingText, limit = 10) {
  try {
    const embedding = await generateEmbedding(embeddingText)

    const { data: results, error } = await supabase.rpc('search_tools', {
      query_embedding: embedding,
      match_count: limit,
    })

    if (error) {
      console.warn('Vector search not available, using pattern matching:', error)
      return null
    }

    return results || []
  } catch (error) {
    console.error('Vector search error:', error)
    return null
  }
}

function applyConfidenceThreshold(tools, threshold = 0.75) {
  return tools.filter((tool) => tool.similarity >= threshold)
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

    const supabaseTools = await supabase
      .from('tools')
      .select('id, show_in_recommendations')

    const visibilityMap = {}
    if (supabaseTools.data) {
      supabaseTools.data.forEach((tool) => {
        visibilityMap[tool.id] = tool.show_in_recommendations !== false
      })
    }

    // STEP 1: Classification
    const classification = await classifyInput(inputContent)

    // STEP 2: Intent Extraction
    const intent = await extractIntent(inputContent, classification.input_type, classification.category)

    // STEP 3: Meaning Normalization
    const normalizedMeaning = normalizeMeaning(classification, intent)

    // STEP 4: Embedding Generation (done inside vectorSearchTools)
    // STEP 5: Vector Search
    let searchResults = await vectorSearchTools(normalizedMeaning, 10)

    // STEP 6: Confidence Threshold Filtering
    let predictedTools = []

    if (searchResults && searchResults.length > 0) {
      predictedTools = applyConfidenceThreshold(
        searchResults.map((tool) => ({
          toolId: tool.id,
          name: tool.name,
          description: tool.description,
          similarity: Math.max(0, Math.min(1, 1 - (tool.distance || 0))),
        })),
        0.75
      )
    }

    // Fallback: Pattern-based matching if vector search yields no confident results
    if (predictedTools.length === 0) {
      const patterns = detectInputPatterns(inputContent)
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

      const toolScores = Object.entries(TOOLS).map(([toolId, toolData]) => {
        let patternScore = 0
        let fuzzyScore = 0

        for (const [pattern, matched] of Object.entries(patterns)) {
          if (matched && patternToTools[pattern]?.includes(toolId)) {
            patternScore = 0.95
          }
        }

        const toolPlaceholder = toolData.example || toolData.description
        fuzzyScore = levenshteinDistance(inputContent, toolPlaceholder)

        const finalScore = (patternScore * 0.5) + (fuzzyScore * 0.5)
        return {
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: Math.max(0, Math.min(1, finalScore)),
        }
      })

      predictedTools = toolScores
        .filter((t) => visibilityMap[t.toolId] !== false && t.similarity >= 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10)
    }

    // Filter by visibility
    predictedTools = predictedTools.filter(
      (t) => visibilityMap[t.toolId] !== false
    )

    // STEP 8: Return predictions with metadata
    res.status(200).json({
      predictedTools,
      metadata: {
        classification,
        intent,
        normalizedMeaning,
        usedVectorSearch: searchResults && searchResults.length > 0,
      },
    })
  } catch (error) {
    console.error('Semantic prediction error:', error)

    // Return basic results on error
    res.status(500).json({
      error: error.message,
      predictedTools: [],
    })
  }
}
