import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🔍 Checking for database triggers and functions...')

    // Try to get trigger info
    const { data: rawData, error: rawError } = await supabase
      .rpc('get_table_triggers', {
        table_name: 'tools',
      })
      .catch(() => ({
        data: null,
        error: 'RPC not available',
      }))

    console.log('RPC result:', rawData, rawError)

    // Try direct query
    const { data: checkData, error: checkError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log('\nDirect check of word-counter:')
    console.log('  - Embedding type:', typeof checkData?.embedding)
    console.log('  - Embedding value:', checkData?.embedding)
    console.log('  - Is null:', checkData?.embedding === null)

    if (Array.isArray(checkData?.embedding)) {
      console.log('  - Is array: true')
      console.log('  - Array length:', checkData.embedding.length)
      console.log('  - Sample:', checkData.embedding.slice(0, 3))
    }

    res.status(200).json({
      success: true,
      message:
        'Check Supabase dashboard for triggers:\n1. Go to SQL Editor\n2. Run: SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE event_object_table=\'tools\'',
      wordCounterEmbedding: {
        type: typeof checkData?.embedding,
        isNull: checkData?.embedding === null,
        isArray: Array.isArray(checkData?.embedding),
        dimensions: Array.isArray(checkData?.embedding) ? checkData.embedding.length : null,
        value: checkData?.embedding,
      },
      notes: [
        'If embedding is an array after clearing, there\'s a trigger/default converting nulls',
        'The 16-dim fallback suggests a trigger is calling simpleHashEmbedding',
        'Solution: Need to drop the trigger or set embedding to empty array instead of null',
      ],
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
