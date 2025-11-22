import { generateEmbedding } from '../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🔄 Testing full embedding pipeline...\n')

    // Step 1: Generate embedding from OpenAI
    console.log('1️⃣ Generating embedding from OpenAI API...')
    const testText = 'A calculator is a tool for performing mathematical operations including addition, subtraction, multiplication, and division'
    
    const embedding = await generateEmbedding(testText)
    
    console.log(`   Generated embedding type: ${typeof embedding}`)
    console.log(`   Is array: ${Array.isArray(embedding)}`)
    console.log(`   Dimensions: ${Array.isArray(embedding) ? embedding.length : 'N/A'}`)
    
    if (!Array.isArray(embedding) || embedding.length !== 1536) {
      return res.status(500).json({
        success: false,
        diagnosis: '❌ Embedding generation failed - did not get 1536-dimensional array',
        step1_embedding: {
          type: typeof embedding,
          isArray: Array.isArray(embedding),
          dimensions: Array.isArray(embedding) ? embedding.length : null,
        }
      })
    }

    console.log(`   ✅ Got valid 1536-dimensional embedding`)
    console.log(`   First 3 values: [${embedding.slice(0, 3).map(v => v.toFixed(6)).join(', ')}]`)

    // Step 2: Store embedding using SQL function
    console.log('\n2️⃣ Storing embedding using update_tool_embedding function...')
    
    const { data: storeData, error: storeError } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'calculator',
        embedding_array: embedding,
      }
    )

    console.log(`   Function call error: ${storeError?.message || 'none'}`)
    console.log(`   Function call data: ${JSON.stringify(storeData)}`)

    if (storeError) {
      return res.status(500).json({
        success: false,
        diagnosis: `❌ Storage failed: ${storeError.message}`,
        step1_embedding: {
          type: typeof embedding,
          isArray: Array.isArray(embedding),
          dimensions: embedding.length,
          sample: embedding.slice(0, 3),
        },
        step2_storage: {
          error: storeError.message,
        }
      })
    }

    console.log(`   ✅ Storage function call succeeded`)

    // Step 3: Retrieve embedding from database
    console.log('\n3️⃣ Retrieving embedding from database...')
    
    const { data: tool, error: retrieveError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'calculator')
      .single()

    console.log(`   Retrieve error: ${retrieveError?.message || 'none'}`)
    console.log(`   Tool ID: ${tool?.id}`)
    console.log(`   Embedding type: ${typeof tool?.embedding}`)
    console.log(`   Is array: ${Array.isArray(tool?.embedding)}`)
    
    if (Array.isArray(tool?.embedding)) {
      console.log(`   Dimensions: ${tool.embedding.length}`)
      console.log(`   First 3 values: [${tool.embedding.slice(0, 3).map(v => v.toFixed(6)).join(', ')}]`)
    }

    // Step 4: Verify the stored embedding matches what we sent
    console.log('\n4️⃣ Verifying stored embedding matches sent embedding...')
    
    const isValid = 
      Array.isArray(tool?.embedding) && 
      tool.embedding.length === 1536

    let valuesMatch = false
    if (isValid) {
      // Check if first few values match (allowing for floating point precision)
      valuesMatch = embedding.slice(0, 10).every((v, i) => {
        const diff = Math.abs(v - tool.embedding[i])
        const tolerance = 1e-5
        return diff < tolerance
      })

      console.log(`   Embedding dimensions match: ✅`)
      console.log(`   Values match (first 10): ${valuesMatch ? '✅' : '❌'}`)
      
      if (!valuesMatch) {
        console.log(`   Expected first 10: [${embedding.slice(0, 10).map(v => v.toFixed(10)).join(', ')}]`)
        console.log(`   Got first 10:      [${tool.embedding.slice(0, 10).map(v => v.toFixed(10)).join(', ')}]`)
      }
    } else {
      console.log(`   ❌ Embedding is invalid`)
      if (tool?.embedding === null) {
        console.log(`   Embedding is NULL - data was not saved`)
      } else {
        console.log(`   Embedding type: ${typeof tool?.embedding}`)
        console.log(`   Embedding value: ${JSON.stringify(tool?.embedding).substring(0, 100)}`)
      }
    }

    // Step 5: Test with another tool to ensure it's not a one-time issue
    console.log('\n5️⃣ Testing with another tool (word-counter)...')
    
    const embedding2 = await generateEmbedding('A word counter tool counts the number of words in text')
    
    if (!Array.isArray(embedding2) || embedding2.length !== 1536) {
      console.log(`   ❌ Failed to generate second embedding`)
    } else {
      const { data: storeData2, error: storeError2 } = await supabase.rpc(
        'update_tool_embedding',
        {
          tool_id: 'word-counter',
          embedding_array: embedding2,
        }
      )

      const { data: tool2, error: retrieveError2 } = await supabase
        .from('tools')
        .select('embedding')
        .eq('id', 'word-counter')
        .single()

      const isValid2 = 
        Array.isArray(tool2?.embedding) && 
        tool2.embedding.length === 1536

      console.log(`   Storage error: ${storeError2?.message || 'none'}`)
      console.log(`   Retrieve error: ${retrieveError2?.message || 'none'}`)
      console.log(`   Second embedding valid: ${isValid2 ? '✅' : '❌'}`)

      res.status(200).json({
        success: true,
        diagnosis: isValid && isValid2 
          ? '✅ Full pipeline works! Embeddings stored and retrieved correctly.'
          : isValid
          ? '⚠️ First embedding works but second failed'
          : '❌ Embedding storage or retrieval failed',
        step1_generation: {
          type: typeof embedding,
          isArray: Array.isArray(embedding),
          dimensions: Array.isArray(embedding) ? embedding.length : null,
          sample: Array.isArray(embedding) ? embedding.slice(0, 3) : null,
        },
        step2_storage: {
          error: storeError?.message || null,
        },
        step3_retrieval: {
          type: typeof tool?.embedding,
          isArray: Array.isArray(tool?.embedding),
          dimensions: Array.isArray(tool?.embedding) ? tool.embedding.length : null,
          retrieveError: retrieveError?.message || null,
        },
        step4_verification: {
          isValid,
          valuesMatch,
        },
        step5_second_tool: {
          isValid: isValid2,
          storageError: storeError2?.message || null,
          retrieveError: retrieveError2?.message || null,
        }
      })
    }
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}
