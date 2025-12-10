# Phase 5 Testing Guide: JWKS Auto-Discovery and Real JWT Token Validation

## Overview

Phase 5 introduces **JWKS (JSON Web Key Set) auto-discovery** and **RSA signature verification** for the JWT Decoder tool. This guide explains how to test these features using both structured test cases and real JWT tokens from identity providers.

## Test Structure

### Files

- **`lib/phase5TestPack.js`** - Test cases for JWKS discovery and real-world token structures
- **`lib/phase5TestRunner.js`** - Async test runner for Phase 5 tests with JWKS operations
- **`lib/tools/jwksClient.js`** - JWKS fetching, caching, and JWK-to-PEM conversion
- **`pages/api/fetch-jwks.js`** - Server-side proxy for JWKS endpoints (CORS bypass)
- **`lib/tools/jwtDecoder.js`** - Updated with jwtDecoderWithJwks async function

### Running Phase 5 Tests

#### Option 1: Structured Test Cases (No Identity Provider Required)

Run the Phase 5 test suite that validates token structures and JWKS discovery indicators:

```javascript
// In a Node.js environment or Next.js API route
import { runPhase5Tests } from './lib/phase5TestRunner'

const results = await runPhase5Tests({
  skipRealJwksFetch: true, // Don't attempt to fetch real JWKS
  jwksEndpointsToTest: []   // No real endpoints to test
})

console.log(`Results: ${results.summary.passed}/${results.summary.total} passed`)
```

**What This Tests:**
- Token structure with kid (Key ID) and iss (Issuer) claims
- JWKS discovery indicator validation
- Real-world token structures from Auth0, Firebase, Okta, Azure AD
- Token type classification (ID Token, Access Token, etc.)
- Required claims validation
- Edge cases (missing kid, missing iss, invalid issuer format, HTTP vs HTTPS)

#### Option 2: Real JWKS Endpoint Testing

Test against actual JWKS endpoints from identity providers:

```javascript
import { runPhase5Tests, testRealJwksEndpoints } from './lib/phase5TestRunner'

// Test JWKS discovery with real endpoints
const results = await runPhase5Tests({
  skipRealJwksFetch: false,
  jwksEndpointsToTest: [
    'https://example.auth0.com',
    'https://securetoken.google.com/my-project'
  ]
})

// Or test endpoints directly
const endpointResults = await testRealJwksEndpoints([
  'https://example.auth0.com/.well-known/jwks.json',
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com'
])
```

**What This Tests:**
- Real JWKS endpoint accessibility
- JWKS structure and key availability
- Algorithms supported by each provider
- Network connectivity and caching behavior

#### Option 3: Real JWT Token Validation

To test with actual JWT tokens from identity providers:

```javascript
import { jwtDecoderWithJwks } from './lib/tools/jwtDecoder'

// Paste a real JWT token from your identity provider
const realToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkY4MEE0MzI1RDY2QzRGNDI5NzM5MDkyQzlGQzVBOUE3In0...'

const result = await jwtDecoderWithJwks(realToken, {
  autoFetchJwks: true
})

console.log('Signature verified:', result.signatureVerification.verified)
```

## Getting Real JWT Tokens

### Auth0

1. Go to https://auth0.com/docs/get-started/backend-auth/securing-spas-with-tokens
2. Create a test application or use an existing one
3. Generate a token using Auth0's online tools
4. Copy the token and paste into the JWT Decoder

**Issuer Format:** `https://YOUR_DOMAIN.auth0.com/`

**JWKS Endpoint:** `https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json`

### Firebase

1. Go to https://console.firebase.google.com
2. Set up authentication in your Firebase project
3. Create a test user
4. Use Firebase Admin SDK or Emulator to generate an ID token

```bash
# If using Firebase Emulator
curl -X POST http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","returnSecureToken":true}'
```

**Issuer Format:** `https://securetoken.google.com/YOUR_PROJECT_ID`

**JWKS Endpoint:** `https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`

### Okta

1. Go to https://developer.okta.com/docs/guides/validate-id-tokens/
2. Follow their developer signup process
3. Create an OAuth application
4. Use the Okta dashboard or APIs to generate tokens

