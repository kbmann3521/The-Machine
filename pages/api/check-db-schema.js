import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🔍 Checking database schema...')

    // Get table info from information_schema
    const { data, error } = await supabase.rpc('get_table_info', {
      table_name: 'tools',
    }).catch(async () => {
      // If RPC doesn't exist, try direct query
      const result = await supabase.from('tools').select('*').limit(1)
      return result
    })

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message,
        note: 'Could not fetch schema info',
      })
    }

    // Try a raw SQL query to get column info
    const { data: columnData, error: columnError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT column_name, data_type, column_default, is_nullable 
              FROM information_schema.columns 
              WHERE table_name = 'tools' 
              AND column_name = 'embedding'`,
      })
      .catch(async () => {
        // If that fails, just return what we can
        return { data: null, error: 'RPC not available' }
      })

    // Check for triggers
    const { data: triggerData, error: triggerError } = await supabase
      .rpc('execute_sql', {
        sql: `SELECT trigger_name, event_object_table, action_statement 
              FROM information_schema.triggers 
              WHERE event_object_table = 'tools'`,
      })
      .catch(() => ({ data: null, error: 'RPC not available' }))

    res.status(200).json({
      success: true,
      message: 'Check Supabase dashboard for full schema info',
      columnInfo: columnData,
      columnError: columnError?.message,
      triggerInfo: triggerData,
      triggerError: triggerError?.message,
      notes: [
        'Schema info may be limited due to Supabase RLS policies',
        'Check Supabase Dashboard > SQL Editor > Database > public > tools',
        'Look for:',
        '  1. Column "embedding" data type (should accept text/jsonb)',
        '  2. Any DEFAULT values on embedding column',
        '  3. Any TRIGGERS that might modify embedding on INSERT/UPDATE',
        '  4. Any FUNCTIONS that auto-update the embedding column',
      ],
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
    })
  }
}
