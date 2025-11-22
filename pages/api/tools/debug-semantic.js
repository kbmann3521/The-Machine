import { generateEmbedding, cosineSimilarity } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'
import OpenAI from '../../../lib/openaiWrapper.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Map classifier categories to actual tool categories
function mapToToolCategory(classifierCategory) {
  const mapping = {
    'writing': 'writing',
    'text': 'writing',
    'url': 'developer',
    'code': 'developer',
    'json': 'json',
    'html': 'html',
    'image': 'image-transform',
    'crypto': 'crypto',
    'formatting': 'formatter',
    'conversion': 'converter',
    'data': 'converter',
    'other': null,
  }
  return mapping[classifierCategory] || classifierCategory
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { inputText } = req.method === 'POST' ? req.body : req.query

  if (!inputText) {
    return res.status(400).json({ error: 'No input provided' })
  }

  try {
    const results = {}

    // Step 1: Classification (inline)
    console.log('🔍 Testing classification...')
    let classification
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an input classifier. Analyze the input and determine its type, category, and content summary. 
Return ONLY a JSON object (no markdown, no extra text) with this exact structure:
{
  "input_type": "text|image|url|code|file",
  "category": "writing|url|code|image|data|other",
  "content_summary": "brief description of what this input is"
}`,
          },
          {
            role: 'user',
            content: inputText.substring(0, 1000),
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
      })

      const jsonStr = response.choices[0].message.content
        .replace(/```json\n?|\n?```/g, '')
        .trim()
      classification = JSON.parse(jsonStr)
    } catch (e) {
      classification = {
        input_type: 'text',
        category: 'writing',
        content_summary: inputText.substring(0, 100),
      }
    }
    results.classification = classification

    // Map classifier category to tool category
    const mappedCategory = mapToToolCategory(classification.category)
    console.log(`✓ Classification: ${classification.category} → ${mappedCategory}`, classification)

    // Step 2: Intent Extraction (inline)
    console.log('🔍 Testing intent extraction...')
    let intent
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an intent extraction AI. Analyze the user's input and determine what they want to accomplish.
Return ONLY a JSON object with this exact structure:
{
  "intent": "category of what user wants to do",
  "sub_intent": "specific action",
  "confidence": 0.0-1.0
}`,
          },
          {
            role: 'user',
            content: `Input type: ${classification.input_type}\nCategory: ${classification.category}\nInput: ${inputText.substring(0, 1000)}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
      })

      const jsonStr = response.choices[0].message.content
        .replace(/```json\n?|\n?```/g, '')
        .trim()
      intent = JSON.parse(jsonStr)
    } catch (e) {
      intent = {
        intent: classification.category === 'writing' ? 'writing' : 'text_analysis',
        sub_intent: 'general_text_processing',
        confidence: 0.5,
      }
    }
    results.intent = intent
    console.log('✓ Intent:', intent)

    // Step 3: Embedding generation
    console.log('🔍 Testing embedding generation...')
    // Use the original input text for embedding generation, not the classification summary
    // This ensures semantic relevance to what the user actually provided
    const embedding = await generateEmbedding(inputText)
    results.embeddingGenerated = {
      text: `input_type: ${classification.input_type}, category: ${classification.category}, content: ${classification.content_summary}, intent: ${intent.intent}, sub_intent: ${intent.sub_intent}`,
      dimensions: embedding.length,
      sampleValues: embedding.slice(0, 5),
    }
    console.log('✓ Embedding generated with', embedding.length, 'dimensions')

    // Step 4: Vector search (inline, no HTTP call)
    console.log('🔍 Testing vector search...')
    console.log('  Embedding dimensions:', embedding.length)

    const { data: allTools } = await supabase
      .from('tools')
      .select('id, name, description, embedding')

    // Parse embeddings and calculate similarity
    const toolScores = allTools
      .filter(tool => tool.embedding && tool.embedding !== null && tool.embedding !== 'null')
      .map(tool => {
        let toolEmbedding

        if (typeof tool.embedding === 'string') {
          try {
            toolEmbedding = JSON.parse(tool.embedding)
          } catch (e) {
            return null
          }
        } else {
          toolEmbedding = tool.embedding
        }

        if (!Array.isArray(toolEmbedding) || toolEmbedding.length === 0) {
          return null
        }

        let similarity = cosineSimilarity(embedding, toolEmbedding)

        // Apply category boosting as PRIMARY signal for relevance
        const toolData = TOOLS[tool.id]
        if (mappedCategory && toolData && toolData.category === mappedCategory) {
          // Category match is the strongest signal when category is clearly detected
          // Add base score + semantic similarity
          // This ensures category-matched tools rank highest
          similarity = 0.7 + (similarity * 0.3)  // 0.7 base for category match + 0.3 weight for semantic similarity
        }

        return {
          id: tool.id,
          name: tool.name,
          similarity: Math.max(0, Math.min(1, similarity)),
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.similarity - a.similarity)

    results.vectorSearch = {
      error: null,
      resultsCount: toolScores.length,
      results: toolScores.slice(0, 5),
    }

    console.log('✓ Vector search returned', toolScores.length, 'results')
    if (toolScores.length > 0) {
      console.log('  Top match:', toolScores[0].name, 'similarity:', toolScores[0].similarity.toFixed(4))
    }

    // Step 5: Database check
    console.log('🔍 Checking database embeddings...')
    const { data: allToolsForStats } = await supabase
      .from('tools')
      .select('id, name, embedding')

    const embeddingStats = {
      totalTools: allToolsForStats?.length || 0,
      toolsWithEmbeddings: allToolsForStats?.filter(t => t.embedding !== null).length || 0,
    }
    results.embeddingStats = embeddingStats
    console.log('✓ Database check:', `${embeddingStats.toolsWithEmbeddings}/${embeddingStats.totalTools} tools have embeddings`)

    res.status(200).json({
      success: true,
      input: inputText,
      results,
      debugInfo: {
        semanticSearchWorking: !results.vectorSearch.error && results.vectorSearch.resultsCount > 0,
        vectorSearchError: results.vectorSearch.error,
        embeddingsInDatabase: embeddingStats.toolsWithEmbeddings > 0,
        classificationWorking: classification.category !== undefined,
        intentExtractionWorking: intent.intent !== undefined,
      },
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}
