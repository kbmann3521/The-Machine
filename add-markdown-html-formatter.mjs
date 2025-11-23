import { createClient } from '@supabase/supabase-js'
import { generateEmbedding } from './lib/embeddings.js'
import { TOOLS } from './lib/tools.js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addMarkdownHtmlFormatter() {
  try {
    console.log('🚀 Adding Markdown + HTML Formatter tool to Supabase...\n')

    const toolId = 'markdown-html-formatter'
    const toolData = TOOLS[toolId]

    if (!toolData) {
      console.error('❌ Tool not found in TOOLS registry')
      process.exit(1)
    }

    // Check if tool already exists
    const { data: existing, error: checkError } = await supabase
      .from('tools')
      .select('id')
      .eq('id', toolId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking if tool exists:', checkError)
      process.exit(1)
    }

    if (existing) {
      console.log('⚠️  Tool already exists in database. Updating...')
    } else {
      console.log('✅ Tool does not exist. Creating new entry...')
    }

    // Build embedding text from tool metadata
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

    console.log('✓ Embedding generated successfully')

    // Prepare tool data for insertion
    const toolRecord = {
      id: toolId,
      name: toolData.name,
      description: toolData.description,
      category: toolData.category,
      input_types: toolData.inputTypes,
      output_type: toolData.outputType,
      embedding: embedding,
      show_in_recommendations: toolData.show_in_recommendations !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Insert or update
    if (existing) {
      console.log('🔄 Updating tool in database...')
      const { error: updateError } = await supabase
        .from('tools')
        .update(toolRecord)
        .eq('id', toolId)

      if (updateError) {
        console.error('❌ Update failed:', updateError)
        process.exit(1)
      }
    } else {
      console.log('🔄 Inserting tool into database...')
      const { error: insertError } = await supabase
        .from('tools')
        .insert([toolRecord])

      if (insertError) {
        console.error('❌ Insert failed:', insertError)
        process.exit(1)
      }
    }

    console.log('\n✅ Markdown + HTML Formatter tool successfully added to Supabase!')
    console.log(`   Tool ID: ${toolId}`)
    console.log(`   Name: ${toolData.name}`)
    console.log(`   Category: ${toolData.category}`)
    console.log(`   Show in Recommendations: ${toolData.show_in_recommendations !== false}`)
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    if (error.stack) console.error(error.stack)
    process.exit(1)
  }
}

addMarkdownHtmlFormatter()
