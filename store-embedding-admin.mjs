import { generateEmbedding } from './lib/embeddings.js'
import { createClient } from '@supabase/supabase-js'
import { TOOLS } from './lib/tools.js'

// Use service role key for admin access
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrY3dvaXl1eml2cXp5bmh3ZnNoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYyODIzOSwiZXhwIjoyMDc5MjA0MjM5fQ.sppZI8duJd6JFUkICCL5eK-6SKCntyn3r845u5TMkSA'
)

async function storeEmbedding() {
  try {
    console.log('🚀 Storing embedding for Markdown + HTML Formatter using service role...\n')

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

    // Update tool using admin client (bypasses RLS)
    console.log('🔐 Using service role key for admin access...')
    console.log('🔄 Updating tool in database...')
    
    const { data, error } = await supabaseAdmin
      .from('tools')
      .update({ 
        embedding,
        updated_at: new Date().toISOString()
      })
      .eq('id', toolId)
      .select()

    if (error) {
      console.error('❌ Update failed:', error)
      process.exit(1)
    }

    console.log('✓ Database update successful')
    console.log('\n✅ Markdown + HTML Formatter embedding successfully stored!')
    console.log(`   Tool ID: ${toolId}`)
    console.log(`   Embedding dimensions: 1536`)
    console.log(`   Updated at: ${new Date().toISOString()}`)
    
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

storeEmbedding()
