import { generateEmbedding, cosineSimilarity } from '../../lib/embeddings'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

function parseVectorString(vectorStr) {
  if (typeof vectorStr === 'string') {
    try {
      return JSON.parse(vectorStr)
    } catch (e) {
      return null
    }
  }
  return Array.isArray(vectorStr) ? vectorStr : null
}

export default async function handler(req, res) {
  try {
    console.log('🧪 Final comprehensive embedding test...\n')

    // Step 1: Test embedding generation
    console.log('1️⃣ Testing embedding generation...')
    const testTexts = [
      'A calculator tool for mathematical operations',
      'Count the number of words in text',
      'Convert markdown to HTML format',
    ]

    const embeddings = []
    for (const text of testTexts) {
      const emb = await generateEmbedding(text)
      embeddings.push(emb)
      console.log(`   Generated embedding for "${text.substring(0, 30)}..." - ${emb.length} dimensions`)
    }

    if (!embeddings.every((e) => Array.isArray(e) && e.length === 1536)) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate valid embeddings',
      })
    }

    // Step 2: Store embeddings using SQL function
    console.log('\n2️⃣ Storing embeddings using SQL function...')
    const toolIds = ['calculator', 'word-counter', 'markdown-converter']
    const storedResults = []

    for (let i = 0; i < toolIds.length; i++) {
      const { error } = await supabase.rpc('update_tool_embedding', {
        tool_id: toolIds[i],
        embedding_array: embeddings[i],
      })

      const result = {
        toolId: toolIds[i],
        stored: !error,
        error: error?.message || null,
      }
      storedResults.push(result)
      console.log(
        `   ${result.toolId}: ${result.stored ? '✅' : '❌'}${error ? ` - ${error.message}` : ''}`
      )
    }

    // Step 3: Retrieve and verify stored embeddings
    console.log('\n3️⃣ Retrieving and verifying stored embeddings...')
    const { data: tools } = await supabase
      .from('tools')
      .select('id, embedding')
      .in('id', toolIds)

    const retrievedResults = []
    for (const tool of tools) {
      const parsed = parseVectorString(tool.embedding)
      const isValid = Array.isArray(parsed) && parsed.length === 1536

      retrievedResults.push({
        toolId: tool.id,
        retrieved: isValid,
        type: typeof tool.embedding,
        dimensions: Array.isArray(parsed) ? parsed.length : null,
      })

      console.log(
        `   ${tool.id}: ${isValid ? '✅' : '❌'} (type: ${typeof tool.embedding}, dims: ${
          Array.isArray(parsed) ? parsed.length : 'N/A'
        })`
      )
    }

    // Step 4: Test semantic similarity
    console.log('\n4️⃣ Testing semantic similarity...')
    const queryText = 'tool that counts words'
    const queryEmbedding = await generateEmbedding(queryText)

    const similarities = []
    for (const tool of tools) {
      const parsed = parseVectorString(tool.embedding)
      if (Array.isArray(parsed) && parsed.length === 1536) {
        const similarity = cosineSimilarity(queryEmbedding, parsed)
        similarities.push({
          toolId: tool.id,
          similarity: Number(similarity.toFixed(4)),
        })
        console.log(`   ${tool.id}: ${similarity.toFixed(4)}`)
      }
    }

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity)

    // Step 5: Verify embeddings are different (not all the same)
    console.log('\n5️⃣ Verifying embeddings are unique...')
    const embeddingsAreDifferent = embeddings.every((e1, i) =>
      embeddings.some((e2, j) => {
        if (i === j) return false
        const diff = e1.reduce((sum, v, k) => sum + Math.abs(v - e2[k]), 0)
        return diff > 0.1 // Not identical
      })
    )
    console.log(`   All embeddings are unique: ${embeddingsAreDifferent ? '✅' : '❌'}`)

    res.status(200).json({
      success: true,
      step1_generation: {
        count: embeddings.length,
        allValid: embeddings.every((e) => Array.isArray(e) && e.length === 1536),
      },
      step2_storage: storedResults,
      step3_retrieval: retrievedResults,
      step4_similarity: similarities,
      step5_uniqueness: embeddingsAreDifferent,
      diagnosis: storedResults.every((r) => r.stored) &&
        retrievedResults.every((r) => r.retrieved) &&
        embeddingsAreDifferent
        ? '✅ Complete embedding pipeline working! All tests passed.'
        : '❌ Some tests failed',
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