**Issuer Format:** `https://YOUR_DOMAIN.okta.com`

**JWKS Endpoint:** `https://YOUR_DOMAIN.okta.com/oauth2/v1/keys`

### Azure AD

1. Go to https://portal.azure.com
2. Register an application in Azure AD
3. Follow Microsoft's token generation flow
4. Get a token from the Azure AD token endpoint

**Issuer Format:** `https://login.microsoftonline.com/TENANT_ID/v2.0`

**JWKS Endpoint:** `https://login.microsoftonline.com/TENANT_ID/discovery/v2.0/keys`

## Test Cases Explained

### JWKS Discovery Structure Tests

#### `PHASE5_JWKS_DISCOVERY_INDICATORS`
- **What:** Token with both kid and iss present
- **Why:** Both are required for successful JWKS discovery
- **Expected:** kid and iss should be accessible via the tool

#### `PHASE5_MISSING_KID_HEADER`
- **What:** Token with iss but no kid header
- **Why:** kid is needed to identify which key in JWKS to use
- **Expected:** Warning that kid is missing; JWKS might fail without it

#### `PHASE5_MISSING_ISS_CLAIM`
- **What:** Token with kid but no iss claim
- **Why:** iss is needed to build the JWKS URL
- **Expected:** Warning that iss is missing; JWKS URL cannot be constructed

#### `PHASE5_HTTP_ISS_INSECURE`
- **What:** Token with HTTP issuer (not HTTPS)
- **Why:** JWKS endpoints must be secured with HTTPS
- **Expected:** Rejection; tool should not fetch from HTTP JWKS endpoints

### Real-World Token Structure Tests

#### `PHASE5_AUTH0_ID_TOKEN_STRUCTURE`
- **Format:** Auth0 ID token (OIDC-compliant)
- **Key Claims:** email, email_verified, name, picture, sub, aud
- **Expected Issuer:** `https://example.auth0.com/`
- **Expected kid:** Standard UUID format (example: `F80A4325D66C4F42973909C9FC5A9A7`)

#### `PHASE5_FIREBASE_ID_TOKEN_STRUCTURE`
- **Format:** Firebase ID token
- **Key Claims:** firebase (custom object), user_id, auth_time, email
- **Expected Issuer:** `https://securetoken.google.com/PROJECT_ID`
- **Expected kid:** Firebase key identifier

#### `PHASE5_OKTA_ID_TOKEN_STRUCTURE`
- **Format:** Okta ID token
- **Key Claims:** jti (JWT ID), amr (Auth Methods Reference), atx (Auth Transaction context)
- **Expected Issuer:** `https://YOUR_DOMAIN.okta.com`
- **Expected kid:** Okta key identifier (example: `KEY_1234`)

#### `PHASE5_AZURE_AD_ID_TOKEN_STRUCTURE`
- **Format:** Microsoft Azure AD ID token
- **Key Claims:** oid (Object ID), tid (Tenant ID), roles, preferred_username
- **Expected Issuer:** `https://login.microsoftonline.com/TENANT_ID/v2.0`
- **Expected kid:** Microsoft key identifier

## What Gets Validated

### Header Validation
- ✓ Algorithm (alg) is RS256, RS384, or RS512
- ✓ Key ID (kid) is present and formatted correctly
- ✓ Type (typ) is "JWT"

### Payload Validation
- ✓ Issuer (iss) is present and a valid HTTPS URL
- ✓ Subject (sub) identifies the token user
- ✓ Audience (aud) matches expected application
- ✓ Expiration (exp) indicates token validity
- ✓ Issued At (iat) indicates token creation time
- ✓ Standard OIDC claims are correctly typed

### JWKS Discovery Process
1. **Extract iss from payload** → Build JWKS URL: `{iss}/.well-known/jwks.json`
2. **Fetch JWKS** → Via `/api/fetch-jwks` proxy (CORS-safe)
3. **Find key by kid** → Locate the public key matching the token's kid
4. **Convert JWK to PEM** → Transform JSON Web Key to PEM format
5. **Verify signature** → Use Node.js crypto to verify RS256 signature
6. **Return result** → Display verification status with details

