import { jwtDecoder } from './lib/tools/jwtDecoder.js'
import { JWT_TEST_PACK } from './lib/jwtTestPack.js'

const es256Test = JWT_TEST_PACK.tests.find(t => t.id === 'ES256_VALID')

console.log('Testing ES256_VALID with jwtDecoder (server-side):')
console.log(`Token: ${es256Test.token.substring(0, 80)}...`)
console.log(`\nPublicKey:\n${es256Test.publicKey}`)

const result = jwtDecoder(es256Test.token, { publicKey: es256Test.publicKey })

console.log(`\nDecoded: ${result.decoded}`)
console.log(`Algorithm: ${result.signatureVerification.algorithm}`)
console.log(`Verified: ${result.signatureVerification.verified}`)
console.log(`Reason: ${result.signatureVerification.reason}`)

if (!result.signatureVerification.verified) {
  console.log('\n⚠️ Signature verification FAILED')
  console.log('Checking token structure...')
  
  const parts = es256Test.token.split('.')
  console.log(`Header part length: ${parts[0].length}`)
  console.log(`Payload part length: ${parts[1].length}`)
  console.log(`Signature part length: ${parts[2].length}`)
  
  // Decode to see what's in them
  const headerDecoded = Buffer.from(parts[0].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
  const payloadDecoded = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
  
  console.log(`\nHeader: ${headerDecoded}`)
  console.log(`Payload: ${payloadDecoded}`)
  
  // Check signature format
  const sigBuffer = Buffer.from(parts[2].replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  console.log(`\nSignature buffer (first bytes): ${sigBuffer.toString('hex').substring(0, 20)}`)
  console.log(`Is DER format? ${sigBuffer[0] === 0x30 ? 'YES' : 'NO'}`)
}
