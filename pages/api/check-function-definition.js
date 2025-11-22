import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🔍 Checking function definition...\n')

    // Query information_schema to find the function
    console.log('1️⃣ Querying information_schema for update_tool_embedding...')
    const { data: funcData, error: funcError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          routine_schema,
          routine_name,
          routine_type,
          routine_definition
        FROM information_schema.routines
        WHERE routine_name = 'update_tool_embedding'
      `
    }).catch(() => ({ data: null, error: { message: 'exec_sql RPC not available' } }))

    console.log(`   Function data: ${JSON.stringify(funcData)}`)
    console.log(`   Error: ${funcError?.message || 'none'}`)

    // Try an alternative - use raw fetch to Supabase API
    console.log('\n2️⃣ Trying direct query to get function definition...')
    
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/update_tool_embedding`
    
    // Just try to call it to see what happens
    const { data: rpcCallData, error: rpcCallError } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'test',
        embedding_array: [0.1, 0.2],
      }
    )

    console.log(`   RPC call succeeded: ${!rpcCallError}`)
    console.log(`   RPC call error: ${rpcCallError?.message || 'none'}`)
    console.log(`   RPC call data: ${JSON.stringify(rpcCallData)}`)

    // Check if it's a trigger issue by looking at table definition
    console.log('\n3️⃣ Checking tools table schema...')
    
    const { data: tableInfo, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default
        FROM information_schema.columns
        WHERE table_name = 'tools' AND table_schema = 'public'
        ORDER BY ordinal_position
      `
    }).catch(() => ({ data: null, error: { message: 'exec_sql RPC not available' } }))

    console.log(`   Table columns: ${JSON.stringify(tableInfo)}`)
    console.log(`   Error: ${tableError?.message || 'none'}`)

    // Try to get the actual column type for embedding
    console.log('\n4️⃣ Checking embedding column specifically...')
    
    const { data: colData, error: colError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          udt_name
        FROM information_schema.columns
        WHERE table_name = 'tools' AND column_name = 'embedding'
      `
    }).catch(() => ({ data: null, error: { message: 'exec_sql RPC not available' } }))

    console.log(`   Column definition: ${JSON.stringify(colData)}`)
    console.log(`   Error: ${colError?.message || 'none'}`)

    res.status(200).json({
      success: true,
      function_exists: funcData && funcData.length > 0,
      function_data: funcData,
      function_error: funcError?.message || null,
      rpc_call_test: {
        succeeded: !rpcCallError,
        error: rpcCallError?.message || null,
        data: rpcCallData,
      },
      table_schema: tableInfo,
      table_schema_error: tableError?.message || null,
      embedding_column: colData,
      embedding_column_error: colError?.message || null,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
