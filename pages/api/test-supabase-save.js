import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default async function handler(req, res) {
  try {
    console.log('🧪 Testing Supabase save operation...')

    // Create a test 1536-dimensional embedding
    const testEmbedding = new Array(1536).fill(0).map(() => Math.random())
    console.log('Test embedding created:')
    console.log('  - Dimensions:', testEmbedding.length)
    console.log('  - Type:', typeof testEmbedding)
    console.log('  - Sample:', testEmbedding.slice(0, 5))

    // Test 1: Save as JSON string
    console.log('\n📝 Test 1: Saving as JSON string...')
    const embeddingJson = JSON.stringify(testEmbedding)
    console.log('  - JSON string length:', embeddingJson.length)
    console.log('  - First 100 chars:', embeddingJson.substring(0, 100))

    // For vector columns, store the array directly, not as JSON string
    const { data: updateData, error: updateError } = await supabase
      .from('tools')
      .update({ embedding: testEmbedding })
      .eq('id', 'word-counter')

    console.log('  - Update response:')
    console.log('    - Error:', updateError?.message || 'None')
    console.log('    - Data:', updateData)

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: updateError.message,
        test1Failed: true,
      })
    }

    // Test 2: Read it back
    console.log('\n🔍 Test 2: Reading it back...')
    const { data: readData, error: readError } = await supabase
      .from('tools')
      .select('id, embedding')
      .eq('id', 'word-counter')
      .single()

    if (readError) {
      return res.status(400).json({
        success: false,
        error: readError.message,
        test2Failed: true,
      })
    }

    console.log('  - Read result:')
    console.log('    - Type:', typeof readData.embedding)
    console.log('    - First 100 chars:', JSON.stringify(readData.embedding).substring(0, 100))

    // Test 3: Parse and verify
    console.log('\n✅ Test 3: Parsing and verifying...')
    let parsedEmbedding = readData.embedding

    if (typeof parsedEmbedding === 'string') {
      console.log('  - Embedding is string, parsing...')
      parsedEmbedding = JSON.parse(parsedEmbedding)
    }

    console.log('  - Parsed embedding:')
    console.log('    - Dimensions:', parsedEmbedding.length)
    console.log('    - Is Array:', Array.isArray(parsedEmbedding))
    console.log('    - Sample:', parsedEmbedding.slice(0, 5))
    console.log('    - Matches original:', JSON.stringify(parsedEmbedding) === JSON.stringify(testEmbedding))

    res.status(200).json({
      success: true,
      original: {
        dimensions: testEmbedding.length,
        type: 'array',
        sample: testEmbedding.slice(0, 3),
      },
      stored: {
        type: typeof readData.embedding,
        firstChars: JSON.stringify(readData.embedding).substring(0, 100),
      },
      retrieved: {
        dimensions: parsedEmbedding.length,
        type: typeof parsedEmbedding,
        isArray: Array.isArray(parsedEmbedding),
        sample: parsedEmbedding.slice(0, 3),
        matchesOriginal: JSON.stringify(parsedEmbedding) === JSON.stringify(testEmbedding),
      },
      allTests: {
        saveSuccessful: !updateError,
        readSuccessful: !readError,
        dimensionsPreserved: parsedEmbedding.length === 1536,
        contentMatches: JSON.stringify(parsedEmbedding) === JSON.stringify(testEmbedding),
      },
    })
  } catch (error) {
    console.error('Test error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.constructor.name,
    })
  }
}
