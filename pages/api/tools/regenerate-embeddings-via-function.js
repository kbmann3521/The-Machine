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

    // Test OpenAI
    console.log('🔍 Testing OpenAI API...')
    const testEmbedding = await generateEmbedding('test')
    if (!testEmbedding || testEmbedding.length !== 1536) {
      return res.status(500).json({
        success: false,
        error: 'OpenAI API failed',
      })
    }

    // Get tools
    const { data: tools } = await supabase.from('tools').select('id, name, description')

    res.write(JSON.stringify({ status: 'starting', totalTools: tools.length }) + '\n')

    let processed = 0
    let failed = 0
    const errors = []

    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i]

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
          failed++
          continue
        }

        // Call the SQL function to update with proper pgvector casting
        console.log(`[${tool.id}] Calling update_tool_embedding function...`)
        let rpcError = null

        try {
          const result = await supabase.rpc('update_tool_embedding', {
            tool_id: tool.id,
            embedding_array: embedding,
          })
          rpcError = result.error
        } catch (e) {
          rpcError = { message: e.message }
        }

        if (rpcError) {
          console.error(`[${tool.id}] RPC error: ${rpcError.message}`)
          failed++
          errors.push({ toolId: tool.id, error: rpcError.message })
        } else {
          console.log(`[${tool.id}] ✅ Updated`)
          processed++
        }

        await new Promise((resolve) => setTimeout(resolve, 500))

        const progress = Math.round(((i + 1) / tools.length) * 100)
        if (i % 5 === 0) {
          res.write(
            JSON.stringify({
              status: 'processing',
              progress,
              processed,
              total: tools.length,
            }) + '\n'
          )
        }
      } catch (error) {
        console.error(`[${tool.id}] Exception:`, error.message)
        failed++
        errors.push({ toolId: tool.id, error: error.message })
      }
    }

    console.log(`✅ Done: ${processed} processed, ${failed} failed`)
    res.write(
      JSON.stringify({
        status: 'complete',
        processed,
        failed,
        total: tools.length,
        errors: errors.slice(0, 5),
      })
    )
    res.end()
  } catch (error) {
    console.error('Error:', error)
    res.write(JSON.stringify({ status: 'error', error: error.message }))
    res.end()
  }
}
