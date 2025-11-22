#!/usr/bin/env node

async function testPredictSemantic() {
  const testEmail = 'kylemann90@gmail.com'
  
  console.log('Testing semantic prediction for email...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/tools/predict-semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: testEmail }),
    })
    
    if (!response.ok) {
      console.log('Response status:', response.status)
      return
    }
    
    const data = await response.json()
    
    console.log('Classification:', data.metadata?.classification)
    console.log('Intent:', data.metadata?.intent)
    console.log('\nPredicted Tools (Top 5):')
    
    data.predictedTools?.slice(0, 5).forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} (${tool.toolId})`)
      console.log(`   Similarity: ${(tool.similarity * 100).toFixed(2)}%`)
      console.log(`   Description: ${tool.description}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testPredictSemantic()
