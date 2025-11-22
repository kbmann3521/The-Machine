import { hardDetect } from './lib/hardDetection.js'

const testCases = [
  '<div class="box"><p>Hello</p></div>',
  '<user><name>Kyle</name></user>',
  'name,age,city\nKyle,25,Austin',
  'FF22AA',
  '1100101010110',
  '(5 + 6) * 2',
]

testCases.forEach(input => {
  const result = hardDetect(input)
  const preview = input.substring(0, 40).replace(/\n/g, '\\n')
  console.log(`"${preview}" → ${result?.type || 'NULL'} (${result?.confidence || 0})`)
})
