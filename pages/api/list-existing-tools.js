import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, name')
      .order('id')

    if (error) {
      return res.status(500).json({
        success: false,
        error: error.message,
      })
    }

    res.status(200).json({
      success: true,
      count: tools.length,
      tools: tools.map(t => ({ id: t.id, name: t.name })),
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
