const crypto = require('crypto')

// Helper to encode base64url
function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Generate ES512 keypair
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp521r1',
})

const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' })
const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' })

// Create ES512 token
const header = { alg: 'ES512', typ: 'JWT' }
const payload = {
  sub: '1234567890',
  name: 'John Doe',
  admin: true,
  iat: 1516239022,
}

const headerB64 = toBase64Url(Buffer.from(JSON.stringify(header)))
const payloadB64 = toBase64Url(Buffer.from(JSON.stringify(payload)))
const message = `${headerB64}.${payloadB64}`

const signer = crypto.createSign('sha512')
signer.update(message)
signer.end()

const signature = signer.sign(privateKeyPem)
const signatureB64 = toBase64Url(signature)
const token = `${message}.${signatureB64}`

console.log(`ES512 Token:`)
console.log(token)
console.log(`\nPublic Key:`)
console.log(publicKeyPem)
console.log(`\nFor JWT_TEST_PACK:`)
console.log(`token: '${token}',`)
console.log(`publicKey: \`${publicKeyPem}\`,`)
