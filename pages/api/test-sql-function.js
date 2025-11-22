import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing SQL function...\n')

    // Test 1: Does the function exist?
    console.log('1️⃣ Checking if update_tool_embedding function exists...')
    let funcError = null
    let functions = null

    try {
      const result = await supabase.rpc('list_functions', {
        schema: 'public',
      })
      functions = result.data
      funcError = result.error
    } catch (e) {
      funcError = { message: 'RPC not available' }
    }

    console.log(`   Result: ${JSON.stringify(functions)}`)
    console.log(`   Error: ${funcError?.message || 'none'}`)

    // Test 2: Try calling with simple test data
    console.log('\n2️⃣ Testing function with simple 5-element array...')
    const testArray = [0.1, 0.2, 0.3, 0.4, 0.5]

    const { data: rpcData, error: rpcError } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'test-tool-123',
        embedding_array: testArray,
      }
    )

    console.log(`   RPC Data: ${JSON.stringify(rpcData)}`)
    console.log(`   RPC Error: ${rpcError?.message || 'none'}`)

    // Test 3: Try with 1536-element array
    console.log('\n3️⃣ Testing function with 1536-element array...')
    const largeArray = new Array(1536).fill(0.123)

    const { data: rpcData2, error: rpcError2 } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'word-counter',
        embedding_array: largeArray,
      }
    )

    console.log(`   RPC Data: ${JSON.stringify(rpcData2)}`)
    console.log(`   RPC Error: ${rpcError2?.message || 'none'}`)

    // Test 4: Read it back
    console.log('\n4️⃣ Reading word-counter...')
    const { data: tool, error: readError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log(`   Type: ${typeof tool?.embedding}`)
    console.log(`   Is Array: ${Array.isArray(tool?.embedding)}`)

    if (Array.isArray(tool?.embedding)) {
      console.log(`   Dimensions: ${tool.embedding.length}`)
      console.log(`   Sample: ${tool.embedding.slice(0, 5)}`)
    } else if (typeof tool?.embedding === 'string') {
      console.log(`   String length: ${tool.embedding.length}`)
      console.log(`   First 50 chars: ${tool.embedding.substring(0, 50)}`)
    } else {
      console.log(`   Value: ${JSON.stringify(tool?.embedding)}`)
    }

    res.status(200).json({
      success: true,
      test1_function_exists: functions || 'unknown',
      test2_small_array: {
        rpcError: rpcError?.message || null,
        rpcSuccess: !rpcError,
      },
      test3_large_array: {
        rpcError: rpcError2?.message || null,
        rpcSuccess: !rpcError2,
      },
      test4_read_back: {
        type: typeof tool?.embedding,
        isArray: Array.isArray(tool?.embedding),
        dimensions: Array.isArray(tool?.embedding) ? tool.embedding.length : null,
        readError: readError?.message || null,
      },
      diagnosis:
        Array.isArray(tool?.embedding) && tool.embedding.length === 1536
          ? '✅ Function works!'
          : '❌ Function failed to save embedding',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
