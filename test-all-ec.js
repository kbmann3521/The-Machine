import { jwtDecoder } from './lib/tools/jwtDecoder.js'
import { JWT_TEST_PACK } from './lib/jwtTestPack.js'

const ecTests = JWT_TEST_PACK.tests.filter(t => t.algorithm.startsWith('ES'))

console.log(`Testing ${ecTests.length} EC tests:\n`)

ecTests.forEach(test => {
  const options = {}
  if (test.publicKey && test.publicKey !== '') {
    options.publicKey = test.publicKey
  }

  const result = jwtDecoder(test.token, options)
  const sigVerif = result.signatureVerification

  const expected = test.expected.signatureVerification
  const algMatch = sigVerif.algorithm === expected.algorithm
  const verifiedMatch = sigVerif.verified === expected.verified
  const reasonMatch = expected.reasonIncludes ? sigVerif.reason.includes(expected.reasonIncludes) : true

  const status = algMatch && verifiedMatch && reasonMatch ? '✅' : '❌'

  console.log(`${status} ${test.id}`)
  if (!algMatch) console.log(`   Algorithm mismatch: ${sigVerif.algorithm} vs ${expected.algorithm}`)
  if (!verifiedMatch) console.log(`   Verified mismatch: ${sigVerif.verified} vs ${expected.verified}`)
  if (!reasonMatch) {
    console.log(`   Reason mismatch:`)
    console.log(`     Expected to include: "${expected.reasonIncludes}"`)
    console.log(`     Got: "${sigVerif.reason}"`)
  }
})
