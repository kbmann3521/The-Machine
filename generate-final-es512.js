import crypto from 'crypto'
import fs from 'fs'

function toBase64Url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// Generate fresh ES512 keypair
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp521r1',
})

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

const signature = signer.sign(privateKey)
const signatureB64 = toBase64Url(signature)
const token = `${message}.${signatureB64}`

// Write to file
const output = `TOKEN: ${token}\n\nKEY:\n${publicKeyPem}\n\nFOR PACK:\ntoken: '${token}',\npublicKey: \`${publicKeyPem}\`,`

fs.writeFileSync('es512-final.txt', output)
console.log('✅ ES512 token and key written to es512-final.txt')
console.log(`Token length: ${token.length}`)
console.log(`Key length: ${publicKeyPem.length}`)
