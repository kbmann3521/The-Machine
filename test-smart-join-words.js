// Test the updated smartJoinWords function
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
                 parts[j + 2].length === 1) {
            fragment += parts[j]
            j += 2
          }
          
          if (j < parts.length && parts[j].length === 1) {
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
    note: 'Fragmented word'
  },
  {
    input: 'Hello world',
    expected: 'Hello world',
    note: 'Normal text - no change'
  },
  {
    input: 'O C R scan',
    expected: 'OCR scan',
    note: 'Fragmented acronym'
  },
  {
    input: 'T h i s is t e x t c a m e from a n O C R scan',
    expected: 'This is text came from an OCR scan',
    note: 'Mixed fragmented and normal'
  },
  {
    input: 'r a n d o m   sp a c es',
    expected: 'random spaces',
    note: 'Multiple spaces and fragmentation'
  }
]

console.log('=== Testing smartJoinWords ===\n')

tests.forEach((test, i) => {
  const result = smartJoinWords(test.input)
  const passed = result === test.expected
  console.log(`Test ${i + 1}: ${passed ? '✓ PASS' : '✗ FAIL'} - ${test.note}`)
  console.log(`  Input:    "${test.input}"`)
  console.log(`  Expected: "${test.expected}"`)
  console.log(`  Got:      "${result}"`)
  if (!passed) {
    console.log(`  DIFF: Expected [${test.expected}] but got [${result}]`)
  }
  console.log()
})
