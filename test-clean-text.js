#!/usr/bin/env node

// Import the cleanText function from lib/tools.js
const { runTool } = require('./lib/tools.js')

console.log('🧹 Testing Advanced Clean Text Filter\n')

const testCases = [
  {
    name: '1. Messy Copy/Paste with Excessive Spacing',
    input: 'Hello      world     \nthis     is      spaced     weirdly.',
    config: { compressSpaces: true, trimLines: true },
    expected: 'Hello world\nthis is spaced weirdly.'
  },
  {
    name: '2. Text with Tabs and Inconsistent Whitespace',
    input: 'This text has\t\nlots of tabs\t\t\tand spaces.',
    config: { normalizeWhitespace: true, compressSpaces: true },
    expected: 'This text has\nlots of tabs and spaces.'
  },
  {
    name: '3. Line breaks every few words',
    input: 'This  \ntext  \nhas  \nline breaks  \nevery  \nfew  \nwords.',
    config: { compressSpaces: true, flattenToSingleLine: true },
    expected: 'This text has line breaks every few words.'
  },
  {
    name: '4. PDF Garbage Characters',
    input: 'This text contains ï»¿garbage characters from a PDF.',
    config: { removePdfGarbage: true },
    expected: 'This text contains garbage characters from a PDF.'
  },
  {
    name: '5. Hidden Characters with soft hyphens',
    input: 'Here\'s a sentence with hidden characters: ­­­­­­­­Hello.',
    config: { removePdfGarbage: true, removeInvisibleChars: true },
    expected: 'Here\'s a sentence with hidden characters: Hello.'
  },
  {
    name: '6. Unicode Zero-Width Characters',
    input: 'Hello\u00A0World\u200BThis\u2009Text\uFEFFIs\u2028Strange',
    config: { removeInvisibleChars: true, normalizeWhitespace: true },
    expected: 'Hello World This Text Is\nStrange'
  },
  {
    name: '7. Duplicated Newlines',
    input: 'Hello world\n\n\nThis has a lot of blank lines.\n\n\n\nPlease strip them.',
    config: { removeBlankLines: true, compressLineBreaks: true },
    expected: 'Hello world\nThis has a lot of blank lines.\nPlease strip them.'
  },
  {
    name: '8. Chat Logs with Timestamps',
    input: '[14:03] Kyle: Hello\n\n[14:04] John: test\n\n[14:05] Sarah: ok',
    config: { removeTimestamps: true, removeBlankLines: true },
    expected: 'Hello\ntest\nok'
  },
  {
    name: '9. Whitespace Around Punctuation',
    input: 'Hello , world ! This is spaced wrong .',
    config: { fixPunctuationSpacing: true },
    expected: 'Hello, world! This is spaced wrong.'
  },
  {
    name: '10. OCR Output with Random Spaces',
    input: 'Th is tex t c ame from an O C R scan an d has r a nd om sp a ces.',
    config: { compressSpaces: true, trimLines: true },
    expected: 'Th is tex t c ame from an O C R scan an d has r a nd om sp a ces.'
  },
  {
    name: '11. HTML Stripped with Weird Spacing',
    input: 'This <b>was</b> HTML   but now everything is spaced like this      .',
    config: { stripHtml: true, compressSpaces: true, fixPunctuationSpacing: true },
    expected: 'This was HTML but now everything is spaced like this.'
  },
  {
    name: '12. Markdown Stripped with Spacing',
    input: 'This *used* to be **markdown**  but now it has   weird spacing.',
    config: { stripMarkdown: true, compressSpaces: true },
    expected: 'This used to be markdown but now it has weird spacing.'
  },
  {
    name: '13. Word/Docs Copy-Paste with Line Breaks',
    input: 'This text  \ncontains  \ninvisible  \nformatting  \nfrom  \nWord.',
    config: { flattenToSingleLine: true, compressSpaces: true },
    expected: 'This text contains invisible formatting from Word.'
  },
  {
    name: '14. Multiline Flattening',
    input: 'The quick\nbrown fox\njumped over\nthe lazy dog',
    config: { flattenToSingleLine: true },
    expected: 'The quick brown fox jumped over the lazy dog'
  },
]

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = runTool('remove-extras', testCase.input, testCase.config)
  
  if (result === testCase.expected) {
    console.log(`✅ ${testCase.name}`)
    passed++
  } else {
    console.log(`❌ ${testCase.name}`)
    console.log(`   Input:    ${JSON.stringify(testCase.input)}`)
    console.log(`   Expected: ${JSON.stringify(testCase.expected)}`)
    console.log(`   Got:      ${JSON.stringify(result)}`)
    failed++
  }
})

console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`)

if (failed === 0) {
  console.log('🎉 All tests passed!')
  process.exit(0)
} else {
  process.exit(1)
}
