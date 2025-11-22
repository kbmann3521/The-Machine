// Test the improved smartJoinWords and removeLogTimestamps functions

function smartJoinWords(text) {
  // Fix OCR artifacts where words are split with spaces: "Th is tex t" → "This text"
  // Uses intelligent detection to only fix actual fragmentation, not normal text
  let result = text

  // Process line by line to handle multi-line text correctly
  result = result
    .split('\n')
    .map(line => {
      const segments = line.split(/\s+/).filter(w => w.length > 0)

      if (segments.length < 2) return line

      // Detect if this looks like fragmented OCR text:
      // - Most segments are 1-3 characters long
      // - Average segment length is very short
      const shortSegments = segments.filter(w => w.length <= 3).length
      const avgLength = segments.reduce((sum, w) => sum + w.length, 0) / segments.length
      const fragmentationScore = shortSegments / segments.length

      // Only apply aggressive joining if strong fragmentation indicators are present
      // Threshold: >60% of segments are short AND average length < 2.5
      if (fragmentationScore > 0.6 && avgLength < 2.5) {
        // Aggressive mode: join all single letters
        let joined = line
        let prevJoined
        do {
          prevJoined = joined
          joined = joined.replace(/([A-Za-z])\s+([A-Za-z])/g, '$1$2')
        } while (joined !== prevJoined && joined.length < line.length * 1.5)

        // Collapse any remaining multiple spaces
        joined = joined.replace(/\s{2,}/g, ' ')
        return joined.trim()
      } else if (fragmentationScore > 0.3 && avgLength < 2) {
        // Moderate mode: only join obvious single-letter pairs
        let joined = line.replace(/([A-Za-z])\s+([A-Za-z])(?=[a-z])/g, '$1$2')
        return joined
      } else {
        // Normal text - preserve as is
        return line
      }
    })
    .join('\n')

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
    input: 'T h i s   t e x t',
    expected: 'Thistext',
    note: 'Heavy fragmentation - all single letters'
  },
  {
    input: 'Th is tex t c ame from an O C R scan',
    expected: 'Thistext came from an OCR scan',
    note: 'Mixed fragmentation - some words fragmented, others not'
  },
  {
    input: 'Hello world',
    expected: 'Hello world',
    note: 'Normal text - should not be modified'
  },
  {
    input: 'Normal sentence with proper spacing.',
    expected: 'Normal sentence with proper spacing.',
    note: 'Normal text - should not be modified'
  },
  {
    input: 'c ame\na nd\nr a nd om',
    expected: 'came\nand\nrandom',
    note: 'Heavily fragmented lines - should join'
  }
]

ocrTests.forEach((test, i) => {
  const result = smartJoinWords(test.input)
  const passed = result === test.expected
  console.log(`Test ${i + 1}: ${passed ? '✓ PASS' : '✗ FAIL'} - ${test.note}`)
  console.log(`  Input:    "${test.input.replace(/\n/g, '\\n')}"`)
  console.log(`  Expected: "${test.expected.replace(/\n/g, '\\n')}"`)
  console.log(`  Got:      "${result.replace(/\n/g, '\\n')}"`)
  console.log()
})

console.log('\n=== Testing removeLogTimestamps ===\n')

const timestampTests = [
  {
    input: '[14:03] Kyle: Hello\n\n[14:04] John: test\n\n\n[14:05] Sarah: ok',
    expected: 'Kyle: Hello\nJohn: test\nSarah: ok',
    note: 'Chat format with extra blank lines'
  },
  {
    input: '[14:03] Kyle: Hello',
    expected: 'Kyle: Hello',
    note: 'Simple chat message with timestamp'
  },
  {
    input: '2024-01-15T14:30:00Z Some text here',
    expected: 'Some text here',
    note: 'ISO format timestamp'
  },
  {
    input: '2024-01-15 14:30:00 System message',
    expected: 'System message',
    note: 'Log format timestamp'
  },
  {
    input: '2:30:00 PM User notification',
    expected: 'User notification',
    note: '12-hour format timestamp'
  }
]

timestampTests.forEach((test, i) => {
  const result = removeLogTimestamps(test.input)
  const passed = result.trim() === test.expected.trim()
  console.log(`Test ${i + 1}: ${passed ? '✓ PASS' : '✗ FAIL'} - ${test.note}`)
  console.log(`  Input:    "${test.input.replace(/\n/g, '\\n')}"`)
  console.log(`  Expected: "${test.expected.replace(/\n/g, '\\n')}"`)
  console.log(`  Got:      "${result.replace(/\n/g, '\\n')}"`)
  console.log()
})
