import { generateEmbedding } from '../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing one embedding with SQL function...\n')

    // Step 1: Generate a test 1536-dim embedding
    console.log('1️⃣ Generating 1536-dimensional embedding...')
    const testText = 'test writing tool for embeddings'
    const embedding = await generateEmbedding(testText)

    console.log(`   Dimensions: ${embedding.length}`)
    console.log(`   Sample: ${embedding.slice(0, 3)}`)

    if (!embedding || embedding.length !== 1536) {
      return res.status(400).json({
        success: false,
        error: `Failed to generate valid embedding (got ${embedding?.length} dimensions)`,
      })
    }

    // Step 2: Call the SQL function to update
    console.log('\n2️⃣ Calling update_tool_embedding SQL function...')
    let data = null
    let error = null

    try {
      const result = await supabase.rpc('update_tool_embedding', {
        tool_id: 'word-counter',
        embedding_array: embedding,
      })
      data = result.data
      error = result.error
    } catch (e) {
      error = { message: e.message }
    }

    console.log(`   Error: ${error?.message || 'none'}`)
    console.log(`   Data: ${JSON.stringify(data)}`)

    if (error) {
      return res.status(400).json({
        success: false,
        error: `SQL function error: ${error.message}`,
        rpcCall: true,
      })
    }

    // Step 3: Immediately read it back
    console.log('\n3️⃣ Reading back from database...')
    let tool = null
    let readError = null

    try {
      const result = await supabase
        .from('tools')
        .select('id, embedding')
        .eq('id', 'word-counter')
        .single()
      tool = result.data
      readError = result.error
    } catch (e) {
      readError = { message: e.message }
    }

    console.log(`   Read error: ${readError?.message || 'none'}`)
    console.log(`   Embedding type: ${typeof tool?.embedding}`)

    let retrievedEmbedding = tool?.embedding
    let dimensions = 0

    if (typeof retrievedEmbedding === 'string') {
      console.log(`   Embedding is string, parsing...`)
      try {
        retrievedEmbedding = JSON.parse(retrievedEmbedding)
        dimensions = retrievedEmbedding.length
        console.log(`   Parsed dimensions: ${dimensions}`)
      } catch (e) {
        console.log(`   Parse error: ${e.message}`)
      }
    } else if (Array.isArray(retrievedEmbedding)) {
      dimensions = retrievedEmbedding.length
      console.log(`   Dimensions: ${dimensions}`)
    } else {
      console.log(`   Type: ${typeof retrievedEmbedding}, Value: ${JSON.stringify(retrievedEmbedding)}`)
    }

    console.log(`   Sample: ${Array.isArray(retrievedEmbedding) ? retrievedEmbedding.slice(0, 3) : 'N/A'}`)

    // Step 4: Verify
    console.log('\n4️⃣ Verification:')
    const success =
      dimensions === 1536 &&
      Array.isArray(retrievedEmbedding)

    console.log(`   ✅ Stored: ${!error ? 'YES' : 'NO'}`)
    console.log(`   ✅ Retrieved: ${!readError ? 'YES' : 'NO'}`)
    console.log(`   ✅ Correct dimensions (1536): ${dimensions === 1536 ? 'YES' : `NO (${dimensions})`}`)
    console.log(`   ✅ Is array: ${Array.isArray(retrievedEmbedding) ? 'YES' : 'NO'}`)

    res.status(200).json({
      success,
      test: {
        generatedDimensions: embedding.length,
        generatedSample: embedding.slice(0, 3),
        rpcCallError: error?.message || null,
        rpcCallSuccess: !error,
        readError: readError?.message || null,
        readSuccess: !readError,
        retrievedDimensions: dimensions,
        retrievedIsArray: Array.isArray(retrievedEmbedding),
        retrievedSample: Array.isArray(retrievedEmbedding)
          ? retrievedEmbedding.slice(0, 3)
          : null,
      },
      diagnosis: success
        ? '✅ SUCCESS! SQL function works - 1536-dim embedding stored and retrieved correctly'
        : `❌ FAILED! Got ${dimensions} dimensions instead of 1536`,
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
