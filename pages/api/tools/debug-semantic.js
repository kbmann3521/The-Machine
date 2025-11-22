import { generateEmbedding } from '../../../lib/embeddings'
import { TOOLS } from '../../../lib/tools'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

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

    // Step 1: Test classification
    console.log('🔍 Testing classification...')
    const classifyResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tools/classify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: inputText }),
    })
    const classification = await classifyResp.json()
    results.classification = classification
    console.log('✓ Classification:', classification)

    // Step 2: Test intent extraction
    console.log('🔍 Testing intent extraction...')
    const intentResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tools/extract-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: inputText, 
        input_type: classification.input_type,
        category: classification.category
      }),
    })
    const intent = await intentResp.json()
    results.intent = intent
    console.log('✓ Intent:', intent)

    // Step 3: Test embedding generation
    console.log('🔍 Testing embedding generation...')
    const embeddingText = `input_type: ${classification.input_type}, category: ${classification.category}, content: ${classification.content_summary}, intent: ${intent.intent}, sub_intent: ${intent.sub_intent}`
    const embedding = await generateEmbedding(embeddingText)
    results.embeddingGenerated = {
      text: embeddingText.substring(0, 100) + '...',
      dimensions: embedding.length,
      sampleValues: embedding.slice(0, 5),
    }
    console.log('✓ Embedding generated with', embedding.length, 'dimensions')

    // Step 4: Test vector search
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
        distance: r.distance.toFixed(4),
        similarity: (1 - r.distance).toFixed(4),
      })) || []
      console.log('✓ Vector search returned', vectorResults?.length, 'results')
      if (vectorResults?.length > 0) {
        console.log('  Top match:', vectorResults[0].name, 'distance:', vectorResults[0].distance.toFixed(4))
      }
    }

    // Step 5: Test semantic prediction endpoint
    console.log('🔍 Testing semantic prediction endpoint...')
    const semanticResp = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tools/predict-semantic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText }),
    })
    const semanticData = await semanticResp.json()
    results.semanticPredictionResults = semanticData.predictedTools?.slice(0, 5) || []
    console.log('✓ Semantic prediction returned', semanticData.predictedTools?.length, 'results')
    if (semanticData.predictedTools?.length > 0) {
      console.log('  Top match:', semanticData.predictedTools[0].name, 'similarity:', semanticData.predictedTools[0].similarity.toFixed(4))
    }

    // Step 6: Check database embeddings
    console.log('🔍 Checking database embeddings...')
    const { data: toolsWithEmbeddings } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .limit(5)

    const embeddingStats = {
      toolsChecked: toolsWithEmbeddings?.length || 0,
      toolsWithEmbeddings: toolsWithEmbeddings?.filter(t => t.embedding !== null).length || 0,
    }
    results.embeddingStats = embeddingStats
    console.log('✓ Database check:', `${embeddingStats.toolsWithEmbeddings}/${embeddingStats.toolsChecked} tools have embeddings`)

    res.status(200).json({
      success: true,
      input: inputText,
      results,
      debugInfo: {
        semanticSearchWorking: !vectorError && vectorResults && vectorResults.length > 0,
        embeddingsInDatabase: embeddingStats.toolsWithEmbeddings > 0,
        classificationWorking: classification.category !== undefined,
        intentExtractionWorking: intent.intent !== undefined,
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
}
