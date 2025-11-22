import { generateEmbedding, detectInputPatterns, levenshteinDistance } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Map classifier categories to actual tool categories
function mapToToolCategory(classifierCategory) {
  const mapping = {
    'writing': 'writing',
    'text': 'writing',
    'text-analyze': 'writing',
    'url': 'developer',
    'code': 'developer',
    'json': 'json',
    'html': 'html',
    'image': 'image-transform',
    'crypto': 'crypto',
    'formatting': 'formatter',
    'conversion': 'converter',
    'data': 'converter',
    'validator': 'validator',
    'other': null,
  }
  return mapping[classifierCategory] || classifierCategory
}

async function classifyInput(input) {
  try {
    const response = await fetch(`http://localhost:3000/api/tools/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    })
    return await response.json()
  } catch (error) {
    console.error('Classification error:', error)
    return { input_type: 'text', category: 'writing', content_summary: input.substring(0, 100) }
  }
}

async function extractIntent(input, inputType, category) {
  try {
    const response = await fetch(`http://localhost:3000/api/tools/extract-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, input_type: inputType, category }),
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
    `category: ${classification.category || 'unknown'}`,
    `content: ${classification.content_summary}`,
    `intent: ${intent.intent}`,
    `sub_intent: ${intent.sub_intent}`,
  ]
  return parts.join(', ')
}

async function vectorSearchTools(embeddingText, category, intent) {
  try {
    const response = await fetch(`http://localhost:3000/api/tools/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: embeddingText, category, intent }),
    })

    if (!response.ok) {
      console.warn('Vector search not available:', response.status)
      return null
    }

    const data = await response.json()
    return data.results || []
  } catch (error) {
    console.error('Vector search error:', error)
    return null
  }
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
    const mappedCategory = mapToToolCategory(classification.category)

    // STEP 2: Intent Extraction
    const intent = await extractIntent(inputContent, classification.input_type, classification.category)

    // STEP 3: Meaning Normalization (for display/logging purposes)
    const normalizedMeaning = normalizeMeaning(classification, intent)

    // STEP 4: Embedding Generation (done inside vectorSearchTools)
    // STEP 5: Vector Search
    // Pass category and intent to semantic-search for context-aware embedding generation
    let searchResults = await vectorSearchTools(inputContent, classification.category, intent, 10)

    // STEP 5.5: Boost tools matching the detected category
    if (searchResults && mappedCategory) {
      searchResults = searchResults.map((tool) => {
        const toolData = TOOLS[tool.id]
        // Boost tools with matching category when input category is clearly detected
        if (toolData?.category === mappedCategory) {
          const boostAmount = 0.35  // Strong boost for category matches
          const distance = tool.distance || 0
          const boostedDistance = Math.max(0, distance - boostAmount)
          return { ...tool, distance: boostedDistance }
        }
        return tool
      })
    }

    // STEP 6: Use vector search results directly without threshold filtering
    let predictedTools = []

    if (searchResults && searchResults.length > 0) {
      predictedTools = searchResults.map((tool) => ({
        toolId: tool.toolId || tool.id,
        name: tool.name,
        description: tool.description,
        similarity: tool.similarity || Math.max(0, Math.min(1, 1 - (tool.distance || 0))),
      }))
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

        let finalScore = (patternScore * 0.5) + (fuzzyScore * 0.5)

        // Boost writing tools in fallback when intent is writing
        if (intent.intent === 'writing' && toolData.category === 'writing') {
          finalScore = Math.min(1, finalScore + 0.25)
        }

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

    // STEP 7: Special handling for writing category
    // If classified as writing, ensure Text Toolkit is at top
    if (classification.category === 'writing' && intent.intent === 'writing') {
      const textToolkitIndex = predictedTools.findIndex(t => t.toolId === 'text-toolkit')
      if (textToolkitIndex > 0) {
        // Move Text Toolkit to the front
        const textToolkit = predictedTools[textToolkitIndex]
        predictedTools = [textToolkit, ...predictedTools.slice(0, textToolkitIndex), ...predictedTools.slice(textToolkitIndex + 1)]
      } else if (textToolkitIndex === -1) {
        // Text Toolkit not in results, add it to the front
        const toolData = TOOLS['text-toolkit']
        if (toolData) {
          predictedTools.unshift({
            toolId: 'text-toolkit',
            name: toolData.name,
            description: toolData.description,
            similarity: 0.98,
          })
        }
      }
    }

    // STEP 8: Return predictions with metadata
    res.status(200).json({
      predictedTools,
      metadata: {
        classification,
        intent,
        normalizedMeaning,
        usedVectorSearch: searchResults && searchResults.length > 0,
        debugInfo: {
          inputCategory: classification.category,
          intentType: intent.intent,
          resultCount: predictedTools.length,
        },
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
