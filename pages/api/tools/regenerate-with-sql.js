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

    // First, test OpenAI API
    console.log('🔍 Testing OpenAI API...')
    const testEmbedding = await generateEmbedding('test')
    if (!testEmbedding || testEmbedding.length !== 1536) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API test failed - embeddings not 1536 dimensions',
      })
    }
    console.log('✅ OpenAI API test passed')

    // Fetch tools
    const { data: supabaseTools } = await supabase
      .from('tools')
      .select('id, name, description')

    const results = {
      processed: 0,
      failed: 0,
      errors: [],
    }

    console.log(`📊 Processing ${supabaseTools.length} tools`)

    for (let i = 0; i < supabaseTools.length; i++) {
      const tool = supabaseTools[i]

      try {
        const toolData = TOOLS[tool.id]
        if (!toolData) continue

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
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: `Invalid embedding dimensions: ${embedding?.length}`,
          })
          continue
        }

        // Format as pgvector array string: [x,y,z,...]
        const vectorString = `[${embedding.join(',')}]`

        // Use SQL with ::vector cast to force pgvector parsing
        const { data, error } = await supabase.rpc('execute_sql_update', {
          table_name: 'tools',
          tool_id: tool.id,
          embedding_json: vectorString,
        }).catch(async () => {
          // Fallback: try using POST with raw SQL
          console.log(`[${tool.id}] RPC not available, using fetch...`)
          try {
            const sqlResponse = await fetch(
              `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/execute_sql_update`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  table_name: 'tools',
                  tool_id: tool.id,
                  embedding_json: vectorString,
                }),
              }
            )
            return { data: null, error: null }
          } catch (e) {
            return { data: null, error: e }
          }
        })

        if (error) {
          console.log(`[${tool.id}] Update error: ${error.message}`)
          results.failed++
          results.errors.push({
            toolId: tool.id,
            error: error.message,
          })
        } else {
          console.log(`[${tool.id}] ✅ Updated`)
          results.processed++
        }

        await new Promise((resolve) => setTimeout(resolve, 500))

        const progress = Math.round(((i + 1) / supabaseTools.length) * 100)
        if (i % 5 === 0) {
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
        console.error(`[${tool.id}] Exception:`, error.message)
        results.failed++
        results.errors.push({
          toolId: tool.id,
          error: error.message,
        })
      }
    }

    console.log('✅ Regeneration complete')
    res.write(
      JSON.stringify({
        status: 'complete',
        processed: results.processed,
        failed: results.failed,
        total: supabaseTools.length,
        progress: 100,
        errors: results.errors.length > 0 ? results.errors.slice(0, 10) : [],
      })
    )
    res.end()
  } catch (error) {
    console.error('Error:', error)
    res.write(JSON.stringify({ status: 'error', error: error.message }))
    res.end()
  }
}
