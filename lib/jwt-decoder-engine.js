// JWT Decoder Engine - Heavy crypto verification functions
// This module is lazy-loaded only when signature verification is needed
// Keeping it separate allows Builder preview to stay fast

export async function verifyHMACClientSide(algorithm, rawHeader, rawPayload, signatureB64Url, secret) {
  try {
    if (!secret) {
      return {
        verified: null,
        reason: 'Secret not provided — cannot verify signature',
      }
    }

    // Map HMAC algorithm to Web Crypto hash algorithm
    const hashMap = {
      HS256: 'SHA-256',
      HS384: 'SHA-384',
      HS512: 'SHA-512',
    }

    const hashAlg = hashMap[algorithm]
    if (!hashAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Use exact original segments - already trimmed by parser
    const encoder = new TextEncoder()
    const message = `${rawHeader}.${rawPayload}`
    const data = encoder.encode(message)
    const secretData = encoder.encode(secret)

    const key = await crypto.subtle.importKey(
      'raw',
      secretData,
      { name: 'HMAC', hash: hashAlg },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, data)
    const signatureArray = new Uint8Array(signature)

    // Convert to base64url
    let binaryString = ''
    for (let i = 0; i < signatureArray.byteLength; i++) {
      binaryString += String.fromCharCode(signatureArray[i])
    }
    const base64 = btoa(binaryString)
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const verified = base64url === signatureB64Url

    console.log(`[JWT Debug] Client-side ${algorithm} Verification:`, {
      headerLen: rawHeader.length,
      payloadLen: rawPayload.length,
      signatureLen: signatureB64Url.length,
      messageLen: message.length,
      expectedSig: base64url,
      providedSig: signatureB64Url,
      match: verified,
    })

    return {
      verified,
      reason: verified
        ? `Recomputed ${algorithm} (${hashAlg}) HMAC matches token signature`
        : 'Signature does not match. The secret is incorrect or token has been tampered with.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

// Helper function to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
  const binaryString = atob(
    pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
  )
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Helper function to convert base64url to Uint8Array
function base64urlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

export async function verifyRSAClientSide(algorithm, rawHeader, rawPayload, signatureB64Url, publicKeyPem) {
  try {
    if (!publicKeyPem) {
      return {
        verified: null,
        reason: 'Public key not provided — cannot verify signature',
      }
    }

    // Validate PEM format
    if (!publicKeyPem.includes('BEGIN PUBLIC KEY') || !publicKeyPem.includes('END PUBLIC KEY')) {
      return {
        verified: false,
        reason: 'Invalid PEM format. Public key must start with "-----BEGIN PUBLIC KEY-----" and end with "-----END PUBLIC KEY-----"',
      }
    }

    // Map RSA algorithm to Web Crypto hash algorithm
    const hashMap = {
      RS256: 'SHA-256',
      RS384: 'SHA-384',
      RS512: 'SHA-512',
    }

    const hashAlg = hashMap[algorithm]
    if (!hashAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Convert PEM to ArrayBuffer
    const publicKeyBuffer = pemToArrayBuffer(publicKeyPem)

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: hashAlg,
      },
      false,
      ['verify']
    )

    // Convert signature from base64url to bytes
    const signatureBytes = base64urlToUint8Array(signatureB64Url)

    // Create the message that was signed
    const encoder = new TextEncoder()
    const message = encoder.encode(`${rawHeader}.${rawPayload}`)

    // Verify the signature
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      message
    )

    console.log(`[JWT Debug] Client-side ${algorithm} Verification:`, {
      verified,
      headerLen: rawHeader.length,
      payloadLen: rawPayload.length,
      signatureLen: signatureB64Url.length,
    })

    return {
      verified,
      reason: verified
        ? `${algorithm} (${hashAlg}) signature matches token contents`
        : 'Signature does not match. The public key does not match the private key used to sign.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}. Ensure the public key is valid.`,
    }
  }
}

export async function verifyECClientSide(algorithm, rawHeader, rawPayload, signatureB64Url, publicKeyPem) {
  try {
    if (!publicKeyPem) {
      return {
        verified: null,
        reason: 'Public key not provided — cannot verify signature',
      }
    }

    // Validate PEM format
    if (!publicKeyPem.includes('BEGIN PUBLIC KEY') || !publicKeyPem.includes('END PUBLIC KEY')) {
      return {
        verified: false,
        reason: 'Invalid PEM format. Public key must start with "-----BEGIN PUBLIC KEY-----" and end with "-----END PUBLIC KEY-----"',
      }
    }

    // Map EC algorithm to Web Crypto hash algorithm and curve name
    const hashMap = {
      ES256: { hash: 'SHA-256', namedCurve: 'P-256' },
      ES384: { hash: 'SHA-384', namedCurve: 'P-384' },
      ES512: { hash: 'SHA-512', namedCurve: 'P-521' },
    }

    const algConfig = hashMap[algorithm]
    if (!algConfig) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Convert PEM to ArrayBuffer
    const publicKeyBuffer = pemToArrayBuffer(publicKeyPem)

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'ECDSA',
        namedCurve: algConfig.namedCurve,
      },
      false,
      ['verify']
    )

    // Convert signature from base64url to bytes
    const signatureBytes = base64urlToUint8Array(signatureB64Url)

    // Create the message that was signed
    const encoder = new TextEncoder()
    const message = encoder.encode(`${rawHeader}.${rawPayload}`)

    // Verify the signature
    const verified = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: algConfig.hash,
      },
      publicKey,
      signatureBytes,
      message
    )

    console.log(`[JWT Debug] Client-side ${algorithm} Verification:`, {
      verified,
      headerLen: rawHeader.length,
      payloadLen: rawPayload.length,
      signatureLen: signatureB64Url.length,
    })

    return {
      verified,
      reason: verified
        ? `${algorithm} (${algConfig.hash} with ${algConfig.namedCurve} curve) signature matches token contents`
        : 'Signature does not match. The public key does not match the private key used to sign.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}. Ensure the public key is valid.`,
    }
  }
}
