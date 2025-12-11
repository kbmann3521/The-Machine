const crypto = require('crypto');

// Helper function to convert bytes to base64url
function bytesToBase64Url(bytes) {
  const base64 = Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper function to convert base64url to bytes
function base64UrlToBytes(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  const remainder = base64.length % 4;
  if (remainder) {
    base64 += '='.repeat(4 - remainder);
  }
  return Buffer.from(base64, 'base64');
}

// Generate a random 256-bit AES key
const keyBytes = crypto.randomBytes(32);
const keyBase64Url = bytesToBase64Url(keyBytes);

console.log('=== JWE Test Token Generator (Phase 7B) ===\n');
console.log('256-bit AES Key (base64url):');
console.log(keyBase64Url);
console.log('');

// Create protected header
const header = {
  alg: 'dir',
  enc: 'A256GCM',
  typ: 'JWT'
};

const headerJson = JSON.stringify(header);
const headerBytes = Buffer.from(headerJson, 'utf-8');
const headerB64Url = bytesToBase64Url(headerBytes);

console.log('Protected Header (decoded):');
console.log(JSON.stringify(header, null, 2));
console.log('');

// Create payload
const payload = {
  sub: '1234567890',
  name: 'John Doe',
  email: 'john.doe@example.com',
  admin: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600
};

const payloadJson = JSON.stringify(payload);
const payloadBytes = Buffer.from(payloadJson, 'utf-8');

console.log('Payload (plaintext):');
console.log(JSON.stringify(payload, null, 2));
console.log('');

// Generate random IV (96 bits for GCM)
const iv = crypto.randomBytes(12);
const ivB64Url = bytesToBase64Url(iv);

// AAD (Additional Authenticated Data) must include the protected header
// In JWE spec, AAD is the ASCII bytes of the protected header (the base64url string)
const aad = Buffer.from(headerB64Url, 'utf-8');

// Create cipher
const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes, iv);

// Set AAD before encryption
cipher.setAAD(aad);

// Encrypt payload
const ciphertext = Buffer.concat([
  cipher.update(payloadBytes),
  cipher.final()
]);

const tag = cipher.getAuthTag();
const ciphertextB64Url = bytesToBase64Url(ciphertext);
const tagB64Url = bytesToBase64Url(tag);

// For dir algorithm, encryptedKey is empty
const encryptedKeyB64Url = '';

// Build JWE compact serialization
const jwe = `${headerB64Url}.${encryptedKeyB64Url}.${ivB64Url}.${ciphertextB64Url}.${tagB64Url}`;

console.log('JWE Token (5 parts):');
console.log(jwe);
console.log('');

console.log('=== Test Instructions ===');
console.log('1. Copy the JWE token above and paste it into the JWT Decoder');
console.log('2. The tool should detect it as a JWE (5 parts)');
console.log('3. Copy the AES Key (base64url) and paste it in the "Decryption Key" input');
console.log('4. The tool should decrypt successfully and show the payload');
console.log('');

console.log('=== Test Token Parts ===');
console.log(`Protected Header (base64url): ${headerB64Url.substring(0, 50)}...`);
console.log(`Encrypted Key (empty for dir): ${encryptedKeyB64Url || '(empty)'}`);
console.log(`IV (base64url): ${ivB64Url}`);
console.log(`Ciphertext (base64url): ${ciphertextB64Url.substring(0, 50)}...`);
console.log(`Auth Tag (base64url): ${tagB64Url}`);
console.log('');

// Verify decryption works
console.log('=== Verification (Decrypting locally) ===');
try {
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes, iv);
  decipher.setAuthTag(tag);
  
  const aad = Buffer.from(headerB64Url, 'utf-8');
  decipher.setAAD(aad);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  
  const decryptedPayload = JSON.parse(decrypted.toString('utf-8'));
  console.log('✅ Decryption successful!');
  console.log('Decrypted Payload:');
  console.log(JSON.stringify(decryptedPayload, null, 2));
} catch (err) {
  console.log('❌ Decryption failed:', err.message);
}
