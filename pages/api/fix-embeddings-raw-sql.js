import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  const { action } = req.body || {}

  // Authentication check
  const authHeader = req.headers.authorization
  if (!authHeader || authHeader !== `Bearer ${process.env.EMBEDDING_SECRET_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    if (action === 'test-raw-insert') {
      console.log('🧪 Testing raw SQL insert...')

      // Test 1: Insert zero vector using raw SQL
      const zeroVector = new Array(1536).fill(0).join(',')

      const { data, error } = await supabase.rpc('execute_raw_sql', {
        sql: `UPDATE tools SET embedding = '[${zeroVector}]'::vector WHERE id = 'word-counter' RETURNING id, (embedding::text);`,
      }).catch(async () => {
        // If RPC doesn't work, try via HTTP
        console.log('RPC not available, trying alternative...')
        return { data: null, error: 'RPC not available' }
      })

      console.log('Raw SQL result:', data, error)

      // Then read back
      const { data: readData } = await supabase
        .from('tools')
        .select('id, embedding')
        .eq('id', 'word-counter')
        .single()

      console.log('Read back:', {
        type: typeof readData?.embedding,
        value: readData?.embedding,
      })

      res.status(200).json({
        success: true,
        message: 'Raw SQL test completed',
        rawSqlError: error?.message || 'none',
        readBackType: typeof readData?.embedding,
        readBackValue: JSON.stringify(readData?.embedding).substring(0, 100),
      })
    } else if (action === 'fix-all') {
      console.log('🔧 Attempting to fix all embeddings with raw SQL...')

      // This requires you to have a function that can execute raw SQL
      // For now, return instructions
      res.status(200).json({
        success: true,
        message: 'To fix embeddings using raw SQL, run this in Supabase SQL Editor:',
        instruction: [
          '1. Go to Supabase Dashboard > SQL Editor',
          '2. Run this (replace EMBEDDING_ARRAY with actual 1536-dim array):',
          '',
          `UPDATE public.tools 
           SET embedding = '[EMBEDDING_ARRAY]'::vector
           WHERE id = 'word-counter';`,
          '',
          '3. Or use this to test with a simple embedding:',
          `UPDATE public.tools 
           SET embedding = '[0.1,0.2,0.3,...]'::vector
           WHERE id = 'word-counter';`,
        ],
        note: 'The ::vector cast should force PostgreSQL to parse it correctly',
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Unknown action',
      })
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
