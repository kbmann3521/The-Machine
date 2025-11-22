import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    const { data: tools } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .limit(5)

    const analysis = tools.map(tool => {
      let parsed = null
      let isString = false
      let isArray = false
      let dimensions = 0
      let sample = null

      if (typeof tool.embedding === 'string') {
        isString = true
        try {
          parsed = JSON.parse(tool.embedding)
          if (Array.isArray(parsed)) {
            isArray = true
            dimensions = parsed.length
            sample = parsed.slice(0, 3)
          }
        } catch (e) {
          parsed = `PARSE ERROR: ${e.message}`
        }
      } else if (Array.isArray(tool.embedding)) {
        isArray = true
        dimensions = tool.embedding.length
        sample = tool.embedding.slice(0, 3)
      }

      return {
        id: tool.id,
        name: tool.name,
        storageType: typeof tool.embedding,
        isString,
        isArray,
        dimensions,
        sample,
        rawLength: tool.embedding?.length || 0,
        firstChars: typeof tool.embedding === 'string' ? tool.embedding.substring(0, 100) : 'NOT STRING',
      }
    })

    res.status(200).json({
      analysis,
      expectation: 'isString: true, isArray: true (after parse), dimensions: 1536',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
