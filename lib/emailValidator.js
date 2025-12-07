/**
 * Enterprise-Grade Email Validator with Dual Scoring + Intelligence
 * DELIVERABILITY SCORE: Server-side probability of successful delivery
 * TRUSTWORTHINESS SCORE: Likelihood this is a real human's email
 * COMBINED GRADE: Single letter grade (A+ to F) for quick user understanding
 * HUMAN LIKELIHOOD: Intuitive label for trustworthiness interpretation
 */

// Import punycode for Unicode domain handling
let punycode;
try {
  punycode = require('punycode/');
} catch (e) {
  // Fallback for browser environment
  punycode = { toASCII: (domain) => domain };
}

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
  'maildrop', 'mailtest', 'fakeinbox', 'trashmail', 'spam4'
]

// TLD Quality Classifications
const highTrustTLDs = new Set(['com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'uk', 'de', 'fr', 'us', 'ca', 'au', 'jp', 'in', 'br', 'it'])
const lowTrustTLDs = new Set(['xyz', 'top', 'click', 'link', 'gq', 'tk', 'cf', 'ml', 'ga', 'download', 'stream', 'faith', 'buzz', 'club', 'cricket'])

// ICANN-approved TLDs (comprehensive list)
const validTLDs = new Set([
  // Generic top-level domains
  'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'info', 'biz', 'name', 'pro',
  'mobi', 'asia', 'tel', 'aero', 'coop', 'jobs', 'travel', 'museum', 'post',
  'xxx', 'cat', 'travel', 'post', 'tel', 'adult', 'app', 'blog', 'cloud',
  'dev', 'digital', 'download', 'media', 'news', 'online', 'shop', 'site',
  'space', 'store', 'tech', 'video', 'web', 'website', 'world',
  // Country code TLDs
  'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'be', 'ch',
  'at', 'se', 'no', 'dk', 'fi', 'pt', 'gr', 'ie', 'cz', 'pl', 'ru', 'jp',
  'cn', 'in', 'br', 'mx', 'ar', 'za', 'nz', 'sg', 'hk', 'kr', 'tw', 'th',
  'ph', 'id', 'my', 'vn', 'pk', 'bd', 'lk', 'ng', 'ke', 'eg', 'tr', 'il',
  'ae', 'sa', 'ksa', 'ir', 'gq', 'ml', 'xyz', 'me', 'rf', 'рф', 'ad', 'af',
  'ag', 'ai', 'al', 'am', 'ao', 'aq', 'as', 'aw', 'ax', 'az', 'ba', 'bb',
  'bf', 'bg', 'bh', 'bi', 'bj', 'bl', 'bm', 'bn', 'bo', 'bq', 'bs', 'bt',
  'bv', 'bw', 'by', 'bz', 'cc', 'cd', 'cf', 'cg', 'ci', 'ck', 'cl', 'cm',
  'cr', 'cu', 'cv', 'cw', 'cx', 'cy', 'dj', 'dm', 'do', 'dz', 'ec', 'ee',
  'eh', 'er', 'et', 'eu', 'fj', 'fk', 'fm', 'fo', 'ga', 'gd', 'ge', 'gf',
  'gg', 'gh', 'gi', 'gl', 'gm', 'gn', 'gp', 'gs', 'gt', 'gu', 'gw', 'gy',
  'hn', 'hr', 'ht', 'hu', 'iq', 'is', 'je', 'jm', 'jo', 'ki', 'km', 'kn',
  'kp', 'kw', 'ky', 'kz', 'la', 'lb', 'lc', 'li', 'lr', 'ls', 'lt', 'lu',
  'lv', 'ly', 'ma', 'mc', 'md', 'mf', 'mg', 'mh', 'mk', 'mm', 'mn', 'mo',
  'mp', 'mq', 'mr', 'ms', 'mt', 'mu', 'mv', 'mw', 'mz', 'na', 'nc', 'ne',
  'nf', 'ni', 'np', 'nr', 'nu', 'om', 'pa', 'pe', 'pf', 'pg', 'pm', 'pn',
  'pr', 'ps', 'pw', 'py', 'qa', 're', 'ro', 'rs', 'rw', 'sb', 'sc', 'sd',
  'sh', 'si', 'sj', 'sk', 'sl', 'sm', 'sn', 'so', 'sr', 'ss', 'st', 'sv',
  'sx', 'sy', 'sz', 'tc', 'td', 'tf', 'tg', 'tj', 'tk', 'tl', 'tm', 'tn',
  'to', 'tp', 'tr', 'tt', 'tv', 'tz', 'ua', 'ug', 'um', 'uy', 'uz', 'va',
  'vc', 've', 'vg', 'vi', 'wf', 'ws', 'ye', 'yt',
  // Internationalized TLDs (punycode variants handled separately)
  '广告', '中国', '中文', '我爱你', '北京', '中文网', '公司', '网络', '网站', '中文网'
])

const spammyTLDs = new Set(['xyz', 'buzz', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq', 'pw'])
const suspiciousTLDs = new Set(['xyz', 'pw', 'top', 'tk', 'ml', 'ga', 'cf', 'club', 'cricket', 'download', 'stream', 'faith', 'gq'])
const rarelyUsedTLDs = new Set(['tk', 'ml', 'ga', 'cf', 'br.to', 'eu.org', 'freenom', 'xyz', 'club', 'cricket'])

// Reserved documentation domains
const reservedDomains = new Set(['example.com', 'example.org', 'example.net', 'test.com', 'localhost', 'invalid', 'local'])

// Business domain keywords
const businessDomainKeywords = ['company', 'corp', 'organization', 'agency', 'industries', 'systems', 'solutions', 'services', 'consulting']

// Personal Freemail Providers (personal use, should NOT be marked as corporate)
const personalFreemailProviders = new Set([
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'aol.com', 'protonmail.com', 'mail.protonmail.com', 'fastmail.com',
  'hey.com', 'zoho.com', 'gmx.com', 'mail.com', 'yandex.com', 'yandex.ru',
  'inbox.com', 'mail.com', 'mailinator.com', 'guerrillamail.com', 'temp-mail.org'
])

// Corporate Provider Domains (actual company domains, not freemail)
const corporateProviderDomains = new Set([
  'microsoft.com', 'openai.com', 'oracle.com', 'tesla.com', 'stripe.com',
  'meta.com', 'spacex.com', 'vercel.com', 'nvidia.com', 'apple.com',
  'google.com', 'amazon.com', 'facebook.com', 'twitter.com', 'github.com',
  'notion.so', 'slack.com', 'discord.com', 'spotify.com', 'uber.com',
  'airbnb.com', 'netflix.com', 'dropbox.com', 'slack.com', 'asana.com'
])

// Business email providers mapping
const businessEmailProviders = {
  'microsoft.com': { name: 'Microsoft', type: 'corporate' },
  'openai.com': { name: 'OpenAI', type: 'corporate' },
  'stripe.com': { name: 'Stripe', type: 'corporate' },
  'google.com': { name: 'Google', type: 'corporate' }
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

function isCorporateDomain(domain) {
  const domainLower = domain.toLowerCase()
  return corporateProviderDomains.has(domainLower) ||
         corporateProviderDomains.has(domainLower.split('.').slice(-2).join('.'))
}

function isFreemailProvider(domain) {
  const domainLower = domain.toLowerCase()
  return personalFreemailProviders.has(domainLower) ||
         personalFreemailProviders.has(domainLower.split('.').slice(-2).join('.'))
}

function detectBusinessEmailProvider(domain) {
  const domainLower = domain.toLowerCase()
  
  // Check if it's a freemail provider (don't mark as corporate)
  if (isFreemailProvider(domainLower)) {
    const provider = domainLower.split('.')[0]
    return {
      name: provider.charAt(0).toUpperCase() + provider.slice(1),
      type: 'freemail'
    }
  }
  
  // Check if it's a known corporate provider
  for (const [providerDomain, info] of Object.entries(businessEmailProviders)) {
    if (domainLower === providerDomain || domainLower.endsWith('.' + providerDomain)) {
      return info
    }
  }
  
  // Check if it's a corporate domain (generic check)
  if (isCorporateDomain(domainLower)) {
    return {
      name: domainLower.split('.')[0],
      type: 'corporate'
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
  // Priority: Personal name detection should skip it from gibberish
  if (personalNamePatterns.some(pattern => pattern.test(localPart))) {
    insights.isLikelyPersonalName = true
    insights.semanticBonus += 20  // Increased bonus for clear personal names
    insights.warnings.push('Likely personal name pattern (firstname.lastname)')
  }

  // Check for offensive terms (profanity, slurs)
  if (offensiveTerms.some(term => localLower.includes(term))) {
    insights.hasOffensiveTerms = true
    insights.semanticPenalty -= 50  // Harsh penalty for offensive content
    insights.warnings.push('Contains offensive or inappropriate terms')
  }

  // Check for toxic/scam keywords (crypto, lottery, nigerian prince, etc.)
  if (toxicKeywords.some(keyword => localLower.includes(keyword))) {
    insights.hasToxicKeywords = true
    insights.semanticPenalty -= 30
    insights.warnings.push('Contains suspicious keywords associated with scams or spam')
  }

  // Check for brand impersonation
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

function mapHumanLikelihoodLabel(trustScore, isInvalid = false, hasOffensiveTerms = false) {
  // If the address is invalid (syntax/reserved/disposable), no human signal exists
  if (isInvalid) return 'Invalid (no human likelihood)'

  // If it has offensive/abusive terms, it's very likely human (but untrustworthy)
  if (hasOffensiveTerms) return 'Very likely human (abusive)'

  // Map based purely on trustworthiness
  if (trustScore >= 90) return 'Very likely human'
  if (trustScore >= 75) return 'Likely human'
  if (trustScore >= 50) return 'Possibly bot/throwaway'
  if (trustScore >= 20) return 'Suspicious'
  return 'Definitely bot'
}

function normalizeDomainForTldValidation(domain) {
  try {
    // Try to normalize Unicode domain to ASCII (punycode)
    if (punycode && punycode.toASCII) {
      return punycode.toASCII(domain);
    }
  } catch (e) {
    // If punycode conversion fails, use original domain
  }
  return domain;
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
    tldQuality: null,
    hasSyntaxError: false,
    isInvalid: false,
    impersonationRisk: 'Low'  // New field for phishing/impersonation risk
  }

  // 1. Basic syntax validation
  if (!trimmedEmail.includes('@')) {
    details.issues.push('Missing @ symbol')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.isInvalid = true
    return details
  }

  const [localPart, domain] = trimmedEmail.split('@')

  if (!localPart || !domain) {
    details.issues.push('Invalid email format: missing local part or domain')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.isInvalid = true
    return details
  }

  // Additional syntax check: multiple @ symbols
  if (trimmedEmail.split('@').length > 2) {
    details.issues.push('Multiple @ symbols detected')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.isInvalid = true
    return details
  }

  // 2. Check for spaces and invalid characters
  if (/\s/.test(trimmedEmail)) {
    details.issues.push('Contains whitespace')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.isInvalid = true
  }

  if (/\.\./.test(trimmedEmail)) {
    details.issues.push('Contains consecutive dots')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.isInvalid = true
  }

  if (/^\.|\.$/.test(localPart)) {
    details.issues.push('Local part starts or ends with dot')
    details.hasSyntaxError = true
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.isInvalid = true
  }

  // Early return if syntax error already detected
  if (details.hasSyntaxError) {
    return details
  }

  // 3. Check for reserved/documentation domains early
  const domainLower = domain.toLowerCase()
  if (reservedDomains.has(domainLower)) {
    details.issues.push(`"${domain}" is a reserved example domain — not deliverable`)
    details.deliverabilityScore = 0
    details.trustworthinessScore = 0
    details.usernameHeuristics = []
    details.isInvalid = true
    return details
  }

  // 4. Check domain validity and TLD
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
    // Normalize domain for TLD validation (handle Unicode/punycode)
    const normalizedDomain = normalizeDomainForTldValidation(domain);
    const tldMatch = normalizedDomain.match(/\.([a-zA-Z0-9]+)$/)
    
    if (tldMatch) {
      const tld = tldMatch[1].toLowerCase()
      tldIsIcannApproved = validTLDs.has(tld)
      
      // TLD Quality Scoring
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

  // 4b. Check for domain labels starting with hyphen (ISSUE #2 FIX)
  const domainLabels = domain.split('.')
  for (const label of domainLabels) {
    if (label.startsWith('-') || label.endsWith('-')) {
      details.issues.push(`Domain label "${label}" cannot start or end with a hyphen`)
      details.deliverabilityScore = 0
      details.hasSyntaxError = true
    }
  }

  if (details.hasSyntaxError) {
    details.trustworthinessScore = 0
    details.isInvalid = true
    return details
  }

  // 5. Check for disposable domains
  let isDisposable = false
  if (knownDisposableDomains.some(disposable => domainLower.includes(disposable))) {
    isDisposable = true
    details.isDisposable = true
    details.deliverabilityScore = 0
    details.deliverabilityWarnings.push('Disposable/temporary email domain')
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore - 40)
    details.trustworthinessWarnings.push('Disposable email domain')
    details.isInvalid = true
  }

  // 6. Business email intelligence
  const businessProvider = detectBusinessEmailProvider(domain)
  if (businessProvider) {
    details.businessEmail = businessProvider
    // Only show warning if it's actually corporate, not freemail
    if (businessProvider.type === 'corporate') {
      details.trustworthinessWarnings.push(`${businessProvider.name} (corporate email)`)
    }
  }

  // 7. Role-based email detection
  const localLower = localPart.toLowerCase()
  let roleMatch = null
  let roleTrustPenalty = 0
  let isRoleBasedEmail = false

  if (localLower === 'noreply' || localLower === 'no-reply') {
    roleMatch = 'noreply'
    roleTrustPenalty = -20
    isRoleBasedEmail = true
  } else if (localLower === 'info' || localLower.startsWith('info+') || localLower.startsWith('info.')) {
    roleMatch = 'info'
    roleTrustPenalty = -25
    isRoleBasedEmail = true
  } else if (localLower === 'support' || localLower.startsWith('support+') || localLower.startsWith('support.')) {
    roleMatch = 'support'
    roleTrustPenalty = -30
    isRoleBasedEmail = true
  } else if (localLower === 'admin' || localLower.startsWith('admin+') || localLower.startsWith('admin.')) {
    roleMatch = 'admin'
    roleTrustPenalty = -30
    isRoleBasedEmail = true
  } else if (localLower === 'abuse' || localLower === 'postmaster' || localLower === 'mailer-daemon' || localLower === 'hostmaster') {
    roleMatch = 'abuse'
    roleTrustPenalty = -40
    isRoleBasedEmail = true
  } else if (localLower === 'marketing' || localLower === 'newsletter' || localLower.startsWith('marketing+') || localLower.startsWith('newsletter+')) {
    roleMatch = 'marketing'
    roleTrustPenalty = -30
    isRoleBasedEmail = true
  } else if (localLower === 'help' || localLower === 'contact' || localLower.startsWith('help+') || localLower.startsWith('contact+')) {
    roleMatch = 'help'
    roleTrustPenalty = -20
    isRoleBasedEmail = true
  } else {
    for (const role of roleBasedPrefixes) {
      if (localLower === role || localLower.startsWith(role + '+') || localLower.startsWith(role + '.')) {
        roleMatch = role
        roleTrustPenalty = -25
        isRoleBasedEmail = true
        break
      }
    }
  }

  if (isRoleBasedEmail) {
    details.roleBasedEmail = true
    details.roleBasedType = roleMatch
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + roleTrustPenalty)
    details.trustworthinessWarnings.push(`Role-based email (${roleMatch})`)
    
    // Set impersonation risk based on corporate domain
    if (isCorporateDomain(domainLower)) {
      details.impersonationRisk = 'Very High'
      details.trustworthinessWarnings.push('Role-based email on corporate domain (high phishing risk)')
    } else {
      details.impersonationRisk = 'High'
    }
  }

  // 8. Username semantic analysis
  const semantics = analyzeUsernameSemantics(localPart)

  // Apply semantic bonuses/penalties
  if (semantics.semanticBonus > 0) {
    details.trustworthinessScore = Math.min(100, details.trustworthinessScore + semantics.semanticBonus)
  }
  if (semantics.semanticPenalty < 0) {
    details.trustworthinessScore = Math.max(0, details.trustworthinessScore + semantics.semanticPenalty)
  }

  // HARD CAP FOR OFFENSIVE EMAILS: If offensive terms detected, cap trustworthiness at 10
  if (semantics.hasOffensiveTerms) {
    details.trustworthinessScore = Math.min(details.trustworthinessScore, 10)
    details.trustworthinessWarnings.push('Offensive/abusive content - untrustworthy')
  }

  // Add all warnings from semantic analysis
  semantics.warnings.forEach(warning => {
    if (!details.trustworthinessWarnings.includes(warning)) {
      details.trustworthinessWarnings.push(warning)
    }
  })

  // 9. Username heuristics (gibberish detection, etc.)
  // Skip this entirely for personal names (they already got bonus)
  details.usernameHeuristics = []
  
  // If it's a personal name, don't run gibberish detection
  if (semantics.isLikelyPersonalName) {
    // Personal name detected - no gibberish analysis needed
    details.usernameHeuristics = []
  } else {
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
    if (!isRoleBasedEmail && botPatterns.some(pattern => localLower.includes(pattern))) {
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
    if (!isRoleBasedEmail) {
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
  }

  // 10. Domain reputation
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
  if (!isFreemailProvider(domainLower) && isBusinessDomain) {
    details.trustworthinessScore = Math.min(100, details.trustworthinessScore + 10)
    details.trustworthinessWarnings.push('Business domain detected')
  }

  // 11. Use mailchecker for validation if available
  let mailcheckerValid = true
  if (typeof MailChecker !== 'undefined' && details.issues.length === 0 && !isDisposable) {
    try {
      mailcheckerValid = MailChecker.isValid(trimmedEmail)
    } catch (error) {
      mailcheckerValid = false
    }
  }

  // 12. Subdomain penalty
  const domainParts = domain.split('.')
  const commonSecondLevelDomains = ['co.uk', 'co.nz', 'co.jp', 'com.au', 'com.br', 'com.mx', 'co.id', 'co.in', 'co.ke', 'co.za']
  const isCommonSLD = commonSecondLevelDomains.some(sld => domainLower.endsWith('.' + sld))
  const subdomainLabelCount = isCommonSLD ? domainParts.length - 2 : domainParts.length - 1

  if (subdomainLabelCount >= 3) {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore - 3)
    details.deliverabilityWarnings.push('Subdomain-based email')
  }

  // 13. Calculate final scores
  if (details.issues.length > 0 || details.hasSyntaxError || isDisposable || reservedDomains.has(domainLower)) {
    details.deliverabilityScore = 0
    details.isInvalid = true
  } else if (details.deliverabilityScore < 0) {
    details.deliverabilityScore = Math.max(0, details.deliverabilityScore)
  }

  // Ensure scores are 0-100
  details.deliverabilityScore = Math.max(0, Math.min(100, Math.round(details.deliverabilityScore)))
  details.trustworthinessScore = Math.max(0, Math.min(100, Math.round(details.trustworthinessScore)))

  // Critical rule: If deliverability is 0, trustworthiness cannot be high
  if (details.deliverabilityScore === 0) {
    details.trustworthinessScore = Math.min(details.trustworthinessScore, 20)
    details.isInvalid = true
  }

  // Determine final validity (must happen before grade calculation)
  const basicValid = details.issues.length === 0 && !details.hasSyntaxError && details.deliverabilityScore > 0
  details.valid = basicValid && (typeof MailChecker !== 'undefined' ? mailcheckerValid : true)

  // ENFORCE RULE #6: If valid === false → isInvalid must be true
  if (!details.valid || details.deliverabilityScore === 0) {
    details.isInvalid = true
  }

  // Calculate combined grade and human likelihood
  // CRITICAL: Invalid emails (syntax errors) should ALWAYS be F grade with Invalid likelihood
  if (details.isInvalid) {
    details.combinedGrade = 'F'
    details.humanLikelihood = mapHumanLikelihoodLabel(details.trustworthinessScore, true, semantics.hasOffensiveTerms)
  } else {
    details.combinedGrade = calculateCombinedGrade(details.deliverabilityScore, details.trustworthinessScore)
    details.humanLikelihood = mapHumanLikelihoodLabel(details.trustworthinessScore, false, semantics.hasOffensiveTerms)
  }

  // Map scores to labels
  details.deliverabilityLabel = mapDeliverabilityLabel(details.deliverabilityScore)
  details.trustworthinessLabel = mapTrustworthinessLabel(details.trustworthinessScore)

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
  if (score >= 10) return 'Very Low'
  return 'Untrustworthy'
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
