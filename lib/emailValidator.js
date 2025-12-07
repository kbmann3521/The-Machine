/**
 * Email Validator Module
 * Comprehensive email validation with deliverability scoring
 */

// Common role-based email prefixes
const roleBasedPrefixes = [
  'admin', 'noreply', 'no-reply', 'contact', 'info', 'support',
  'webmaster', 'postmaster', 'hostmaster', 'mailer-daemon',
  'root', 'abuse', 'security', 'billing', 'sales', 'marketing',
  'notifications', 'notification', 'alerts', 'alert', 'system', 'help'
]

const knownDisposableDomains = [
  'mailinator', 'yopmail', '10minutemail', 'temp-mail',
  'guerrillamail', 'anonymousemail', 'cock.li', 'cock.email',
  'tempmail', 'throwaway', 'mailnesia', '10min',
  'maildrop', 'mailtest', 'fakeinbox', 'trashmail'
]

// ICANN-approved TLDs (common ones; full list has 1000+ entries)
const validTLDs = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name',
  'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch',
  'at', 'se', 'no', 'dk', 'fi', 'pt', 'gr', 'ie', 'cz', 'pl', 'ru', 'jp',
  'cn', 'in', 'br', 'mx', 'ar', 'za', 'nz', 'sg', 'hk', 'kr', 'tw', 'th',
  'ph', 'id', 'my', 'vn', 'pk', 'bd', 'lk', 'ng', 'ke', 'eg', 'tr', 'il',
  'ae', 'sa', 'ksa', 'app', 'dev', 'io', 'pro', 'mobi', 'asia', 'travel',
  'tel', 'jobs', 'post', 'online', 'site', 'website', 'space', 'blog',
  'shop', 'store', 'cloud', 'tech', 'digital', 'media', 'news', 'tv', 'li'
])

const spammyTLDs = new Set(['xyz', 'buzz', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq'])

const rarelyUsedTLDs = new Set(['tk', 'ml', 'ga', 'cf', 'br.to', 'eu.org', 'freenom', 'xyz', 'club', 'cricket'])

// Reserved documentation domains
const reservedDomains = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'localhost', 'invalid', 'local'])

// Provider reputation tiers and penalty scaling
const providerTiers = {
  gmail: { tier: 'premium', scaling: 0.40 },
  outlook: { tier: 'premium', scaling: 0.60 },
  hotmail: { tier: 'premium', scaling: 0.60 },
  'outlook.com': { tier: 'premium', scaling: 0.60 },
  'hotmail.com': { tier: 'premium', scaling: 0.60 },
  yahoo: { tier: 'established', scaling: 0.60 },
  icloud: { tier: 'established', scaling: 0.60 },
  aol: { tier: 'legacy', scaling: 0.80 },
  gmx: { tier: 'lower', scaling: 1.0 },
  'mail.com': { tier: 'lower', scaling: 1.0 },
  yandex: { tier: 'lower', scaling: 1.0 },
  protonmail: { tier: 'lower', scaling: 1.0 },
  zoho: { tier: 'established', scaling: 0.80 }
}

function getProviderInfo(domain) {
  const domainLower = domain.toLowerCase()
  const domainName = domainLower.split('.')[0]
  return providerTiers[domainName] || { tier: 'unknown', scaling: 1.0 }
}

