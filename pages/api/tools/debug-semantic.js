import { generateEmbedding } from '../../../lib/embeddings'
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
    console.log('✓ Classification:', classification)

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
    const embeddingText = `input_type: ${classification.input_type}, category: ${classification.category}, content: ${classification.content_summary}, intent: ${intent.intent}, sub_intent: ${intent.sub_intent}`
    const embedding = await generateEmbedding(embeddingText)
    results.embeddingGenerated = {
      text: embeddingText.substring(0, 100) + '...',
      dimensions: embedding.length,
      sampleValues: embedding.slice(0, 5),
    }
    console.log('✓ Embedding generated with', embedding.length, 'dimensions')

    // Step 4: Vector search
    console.log('🔍 Testing vector search...')
    const { data: vectorResults, error: vectorError } = await supabase.rpc('search_tools', {
      query_embedding: embedding,
      match_count: 10,
    })

    if (vectorError) {
      results.vectorSearchError = vectorError.message
      console.log('✗ Vector search error:', vectorError.message)
    } else {
      results.vectorSearchResults = vectorResults?.slice(0, 5).map(r => ({
        id: r.id,
        name: r.name,
        distance: (r.distance || 0).toFixed(4),
        similarity: ((1 - (r.distance || 0))).toFixed(4),
      })) || []
      console.log('✓ Vector search returned', vectorResults?.length, 'results')
      if (vectorResults?.length > 0) {
        console.log('  Top match:', vectorResults[0].name, 'distance:', vectorResults[0].distance?.toFixed(4))
      }
    }

    // Step 5: Database check
    console.log('🔍 Checking database embeddings...')
    const { data: allTools } = await supabase
      .from('tools')
      .select('id, name, embedding')

    const embeddingStats = {
      totalTools: allTools?.length || 0,
      toolsWithEmbeddings: allTools?.filter(t => t.embedding !== null).length || 0,
    }
    results.embeddingStats = embeddingStats
    console.log('✓ Database check:', `${embeddingStats.toolsWithEmbeddings}/${embeddingStats.totalTools} tools have embeddings`)

    res.status(200).json({
      success: true,
      input: inputText,
      results,
      debugInfo: {
        semanticSearchWorking: !vectorError && vectorResults && vectorResults.length > 0,
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
