import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing direct PostgreSQL updates...\n')

    // Test 1: Create a small test embedding and insert via direct SELECT
    console.log('1️⃣ Testing direct SQL query via rpc...')
    
    // First, try to insert a zero vector as a test
    const zeroVector = new Array(1536).fill(0).join(',')
    
    // Use supabase.rpc to execute a custom function that does the update
    const { data: funcCheckData, error: funcCheckError } = await supabase
      .rpc('exec_sql', {
        sql: `
          UPDATE tools 
          SET embedding = ARRAY[${new Array(1536).fill('0.1').join(',')}]::vector 
          WHERE id = 'word-counter'
          RETURNING id, embedding;
        `
      })
      .catch(() => ({ data: null, error: { message: 'RPC exec_sql not available' } }))

    console.log(`   Function check - Data: ${JSON.stringify(funcCheckData)}`)
    console.log(`   Function check - Error: ${funcCheckError?.message || 'none'}`)

    // Test 2: Try a different approach - use a parameterized function call
    console.log('\n2️⃣ Testing via parameterized function update_tool_embedding...')
    
    const largeArray = new Array(1536).fill(0.123456)
    
    const { data: updateData, error: updateError } = await supabase
      .rpc('update_tool_embedding', {
        tool_id: 'word-counter',
        embedding_array: largeArray,
      })

    console.log(`   Update - Data: ${JSON.stringify(updateData)}`)
    console.log(`   Update - Error: ${updateError?.message || 'none'}`)

    // Test 3: Read back the embedding to verify
    console.log('\n3️⃣ Reading back embedding...')
    const { data: toolData, error: readError } = await supabase
      .from('tools')
      .select('id, embedding, embedding::text as embedding_text')
      .eq('id', 'word-counter')
      .single()

    console.log(`   Read type: ${typeof toolData?.embedding}`)
    console.log(`   Is Array: ${Array.isArray(toolData?.embedding)}`)
    
    if (Array.isArray(toolData?.embedding)) {
      console.log(`   Dimensions: ${toolData.embedding.length}`)
      console.log(`   First 3 values: ${JSON.stringify(toolData.embedding.slice(0, 3))}`)
    } else if (typeof toolData?.embedding === 'string') {
      console.log(`   String (first 100 chars): ${toolData.embedding?.substring(0, 100)}`)
    } else if (toolData?.embedding === null) {
      console.log(`   Value is NULL`)
    } else {
      console.log(`   Value: ${JSON.stringify(toolData?.embedding)}`)
    }

    // Test 4: Try a direct test with a known small embedding
    console.log('\n4️⃣ Testing with 1536-dim array of 0.5...')
    
    const testArray = new Array(1536).fill(0.5)
    
    const { data: testData, error: testError } = await supabase
      .rpc('update_tool_embedding', {
        tool_id: 'word-counter',
        embedding_array: testArray,
      })

    console.log(`   Test - Data: ${JSON.stringify(testData)}`)
    console.log(`   Test - Error: ${testError?.message || 'none'}`)

    // Test 5: Read back again
    console.log('\n5️⃣ Reading back after test...')
    const { data: toolData2, error: readError2 } = await supabase
      .from('tools')
      .select('embedding')
      .eq('id', 'word-counter')
      .single()

    const isValidEmbedding = 
      Array.isArray(toolData2?.embedding) && 
      toolData2.embedding.length === 1536

    console.log(`   Is valid 1536-dim embedding: ${isValidEmbedding}`)
    if (Array.isArray(toolData2?.embedding)) {
      console.log(`   First 3 values: ${JSON.stringify(toolData2.embedding.slice(0, 3))}`)
    }

    res.status(200).json({
      success: true,
      test1_func_check: {
        data: funcCheckData,
        error: funcCheckError?.message || null,
      },
      test2_update_function: {
        data: updateData,
        error: updateError?.message || null,
      },
      test3_read_back: {
        type: typeof toolData?.embedding,
        isArray: Array.isArray(toolData?.embedding),
        dimensions: Array.isArray(toolData?.embedding) ? toolData.embedding.length : null,
        error: readError?.message || null,
      },
      test4_test_array: {
        data: testData,
        error: testError?.message || null,
      },
      test5_final_read: {
        isValidEmbedding,
        type: typeof toolData2?.embedding,
        isArray: Array.isArray(toolData2?.embedding),
        dimensions: Array.isArray(toolData2?.embedding) ? toolData2.embedding.length : null,
        error: readError2?.message || null,
      },
      diagnosis: isValidEmbedding 
        ? '✅ Successfully stored 1536-dim embedding!' 
        : '❌ Embedding storage failed',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