function validateSingleEmail(trimmedEmail) {
  const details = {
    email: trimmedEmail,
    valid: false,
    issues: [],
    deliverabilityScore: 0,
    mxRecords: [],
    domainExists: false
  }

  // 1. Basic syntax validation - check for @ and domain
  if (!trimmedEmail.includes('@')) {
    details.issues.push('Missing @ symbol')
    details.deliverabilityScore = 0
    return details
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (!localPart || !domain) {
    details.issues.push('Invalid email format: missing local part or domain')
    details.deliverabilityScore = 0
    return details
  }

  // 2. Check for spaces and invalid characters
  if (/\s/.test(trimmedEmail)) {
    details.issues.push('Contains whitespace')
  }

  if (/\.\./.test(trimmedEmail)) {
    details.issues.push('Contains consecutive dots')
  }

  if (/^\.|\.$/.test(localPart)) {
    details.issues.push('Local part starts or ends with dot')
  }

  // 3. Check domain validity and TLD
  const hasDot = domain.includes('.')
  const startsWithDot = domain.startsWith('.')
  const hasValidTld = /\.[a-zA-Z]{2,}$/.test(domain)
  let tldIsIcannApproved = false

  if (startsWithDot) {
    details.issues.push('Domain cannot start with a dot')
  } else if (!hasDot) {
    details.issues.push('Domain must contain a dot (e.g., example.com)')
  } else if (!hasValidTld) {
    details.issues.push('Invalid TLD (top-level domain)')
  } else {
    // Extract TLD and check against approved list
    const tldMatch = domain.match(/\.([a-zA-Z]+)$/)
    if (tldMatch) {
      const tld = tldMatch[1].toLowerCase()
      tldIsIcannApproved = validTLDs.has(tld)
      if (!tldIsIcannApproved) {
        details.issues.push(`TLD ".${tld}" is not ICANN-approved`)
      }
    }
  }

  if (domain.length > 255) {
    details.issues.push('Domain exceeds 255 characters')
  }

  if (localPart.length > 64) {
    details.issues.push('Local part exceeds 64 characters')
  }

  // 3b. Check for reserved/documentation domains
  if (reservedDomains.has(domain.toLowerCase())) {
    details.issues.push(`"${domain}" is a reserved example domain — not deliverable`)
  }

  // 4. Check for role-based emails (granular by type)
  const localLower = localPart.toLowerCase()
  let roleMatch = null
  let roleBasedPenalty = 0

  // Role-based penalties: noreply=-5, info=-10, support/admin=-20, abuse/postmaster=-40, marketing=-15
  if (localLower === 'noreply' || localLower === 'no-reply') {
    roleMatch = 'noreply'
    roleBasedPenalty = -5
  } else if (localLower === 'info' || localLower.startsWith('info+') || localLower.startsWith('info.')) {
    roleMatch = 'info'
    roleBasedPenalty = -10
  } else if (localLower === 'support' || localLower.startsWith('support+') || localLower.startsWith('support.')) {
    roleMatch = 'support'
    roleBasedPenalty = -20
  } else if (localLower === 'admin' || localLower.startsWith('admin+') || localLower.startsWith('admin.')) {
    roleMatch = 'admin'
    roleBasedPenalty = -20
  } else if (localLower === 'abuse' || localLower === 'postmaster' || localLower === 'mailer-daemon' || localLower === 'hostmaster') {
    roleMatch = 'abuse'
    roleBasedPenalty = -40
  } else if (localLower === 'marketing' || localLower === 'newsletter' || localLower.startsWith('marketing+') || localLower.startsWith('newsletter+')) {
    roleMatch = 'marketing'
    roleBasedPenalty = -15
  } else if (localLower === 'help' || localLower === 'contact' || localLower.startsWith('help+') || localLower.startsWith('contact+')) {
    roleMatch = 'help'
    roleBasedPenalty = -10
  } else {
    // Check remaining role prefixes
    for (const role of roleBasedPrefixes) {
      if (localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')) {
        roleMatch = role
        roleBasedPenalty = -15
        break
      }
    }
  }

  if (roleMatch) {
    details.roleBasedEmail = true
    details.roleBasedType = roleMatch
    details.roleBasedPenalty = roleBasedPenalty
  }

  // 5. Check for known disposable domains
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domain.toLowerCase().includes(disposable))) {
    isDisposable = true
    details.isDisposable = true
  }

  // 5b. Username risk scoring - deterministic ranges
  details.usernameHeuristics = []
  const vowelPattern = /[aeiou]/gi

  let usernameRiskScore = 0

  // Calculate username risk signals
  const vowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
  const vowelRatioLocal = vowelsInLocal / localPart.length

  if (vowelRatioLocal < 0.15) {
    usernameRiskScore += 5
    details.usernameHeuristics.push('Low vowel ratio')
  }

  const specialCharsInLocal = (localPart.match(/[^a-zA-Z0-9.-]/g) || []).length
  if (specialCharsInLocal >= 2) {
    usernameRiskScore += 3
    details.usernameHeuristics.push('Multiple special characters')
  }

  const hasUppercase = /[A-Z]/.test(localPart)
  const hasLowercase = /[a-z]/.test(localPart)
  const hasNumbers = /\d/.test(localPart)
  const hasSpecial = /[^a-zA-Z0-9.-]/.test(localPart)
  const entropyIndicators = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length

  if (entropyIndicators >= 3) {
    usernameRiskScore += 7
    details.usernameHeuristics.push('High character entropy')
  }

  if (localPart.length > 32) {
    usernameRiskScore += 5
    details.usernameHeuristics.push('Exceptionally long username')
  }

  // Check for bot-like patterns (but exclude known role-based emails)
  const botPatterns = ['bot', 'test', 'mailer', 'daemon', 'notification', 'alert', 'auto', 'auto-', 'generated', 'tmp', 'temp']
  if (!roleMatch && botPatterns.some(pattern => localLower.includes(pattern))) {
    usernameRiskScore += 6
    details.usernameHeuristics.push('Matches automated patterns')
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(localPart)) {
    usernameRiskScore += 4
    details.usernameHeuristics.push('Repeated characters detected')
  }

  // Check for gibberish patterns: repeated trigrams
  const trigrams = new Map()
  for (let i = 0; i <= localLower.length - 3; i++) {
    const trigram = localLower.substring(i, i + 3)
    trigrams.set(trigram, (trigrams.get(trigram) || 0) + 1)
  }
  const repeatedTrigrams = Array.from(trigrams.values()).filter(count => count >= 2).length
  if (repeatedTrigrams >= 3) {
    usernameRiskScore += 8
    details.usernameHeuristics.push('Repeated letter patterns (gibberish)')
  }

  // Check for high consonant density (only for non-role-based usernames)
  // Do NOT flag known role-based emails like "noreply"
  if (!roleMatch) {
    for (let i = 0; i <= localLower.length - 5; i++) {
      const window = localLower.substring(i, i + 5)
      const consonantCount = (window.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
      if (consonantCount >= 4) {
        usernameRiskScore += 6
        details.usernameHeuristics.push('Heavy consonant clusters')
        break
      }
    }
  }

  // Map risk score to penalty using deterministic numerical ranges
  // For very gibberish-like patterns (10+ chars AND 70%+ consonants), apply heavier penalty
  let baseUsernamePenalty = 0
  let usernameRiskLevel = 'None'

  const consonantRatio = (localPart.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length / localPart.length
  const isBotLike = localPart.length >= 10 && consonantRatio >= 0.70

  if (usernameRiskScore >= 30 || isBotLike) {
    baseUsernamePenalty = -20
    usernameRiskLevel = 'Extreme'
  } else if (usernameRiskScore >= 20) {
    baseUsernamePenalty = -15
    usernameRiskLevel = 'Heavy'
  } else if (usernameRiskScore >= 10) {
    baseUsernamePenalty = -10
    usernameRiskLevel = 'Moderate'
  } else if (usernameRiskScore >= 5) {
    baseUsernamePenalty = -5
    usernameRiskLevel = 'Mild'
  }

  details.usernameRiskScore = usernameRiskScore
  details.usernameRiskLevel = usernameRiskLevel
  details.baseUsernamePenalty = baseUsernamePenalty

  // 5c. Domain heuristic flags
  details.domainHeuristics = []

  if (domain.length > 40) {
    details.domainHeuristics.push('Domain name is unusually long')
  }

  // Check for random gibberish (no vowels or too many consonants in a row)
  const domainWithoutDots = domain.replace(/\./g, '')
  const domainVowelCount = (domainWithoutDots.match(vowelPattern) || []).length
  const domainVowelRatio = domainVowelCount / domainWithoutDots.length
  if (domainVowelRatio < 0.15) {
    details.domainHeuristics.push('Domain looks randomly generated')
  }

  // Check if TLD is rarely used
  const tldMatchHeuristic = domain.match(/\.([a-zA-Z]+)$/)
  if (tldMatchHeuristic) {
    const tld = tldMatchHeuristic[1].toLowerCase()
    if (rarelyUsedTLDs.has(tld)) {
      details.domainHeuristics.push(`TLD ".${tld}" is rarely used`)
    }
  }

  // 6. Use mailchecker for comprehensive validation if available
  let mailcheckerValid = true
  let hasBadReputation = false

  if (typeof MailChecker !== 'undefined' && details.issues.length === 0 && !isDisposable) {
    try {
      mailcheckerValid = MailChecker.isValid(trimmedEmail)
      if (!mailcheckerValid) {
        hasBadReputation = true
        details.hasBadReputation = true
      }
    } catch (error) {
      mailcheckerValid = false
    }
  }

  // 7. DNS/MX Record Lookup (moved to API endpoint for server-side processing)
  details.domainExists = null
  details.mxRecords = []
  details.mxProviderBonus = 0  // Will be populated from API response

  // 8. Calculate Deliverability Score (0-100) using professional scoring model
  let score = 100
  details.penalties = []
  details.bonuses = []

  // HIGH-RISK PENALTIES (direct deliverability failure)
  if (details.issues.length > 0 && !details.hasSyntaxError) {
    score = 0
    details.penalties.push({ issue: 'Format invalid', deduction: 100 })
  } else if (details.hasSyntaxError) {
    // Softer classification for syntax errors (not -100, more informative)
    score = 0
    details.syntaxErrorType = details.issues[0] || 'Syntax error'
  } else if (isDisposable) {
    score = 0
    details.penalties.push({ issue: 'Disposable/temporary email domain', deduction: 100 })
  } else {
    // Spammy TLD detection
    const tldMatchSpammy = domain.match(/\.([a-zA-Z]+)$/)
    if (tldMatchSpammy) {
      const tld = tldMatchSpammy[1].toLowerCase()
      if (spammyTLDs.has(tld)) {
        score = Math.max(0, score - 50)
        details.penalties.push({ issue: `Spammy TLD (.${tld})`, deduction: 50 })
      }
    }

    // MEDIUM-RISK PENALTIES (5-25 points)
    // Role-based email penalty (using granular penalties based on role type)
    if (roleMatch) {
      const rolePenaltyAbs = Math.abs(roleBasedPenalty)
      score = Math.max(0, score + roleBasedPenalty)
      const roleDesc = roleMatch === 'abuse' ? 'RFC special case (abuse/postmaster)' : `Role-based email (${roleMatch})`
      details.penalties.push({ issue: roleDesc, deduction: rolePenaltyAbs })
    }

    // Apply username risk penalty with provider-aware scaling
    if (baseUsernamePenalty < 0) {
      const providerInfo = getProviderInfo(domain)
      const scaledPenalty = Math.ceil(baseUsernamePenalty * providerInfo.scaling)
      
      score = Math.max(0, score + scaledPenalty)
      details.scaledUsernamePenalty = scaledPenalty
      details.providerScaling = providerInfo.scaling
      details.penalties.push({ issue: `Username patterns (${usernameRiskLevel})`, deduction: Math.abs(scaledPenalty) })
    }

    // Domain is known free-mail provider - professional tiers
    const domainLower = domain.toLowerCase()

    // Provider-specific reputation adjustments (cleaned-up mapping)
    if (domainLower === 'gmail.com') {
      score = Math.min(100, score + 5)
      details.bonuses.push({ feature: 'Gmail (premium provider)', bonus: 5 })
    } else if (domainLower === 'outlook.com' || domainLower === 'hotmail.com') {
      score = Math.min(100, score + 2)
      details.bonuses.push({ feature: 'Outlook/Hotmail (established)', bonus: 2 })
    } else if (domainLower === 'icloud.com') {
      score = Math.min(100, score + 3)
      details.bonuses.push({ feature: 'iCloud (trusted provider)', bonus: 3 })
    } else if (domainLower === 'yahoo.com') {
      score = Math.min(100, score + 1)
      details.bonuses.push({ feature: 'Yahoo (established provider)', bonus: 1 })
    } else if (domainLower === 'protonmail.com' || domainLower === 'mail.protonmail.com') {
      score = Math.min(100, score + 4)
      details.bonuses.push({ feature: 'ProtonMail (high-trust)', bonus: 4 })
    } else if (domainLower === 'zoho.com') {
      // Zoho is legitimate, neutral scoring
    } else if (domainLower === 'aol.com') {
      score = Math.max(0, score - 3)
      details.penalties.push({ issue: 'AOL (legacy, may have higher bounce)', deduction: 3 })
    } else if (domainLower === 'gmx.com' || domainLower === 'mail.com') {
      score = Math.max(0, score - 5)
      details.penalties.push({ issue: 'GMX/Mail.com (lower reputation)', deduction: 5 })
    } else if (domainLower === 'yandex.com' || domainLower === 'yandex.ru') {
      score = Math.max(0, score - 5)
      details.penalties.push({ issue: 'Yandex (regional provider)', deduction: 5 })
    }

    if (hasBadReputation) {
      score = Math.max(0, score - 20)
      details.penalties.push({ issue: 'Known bad reputation provider', deduction: 20 })
    }

    // LOW-RISK PENALTIES (1-5 points)
    if (/\s/.test(trimmedEmail)) {
      score = Math.max(0, score - 10)
      details.penalties.push({ issue: 'Whitespace trimmed from address', deduction: 10 })
    }

    // Subdomain penalty: only true subdomains (3+ labels before TLD)
    const domainParts = domain.split('.')
    const commonSecondLevelDomains = ['co.uk', 'co.nz', 'co.jp', 'com.au', 'com.br', 'com.mx', 'co.id', 'co.in', 'co.ke', 'co.za']
    const isCommonSLD = commonSecondLevelDomains.some(sld => domain.toLowerCase().endsWith('.' + sld))
    const subdomainLabelCount = isCommonSLD ? domainParts.length - 2 : domainParts.length - 1

    if (subdomainLabelCount >= 3) {
      score = Math.max(0, score - 3)
      details.penalties.push({ issue: 'Subdomain-based email', deduction: 3 })
    }

    if (/[^\x00-\x7F]/.test(trimmedEmail)) {
      score = Math.max(0, score - 5)
      details.penalties.push({ issue: 'Non-ASCII characters in address', deduction: 5 })
    }

    if (!tldIsIcannApproved && hasValidTld) {
      score = Math.max(0, score - 15)
      details.penalties.push({ issue: 'Non-ICANN approved TLD', deduction: 15 })
    }
  }

  // Map final score to professional-grade status labels
  if (score === 0) {
    if (details.hasSyntaxError) {
      details.deliverabilityMeaning = `Invalid syntax: ${details.syntaxErrorType}`
    } else if (isDisposable) {
      details.deliverabilityMeaning = 'Disposable / Temporary'
    } else if (details.issues.length > 0) {
      details.deliverabilityMeaning = 'Undeliverable domain'
    } else {
      details.deliverabilityMeaning = 'Guaranteed bad / invalid'
    }
  } else if (score >= 95) {
    details.deliverabilityMeaning = 'Excellent (very high deliverability)'
  } else if (score >= 80) {
    details.deliverabilityMeaning = 'Strong / Deliverable'
  } else if (score >= 60) {
    details.deliverabilityMeaning = 'Likely deliverable but risk exists'
  } else if (score >= 40) {
    details.deliverabilityMeaning = 'Questionable / risky'
  } else if (score >= 1) {
    details.deliverabilityMeaning = 'Very likely invalid'
  }

  details.deliverabilityScore = score

  // Determine final validity
  const basicValid = details.issues.length === 0 && !details.hasSyntaxError
  const disposableInvalid = isDisposable ? false : true
  details.valid = basicValid && disposableInvalid && (typeof MailChecker !== 'undefined' ? mailcheckerValid : true)
  details.isInvalid = isDisposable || details.hasSyntaxError || (details.issues.length > 0 && !details.hasSyntaxError)

  return details
}

export function emailValidator(text) {
  const emails = text.split(/[,\n]+/).map(e => e.trim()).filter(e => e)

  const results = emails.map((email) => validateSingleEmail(email))

  return {
    total: results.length,
    valid: results.filter(r => r.valid).length,
    invalid: results.filter(r => !r.valid).length,
    mailcheckerAvailable: typeof MailChecker !== 'undefined',
    dnsCheckAvailable: true,
    averageDeliverabilityScore: Math.round(results.reduce((sum, r) => sum + r.deliverabilityScore, 0) / results.length),
    results,
  }
}
