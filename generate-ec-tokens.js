const crypto = require('crypto')

// Helper to encode base64url
function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}


// Generate EC keypairs for testing
const curves = [
  { name: 'prime256v1', alg: 'ES256', hashName: 'sha256' },
  { name: 'secp384r1', alg: 'ES384', hashName: 'sha384' },
  { name: 'secp521r1', alg: 'ES512', hashName: 'sha512' },
]

const tokens = {}

curves.forEach(({ name, alg, hashName }) => {
  // Generate keypair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: name,
  })

  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' })
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' })

  // Create test token
  const header = { alg, typ: 'JWT' }
  const payload = {
    sub: '1234567890',
    name: 'John Doe',
    admin: true,
    iat: 1516239022,
  }

  const headerB64 = toBase64Url(Buffer.from(JSON.stringify(header)))
  const payloadB64 = toBase64Url(Buffer.from(JSON.stringify(payload)))
  const message = `${headerB64}.${payloadB64}`

  const signer = crypto.createSign(hashName)
  signer.update(message)
  signer.end()

  const signature = signer.sign(privateKeyPem)
  const signatureB64 = toBase64Url(signature)
  const token = `${message}.${signatureB64}`

  tokens[alg] = {
    token,
    publicKey: publicKeyPem,
    privateKey: privateKeyPem,
  }

  console.log(`\n=== ${alg} Token ===`)
  console.log(`Token: ${token}`)
  console.log(`\nPublic Key:\n${publicKeyPem}`)
})

console.log('\n\n=== TEST DATA FOR JWT_TEST_PACK ===')
console.log(`
    {
      id: 'ES256_VALID',
      description: 'ES256 token with valid ECDSA signature using P-256 curve.',
      algorithm: 'ES256',
      token: '${tokens.ES256.token}',
      publicKey: \`${tokens.ES256.publicKey}\`,
      expected: {
        signatureVerification: {
          algorithm: 'ES256',
          verified: true,
          reasonIncludes: 'ES256 (SHA-256 with P-256 curve) signature matches'
        }
      }
    },

    {
      id: 'ES256_NO_PUBLIC_KEY',
      description: 'ES256 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'ES256',
      token: '${tokens.ES256.token}',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'ES256',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'ES384_VALID',
      description: 'ES384 token with valid ECDSA signature using P-384 curve.',
      algorithm: 'ES384',
      token: '${tokens.ES384.token}',
      publicKey: \`${tokens.ES384.publicKey}\`,
      expected: {
        signatureVerification: {
          algorithm: 'ES384',
          verified: true,
          reasonIncludes: 'ES384 (SHA-384 with P-384 curve) signature matches'
        }
      }
    },

    {
      id: 'ES384_NO_PUBLIC_KEY',
      description: 'ES384 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'ES384',
      token: '${tokens.ES384.token}',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'ES384',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },

    {
      id: 'ES512_VALID',
      description: 'ES512 token with valid ECDSA signature using P-521 curve.',
      algorithm: 'ES512',
      token: '${tokens.ES512.token}',
      publicKey: \`${tokens.ES512.publicKey}\`,
      expected: {
        signatureVerification: {
          algorithm: 'ES512',
          verified: true,
          reasonIncludes: 'ES512 (SHA-512 with P-521 curve) signature matches'
        }
      }
    },

    {
      id: 'ES512_NO_PUBLIC_KEY',
      description: 'ES512 token but public key omitted/empty – tool should report "cannot verify".',
      algorithm: 'ES512',
      token: '${tokens.ES512.token}',
      publicKey: '',
      expected: {
        signatureVerification: {
          algorithm: 'ES512',
          verified: null,
          reasonIncludes: 'Public key not provided — cannot verify signature'
        }
      }
    },
`)
