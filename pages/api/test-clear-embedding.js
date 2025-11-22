import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing embedding clear...')

    // Test 1: Clear word-counter embedding
    console.log('\n1️⃣ Clearing word-counter embedding...')
    const { data: clearData, error: clearError } = await supabase
      .from('tools')
      .update({ embedding: null })
      .eq('id', 'word-counter')

    console.log('Clear result:')
    console.log('  - Error:', clearError?.message || 'none')
    console.log('  - Data returned:', clearData)

    // Test 2: Immediately read it back
    console.log('\n2️⃣ Reading back immediately...')
    const { data: readData1, error: readError1 } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log('First read result:')
    console.log('  - Error:', readError1?.message || 'none')
    console.log('  - Embedding type:', typeof readData1?.embedding)
    console.log('  - Embedding value:', readData1?.embedding)
    console.log('  - Is null:', readData1?.embedding === null)

    if (Array.isArray(readData1?.embedding)) {
      console.log('  - ⚠️  Got array instead of null!')
      console.log('  - Array length:', readData1.embedding.length)
      console.log('  - Sample values:', readData1.embedding.slice(0, 5))
    }

    // Test 3: Wait and read again
    console.log('\n3️⃣ Waiting 1 second and reading again...')
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { data: readData2, error: readError2 } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    console.log('Second read result:')
    console.log('  - Error:', readError2?.message || 'none')
    console.log('  - Embedding type:', typeof readData2?.embedding)
    console.log('  - Embedding value:', readData2?.embedding)
    console.log('  - Is null:', readData2?.embedding === null)

    if (Array.isArray(readData2?.embedding)) {
      console.log('  - ⚠️  Still got array!')
      console.log('  - Array length:', readData2.embedding.length)
      console.log('  - Sample values:', readData2.embedding.slice(0, 5))
    }

    res.status(200).json({
      success: true,
      test: {
        cleared: !clearError,
        firstReadNull: readData1?.embedding === null,
        firstReadArray: Array.isArray(readData1?.embedding),
        firstReadArrayLength: Array.isArray(readData1?.embedding)
          ? readData1.embedding.length
          : null,
        secondReadNull: readData2?.embedding === null,
        secondReadArray: Array.isArray(readData2?.embedding),
        secondReadArrayLength: Array.isArray(readData2?.embedding)
          ? readData2.embedding.length
          : null,
      },
      diagnosis:
        readData1?.embedding === null
          ? '✅ Clear works - embedding is null'
          : '❌ Clear failed or trigger is converting null to array automatically',
      recommendation:
        Array.isArray(readData1?.embedding) && readData1.embedding.length === 16
          ? 'There is likely a Postgres trigger auto-generating 16-dim embeddings. Need to check database triggers.'
          : 'Unknown issue',
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
