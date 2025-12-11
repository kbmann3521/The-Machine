// JWT Decoder - Phase 1: Core Decoder with Validation & Analytics
// Features: Parsing, Base64URL Decoding, JSON Validation, Timestamp Interpretation, Claim Diagnostics, Claim Linting
// Phase 3: HS256 Cryptographic Signature Verification

import crypto from 'crypto'

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
  // Check if expiration exists
  if (!('exp' in payload)) {
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

  // Calculate TTL: prefer (exp - iat) if iat exists, otherwise just use exp
  let ttlSeconds
  if ('iat' in payload) {
    ttlSeconds = payload.exp - payload.iat
  } else {
    // If no iat, use exp to determine if token is expired relative to now
    const nowSeconds = Math.floor(Date.now() / 1000)
    ttlSeconds = payload.exp - nowSeconds
  }

  const ttlHours = ttlSeconds / 3600
  const ttlDays = ttlSeconds / 86400

  let status = 'normal'
  const notes = []
  let warning = null

  // Determine expiration status
  if (ttlSeconds < 0) {
    status = 'expired'
    notes.push('Token has expired')
  } else if (ttlSeconds === 0) {
    status = 'expired'
    notes.push('Token has expired')
  }

  // Type-specific TTL analysis
  if (tokenType.includes('ID Token')) {
    if (status === 'expired') {
      // Already noted as expired
    } else if (ttlHours > 24) {
      status = 'warning'
      notes.push(`TTL is ${ttlHours.toFixed(1)} hours - ID Tokens should expire within 5-60 minutes`)
      warning = { level: 'warning', message: `Unusually long TTL for ID Token: ${ttlHours.toFixed(1)} hours` }
    } else {
      notes.push('TTL appropriate for ID Token')
    }
  } else if (tokenType.includes('Access Token')) {
    if (status === 'expired') {
      // Already noted as expired
    } else if (ttlHours > 24) {
      status = 'warning'
      notes.push(`TTL is ${ttlHours.toFixed(1)} hours - Access Tokens should expire within 5 minutes to 2 hours`)
      warning = { level: 'warning', message: `Unusually long TTL for Access Token: ${ttlHours.toFixed(1)} hours` }
    } else {
      notes.push('TTL appropriate for Access Token')
    }
  } else if (tokenType.includes('Refresh Token')) {
    if (status === 'expired') {
      // Already noted as expired
    } else if (ttlDays < 1) {
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
    if (status === 'expired') {
      // Already noted as expired
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

// Phase 2: Sensitive Data Detection - Extended Patterns
function detectSensitiveData(payload) {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    // Phone patterns: (xxx) xxx-xxxx, +1-xxx-xxx-xxxx, xxx-xxx-xxxx
    phone: /^(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$|^\+\d{1,3}\d{9,}$|^\d{3}[-.\s]\d{3}[-.\s]\d{4}$/,
    // SSN patterns: 123-45-6789 or 123456789
    ssn: /^\d{3}-\d{2}-\d{4}$|^\d{9}$/,
    // Credit card patterns (basic, no Luhn check needed)
    creditCard: /^4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$|^5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$|^3[47]\d{2}[\s-]?\d{6}[\s-]?\d{5}$/,
    // IPv4 address
    ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    // IPv6 address (simplified but covers most formats)
    ipv6: /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::1|::)$/,
  }

  const sensitiveFields = ['password', 'secret', 'api_key', 'apikey', 'token', 'private_key', 'privatekey', 'access_key', 'accesskey', 'auth_token', 'refresh_token', 'signing_key']
  const piiFields = ['email', 'phone', 'phone_number', 'ssn', 'social_security', 'street', 'address', 'zip', 'zipcode', 'credit_card', 'creditcard', 'passport', 'license', 'mobile', 'cell']

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
      // Email pattern
      if (patterns.email.test(value)) {
        if (!matches.pii.some(m => m.includes('email'))) {
          matches.pii.push(`${key} (email: ${value.substring(0, 20)}...)`)
        }
      }

      // Phone patterns (multiple formats)
      if (patterns.phone.test(value.replace(/\s/g, ''))) {
        if (!matches.pii.some(m => m.includes('phone'))) {
          matches.pii.push(`${key} (phone)`)
        }
      }

      // SSN patterns
      if (patterns.ssn.test(value)) {
        if (!matches.pii.some(m => m.includes('SSN'))) {
          matches.pii.push(`${key} (SSN)`)
        }
      }

      // Credit card patterns
      if (patterns.creditCard.test(value.replace(/\s/g, ''))) {
        if (!matches.pii.some(m => m.includes('credit card'))) {
          matches.pii.push(`${key} (credit card)`)
        }
      }

      // IPv4 / IPv6 addresses (potential internal data leak)
      if (patterns.ipv4.test(value)) {
        if (!matches.pii.some(m => m.includes('IPv4'))) {
          matches.pii.push(`${key} (IPv4: ${value})`)
        }
      }
      if (patterns.ipv6.test(value)) {
        if (!matches.pii.some(m => m.includes('IPv6'))) {
          matches.pii.push(`${key} (IPv6)`)
        }
      }

      // Free-text sensitive detection (heuristics)
      if (detectFreetextSensitiveData(value)) {
        if (!matches.freeText.includes(key)) {
          matches.freeText.push(key)
        }
      }
    }
  }

  const containsPII = matches.pii.length > 0
  const containsSensitive = matches.sensitive.length > 0
  const containsFreeText = matches.freeText.length > 0

  const warnings = []
  if (containsSensitive) {
    warnings.push({
      level: 'error',
      message: `Payload contains sensitive data fields: ${matches.sensitive.slice(0, 2).join(', ')}. Never store secrets or keys in tokens.`,
    })
  }
  if (containsPII) {
    warnings.push({
      level: 'warning',
      message: `Payload contains PII: ${matches.pii.slice(0, 3).join(', ')}${matches.pii.length > 3 ? ` and ${matches.pii.length - 3} more` : ''}. Consider minimizing personal data in tokens.`,
    })
  }
  if (containsFreeText) {
    warnings.push({
      level: 'warning',
      message: `Payload contains suspicious free-text fields (${matches.freeText.slice(0, 2).join(', ')}). May contain secrets or sensitive data.`,
    })
  }

  return {
    containsPII,
    containsSensitive,
    matches,
    warnings,
  }
}

// Helper: Detect free-text sensitive patterns (API keys, secrets, random strings)
function detectFreetextSensitiveData(str) {
  if (typeof str !== 'string') return false

  // Skip very short strings
  if (str.length < 20) return false

  // Skip common legitimate strings
  if (str.includes(' ') && str.length < 50) return false

  // Heuristic 1: Contains api_ or secret keyword
  if (/api_|secret|password|apikey|auth|token|key|private|credential/i.test(str)) {
    return true
  }

  // Heuristic 2: Long random-looking string (mixed case + no spaces)
  if (str.length > 32 && !/\s/.test(str) && /[a-z]/.test(str) && /[A-Z]/.test(str)) {
    return true
  }

  // Heuristic 3: Base64-like blob (long string of alphanumeric + / + = + -)
  if (str.length > 40 && /^[A-Za-z0-9\+\/\=\-_]{40,}$/.test(str)) {
    return true
  }

  // Heuristic 4: JWT-like structure inside payload (indicator of token leakage)
  if (/^eyJ[A-Za-z0-9_\-\.]+$/.test(str)) {
    return true
  }

  return false
}

// Phase 2: Header Security Validation - Enhanced
function validateHeaderSecurity(header, tokenType) {
  const warnings = []

  // Check alg claim
  if (!('alg' in header)) {
    warnings.push({
      level: 'error',
      message: "'alg' (algorithm) is required in JWT header",
    })
    return warnings
  }

  // CRITICAL: alg: "none" detection
  if (header.alg === 'none') {
    warnings.push({
      level: 'error',
      message: "'alg: none' is a CRITICAL SECURITY VULNERABILITY. This token is unsigned and should never be used in production.",
    })
  } else if (typeof header.alg !== 'string') {
    warnings.push({
      level: 'error',
      message: "'alg' must be a string",
    })
  }

  // Check algorithm strength based on token type
  const weakAlgs = ['HS256']
  const strongAlgs = ['HS512', 'RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512']
  const asymmetricAlgs = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512', 'PS256', 'PS384', 'PS512']
  const ecAlgorithms = ['ES256', 'ES384', 'ES512']

  if (tokenType && tokenType.includes('ID Token') && weakAlgs.includes(header.alg)) {
    warnings.push({
      level: 'warning',
      message: `ID Tokens typically use RS256 for asymmetric signing. This token uses ${header.alg} (symmetric). Consider RS256 for better security.`,
    })
  }

  if (tokenType && tokenType.includes('Access Token') && weakAlgs.includes(header.alg)) {
    warnings.push({
      level: 'info',
      message: `Access Token uses ${header.alg}. Consider RS256 or stronger algorithms for better key rotation support.`,
    })
  }

  // Check kid for asymmetric algorithms (REQUIRED for key rotation)
  if (asymmetricAlgs.includes(header.alg)) {
    if (!('kid' in header)) {
      warnings.push({
        level: 'warning',
        message: `'${header.alg}' tokens without 'kid' (key ID) cannot support key rotation. Add 'kid' to enable secure key updates.`,
      })
    }
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

  // Check for non-standard or critical header fields
  const standardFields = ['alg', 'typ', 'kid', 'cty', 'jku', 'jwk', 'crit', 'epk', 'apu', 'apv', 'iv', 'tag']
  const headerKeys = Object.keys(header)
  const unknownFields = headerKeys.filter(key => !standardFields.includes(key))

  if (unknownFields.length > 0) {
    warnings.push({
      level: 'info',
      message: `Header contains non-standard fields: ${unknownFields.join(', ')}. This may indicate custom claims or misconfiguration.`,
    })
  }

  // Check for critical fields
  if ('crit' in header && Array.isArray(header.crit) && header.crit.length > 0) {
    const unsupportedCrit = header.crit.filter(field => !standardFields.includes(field))
    if (unsupportedCrit.length > 0) {
      warnings.push({
        level: 'warning',
        message: `Header declares critical fields that may not be supported: ${unsupportedCrit.join(', ')}`,
      })
    }
  }

  // Check header size (excessive size could indicate embedded data)
  const headerStr = JSON.stringify(header)
  if (headerStr.length > 512) {
    warnings.push({
      level: 'info',
      message: `JWT header is large (${headerStr.length} bytes). Headers should typically be <200 bytes.`,
    })
  }

  return warnings
}

// Phase 3: HS256 Signature Verification
function bytesToBase64Url(bytes) {
  const buf = Buffer.from(bytes)
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function base64urlToBuffer(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padding = 4 - (base64.length % 4)
  if (padding !== 4) {
    base64 += '='.repeat(padding)
  }
  return Buffer.from(base64, 'base64')
}

// Phase 4B: HMAC Signature Verification (Server-side, Node.js)
// Supports HS256, HS384, HS512
function verifyHMACSignature(algorithm, rawHeader, rawPayload, signatureB64Url, secret) {
  try {
    if (!secret) {
      return {
        verified: null,
        reason: 'Secret not provided — cannot verify signature',
      }
    }

    // Map HMAC algorithm to Node.js hash algorithm
    const algMap = {
      HS256: 'sha256',
      HS384: 'sha384',
      HS512: 'sha512',
    }

    const hashAlg = algMap[algorithm]
    if (!hashAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Use exact original segments - already trimmed by parser
    const message = `${rawHeader}.${rawPayload}`

    const expectedSignature = crypto
      .createHmac(hashAlg, secret)
      .update(message)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const verified = expectedSignature === signatureB64Url

    // Debug info
    if (typeof window !== 'undefined') {
      console.log(`[JWT Debug] Server-side ${algorithm} Verification:`, {
        headerLen: rawHeader.length,
        payloadLen: rawPayload.length,
        signatureLen: signatureB64Url.length,
        messageLen: message.length,
        expectedSig: expectedSignature,
        providedSig: signatureB64Url,
        match: verified,
      })
    }

    const hashName = algorithm.replace('HS', 'SHA-')
    return {
      verified,
      reason: verified
        ? `Recomputed ${algorithm} (${hashName}) HMAC matches token signature`
        : 'Signature does not match. The secret is incorrect or token has been tampered with.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

// Phase 4: RSA Signature Verification (Server-side, Node.js)
// Supports RS256, RS384, RS512
function verifyRSASignature(algorithm, rawHeader, rawPayload, signatureB64Url, publicKeyPem) {
  try {
    if (!publicKeyPem) {
      return {
        verified: null,
        reason: 'Public key not provided — cannot verify signature',
      }
    }

    // Map RSA algorithm to crypto algorithm string
    const algMap = {
      RS256: 'RSA-SHA256',
      RS384: 'RSA-SHA384',
      RS512: 'RSA-SHA512',
    }

    const cryptoAlg = algMap[algorithm]
    if (!cryptoAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    const verifier = crypto.createVerify(cryptoAlg)
    verifier.update(`${rawHeader}.${rawPayload}`)
    verifier.end()

    const signatureBuffer = base64urlToBuffer(signatureB64Url)

    // Try to create public key object
    let publicKey
    try {
      publicKey = crypto.createPublicKey({
        key: publicKeyPem,
        format: 'pem',
      })
    } catch (keyError) {
      return {
        verified: false,
        reason: `Failed to parse public key: ${keyError.message}. Ensure it is in valid PEM format.`,
      }
    }

    const verified = verifier.verify(publicKey, signatureBuffer)

    const hashAlg = algorithm.replace('RS', 'SHA-')
    return {
      verified,
      reason: verified
        ? `${algorithm} (${hashAlg}) signature matches token contents`
        : 'Signature does not match. The public key does not match the private key used to sign.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

// Phase 6: EC (ECDSA) Signature Verification (Server-side, Node.js)
// Supports ES256, ES384, ES512
function verifyECSignature(algorithm, rawHeader, rawPayload, signatureB64Url, publicKeyPem) {
  try {
    if (!publicKeyPem) {
      return {
        verified: null,
        reason: 'Public key not provided — cannot verify signature',
      }
    }

    // Check if crypto.createPublicKey is available (Node.js only)
    if (typeof crypto === 'undefined' || typeof crypto.createPublicKey !== 'function') {
      return {
        verified: null,
        reason: `${algorithm} signature verification requires Node.js environment. Browser verification not yet supported.`,
      }
    }

    // Map EC algorithm to Node.js hash algorithm
    const algMap = {
      ES256: 'sha256',
      ES384: 'sha384',
      ES512: 'sha512',
    }

    const hashAlg = algMap[algorithm]
    if (!hashAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    const verifier = crypto.createVerify(hashAlg)
    verifier.update(`${rawHeader}.${rawPayload}`)
    verifier.end()

    const signatureBuffer = base64urlToBuffer(signatureB64Url)

    // Try to create public key object
    let publicKey
    try {
      publicKey = crypto.createPublicKey({
        key: publicKeyPem,
        format: 'pem',
      })
    } catch (keyError) {
      return {
        verified: false,
        reason: `Failed to parse public key: ${keyError.message}. Ensure it is in valid PEM format.`,
      }
    }

    const verified = verifier.verify(publicKey, signatureBuffer)

    const hashName = algorithm.replace('ES', 'SHA-')
    const curveMap = { ES256: 'P-256', ES384: 'P-384', ES512: 'P-521' }
    const curveName = curveMap[algorithm] || 'Unknown'

    return {
      verified,
      reason: verified
        ? `${algorithm} (${hashName} with ${curveName} curve) signature matches token contents`
        : 'Signature does not match. The public key does not match the private key used to sign.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

// Phase 6: Validate EC public key strength
function validateECPublicKey(publicKeyPem) {
  const warnings = []

  if (!publicKeyPem) {
    return warnings
  }

  try {
    const publicKey = crypto.createPublicKey({
      key: publicKeyPem,
      format: 'pem',
    })

    const keyDetails = publicKey.asymmetricKeyDetails
    if (keyDetails) {
      const keyType = keyDetails.keyType
      if (keyType !== 'ec') {
        warnings.push({
          level: 'error',
          message: `Expected EC key, got ${keyType} key. Ensure you are using an elliptic curve public key.`,
        })
        return warnings
      }

      const namedCurve = keyDetails.namedCurve
      const validCurves = ['prime256v1', 'secp384r1', 'secp521r1']

      if (!validCurves.includes(namedCurve)) {
        warnings.push({
          level: 'error',
          message: `EC key uses unsupported curve: ${namedCurve}. Supported curves: prime256v1 (P-256), secp384r1 (P-384), secp521r1 (P-521).`,
        })
      }

      const curveMap = {
        prime256v1: 'P-256 (256 bits)',
        secp384r1: 'P-384 (384 bits)',
        secp521r1: 'P-521 (521 bits)',
      }
      const curveInfo = curveMap[namedCurve]
      if (curveInfo) {
        // Just informational, not a warning
      }
    }
  } catch (error) {
    warnings.push({
      level: 'error',
      message: `Invalid EC public key: ${error.message}`,
    })
  }

  return warnings
}

// Phase 4: Validate RSA public key strength
function validateRSAPublicKey(publicKeyPem) {
  const warnings = []

  if (!publicKeyPem) {
    return warnings
  }

  try {
    const publicKey = crypto.createPublicKey({
      key: publicKeyPem,
      format: 'pem',
    })

    const keyDetails = publicKey.asymmetricKeyDetails
    if (keyDetails) {
      const modulusLength = keyDetails.modulusLength
      if (modulusLength < 2048) {
        warnings.push({
          level: 'error',
          message: `RSA key is only ${modulusLength} bits. Minimum recommended: 2048 bits.`,
        })
      }

      const publicExponent = keyDetails.publicExponent
      if (publicExponent !== 65537) {
        warnings.push({
          level: 'warning',
          message: `Non-standard public exponent: ${publicExponent}. Standard is 65537.`,
        })
      }
    }
  } catch (error) {
    warnings.push({
      level: 'error',
      message: `Invalid RSA public key: ${error.message}`,
    })
  }

  return warnings
}

export function jwtDecoder(text, options = {}) {
  // Only trim leading/trailing whitespace, preserve exact segment bytes
  const token = text.trim()

  // Phase 1.1: Token Structure Parsing - trim each segment individually
  const parts = token.split('.').map(p => p.trim())
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

  // Phase 1.5: Missing Parts Detection
  // Header and payload are required and must be non-empty
  // Signature can be empty (for alg: "none"), but the third segment must exist
  if (!parts[0] || !parts[1]) {
    const missingParts = []
    if (!parts[0]) missingParts.push('header')
    if (!parts[1]) missingParts.push('payload')
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

  // Phase 2: Header Security Validation (with token type context)
  const headerWarnings = validateHeaderSecurity(headerParsed.value, tokenTypeAnalysis.type)

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
    signatureVerification: (() => {
      // Phase 3-4B-6: Signature Verification (HS256/384/512, RS256/384/512, ES256/384/512, none)
      const alg = headerParsed.value.alg
      const hmacAlgorithms = ['HS256', 'HS384', 'HS512']
      const rsaAlgorithms = ['RS256', 'RS384', 'RS512']
      const ecAlgorithms = ['ES256', 'ES384', 'ES512']

      if (hmacAlgorithms.includes(alg)) {
        const verificationResult = verifyHMACSignature(
          alg,
          parts[0],
          parts[1],
          parts[2],
          options.verificationSecret
        )
        return {
          algorithm: alg,
          verified: verificationResult.verified,
          reason: verificationResult.reason,
        }
      } else if (rsaAlgorithms.includes(alg)) {
        const verificationResult = verifyRSASignature(
          alg,
          parts[0],
          parts[1],
          parts[2],
          options.publicKey
        )

        // Add RSA key validation warnings if key is provided
        const keyWarnings = validateRSAPublicKey(options.publicKey)

        return {
          algorithm: alg,
          verified: verificationResult.verified,
          reason: verificationResult.reason,
          keyWarnings,
        }
      } else if (ecAlgorithms.includes(alg)) {
        const verificationResult = verifyECSignature(
          alg,
          parts[0],
          parts[1],
          parts[2],
          options.publicKey
        )

        // Add EC key validation warnings if key is provided
        const keyWarnings = validateECPublicKey(options.publicKey)

        return {
          algorithm: alg,
          verified: verificationResult.verified,
          reason: verificationResult.reason,
          keyWarnings,
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

/**
 * Async wrapper for JWT verification with JWKS auto-discovery
 * Phase 5: JWKS Auto-Discovery + Kid-Based Verification
 * @param {string} text - JWT string
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} - Decoded JWT with JWKS-based verification
 */
export async function jwtDecoderWithJwks(text, options = {}) {
  // Parse JWT first (synchronous)
  const result = jwtDecoder(text, options)

  if (!result || !result.decoded || !result.token) {
    return result
  }

  const { token } = result
  const alg = token.header?.alg
  const kid = token.header?.kid
  const iss = token.payload?.iss
  const rsaAlgorithms = ['RS256', 'RS384', 'RS512']

  // Phase 5: If RSA algorithm and no manual public key provided, try JWKS
  if (rsaAlgorithms.includes(alg) && !options.publicKey && iss) {
    try {
      const { buildJwksUrl, fetchJwks, findKeyByKid, jwkToPem } = await import('./jwksClient.js')

      // Build JWKS URL from issuer
      const jwksUrl = buildJwksUrl(iss)
      if (!jwksUrl) {
        // Add warning to result
        result.jwksError = 'Invalid issuer URL (must be HTTPS)'
        return result
      }

      // Fetch JWKS
      const jwks = await fetchJwks(jwksUrl)
      if (!jwks) {
        result.jwksError = `Failed to fetch JWKS from ${jwksUrl}`
        return result
      }

      // Find key by kid
      if (!kid) {
        result.jwksError = 'Token has no kid (key ID) header - cannot match JWKS key'
        return result
      }

      const jwk = findKeyByKid(jwks, kid)
      if (!jwk) {
        result.jwksError = `No key found in JWKS with kid: "${kid}". Token may be signed with a rotated or invalid key.`
        return result
      }

      // Convert JWK to PEM
      const pemPublicKey = jwkToPem(jwk)
      if (!pemPublicKey) {
        result.jwksError = `Failed to convert JWK to PEM format for kid: "${kid}"`
        return result
      }

      // Re-verify with the JWKS public key
      const verificationResult = jwtDecoder(text, {
        ...options,
        publicKey: pemPublicKey,
      })

      // Merge results, adding JWKS metadata
      if (verificationResult && verificationResult.signatureVerification) {
        verificationResult.signatureVerification.keySource = 'jwks'
        verificationResult.signatureVerification.keyId = kid
        verificationResult.signatureVerification.issuer = iss
        verificationResult.signatureVerification.jwksUrl = jwksUrl
      }

      return verificationResult
    } catch (error) {
      console.error('[JWKS] Verification error:', error)
      result.jwksError = `JWKS verification failed: ${error.message}`
      return result
    }
  }

  return result
}
