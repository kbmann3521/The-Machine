import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🔍 Diagnosing vector storage issue...\n')

    // Step 1: Test the SQL function directly to see what it returns
    console.log('1️⃣ Calling the SQL function...')
    const testArray = new Array(1536).fill(0.5)
    
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      'update_tool_embedding',
      {
        tool_id: 'word-counter',
        embedding_array: testArray,
      }
    )

    console.log(`RPC Error: ${rpcError?.message || 'none'}`)
    console.log(`RPC Result: ${JSON.stringify(rpcResult)}`)
    console.log(`RPC Result Type: ${typeof rpcResult}`)

    // Step 2: Check what's in the database immediately after
    console.log('\n2️⃣ Checking database immediately after RPC call...')
    const { data: toolData, error: selectError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log(`Select Error: ${selectError?.message || 'none'}`)
    console.log(`Tool ID: ${toolData?.id}`)
    console.log(`Embedding type: ${typeof toolData?.embedding}`)
    console.log(`Embedding value (first 100 chars): ${String(toolData?.embedding).substring(0, 100)}`)

    // Step 3: Try to parse as array
    console.log('\n3️⃣ Attempting to parse embedding...')
    
    let parsed = null
    let parseError = null

    if (typeof toolData?.embedding === 'string') {
      try {
        // Try parsing as JSON array format [x,y,z]
        parsed = JSON.parse(toolData.embedding)
        console.log(`Parsed from JSON string - length: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`)
      } catch (e) {
        parseError = e.message
        console.log(`Failed to parse as JSON: ${e.message}`)
        
        // Try extracting numbers from string format
        const matches = toolData.embedding.match(/[-+]?[0-9]*\.?[0-9]+/g)
        if (matches) {
          parsed = matches.map(Number)
          console.log(`Extracted ${parsed.length} numbers from string`)
        }
      }
    } else if (Array.isArray(toolData?.embedding)) {
      parsed = toolData.embedding
      console.log(`Already an array with ${parsed.length} elements`)
    } else if (toolData?.embedding === null) {
      console.log(`Embedding is NULL - function call did not save`)
    }

    // Step 4: Check the actual SQL column definition
    console.log('\n4️⃣ Checking column definition...')
    const { data: colInfo, error: colError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, udt_name
          FROM information_schema.columns
          WHERE table_name = 'tools' AND column_name = 'embedding'
        `
      })
      .catch(() => ({
        data: null,
        error: { message: 'exec_sql RPC not available' }
      }))

    console.log(`Column info available: ${!!colInfo}`)
    console.log(`Column error: ${colError?.message || 'none'}`)

    // Step 5: Try direct SQL UPDATE to test if it works differently
    console.log('\n5️⃣ Testing direct SQL update...')
    
    const { data: directUpdate, error: directError } = await supabase
      .rpc('exec_sql', {
        sql: `
          UPDATE tools
          SET embedding = ARRAY[${new Array(1536).fill('0.5').join(',')}]::vector(1536)
          WHERE id = 'word-counter'
          RETURNING id, embedding::text as embedding_text
        `
      })
      .catch(() => ({
        data: null,
        error: { message: 'exec_sql RPC not available' }
      }))

    console.log(`Direct SQL succeeded: ${!!directUpdate && !directError}`)
    console.log(`Direct SQL error: ${directError?.message || 'none'}`)

    res.status(200).json({
      success: true,
      step1_rpc_call: {
        error: rpcError?.message || null,
        result: rpcResult,
        resultType: typeof rpcResult,
      },
      step2_database_check: {
        toolId: toolData?.id,
        embeddingType: typeof toolData?.embedding,
        embeddingValueSample: String(toolData?.embedding).substring(0, 100),
        selectError: selectError?.message || null,
      },
      step3_parsing: {
        isParsed: !!parsed,
        parsedLength: Array.isArray(parsed) ? parsed.length : null,
        parseError,
        firstValues: Array.isArray(parsed) ? parsed.slice(0, 5) : null,
      },
      step4_column_info: {
        available: !!colInfo,
        error: colError?.message || null,
        data: colInfo,
      },
      step5_direct_sql: {
        succeeded: !!directUpdate && !directError,
        error: directError?.message || null,
        data: directUpdate,
      },
      diagnosis: parsed && Array.isArray(parsed) && parsed.length === 1536
        ? '✅ Embedding is stored but returned as string'
        : !parsed && toolData?.embedding === null
        ? '❌ Embedding is NULL - RPC function did not save'
        : '❌ Embedding format issue',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
}
