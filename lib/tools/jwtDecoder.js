// JWT Decoder - Phase 1: Core Decoder with Validation & Analytics
// Features: Parsing, Base64URL Decoding, JSON Validation, Timestamp Interpretation, Claim Diagnostics, Claim Linting

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

    // Decode to string
    const decoded = Buffer.from(base64, 'base64').toString('utf-8')
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
    // Try to provide helpful error message
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

  // Check for numeric claims that should be timestamps
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

  // exp < iat = invalid
  if ('exp' in payload && 'iat' in payload) {
    if (payload.exp < payload.iat) {
      issues.push({
        level: 'error',
        message: 'exp (expiration) is earlier than iat (issued at) - token is always invalid',
      })
    }
  }

  // nbf > exp = invalid
  if ('nbf' in payload && 'exp' in payload) {
    if (payload.nbf > payload.exp) {
      issues.push({
        level: 'error',
        message: 'nbf (not before) is later than exp (expiration) - token is always invalid',
      })
    }
  }

  // TTL > 24 hours = warning
  if ('iat' in payload && 'exp' in payload) {
    const ttl = payload.exp - payload.iat
    const hoursPerSecond = 1 / 3600
    const hours = ttl * hoursPerSecond
    if (hours > 24) {
      issues.push({
        level: 'warning',
        message: `Long TTL: ${hours.toFixed(1)} hours (recommended: ≤ 24 hours)`,
      })
    }
  }

  // Missing exp = danger
  if (!('exp' in payload)) {
    issues.push({
      level: 'error',
      message: 'No expiration (exp) claim - token never expires',
    })
  }

  // Check for standard claims with unexpected types
  if ('iss' in payload && typeof payload.iss !== 'string') {
    issues.push({
      level: 'warning',
      claim: 'iss',
      message: 'iss (issuer) should be a string',
    })
  }

  if ('aud' in payload) {
    const aud = payload.aud
    if (typeof aud !== 'string' && !Array.isArray(aud)) {
      issues.push({
        level: 'warning',
        claim: 'aud',
        message: 'aud (audience) should be a string or array of strings',
      })
    }
  }

  if ('sub' in payload && typeof payload.sub !== 'string') {
    issues.push({
      level: 'warning',
      claim: 'sub',
      message: 'sub (subject) should be a string',
    })
  }

  return issues
}

