import { generateEmbedding } from '../../../lib/embeddings'
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

  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.EMBEDDING_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    res.setHeader('Content-Type', 'application/json')

    // Log the environment
    console.log('\n🔍 REGENERATION DEBUG START')
    console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY)
    console.log('OpenAI API Key format:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...')

    // Test one embedding first
    console.log('\n📝 Testing embedding generation for first tool...')
    res.write(JSON.stringify({ status: 'testing_embedding', progress: 0 }) + '\n')

    const testEmbedding = await generateEmbedding('test writing tool')
    console.log('Test embedding result:')
    console.log('  - Dimensions:', testEmbedding?.length)
    console.log('  - Type:', typeof testEmbedding)
    console.log('  - Is Array:', Array.isArray(testEmbedding))
    console.log('  - First 5 values:', testEmbedding?.slice(0, 5))
    console.log('  - Is 1536?:', testEmbedding?.length === 1536)
    console.log('  - Is 16 (fallback)?:', testEmbedding?.length === 16)

    res.write(
      JSON.stringify({
        status: 'test_complete',
        testEmbedding: {
          dimensions: testEmbedding?.length,
          isValid: testEmbedding?.length === 1536,
          isFallback: testEmbedding?.length === 16,
          sample: testEmbedding?.slice(0, 3),
        },
      }) + '\n'
    )

    if (testEmbedding?.length !== 1536) {
      console.log('\n❌ EMBEDDING GENERATION FAILED - Using fallback 16-dim embeddings')
      res.write(
        JSON.stringify({
          status: 'error',
          error: `Embedding generation returned ${testEmbedding?.length} dimensions instead of 1536`,
          message: 'Check your OpenAI API key and quota',
        })
      )
      res.end()
      return
    }

    console.log('✅ Embedding generation test passed')

    // Fetch tools
    const { data: supabaseTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description')

    if (fetchError || !supabaseTools) {
      throw new Error(`Failed to fetch tools: ${fetchError?.message}`)
    }

    console.log(`\n📊 Found ${supabaseTools.length} tools to process`)
    res.write(
      JSON.stringify({
        status: 'fetched_tools',
        totalTools: supabaseTools.length,
        progress: 5,
      }) + '\n'
    )

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    // Process only first 3 tools in debug mode
    const toolsToProcess = supabaseTools.slice(0, 3)

    for (let i = 0; i < toolsToProcess.length; i++) {
      const tool = toolsToProcess[i]
      console.log(`\n🔧 Processing tool ${i + 1}/${toolsToProcess.length}: ${tool.id}`)

      try {
        const toolData = TOOLS[tool.id]

        if (!toolData) {
          console.log(`  ⊘ Skipped (not in TOOLS list)`)
          results.skipped++
          continue
        }

        const detailedDesc = toolData.detailedDescription || {}
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

        console.log(`  📝 Generating embedding (text length: ${embeddingText.length})`)
        const embedding = await generateEmbedding(embeddingText)

        console.log(`  ✓ Embedding generated:`)
        console.log(`    - Dimensions: ${embedding?.length}`)
        console.log(`    - Valid 1536?: ${embedding?.length === 1536}`)
        console.log(`    - First 5 values: ${embedding?.slice(0, 5)}`)

        if (!embedding || embedding.length === 0) {
          throw new Error('Empty embedding returned')
        }

        if (embedding.length !== 1536) {
          console.log(`  ❌ Invalid dimensions: ${embedding.length}`)
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: `Invalid embedding dimensions: ${embedding.length}`,
          })
          continue
        }

        const embeddingJson = JSON.stringify(embedding)

        const { error: updateError } = await supabase
          .from('tools')
          .update({ embedding: embeddingJson })
          .eq('id', tool.id)

        if (updateError) {
          console.log(`  ❌ Database error: ${updateError.message}`)
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: updateError.message,
          })
        } else {
          console.log(`  ✅ Saved to database`)
          results.processed++
        }

        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}`)
        results.failed++
        results.errors.push({
          toolId: tool.id,
          error: error.message,
        })
      }

      const progress = 5 + Math.round(((i + 1) / toolsToProcess.length) * 90)
      res.write(
        JSON.stringify({
          status: 'processing',
          progress,
          processed: results.processed,
          current: tool.name,
        }) + '\n'
      )
    }

    console.log('\n✅ Debug regeneration complete')
    res.write(
      JSON.stringify({
        status: 'complete',
        processed: results.processed,
        failed: results.failed,
        skipped: results.skipped,
        total: toolsToProcess.length,
        progress: 100,
        errors: results.errors,
        note: 'This was a debug run with only 3 tools. Check server logs for details.',
      })
    )
    res.end()
  } catch (error) {
    console.error('Debug regeneration error:', error)
    res.write(
      JSON.stringify({
        status: 'error',
        error: error.message,
        errorType: error.constructor.name,
      })
    )
    res.end()
  }
}
