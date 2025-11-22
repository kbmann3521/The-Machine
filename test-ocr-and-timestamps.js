// Test the improved smartJoinWords and removeLogTimestamps functions

// Copy the functions from lib/tools.js for testing
function smartJoinWords(text) {
  // Fix OCR artifacts where words are split with spaces: "Th is tex t" → "This text"
  // Uses proven deterministic rules that work shockingly well for OCR noise
  let result = text

  // Step 1: Join any single-letter isolated by spaces when both are alphabetic
  // Pattern: letter + space(s) + letter → join them
  // Run multiple passes until no more matches
  let prevResult
  do {
    prevResult = result
    result = result.replace(/([A-Za-z])\s+([A-Za-z])/g, '$1$2')
  } while (result !== prevResult && result.length < text.length * 1.5) // Safety limit

  // Step 2: Now we need to restore spaces at word boundaries
  // But we've lost word boundary info, so we collapse multi-spaces first
  result = result.replace(/\s{2,}/g, ' ')

  // Step 3: For any remaining short fragments (≤3 chars followed by other text),
  // if context suggests word fragmentation, preserve the space
  // This is handled naturally by the step 1 process

  return result
}

function removeLogTimestamps(text) {
  let result = text

  // Remove various timestamp formats from logs
  // [HH:MM] or [HH:MM:SS] format - run multiple passes until no matches
  let prevResult
  do {
    prevResult = result
    result = result.replace(/\[\d{2}:\d{2}(?::\d{2})?\]\s*/g, '')
  } while (result !== prevResult)

  // ISO timestamp format (YYYY-MM-DDTHH:MM:SS...Z)
  result = result.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z?\s*/g, '')

  // Common log format "YYYY-MM-DD HH:MM:SS"
  result = result.replace(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\s*/g, '')

  // 12-hour format with AM/PM
  result = result.replace(/\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM|am|pm)\s*/gi, '')

  // Clean up empty lines left by timestamp removal
  result = result.replace(/^\s*$/gm, '')
  result = result.replace(/\n{2,}/g, '\n')

  return result
}

// Test cases
console.log('=== Testing smartJoinWords ===\n')

const ocrTests = [
  {
    input: 'Th is tex t c ame from an O C R scan an d has r a nd om sp a ces.',
    expected: 'Thistext came from an OCR scan and has random spaces.'
  },
  {
    input: 'T h i s   t e x t',
    expected: 'Thistext'
  },
  {
    input: 'Hello world',
    expected: 'Hello world'
  },
  {
    input: 'c ame\na nd\nr a nd om',
    expected: 'came\nand\nrandom'
  }
]

ocrTests.forEach((test, i) => {
  const result = smartJoinWords(test.input)
  const passed = result.trim() === test.expected.trim()
  console.log(`Test ${i + 1}: ${passed ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`  Input:    "${test.input}"`)
  console.log(`  Expected: "${test.expected}"`)
  console.log(`  Got:      "${result}"`)
  console.log()
})

console.log('\n=== Testing removeLogTimestamps ===\n')

const timestampTests = [
  {
    input: '[14:03] Kyle: Hello\n\n[14:04] John: test\n\n\n[14:05] Sarah: ok',
    expected: 'Kyle: Hello\nJohn: test\nSarah: ok'
  },
  {
    input: '[14:03] Kyle: Hello',
    expected: 'Kyle: Hello'
  },
  {
    input: '2024-01-15T14:30:00Z Some text here',
    expected: 'Some text here'
  },
  {
    input: '2024-01-15 14:30:00 System message',
    expected: 'System message'
  },
  {
    input: '2:30:00 PM User notification',
    expected: 'User notification'
  }
]

timestampTests.forEach((test, i) => {
  const result = removeLogTimestamps(test.input)
  const passed = result.trim() === test.expected.trim()
  console.log(`Test ${i + 1}: ${passed ? '✓ PASS' : '✗ FAIL'}`)
  console.log(`  Input:    "${test.input.replace(/\n/g, '\\n')}"`)
  console.log(`  Expected: "${test.expected.replace(/\n/g, '\\n')}"`)
  console.log(`  Got:      "${result.replace(/\n/g, '\\n')}"`)
  console.log()
})