// Phase 2: Token Type Classification
function classifyTokenType(header, payload) {
  const idTokenIndicators = ['nonce', 'auth_time', 'email', 'email_verified', 'name', 'given_name', 'family_name', 'picture', 'preferred_username', 'amr']
  const accessTokenIndicators = ['scope', 'scp', 'permissions', 'roles', 'resource', 'azp', 'realm_access', 'resource_access', 'client_id']
  const customSessionIndicators = ['session_id', 'sid', 'tenant_id', 'organization_id', 'role', 'plan', 'username']

  const idTokenMatches = idTokenIndicators.filter(claim => claim in payload)
  const accessTokenMatches = accessTokenIndicators.filter(claim => claim in payload)
  const customSessionMatches = customSessionIndicators.filter(claim => claim in payload)

  let type = 'Unknown'
  let confidence = 'low'
  let signals = []
  let warnings = []

  // Check for Refresh Token first (very long TTL + minimal claims)
  if ('exp' in payload && 'iat' in payload) {
    const ttlSeconds = payload.exp - payload.iat
    const ttlDays = ttlSeconds / 86400
    if (ttlDays > 7 && idTokenMatches.length === 0 && accessTokenMatches.length === 0) {
      type = 'Refresh Token (JWT-based)'
      confidence = 'medium'
      signals = ['Very long TTL', 'Minimal claims']
      warnings.push({
        level: 'warning',
        message: 'JWT-based refresh tokens should ideally be opaque. Consider using opaque tokens instead.',
      })
    }
  }

  // Check for ID Token
  if (idTokenMatches.length > 0 && type === 'Unknown') {
    type = 'ID Token (OIDC/OAuth2)'
    confidence = 'high'
    signals = idTokenMatches
    const requiredClaims = ['iss', 'aud', 'exp', 'iat']
    const missingClaims = requiredClaims.filter(claim => !(claim in payload))
    if (missingClaims.length > 0) {
      warnings.push({
        level: 'warning',
        message: `ID Token missing required claims: ${missingClaims.join(', ')}`,
      })
    }
    if (accessTokenMatches.length > 0) {
      warnings.push({
        level: 'warning',
        message: `ID Token should not contain access token fields like '${accessTokenMatches[0]}'`,
      })
    }
  }

  // Check for Access Token
  if (accessTokenMatches.length > 0 && type === 'Unknown') {
    type = 'Access Token'
    confidence = 'high'
    signals = accessTokenMatches
    if (!('exp' in payload)) {
      warnings.push({
        level: 'error',
        message: 'Access Token missing expiration (exp) - CRITICAL SECURITY ISSUE',
      })
    }
    if (!('aud' in payload)) {
      warnings.push({
        level: 'warning',
        message: 'Access Token missing audience (aud) claim',
      })
    }
    if (idTokenMatches.length > 0) {
      warnings.push({
        level: 'info',
        message: `Access Token contains identity fields like '${idTokenMatches[0]}' - may leak personal data`,
      })
    }
  }

  // Check for Custom Session Token
  if (customSessionMatches.length > 0 && type === 'Unknown') {
    type = 'Custom Session Token (Non-standard)'
    confidence = 'medium'
    signals = customSessionMatches
    if (!('exp' in payload)) {
      warnings.push({
        level: 'warning',
        message: 'Custom Session Token missing expiration (exp) - recommended for security',
      })
    }
  }

  // Check for Misconfigured JWT
  if (type === 'Unknown') {
    const conflictingSig = []
    if ('nonce' in payload && idTokenMatches.length === 0) {
      conflictingSig.push("'nonce' without identity claims")
    }
    if (idTokenMatches.length > 0 && !('iss' in payload)) {
      conflictingSig.push("Missing 'iss' (required for ID tokens)")
    }
    if (idTokenMatches.length > 0 && !('aud' in payload)) {
      conflictingSig.push("Missing 'aud' (required for ID tokens)")
    }
    if ('scope' in payload && idTokenMatches.length > 0 && accessTokenMatches.length === 0) {
      conflictingSig.push("'scope' present but no other access token fields")
    }

    if (conflictingSig.length > 0) {
      type = 'Misconfigured JWT'
      confidence = 'medium'
      signals = conflictingSig
      warnings.push({
        level: 'error',
        message: `Conflicting signals detected: ${conflictingSig.join(', ')}`,
      })
    } else {
      type = 'Custom/Unknown Token'
      confidence = 'low'
      signals = ['Unable to classify']
    }
  }

  return {
    type,
    confidence,
    signals,
    warnings,
  }
}

// Phase 2: TTL Analysis
function analyzeTTL(payload, tokenType) {
  if (!('exp' in payload) || !('iat' in payload)) {
    return {
      ttlSeconds: null,
      status: 'missing',
      notes: ['Expiration time missing - cannot calculate TTL'],
      warning: {
        level: 'error',
        message: 'No expiration (exp) claim - token never expires',
      },
    }
  }

  const ttlSeconds = payload.exp - payload.iat
  const ttlHours = ttlSeconds / 3600
  const ttlDays = ttlSeconds / 86400

  let status = 'normal'
  const notes = []
  let warning = null

  if (tokenType.includes('ID Token')) {
    if (ttlHours > 24) {
      status = 'warning'
      notes.push(`TTL is ${ttlHours.toFixed(1)} hours - ID Tokens should expire within 5-60 minutes`)
      warning = { level: 'warning', message: `Unusually long TTL for ID Token: ${ttlHours.toFixed(1)} hours` }
    } else {
      notes.push('TTL appropriate for ID Token')
    }
  } else if (tokenType.includes('Access Token')) {
    if (ttlHours > 24) {
      status = 'warning'
      notes.push(`TTL is ${ttlHours.toFixed(1)} hours - Access Tokens should expire within 5 minutes to 2 hours`)
      warning = { level: 'warning', message: `Unusually long TTL for Access Token: ${ttlHours.toFixed(1)} hours` }
    } else {
      notes.push('TTL appropriate for Access Token')
    }
  } else if (tokenType.includes('Refresh Token')) {
    if (ttlDays < 1) {
      status = 'suspicious'
      notes.push(`TTL is ${ttlHours.toFixed(1)} hours - Refresh Tokens typically last days or weeks`)
      warning = { level: 'info', message: `Very short TTL for Refresh Token: ${ttlHours.toFixed(1)} hours` }
    } else if (ttlDays > 90) {
      status = 'questionable'
      notes.push(`TTL is ${ttlDays.toFixed(1)} days - Consider shorter expiry for security`)
      warning = { level: 'warning', message: `Very long TTL (${ttlDays.toFixed(1)} days) - Security best practice is ≤ 90 days` }
    } else {
      notes.push(`TTL is ${ttlDays.toFixed(1)} days - Appropriate for Refresh Token`)
    }
  } else if (tokenType.includes('Custom Session Token')) {
    if (!('exp' in payload)) {
      warning = { level: 'warning', message: 'Custom Session Token missing expiration - recommended for security' }
    } else if (ttlDays > 7) {
      status = 'warning'
      notes.push(`TTL is ${ttlDays.toFixed(1)} days - Consider shorter expiry for session tokens`)
      warning = { level: 'warning', message: `Long session TTL (${ttlDays.toFixed(1)} days) - Security best practice is ≤ 7 days` }
    } else {
      notes.push(`TTL is ${ttlDays.toFixed(1)} days`)
    }
  }

  return {
    ttlSeconds,
    status,
    notes,
    warning,
  }
}