### Error Handling
- ✓ Missing kid → Warning; cannot identify the correct key
- ✓ Missing iss → Error; cannot construct JWKS URL
- ✓ Invalid iss format → Error; JWKS URL construction fails
- ✓ HTTP issuer → Rejection; must use HTTPS for security
- ✓ JWKS endpoint unreachable → Error with clear message
- ✓ Key not found in JWKS → Error; kid might be wrong or key rotated
- ✓ JWK conversion fails → Error; invalid JWK format
- ✓ Signature verification fails → Clear indication of tampering

## Expected Test Results

### Structured Tests (lib/phase5TestPack.js)
- **10 test cases** covering JWKS discovery scenarios
- **4 real-world token structures** (Auth0, Firebase, Okta, Azure AD)
- **Pass rate:** Should be 100% for structure validation
- **Expected output:** Detailed token analysis without network calls

### Real JWKS Tests (with testRealJwksEndpoints)
- **Variable pass rate** depending on endpoint accessibility
- **Key counts** showing key rotation
- **Algorithm support** (typically RS256, RS384, RS512 for major providers)

### Live Token Verification
- **Success:** Green checkmark with "Signature verified"
- **Failure:** Clear indication with reason (key not found, tampered, expired, etc.)

## Running Tests Programmatically

### In a Next.js API Route

Create a file `/pages/api/jwt-phase5-test.js`:

```javascript
import { runPhase5Tests } from '../../lib/phase5TestRunner'

export default async function handler(req, res) {
  try {
    const results = await runPhase5Tests({
      skipRealJwksFetch: true
    })
    res.status(200).json(results)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

Then visit: `http://localhost:3000/api/jwt-phase5-test`

### In a React Component

```javascript
import { useState, useEffect } from 'react'
import { runPhase5Tests } from '../lib/phase5TestRunner'

export function Phase5TestRunner() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      const res = await runPhase5Tests({ skipRealJwksFetch: true })
      setResults(res)
      setLoading(false)
    }
    runTests()
  }, [])

  if (loading) return <div>Running tests...</div>

  return (
    <div>
      <h2>Phase 5 Results: {results.summary.passRate}% passed</h2>
      {results.results.map(test => (
        <div key={test.id}>
          <h3>{test.id} {test.passed ? '✅' : '❌'}</h3>
          <pre>{JSON.stringify(test, null, 2)}</pre>
        </div>
      ))}
    </div>
  )
}
```

## Troubleshooting

### JWKS Fetch Fails with "Issuer domain not found"
- **Cause:** The iss URL doesn't exist or DNS resolution failed
- **Solution:** Verify the issuer URL is correct and publicly accessible

### "Key not found with kid: xxx"
- **Cause:** The key ID doesn't match any key in the JWKS
- **Solution:** The token might be from a different issuer, or the key may have been rotated

### "Failed to convert JWK to PEM"
- **Cause:** The JWK structure is invalid or missing required fields (n, e)
- **Solution:** Ensure JWKS endpoint returns valid JWKs with modulus and exponent

### "Signature verification failed"
- **Cause:** Token was tampered with or wrong key was used
- **Solution:** Check that the correct JWKS was fetched and kid matches the header

### Network Timeout
- **Cause:** JWKS endpoint is slow or unresponsive
- **Solution:** Check endpoint availability; Phase 5 has a 5-second timeout

## Next Steps

1. **Run structured tests** to validate JWKS discovery logic
2. **Test with real identity providers** using the guide above
3. **Integrate into production** once validation is complete
4. **Monitor JWKS caching** to ensure optimal performance
5. **Plan Phase 6** for additional algorithms (ES256, EdDSA) or extra features

## Summary

Phase 5 transforms the JWT Decoder from a static analysis tool into a dynamic validator capable of:
- Automatically discovering public keys via JWKS
- Verifying RSA signatures against real identity provider keys
- Supporting all major OIDC/OAuth2 identity providers
- Providing clear, actionable error messages for debugging

This guide ensures comprehensive testing before production deployment.
