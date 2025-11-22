#!/usr/bin/env node

async function testPredictSemanticNoThreshold() {
  const testCases = [
    { input: 'kylemann90@gmail.com', name: 'Email' },
    { input: '00000000\n00000001\n00001010', name: 'Binary Data' },
  ]

  for (const testCase of testCases) {
    console.log(`\n📊 Testing: ${testCase.name}`)
    console.log('='.repeat(60))

    try {
      const response = await fetch('http://localhost:3000/api/tools/predict-semantic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: testCase.input }),
      })

      const data = await response.json()

      console.log('Top 5 Predicted Tools:')
      data.predictedTools?.slice(0, 5).forEach((tool, index) => {
        console.log(
          `  ${index + 1}. ${tool.name} - ${(tool.similarity * 100).toFixed(1)}%`
        )
      })
    } catch (error) {
      console.error('Error:', error.message)
    }
  }
}

testPredictSemanticNoThreshold()
