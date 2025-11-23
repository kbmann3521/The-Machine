import { generateEmbedding } from './lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from './lib/tools.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function generateMarkdownFormatterEmbedding() {
  try {
    console.log('🚀 Generating embedding for Markdown + HTML Formatter...\n')

    const toolId = 'markdown-html-formatter'
    const toolData = TOOLS[toolId]

    if (!toolData) {
      console.error('❌ Tool not found in TOOLS registry')
      process.exit(1)
    }

    // Build embedding text
    const detailedDesc = toolData.detailedDescription || {}
    const embeddingText = [
      toolData.name,
      toolData.description,
      toolData.category,
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

    console.log('📝 Generating embedding...')
    const embedding = await generateEmbedding(embeddingText)

    if (!embedding || embedding.length !== 1536) {
      console.error('❌ Invalid embedding generated')
      process.exit(1)
    }

    console.log('✓ Embedding generated successfully (1536 dimensions)')

    // Update tool in database
    console.log('🔄 Updating tool in database...')
    const { error: updateError } = await supabase
      .from('tools')
      .update({ embedding, updated_at: new Date().toISOString() })
      .eq('id', toolId)

    if (updateError) {
      console.error('❌ Update failed:', updateError)
      process.exit(1)
    }

    console.log('\n✅ Markdown + HTML Formatter embedding successfully generated and stored!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

generateMarkdownFormatterEmbedding()
