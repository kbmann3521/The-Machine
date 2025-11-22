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
    'validator': 'validator',
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
  "category": "writing|url|code|image|data|validator|other",
  "content_summary": "brief description of what this input is"
}

For email addresses (name@domain.com format): use category "validator"
For IP addresses, UUIDs, hashes, domains, and other validation patterns: use category "validator"`,
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
            content: `You are an intent extraction AI for a developer tools suite. Your job is to determine what OPERATIONS or TRANSFORMATIONS the user might want to perform on their input data.

Focus on what developers typically DO with different data types, not what the content itself represents.

Return ONLY a JSON object (no markdown, no extra text) with this exact structure:
{
  "intent": "primary operation category",
  "sub_intent": "specific operation or action",
  "confidence": 0.0-1.0
}

Guidelines by input category:

URL inputs (category: url):
- Intent examples: "url_operations", "text_transformation"
- Sub-intent examples: "parse", "encode", "decode", "extract_components", "validate", "format", "convert"
- DO NOT extract intent as "access website" or "navigate" - focus on technical URL operations

Writing inputs (category: writing):
- Intent: "writing"
- Sub-intent examples: "analyze", "transform", "count_metrics", "process"

Code/JSON inputs (category: code, json):
- Intent: "code_formatting" or "data_conversion"
- Sub-intent examples: "beautify", "minify", "parse", "validate", "convert"

Data inputs (category: data):
- Intent: "data_conversion"
- Sub-intent examples: "format", "parse", "validate", "convert_format"

Common intent categories:
- writing: text analysis, transformation, processing
- url_operations: parsing, encoding, decoding, validating URLs
- code_formatting: beautifying, minifying, formatting code
- data_conversion: converting between formats
- pattern_matching: testing regex patterns, validating
- security_crypto: hashing, encoding, checksums
- text_transformation: case changes, encoding, decoding`,
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
      let fallbackIntent, fallbackSubIntent

      if (classification.category === 'email' || classification.category === 'validator') {
        fallbackIntent = 'validation'
        fallbackSubIntent = 'validate'
      } else if (classification.category === 'writing') {
        fallbackIntent = 'writing'
        fallbackSubIntent = 'text_processing'
      } else if (classification.category === 'url') {
        fallbackIntent = 'url_operations'
        fallbackSubIntent = 'parse'
      } else if (classification.category === 'code' || classification.category === 'json' || classification.category === 'html') {
        fallbackIntent = 'code_formatting'
        fallbackSubIntent = 'format'
      } else if (classification.category === 'data') {
        fallbackIntent = 'data_conversion'
        fallbackSubIntent = 'convert'
      } else {
        fallbackIntent = 'text_transformation'
        fallbackSubIntent = 'process'
      }

      intent = {
        intent: fallbackIntent,
        sub_intent: fallbackSubIntent,
        confidence: 0.5,
      }
    }

    // Override intent based on category
    if ((classification.category === 'email' || classification.category === 'validator') && intent.intent !== 'validation') {
      intent.intent = 'validation'
      intent.sub_intent = 'validate'
      intent.confidence = Math.min(1, intent.confidence + 0.3)
    } else if (classification.category === 'url' && intent.intent === 'access website') {
      intent.intent = 'url_operations'
      intent.sub_intent = 'parse'
    }
    results.intent = intent
    console.log('✓ Intent:', intent)

    // Step 3: Embedding generation
    console.log('🔍 Testing embedding generation...')
    // Generate embedding based on intent + category context
    // This ensures the embedding reflects what operations the user wants to perform

    let embeddingText = inputText
    const contextParts = []

    if (classification.category) {
      contextParts.push(`${classification.category}:`)
    }

    if (intent.intent) {
      // Add INPUT-TYPE-SPECIFIC context (not generic intent operations)
      // This makes query embeddings unique per input type
      if (classification.category === 'validator') {
        // Different context based on the specific validator pattern detected
        if (inputText.includes('@') && inputText.includes('.')) {
          // Email pattern
          contextParts.push('email address validation email format email syntax checker')
        } else if (/^(\d{1,3}\.){3}\d{1,3}$/.test(inputText.trim())) {
          // IP address pattern
          contextParts.push('IP address validation IP format IPv4 validator')
        } else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputText.trim())) {
          // UUID pattern
          contextParts.push('UUID validation GUID format UUID validator')
        } else {
          // Generic validator
          contextParts.push('validate, check format, verify, test correctness')
        }
      } else if (intent.intent === 'url_operations') {
        contextParts.push('URL parsing URL decoding URL encoding components')
      } else if (intent.intent === 'code_formatting') {
        contextParts.push('code formatting beautifier minifier syntax')
      } else if (intent.intent === 'data_conversion') {
        contextParts.push('data format conversion transformation')
      } else if (intent.intent === 'writing') {
        contextParts.push('text analysis word count character count metrics')
      } else if (intent.intent === 'text_transformation') {
        contextParts.push('case conversion encoding decoding character transformation')
      } else if (intent.intent === 'security_crypto') {
        contextParts.push('hashing encryption encoding checksum cryptography')
      } else if (intent.intent === 'pattern_matching') {
        contextParts.push('regex pattern matching validation')
      }
    }

    if (contextParts.length > 0) {
      embeddingText = contextParts.join(' ') + ' ' + inputText
    }

    const embedding = await generateEmbedding(embeddingText)
    results.embeddingGenerated = {
      text: embeddingText,
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

    // Step 5: Semantic Prediction (get full tool recommendations)
    console.log('🔍 Testing semantic prediction...')
    try {
      const predictResponse = await fetch('http://localhost:3000/api/tools/predict-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: inputText }),
      })

      if (predictResponse.ok) {
        const predictData = await predictResponse.json()
        results.semanticPredictionResults = predictData.predictedTools?.slice(0, 5) || []
        console.log('✓ Semantic prediction returned', results.semanticPredictionResults.length, 'tools')
      } else {
        results.semanticPredictionResults = []
        console.warn('Semantic prediction request failed:', predictResponse.status)
      }
    } catch (e) {
      results.semanticPredictionResults = []
      console.warn('Semantic prediction error:', e.message)
    }

    // Step 6: Database check
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
