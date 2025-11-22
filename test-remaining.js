import { hardDetect } from './lib/hardDetection.js'

const tests = [
  { input: 'name,age,city\nKyle,25,Austin', expected: 'csv' },
  { input: '<user><name>Kyle</name></user>', expected: 'xml' },
  { input: '2025-11-22', expected: 'timestamp' },
  { input: '13:45', expected: 'time_24h' },
  { input: '(5 + 6) * 2', expected: 'math_expression' },
  { input: 'FF22AA', expected: 'hex_number' },
  { input: '1100101010110', expected: 'binary' },
]

tests.forEach(test => {
  const result = hardDetect(test.input)
  const preview = test.input.substring(0, 30).replace(/\n/g, '\\n')
  const match = result?.type === test.expected ? '✅' : '❌'
  console.log(`${match} "${preview}" → ${result?.type || 'NULL'} (expected: ${test.expected})`)
})
