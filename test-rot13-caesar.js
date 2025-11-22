import { hardDetect } from './lib/hardDetection.js'

const tests = [
  { input: 'uryyb jbeyq', label: 'ROT13' },
  { input: 'Dro aesmu lbygx pyh TEWZC yfob dro vkji nyq.', label: 'Caesar' },
  { input: 'hello world', label: 'Plain English' },
]

tests.forEach(test => {
  const result = hardDetect(test.input)
  console.log(`${test.label}: "${test.input.substring(0, 30)}"`)
  console.log(`  Type: ${result?.type || 'NULL'}, Confidence: ${(result?.confidence || 0).toFixed(2)}`)
  console.log()
})
