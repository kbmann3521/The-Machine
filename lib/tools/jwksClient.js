// JWKS Client - Handles fetching, caching, and converting JWKs to PEM format
// Supports RS256, RS384, RS512 signature verification

const JWKS_CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const jwksCache = new Map()

/**
 * Build JWKS URL from issuer
 * @param {string} iss - Issuer URL (e.g., "https://example.com" or "https://example.com/")
 * @returns {string|null} - Full JWKS URL or null if invalid
 */
export function buildJwksUrl(iss) {
  if (!iss || typeof iss !== 'string') return null

  try {
    const url = new URL(iss)
    if (url.protocol !== 'https:') return null

    const base = iss.endsWith('/') ? iss.slice(0, -1) : iss
    return `${base}/.well-known/jwks.json`
  } catch {
    return null
  }
}

/**
 * Fetch JWKS from issuer (with server-side proxy)
 * Uses the /api/fetch-jwks endpoint to avoid CORS issues
 * @param {string} jwksUrl - Full JWKS URL
 * @returns {Promise<Object|null>} - JWKS object with keys array, or null if fetch fails
 */
export async function fetchJwks(jwksUrl) {
  if (!jwksUrl) return null

  // Check cache first
  const cached = jwksCache.get(jwksUrl)
  if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL) {
    return cached.data
  }

  try {
    // Use server-side proxy to avoid CORS
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
    const jwksUrl_api = `${baseUrl}/api/fetch-jwks?url=${encodeURIComponent(jwksUrl)}`

    const response = await fetch(jwksUrl_api, {
      credentials: 'same-origin',
    })
    if (!response.ok) {
      console.error(`[JWKS] Fetch failed: ${response.status} ${response.statusText}`)
      return null
    }

    const jwks = await response.json()

    // Cache the result
    jwksCache.set(jwksUrl, {
      data: jwks,
      fetchedAt: Date.now(),
    })

    return jwks
  } catch (error) {
    console.error(`[JWKS] Fetch error: ${error.message}`)
    return null
  }
}

/**
 * Find a specific key in JWKS by kid
 * @param {Object} jwks - JWKS object with keys array
 * @param {string} kid - Key ID to find
 * @returns {Object|null} - JWK or null if not found
 */
export function findKeyByKid(jwks, kid) {
  if (!jwks || !jwks.keys || !Array.isArray(jwks.keys)) return null
  if (!kid) return null

  return jwks.keys.find(key => key.kid === kid) || null
}

/**
 * Convert JWK (RSA) to PEM format
 * Handles RSA public keys (kty: "RSA")
 * @param {Object} jwk - JWK object with n (modulus) and e (exponent)
 * @returns {string|null} - PEM-formatted public key or null if invalid
 */
export function jwkToPem(jwk) {
  if (!jwk || jwk.kty !== 'RSA') return null
  if (!jwk.n || !jwk.e) return null

  try {
    // Decode base64url to Buffer
    const n = base64urlToBuffer(jwk.n)
    const e = base64urlToBuffer(jwk.e)

    if (!n || !e) return null

    // Build DER-encoded RSA public key
    const der = buildRsaPublicKeyDer(n, e)
    if (!der) return null

    // Convert to base64 and wrap in PEM
    const base64Der = der.toString('base64')
    const pem = formatPem(base64Der)

    return pem
  } catch (error) {
    console.error(`[JWK] Conversion error: ${error.message}`)
    return null
  }
}

/**
 * Convert base64url string to Buffer
 * @param {string} str - Base64url encoded string
 * @returns {Buffer|null}
 */
function base64urlToBuffer(str) {
  try {
    // Add padding if needed
    let padded = str
    const remainder = str.length % 4
    if (remainder) {
      padded = str + '='.repeat(4 - remainder)
    }

    // Replace base64url characters
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')

    return Buffer.from(base64, 'base64')
  } catch {
    return null
  }
}

/**
 * Build DER-encoded RSA public key
 * Constructs a SEQUENCE containing INTEGER modulus and INTEGER exponent
 * @param {Buffer} n - Modulus
 * @param {Buffer} e - Exponent
 * @returns {Buffer|null}
 */
