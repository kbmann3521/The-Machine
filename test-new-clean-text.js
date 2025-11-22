#!/usr/bin/env node

const { runTool } = require('./lib/tools.js')

console.log('🧹 Testing New Clean Text Features\n')

const tests = [
  {
    name: '1. Remove Line Breaks',
    input: 'i want\nthis\non\none line',
    config: { removeLineBreaks: true, compressSpaces: true, fixPunctuationSpacing: true },
    expectedIncludes: 'i want this on one line'
  },
  {
    name: '2. Smart Join OCR Words',
    input: 'Th is tex t c ame',
    config: { smartJoinWords: true, compressSpaces: true },
    expectedIncludes: 'This text came'
  },
  {
    name: '3. Filter to ASCII Only',
    input: 'Hello wörld! Café and naïve',
    config: { filterCharacters: 'ascii-only', compressSpaces: true },
    expectedIncludes: 'Hello world'
  },
  {
    name: '4. Keep Accented Letters',
    input: 'Hello wörld! Café with émojis 😀',
    config: { filterCharacters: 'keep-accents', compressSpaces: true },
    expectedIncludes: 'wörld'
  },
  {
    name: '5. Basic Punctuation Only',
    input: 'Hello!!! @#$% World??? ***Special***',
    config: { filterCharacters: 'basic-punctuation', compressSpaces: true },
    expectedIncludes: 'Hello World Special'
  },
  {
    name: '6. Remove Timestamps (Chat Log)',
    input: '[14:03] Kyle: Hello\n[14:04] John: test\n[14:05] Sarah: ok',
    config: { removeTimestamps: true, removeBlankLines: true },
    expectedIncludes: 'Hello'
  }
]

let passed = 0
let failed = 0

tests.forEach((test, index) => {
  const result = runTool('remove-extras', test.input, test.config)
  
  const success = result.includes(test.expectedIncludes)
  
  if (success) {
    console.log(`✅ ${test.name}`)
    passed++
  } else {
    console.log(`❌ ${test.name}`)
    console.log(`   Input:          "${test.input}"`)
    console.log(`   Expected to include: "${test.expectedIncludes}"`)
    console.log(`   Got:             "${result}"`)
    failed++
  }
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`)

if (failed === 0) {
  console.log('🎉 All tests passed!')
  process.exit(0)
} else {
  process.exit(1)
}
