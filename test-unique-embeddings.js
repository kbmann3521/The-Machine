#!/usr/bin/env node

async function testUniqueEmbeddings() {
  const testCases = [
    { input: 'kylemann90@gmail.com', name: 'Email' },
    { input: '192.168.1.1', name: 'IP Address' },
    { input: '550e8400-e29b-41d4-a716-446655440000', name: 'UUID' },
    { input: '00000000\n00000001\n00001010', name: 'Binary Data' },
  ]

  console.log('📊 Testing semantic search with unique embeddings\n')
  console.log('='.repeat(80))

  for (const testCase of testCases) {
    console.log(`\n🔍 Input: ${testCase.name}`)
    console.log('-'.repeat(80))

    try {
      const response = await fetch('http://localhost:3000/api/tools/debug-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: testCase.input }),
      })

      const data = await response.json()
      const results = data.results

      console.log(`Classification: ${results.classification?.category}`)
      console.log(`Intent: ${results.intent?.intent}`)
      console.log(`Embedding: ${results.embeddingGenerated?.text.substring(0, 80)}...`)

      console.log('\nTop 5 Results:')
      results.vectorSearch?.results?.slice(0, 5).forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.name.padEnd(30)} ${(result.similarity * 100).toFixed(1)}%`
        )
      })
    } catch (error) {
      console.error('Error:', error.message)
    }
  }
}

testUniqueEmbeddings()
