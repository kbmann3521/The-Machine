import { generateEmbedding } from './lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from './lib/tools.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function regenerateEmbeddings() {
  const authKey = process.env.EMBEDDING_SECRET_KEY
  if (!authKey) {
    console.error('❌ EMBEDDING_SECRET_KEY not set in environment')
    process.exit(1)
  }

  try {
    console.log('🚀 Starting embedding regeneration with enhanced metadata...\n')

    const { data: supabaseTools, error: fetchError } = await supabase
      .from('tools')
      .select('id, name, description')

    if (fetchError || !supabaseTools) {
      console.error('❌ Failed to fetch tools from Supabase:', fetchError)
      process.exit(1)
    }

    const results = {
      processed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
    }

    console.log(`📊 Found ${supabaseTools.length} tools to process\n`)

    for (let i = 0; i < supabaseTools.length; i++) {
      const tool = supabaseTools[i]
      const progress = Math.round(((i + 1) / supabaseTools.length) * 100)
      process.stdout.write(`\rProgress: ${progress}% (${i + 1}/${supabaseTools.length}) - ${tool.name.padEnd(30)}`)

      try {
        const toolData = TOOLS[tool.id]

        if (!toolData) {
          results.skipped++
          continue
        }

        // Build rich embedding text from all available tool metadata
        const detailedDesc = toolData.detailedDescription || {}

        // Boost category signal by repeating it for writing tools
        const categoryBoost = toolData.category === 'writing' ? `${toolData.category} ${toolData.category} ${toolData.category}` : toolData.category

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

        // Verify we got a real embedding (1536 dimensions) not a fallback
        if (embedding.length !== 1536) {
          console.warn(`⚠️  Warning: Tool ${tool.id} got ${embedding.length}-dimensional embedding (expected 1536)`)
        }

        // Store as JSON string to ensure proper persistence
        const embeddingJson = JSON.stringify(embedding)

        const { error: updateError } = await supabase
          .from('tools')
          .update({ embedding: embeddingJson })
          .eq('id', tool.id)

        if (updateError) {
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: updateError.message,
          })
        } else {
          results.processed++
        }

        // Rate limiting for OpenAI API
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        results.failed++
        results.errors.push({
          toolId: tool.id,
          error: error.message,
        })
      }
    }

    console.log('\n\n✅ Embedding regeneration complete!')
    console.log(`\n📈 Results:`)
    console.log(`   ✓ Processed: ${results.processed}`)
    console.log(`   ✗ Failed: ${results.failed}`)
    console.log(`   ⊘ Skipped: ${results.skipped}`)
    console.log(`   Total: ${results.total || supabaseTools.length}`)

    if (results.errors.length > 0) {
      console.log(`\n⚠️  Errors:`)
      results.errors.forEach((err) => {
        console.log(`   ${err.toolId}: ${err.error}`)
      })
    }

    process.exit(results.failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

regenerateEmbeddings()
