#!/usr/bin/env node

async function testEmailClassification() {
  const testEmail = 'kylemann90@gmail.com'
  
  console.log('Testing email classification fix...\n')
  
  try {
    // Test 1: Classification endpoint
    console.log('📧 Test 1: Classifying email address...')
    const classifyResponse = await fetch('http://localhost:3000/api/tools/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: testEmail }),
    })
    
    const classifyData = await classifyResponse.json()
    console.log('Classification result:', classifyData)
    
    if (classifyData.category === 'validator') {
      console.log('✅ PASS: Email correctly classified as "validator"\n')
    } else {
      console.log('❌ FAIL: Email should be classified as "validator", got:', classifyData.category, '\n')
    }
    
    // Test 2: Intent extraction
    console.log('🎯 Test 2: Extracting intent for validator category...')
    const intentResponse = await fetch('http://localhost:3000/api/tools/extract-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        input: testEmail,
        input_type: 'email',
        category: 'validator'
      }),
    })
    
    const intentData = await intentResponse.json()
    console.log('Intent result:', intentData)
    
    if (intentData.intent === 'validation') {
      console.log('✅ PASS: Intent correctly extracted as "validation"\n')
    } else {
      console.log('⚠️  WARNING: Intent should be "validation", got:', intentData.intent, '\n')
    }
    
    // Test 3: Debug semantic (full pipeline)
    console.log('🧠 Test 3: Full semantic debug pipeline...')
    const debugResponse = await fetch('http://localhost:3000/api/tools/debug-semantic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: testEmail }),
    })
    
    const debugData = await debugResponse.json()
    console.log('Classification:', debugData.results?.classification)
    console.log('Intent:', debugData.results?.intent)
    console.log('Embedding text:', debugData.results?.embeddingGenerated?.text)
    console.log('Top vector search result:', debugData.results?.vectorSearch?.results?.[0])
    console.log('Semantic prediction results:', debugData.results?.semanticPredictionResults?.slice(0, 3))
    
    if (debugData.results?.vectorSearch?.results?.some(r => r.id === 'email-validator')) {
      console.log('✅ PASS: Email Validator found in vector search results\n')
    } else {
      console.log('⚠️  WARNING: Email Validator not in top results\n')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testEmailClassification()
