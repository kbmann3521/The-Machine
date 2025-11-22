// Test the updated smartJoinWords function with fragment limit
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
                 fragment.length < 6) {
            fragment += parts[j]
            j += 2
          }
          
          if (j < parts.length && 
              parts[j].length === 1 && 
              fragment.length < 6) {
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
    note: 'Fragmented letters + normal text'
  },
  {
    input: 'c a m e',
    expected: 'came',
    note: 'Fragmented word (4 letters, within limit)'
  },
  {
    input: 'Hello world',
    expected: 'Hello world',
    note: 'Normal text - no change'
  },
  {
    input: 'O C R scan',
    expected: 'OCR scan',
    note: 'Fragmented acronym (3 letters)'
  },
  {
    input: 'r a n d o m spaces',
    expected: 'random spaces',
    note: 'Fragmented 6-letter word + normal word'
  },
  {
    input: 'T h i s is t e x t a n d s t u f f',
    expected: 'This is text and stuff',
    note: 'Multiple fragmented words'
  },
  {
    input: 'an d has r a n d o m s p a c es',
    expected: 'and has random spaces',
    note: 'Multiple fragmented words with 6+ chars'
  }
]

console.log('=== Testing smartJoinWords (with 6-char fragment limit) ===\n')

tests.forEach((test, i) => {
  const result = smartJoinWords(test.input)
  const passed = result === test.expected
  console.log(`Test ${i + 1}: ${passed ? '✓ PASS' : '✗ FAIL'} - ${test.note}`)
  console.log(`  Input:    "${test.input}"`)
  console.log(`  Expected: "${test.expected}"`)
  console.log(`  Got:      "${result}"`)
  if (!passed) {
    console.log(`  MISMATCH`)
  }
  console.log()
})
