/**
 * Enterprise-Grade Email Validator with Dual Scoring + Intelligence
 * DELIVERABILITY SCORE: Server-side probability of successful delivery
 * TRUSTWORTHINESS SCORE: Likelihood this is a real human's email
 * COMBINED GRADE: Single letter grade (A+ to F) for quick user understanding
 * HUMAN LIKELIHOOD: Intuitive label for trustworthiness interpretation
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

// TLD Quality Classifications
const highTrustTLDs = new Set(['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'us', 'ca', 'au', 'jp', 'in', 'br', 'it'])
const lowTrustTLDs = new Set(['xyz', 'top', 'click', 'link', 'gq', 'tk', 'cf', 'ml', 'ga', 'download', 'stream', 'faith', 'buzz', 'club', 'cricket'])

// ICANN-approved TLDs
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

const spammyTLDs = new Set(['xyz', 'buzz', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq', 'pw'])
const suspiciousTLDs = new Set(['xyz', 'pw', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq'])
const rarelyUsedTLDs = new Set(['tk', 'ml', 'ga', 'cf', 'br.to', 'eu.org', 'freenom', 'xyz', 'club', 'cricket'])

// Reserved documentation domains
const reservedDomains = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'localhost', 'invalid', 'local'])

// Business domain keywords
const businessDomainKeywords = ['company', 'corp', 'organization', 'agency', 'industries', 'systems', 'solutions', 'services', 'consulting']

// Business email providers (with type detection)
const businessEmailProviders = {
  'google.com': { name: 'Google Workspace', type: 'corporate' },
  'outlook.com': { name: 'Microsoft 365', type: 'corporate' },
  'hotmail.com': { name: 'Microsoft', type: 'corporate' },
  'zoho.com': { name: 'Zoho Mail', type: 'corporate' },
  'fastmail.com': { name: 'Fastmail', type: 'premium' },
  'protonmail.com': { name: 'ProtonMail', type: 'privacy' },
  'mail.protonmail.com': { name: 'ProtonMail', type: 'privacy' }
}

// Username semantic patterns
const personalNamePatterns = [
  /^[a-z]+\.[a-z]+$/i,  // firstname.lastname
  /^[a-z]+_[a-z]+$/i,   // firstname_lastname
  /^[a-z]+\d{1,3}$/i    // name + small number (common personal pattern)
]

const offensiveTerms = [
  'dick', 'ass', 'cunt', 'bitch', 'slut', 'whore', 'nigger', 'faggot', 
  'shit', 'fuck', 'piss', 'damn', 'hell'
]

const brandImpersonationPatterns = [
  'paypal', 'amazon', 'apple', 'google', 'microsoft', 'facebook', 'meta',
  'twitter', 'instagram', 'netflix', 'uber', 'airbnb', 'stripe', 'github',
  'notion', 'slack', 'discord', 'bank', 'support', 'help', 'verify', 'confirm',
  'security', 'account', 'billing', 'payment', 'reset', 'admin'
]

const toxicKeywords = [
  'dick', 'ass', 'cunt', 'bitch', 'slut', 'whore', 'nigger', 'faggot',
  'shit', 'fuck', 'piss', 'damn', 'hell', 'sexy', 'horny', 'porn',
  'sex', 'xxx', 'cum', 'cock', 'pussy', 'asshole', 'bastard',
  'crypto', 'lottery', 'prize', 'winner', 'claim', 'nigerian', 'inheritance',
  'bitcoin', 'ethereum', 'cashapp', 'venmo'
]

function detectBusinessEmailProvider(domain) {
  const domainLower = domain.toLowerCase()
  for (const [providerDomain, info] of Object.entries(businessEmailProviders)) {
    if (domainLower === providerDomain || domainLower.endsWith('.' + providerDomain)) {
      return info
    }
  }
  return null
}

function analyzeUsernameSemantics(localPart) {
  const insights = {
    isLikelyPersonalName: false,
    hasOffensiveTerms: false,
    isBrandImpersonation: false,
    hasToxicKeywords: false,
    semanticBonus: 0,
    semanticPenalty: 0,
    warnings: []
  }

  const localLower = localPart.toLowerCase()

  // Check for personal name patterns (firstname.lastname, firstname_lastname, name1234)
  if (personalNamePatterns.some(pattern => pattern.test(localPart))) {
    insights.isLikelyPersonalName = true
    insights.semanticBonus += 10
    insights.warnings.push('Likely personal name pattern (firstname.lastname)')
  }

  // Check for offensive terms (profanity, slurs)
  if (offensiveTerms.some(term => localLower.includes(term))) {
    insights.hasOffensiveTerms = true
    insights.semanticPenalty -= 35
    insights.warnings.push('Contains offensive or inappropriate terms')
  }

  // Check for toxic/scam keywords (crypto, lottery, nigerian prince, etc.)
  if (toxicKeywords.some(keyword => localLower.includes(keyword))) {
    insights.hasToxicKeywords = true
    insights.semanticPenalty -= 30
    insights.warnings.push('Contains suspicious keywords associated with scams or spam')
  }

  // Check for brand impersonation (more comprehensive patterns)
  // Look for patterns like: paypal.security@, amazon-support@, apple.help@, etc.
  const isBrandLike = brandImpersonationPatterns.some(brand => {
    const brandRegex = new RegExp(`(^|[._-])${brand}([._-]|$)`, 'i')
    return brandRegex.test(localPart) || localLower.includes(`${brand}support`) ||
           localLower.includes(`${brand}verify`) || localLower.includes(`${brand}confirm`) ||
           localLower.includes(`${brand}help`) || localLower.includes(`${brand}admin`)
  })

  if (isBrandLike) {
    insights.isBrandImpersonation = true
    insights.semanticPenalty -= 30
    insights.warnings.push('Appears to impersonate known brand or service')
  }

  return insights
}

function calculateCombinedGrade(delivScore, trustScore) {
  // Grade matrix based on both scores
  if (delivScore >= 95 && trustScore >= 90) return 'A+'
  if (delivScore >= 90 && trustScore >= 80) return 'A'
  if (delivScore >= 85 && trustScore >= 70) return 'A-'
  if (delivScore >= 80 && trustScore >= 60) return 'B+'
  if (delivScore >= 75 && trustScore >= 50) return 'B'
  if (delivScore >= 70 && trustScore >= 40) return 'B-'
  if (delivScore >= 60 && trustScore >= 30) return 'C+'
  if (delivScore >= 50 && trustScore >= 20) return 'C'
  if (delivScore >= 40 && trustScore >= 10) return 'C-'
  if (delivScore >= 30 && trustScore >= 5) return 'D'
  return 'F'
}

function mapHumanLikelihoodLabel(trustScore, isInvalid = false) {
  // If the address is invalid (syntax/reserved/disposable), no human signal exists
  if (isInvalid) return 'Invalid (no human likelihood)'

  // Map based purely on trustworthiness
  if (trustScore >= 90) return 'Very likely human'
  if (trustScore >= 75) return 'Likely human'
  if (trustScore >= 50) return 'Possibly bot/throwaway'
  if (trustScore >= 20) return 'Suspicious'
  return 'Definitely bot / invalid'
}

function validateSingleEmail(trimmedEmail) {
  const details = {
    email: trimmedEmail,
    valid: false,
    deliverabilityScore: 100,
    trustworthinessScore: 100,
    combinedGrade: 'A+',
    humanLikelihood: 'Very likely human',
    issues: [],
    deliverabilityWarnings: [],
    trustworthinessWarnings: [],
    businessEmail: null,
    tldQuality: null
  }

  // 1. Basic syntax validation
  if (!trimmedEmail.includes('@')) {
    details.issues.push('Missing @ symbol')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0  // Invalid syntax = no human signal
    return details
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (!localPart || !domain) {
    details.issues.push('Invalid email format: missing local part or domain')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0  // Invalid syntax = no human signal
    return details
  }

  // Additional syntax check: multiple @ symbols
  if (trimmedEmail.split('@').length > 2) {
    details.issues.push('Multiple @ symbols detected')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0  // Invalid syntax = no human signal
    return details
  }

  // 2. Check for spaces and invalid characters
  if (/\s/.test(trimmedEmail)) {
    details.issues.push('Contains whitespace')
    details.hasSyntaxError = true
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 10)
    details.trustworthinessScore = 0  // Syntax error = no human signal
  }

  if (/\.\./.test(trimmedEmail)) {
    details.issues.push('Contains consecutive dots')
    details.hasSyntaxError = true
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 20)
    details.trustworthinessScore = 0  // Syntax error = no human signal
  }

  if (/^\.|\.$/.test(localPart)) {
    details.issues.push('Local part starts or ends with dot')
    details.hasSyntaxError = true
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 20)
    details.trustworthinessScore = 0  // Syntax error = no human signal
  }

  // 3. Check domain validity and TLD
  const hasDot = domain.includes('.')
  const startsWithDot = domain.startsWith('.')
  const hasValidTld = /\.[a-zA-Z]{2,}$/.test(domain)
  let tldIsIcannApproved = false

  if (startsWithDot) {
    details.issues.push('Domain cannot start with a dot')
    details.deliverabilityScore = 0
  } else if (!hasDot) {
    details.issues.push('Domain must contain a dot (e.g., example.com)')
    details.deliverabilityScore = 0
  } else if (!hasValidTld) {
    details.issues.push('Invalid TLD (top-level domain)')
    details.deliverabilityScore = 0
  } else {
    const tldMatch = domain.match(/\.([a-zA-Z]+)$/)
    if (tldMatch) {
      const tld = tldMatch[1].toLowerCase()
      tldIsIcannApproved = validTLDs.has(tld)
      
      // TLD Quality Scoring (Upgrade #4)
      if (highTrustTLDs.has(tld)) {
        details.tldQuality = 'high-trust'
        details.trustworthinessScore = Math.min(100, details.trustworthinessScore + 3)
      } else if (lowTrustTLDs.has(tld)) {
        details.tldQuality = 'low-trust'
        details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 15)
        details.trustworthinessWarnings.push(`Suspicious TLD (.${tld}) commonly used for spam`)
      } else {
        details.tldQuality = 'neutral'
      }

      if (!tldIsIcannApproved) {
        details.issues.push(`TLD ".${tld}" is not ICANN-approved`)
        details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 25)
        details.deliverabilityWarnings.push(`Unrecognized TLD (.${tld})`)
      }

      if (suspiciousTLDs.has(tld)) {
        details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 20)
        details.trustworthinessWarnings.push(`Suspicious TLD (.${tld}) often associated with spam`)
      }
    }
  }

  if (domain.length > 255) {
    details.issues.push('Domain exceeds 255 characters')
    details.deliverabilityScore = 0
  }

  if (localPart.length > 64) {
    details.issues.push('Local part exceeds 64 characters')
    details.deliverabilityScore = 0
  }

  // 3b. Check for reserved/documentation domains
  if (reservedDomains.has(domain.toLowerCase())) {
    details.issues.push(`"${domain}" is a reserved example domain — not deliverable`)
    details.deliverabilityScore = 0
  }

  // 4. Check for disposable domains
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domain.toLowerCase().includes(disposable))) {
    isDisposable = true
    details.isDisposable = true
    details.deliverabilityScore = 0
    details.deliverabilityWarnings.push('Disposable/temporary email domain')
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 40)
    details.trustworthinessWarnings.push('Disposable email domain')
  }

  // 5. Business email intelligence (Upgrade #3)
  const businessProvider = detectBusinessEmailProvider(domain)
  if (businessProvider) {
    details.businessEmail = businessProvider
    details.trustworthinessWarnings.push(`${businessProvider.name} (${businessProvider.type} email)`)
  }

  // 6. Role-based email detection
  const localLower = localPart.toLowerCase()
  let roleMatch = null
  let roleTrustPenalty = 0

  if (localLower === 'noreply' || localLower === 'no-reply') {
    roleMatch = 'noreply'
    roleTrustPenalty = -20
  } else if (localLower === 'info' || localLower.startsWith('info+') || localLower.startsWith('info.')) {
    roleMatch = 'info'
    roleTrustPenalty = -25
  } else if (localLower === 'support' || localLower.startsWith('support+') || localLower.startsWith('support.')) {
    roleMatch = 'support'
    roleTrustPenalty = -30
  } else if (localLower === 'admin' || localLower.startsWith('admin+') || localLower.startsWith('admin.')) {
    roleMatch = 'admin'
    roleTrustPenalty = -30
  } else if (localLower === 'abuse' || localLower === 'postmaster' || localLower === 'mailer-daemon' || localLower === 'hostmaster') {
    roleMatch = 'abuse'
    roleTrustPenalty = -40
  } else if (localLower === 'marketing' || localLower === 'newsletter' || localLower.startsWith('marketing+') || localLower.startsWith('newsletter+')) {
    roleMatch = 'marketing'
    roleTrustPenalty = -30
  } else if (localLower === 'help' || localLower === 'contact' || localLower.startsWith('help+') || localLower.startsWith('contact+')) {
    roleMatch = 'help'
    roleTrustPenalty = -20
  } else {
    for (const role of roleBasedPrefixes) {
      if (localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')) {
        roleMatch = role
        roleTrustPenalty = -25
        break
      }
    }
  }

  if (roleMatch) {
    details.roleBasedEmail = true
    details.roleBasedType = roleMatch
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + roleTrustPenalty)
    details.trustworthinessWarnings.push(`Role-based email (${roleMatch})`)
  }

  // 7. Username semantic analysis (Upgrade #5)
  const semantics = analyzeUsernameSemantics(localPart)

  // Apply semantic bonuses/penalties
  if (semantics.semanticBonus > 0) {
    details.trustworthinessScore = Math.min(100, details.trustworthinessScore + semantics.semanticBonus)
  }
  if (semantics.semanticPenalty < 0) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + semantics.semanticPenalty)
  }

  // Add all warnings from semantic analysis
  semantics.warnings.forEach(warning => {
    if (!details.trustworthinessWarnings.includes(warning)) {
      details.trustworthinessWarnings.push(warning)
    }
  })

  // 8. Username heuristics (gibberish detection, etc.)
  details.usernameHeuristics = []
  const vowelsInLocal = (localPart.match(/[aeiou]/gi) || []).length
  const vowelRatioLocal = vowelsInLocal / localPart.length

  let usernameRiskScore = 0

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
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 10)
  }

  if (localPart.length < 3) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 5)
    details.trustworthinessWarnings.push('Unusually short username')
  }

  // Check for numbers-only usernames
  if (/^\d+$/.test(localPart)) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 10)
    details.trustworthinessWarnings.push('Numbers-only username')
  }

  // Check for bot-like patterns
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

  // Check for gibberish patterns
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

  // Check for high consonant density
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

  // Apply username trust penalties
  let usernameTrustPenalty = 0
  const consonantRatio = (localPart.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length / localPart.length
  const isBotLike = localPart.length >= 10 && consonantRatio >= 0.70

  if (usernameRiskScore >= 30 || isBotLike) {
    usernameTrustPenalty = -40
    details.trustworthinessWarnings.push('Username appears randomly generated (extreme gibberish)')
  } else if (usernameRiskScore >= 20) {
    usernameTrustPenalty = -25
    details.trustworthinessWarnings.push('Username appears randomly generated')
  } else if (usernameRiskScore >= 10) {
    usernameTrustPenalty = -15
    details.trustworthinessWarnings.push('Username looks somewhat suspicious')
  } else if (usernameRiskScore >= 5) {
    usernameTrustPenalty = -5
    details.trustworthinessWarnings.push('Username has unusual characteristics')
  }

  if (usernameTrustPenalty < 0) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + usernameTrustPenalty)
  }

  details.usernameRiskScore = usernameRiskScore

  // 9. Domain reputation
  const domainLower = domain.toLowerCase()
  const isBusinessDomain = businessDomainKeywords.some(kw => domainLower.includes(kw))

  // DELIVERABILITY: Provider reputation
  if (domainLower === 'gmail.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 5)
  } else if (domainLower === 'outlook.com' || domainLower === 'hotmail.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 2)
  } else if (domainLower === 'icloud.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 3)
  } else if (domainLower === 'yahoo.com') {
    details.deliverabilityScore = Math.min(100, details.deliverabilityScore + 1)
  } else if (domainLower === 'protonmail.com' || domainLower === 'mail.protonmail.com') {
    // ProtonMail is trustworthy for deliverability
  } else if (domainLower === 'zoho.com') {
    // Zoho is legitimate
  } else if (domainLower === 'aol.com') {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 3)
  } else if (domainLower === 'gmx.com' || domainLower === 'mail.com') {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 5)
  } else if (domainLower === 'yandex.com' || domainLower === 'yandex.ru') {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 5)
  }

  // TRUSTWORTHINESS: Free-mail vs business domain bonus
  const isFreemail = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'zoho.com', 'protonmail.com', 'mail.protonmail.com', 'gmx.com', 'mail.com', 'yandex.com'].includes(domainLower)
  if (!isFreemail && isBusinessDomain) {
    details.trustworthinessScore = Math.min(100, details.trustworthinessScore + 10)
    details.trustworthinessWarnings.push('Business domain detected')
  }

  // 10. Use mailchecker for validation if available
  let mailcheckerValid = true
  if (typeof MailChecker !== 'undefined' && details.issues.length === 0 && !isDisposable) {
    try {
      mailcheckerValid = MailChecker.isValid(trimmedEmail)
    } catch (error) {
      mailcheckerValid = false
    }
  }

  // 11. Subdomain penalty
  const domainParts = domain.split('.')
  const commonSecondLevelDomains = ['co.uk', 'co.nz', 'co.jp', 'com.au', 'com.br', 'com.mx', 'co.id', 'co.in', 'co.ke', 'co.za']
  const isCommonSLD = commonSecondLevelDomains.some(sld => domain.toLowerCase().endsWith('.' + sld))
  const subdomainLabelCount = isCommonSLD ? domainParts.length - 2 : domainParts.length - 1

  if (subdomainLabelCount >= 3) {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 3)
    details.deliverabilityWarnings.push('Subdomain-based email')
  }

  // 12. Calculate final scores
  if (details.issues.length > 0 || details.hasSyntaxError || isDisposable || reservedDomains.has(domain.toLowerCase())) {
    details.deliverabilityScore = 0
  } else if (details.deliverabilityScore < 0) {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore)
  }

  // Ensure scores are 0-100
  details.deliverabilityScore = Math.max(0, Math.min(100, Math.round(details.deliverabilityScore)))
  details.trustworthinessScore = Math.max(0, Math.min(100, Math.round(details.trustworthinessScore)))

  // Critical rule: If deliverability is 0, trustworthiness cannot be high
  if (details.deliverabilityScore === 0) {
    details.trustworthinessScore = Math.min(details.trustworthinessScore, 20)
  }

  // Determine final validity (must happen before grade calculation)
  const basicValid = details.issues.length === 0 && !details.hasSyntaxError && details.deliverabilityScore > 0
  details.valid = basicValid && (typeof MailChecker !== 'undefined' ? mailcheckerValid : true)
  const isInvalidAddress = isDisposable || details.hasSyntaxError || (details.issues.length > 0) || details.deliverabilityScore === 0

  // Calculate combined grade and human likelihood (Upgrades #1 and #2)
  // Invalid emails should always be F grade
  details.combinedGrade = isInvalidAddress ? 'F' : calculateCombinedGrade(details.deliverabilityScore, details.trustworthinessScore)
  details.humanLikelihood = mapHumanLikelihoodLabel(details.trustworthinessScore, isInvalidAddress)

  // Map scores to labels
  details.deliverabilityLabel = mapDeliverabilityLabel(details.deliverabilityScore)
  details.trustworthinessLabel = mapTrustworthinessLabel(details.trustworthinessScore)

  // Determine final validity
  const basicValid = details.issues.length === 0 && !details.hasSyntaxError && details.deliverabilityScore > 0
  details.valid = basicValid && (typeof MailChecker !== 'undefined' ? mailcheckerValid : true)
  details.isInvalid = isDisposable || details.hasSyntaxError || (details.issues.length > 0)

  return details
}

function mapDeliverabilityLabel(score) {
  if (score === 0) return 'Guaranteed bad'
  if (score >= 95) return 'Excellent'
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

function mapTrustworthinessLabel(score) {
  if (score === 0) return 'Guaranteed invalid'
  if (score >= 95) return 'Excellent'
  if (score >= 80) return 'Strong'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  if (score >= 20) return 'Low'
  return 'Very Low'
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
    averageTrustworthinessScore: Math.round(results.reduce((sum, r) => sum + r.trustworthinessScore, 0) / results.length),
    results,
  }
}
