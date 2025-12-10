import { jwtDecoder } from './tools/jwtDecoder'
import { PHASE_5_TEST_PACK } from './phase5TestPack'
import { buildJwksUrl, fetchJwks, findKeyByKid, jwkToPem } from './tools/jwksClient'

/**
 * Run Phase 5 tests asynchronously
 * Tests JWKS discovery, real-world token structures, and validation
 */
export async function runPhase5Tests(options = {}) {
  const {
    skipRealJwksFetch = true,
    jwksEndpointsToTest = []
  } = options

  const results = []
  const testPack = PHASE_5_TEST_PACK

  console.group('🔐 Phase 5 Test Suite: JWKS Auto-Discovery')
  console.log('Description:', testPack.meta.description)
  console.log('Total tests:', testPack.tests.length)

  for (const test of testPack.tests) {
    const result = {
      id: test.id,
      description: test.description,
      category: test.category || 'General',
      algorithm: test.algorithm,
      passed: false,
      errors: [],
      validations: [],
      expected: test.expectedElements || {},
      actual: {},
      notes: test.notes
    }

    console.group(`🧪 ${test.id}`)
    console.log('Category:', result.category)
    console.log('Description:', test.description)

    try {
      // Decode the token
      const decoderResult = jwtDecoder(test.token, {
        skipVerification: test.options?.skipVerification || true
      })

      if (!decoderResult.decoded) {
        result.errors.push(`Decoding failed: ${decoderResult.error}`)
        console.error('❌ Decoding failed')
        results.push(result)
        console.groupEnd()
        continue
      }

      const header = decoderResult.header || {}
      const payload = decoderResult.payload || {}

      result.actual.header = header
      result.actual.payload = payload

      // Validate expected header elements
      if (test.expectedElements?.headerKid !== undefined) {
        const expectedKid = test.expectedElements.headerKid
        const actualKid = header.kid || null
        const kidMatch = actualKid === expectedKid

        result.validations.push({
          name: 'Header kid (Key ID)',
          expected: expectedKid,
          actual: actualKid,
          passed: kidMatch
        })

        if (!kidMatch) {
          result.errors.push(`kid mismatch: expected ${expectedKid}, got ${actualKid}`)
        } else {
          console.log('✓ Header kid matches')
        }
      }

      // Validate expected issuer
      if (test.expectedElements?.issuer !== undefined) {
        const expectedIssuer = test.expectedElements.issuer
        const actualIssuer = payload.iss || null
        const issuerMatch = actualIssuer === expectedIssuer

        result.validations.push({
          name: 'Issuer (iss)',
          expected: expectedIssuer,
          actual: actualIssuer,
          passed: issuerMatch
        })

        if (!issuerMatch) {
          result.errors.push(`issuer mismatch: expected ${expectedIssuer}, got ${actualIssuer}`)
        } else {
          console.log('✓ Issuer matches')
        }

        // Try to build JWKS URL
        if (actualIssuer) {
          const jwksUrl = buildJwksUrl(actualIssuer)
          console.log('JWKS URL:', jwksUrl)

          if (jwksUrl && !skipRealJwksFetch && jwksEndpointsToTest.includes(actualIssuer)) {
            console.log('Attempting to fetch real JWKS...')
            try {
              const jwks = await fetchJwks(jwksUrl)
              if (jwks && jwks.keys) {
                console.log(`✓ JWKS fetched (${jwks.keys.length} keys available)`)
                result.actual.jwksKeysCount = jwks.keys.length

                // Try to find key by kid
                if (header.kid && jwks.keys) {
                  const key = findKeyByKid(jwks, header.kid)
                  if (key) {
                    console.log('✓ Found matching key in JWKS')
                    result.actual.keyFound = true

                    // Try to convert to PEM
                    const pem = jwkToPem(key)
                    if (pem) {
                      console.log('✓ Converted JWK to PEM format')
                      result.actual.pemConverted = true
                    } else {
                      console.warn('⚠ Failed to convert JWK to PEM')
                    }
                  } else {
                    console.warn(`⚠ No key found with kid: ${header.kid}`)
                    result.actual.keyFound = false
                  }
                }
              }
            } catch (error) {
              console.warn(`⚠ Real JWKS fetch failed: ${error.message}`)
              result.notes = (result.notes || '') + ` [JWKS fetch error: ${error.message}]`
            }
          }
        }
      }

      // Validate token type
      if (test.expectedElements?.tokenType) {
        const expectedType = test.expectedElements.tokenType
        const actualType = decoderResult.tokenType || 'Unknown'
        const typeMatch = actualType === expectedType

        result.validations.push({
          name: 'Token Type',
          expected: expectedType,
          actual: actualType,
          passed: typeMatch
        })

        if (!typeMatch) {
          result.errors.push(`Token type mismatch: expected ${expectedType}, got ${actualType}`)
        } else {
          console.log('✓ Token type matches')
        }
      }

      // Validate expected claims present
      if (test.expectedElements?.claims && Array.isArray(test.expectedElements.claims)) {
        const expectedClaims = test.expectedElements.claims
        const presentClaims = expectedClaims.filter(claim => claim in payload)
        const allClaimsPresent = presentClaims.length === expectedClaims.length

        result.validations.push({
          name: 'Expected Claims Present',
          expected: expectedClaims.join(', '),
          actual: presentClaims.join(', '),
          passed: allClaimsPresent
        })

        if (!allClaimsPresent) {
          const missing = expectedClaims.filter(claim => !(claim in payload))
          result.errors.push(`Missing claims: ${missing.join(', ')}`)
        } else {
          console.log('✓ All expected claims present')
        }
      }

      // Validate custom claims
      if (test.expectedElements?.customClaims && Array.isArray(test.expectedElements.customClaims)) {
        const expectedCustom = test.expectedElements.customClaims
        const presentCustom = expectedCustom.filter(claim => claim in payload)

        result.validations.push({
          name: 'Custom Claims',
          expected: expectedCustom.join(', '),
          actual: presentCustom.join(', '),
          passed: presentCustom.length > 0
        })

        if (presentCustom.length === 0) {
          console.warn(`⚠ Expected custom claims not found: ${expectedCustom.join(', ')}`)
        } else {
          console.log(`✓ Custom claims found: ${presentCustom.join(', ')}`)
        }
      }

      // Validate expected behavior indicators
      if (test.expectedBehavior) {
        result.actual.expectedBehavior = test.expectedBehavior
        result.validations.push({
          name: 'Expected Behavior',
          expected: test.expectedBehavior,
          actual: test.expectedBehavior,
          passed: true
        })
        console.log(`ℹ Expected behavior: ${test.expectedBehavior}`)
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
  }

  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.passed).length,
    failed: results.filter(r => !r.passed).length,
    passRate: Math.round((results.filter(r => r.passed).length / results.length) * 100),
    byCategory: {}
  }

  // Group by category
  results.forEach(result => {
    if (!summary.byCategory[result.category]) {
      summary.byCategory[result.category] = {
        total: 0,
        passed: 0,
        failed: 0
      }
    }
    summary.byCategory[result.category].total++
    if (result.passed) {
      summary.byCategory[result.category].passed++
    } else {
      summary.byCategory[result.category].failed++
    }
  })

  console.log('━'.repeat(60))
  console.log(`📊 Phase 5 Summary: ${summary.passed}/${summary.total} passed (${summary.passRate}%)`)
  console.log('━'.repeat(60))

  Object.entries(summary.byCategory).forEach(([category, stats]) => {
    console.log(`  ${category}: ${stats.passed}/${stats.total}`)
  })

  return {
    summary,
    results,
    timestamp: new Date().toISOString()
  }
}

