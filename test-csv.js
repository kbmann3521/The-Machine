import { hardDetect } from './lib/hardDetection.js'

const csvTest = 'name,age,city\nKyle,25,Austin'
const result = hardDetect(csvTest)
console.log('CSV Input:')
console.log(csvTest)
console.log('Result:', result)

// Test if commas and newlines are present
console.log('Has comma:', csvTest.includes(','))
console.log('Lines:', csvTest.split('\n').length)
const lines = csvTest.split('\n')
console.log('First line has comma:', lines[0].includes(','))
console.log('Other lines have comma:', lines.slice(1).some(l => l.includes(',')))
