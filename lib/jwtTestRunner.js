import { jwtDecoder } from './tools/jwtDecoder'
import { JWT_TEST_PACK } from './jwtTestPack'

export function runJWTTests() {
  const results = []

  JWT_TEST_PACK.tests.forEach(test => {
    const result = {
      id: test.id,
      description: test.description,
      algorithm: test.algorithm,
      passed: false,
      errors: [],
      validations: [],
      expected: {},
      actual: {}
    }

    console.group(`🧪 Test: ${test.id}`)
    console.log('Token:', test.token.substring(0, 50) + '...')
    console.log('Secret:', test.secret ? '***' : '(empty)')

    try {
      // Run the decoder
      const decoderResult = jwtDecoder(test.token, {
        verificationSecret: test.secret || ''
      })

      // Check if decoding was successful
      if (!decoderResult.decoded) {
        result.errors.push(`Decoding failed: ${decoderResult.error}`)
        console.error('❌ Decoding failed:', decoderResult.error)
        results.push(result)
        console.groupEnd()
        return
      }

      // Validate signatureVerification
      if (test.expected.signatureVerification) {
        const expected = test.expected.signatureVerification
        const actual = decoderResult.signatureVerification

        result.expected.signatureVerification = expected
        result.actual.signatureVerification = actual

        console.log('Expected:', expected)
        console.log('Actual:', actual)

        // Check algorithm
        const algorithmMatch = actual.algorithm === expected.algorithm
        result.validations.push({
          name: 'Algorithm Match',
          expected: expected.algorithm,
          actual: actual.algorithm,
          passed: algorithmMatch
        })
        if (!algorithmMatch) {
          result.errors.push(
            `Algorithm mismatch: expected "${expected.algorithm}", got "${actual.algorithm}"`
          )
          console.error('❌ Algorithm mismatch')
        } else {
          console.log('✓ Algorithm matches')
        }

        // Check verified status
        const verifiedMatch = actual.verified === expected.verified
        result.validations.push({
          name: 'Verified Status',
          expected: expected.verified,
          actual: actual.verified,
          passed: verifiedMatch
        })
        if (!verifiedMatch) {
          result.errors.push(
            `Verified status mismatch: expected ${expected.verified}, got ${actual.verified}`
          )
          console.error('❌ Verified status mismatch')
        } else {
          console.log('✓ Verified status matches')
        }

        // Check reason substring
        if (expected.reasonIncludes) {
          const reasonMatch = actual.reason && actual.reason.includes(expected.reasonIncludes)
          result.validations.push({
            name: 'Reason Contains Text',
            expected: `"${expected.reasonIncludes}"`,
            actual: actual.reason || '(no reason)',
            passed: reasonMatch
          })
          if (!reasonMatch) {
            result.errors.push(
              `Reason doesn't include "${expected.reasonIncludes}". Got: "${actual.reason}"`
            )
            console.error(`❌ Reason doesn't include "${expected.reasonIncludes}"`)
          } else {
            console.log(`✓ Reason contains "${expected.reasonIncludes}"`)
          }
        }
      }

      // Validate header security warnings
      if (test.expected.headerSecurityWarningsIncludes) {
        const warnings = decoderResult.headerSecurityWarnings || []
        const warningText = warnings.map(w => w.message).join(' ')

        result.expected.headerSecurityWarnings = test.expected.headerSecurityWarningsIncludes
        result.actual.headerSecurityWarnings = warningText

        const warningMatch = warningText.includes(test.expected.headerSecurityWarningsIncludes)
        result.validations.push({
          name: 'Security Warning',
          expected: `contains "${test.expected.headerSecurityWarningsIncludes}"`,
          actual: warningText || '(no warnings)',
          passed: warningMatch
        })

        if (!warningMatch) {
          result.errors.push(
            `Header security warning doesn't include "${test.expected.headerSecurityWarningsIncludes}"`
          )
          console.error(`❌ Security warning doesn't include expected text`)
        } else {
          console.log(`✓ Security warning contains expected text`)
        }
      }

      // Determine pass/fail
      result.passed = result.errors.length === 0
      console.log(result.passed ? '✅ PASSED' : '❌ FAILED')

    } catch (error) {
      result.errors.push(`Test execution error: ${error.message}`)
      console.error('💥 Test execution error:', error)
    }

    console.groupEnd()
    results.push(result)
  })

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    passRate: Math.round((results.filter(r => r.passed).length / results.length) * 100)
  }

  console.log('━'.repeat(60))
  console.log(`📊 Test Summary: ${summary.passed}/${summary.total} passed (${summary.passRate}%)`)
  console.log('━'.repeat(60))

  return {
    summary,
    results,
    timestamp: new Date().toISOString()
  }
}
