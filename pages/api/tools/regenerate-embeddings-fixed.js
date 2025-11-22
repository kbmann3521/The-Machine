import { generateEmbedding, formatEmbeddingForStorage } from '../../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from '../../../lib/tools'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Authentication check
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.EMBEDDING_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    res.setHeader('Content-Type', 'application/json')

    // First, test OpenAI API
    console.log('🔍 Testing OpenAI API...')
    const testResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: 'test',
      }),
    })

    const testData = await testResponse.json()

    if (!testResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API test failed',
        status: testResponse.status,
        details: testData.error?.message || 'Unknown error',
      })
    }

    if (!testData.data?.[0]?.embedding || testData.data[0].embedding.length !== 1536) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API returned invalid embedding dimensions',
        dimensions: testData.data?.[0]?.embedding?.length || 0,
      })
    }

    console.log('✅ OpenAI API test passed')

    // Now regenerate embeddings
    res.write(JSON.stringify({ status: 'fetching_tools', progress: 0 }) + '\n')

    const { data: supabaseTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description')

    if (fetchError || !supabaseTools) {
      return res.status(400).json({
        success: false,
        error: 'Failed to fetch tools from Supabase',
        details: fetchError?.message,
      })
    }

    res.write(
      JSON.stringify({
        status: 'starting_generation',
        totalTools: supabaseTools.length,
        progress: 2,
      }) + '\n'
    )

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      invalidDimensions: 0,
      errors: [],
      dimensionMismatches: [],
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

        // Boost category signal by repeating it for writing tools
        const categoryBoost =
          toolData.category === 'writing'
            ? `${toolData.category} ${toolData.category} ${toolData.category}`
            : toolData.category

        const embeddingText = [
          tool.name,
          tool.description,
          categoryBoost,
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

        // Check dimensions
        if (embedding.length !== 1536) {
          results.invalidDimensions++
          results.dimensionMismatches.push({
            toolId: tool.id,
            toolName: tool.name,
            dimensions: embedding.length,
            expected: 1536,
          })
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: `Invalid embedding dimensions: ${embedding.length} (expected 1536)`,
          })
          // Don't save invalid embeddings - continue to next tool
          continue
        }

        // Store embedding directly as array for vector column
        console.log(`[regenerate] Storing embedding for ${tool.id}:`)
        console.log(`  - Embedding type: ${typeof embedding}`)
        console.log(`  - Is array: ${Array.isArray(embedding)}`)
        console.log(`  - Dimensions: ${embedding?.length}`)
        console.log(`  - Sample: ${JSON.stringify(embedding?.slice(0, 3))}`)

        const { error: updateError, data: updateData } = await supabase
          .from('tools')
          .update({ embedding })
          .eq('id', tool.id)

        console.log(`[regenerate] Update result for ${tool.id}:`)
        console.log(`  - Error: ${updateError?.message || 'none'}`)
        console.log(`  - Data: ${JSON.stringify(updateData)}`)

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

        const progress = 2 + Math.round(((i + 1) / supabaseTools.length) * 95)
        if (i % 5 === 0) {
          // Only write progress every 5 tools to avoid too many updates
          res.write(
            JSON.stringify({
              status: 'processing',
              progress,
              processed: results.processed,
              current: tool.name,
              total: supabaseTools.length,
            }) + '\n'
          )
        }
      } catch (error) {
        results.failed++
        results.errors.push({
          toolId: tool.id,
          error: error.message,
        })
      }
    }

    const finalMessage = {
      status: 'complete',
      success: results.failed === 0 && results.invalidDimensions === 0,
      processed: results.processed,
      failed: results.failed,
      skipped: results.skipped,
      invalidDimensions: results.invalidDimensions,
      total: supabaseTools.length,
      progress: 100,
    }

    if (results.errors.length > 0 && results.errors.length <= 10) {
      finalMessage.errors = results.errors
    }

    if (results.dimensionMismatches.length > 0) {
      finalMessage.dimensionMismatches = results.dimensionMismatches
    }

    res.write(JSON.stringify(finalMessage))
    res.end()
  } catch (error) {
    console.error('Embedding regeneration error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
    })
  }
}
