import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, name, embedding')
      .limit(10)

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const analysis = tools.map(tool => ({
      id: tool.id,
      name: tool.name,
      embeddingType: typeof tool.embedding,
      embeddingLength: Array.isArray(tool.embedding) ? tool.embedding.length : 'NOT AN ARRAY',
      embeddingIsNull: tool.embedding === null,
      sampleValues: Array.isArray(tool.embedding) ? tool.embedding.slice(0, 3) : null,
    }))

    res.status(200).json({
      totalTools: tools.length,
      sampleTools: analysis,
      expectation: '1536 dimensions (from OpenAI text-embedding-3-small)',
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
