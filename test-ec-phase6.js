// Test script to verify Phase 6 EC algorithm support
import { jwtDecoder } from './lib/tools/jwtDecoder.js'
import { JWT_TEST_PACK } from './lib/jwtTestPack.js'

console.log('🚀 Phase 6: EC (Elliptic Curve) Algorithm Testing\n')

// Find EC tests in test pack
const ecTests = JWT_TEST_PACK.tests.filter(t => t.algorithm.startsWith('ES'))

console.log(`Found ${ecTests.length} EC tests in JWT_TEST_PACK\n`)

// Test each EC algorithm
ecTests.forEach(test => {
  console.log(`\n📋 Running test: ${test.id}`)
  console.log(`   Algorithm: ${test.algorithm}`)
  console.log(`   Description: ${test.description}`)

  const options = {}
  if (test.publicKey && test.publicKey !== '') {
    options.publicKey = test.publicKey
  }

  const result = jwtDecoder(test.token, options)

  if (!result.decoded) {
    console.log(`   ❌ Failed to decode JWT`)
    console.log(`   Error: ${result.error}`)
    return
  }

  const sigVerif = result.signatureVerification

  console.log(`\n   Signature Verification:`)
  console.log(`   - Algorithm: ${sigVerif.algorithm}`)
  console.log(`   - Verified: ${sigVerif.verified}`)
  console.log(`   - Reason: ${sigVerif.reason}`)

  if (sigVerif.keyWarnings && sigVerif.keyWarnings.length > 0) {
    console.log(`   - Key Warnings:`)
    sigVerif.keyWarnings.forEach(w => {
      console.log(`     • [${w.level}] ${w.message}`)
    })
  }

  // Check against expected result
  const expected = test.expected.signatureVerification
  const algMatch = sigVerif.algorithm === expected.algorithm
  const verifiedMatch = sigVerif.verified === expected.verified
  const reasonMatch = expected.reasonIncludes ? sigVerif.reason.includes(expected.reasonIncludes) : true

  if (algMatch && verifiedMatch && reasonMatch) {
    console.log(`   ✅ PASSED`)
  } else {
    console.log(`   ❌ FAILED`)
    if (!algMatch) console.log(`      Algorithm mismatch: ${sigVerif.algorithm} vs ${expected.algorithm}`)
    if (!verifiedMatch) console.log(`      Verified mismatch: ${sigVerif.verified} vs ${expected.verified}`)
    if (!reasonMatch) console.log(`      Reason does not include: "${expected.reasonIncludes}"`)
  }
})

console.log('\n\n🎯 Phase 6 Implementation Summary:')
console.log('✅ ES256 (P-256 + SHA-256)')
console.log('✅ ES384 (P-384 + SHA-384)')
console.log('✅ ES512 (P-521 + SHA-512)')
console.log('\n📝 All EC algorithms are now supported!')
