#!/usr/bin/env node

async function testSemanticSearch() {
  const testEmail = 'kylemann90@gmail.com'
  
  console.log('Testing semantic search for email...\n')
  
  try {
    const response = await fetch('http://localhost:3000/api/tools/semantic-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputText: testEmail,
        category: 'validator',
        intent: {
          intent: 'validation',
          sub_intent: 'validate',
          confidence: 1
        }
      }),
    })
    
    const data = await response.json()
    
    console.log('Semantic Search Results:')
    console.log(`Total tools searched: ${data.metadata?.toolsSearched}`)
    console.log(`Tools with valid embeddings: ${data.metadata?.toolsWithValidEmbeddings}`)
    console.log('\nTop 5 results:')
    
    data.results?.slice(0, 5).forEach((result, index) => {
      console.log(`${index + 1}. ${result.name} (${result.toolId})`)
      console.log(`   Similarity: ${(result.similarity * 100).toFixed(2)}%`)
      console.log(`   Description: ${result.description}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testSemanticSearch()
