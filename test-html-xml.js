import { hardDetect } from './lib/hardDetection.js'

const tests = [
  { input: '<div class="box"><p>Hello</p></div>', expected: 'html' },
  { input: '<user><name>Kyle</name></user>', expected: 'xml' },
  { input: '<html><body>Test</body></html>', expected: 'html' },
  { input: '<root><item>Test</item></root>', expected: 'xml' },
]

tests.forEach(test => {
  const result = hardDetect(test.input)
  const match = result?.type === test.expected ? '✅' : '❌'
  console.log(`${match} "${test.input.substring(0, 30)}" → ${result?.type || 'NULL'} (expected: ${test.expected})`)
})
