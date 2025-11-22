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

        const { error: updateError } = await supabase
          .from('tools')
          .update({ embedding })
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
