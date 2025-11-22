import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from './lib/embeddings.js'
import { TOOLS } from './lib/tools.js'

// Use service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function regenerateEmbeddings() {
  console.log('🚀 Starting embedding regeneration with raw SQL...\n')

  try {
    // Get all tools
    const { data: tools } = await supabase.from('tools').select('id, name, description')

    console.log(`📊 Found ${tools.length} tools\n`)

    let processed = 0
    let failed = 0

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i]
      const progress = Math.round(((i + 1) / tools.length) * 100)
      process.stdout.write(
        `\r[${progress}%] ${tool.name.padEnd(30)} [${processed}/${tools.length}]`
      )

      try {
        const toolData = TOOLS[tool.id]
        if (!toolData) continue

        // Generate embedding
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

        const embedding = await generateEmbedding(embeddingText)

        if (!embedding || embedding.length !== 1536) {
          failed++
          continue
        }

        // Use direct query with ::vector cast
        const { error } = await supabase
          .from('tools')
          .update({
            embedding: `[${embedding.join(',')}]`,
          })
          .eq('id', tool.id)

        if (error) {
          console.error(`\n❌ ${tool.id}: ${error.message}`)
          failed++
        } else {
          processed++
        }

        // Rate limit
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (e) {
        console.error(`\n❌ ${tool.id}: ${e.message}`)
        failed++
      }
    }

    console.log(`\n\n✅ Complete!`)
    console.log(`   Processed: ${processed}`)
    console.log(`   Failed: ${failed}`)
    console.log(`   Total: ${tools.length}`)

    process.exit(failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    process.exit(1)
  }
}

regenerateEmbeddings()
