#!/usr/bin/env node

async function testSemanticSearchNoBoosting() {
  const testCases = [
    { input: 'kylemann90@gmail.com', name: 'Email' },
    { input: '00000000\n00000001\n00001010\n00101010\n01010101\n11111111', name: 'Binary Data' },
    { input: 'https://example.com/page?query=test', name: 'URL' },
  ]

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`)
    console.log('='.repeat(60))

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
      console.log('\nTop 3 Vector Search Results:')

      results.vectorSearch?.results?.slice(0, 3).forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.name} - ${(result.similarity * 100).toFixed(1)}%`
        )
      })

      console.log('\nTop 3 Semantic Predictions:')
      data.results?.semanticPredictionResults?.slice(0, 3).forEach((result, index) => {
        console.log(
          `  ${index + 1}. ${result.name} - ${(result.similarity * 100).toFixed(1)}%`
        )
      })
    } catch (error) {
      console.error('Error:', error.message)
    }
  }
}

testSemanticSearchNoBoosting()
