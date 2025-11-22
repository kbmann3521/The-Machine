#!/usr/bin/env node

async function testClassifyEndpoint() {
  const testCases = [
    'kylemann90@gmail.com',
    'john.doe@example.com',
    'test@test.com',
    'simple text without email'
  ]
  
  console.log('Testing classify endpoint...\n')
  
  for (const testCase of testCases) {
    try {
      const response = await fetch('http://localhost:3000/api/tools/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: testCase }),
      })
      
      const data = await response.json()
      console.log(`Input: "${testCase}"`)
      console.log(`Category: ${data.category}`)
      console.log(`Summary: ${data.content_summary}`)
      console.log()
    } catch (error) {
      console.error(`Error for "${testCase}":`, error.message)
    }
  }
}

testClassifyEndpoint()
