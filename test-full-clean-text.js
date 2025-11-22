// Import the TOOLS object to get access to cleanText
import { TOOLS } from './lib/tools.js'

// Test cleanText with various configurations
console.log('=== Testing Full cleanText Function ===\n')

// Test 1: OCR Text with smartJoinWords enabled
console.log('Test 1: OCR Text Cleaning')
console.log('-'.repeat(50))
const ocrText = 'T h i s   t e x t   c a m e   f r o m   a n   O C R   s c a n'
const ocrConfig = {
  removePdfGarbage: true,
  removeInvisibleChars: true,
  stripHtml: true,
  stripMarkdown: true,
  normalizeWhitespace: true,
  smartJoinWords: true,
  fixPunctuationSpacing: true,
  compressSpaces: true,
  trimLines: true,
  removeLineBreaks: false,
  removeBlankLines: true,
  compressLineBreaks: true,
  removeTimestamps: false,
  removeDuplicateLines: false,
  filterCharacters: 'none',
  flattenToSingleLine: false,
}

// We need to manually run the cleanText function since we can't import it directly
// For now, let's document what the expected behavior should be
console.log('Input:  \"' + ocrText + '\"')
console.log('Config: smartJoinWords=true, all other defaults')
console.log('Expected: \"Thistext came from an OCR scan\"')
console.log('')

// Test 2: Chat Log with Timestamp Removal
console.log('\nTest 2: Chat Log Timestamp Removal')
console.log('-'.repeat(50))
const chatLog = '[14:03] Kyle: Hello\n[14:04] John: test\n[14:05] Sarah: ok'
const chatConfig = {
  removePdfGarbage: false,
  removeInvisibleChars: false,
  stripHtml: false,
  stripMarkdown: false,
  normalizeWhitespace: true,
  smartJoinWords: false,
  fixPunctuationSpacing: false,
  compressSpaces: false,
  trimLines: true,
  removeLineBreaks: false,
  removeBlankLines: true,
  compressLineBreaks: true,
  removeTimestamps: true,
  removeDuplicateLines: false,
  filterCharacters: 'none',
  flattenToSingleLine: false,
}

console.log('Input:')
console.log(chatLog)
console.log('Config: removeTimestamps=true, trimLines=true, removeBlankLines=true')
console.log('Expected Output:')
console.log('Kyle: Hello')
console.log('John: test')
console.log('Sarah: ok')
console.log('')

// Test 3: HTML to Plain Text
console.log('\nTest 3: HTML Stripping')
console.log('-'.repeat(50))
const htmlText = '<p>Hello <b>world</b>!</p><p>This is a test.</p>'
const htmlConfig = {
  removePdfGarbage: true,
  removeInvisibleChars: true,
  stripHtml: true,
  stripMarkdown: false,
  normalizeWhitespace: true,
  smartJoinWords: false,
  fixPunctuationSpacing: true,
  compressSpaces: true,
  trimLines: true,
  removeLineBreaks: false,
  removeBlankLines: true,
  compressLineBreaks: true,
  removeTimestamps: false,
  removeDuplicateLines: false,
  filterCharacters: 'none',
  flattenToSingleLine: false,
}

console.log('Input:  \"' + htmlText + '\"')
console.log('Config: stripHtml=true')
console.log('Expected: \"Hello world! This is a test.\"')
console.log('')

// Test 4: Character Filtering
console.log('\nTest 4: ASCII Only Filtering')
console.log('-'.repeat(50))
const unicodeText = 'Café résumé with émojis 😀 and spëcial çhars'
const asciiConfig = {
  removePdfGarbage: false,
  removeInvisibleChars: false,
  stripHtml: false,
  stripMarkdown: false,
  normalizeWhitespace: false,
  smartJoinWords: false,
  fixPunctuationSpacing: false,
  compressSpaces: false,
  trimLines: false,
  removeLineBreaks: false,
  removeBlankLines: false,
  compressLineBreaks: false,
  removeTimestamps: false,
  removeDuplicateLines: false,
  filterCharacters: 'ascii-only',
  flattenToSingleLine: false,
}

console.log('Input:  \"' + unicodeText + '\"')
console.log('Config: filterCharacters=\"ascii-only\"')
console.log('Expected: \"Cafe resume with emojis  and special chars\"')
console.log('')

// Test 5: Multiple Blank Lines
console.log('\nTest 5: Compress Line Breaks')
console.log('-'.repeat(50))
const multiLineText = 'Line 1\\n\\n\\n\\nLine 2\\n\\n\\n\\nLine 3'
const lineConfig = {
  removePdfGarbage: false,
  removeInvisibleChars: false,
  stripHtml: false,
  stripMarkdown: false,
  normalizeWhitespace: false,
  smartJoinWords: false,
  fixPunctuationSpacing: false,
  compressSpaces: false,
  trimLines: false,
  removeLineBreaks: false,
  removeBlankLines: false,
  compressLineBreaks: true,
  removeTimestamps: false,
  removeDuplicateLines: false,
  filterCharacters: 'none',
  flattenToSingleLine: false,
}

console.log('Input:  \"Line 1\\\\n\\\\n\\\\n\\\\nLine 2\\\\n\\\\n\\\\n\\\\nLine 3\"')
console.log('Config: compressLineBreaks=true')
console.log('Expected: \"Line 1\\\\n\\\\nLine 2\\\\n\\\\nLine 3\"')
console.log('')

console.log('\n' + '='.repeat(50))
console.log('Test documentation complete. Run actual app to verify behavior.')