// Phase 2: Sensitive Data Detection
function detectSensitiveData(payload) {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[\d\s\-\+\(\)]{10,}$/,
    ssn: /^\d{3}-\d{2}-\d{4}$/,
    creditCard: /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/,
  }

  const sensitiveFields = ['password', 'secret', 'api_key', 'apikey', 'token', 'private_key', 'privatekey', 'access_key', 'accesskey']
  const piiFields = ['email', 'phone', 'phone_number', 'ssn', 'social_security', 'street', 'address', 'zip', 'zipcode', 'credit_card', 'creditcard', 'passport', 'license']

  const matches = {
    pii: [],
    sensitive: [],
    freeText: [],
  }

  const allKeys = Object.keys(payload).map(k => k.toLowerCase())

  // Check for sensitive field names
  for (const key of allKeys) {
    if (sensitiveFields.some(field => key.includes(field))) {
      matches.sensitive.push(key)
    }
    if (piiFields.some(field => key.includes(field))) {
      matches.pii.push(key)
    }
  }

  // Check for PII patterns in values
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      if (patterns.email.test(value)) {
        if (!matches.pii.includes('email_value')) matches.pii.push(`${key} (email)`)
      }
      if (patterns.phone.test(value)) {
        if (!matches.pii.includes('phone_value')) matches.pii.push(`${key} (phone)`)
      }
      if (patterns.ssn.test(value)) {
        if (!matches.pii.includes('ssn_value')) matches.pii.push(`${key} (SSN)`)
      }

      // Check for human-readable free text (very long, unstructured strings)
      if (value.length > 100 && /[a-z\s]{50,}/.test(value.toLowerCase())) {
        matches.freeText.push(key)
      }
    }
  }

  const containsPII = matches.pii.length > 0
  const containsSensitive = matches.sensitive.length > 0
  const containsFreeText = matches.freeText.length > 0

  const warnings = []
  if (containsPII) {
    warnings.push({
      level: 'warning',
      message: `Payload contains PII: ${matches.pii.slice(0, 3).join(', ')}${matches.pii.length > 3 ? ` and ${matches.pii.length - 3} more` : ''}. Consider minimizing personal data in tokens.`,
    })
  }
  if (containsSensitive) {
    warnings.push({
      level: 'error',
      message: `Payload contains sensitive data fields: ${matches.sensitive.slice(0, 2).join(', ')}. Never store secrets or keys in tokens.`,
    })
  }
  if (containsFreeText) {
    warnings.push({
      level: 'info',
      message: `Payload contains free-text data (${matches.freeText[0]}). Consider using structured fields instead.`,
    })
  }

  return {
    containsPII,
    containsSensitive,
    matches,
    warnings,
  }
}

