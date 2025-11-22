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
    if (action === 'check') {
      console.log('🔍 Checking for triggers on tools table...')

      // Try to list triggers
      const { data, error } = await supabase.rpc('list_triggers_for_table', {
        table_name: 'tools',
      }).catch(() => null)

      console.log('RPC result:', data, error)

      res.status(200).json({
        success: true,
        message: 'Check Supabase SQL Editor for triggers',
        instructions: [
          '1. Go to Supabase Dashboard > SQL Editor',
          '2. Run this query:',
          '   SELECT trigger_name, event_manipulation, action_statement',
          '   FROM information_schema.triggers',
          '   WHERE event_object_table = \'tools\'',
          '3. Look for any trigger that mentions "embedding"',
          '4. If found, the trigger is auto-generating fallback embeddings',
          '5. Send the trigger name back and we\'ll drop it',
        ],
        rpcAttemptResult: data || 'RPC not available',
      })
    } else if (action === 'drop' && req.body.triggerName) {
      console.log(`🗑️  Attempting to drop trigger: ${req.body.triggerName}`)

      const triggerName = req.body.triggerName
      if (!triggerName.match(/^[a-zA-Z0-9_]+$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid trigger name',
        })
      }

      // Execute DROP TRIGGER
      const { data, error } = await supabase.rpc('execute_sql', {
        sql: `DROP TRIGGER IF EXISTS ${triggerName} ON public.tools CASCADE;`,
      }).catch(async () => {
        // Fallback: try execute as anonymous SQL
        return {
          data: null,
          error: 'RPC execute_sql not available - need manual Supabase SQL Editor',
        }
      })

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
          note: 'You may need to manually run this in Supabase SQL Editor:',
          sql: `DROP TRIGGER IF EXISTS ${triggerName} ON public.tools CASCADE;`,
        })
      }

      res.status(200).json({
        success: true,
        message: `Trigger ${triggerName} dropped`,
        data,
      })
    } else {
      res.status(400).json({
        success: false,
        error: 'Specify action: "check" or "drop" with triggerName',
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