function buildRsaPublicKeyDer(n, e) {
  try {
    // Encode n as INTEGER
    const nDer = encodeInteger(n)
    // Encode e as INTEGER
    const eDer = encodeInteger(e)

    // Wrap both in SEQUENCE
    const innerSequence = Buffer.concat([nDer, eDer])

    // Add SEQUENCE tag and length
    const rsaSequence = Buffer.concat([
      Buffer.from([0x30]), // SEQUENCE tag
      encodeLength(innerSequence.length),
      innerSequence,
    ])

    // Build BIT STRING wrapping the RSA key (for PKCS#1 RSAPublicKey)
    // Then wrap in another SEQUENCE with algorithm identifier
    // This creates the standard SubjectPublicKeyInfo structure

    // Algorithm identifier for RSA: 1.2.840.113549.1.1.1 (rsaEncryption)
    const algorithmId = Buffer.from([
      0x30, 0x0d, // SEQUENCE (13 bytes)
      0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, // OID 1.2.840.113549.1.1.1
      0x05, 0x00, // NULL
    ])

    // BIT STRING containing the RSA public key
    const bitString = Buffer.concat([
      Buffer.from([0x03]), // BIT STRING tag
      encodeLength(rsaSequence.length + 1),
      Buffer.from([0x00]), // No unused bits
      rsaSequence,
    ])

    // Final SubjectPublicKeyInfo SEQUENCE
    const subjectPublicKeyInfo = Buffer.concat([algorithmId, bitString])

    const finalSequence = Buffer.concat([
      Buffer.from([0x30]), // SEQUENCE tag
      encodeLength(subjectPublicKeyInfo.length),
      subjectPublicKeyInfo,
    ])

    return finalSequence
  } catch (error) {
    console.error(`[DER] Build error: ${error.message}`)
    return null
  }
}

/**
 * Encode an integer in DER format
 * @param {Buffer} buffer
 * @returns {Buffer}
 */
function encodeInteger(buffer) {
  let bytes = buffer

  // Add leading zero if high bit is set (to indicate positive number)
  if (bytes[0] & 0x80) {
    bytes = Buffer.concat([Buffer.from([0x00]), bytes])
  }

  return Buffer.concat([
    Buffer.from([0x02]), // INTEGER tag
    encodeLength(bytes.length),
    bytes,
  ])
}

/**
 * Encode length in DER format
 * @param {number} length
 * @returns {Buffer}
 */
function encodeLength(length) {
  if (length < 128) {
    return Buffer.from([length])
  }

  const lengthBytes = []
  let n = length

  while (n > 0) {
    lengthBytes.unshift(n & 0xff)
    n >>= 8
  }

  return Buffer.concat([
    Buffer.from([0x80 | lengthBytes.length]),
    Buffer.from(lengthBytes),
  ])
}

/**
 * Format DER-encoded key as PEM
 * @param {string} base64Der - Base64-encoded DER
 * @returns {string}
 */
function formatPem(base64Der) {
  const lines = []
  lines.push('-----BEGIN PUBLIC KEY-----')

  // Split into 64-character lines
  for (let i = 0; i < base64Der.length; i += 64) {
    lines.push(base64Der.substring(i, i + 64))
  }

  lines.push('-----END PUBLIC KEY-----')
  return lines.join('\n')
}

/**
 * Verify RSA signature using PEM public key
 * Supports RS256, RS384, RS512
 * @param {string} algorithm - RS256, RS384, or RS512
 * @param {string} rawHeader - Raw header segment
 * @param {string} rawPayload - Raw payload segment
 * @param {string} signatureB64Url - Base64url-encoded signature
 * @param {string} pemPublicKey - PEM-formatted public key
 * @returns {Object} - { verified: boolean, reason: string }
 */
export function verifyRSASignatureNode(algorithm, rawHeader, rawPayload, signatureB64Url, pemPublicKey) {
  try {
    const crypto = require('crypto')

    if (!pemPublicKey || !pemPublicKey.includes('BEGIN PUBLIC KEY')) {
      return {
        verified: false,
        reason: 'Invalid PEM format',
      }
    }

    // Map algorithm to hash
    const hashMap = {
      RS256: 'sha256',
      RS384: 'sha384',
      RS512: 'sha512',
    }

    const hash = hashMap[algorithm]
    if (!hash) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Create message to verify
    const message = `${rawHeader}.${rawPayload}`

    // Convert signature from base64url to Buffer
    const signatureBuffer = base64urlToBuffer(signatureB64Url)
    if (!signatureBuffer) {
      return {
        verified: false,
        reason: 'Invalid signature format',
      }
    }

    // Verify signature
    const verifier = crypto.createVerify(`RSA-SHA${hash === 'sha256' ? 256 : hash === 'sha384' ? 384 : 512}`)
    verifier.update(message)
    const verified = verifier.verify(pemPublicKey, signatureBuffer)

    return {
      verified,
      reason: verified
        ? `${algorithm} signature verified`
        : 'Signature verification failed',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

/**
 * Clear JWKS cache (mainly for testing)
 */
export function clearJwksCache() {
  jwksCache.clear()
}
