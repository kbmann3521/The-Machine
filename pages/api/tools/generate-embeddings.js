import { generateEmbedding, formatEmbeddingForStorage } from '../../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Extract tool-specific keywords from actual tool data
function getToolSpecificKeywords(tool, toolData) {
  const keywords = new Set()

  // Extract from description (most important - unique to this tool)
  const desc = (tool.description || '').toLowerCase()
  const nameLower = tool.name.toLowerCase()

  // Extract specific action verbs from description
  const actionVerbs = [
    'analyze', 'transform', 'convert', 'validate', 'format', 'parse', 'extract',
    'generate', 'beautify', 'minify', 'encode', 'decode', 'count', 'check', 'verify',
    'compare', 'calculate', 'measure', 'optimize', 'resize', 'scale', 'hash',
    'encrypt', 'decrypt', 'compress', 'decompress', 'escape', 'unescape', 'strip',
    'replace', 'find', 'detect', 'analyze', 'evaluate', 'execute'
  ]

  actionVerbs.forEach(verb => {
    if (desc.includes(verb) || nameLower.includes(verb)) {
      keywords.add(verb)
    }
  })

  // Extract from features (tool-specific)
  const detailed = toolData.detailedDescription || {}
  if (detailed.features && Array.isArray(detailed.features)) {
    detailed.features.forEach(feature => {
      const featureLower = (feature || '').toLowerCase()
      // Extract keywords from each feature
      const featureWords = featureLower.split(/[\s,\-\.]+/).filter(w => w.length > 3)
      featureWords.forEach(word => {
        if (word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'to'].includes(word)) {
          keywords.add(word)
        }
      })
    })
  }

  // Extract from use cases (tool-specific)
  if (detailed.usecases && Array.isArray(detailed.usecases)) {
    detailed.usecases.forEach(usecase => {
      const usecaseLower = (usecase || '').toLowerCase()
      const caseWords = usecaseLower.split(/[\s,\-\.]+/).filter(w => w.length > 3)
      caseWords.forEach(word => {
        if (word.length > 3 && !['the', 'and', 'for', 'with', 'from', 'to'].includes(word)) {
          keywords.add(word)
        }
      })
    })
  }

  // Extract from how-to-use (tool-specific)
  if (detailed.howtouse && Array.isArray(detailed.howtouse)) {
    detailed.howtouse.forEach(step => {
      const stepLower = (step || '').toLowerCase()
      actionVerbs.forEach(verb => {
        if (stepLower.includes(verb)) {
          keywords.add(verb)
        }
      })
    })
  }

  return Array.from(keywords)
}

// Get expected input types for the embedding context
function getExpectedInputsText(toolData) {
  if (!toolData.inputTypes || toolData.inputTypes.length === 0) {
    return 'text input'
  }
  return toolData.inputTypes.map(type => {
    if (type === 'text') return 'text input'
    if (type === 'image') return 'image input'
    return `${type} input`
  }).join(', ')
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

        // Get expected input types
        const expectedInputs = getExpectedInputsText(toolData)

        // Boost category signal by repeating it for tools that need it
        const categoryBoost = toolData.category === 'writing' ? `${toolData.category} ${toolData.category} ${toolData.category}` : toolData.category

        // Build embedding text with intent operations and input expectations
        const embeddingText = [
          tool.name,
          tool.description,
          // Add expected inputs prominently
          `expects: ${expectedInputs}`,
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