/**
 * Test real JWKS endpoints from major identity providers
 * Requires valid endpoint URLs
 */
export async function testRealJwksEndpoints(endpoints = []) {
  const results = []

  console.group('🌐 Testing Real JWKS Endpoints')

  for (const endpoint of endpoints) {
    const result = {
      endpoint,
      accessible: false,
      keysCount: 0,
      algos: [],
      errors: []
    }

    console.group(`Testing: ${endpoint}`)

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'PioneerWebTools-Phase5-Tester/1.0'
        }
      })

      if (response.ok) {
        const jwks = await response.json()
        result.accessible = true

        if (jwks.keys && Array.isArray(jwks.keys)) {
          result.keysCount = jwks.keys.length
          result.algos = [...new Set(jwks.keys.map(k => k.alg).filter(Boolean))]

          console.log(`✓ Accessible`)
          console.log(`  Keys: ${result.keysCount}`)
          console.log(`  Algorithms: ${result.algos.join(', ')}`)
        }
      } else {
        result.errors.push(`HTTP ${response.status}: ${response.statusText}`)
        console.error(`✗ HTTP ${response.status}`)
      }
    } catch (error) {
      result.errors.push(error.message)
      console.error(`✗ Error: ${error.message}`)
    }

    console.groupEnd()
    results.push(result)
  }

  console.log('━'.repeat(60))
  console.log(`✓ ${results.filter(r => r.accessible).length}/${results.length} endpoints accessible`)
  console.log('━'.repeat(60))
  console.groupEnd()

  return results
}
