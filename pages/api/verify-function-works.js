import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing newly created update_tool_embedding function...\n')

    // Step 1: Clear the embedding first
    console.log('1️⃣ Clearing existing embedding...')
    const { error: clearError } = await supabase
      .from('tools')
      .update({ embedding: null })
      .eq('id', 'word-counter')

    console.log(`   Clear error: ${clearError?.message || 'none'}`)

    // Step 2: Create a 1536-dimensional test array
    console.log('\n2️⃣ Creating 1536-dimensional test embedding...')
    const testEmbedding = new Array(1536).fill(0).map((_, i) => {
      // Create a pattern so we can verify it was stored correctly
      return (i % 256) / 256.0 // Values between 0 and 1
    })

    console.log(`   Created array with ${testEmbedding.length} dimensions`)
    console.log(`   First 5 values: [${testEmbedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}]`)

    // Step 3: Call the SQL function
    console.log('\n3️⃣ Calling update_tool_embedding function...')
    const { data: functionData, error: functionError } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'word-counter',
        embedding_array: testEmbedding,
      }
    )

    console.log(`   Function data: ${JSON.stringify(functionData)}`)
    console.log(`   Function error: ${functionError?.message || 'none'}`)

    // Step 4: Read back the embedding
    console.log('\n4️⃣ Reading back the embedding...')
    const { data: toolData, error: readError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log(`   Read error: ${readError?.message || 'none'}`)
    console.log(`   Embedding type: ${typeof toolData?.embedding}`)
    console.log(`   Is array: ${Array.isArray(toolData?.embedding)}`)

    // Parse embedding if it's a string (pgvector returns as string)
    let parsedEmbedding = toolData?.embedding
    if (typeof toolData?.embedding === 'string') {
      try {
        parsedEmbedding = JSON.parse(toolData.embedding)
        console.log(`   Parsed from string format`)
      } catch (e) {
        console.log(`   Failed to parse: ${e.message}`)
      }
    }

    const isValid =
      Array.isArray(parsedEmbedding) &&
      parsedEmbedding.length === 1536

    if (isValid) {
      console.log(`   ✅ Valid 1536-dimensional embedding!`)
      console.log(`   First 5 values: [${parsedEmbedding
        .slice(0, 5)
        .map((v) => v.toFixed(4))
        .join(', ')}]`)

      // Verify the values match what we sent
      const valuesMatch = testEmbedding.slice(0, 5).every((v, i) => {
        const diff = Math.abs(v - parsedEmbedding[i])
        return diff < 0.001 // Allow small floating point differences
      })

      console.log(`   Values match sent array: ${valuesMatch}`)
    } else if (toolData?.embedding === null) {
      console.log(`   ❌ Embedding is NULL - function call did not save the data`)
    } else {
      console.log(`   ❌ Invalid embedding`)
      console.log(`   Dimensions: ${Array.isArray(parsedEmbedding) ? parsedEmbedding.length : 'N/A'}`)
    }

    // Step 5: Test with a different tool to ensure function works generally
    console.log('\n5️⃣ Testing with a different tool (calculator)...')
    const smallArray = new Array(1536).fill(0.5)

    const { data: funcData2, error: funcError2 } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'calculator',
        embedding_array: smallArray,
      }
    )

    console.log(`   Function error: ${funcError2?.message || 'none'}`)

    const { data: calcData, error: calcError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'calculator')
      .single()

    const calcValid =
      Array.isArray(calcData?.embedding) &&
      calcData.embedding.length === 1536

    console.log(`   Calculator embedding valid: ${calcValid}`)

    res.status(200).json({
      success: true,
      step1_clear: { error: clearError?.message || null },
      step2_create_array: {
        dimensions: testEmbedding.length,
        firstValues: testEmbedding.slice(0, 5),
      },
      step3_function_call: {
        error: functionError?.message || null,
        data: functionData,
      },
      step4_read_back: {
        isValid,
        type: typeof toolData?.embedding,
        isArray: Array.isArray(toolData?.embedding),
        dimensions: Array.isArray(toolData?.embedding) ? toolData.embedding.length : null,
        readError: readError?.message || null,
        firstValues: Array.isArray(toolData?.embedding)
          ? toolData.embedding.slice(0, 5)
          : null,
      },
      step5_test_different_tool: {
        error: funcError2?.message || null,
        calcValid,
      },
      diagnosis: isValid
        ? '✅ Function is working correctly!'
        : functionError?.message
        ? `❌ Function call failed: ${functionError.message}`
        : '❌ Function succeeded but embedding was not saved',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
