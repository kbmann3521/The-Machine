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
      expected: {},
      actual: {}
    }

    try {
      // Run the decoder
      const decoderResult = jwtDecoder(test.token, {
        verificationSecret: test.secret || ''
      })

      // Check if decoding was successful
      if (!decoderResult.decoded) {
        result.errors.push(`Decoding failed: ${decoderResult.error}`)
        results.push(result)
        return
      }

      // Validate signatureVerification
      if (test.expected.signatureVerification) {
        const expected = test.expected.signatureVerification
        const actual = decoderResult.signatureVerification

        result.expected.signatureVerification = expected
        result.actual.signatureVerification = actual

        // Check algorithm
        if (actual.algorithm !== expected.algorithm) {
          result.errors.push(
            `Algorithm mismatch: expected "${expected.algorithm}", got "${actual.algorithm}"`
          )
        }

        // Check verified status
        if (actual.verified !== expected.verified) {
          result.errors.push(
            `Verified status mismatch: expected ${expected.verified}, got ${actual.verified}`
          )
        }

        // Check reason substring
        if (expected.reasonIncludes) {
          if (!actual.reason || !actual.reason.includes(expected.reasonIncludes)) {
            result.errors.push(
              `Reason doesn't include "${expected.reasonIncludes}". Got: "${actual.reason}"`
            )
          }
        }
      }

      // Validate header security warnings
      if (test.expected.headerSecurityWarningsIncludes) {
        const warnings = decoderResult.headerSecurityWarnings || []
        const warningText = warnings.map(w => w.message).join(' ')

        result.expected.headerSecurityWarnings = test.expected.headerSecurityWarningsIncludes
        result.actual.headerSecurityWarnings = warningText

        if (!warningText.includes(test.expected.headerSecurityWarningsIncludes)) {
          result.errors.push(
            `Header security warning doesn't include "${test.expected.headerSecurityWarningsIncludes}"`
          )
        }
      }

      // Determine pass/fail
      result.passed = result.errors.length === 0

    } catch (error) {
      result.errors.push(`Test execution error: ${error.message}`)
    }

    results.push(result)
  })

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    passRate: Math.round((results.filter(r => r.passed).length / results.length) * 100)
  }

  return {
    summary,
    results,
    timestamp: new Date().toISOString()
  }
}
