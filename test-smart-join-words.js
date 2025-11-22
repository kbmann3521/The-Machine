// Test the updated smartJoinWords function with 5-char limit (max 4 chars)
function smartJoinWords(text) {
  let result = text

  result = result
    .split('\n')
    .map(line => {
      const parts = line.split(/(\s+)/)
      
      let processedParts = []
      let i = 0
      
      while (i < parts.length) {
        const part = parts[i]
        
        if (/^\s+$/.test(part)) {
          processedParts.push(part)
          i++
          continue
        }
        
        if (part.length === 1 && 
            i + 2 < parts.length && 
            /^\s+$/.test(parts[i + 1]) && 
            parts[i + 2].length === 1) {
          
          let fragment = part
          let j = i + 2
          
          while (j < parts.length && 
                 parts[j].length === 1 &&
                 j + 1 < parts.length &&
                 /^\s+$/.test(parts[j + 1]) &&
                 j + 2 < parts.length &&
                 parts[j + 2].length === 1 &&
                 fragment.length < 5) {  // Max 4 chars (< 5)
            fragment += parts[j]
            j += 2
          }
          
          if (j < parts.length && 
              parts[j].length === 1 && 
              fragment.length < 5) {  // Max 4 chars
            fragment += parts[j]
            j += 1
          }
          
          processedParts.push(fragment)
          
          if (j < parts.length && /^\s+$/.test(parts[j])) {
            processedParts.push(parts[j])
            j += 1
          }
          
          i = j
        } else {
          processedParts.push(part)
          i += 1
        }
      }
      
      return processedParts.join('')
    })
    .join('\n')

  return result
}

// Test cases
const tests = [
  {
    input: 'T h i s is text',
    expected: 'This is text',
    note: 'Fragmented "This" (4 chars) + normal text'
  },
  {
    input: 'c a m e',
    expected: 'came',
    note: 'Fragmented 4-letter word'
  },
  {
    input: 'Hello world',
    expected: 'Hello world',
    note: 'Normal text - no change'
  },
  {
    input: 'O C R scan',
    expected: 'OCR scan',
    note: 'Fragmented 3-letter acronym'
  },
  {
    input: 'r a n d o m spaces',
    expected: 'r and om spaces',
    note: '6-letter fragmented word (exceeds limit, partially joined)'
  },
  {
    input: 'T h i s is t e x t a n d s t u f f',
    expected: 'This is text a nd s tu ff',
    note: 'Multiple fragmented words (4-char limit prevents over-joining)'
  },
  {
    input: '[14:03] Kyle: Hello\n\n[14:04] John: test',
    expected: '[14:03] Kyle: Hello\n\n[14:04] John: test',
    note: 'Chat log with timestamps (no fragmentation)'
  }
]

console.log('=== Testing smartJoinWords (5-char limit = max 4 chars) ===\n')

let passed = 0
let failed = 0

tests.forEach((test, i) => {
  const result = smartJoinWords(test.input)
  const isPass = result === test.expected
  if (isPass) passed++
  else failed++
  
  console.log(`Test ${i + 1}: ${isPass ? '✓ PASS' : '✗ FAIL'} - ${test.note}`)
  console.log(`  Input:    "${test.input.replace(/\n/g, '\\n')}"`)
  console.log(`  Expected: "${test.expected.replace(/\n/g, '\\n')}"`)
  console.log(`  Got:      "${result.replace(/\n/g, '\\n')}"`)
  console.log()
})

console.log(`\n=== SUMMARY: ${passed} passed, ${failed} failed ===`)
