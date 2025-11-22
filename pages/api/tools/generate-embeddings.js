import { generateEmbedding, formatEmbeddingForStorage } from '../../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Category-to-intent operations mapping
// Maps tool categories to the operations users want to perform
const categoryIntentOperations = {
  writing: ['analyze', 'transform', 'process', 'convert case', 'count', 'clean', 'format', 'find and replace', 'extract', 'generate slug'],
  encoding: ['encode', 'decode', 'escape', 'unescape', 'convert', 'transform format'],
  url: ['parse', 'encode', 'decode', 'validate', 'extract components', 'extract path', 'extract query', 'analyze structure'],
  json: ['beautify', 'minify', 'format', 'validate', 'parse', 'indent', 'compact', 'extract path'],
  html: ['format', 'beautify', 'minify', 'validate', 'parse', 'convert entities', 'strip tags'],
  xml: ['format', 'beautify', 'minify', 'validate', 'parse', 'prettify'],
  developer: ['parse', 'decode', 'validate', 'extract', 'analyze', 'test', 'lookup', 'generate'],
  crypto: ['encode', 'decode', 'hash', 'encrypt', 'validate', 'generate', 'checksum'],
  converter: ['convert', 'transform', 'encode', 'decode', 'calculate'],
  formatter: ['format', 'beautify', 'minify', 'prettify', 'validate', 'parse'],
  validator: ['validate', 'check', 'verify', 'test', 'analyze'],
  'image-transform': ['resize', 'scale', 'transform', 'optimize', 'convert'],
  calculator: ['calculate', 'compute', 'convert', 'analyze'],
  'text-analyze': ['analyze', 'extract', 'count', 'calculate', 'measure'],
  'text-transform': ['format', 'convert', 'transform', 'parse'],
  'text-analyze': ['analyze', 'extract', 'count', 'measure', 'detect'],
}

// Extract intent keywords from tool data
function getToolIntentKeywords(tool, toolData) {
  const keywords = []

  // Get category-based operations
  const category = toolData.category || 'developer'
  const categoryOps = categoryIntentOperations[category] || []
  keywords.push(...categoryOps)

  // Extract from detailed description
  const detailed = toolData.detailedDescription || {}
  if (detailed.howtouse) {
    const actions = detailed.howtouse.join(' ').toLowerCase()
    // Extract common action verbs
    const actionVerbs = ['analyze', 'transform', 'convert', 'validate', 'format', 'parse', 'extract', 'generate', 'beautify', 'minify', 'encode', 'decode', 'count', 'check', 'verify']
    actionVerbs.forEach(verb => {
      if (actions.includes(verb) && !keywords.includes(verb)) {
        keywords.push(verb)
      }
    })
  }

  // Add name-based operations
  const nameLower = tool.name.toLowerCase()
  if (nameLower.includes('formatter')) keywords.push('format', 'beautify')
  if (nameLower.includes('converter')) keywords.push('convert', 'transform')
  if (nameLower.includes('validator')) keywords.push('validate', 'check', 'verify')
  if (nameLower.includes('parser')) keywords.push('parse', 'extract', 'analyze')
  if (nameLower.includes('encoder')) keywords.push('encode', 'decode')
  if (nameLower.includes('generator')) keywords.push('generate', 'create')
  if (nameLower.includes('analyzer')) keywords.push('analyze', 'extract', 'measure')

  // Remove duplicates
  return [...new Set(keywords)]
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Optional: Add authentication check
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.EMBEDDING_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    res.setHeader('Content-Type', 'application/json')
    res.write('{"status":"generating","progress":0}\n')

    const { data: supabaseTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description')

    if (fetchError || !supabaseTools) {
      return res
        .status(400)
        .json({ error: 'Failed to fetch tools from Supabase' })
    }

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    for (let i = 0; i < supabaseTools.length; i++) {
      const tool = supabaseTools[i]

      try {
        const toolData = TOOLS[tool.id]

        if (!toolData) {
          results.skipped++
          continue
        }

        const detailedDesc = toolData.detailedDescription || {}

        // Get intent-aware keywords for this tool
        const intentKeywords = getToolIntentKeywords(tool, toolData)
        const intentPhrase = intentKeywords.join(', ')

        // Boost category signal by repeating it for tools that need it
        const categoryBoost = toolData.category === 'writing' ? `${toolData.category} ${toolData.category} ${toolData.category}` : toolData.category

        // Build embedding text with intent operations
        const embeddingText = [
          tool.name,
          tool.description,
          // Add intent operations prominently
          `operations: ${intentPhrase}`,
          // Add category boost
          categoryBoost,
          // Add detailed context
          detailedDesc.overview,
          detailedDesc.howtouse?.join(' '),
          detailedDesc.features?.join(' '),
          detailedDesc.usecases?.join(' '),
          toolData.example,
          toolData.inputTypes?.join(' '),
          toolData.outputType,
        ]
          .filter(Boolean)
          .join(' ')

        const embedding = await generateEmbedding(embeddingText)

        if (!embedding || embedding.length === 0) {
          throw new Error('Empty embedding returned')
        }

        // Verify we got a real embedding (1536 dimensions) not a fallback
        if (embedding.length !== 1536) {
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: `Invalid embedding dimensions: ${embedding.length} (expected 1536)`,
          })
          continue
        }

        // Use SQL function for proper pgvector handling
        let updateError = null
        try {
          const result = await supabase.rpc('update_tool_embedding', {
            tool_id: tool.id,
            embedding_array: embedding,
          })
          updateError = result.error
        } catch (e) {
          updateError = { message: e.message }
        }

        if (updateError) {
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: updateError.message,
          })
        } else {
          results.processed++
        }

        // Rate limiting for OpenAI API (2-3 requests per second)
        await new Promise((resolve) => setTimeout(resolve, 500))

        const progress = Math.round(((i + 1) / supabaseTools.length) * 100)
        res.write(
          JSON.stringify({
            status: 'processing',
            progress,
            processed: results.processed,
            total: supabaseTools.length,
          }) + '\n'
        )
      } catch (error) {
        results.failed++
        results.errors.push({
          toolId: tool.id,
          error: error.message,
        })
      }
    }

    res.write(
      JSON.stringify({
        status: 'complete',
        ...results,
        total: supabaseTools.length,
      })
    )
    res.end()
  } catch (error) {
    console.error('Embedding generation error:', error)
    res.status(500).json({ error: error.message })
  }
}