// Phase 2: Header Security Validation
function validateHeaderSecurity(header) {
  const warnings = []

  // Check alg claim
  if (!('alg' in header)) {
    warnings.push({
      level: 'error',
      message: "'alg' (algorithm) is required in JWT header",
    })
  } else if (header.alg === 'none') {
    warnings.push({
      level: 'error',
      message: "'alg: none' is a critical security vulnerability and should never be used",
    })
  } else if (typeof header.alg !== 'string') {
    warnings.push({
      level: 'error',
      message: "'alg' must be a string",
    })
  }

  // Check typ claim
  if (!('typ' in header)) {
    warnings.push({
      level: 'info',
      message: "Optional: Consider adding 'typ: \"JWT\"' to the header for clarity",
    })
  } else if (header.typ !== 'JWT') {
    warnings.push({
      level: 'warning',
      message: `'typ' is '${header.typ}' but JWT spec recommends 'JWT'`,
    })
  }

  // Check kid for RS256/ES256 (asymmetric algorithms)
  const asymmetricAlgs = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512']
  if (header.alg && asymmetricAlgs.includes(header.alg) && !('kid' in header)) {
    warnings.push({
      level: 'warning',
      message: `'kid' (key ID) recommended for ${header.alg} algorithm to support key rotation`,
    })
  }

  // Check header size (excessive size could indicate embedded data)
  const headerStr = JSON.stringify(header)
  if (headerStr.length > 2000) {
    warnings.push({
      level: 'warning',
      message: 'JWT header is unusually large (>2KB). Headers should typically be small.',
    })
  }

  return warnings
}

export function jwtDecoder(text) {
  const token = text.trim()

  // Phase 1.1: Token Structure Parsing
  const parts = token.split('.')
  if (parts.length < 3) {
    return {
      error: `Invalid JWT format. Expected 3 parts (header.payload.signature) separated by dots, got ${parts.length}.`,
      decoded: false,
    }
  }

  if (parts.length > 3) {
    return {
      error: `Invalid JWT format. Expected 3 parts (header.payload.signature) separated by dots, got ${parts.length}.`,
      decoded: false,
    }
  }

  // Phase 1.5: Missing Signature Detection
  if (!parts[0] || !parts[1] || !parts[2]) {
    const missingParts = []
    if (!parts[0]) missingParts.push('header')
    if (!parts[1]) missingParts.push('payload')
    if (!parts[2]) missingParts.push('signature')
    return {
      error: `Invalid JWT: missing ${missingParts.join(', ')} part${missingParts.length > 1 ? 's' : ''}`,
      decoded: false,
    }
  }

  // Phase 1.5: Invalid base64url Detection
  for (let i = 0; i < parts.length; i++) {
    const partName = i === 0 ? 'header' : i === 1 ? 'payload' : 'signature'
    if (!/^[A-Za-z0-9_-]*$/.test(parts[i])) {
      const invalidChars = parts[i].match(/[^A-Za-z0-9_-]/g) || []
      const uniqueChars = [...new Set(invalidChars)].join(', ')
      return {
        error: `Invalid JWT: ${partName} contains non-base64url characters (${uniqueChars}). Base64url allows: a-z, A-Z, 0-9, hyphen (-), underscore (_)`,
        decoded: false,
      }
    }
  }

  // Phase 1.2: Base64URL Decoding + Error Handling
  const headerDecoded = decodeBase64Url(parts[0])
  if (!headerDecoded.success) {
    return {
      error: `Failed to decode header: ${headerDecoded.error}. Check that the header is valid base64url.`,
      decoded: false,
    }
  }

  const payloadDecoded = decodeBase64Url(parts[1])
  if (!payloadDecoded.success) {
    return {
      error: `Failed to decode payload: ${payloadDecoded.error}. Check that the payload is valid base64url.`,
      decoded: false,
    }
  }

  // Phase 1.3: Invalid JSON Detection + JSON Validation
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

  // Phase 1.4: Timestamp Interpretation
  const timestamps = {}
  for (const field of ['exp', 'iat', 'nbf']) {
    if (field in payloadParsed.value) {
      timestamps[field] = interpretTimestamp(payloadParsed.value[field])
    }
  }

  // Phase 1.5: Claim Presence Diagnostics
  const claimPresence = checkClaimPresence(payloadParsed.value)

  // Phase 1.6: Basic Claim Linting
  const claimLinting = lintClaims(payloadParsed.value)

  // Phase 2: Token Type Classification
  const tokenTypeAnalysis = classifyTokenType(headerParsed.value, payloadParsed.value)

  // Phase 2: TTL Analysis
  const ttlAnalysis = analyzeTTL(payloadParsed.value, tokenTypeAnalysis.type)

  // Phase 2: Sensitive Data Detection
  const sensitiveDataAnalysis = detectSensitiveData(payloadParsed.value)

  // Phase 2: Header Security Validation
  const headerWarnings = validateHeaderSecurity(headerParsed.value)

  // Overall status - combine all issues
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
