// Client-side JWT Decoder - No server required
// All decoding and analysis happens in the browser
// Signature verification uses Web Crypto API (client-side)

// Browser-compatible base64url decoder (no Buffer needed)
function decodeBase64Url(str) {
  try {
    // Add padding if needed
    let padded = str
    const remainder = str.length % 4
    if (remainder) {
      padded = str + '='.repeat(4 - remainder)
    }

    // Decode base64url to base64 (replace - and _ with + and /)
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/')

    // Use atob for browser, Buffer for Node.js (if needed)
    let decoded
    if (typeof window !== 'undefined' && typeof atob !== 'undefined') {
      // Browser environment
      decoded = atob(base64)
    } else if (typeof Buffer !== 'undefined') {
      // Node.js environment
      decoded = Buffer.from(base64, 'base64').toString('utf-8')
    } else {
      return { success: false, error: 'Unable to decode - neither browser nor Node.js environment detected' }
    }

    return { success: true, value: decoded }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function parseJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString)
    return { success: true, value: parsed, error: null }
  } catch (error) {
    const match = error.message.match(/position (\d+)/)
    const position = match ? parseInt(match[1]) : null
    const context = position ? jsonString.substring(Math.max(0, position - 20), Math.min(jsonString.length, position + 20)) : null

    return {
      success: false,
      value: null,
      error: `Invalid JSON: ${error.message}${context ? ` near: "${context}"` : ''}`,
    }
  }
}

function detectDuplicateKeys(jsonString) {
  const keys = []
  const duplicates = []
  let inString = false
  let escapeNext = false
  let currentKey = ''
  let inKey = false

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i]

    if (escapeNext) {
      escapeNext = false
      continue
    }

    if (char === '\\') {
      escapeNext = true
      continue
    }

    if (char === '"' && (i === 0 || jsonString[i - 1] !== '\\')) {
      if (!inString) {
        inString = true
        currentKey = ''
        inKey = true
      } else {
        inString = false
        if (inKey) {
          if (keys.includes(currentKey)) {
            duplicates.push(currentKey)
          } else {
            keys.push(currentKey)
          }
          inKey = false
        }
      }
    } else if (inString && inKey) {
      currentKey += char
    }
  }

  return duplicates
}

