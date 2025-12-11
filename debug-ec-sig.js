import crypto from 'crypto'
import { jwtDecoder } from './lib/tools/jwtDecoder.js'
import { JWT_TEST_PACK } from './lib/jwtTestPack.js'

const es256Test = JWT_TEST_PACK.tests.find(t => t.id === 'ES256_VALID')

console.log('Testing ES256_VALID token...')
console.log(`Token: ${es256Test.token}`)
console.log(`\nPublicKey:\n${es256Test.publicKey}`)

const result = jwtDecoder(es256Test.token, { publicKey: es256Test.publicKey })

console.log(`\nDecoded: ${result.decoded}`)
console.log(`Algorithm: ${result.signatureVerification.algorithm}`)
console.log(`Verified: ${result.signatureVerification.verified}`)
console.log(`Reason: ${result.signatureVerification.reason}`)

// Now test signature format manually
const parts = es256Test.token.split('.')
const sigB64Url = parts[2]

console.log(`\n\n=== Manual Signature Analysis ===`)
console.log(`Signature B64URL: ${sigB64Url}`)

function base64urlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (base64.length % 4)
  if (padding !== 4) {
    base64 += '='.repeat(padding)
  }
  return Buffer.from(base64, 'base64')
}

const sigBuffer = base64urlToBuffer(sigB64Url)
console.log(`Signature Buffer length: ${sigBuffer.length} bytes`)
console.log(`Signature hex: ${sigBuffer.toString('hex')}`)
console.log(`Signature as DER? ${sigBuffer[0] === 0x30 ? 'YES (0x30 = SEQUENCE)' : 'NO'}`)

if (sigBuffer[0] === 0x30) {
  console.log(`This is already DER-encoded ECDSA signature`)
} else {
  console.log(`This is raw ECDSA signature (r||s format)`)
  console.log(`Expected for ES256: 64 bytes (32+32), got: ${sigBuffer.length}`)
}
