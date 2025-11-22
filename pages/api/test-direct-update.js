import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing direct Supabase update...\n')

    // Test 1: Store zero vector
    const zeroVector = '[' + new Array(1536).fill(0).join(',') + ']'
    console.log('1️⃣ Storing zero vector...')
    console.log('   String to store:', zeroVector.substring(0, 50) + '...')
    console.log('   String length:', zeroVector.length)

    const { data: updateData, error: updateError } = await supabase
      .from('tools')
      .update({ embedding: zeroVector })
      .eq('id', 'word-counter')

    console.log('   Update error:', updateError?.message || 'none')
    console.log('   Update data:', updateData)

    // Test 2: Read back immediately
    console.log('\n2️⃣ Reading back...')
    const { data: readData, error: readError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log('   Read error:', readError?.message || 'none')
    console.log('   Type returned:', typeof readData?.embedding)
    console.log('   Value:', JSON.stringify(readData?.embedding).substring(0, 100))

    // Test 3: Parse and check
    console.log('\n3️⃣ Parsing...')
    let parsed = readData?.embedding
    if (typeof parsed === 'string') {
      console.log('   Is string, parsing...')
      try {
        parsed = JSON.parse(parsed)
        console.log('   Parsed successfully')
      } catch (e) {
        console.log('   JSON parse failed:', e.message)
        // Try manual parsing
        parsed = parsed
          .replace(/^\[|\]$/g, '')
          .split(',')
          .map(v => parseFloat(v.trim()))
        console.log('   Manual parse result length:', parsed.length)
      }
    }

    console.log('   Parsed dimensions:', Array.isArray(parsed) ? parsed.length : 'not array')
    console.log('   Sample:', Array.isArray(parsed) ? parsed.slice(0, 5) : 'N/A')

    // Test 4: Try storing pgvector format string
    console.log('\n4️⃣ Testing pgvector format...')
    const pgvectorString = '[0.1,0.2,0.3,0.4,0.5]'
    console.log('   Storing:', pgvectorString)

    const { data: pgUpdateData, error: pgUpdateError } = await supabase
      .from('tools')
      .update({ embedding: pgvectorString })
      .eq('id', 'find-replace')

    console.log('   Update error:', pgUpdateError?.message || 'none')

    const { data: pgReadData } = await supabase
      .from('tools')
      .select('embedding')
      .eq('id', 'find-replace')
      .single()

    console.log('   Read back:', JSON.stringify(pgReadData?.embedding))

    res.status(200).json({
      success: true,
      test1: {
        storedZeroVector: true,
        readBackType: typeof readData?.embedding,
        readBackLength: Array.isArray(parsed) ? parsed.length : null,
        wasCorrectlyStored:
          Array.isArray(parsed) && parsed.length === 1536
            ? true
            : false,
      },
      test2: {
        pgvectorTestStored: true,
        pgvectorReadBack: pgReadData?.embedding,
      },
      diagnosis:
        Array.isArray(parsed) && parsed.length === 1536
          ? '✅ Zero vector stored and retrieved correctly'
          : Array.isArray(parsed)
            ? `❌ Got ${parsed.length}-dimensional vector instead of 1536`
            : '❌ Could not parse as array',
      note: 'If failing, the issue is with how Supabase is handling pgvector type updates',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