function interpretTimestamp(seconds) {
  if (typeof seconds !== 'number' || seconds < 0) return null

  const date = new Date(seconds * 1000)
  const now = Date.now()
  const msElapsed = now - date.getTime()

  let status = 'active'
  let timeStr = ''

  if (msElapsed < 0) {
    status = 'future'
    const msUntil = Math.abs(msElapsed)
    const minutesUntil = Math.floor(msUntil / 60000)
    const hoursUntil = Math.floor(msUntil / 3600000)
    const daysUntil = Math.floor(msUntil / 86400000)

    if (daysUntil > 0) {
      timeStr = `in ${daysUntil} day${daysUntil > 1 ? 's' : ''}`
    } else if (hoursUntil > 0) {
      timeStr = `in ${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}`
    } else if (minutesUntil > 0) {
      timeStr = `in ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`
    } else {
      timeStr = 'in a few seconds'
    }
  } else {
    status = 'expired'
    const minutesAgo = Math.floor(msElapsed / 60000)
    const hoursAgo = Math.floor(msElapsed / 3600000)
    const daysAgo = Math.floor(msElapsed / 86400000)

    if (daysAgo > 0) {
      timeStr = `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`
    } else if (hoursAgo > 0) {
      timeStr = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`
    } else if (minutesAgo > 0) {
      timeStr = `${minutesAgo} minute${minutesAgo > 1 ? 's' : ''} ago`
    } else {
      timeStr = 'a few seconds ago'
    }
  }

  return {
    timestamp: seconds,
    utc: date.toUTCString(),
    local: date.toLocaleString(),
    status,
    relative: timeStr,
  }
}

function checkClaimPresence(payload) {
  const recommendedClaims = {
    iss: { name: 'Issuer', importance: 'high' },
    aud: { name: 'Audience', importance: 'high' },
    exp: { name: 'Expiration', importance: 'high' },
    iat: { name: 'Issued At', importance: 'high' },
    nbf: { name: 'Not Before', importance: 'medium' },
    jti: { name: 'JWT ID', importance: 'medium' },
    sub: { name: 'Subject', importance: 'medium' },
  }

  const diagnostics = []
  const present = []

  for (const [claim, info] of Object.entries(recommendedClaims)) {
    if (claim in payload) {
      present.push(claim)
    } else {
      diagnostics.push({
        level: info.importance === 'high' ? 'warning' : 'info',
        claim,
        name: info.name,
        message: `Missing recommended claim: ${info.name}`,
      })
    }
  }

  return { present, diagnostics }
}

function lintClaims(payload) {
  const issues = []

  const timestampClaims = ['exp', 'iat', 'nbf']
  for (const claim of timestampClaims) {
    if (claim in payload) {
      const value = payload[claim]
      if (typeof value !== 'number') {
        issues.push({
          level: 'error',
          claim,
          message: `${claim} should be a number (UNIX timestamp), got ${typeof value}`,
        })
      }
    }
  }

  if ('exp' in payload && 'iat' in payload) {
    if (payload.exp < payload.iat) {
      issues.push({
        level: 'error',
        message: 'exp (expiration) is earlier than iat (issued at) - token is always invalid',
      })
    }
  }

  if ('nbf' in payload && 'exp' in payload) {
    if (payload.nbf > payload.exp) {
      issues.push({
        level: 'error',
        message: 'nbf (not before) is later than exp (expiration) - token is always invalid',
      })
    }
  }

  if ('iat' in payload) {
    const now = Date.now() / 1000
    if (payload.iat > now + 60) {
      issues.push({
        level: 'warning',
        claim: 'iat',
        message: 'iat (issued at) is in the future - token issued time is ahead of server time',
      })
    }
  }

  if ('exp' in payload) {
    const now = Date.now() / 1000
    if (payload.exp < now) {
      issues.push({
        level: 'warning',
        claim: 'exp',
        message: 'exp (expiration) is in the past - token is expired',
      })
    }
  }

  if ('sub' in payload) {
    const sub = payload.sub
    if (typeof sub !== 'string' || sub.length === 0) {
      issues.push({
        level: 'warning',
        claim: 'sub',
        message: 'sub (subject) should be a non-empty string - this identifies the token bearer',
      })
    }
  }

  if ('aud' in payload) {
    const aud = payload.aud
    if (typeof aud !== 'string' && !Array.isArray(aud)) {
      issues.push({
        level: 'warning',
        claim: 'aud',
        message: 'aud (audience) should be a string or array of strings - this identifies intended recipients',
      })
    }
  }

  return issues
}

function classifyTokenType(header, payload) {
  const warnings = []
  let type = 'Unknown'
  let confidence = 'low'
  const signals = []

  // OID4VCI (Verifiable Credentials)
  if (
    header.alg &&
    header.alg.startsWith('ES') &&
    payload.iss &&
    (payload.vc || payload.vp || payload.credentialSubject || payload.holder)
  ) {
    type = 'OID4VCI / Verifiable Credential'
    confidence = 'high'
    signals.push('ES256/384/512 algorithm')
    signals.push('vc or vp or credentialSubject or holder claim')
    return { type, confidence, signals, warnings }
  }

  // OpenID Connect ID Token
  if (
    header.alg &&
    (header.alg.startsWith('HS') || header.alg.startsWith('RS') || header.alg.startsWith('ES')) &&
    payload.iss &&
    payload.aud &&
    (payload.nonce || payload.auth_time || payload.acr || payload.amr)
  ) {
    type = 'OpenID Connect (OIDC) ID Token'
    confidence = 'high'
    signals.push('Standard JWT algorithm (HS256, RS256, ES256, etc.)')
    signals.push('iss, aud, nonce, auth_time, acr, or amr claims')
    return { type, confidence, signals, warnings }
  }

  // OAuth 2.0 Access Token
  if (
    payload.iss &&
    payload.aud &&
    payload.exp &&
    payload.iat &&
    !payload.nonce &&
    !payload.email_verified &&
    !payload.given_name
  ) {
    type = 'OAuth 2.0 Access Token'
    confidence = 'high'
    signals.push('iss, aud, exp, and iat claims')
    signals.push('No typical OIDC claims (email, profile info)')
    return { type, confidence, signals, warnings }
  }

  // API / Service Token
  if (payload.iss && payload.sub && !payload.aud && !payload.nonce) {
    type = 'Service / API Token'
    confidence = 'medium'
    signals.push('iss and sub claims present')
    signals.push('No audience (aud) specified - likely internal use')
    return { type, confidence, signals, warnings }
  }

  // Self-signed or Custom JWT
  if (payload.sub && payload.exp && !payload.iss) {
    type = 'Custom / Self-Signed JWT'
    confidence = 'medium'
    signals.push('sub and exp claims')
    signals.push('No issuer (iss) - may be self-signed or custom')
    return { type, confidence, signals, warnings }
  }

  if (header.alg === 'none') {
    type = 'Unsigned JWT'
    confidence = 'high'
    signals.push('alg: "none"')
    warnings.push({
      level: 'error',
      message: 'This JWT has no signature. This is a critical security vulnerability.',
    })
    return { type, confidence, signals, warnings }
  }

  type = 'Generic JWT'
  confidence = 'low'
  signals.push('Could not determine specific token type')

  return { type, confidence, signals, warnings }
}

function analyzeTTL(payload, tokenType) {
  if (!payload.exp || !payload.iat) {
    return {
      ttlSeconds: null,
      status: 'unknown',
      warning: null,
      notes: ['Expiration time not available'],
    }
  }

  const ttlSeconds = payload.exp - payload.iat
  const now = Date.now() / 1000
  const timeUntilExp = payload.exp - now

  let status = 'valid'
  let notes = []

  if (timeUntilExp < 0) {
    status = 'expired'
    notes.push(`Expired ${Math.floor(Math.abs(timeUntilExp))} seconds ago`)
  } else if (timeUntilExp < 60) {
    status = 'expiring-soon'
    notes.push(`Expires in ${Math.floor(timeUntilExp)} seconds`)
  } else if (timeUntilExp < 3600) {
    status = 'expiring-soon'
    notes.push(`Expires in ${Math.floor(timeUntilExp / 60)} minutes`)
  } else {
    notes.push(`Expires in ${Math.floor(timeUntilExp / 3600)} hours`)
  }

  const hours = ttlSeconds / 3600
  if (hours > 24) {
    notes.push(`Long TTL (${Math.floor(hours / 24)} days) - typical for refresh tokens`)
  } else if (hours < 5 * 60) {
    notes.push(`Short TTL (${Math.floor(hours)} hours) - typical for access tokens`)
  }

  let warning = null
  if (hours > 365 * 24) {
    warning = {
      level: 'warning',
      message: 'Extremely long token lifetime (>1 year). Consider shorter expiration.',
    }
  }

  return {
    ttlSeconds,
    status,
    warning,
    notes,
  }
}

function detectSensitiveData(payload) {
  const containsPII = false
  const containsSensitive = false
  const containsFreeText = false
  const warnings = []

  // Check for common sensitive fields
  const sensitivePatterns = {
    password: /password|passwd|pwd|secret|api_?key|token|auth/i,
    creditCard: /card|cc_?num|cardnumber/i,
    ssn: /ssn|social_?security/i,
    health: /health|medical|condition|drug|medicine/i,
  }

  for (const [key, value] of Object.entries(payload)) {
    if (sensitivePatterns.password.test(key)) {
      if (typeof value === 'string' && value.length > 0) {
        warnings.push({
          level: 'error',
          message: `Sensitive field found in payload: "${key}". Never store secrets, passwords, or API keys in JWTs.`,
        })
      }
    }
    if (sensitivePatterns.creditCard.test(key)) {
      warnings.push({
        level: 'error',
        message: `Credit card data detected: "${key}". PCI DSS prohibits storing card data in JWTs.`,
      })
    }
    if (sensitivePatterns.ssn.test(key)) {
      warnings.push({
        level: 'warning',
        message: `SSN or social security data detected: "${key}". This is PII and should not be in JWTs.`,
      })
    }

    // Detect free-text strings (likely unstructured data)
    if (typeof value === 'string' && value.length > 100 && !key.startsWith('_')) {
      if (!/^[a-z0-9\-_:./@]+$/i.test(value)) {
        // Contains spaces, punctuation, etc. - likely free text
      }
    }
  }

  // Check for email addresses (PII)
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  for (const [key, value] of Object.entries(payload)) {
    if (emailPattern.test(String(value))) {
      warnings.push({
        level: 'info',
        message: `Email address found in payload: "${key}". Be cautious with PII in tokens.`,
      })
    }
  }

  return {
    containsPII,
    containsSensitive,
    containsFreeText,
    warnings,
  }
}

function validateHeaderSecurity(header, tokenType) {
  const warnings = []

  // Check algorithm
  if (!header.alg) {
    warnings.push({
      level: 'error',
      message: 'Missing "alg" header - JWT algorithm must be specified',
    })
  } else if (header.alg === 'none') {
    warnings.push({
      level: 'error',
      message: '"alg": "none" is a critical security vulnerability. Always sign JWTs.',
    })
  } else if (header.alg === 'HS256' && tokenType.includes('OIDC')) {
    warnings.push({
      level: 'warning',
      message: 'HS256 with shared secret is not recommended for OIDC. Use RS256 or ES256 instead.',
    })
  }

  // Check for typ header (optional but recommended)
  if (!header.typ) {
    warnings.push({
      level: 'info',
      message: 'Missing "typ" header. Consider adding "typ": "JWT" for clarity.',
    })
  } else if (header.typ !== 'JWT' && header.typ !== 'application/at+jwt') {
    warnings.push({
      level: 'warning',
      message: `Non-standard "typ": "${header.typ}". Usually should be "JWT" or "application/at+jwt".`,
    })
  }

  // Check for kid (key ID) - useful for key rotation
  if (!header.kid && (header.alg?.startsWith('RS') || header.alg?.startsWith('ES'))) {
    warnings.push({
      level: 'info',
      message: 'Missing "kid" (key ID) header. Useful for identifying which key to use in rotation scenarios.',
    })
  }

  return warnings
}

// Main client-side JWT decoder function (supports both JWS and JWE)
export function jwtDecoderClient(text, options = {}) {
  const token = text.trim()

  // Parse JWT structure
  const parts = token.split('.').map(p => p.trim())

  // Detect if JWE (5 parts) or JWS (3 parts)
  let tokenKind = null
  if (parts.length === 5) {
    tokenKind = 'JWE'
  } else if (parts.length === 3) {
    tokenKind = 'JWS'
  } else {
    return {
      error: `Invalid JWT format. Expected 3 parts (JWS: header.payload.signature) or 5 parts (JWE: header.encryptedKey.iv.ciphertext.tag) separated by dots, got ${parts.length}.`,
      decoded: false,
      kind: null,
    }
  }

  // JWE (Encrypted JWT) handling
  if (tokenKind === 'JWE') {
    return parseJWE(parts, options)
  }

  // JWS (Signed JWT) handling continues below
  if (parts.length > 3) {
    return {
      error: `Invalid JWT format. Expected 3 parts (header.payload.signature) separated by dots, got ${parts.length}.`,
      decoded: false,
      kind: 'JWS',
    }
  }

  // Check for missing parts
  if (!parts[0] || !parts[1]) {
    const missingParts = []
    if (!parts[0]) missingParts.push('header')
    if (!parts[1]) missingParts.push('payload')
    return {
      error: `Invalid JWT: missing ${missingParts.join(', ')} part${missingParts.length > 1 ? 's' : ''}`,
      decoded: false,
      kind: 'JWS',
    }
  }

  // Validate base64url characters
  for (let i = 0; i < parts.length; i++) {
    const partName = i === 0 ? 'header' : i === 1 ? 'payload' : 'signature'
    if (!/^[A-Za-z0-9_-]*$/.test(parts[i])) {
      const invalidChars = parts[i].match(/[^A-Za-z0-9_-]/g) || []
      const uniqueChars = [...new Set(invalidChars)].join(', ')
      return {
        error: `Invalid JWT: ${partName} contains non-base64url characters (${uniqueChars}). Base64url allows: a-z, A-Z, 0-9, hyphen (-), underscore (_)`,
        decoded: false,
        kind: 'JWS',
      }
    }
  }

  // Decode header
  const headerDecoded = decodeBase64Url(parts[0])
  if (!headerDecoded.success) {
    return {
      error: `Failed to decode header: ${headerDecoded.error}. Check that the header is valid base64url.`,
      decoded: false,
    }
  }

  // Decode payload
  const payloadDecoded = decodeBase64Url(parts[1])
  if (!payloadDecoded.success) {
    return {
      error: `Failed to decode payload: ${payloadDecoded.error}. Check that the payload is valid base64url.`,
      decoded: false,
    }
  }

  // Parse header JSON
  const headerParsed = parseJSON(headerDecoded.value)
  if (!headerParsed.success) {
    return {
      error: `Invalid JSON in header: ${headerParsed.error}`,
      decoded: false,
      raw: {
        header: headerDecoded.value,
      },
    }
  }

  // Parse payload JSON
  const payloadParsed = parseJSON(payloadDecoded.value)
  if (!payloadParsed.success) {
    return {
      error: `Invalid JSON in payload: ${payloadParsed.error}`,
      decoded: false,
      raw: {
        payload: payloadDecoded.value,
      },
    }
  }

  // Detect duplicate keys
  const headerDuplicates = detectDuplicateKeys(headerDecoded.value)
  const payloadDuplicates = detectDuplicateKeys(payloadDecoded.value)

  // Interpret timestamps
  const timestamps = {}
  for (const field of ['exp', 'iat', 'nbf']) {
    if (field in payloadParsed.value) {
      timestamps[field] = interpretTimestamp(payloadParsed.value[field])
    }
  }

  // Check claim presence
  const claimPresence = checkClaimPresence(payloadParsed.value)

  // Lint claims
  const claimLinting = lintClaims(payloadParsed.value)

  // Classify token type
  const tokenTypeAnalysis = classifyTokenType(headerParsed.value, payloadParsed.value)

  // Analyze TTL
  const ttlAnalysis = analyzeTTL(payloadParsed.value, tokenTypeAnalysis.type)

  // Detect sensitive data
  const sensitiveDataAnalysis = detectSensitiveData(payloadParsed.value)

  // Validate header security
  const headerWarnings = validateHeaderSecurity(headerParsed.value, tokenTypeAnalysis.type)

  // Combine all issues
  const allIssues = [
    ...claimPresence.diagnostics,
    ...claimLinting,
    ...tokenTypeAnalysis.warnings,
    ...sensitiveDataAnalysis.warnings,
    ...headerWarnings,
  ]
  if (ttlAnalysis.warning) {
    allIssues.push(ttlAnalysis.warning)
  }

  const errors = allIssues.filter(i => i.level === 'error')
  const warnings = allIssues.filter(i => i.level === 'warning')
  const infos = allIssues.filter(i => i.level === 'info')

  // Return decoded result without signature verification
  // (Signature verification happens client-side in JWTDecoderOutput.js using Web Crypto API)
  return {
    decoded: true,
    token: {
      header: headerParsed.value,
      payload: payloadParsed.value,
      signature: parts[2],
    },
    raw: {
      header: headerDecoded.value,
      payload: payloadDecoded.value,
      signature: parts[2],
    },
    rawSegments: {
      header: parts[0],
      payload: parts[1],
      signature: parts[2],
    },
    structural: {
      hasHeader: Boolean(parts[0]),
      hasPayload: Boolean(parts[1]),
      hasSignature: Boolean(parts[2]),
      headerBase64Valid: headerDecoded.success,
      payloadBase64Valid: payloadDecoded.success,
      signatureBase64Valid: true,
    },
    validation: {
      headerDuplicateKeys: headerDuplicates,
      payloadDuplicateKeys: payloadDuplicates,
    },
    timestamps,
    claims: {
      present: claimPresence.present,
    },
    tokenType: tokenTypeAnalysis,
    ttlAnalysis,
    sensitiveData: sensitiveDataAnalysis,
    headerSecurityWarnings: headerWarnings,
    signatureVerification: (() => {
      const alg = headerParsed.value.alg
      const hmacAlgorithms = ['HS256', 'HS384', 'HS512']
      const rsaAlgorithms = ['RS256', 'RS384', 'RS512']
      const ecAlgorithms = ['ES256', 'ES384', 'ES512']

      if (hmacAlgorithms.includes(alg) || rsaAlgorithms.includes(alg) || ecAlgorithms.includes(alg)) {
        return {
          algorithm: alg,
          verified: null,
          reason: 'Verification requires a key. Provide a secret (HMAC) or public key (RSA/EC) in the UI.',
        }
      } else if (alg === 'none') {
        return {
          algorithm: 'none',
          verified: false,
          reason: 'alg: "none" has no signature to verify',
        }
      } else {
        return {
          algorithm: alg,
          verified: null,
          reason: `${alg} verification is not yet supported. Supported algorithms: HS256, HS384, HS512, RS256, RS384, RS512, ES256, ES384, ES512.`,
        }
      }
    })(),
    diagnostics: allIssues,
    issues: {
      errors,
      warnings,
      infos,
    },
    summary: {
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
      infoCount: infos.length,
    },
  }
}

export default jwtDecoderClient
