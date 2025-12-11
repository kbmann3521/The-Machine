import { runJWTTests } from './lib/jwtTestRunner.js'

console.log('Running JWT tests...\n')
const { summary, results } = runJWTTests()

console.log('\n\n=== TEST SUMMARY ===')
console.log(`Total: ${summary.total}`)
console.log(`Passed: ${summary.passed}`)
console.log(`Failed: ${summary.failed}`)
console.log(`Pass Rate: ${summary.passRate}%`)

console.log('\n\n=== FAILED TESTS ===')
results.filter(r => !r.passed).forEach(test => {
  console.log(`\n❌ ${test.id}`)
  test.errors.forEach(error => console.log(`   ${error}`))
})

console.log('\n\n=== ES256/384/512 TESTS ===')
results.filter(r => r.algorithm && r.algorithm.startsWith('ES')).forEach(test => {
  console.log(`\n${test.passed ? '✅' : '❌'} ${test.id}`)
  console.log(`   Algorithm: ${test.algorithm}`)
  console.log(`   Verified: ${test.actual.signatureVerification?.verified}`)
  console.log(`   Reason: ${test.actual.signatureVerification?.reason?.substring(0, 80)}...`)
})
