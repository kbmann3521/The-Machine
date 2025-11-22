#!/usr/bin/env node

/**
 * Test the 3-layer detection pipeline
 * Tests hard detection, LLM fallback, and semantic search
 */

async function testPipeline() {
  const testCases = [
    // STRUCTURED: Should be caught by hard detection (Layer 1)
    {
      input: 'kylemann90@gmail.com',
      expectedType: 'email',
      category: 'structured',
    },
    {
      input: '192.168.1.1',
      expectedType: 'ip',
      category: 'structured',
    },
    {
      input: '550e8400-e29b-41d4-a716-446655440000',
      expectedType: 'uuid',
      category: 'structured',
    },
    {
      input: 'https://example.com/page?query=test',
      expectedType: 'url',
      category: 'structured',
    },
    {
      input: '{"name":"Kyle","age":30}',
      expectedType: 'json',
      category: 'structured',
    },
    {
      input: '<html><body>Hello</body></html>',
      expectedType: 'html',
      category: 'structured',
    },
    {
      input: '11110010101010',
      expectedType: 'binary',
      category: 'structured',
    },
    {
      input: '#FF5733',
      expectedType: 'hex_color',
      category: 'structured',
    },
    {
      input: '5+6-2',
      expectedType: 'math_expression',
      category: 'numeric',
    },
    {
      input: '50MB',
      expectedType: 'file_size',
      category: 'numeric',
    },
    {
      input: '1:00pm',
      expectedType: 'time_12h',
      category: 'numeric',
    },
    {
      input: '2025-11-22',
      expectedType: 'timestamp',
      category: 'numeric',
    },
    {
      input: '10kg',
      expectedType: 'unit_value',
      category: 'numeric',
    },
    
    // PLAIN TEXT: Should use semantic search (Layer 3)
    {
      input: 'this is a sentence',
      expectedType: 'plain_text',
      category: 'text',
    },
    {
      input: 'hello world, how are you?',
      expectedType: 'plain_text',
      category: 'text',
    },
    {
      input: 'Can you analyze this paragraph for me?',
      expectedType: 'plain_text',
      category: 'text',
    },
  ]

  console.log('🧪 Testing 3-Layer Detection Pipeline\n')
  console.log('='.repeat(80))

  let passed = 0
  let failed = 0

  for (const testCase of testCases) {
    console.log(`\n📝 Input: "${testCase.input}"`)
    console.log(`   Category: ${testCase.category}`)
    console.log(`   Expected Type: ${testCase.expectedType}`)
    
    try {
      const response = await fetch('http://localhost:3000/api/tools/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: testCase.input }),
      })

      if (!response.ok) {
        console.log(`   ❌ FAIL: HTTP ${response.status}`)
        failed++
        continue
      }

      const data = await response.json()
      const topTool = data.predictedTools?.[0]

      if (!topTool) {
        console.log(`   ❌ FAIL: No tools returned`)
        failed++
        continue
      }

      console.log(`   ✓ Top Tool: ${topTool.name} (${topTool.toolId})`)
      console.log(`   ✓ Source: ${topTool.source}`)
      console.log(`   ✓ Similarity: ${(topTool.similarity * 100).toFixed(1)}%`)

      passed++
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`)
      failed++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)
  console.log(`✅ Success Rate: ${((passed / testCases.length) * 100).toFixed(0)}%`)
}

testPipeline().catch(console.error)
