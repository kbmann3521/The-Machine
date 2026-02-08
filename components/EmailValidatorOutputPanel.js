import React, { useState, useRef } from 'react'
import styles from '../styles/tool-output.module.css'
import OutputTabs from './OutputTabs'

function extractDmarcPolicy(dmarcRecord) {
  if (!dmarcRecord) return null

  // Extract p= value from DMARC record
  // Example: v=DMARC1; p=reject; rua=mailto:...
  const policyMatch = dmarcRecord.match(/p=([a-z]+)/i)
  if (policyMatch && policyMatch[1]) {
    return policyMatch[1].toLowerCase()
  }
  return null
}

function hasDmarcReporting(dmarcRecord) {
  if (!dmarcRecord) return false

  // Check for rua= (aggregate reports) or ruf= (forensic reports)
  const hasRua = /rua=/i.test(dmarcRecord)
  const hasRuf = /ruf=/i.test(dmarcRecord)

  return hasRua || hasRuf
}

function analyzeSPFQuality(spfRecord) {
  if (!spfRecord) return { score: 0, description: '' }

  const spfLower = spfRecord.toLowerCase()
  let qualityScore = 0
  let description = ''

  // Check for strict fail policy (-all)
  const hasStrictFail = /-all/.test(spfLower)
  const hasSoftFail = /~all/.test(spfLower)
  const hasNeutral = /\?all/.test(spfLower)
  const hasPass = /\+all/.test(spfLower)

  // Check for missing terminal qualifier (ends abruptly without -all, ~all, ?all, or +all)
  const hasTerminal = /[-~?+]all$/.test(spfLower)

  // Count mechanisms (include:, ip4:, ip6:, a, mx, ptr, etc.)
  const mechanisms = (spfRecord.match(/\b(include|ip4|ip6|a|mx|ptr|exists):/gi) || []).length
  const dnsLookups = (spfRecord.match(/\b(include|a|mx|ptr|exists):/gi) || []).length

  // === CRITICAL RULE: Positive points ONLY with -all ===
  // Never award bonus if no strict fail policy

  // Check for overly permissive +all (always penalize)
  if (hasPass) {
    return { score: -8, description: 'SPF allows all senders (+all) — effectively disables SPF' }
  }

  // Check for deprecated ptr mechanism
  if (/\bptr:/i.test(spfRecord)) {
    return { score: -5, description: 'Contains deprecated ptr mechanism' }
  }

  // Check for too many DNS lookups (>10)
  if (dnsLookups > 10) {
    return { score: -5, description: 'Too many DNS lookups (>10) — SPF can fail at runtime' }
  }

  // === STRICT FAIL POLICY (-all) ===
  if (hasStrictFail) {
    // Minimal, tight scope (few mechanisms)
    if (mechanisms <= 3) {
      qualityScore = 5
      description = 'Strict and minimal SPF policy (-all) — strong authentication'
    } else {
      // Strict but more complex
      qualityScore = 3
      description = 'Strict SPF policy (-all) — domain actively prevents spoofing'
    }
    return { score: qualityScore, description }
  }

  // === NO STRICT FAIL (-all) ===
  // Cannot earn bonus, but may or may not be penalized

  if (hasSoftFail) {
    // Soft fail: better than nothing, but permissive
    return { score: 0, description: 'Soft SPF policy (~all) — permissive but functional' }
  }

  if (hasNeutral) {
    // Neutral policy: essentially a no-op
    return { score: 0, description: 'Neutral SPF policy (?all) — informational only' }
  }

  if (!hasTerminal) {
    // No terminal qualifier (implicit ?all, like Gmail)
    // Informational, not penalized, not rewarded
    return { score: 0, description: 'SPF present but non-enforcing (no terminal qualifier)' }
  }

  // Fallback (should not reach)
  return { score: 0, description: 'SPF record present' }
}

function analyzeDMARCQuality(dmarcRecord) {
  if (!dmarcRecord) return { score: 0, description: '' }

  const dmarcLower = dmarcRecord.toLowerCase()
  let qualityScore = 0
  let description = ''

  // === Check for invalid/malformed DMARC ===
  if (!dmarcLower.startsWith('v=dmarc1')) {
    return { score: -5, description: 'DMARC record present but invalid — policy ignored by receivers' }
  }

  // Extract policy (p=)
  const policyMatch = dmarcLower.match(/p=([a-z]+)/i)
  if (!policyMatch) {
    return { score: -5, description: 'DMARC record present but invalid — missing policy' }
  }

  const policy = policyMatch[1].toLowerCase()

  // Validate policy value
  if (!['none', 'quarantine', 'reject'].includes(policy)) {
    return { score: -5, description: 'DMARC record present but invalid — unrecognized policy value' }
  }

  // === POLICY SCORING (mutually exclusive by design) ===
  if (policy === 'reject') {
    qualityScore = 5
    description = 'DMARC policy requests rejection of unauthenticated mail'
  } else if (policy === 'quarantine') {
    qualityScore = 3
    description = 'DMARC policy requests quarantine for unauthenticated mail'
  } else if (policy === 'none') {
    // p=none is neutral — no bonus, no penalty
    // Fold monitoring status into this single interpretation
    qualityScore = 0
    description = 'DMARC present (monitoring mode — no enforcement)'
  }

  // === ALIGNMENT BONUS (optional, +1) ===
  // Check for strict alignment: adkim=s; aspf=s
  const hasStrictDkim = /adkim\s*=\s*s/i.test(dmarcRecord)
  const hasStrictSpf = /aspf\s*=\s*s/i.test(dmarcRecord)

  if (hasStrictDkim && hasStrictSpf) {
    // Only add alignment bonus (max DMARC would be +6)
    if (qualityScore > 0) {
      qualityScore += 1
      description += ' — with strict alignment'
    } else if (qualityScore === 0 && policy !== 'none') {
      // If p=none and has strict alignment, keep neutral (no bonus for p=none)
      description += ' — with strict alignment'
    }
  }

  return { score: qualityScore, description }
}

function analyzeMXSanity(mxRecords) {
  if (!mxRecords || mxRecords.length === 0) {
    return { score: 0, description: '' }
  }

  let worstScore = 0
  let worstReason = ''

  // === CHECK 1: MX pointing to CNAME (highest priority penalty) ===
  // This is the strongest signal, so we check it first
  const mxWithCname = mxRecords.filter(mx => mx.isCname)
  if (mxWithCname.length > 0) {
    worstScore = -5
    worstReason = 'MX record points to a CNAME — non-standard and may cause delivery failures'
    return { score: worstScore, description: worstReason }
  }

  // === CHECK 2: Single MX with very high priority (≥100) ===
  if (mxRecords.length === 1 && mxRecords[0].priority >= 100) {
    worstScore = -3
    worstReason = 'Single high-priority MX detected — no failover configured'
    return { score: worstScore, description: worstReason }
  }

  // === CHECK 3: 3+ MX records with identical priority ===
  if (mxRecords.length >= 3) {
    // Check if all MX records share the same priority
    const priorities = new Set(mxRecords.map(mx => mx.priority))
    if (priorities.size === 1) {
      worstScore = -2
      worstReason = 'Multiple MX records share the same priority — delivery order may be inconsistent'
      return { score: worstScore, description: worstReason }
    }
  }

  // No issues detected
  return { score: 0, description: '' }
}

function analyzeNSDiversity(nsRecords) {
  if (!nsRecords || nsRecords.length === 0) {
    return { score: 0, description: '' }
  }

  const numNs = nsRecords.length

  // === Single NS record (bad for resilience) ===
  if (numNs === 1) {
    return {
      score: -1,
      description: 'Single nameserver configured — no redundancy'
    }
  }

  // === Multiple NS records (2+) ===
  // Detect provider diversity by analyzing domain patterns

  // Extract the domain part from each nameserver (e.g., "cloudflare.com" from "ns1.cloudflare.com")
  const getNsProvider = (nsHostname) => {
    const parts = nsHostname.toLowerCase().split('.')
    // Take last 2 parts (domain.tld)
    if (parts.length >= 2) {
      return parts.slice(-2).join('.')
    }
    return nsHostname.toLowerCase()
  }

  // Get unique providers
  const providers = new Set(nsRecords.map(ns => {
    const hostname = ns.nameserver || ns
    return getNsProvider(hostname)
  }))

  const numProviders = providers.size
  const allSameProvider = numProviders === 1

  // === All NS from different providers (best) ===
  if (numProviders === numNs) {
    return {
      score: 2,
      description: 'Multiple nameservers from different providers — excellent DNS resilience'
    }
  }

  // === Multiple NS, some diversity (good) ===
  // Has redundancy AND some provider variation (not all identical)
  if (!allSameProvider && numProviders >= 2) {
    return {
      score: 1,
      description: 'Multiple nameservers with good provider diversity — good DNS resilience'
    }
  }

  // === All NS from same provider (neutral) ===
  // Not bad (still has redundancy), but less diverse
  if (allSameProvider) {
    return {
      score: 0,
      description: `Multiple nameservers, all from same provider (${Array.from(providers)[0]}) — redundancy configured`
    }
  }

  return { score: 0, description: 'Multiple nameservers configured' }
}

function analyzeDnssec(dnssecEnabled) {
  if (!dnssecEnabled) {
    return { score: 0, description: '' }
  }

  return {
    score: 1,
    description: 'DNSSEC enabled — improved DNS integrity'
  }
}

function getMxProvider(mxHostname) {
  if (!mxHostname) return null

  const hostname = mxHostname.toLowerCase()

  // Major managed providers (enterprise-grade)
  // Google (Gmail, Google Workspace)
  if (hostname.includes('gmail-smtp-in') || hostname.includes('aspmx.l.google.com') || hostname.includes('aspmx.google.com') || hostname.includes('googlemail.com') || hostname.includes('.google.com')) {
    return 'google'
  }
  // Microsoft (Outlook, Hotmail, Office 365)
  if (hostname.includes('protection.outlook.com') || hostname.includes('outlook.com') || hostname.includes('mail.protection.outlook.com')) {
    return 'microsoft'
  }
  // Yahoo/AOL
  if (hostname.includes('yahoodns.net') || hostname.includes('mxlogic.net')) {
    return 'yahoo'
  }
  // Apple (iCloud)
  if (hostname.includes('mail.icloud.com') || hostname.includes('.apple.com')) {
    return 'apple'
  }
  // Zoho
  if (hostname.includes('zoho.com')) {
    return 'zoho'
  }
  // ProtonMail
  if (hostname.includes('protonmail') || hostname.includes('pmg.mail.proton') || hostname.includes('protonmail.ch')) {
    return 'proton'
  }
  // Fastmail
  if (hostname.includes('fastmail.com') || hostname.includes('messagingengine.com')) {
    return 'fastmail'
  }
  // Amazon (Amazon SES, Amazon Workspace)
  if (hostname.includes('amazon-smtp') || hostname.includes('amazonses.com') || hostname.includes('inbound-smtp') || hostname.includes('bounce.amazonaws.com')) {
    return 'amazon'
  }
  // SendGrid
  if (hostname.includes('sendgrid.net') || hostname.includes('sendgrid.com')) {
    return 'sendgrid'
  }
  // Mailgun
  if (hostname.includes('mailgun.org') || hostname.includes('mailgun.com')) {
    return 'mailgun'
  }

  return null
}

function getCampaignReadinessLabel(score) {
  if (score >= 90) return 'Excellent'
  else if (score >= 75) return 'Good'
  else if (score >= 55) return 'Risky'
  else if (score >= 30) return 'Poor'
  else return 'Very Poor'
}

function calculateDomainHealthScore(tldQuality, isDomainCorporate) {
  let dhs = 77 // Base: domain exists and can receive mail

  // TLD Quality
  if (tldQuality === 'high-trust') {
    dhs += 5
  } else if (tldQuality === 'low-trust') {
    dhs -= 10
  }

  // Corporate Domain
  if (isDomainCorporate) {
    dhs += 5
  }

  return Math.max(0, Math.min(100, dhs))
}

function calculateDnsRecordPenalties(dnsRecord) {
  const penalties = []
  let totalPenalty = 0

  if (!dnsRecord) {
    return { penalties, totalPenalty }
  }

  // NOTE: If mailHostType === 'none', email is invalid (no mail server records at all)
  // This is not a DHS penalty; it's a prerequisite failure.
  // Frontend handles this by not calculating Campaign Readiness score.

  if (dnsRecord.mailHostType === 'fallback') {
    // Has A/AAAA but no MX - fallback delivery
    penalties.push({ label: 'No MX Records (Fallback Only)', points: -25, description: 'Using A/AAAA fallback instead of MX records' })
    totalPenalty += 25
  } else if (dnsRecord.mailHostType === 'mx' && dnsRecord.mxRecords && dnsRecord.mxRecords.length > 0) {
    // Check MX provider quality
    const primaryMx = dnsRecord.mxRecords[0]
    if (primaryMx && primaryMx.hostname) {
      const mxProvider = getMxProvider(primaryMx.hostname)

      if (mxProvider) {
        // Major managed provider - small bonus (reduces risk)
        penalties.push({ label: 'MX Provider Quality', points: 3, description: `Mail routed through ${mxProvider} (managed provider) — more reliable` })
        totalPenalty -= 3
      } else {
        // Check if it looks like a custom/self-hosted setup (mail.domain.com pattern)
        const isLikelyCustom = primaryMx.hostname.startsWith('mail.') ||
                               primaryMx.hostname.includes(`mail.${dnsRecord.domain}`) ||
                               /^mail\d*\./.test(primaryMx.hostname)

        if (isLikelyCustom) {
          // Self-hosted mail server - penalty (increases risk)
          penalties.push({ label: 'Custom Mail Infrastructure', points: -5, description: 'Self-hosted mail server — potentially less stable' })
          totalPenalty += 5
        }
        // Otherwise: unknown provider but could be legitimate hosted - don't penalize
      }
    }

    // Check MX sanity first (before redundancy bonus)
    const mxSanity = analyzeMXSanity(dnsRecord.mxRecords)

    if (mxSanity.score < 0) {
      // MX configuration has issues - apply sanity penalty (overrides redundancy bonus)
      penalties.push({ label: 'MX Configuration Issue', points: mxSanity.score, description: mxSanity.description })
      totalPenalty += Math.abs(mxSanity.score)
    } else if (dnsRecord.mxRecords.length >= 2) {
      // No sanity issues found - apply redundancy bonus for multiple MX
      penalties.push({ label: 'MX Redundancy', points: 2, description: 'Multiple MX records configured — redundant, mature mail setup' })
      totalPenalty -= 2
    }
  }

  // SPF analysis (penalty for missing, bonus for strict/clean)
  if (!dnsRecord.spfRecord) {
    penalties.push({ label: 'No SPF Record', points: -5, description: 'Missing SPF authentication' })
    totalPenalty += 5
  } else {
    // Analyze SPF quality for potential bonuses
    const spfQuality = analyzeSPFQuality(dnsRecord.spfRecord)
    if (spfQuality.score > 0) {
      // Bonus for good SPF
      penalties.push({ label: 'Strict SPF Policy', points: spfQuality.score, description: spfQuality.description })
      totalPenalty -= spfQuality.score
    } else if (spfQuality.score < 0) {
      // Penalty for problematic SPF
      penalties.push({ label: 'SPF Configuration Issue', points: Math.abs(spfQuality.score), description: spfQuality.description })
      totalPenalty += Math.abs(spfQuality.score)
    }
    // score === 0 means acceptable but not bonus-worthy (e.g., soft fail, neutral)
  }

  // DMARC policy strength scoring
  if (!dnsRecord.dmarcRecord) {
    // No DMARC at all - significant risk
    penalties.push({ label: 'No DMARC Policy', points: -10, description: 'No DMARC policy published — domain does not advertise authentication expectations' })
    totalPenalty += 10
  } else {
    // Use the comprehensive DMARC quality analyzer
    const dmarcQuality = analyzeDMARCQuality(dnsRecord.dmarcRecord)

    if (dmarcQuality.score !== 0) {
      // Only add penalty/bonus item if there's a meaningful score
      let labelPrefix = dmarcQuality.score > 0 ? 'DMARC Policy' : 'DMARC Policy'
      penalties.push({
        label: labelPrefix,
        points: dmarcQuality.score,
        description: dmarcQuality.description
      })
      totalPenalty -= dmarcQuality.score
    } else if (dmarcQuality.score === 0) {
      // Neutral scoring (p=none) - show it but with 0 impact
      penalties.push({
        label: 'DMARC Policy',
        points: 0,
        description: dmarcQuality.description
      })
    }
  }

  // NS diversity analysis (nameserver resilience)
  if (dnsRecord.nsRecords && dnsRecord.nsRecords.length > 0) {
    const nsDiversity = analyzeNSDiversity(dnsRecord.nsRecords)

    if (nsDiversity.score > 0) {
      // Bonus for good NS resilience
      penalties.push({
        label: 'NS Diversity',
        points: nsDiversity.score,
        description: nsDiversity.description
      })
      totalPenalty -= nsDiversity.score
    } else if (nsDiversity.score < 0) {
      // Penalty for single NS
      penalties.push({
        label: 'NS Resilience',
        points: Math.abs(nsDiversity.score),
        description: nsDiversity.description
      })
      totalPenalty += Math.abs(nsDiversity.score)
    }
    // score === 0 means neutral (multiple NS but no major providers, or no data)
  }

  // DNSSEC analysis (optional polish signal)
  if (dnsRecord.dnssecEnabled) {
    const dnssecScore = analyzeDnssec(dnsRecord.dnssecEnabled)
    if (dnssecScore.score > 0) {
      penalties.push({
        label: 'DNSSEC',
        points: dnssecScore.score,
        description: dnssecScore.description
      })
      totalPenalty -= dnssecScore.score
    }
  }

  // SUBDOMAIN MAIL SANITY CHECK
  // Check if this is a subdomain (has parent domain) and if mail infra is inherited
  if (dnsRecord.parentDomain) {
    const parentDomain = dnsRecord.parentDomain
    let inheritedSignals = []

    // Check if MX records are inherited from parent (subdomain has no explicit MX)
    if ((!dnsRecord.mxRecords || dnsRecord.mxRecords.length === 0) && parentDomain.mxRecords && parentDomain.mxRecords.length > 0) {
      inheritedSignals.push('MX')
    }

    // Check if SPF is inherited (no explicit SPF on subdomain but exists on parent)
    if (!dnsRecord.spfRecord && parentDomain.spfRecord) {
      inheritedSignals.push('SPF')
    }

    // Check if DMARC is inherited (no explicit DMARC on subdomain but exists on parent)
    if (!dnsRecord.dmarcRecord && parentDomain.dmarcRecord) {
      inheritedSignals.push('DMARC')
    }

    if (inheritedSignals.length > 0) {
      // Mail infrastructure inherited from parent - minor penalty
      const inheritedList = inheritedSignals.join(', ')
      penalties.push({ label: 'Mail Inherited from Parent', points: -5, description: `${inheritedList} records inherited from parent domain (${parentDomain.domain}) — less mature subdomain setup` })
      totalPenalty += 5
    }
  }

  return { penalties, totalPenalty }
}

export default function EmailValidatorOutputPanel({ result }) {
  const [dnsData, setDnsData] = useState({})
  const [loadingEmails, setLoadingEmails] = useState(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const loadingBatchRef = React.useRef(null) // Track which batch of emails we're currently loading
  const [filters, setFilters] = useState({
    status: 'all', // all, valid, invalid
    campaignScore: { min: 0, max: 100 },
    // Specific warning filters
    roleBasedEmail: null, // null, true, false
    abuseContent: [], // array of: 'hateful', 'abusive', 'nsfw' (empty = show all)
    // Domain filters
    tldQuality: 'all', // all, high-trust, neutral, low-trust
    gibberishScore: 'all', // all, high, medium, low
    // DNS filters
    dmarcPolicy: 'all', // all, reject, quarantine, none, missing
    dmarcMonitoring: null, // null, true, false (has rua/ruf)
    spfRecord: null, // null, true, false (has SPF)
    noMxRecords: null, // null, true, false (has MX records)
    nsDiversity: null, // null, true, false (good NS diversity)
    dnssecEnabled: null, // null, true, false (DNSSEC enabled)
  })
  const dnsAbortControllerRef = React.useRef(null)

  // Merge DNS data into results for JSON output and update valid flags/stats based on DNS
  const mergedResult = React.useMemo(() => {
    if (!result) return result

    // Update individual results with DNS data and recalculated valid status
    const updatedResults = result.results.map(emailResult => {
      const dnsRecord = dnsData[emailResult.email]
      const isInvalidByDns = dnsRecord?.mailHostType === 'none'
      const isActuallyValid = emailResult.valid && !emailResult.isDisposable && !isInvalidByDns

      // Calculate DHS based on domain info and apply DNS adjustments
      let baseDhs = calculateDomainHealthScore(emailResult.tldQuality, emailResult.isDomainCorporate)
      let adjustedDhs = baseDhs
      let finalCampaignScore = 0
      let dnsPenalties = []

      // Invalid emails always get campaign score of 0
      if (isActuallyValid && dnsRecord) {
        const { penalties, totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)
        dnsPenalties = penalties
        adjustedDhs = Math.max(0, Math.min(100, adjustedDhs - dnsTotalAdjustment))
        const lcsScore = emailResult.lcsScore || 100
        finalCampaignScore = Math.min(adjustedDhs, lcsScore)
      }

      // Build complete campaignBreakdown with DHS + DNS + LCS for JSON output
      // For invalid emails, don't show scoring breakdown
      let updatedCampaignBreakdown = []

      if (isActuallyValid) {
        updatedCampaignBreakdown = [
          { label: 'Domain Health Score', points: adjustedDhs, description: 'Infrastructure & domain maturity (adjusted with DNS results)', isSectionHeader: true }
        ]

        // Add base DHS items (TLD quality, corporate domain)
        if (emailResult.tldQuality === 'high-trust') {
          updatedCampaignBreakdown.push({ label: 'High-Trust TLD', points: 5, description: 'Established TLD (.com, .org, .edu, etc.)' })
        } else if (emailResult.tldQuality === 'low-trust') {
          updatedCampaignBreakdown.push({ label: 'Low-Trust TLD', points: -10, description: 'Suspicious or uncommon TLD' })
        }

        if (emailResult.isDomainCorporate) {
          updatedCampaignBreakdown.push({ label: 'Corporate Domain', points: 5, description: 'Verified corporate/business domain' })
        }

        // Add DNS penalties if any
        if (dnsPenalties.length > 0) {
          updatedCampaignBreakdown.push(...dnsPenalties)
        }

        // Add LCS section and items from backend breakdown
        updatedCampaignBreakdown.push({ label: 'Local-Part Credibility Score', points: emailResult.lcsScore || 100, description: 'Username quality & engagement likelihood (base: 100)', isSectionHeader: true })

        if (emailResult.campaignBreakdown && emailResult.campaignBreakdown.length > 0) {
          let foundLcsHeader = false
          for (const item of emailResult.campaignBreakdown) {
            if (item.isSectionHeader && item.label.startsWith('Local-Part Credibility Score')) {
              foundLcsHeader = true
              continue
            }
            // Skip separators and the backend's final score item
            if (item.isSeparator || item.label === 'Final Campaign Readiness Score') {
              continue
            }
            if (foundLcsHeader) {
              updatedCampaignBreakdown.push(item)
            }
          }
        }

        // Add final score
        updatedCampaignBreakdown.push({
          label: 'Final Campaign Readiness Score',
          points: finalCampaignScore,
          description: `min(Domain Health Score (${adjustedDhs}), Local-Part Credibility Score (${emailResult.lcsScore || 100}))`
        })
      }

      // Ensure no-mailserver issue is in the issues array
      let issues = emailResult.issues || []
      if (isInvalidByDns && !issues.includes('This domain has no mail server records (MX/A/AAAA). Email cannot be delivered.')) {
        issues = [...issues, 'This domain has no mail server records (MX/A/AAAA). Email cannot be delivered.']
      }

      return {
        ...emailResult,
        valid: isActuallyValid,
        isInvalid: !isActuallyValid || emailResult.isDisposable,
        campaignScore: finalCampaignScore,
        campaignReadiness: isActuallyValid ? getCampaignReadinessLabel(finalCampaignScore) : 'Invalid',
        campaignBreakdown: updatedCampaignBreakdown.length > 0 ? updatedCampaignBreakdown : emailResult.campaignBreakdown,
        issues,
        dnsRecord: dnsRecord || undefined
      }
    })

    // Recalculate summary stats for JSON output (using adjusted identity scores)
    const validCount = updatedResults.filter(r => r.valid).length
    const invalidCount = updatedResults.length - validCount

    const validEmailsForAverage = updatedResults.filter(r => r.valid)
    let newAverageCampaignScore = undefined
    let newAverageCampaignReadiness = undefined

    if (validEmailsForAverage.length > 0) {
      newAverageCampaignScore = Math.round(
        validEmailsForAverage.reduce((sum, r) => sum + r.campaignScore, 0) / validEmailsForAverage.length
      )

      newAverageCampaignReadiness = getCampaignReadinessLabel(newAverageCampaignScore)
    }

    return {
      ...result,
      valid: validCount,
      invalid: invalidCount,
      averageCampaignScore: newAverageCampaignScore,
      averageCampaignReadiness: newAverageCampaignReadiness,
      results: updatedResults
    }
  }, [result, dnsData])

  // Recalculate stats based on DNS data
  // An email is invalid if: backend says invalid OR disposable OR no mail server records
  const recalculatedStats = React.useMemo(() => {
    if (!result || !result.results) return null

    const updatedResults = result.results.map(emailResult => {
      const dnsRecord = dnsData[emailResult.email]
      const isInvalidByDns = dnsRecord?.mailHostType === 'none'
      const isActuallyValid = emailResult.valid && !emailResult.isDisposable && !isInvalidByDns

      // Calculate adjusted campaign score based on DNS penalties
      let adjustedCampaignScore = emailResult.campaignScore || 0
      if (isActuallyValid && dnsRecord) {
        const { totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)
        const baseDhs = calculateDomainHealthScore(emailResult.tldQuality, emailResult.isDomainCorporate)
        const adjustedDhs = Math.max(0, Math.min(100, baseDhs - dnsTotalAdjustment))
        const lcsScore = emailResult.lcsScore || 100
        adjustedCampaignScore = Math.min(adjustedDhs, lcsScore)
      }

      return {
        ...emailResult,
        isActuallyValid,
        adjustedCampaignScore
      }
    })

    const validCount = updatedResults.filter(r => r.isActuallyValid).length
    const invalidCount = updatedResults.length - validCount

    // Recalculate average only for actually valid emails (using adjusted scores)
    const validEmailsForAverage = updatedResults.filter(r => r.isActuallyValid)
    let newAverageCampaignScore = undefined
    let newAverageCampaignReadiness = undefined

    if (validEmailsForAverage.length > 0) {
      newAverageCampaignScore = Math.round(
        validEmailsForAverage.reduce((sum, r) => sum + r.adjustedCampaignScore, 0) / validEmailsForAverage.length
      )

      newAverageCampaignReadiness = getCampaignReadinessLabel(newAverageCampaignScore)
    }

    return {
      valid: validCount,
      invalid: invalidCount,
      averageCampaignScore: newAverageCampaignScore,
      averageCampaignReadiness: newAverageCampaignReadiness
    }
  }, [result, dnsData])

  // Generate CSV export
  const exportToCSV = () => {
    if (!filteredResults || filteredResults.length === 0) {
      alert('No results to export')
      return
    }

    // CSV headers
    const headers = [
      'Email',
      'Status',
      'Campaign Score',
      'Campaign Readiness',
      'DHS Score',
      'LCS Score',
      'DHS Breakdown',
      'LCS Breakdown',
      'Role-Based',
      'TLD Quality',
      'Gibberish Score',
      'MX Records',
      'SPF Record',
      'DMARC Policy',
      'DMARC Monitoring'
    ]

    // CSV rows
    const rows = filteredResults.map(emailResult => {
      const dnsRecord = dnsData[emailResult.email]
      let dmarcPolicy = 'Missing'
      if (dnsRecord?.dmarcRecord) {
        const policyMatch = dnsRecord.dmarcRecord.match(/p=([a-z]+)/i)
        dmarcPolicy = policyMatch ? policyMatch[1].toUpperCase() : 'None'
      }
      const dmarcMonitoring = dnsRecord?.dmarcRecord && (/rua=/i.test(dnsRecord.dmarcRecord) || /ruf=/i.test(dnsRecord.dmarcRecord)) ? 'Yes' : 'No'

      // Extract DHS and LCS scores and breakdowns from campaignBreakdown
      let dhsScore = 'N/A'
      let lcsScore = emailResult.lcsScore || 100
      const dhsBreakdownItems = []
      const lcsBreakdownItems = []

      if (emailResult.campaignBreakdown && emailResult.campaignBreakdown.length > 0) {
        let inDhsSection = false
        let inLcsSection = false

        for (const item of emailResult.campaignBreakdown) {
          if (item.isSectionHeader && item.label.startsWith('Domain Health Score')) {
            inDhsSection = true
            inLcsSection = false
            dhsScore = item.points
          } else if (item.isSectionHeader && item.label.startsWith('Local-Part Credibility Score')) {
            inDhsSection = false
            inLcsSection = true
            lcsScore = item.points
          } else if (!item.isSectionHeader && !item.isSeparator && item.label) {
            const label = `${item.label} (${item.points > 0 ? '+' : ''}${item.points})`
            if (inDhsSection) {
              dhsBreakdownItems.push(label)
            } else if (inLcsSection) {
              lcsBreakdownItems.push(label)
            }
          }
        }
      }

      const mxRecordCount = dnsRecord?.mxRecords ? dnsRecord.mxRecords.length : 0
      const mxStatus = mxRecordCount > 0 ? `Yes (${mxRecordCount})` : 'No'

      const gibberishLevel = emailResult.gibberishScore >= 25 ? 'High' : emailResult.gibberishScore >= 15 ? 'Medium' : 'Low'

      return [
        emailResult.email,
        emailResult.valid && !emailResult.isDisposable ? 'Valid' : 'Invalid',
        emailResult.campaignScore || 0,
        emailResult.campaignReadiness || 'N/A',
        dhsScore,
        lcsScore,
        dhsBreakdownItems.join('; ') || 'N/A',
        lcsBreakdownItems.join('; ') || 'N/A',
        emailResult.roleBasedEmail ? 'Yes' : 'No',
        emailResult.tldQuality || 'N/A',
        gibberishLevel,
        mxStatus,
        dnsRecord?.spfRecord ? 'Yes' : 'No',
        dmarcPolicy,
        dmarcMonitoring,
      ]
    })

    // Create CSV content
    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `email-validator-results-${new Date().toISOString().slice(0, 10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Apply active filters to results
  const filteredResults = React.useMemo(() => {
    if (!mergedResult || !mergedResult.results) return []

    return mergedResult.results.filter(emailResult => {
      // Status filter
      if (filters.status === 'valid' && (!emailResult.valid || emailResult.isDisposable)) return false
      if (filters.status === 'invalid' && emailResult.valid && !emailResult.isDisposable) return false

      // Campaign score filter
      const score = emailResult.campaignScore || 0
      if (score < filters.campaignScore.min || score > filters.campaignScore.max) return false

      // Specific warning filters
      if (filters.roleBasedEmail !== null) {
        if (filters.roleBasedEmail && !emailResult.roleBasedEmail) return false
        if (!filters.roleBasedEmail && emailResult.roleBasedEmail) return false
      }

      // Abuse content filter (exclusion - hide if type matches selection)
      if (filters.abuseContent.length > 0 && emailResult.abusiveType) {
        if (filters.abuseContent.includes(emailResult.abusiveType)) return false
      }

      // DNS filters
      const dnsRecord = dnsData[emailResult.email]

      if (filters.dmarcPolicy !== 'all' && dnsRecord) {
        const dmarcRecord = dnsRecord.dmarcRecord
        let policy = 'missing'
        if (dmarcRecord) {
          const policyMatch = dmarcRecord.match(/p=([a-z]+)/i)
          if (policyMatch) {
            policy = policyMatch[1].toLowerCase()
          }
        }
        if (filters.dmarcPolicy !== policy) return false
      }

      if (filters.dmarcMonitoring !== null && dnsRecord) {
        const hasMonitoring = dnsRecord.dmarcRecord && (/rua=/i.test(dnsRecord.dmarcRecord) || /ruf=/i.test(dnsRecord.dmarcRecord))
        if (filters.dmarcMonitoring && !hasMonitoring) return false
        if (!filters.dmarcMonitoring && hasMonitoring) return false
      }

      if (filters.spfRecord !== null && dnsRecord) {
        const hasSPF = dnsRecord.spfRecord !== null && dnsRecord.spfRecord !== undefined
        if (filters.spfRecord && !hasSPF) return false
        if (!filters.spfRecord && hasSPF) return false
      }

      if (filters.noMxRecords !== null && dnsRecord) {
        const hasMX = dnsRecord.mxRecords && dnsRecord.mxRecords.length > 0
        if (filters.noMxRecords && hasMX) return false // Filter shows "No MX" but email has MX
        if (!filters.noMxRecords && !hasMX) return false // Filter shows "Has MX" but email has no MX
      }

      if (filters.nsDiversity !== null && dnsRecord) {
        const nsDiversity = analyzeNSDiversity(dnsRecord.nsRecords)
        const hasGoodDiversity = nsDiversity.score > 0
        if (filters.nsDiversity && !hasGoodDiversity) return false // Filter shows "Good" but no good diversity
        if (!filters.nsDiversity && hasGoodDiversity) return false // Filter shows "Poor" but has good diversity
      }

      if (filters.dnssecEnabled !== null && dnsRecord) {
        const hasDnssec = dnsRecord.dnssecEnabled === true
        if (filters.dnssecEnabled && !hasDnssec) return false // Filter shows "Enabled" but DNSSEC disabled
        if (!filters.dnssecEnabled && hasDnssec) return false // Filter shows "Disabled" but DNSSEC enabled
      }

      // TLD Quality filter
      if (filters.tldQuality !== 'all') {
        if (filters.tldQuality !== emailResult.tldQuality) return false
      }

      // Gibberish Score filter
      if (filters.gibberishScore !== 'all') {
        const gibScore = emailResult.gibberishScore || 0
        let scoreLevel = 'low'
        if (gibScore >= 25) scoreLevel = 'high'
        else if (gibScore >= 15) scoreLevel = 'medium'

        if (filters.gibberishScore !== scoreLevel) return false
      }

      return true
    })
  }, [mergedResult, dnsData, filters])

  // Fetch DNS data for valid emails with debounce (500ms wait after changes stop)
  React.useEffect(() => {
    if (!result || !result.results) return

    // Debounce: wait 500ms before starting lookups to avoid repeated requests while typing
    const debounceTimer = setTimeout(() => {
      // Abort any previous in-flight requests
      if (dnsAbortControllerRef.current) {
        dnsAbortControllerRef.current.abort()
      }

      const fetchDnsData = async () => {
        const validEmails = result.results.filter(emailResult => emailResult.valid)
        const validEmailsSet = validEmails.map(e => e.email).sort().join('|') // Create unique identifier for this batch
        const validEmailsList = validEmails.map(e => e.email)

        // Only initialize loading state if this is a NEW batch of emails (different from previous)
        if (loadingBatchRef.current !== validEmailsSet) {
          loadingBatchRef.current = validEmailsSet
          // Reset loading state to all valid emails in this new batch
          setLoadingEmails(new Set(validEmailsList))
        }

        const abortController = new AbortController()
        dnsAbortControllerRef.current = abortController

        // Create promises for each domain lookup - update state progressively as each completes
        const dnsPromises = validEmails.map(async (emailResult) => {
          // Skip if we already have DNS data for this email
          if (dnsData[emailResult.email]) {
            setLoadingEmails(prev => {
              const updated = new Set(prev)
              updated.delete(emailResult.email)
              return updated
            })
            return
          }

          const domain = emailResult.email.split('@')[1]
          if (!domain) return

          try {
            const timeoutId = setTimeout(() => abortController.abort(), 8000) // 8 second timeout

            try {
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
              const dnsUrl = `${baseUrl}/api/tools/email-validator-dns`

              const response = await fetch(dnsUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain }),
                signal: abortController.signal,
                credentials: 'same-origin',
              })
              clearTimeout(timeoutId)

              if (response.ok) {
                const data = await response.json()
                // Update state immediately for this email (progressive loading)
                if (!abortController.signal.aborted) {
                  setDnsData(prev => ({ ...prev, [emailResult.email]: data }))
                }
              } else {
                const errorData = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
                if (!abortController.signal.aborted) {
                  setDnsData(prev => ({ ...prev, [emailResult.email]: errorData }))
                }
              }
            } catch (fetchError) {
              clearTimeout(timeoutId)
              let errorData
              if (fetchError.name === 'AbortError') {
                errorData = { domainExists: null, mxRecords: [], error: 'Lookup timeout' }
              } else {
                errorData = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
              }
              if (!abortController.signal.aborted) {
                setDnsData(prev => ({ ...prev, [emailResult.email]: errorData }))
              }
            }
          } catch (error) {
            const errorData = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
            if (!abortController.signal.aborted) {
              setDnsData(prev => ({ ...prev, [emailResult.email]: errorData }))
            }
          }

          // Remove this email from loading state once its DNS data arrives
          setLoadingEmails(prev => {
            const updated = new Set(prev)
            updated.delete(emailResult.email)
            return updated
          })
        })

        // Wait for all DNS lookups to complete (even partial) - but state updates happen progressively above
        await Promise.all(dnsPromises).catch(() => {}) // Ignore any errors, we handled them individually
      }

      fetchDnsData()
    }, 500) // Wait 500ms after result changes before fetching DNS

    // Cleanup: clear debounce timer when result changes again
    return () => clearTimeout(debounceTimer)
  }, [result])

  if (!result) {
    const emptyTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: 'Enter one or more email addresses to validate',
        contentType: 'text',
      },
      {
        id: 'json',
        label: 'JSON',
        content: '',
        contentType: 'json',
      },
    ]
    return <OutputTabs tabs={emptyTabs} showCopyButton={false} />
  }

  // Build the friendly output display
  const renderEmailValidationContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
        <div style={{
          padding: '10px 12px',
          backgroundColor: 'var(--color-background-secondary)',
          border: '1px solid var(--color-border)',
          borderLeft: '3px solid var(--color-text-primary)',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px', letterSpacing: '0.3px' }}>Total</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{result.total}</div>
        </div>

        <div style={{
          padding: '10px 12px',
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderLeft: '3px solid #4caf50',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#4caf50', marginBottom: '4px', letterSpacing: '0.3px' }}>Valid</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#4caf50' }}>{recalculatedStats?.valid ?? result.valid}</div>
        </div>

        <div style={{
          padding: '10px 12px',
          backgroundColor: 'rgba(244, 67, 54, 0.08)',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          borderLeft: '3px solid #f44336',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#f44336', marginBottom: '4px', letterSpacing: '0.3px' }}>Invalid</div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: '#f44336' }}>{recalculatedStats?.invalid ?? result.invalid}</div>
        </div>

        {result.mailcheckerAvailable && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(33, 150, 243, 0.08)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderLeft: '3px solid #2196f3',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#2196f3', marginBottom: '4px', letterSpacing: '0.3px' }}>Mailchecker</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2196f3' }}>Active</div>
          </div>
        )}

        {recalculatedStats?.averageCampaignScore !== undefined && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(156, 39, 176, 0.08)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderLeft: '3px solid #9c27b0',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#9c27b0', marginBottom: '4px', letterSpacing: '0.3px' }}>Avg Score</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#9c27b0' }}>{recalculatedStats.averageCampaignScore}</div>
          </div>
        )}
      </div>

      {/* Email validation results */}
      {result.results && result.results.length > 0 && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              Email Results
              <span style={{
                fontSize: '12px',
                fontWeight: '500',
                padding: '2px 8px',
                backgroundColor: loadingEmails.size > 0 ? 'rgba(156, 39, 176, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                border: loadingEmails.size > 0 ? '1px solid rgba(156, 39, 176, 0.3)' : '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '3px',
                color: loadingEmails.size > 0 ? '#9c27b0' : '#4caf50',
              }}>
                {result.results.length - loadingEmails.size}/{result.results.length} ready
              </span>
              {filteredResults.length !== result.results.length && `(${filteredResults.length}/${result.results.length})`}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={exportToCSV}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ↓ Export CSV
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: '600',
                  backgroundColor: showFilters ? 'rgba(156, 39, 176, 0.15)' : 'transparent',
                  color: showFilters ? '#9c27b0' : 'var(--color-text-secondary)',
                  border: `1px solid ${showFilters ? '#9c27b0' : 'var(--color-border)'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ⚙ Filters
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(156, 39, 176, 0.05)',
              border: '1px solid rgba(156, 39, 176, 0.2)',
              borderRadius: '4px',
              marginBottom: '12px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}>
              {/* Status Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="all">All</option>
                  <option value="valid">Valid Only</option>
                  <option value="invalid">Invalid Only</option>
                </select>
              </div>

              {/* Campaign Score Range */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Campaign Score</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.campaignScore.min}
                    onChange={(e) => setFilters({ ...filters, campaignScore: { ...filters.campaignScore, min: parseInt(e.target.value) || 0 } })}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '3px',
                      backgroundColor: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Min"
                  />
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>–</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={filters.campaignScore.max}
                    onChange={(e) => setFilters({ ...filters, campaignScore: { ...filters.campaignScore, max: parseInt(e.target.value) || 100 } })}
                    style={{
                      flex: 1,
                      padding: '6px',
                      fontSize: '12px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '3px',
                      backgroundColor: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)',
                    }}
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Role-Based Email Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Role-Based</label>
                <select
                  value={filters.roleBasedEmail === null ? 'null' : filters.roleBasedEmail}
                  onChange={(e) => setFilters({ ...filters, roleBasedEmail: e.target.value === 'null' ? null : e.target.value === 'true' })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="null">All</option>
                  <option value="true">Role-Based</option>
                  <option value="false">Not Role-Based</option>
                </select>
              </div>

              {/* TLD Quality Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>TLD Quality</label>
                <select
                  value={filters.tldQuality}
                  onChange={(e) => setFilters({ ...filters, tldQuality: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="all">All</option>
                  <option value="high-trust">High-Trust</option>
                  <option value="neutral">Neutral</option>
                  <option value="low-trust">Low-Trust</option>
                </select>
              </div>

              {/* Gibberish Score Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Gibberish Score</label>
                <select
                  value={filters.gibberishScore}
                  onChange={(e) => setFilters({ ...filters, gibberishScore: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* DMARC Policy Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>DMARC Policy</label>
                <select
                  value={filters.dmarcPolicy}
                  onChange={(e) => setFilters({ ...filters, dmarcPolicy: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="all">All</option>
                  <option value="reject">Reject</option>
                  <option value="quarantine">Quarantine</option>
                  <option value="none">None</option>
                  <option value="missing">Missing</option>
                </select>
              </div>

              {/* DMARC Monitoring Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>DMARC Monitoring</label>
                <select
                  value={filters.dmarcMonitoring === null ? 'null' : filters.dmarcMonitoring}
                  onChange={(e) => setFilters({ ...filters, dmarcMonitoring: e.target.value === 'null' ? null : e.target.value === 'true' })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="null">All</option>
                  <option value="true">With Reports (rua/ruf)</option>
                  <option value="false">No Reports</option>
                </select>
              </div>

              {/* MX Records Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>MX Records</label>
                <select
                  value={filters.noMxRecords === null ? 'null' : filters.noMxRecords}
                  onChange={(e) => setFilters({ ...filters, noMxRecords: e.target.value === 'null' ? null : e.target.value === 'true' })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="null">All</option>
                  <option value="false">Has MX</option>
                  <option value="true">No MX</option>
                </select>
              </div>

              {/* SPF Record Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>SPF Record</label>
                <select
                  value={filters.spfRecord === null ? 'null' : filters.spfRecord}
                  onChange={(e) => setFilters({ ...filters, spfRecord: e.target.value === 'null' ? null : e.target.value === 'true' })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="null">All</option>
                  <option value="true">Has SPF</option>
                  <option value="false">No SPF</option>
                </select>
              </div>

              {/* NS Diversity Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>NS Diversity</label>
                <select
                  value={filters.nsDiversity === null ? 'null' : filters.nsDiversity}
                  onChange={(e) => setFilters({ ...filters, nsDiversity: e.target.value === 'null' ? null : e.target.value === 'true' })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="null">All</option>
                  <option value="true">Good</option>
                  <option value="false">Poor</option>
                </select>
              </div>

              {/* DNSSEC Filter */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>DNSSEC</label>
                <select
                  value={filters.dnssecEnabled === null ? 'null' : filters.dnssecEnabled}
                  onChange={(e) => setFilters({ ...filters, dnssecEnabled: e.target.value === 'null' ? null : e.target.value === 'true' })}
                  style={{
                    width: '100%',
                    padding: '6px',
                    fontSize: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: '3px',
                    backgroundColor: 'var(--color-background-primary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="null">All</option>
                  <option value="true">Enabled</option>
                  <option value="false">Disabled</option>
                </select>
              </div>

              {/* Abuse Content Filter (Exclusion) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Exclude Content</label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {['hateful', 'abusive', 'nsfw'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        const newFilters = [...filters.abuseContent]
                        if (newFilters.includes(type)) {
                          newFilters.splice(newFilters.indexOf(type), 1)
                        } else {
                          newFilters.push(type)
                        }
                        setFilters({ ...filters, abuseContent: newFilters })
                      }}
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        border: `1px solid ${filters.abuseContent.includes(type) ? '#9c27b0' : 'var(--color-border)'}`,
                        borderRadius: '3px',
                        backgroundColor: filters.abuseContent.includes(type) ? 'rgba(156, 39, 176, 0.15)' : 'transparent',
                        color: filters.abuseContent.includes(type) ? '#9c27b0' : 'var(--color-text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => setFilters({
                  status: 'all',
                  campaignScore: { min: 0, max: 100 },
                  roleBasedEmail: null,
                  abuseContent: [],
                  tldQuality: 'all',
                  gibberishScore: 'all',
                  dmarcPolicy: 'all',
                  dmarcMonitoring: null,
                  spfRecord: null,
                  noMxRecords: null,
                  nsDiversity: null,
                  dnssecEnabled: null,
                })}
                style={{
                  gridColumn: '1 / -1',
                  padding: '8px 12px',
                  fontSize: '12px',
                  backgroundColor: 'transparent',
                  color: '#9c27b0',
                  border: '1px solid #9c27b0',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Reset All Filters
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredResults.map((emailResult, idx) => {
              // Invalid emails render immediately (no DNS lookup needed)
              const isInvalidEmail = !emailResult.valid || emailResult.isDisposable

              // Valid emails only render after DNS data arrives
              const hasDnsData = dnsData[emailResult.email] !== undefined
              const shouldShowLoader = !isInvalidEmail && !hasDnsData

              if (shouldShowLoader) {
                return (
                  <div key={idx} style={{
                    padding: '16px 14px',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    borderLeft: '3px solid rgba(156, 39, 176, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minHeight: '60px',
                  }}>
                    {/* Modern spinner */}
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid rgba(156, 39, 176, 0.2)',
                      borderTopColor: '#9c27b0',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                        {emailResult.email}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                        Resolving DNS records...
                      </div>
                    </div>
                  </div>
                )
              }

              return (
              <div key={idx} style={{
                padding: '12px 14px',
                backgroundColor: 'transparent',
                border: `1px solid ${!emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? 'rgba(239, 83, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`,
                borderRadius: '4px',
                borderLeft: `3px solid ${!emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? '#ef5350' : '#4caf50'}`,
              }}>
                {/* Email header with status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: !emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? '#ef5350' : '#4caf50', fontSize: '16px', flexShrink: 0 }}>
                    {!emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? '✗' : '✓'}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '15px', fontWeight: '500', wordBreak: 'break-all', overflowWrap: 'break-word', minWidth: 0 }}>
                    {emailResult.email}
                  </span>
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: !emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? 'rgba(239, 83, 80, 0.15)' : 'rgba(76, 175, 80, 0.15)',
                    color: !emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? '#ef5350' : '#4caf50',
                    borderRadius: '3px',
                    fontSize: '13px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {!emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none' ? '✗ Invalid' : '✓ Valid'}
                  </span>

                  {emailResult.campaignReadiness && dnsData[emailResult.email]?.mailHostType !== 'none' && !emailResult.isDisposable && emailResult.valid && (
                    (() => {
                      const dnsRecord = dnsData[emailResult.email]
                      const { totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)

                      const baseDhs = calculateDomainHealthScore(emailResult.tldQuality, emailResult.isDomainCorporate)
                      const lcsScore = emailResult.lcsScore || 100
                      const adjustedDHS = Math.max(0, Math.min(100, baseDhs - dnsTotalAdjustment))
                      const adjustedScore = Math.min(adjustedDHS, lcsScore)

                      const readinessLevel = getCampaignReadinessLabel(adjustedScore)

                      return (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: readinessLevel === 'Excellent' ? 'rgba(76, 175, 80, 0.15)' :
                                          readinessLevel === 'Good' ? 'rgba(33, 150, 243, 0.15)' :
                                          readinessLevel === 'Risky' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                          color: readinessLevel === 'Excellent' ? '#4caf50' :
                                 readinessLevel === 'Good' ? '#2196f3' :
                                 readinessLevel === 'Risky' ? '#ff9800' : '#ef5350',
                          borderRadius: '3px',
                          fontSize: '13px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}>
                          Campaign: {readinessLevel}
                        </span>
                      )
                    })()
                  )}
                </div>

                {/* Invalid emails: Show ONLY issues, nothing else */}
                {(!emailResult.valid || emailResult.isDisposable || dnsData[emailResult.email]?.mailHostType === 'none') && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#ef5350', marginBottom: '4px' }}>Issues:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {emailResult.issues?.map((issue, issueIdx) => (
                        <div key={issueIdx} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid emails: Show warnings and details */}
                {emailResult.valid && dnsData[emailResult.email]?.mailHostType !== 'none' && !emailResult.isDisposable && (emailResult.roleBasedEmail || emailResult.hasBadReputation || emailResult.usernameHeuristics?.length > 0 || emailResult.domainHeuristics?.length > 0 || (!dnsData[emailResult.email]?.mxRecords || dnsData[emailResult.email]?.mxRecords?.length === 0)) && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#ff9800', marginBottom: '4px' }}>
                      ⚠ Warnings:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {(!dnsData[emailResult.email]?.mxRecords || dnsData[emailResult.email]?.mxRecords?.length === 0) && (
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • No MX records found (using A/AAAA fallback)
                        </div>
                      )}
                      {emailResult.roleBasedEmail && (
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • Role-based email (may not be a real user account)
                        </div>
                      )}
                      {emailResult.hasBadReputation && (
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • Domain has poor reputation or is on blocklist
                        </div>
                      )}
                      {emailResult.domainHeuristics?.map((heuristic, dhIdx) => (
                        <div key={`dh-${dhIdx}`} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • Domain: {heuristic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Campaign Readiness (Identity Score) Panel - Only show for valid emails */}
                {emailResult.campaignScore !== undefined && emailResult.valid && dnsData[emailResult.email]?.mailHostType !== 'none' && !emailResult.isDisposable && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Campaign Readiness
                    </div>
                    {(() => {
                      const dnsRecord = dnsData[emailResult.email]
                      const { penalties: dnsPenalties, totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)

                      // ===== SINGLE SOURCE OF TRUTH: Calculate DHS + apply DNS adjustments =====
                      const baseDhs = calculateDomainHealthScore(emailResult.tldQuality, emailResult.isDomainCorporate)
                      const lcsScore = emailResult.lcsScore || 100 // Local-Part Credibility Score (identity)

                      // Apply DNS adjustments to DHS only
                      const adjustedDHS = Math.max(0, Math.min(100, baseDhs - dnsTotalAdjustment))

                      // Final score = min(adjusted DHS, LCS)
                      // This ensures bad identity cannot be rescued by good domain
                      const adjustedScore = Math.min(adjustedDHS, lcsScore)

                      // Determine campaign readiness based on adjusted score
                      const readinessLevel = getCampaignReadinessLabel(adjustedScore)

                      return (
                        <>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '22px', fontWeight: '700', color: readinessLevel === 'Excellent' ? '#4caf50' : readinessLevel === 'Good' ? '#2196f3' : readinessLevel === 'Risky' ? '#ff9800' : '#ef5350' }}>
                              {adjustedScore}
                            </span>
                            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                              / {readinessLevel}
                            </span>
                          </div>
                          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                            Identity-based score for email campaign suitability (0–100)
                          </div>
                        </>
                      )
                    })()}

                    {/* Score Breakdown */}
                    {emailResult.campaignBreakdown && emailResult.campaignBreakdown.length > 0 && (
                      <>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Score Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(() => {
                            const dnsRecord = dnsData[emailResult.email]
                            const { penalties: dnsPenalties, totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)

                            // ===== SINGLE SOURCE OF TRUTH (breakdown section): Same values as above =====
                            // Ensures displayed scores match final calculation
                            const baseDhs = calculateDomainHealthScore(emailResult.tldQuality, emailResult.isDomainCorporate)
                            const lcsScore = emailResult.lcsScore || 100
                            const adjustedDHS = Math.max(0, Math.min(100, baseDhs - dnsTotalAdjustment))
                            const adjustedScore = Math.min(adjustedDHS, lcsScore)

                            // Build complete breakdown with DHS + LCS + DNS penalties
                            const breakdownWithDns = [
                              { label: 'Domain Health Score', points: adjustedDHS, description: 'Infrastructure & domain maturity (adjusted with DNS results)', isSectionHeader: true }
                            ]

                            // Add base DHS items (TLD quality, corporate domain)
                            if (emailResult.tldQuality === 'high-trust') {
                              breakdownWithDns.push({ label: 'High-Trust TLD', points: 5, description: 'Established TLD (.com, .org, .edu, etc.)' })
                            } else if (emailResult.tldQuality === 'low-trust') {
                              breakdownWithDns.push({ label: 'Low-Trust TLD', points: -10, description: 'Suspicious or uncommon TLD' })
                            }

                            if (emailResult.isDomainCorporate) {
                              breakdownWithDns.push({ label: 'Corporate Domain', points: 5, description: 'Verified corporate/business domain' })
                            }

                            // Add DNS penalties if any
                            if (dnsPenalties.length > 0) {
                              breakdownWithDns.push(...dnsPenalties)
                            }

                            // Add LCS section
                            breakdownWithDns.push({ label: '', points: 0, description: '', isSeparator: true })
                            breakdownWithDns.push({ label: 'Local-Part Credibility Score', points: lcsScore, description: 'Username quality & engagement likelihood (base: 100)', isSectionHeader: true })

                            // Add LCS items from backend breakdown (skip the LCS header and final score since we're building those)
                            if (emailResult.campaignBreakdown && emailResult.campaignBreakdown.length > 0) {
                              let foundLcsHeader = false
                              for (const item of emailResult.campaignBreakdown) {
                                if (item.isSectionHeader && item.label.startsWith('Local-Part Credibility Score')) {
                                  foundLcsHeader = true
                                  continue
                                }
                                // Skip the backend's final score item - we'll build our own
                                if (item.label === 'Final Campaign Readiness Score') {
                                  continue
                                }
                                if (foundLcsHeader) {
                                  breakdownWithDns.push(item)
                                }
                              }
                            }

                            // Add final score
                            breakdownWithDns.push({ label: '', points: 0, description: '', isSeparator: true })
                            breakdownWithDns.push({
                              label: 'Final Campaign Readiness Score',
                              points: adjustedScore,
                              description: `min(Domain Health Score (${Math.round(adjustedDHS)}), Local-Part Credibility Score (${lcsScore}))`,
                              isFinalScore: true
                            })

                            return (
                              <>
                                {breakdownWithDns.map((item, idx) => {
                                  // Skip separators and headers
                                  if (item.isSeparator) {
                                    // Don't render separator if next item is final score
                                    const nextItem = idx + 1 < breakdownWithDns.length ? breakdownWithDns[idx + 1] : null
                                    if (nextItem && nextItem.isFinalScore) {
                                      return null
                                    }
                                    return <div key={idx} style={{ height: '8px' }} />
                                  }

                                  if (item.isSectionHeader) {
                                    // Check if this is the LCS header and if LCS score is 100 (no penalties)
                                    const isLcsHeader = item.label.startsWith('Local-Part Credibility Score')
                                    const isLcsClean = isLcsHeader && item.points === 100

                                    // Count items in LCS section (between LCS header and final score separator)
                                    let lcsItemCount = 0
                                    if (isLcsHeader) {
                                      for (let i = idx + 1; i < breakdownWithDns.length; i++) {
                                        if (breakdownWithDns[i].isSeparator || breakdownWithDns[i].isFinalScore) break
                                        if (!breakdownWithDns[i].isSectionHeader) lcsItemCount++
                                      }
                                    }

                                    return (
                                      <div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0px', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid var(--color-border)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                          {item.label}: {Math.round(item.points)}
                                        </div>
                                        {item.description && <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{item.description}</div>}
                                        {isLcsClean && lcsItemCount === 0 && <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>✓ Nothing suspicious found</div>}
                                      </div>
                                    )
                                  }

                                  if (item.isCapNote) {
                                    return (
                                      <div key={idx} style={{ padding: '6px', backgroundColor: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.2)', borderRadius: '3px', marginTop: '4px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#ff9800' }}>
                                          {item.label}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                                          {item.description}
                                        </div>
                                      </div>
                                    )
                                  }

                                  if (item.isFinalScore) {
                                    return (
                                      <div key={idx} style={{ padding: '6px 0', marginTop: '4px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                                        <div style={{ flex: 1 }}>
                                          <div>{item.label}</div>
                                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1px', fontWeight: '400' }}>
                                            {item.description}
                                          </div>
                                        </div>
                                        <div style={{ textAlign: 'right', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                          {Math.round(item.points)}
                                        </div>
                                      </div>
                                    )
                                  }

                                  return (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: item.isSubItem ? '12px' : '13px', color: 'var(--color-text-secondary)', paddingBottom: idx < breakdownWithDns.length - 1 ? '4px' : '0px', borderBottom: idx < breakdownWithDns.length - 1 ? '1px solid var(--color-border)' : 'none', paddingLeft: item.isSubItem ? '24px' : '0px' }}>
                                      <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: item.isSubItem ? '400' : '600', color: item.points > 0 ? '#4caf50' : item.points < 0 ? '#ef5350' : 'var(--color-text-secondary)' }}>
                                          {item.label}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '1px', display: item.description ? 'block' : 'none' }}>
                                          {item.description}
                                        </div>
                                      </div>
                                      <div style={{ fontWeight: '700', marginLeft: '8px', textAlign: 'right', color: item.points > 0 ? '#4caf50' : item.points < 0 ? '#ef5350' : 'var(--color-text-secondary)', whiteSpace: 'nowrap', display: item.points !== 0 ? 'block' : 'none' }}>
                                        {item.points > 0 ? '+' : ''}{item.points}
                                      </div>
                                    </div>
                                  )
                                })}
                              </>
                            )
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Dual Score Panels: Deliverability + Trustworthiness - HIDDEN */}
                {false && emailResult.deliverabilityScore !== undefined && emailResult.trustworthinessScore !== undefined && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    {/* Two-column score layout */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>

                      {/* Deliverability Score Panel */}
                      <div style={{ padding: '10px', backgroundColor: 'rgba(76, 175, 80, 0.05)', borderRadius: '4px', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Deliverability
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: '#4caf50' }}>
                            {emailResult.deliverabilityScore}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            / {emailResult.deliverabilityLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '6px' }}>
                          Will mail servers accept this address reliably?
                        </div>
                        {emailResult.deliverabilityWarnings && emailResult.deliverabilityWarnings.length > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                            {emailResult.deliverabilityWarnings.map((warn, idx) => (
                              <div key={idx} style={{ marginTop: '3px' }}>• {warn}</div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Trustworthiness Score Panel */}
                      <div style={{ padding: '10px', backgroundColor: 'rgba(33, 150, 243, 0.05)', borderRadius: '4px', border: '1px solid rgba(33, 150, 243, 0.2)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Trustworthiness
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '20px', fontWeight: '700', color: emailResult.trustworthinessScore >= 80 ? '#4caf50' : emailResult.trustworthinessScore >= 60 ? '#2196f3' : emailResult.trustworthinessScore >= 40 ? '#ff9800' : '#ef5350' }}>
                            {emailResult.trustworthinessScore}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            / {emailResult.trustworthinessLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '6px' }}>
                          Is this likely a real human's email?
                        </div>
                        {emailResult.trustworthinessWarnings && emailResult.trustworthinessWarnings.length > 0 && (
                          <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                            {emailResult.trustworthinessWarnings.map((warn, idx) => (
                              <div key={idx} style={{ marginTop: '3px' }}>• {warn}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Combined Grade Panel - HIDDEN FOR NOW */}
                    {false && emailResult.combinedGrade && (
                      <div style={{ padding: '10px', backgroundColor: emailResult.combinedGrade === 'Invalid' ? 'rgba(239, 83, 80, 0.05)' : 'rgba(156, 39, 176, 0.05)', borderRadius: '4px', border: emailResult.combinedGrade === 'Invalid' ? '1px solid rgba(239, 83, 80, 0.2)' : '1px solid rgba(156, 39, 176, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Overall Grade
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '700', color: emailResult.combinedGrade === 'Invalid' ? '#ef5350' : emailResult.combinedGrade === 'A+' || emailResult.combinedGrade === 'A' ? '#4caf50' : emailResult.combinedGrade === 'A-' || emailResult.combinedGrade === 'B+' || emailResult.combinedGrade === 'B' ? '#2196f3' : emailResult.combinedGrade === 'B-' || emailResult.combinedGrade === 'C+' ? '#ff9800' : '#ef5350', marginBottom: '6px' }}>
                          {emailResult.combinedGrade}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {emailResult.combinedGrade === 'Invalid' ? 'Cannot be graded - email is invalid' : 'Single verdict combining deliverability + trustworthiness'}
                        </div>
                      </div>
                    )}

                    {/* Human Likelihood Label - HIDDEN */}
                    {false && emailResult.humanLikelihood && (
                      <div style={{
                        padding: '10px',
                        backgroundColor: emailResult.humanLikelihood === 'Invalid' ? 'rgba(239, 83, 80, 0.05)' : emailResult.humanLikelihood.includes('abusive') ? 'rgba(244, 67, 54, 0.05)' : emailResult.humanLikelihood.includes('organization') ? 'rgba(0, 150, 136, 0.05)' : 'rgba(255, 152, 0, 0.05)',
                        borderRadius: '4px',
                        border: emailResult.humanLikelihood === 'Invalid' ? '1px solid rgba(239, 83, 80, 0.2)' : emailResult.humanLikelihood.includes('abusive') ? '1px solid rgba(244, 67, 54, 0.2)' : emailResult.humanLikelihood.includes('organization') ? '1px solid rgba(0, 150, 136, 0.2)' : '1px solid rgba(255, 152, 0, 0.2)',
                        marginTop: '12px'
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Human Likelihood
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: emailResult.humanLikelihood === 'Invalid' ? '#ef5350' : emailResult.humanLikelihood.includes('abusive') ? '#f44336' : emailResult.humanLikelihood.includes('organization') ? '#009688' : '#ff9800', marginBottom: '4px' }}>
                          {emailResult.humanLikelihood}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {emailResult.humanLikelihood === 'Invalid' ? 'Cannot assess: email address is invalid' : emailResult.humanLikelihood.includes('abusive') ? 'Very likely human, but contains abusive content' : emailResult.humanLikelihood.includes('organization') ? 'Likely controlled by organization' : 'Probability this email belongs to a real person'}
                        </div>
                      </div>
                    )}


                    {/* Username Analysis Section */}
                    {dnsData[emailResult.email]?.mailHostType !== 'none' && (emailResult.gibberishScore !== undefined || emailResult.abusiveScore !== undefined || emailResult.roleBasedEmail) && (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(255, 152, 0, 0.05)', borderRadius: '4px', border: '1px solid rgba(255, 152, 0, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Username Analysis
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {emailResult.gibberishScore !== undefined && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Gibberish Score:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>{emailResult.gibberishScore}</span>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  backgroundColor: emailResult.gibberishScore >= 25 ? 'rgba(239, 83, 80, 0.2)' : emailResult.gibberishScore >= 15 ? 'rgba(255, 152, 0, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                  color: emailResult.gibberishScore >= 25 ? '#ef5350' : emailResult.gibberishScore >= 15 ? '#ff9800' : '#4caf50',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  {emailResult.gibberishScore >= 25 ? 'High' : emailResult.gibberishScore >= 15 ? 'Medium' : 'Low'}
                                </span>
                              </div>
                            </div>
                          )}
                          {emailResult.abusiveScore !== undefined && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Abusive Score:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>{emailResult.abusiveScore}</span>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  backgroundColor: emailResult.abusiveScore > 0 ? 'rgba(239, 83, 80, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                                  color: emailResult.abusiveScore > 0 ? '#ef5350' : '#4caf50',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  {emailResult.abusiveScore > 0 ? 'Detected' : 'Clean'}
                                </span>
                              </div>
                            </div>
                          )}
                          {emailResult.roleBasedEmail && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Role-Based Email:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>Yes</span>
                                {emailResult.roleBasedType && (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                    color: '#2196f3',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                  }}>
                                    {emailResult.roleBasedType}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          {emailResult.usernameHeuristics && emailResult.usernameHeuristics.length > 0 && (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Heuristics:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginLeft: '8px' }}>
                                {emailResult.usernameHeuristics.map((heuristic, hIdx) => (
                                  <div key={`heur-${hIdx}`} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    • {heuristic}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Domain Intelligence Section */}
                    {dnsData[emailResult.email]?.mailHostType !== 'none' && (emailResult.tldQuality || emailResult.businessEmail) && (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(0, 150, 136, 0.05)', borderRadius: '4px', border: '1px solid rgba(0, 150, 136, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Domain Intelligence
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {emailResult.tldQuality && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>TLD Trust Level:</span>
                              <span style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                backgroundColor: emailResult.tldQuality === 'high-trust' ? 'rgba(76, 175, 80, 0.2)' : emailResult.tldQuality === 'low-trust' ? 'rgba(239, 83, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                color: emailResult.tldQuality === 'high-trust' ? '#4caf50' : emailResult.tldQuality === 'low-trust' ? '#ef5350' : '#9e9e9e',
                                borderRadius: '3px',
                                fontSize: '10px',
                                fontWeight: '600'
                              }}>
                                {emailResult.tldQuality === 'high-trust' ? '✓ High-Trust' : emailResult.tldQuality === 'low-trust' ? '✗ Low-Trust' : '◐ Neutral'}
                              </span>
                            </div>
                          )}
                          {emailResult.businessEmail && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Email Provider:</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '600' }}>{emailResult.businessEmail.name}</span>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  backgroundColor: emailResult.businessEmail.type === 'corporate' ? 'rgba(0, 150, 136, 0.2)' : 'rgba(158, 158, 158, 0.2)',
                                  color: emailResult.businessEmail.type === 'corporate' ? '#009688' : '#9e9e9e',
                                  borderRadius: '3px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  textTransform: 'capitalize'
                                }}>
                                  {emailResult.businessEmail.type}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Phishing Intelligence Section */}
                    {dnsData[emailResult.email]?.mailHostType !== 'none' && emailResult.phishingRisk && emailResult.phishingRisk !== 'Unknown' && (
                      <div style={{ padding: '10px', backgroundColor: emailResult.phishingRisk === 'Very High' ? 'rgba(244, 67, 54, 0.05)' : emailResult.phishingRisk === 'High' ? 'rgba(255, 152, 0, 0.05)' : emailResult.phishingRisk === 'Medium' ? 'rgba(255, 193, 7, 0.05)' : 'rgba(76, 175, 80, 0.05)', borderRadius: '4px', border: emailResult.phishingRisk === 'Very High' ? '1px solid rgba(244, 67, 54, 0.2)' : emailResult.phishingRisk === 'High' ? '1px solid rgba(255, 152, 0, 0.2)' : emailResult.phishingRisk === 'Medium' ? '1px solid rgba(255, 193, 7, 0.2)' : '1px solid rgba(76, 175, 80, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Phishing Intelligence
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: emailResult.phishingRisk === 'Very High' ? '#f44336' : emailResult.phishingRisk === 'High' ? '#ff9800' : emailResult.phishingRisk === 'Medium' ? '#ffc107' : '#4caf50' }}>
                              Risk Level:
                            </span>
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              backgroundColor: emailResult.phishingRisk === 'Very High' ? 'rgba(244, 67, 54, 0.2)' : emailResult.phishingRisk === 'High' ? 'rgba(255, 152, 0, 0.2)' : emailResult.phishingRisk === 'Medium' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                              color: emailResult.phishingRisk === 'Very High' ? '#f44336' : emailResult.phishingRisk === 'High' ? '#ff9800' : emailResult.phishingRisk === 'Medium' ? '#ffc107' : '#4caf50',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '600'
                            }}>
                              {emailResult.phishingRisk}
                            </span>
                          </div>
                          {emailResult.trustworthinessWarnings && emailResult.trustworthinessWarnings.some(w => w.toLowerCase().includes('impersonate')) && (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '3px' }}>Impersonation Warnings:</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '8px' }}>
                                {emailResult.trustworthinessWarnings.filter(w => w.toLowerCase().includes('impersonate')).map((warning, wIdx) => (
                                  <div key={`iw-${wIdx}`} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    • {warning}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Normalized Email Section */}
                    {dnsData[emailResult.email]?.mailHostType !== 'none' && emailResult.normalized && (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(156, 39, 176, 0.05)', borderRadius: '4px', border: '1px solid rgba(156, 39, 176, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Normalized Email
                        </div>
                        <div style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '500', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                          {emailResult.normalized}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Domain Analysis - Only for valid emails */}
                {emailResult.valid && dnsData[emailResult.email]?.mailHostType !== 'none' && !emailResult.isDisposable && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      DOMAIN ANALYSIS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '14px' }}>
                      {dnsData[emailResult.email] ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: dnsData[emailResult.email].domainExists ? '#4caf50' : '#ef5350' }}>
                              {dnsData[emailResult.email].domainExists ? '✓' : '✗'}
                            </span>
                            <span>
                              Domain exists: {dnsData[emailResult.email].domainExists ? 'Yes' : 'No'}
                            </span>
                          </div>

                          {dnsData[emailResult.email].mailHostType && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '6px', backgroundColor: dnsData[emailResult.email].mailHostType === 'mx' ? 'rgba(76, 175, 80, 0.1)' : dnsData[emailResult.email].mailHostType === 'fallback' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(239, 83, 80, 0.1)', borderRadius: '3px' }}>
                              <span style={{ color: dnsData[emailResult.email].mailHostType === 'mx' ? '#4caf50' : dnsData[emailResult.email].mailHostType === 'fallback' ? '#ff9800' : '#ef5350', fontWeight: '600', fontSize: '14px' }}>
                                {dnsData[emailResult.email].mailHostType === 'mx' ? '✓ Mail Server Type: MX' : dnsData[emailResult.email].mailHostType === 'fallback' ? '⚠ Mail Server Type: Fallback (A/AAAA)' : '✗ No Mail Server'}
                              </span>
                            </div>
                          )}

                          {dnsData[emailResult.email].mxRecords && dnsData[emailResult.email].mxRecords.length > 0 && dnsData[emailResult.email].mxRecords.some(mx => mx.hostname) ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>MX Records:</div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].mxRecords.map((mx, mxIdx) => (
                                  <div key={mxIdx} style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                    [{mx.priority}] {mx.hostname}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : dnsData[emailResult.email].aRecords && dnsData[emailResult.email].aRecords.length > 0 ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>
                                A Records (Fallback):
                              </div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].aRecords.map((rec, idx) => (
                                  <div key={idx} style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                    {rec.address}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : dnsData[emailResult.email].aaaaRecords && dnsData[emailResult.email].aaaaRecords.length > 0 ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>
                                AAAA Records (Fallback):
                              </div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].aaaaRecords.map((rec, idx) => (
                                  <div key={idx} style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                    {rec.address}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              No mail server records found (MX, A, or AAAA)
                            </div>
                          )}

                          {/* SPF Record */}
                          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>
                              SPF Record:
                            </div>
                            {dnsData[emailResult.email].spfRecord ? (
                              <div style={{ marginLeft: '20px', fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: 'rgba(76, 175, 80, 0.05)', padding: '6px', borderRadius: '3px', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                                ✓ {dnsData[emailResult.email].spfRecord}
                              </div>
                            ) : (
                              <div style={{ marginLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                ✗ No SPF record found
                              </div>
                            )}
                          </div>

                          {/* DMARC Record */}
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>
                              DMARC Record:
                            </div>
                            {dnsData[emailResult.email].dmarcRecord ? (
                              <div style={{ marginLeft: '20px', fontSize: '12px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', wordBreak: 'break-all', backgroundColor: 'rgba(76, 175, 80, 0.05)', padding: '6px', borderRadius: '3px', border: '1px solid rgba(76, 175, 80, 0.2)' }}>
                                ✓ {dnsData[emailResult.email].dmarcRecord}
                              </div>
                            ) : (
                              <div style={{ marginLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                ✗ No DMARC record found
                              </div>
                            )}
                          </div>

                          {/* Nameservers */}
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>
                              Nameservers ({dnsData[emailResult.email].nsRecords?.length || 0}):
                            </div>
                            {dnsData[emailResult.email].nsRecords && dnsData[emailResult.email].nsRecords.length > 0 ? (
                              <div style={{ marginLeft: '20px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {dnsData[emailResult.email].nsRecords.map((ns, idx) => (
                                  <div key={idx} style={{ marginBottom: '4px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    {idx + 1}. {ns.nameserver}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div style={{ marginLeft: '20px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                ✗ No nameserver data available
                              </div>
                            )}
                          </div>

                          {/* DNSSEC Status */}
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600', fontSize: '14px' }}>
                              DNSSEC:
                            </div>
                            {dnsData[emailResult.email].dnssecEnabled ? (
                              <div style={{ marginLeft: '20px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                ✓ DNSSEC enabled
                              </div>
                            ) : (
                              <div style={{ marginLeft: '20px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                ✗ DNSSEC not enabled
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                          Loading DNS data...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
            })}
            {filteredResults.length === 0 && result.results.length > 0 && (
              <div style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}>
                <div style={{ fontSize: '14px', marginBottom: '4px' }}>No emails match the current filters</div>
                <button
                  onClick={() => setFilters({
                    status: 'all',
                    campaignScore: { min: 0, max: 100 },
                    roleBasedEmail: null,
                    abuseContent: [],
                    tldQuality: 'all',
                    gibberishScore: 'all',
                    dmarcPolicy: 'all',
                    dmarcMonitoring: null,
                    spfRecord: null,
                    noMxRecords: null,
                    nsDiversity: null,
                    dnssecEnabled: null,
                  })}
                  style={{
                    marginTop: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: 'transparent',
                    color: '#9c27b0',
                    border: '1px solid #9c27b0',
                    borderRadius: '3px',
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features info */}
      <div style={{
        padding: '12px 14px',
        backgroundColor: 'rgba(33, 150, 243, 0.05)',
        border: '1px solid rgba(33, 150, 243, 0.2)',
        borderRadius: '4px',
        fontSize: '14px',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>Features & Scoring System:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }}>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px', fontSize: '14px' }}>Validation:</div>
          <div style={{ fontSize: '13px' }}>✓ RFC-like syntax validation</div>
          <div style={{ fontSize: '13px' }}>✓ Disposable domain detection</div>
          <div style={{ fontSize: '13px' }}>✓ Role-based email detection</div>
          <div style={{ fontSize: '13px' }}>✓ ICANN TLD validation</div>
          <div style={{ fontSize: '13px' }}>✓ DNS MX/A/AAAA record lookup</div>
          <div style={{ fontSize: '13px' }}>✓ Domain existence verification</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px', fontSize: '14px' }}>Campaign Readiness / Identity Score (0-100):</div>
          <div style={{ fontSize: '13px' }}>✓ Domain Health Score (infrastructure & maturity)</div>
          <div style={{ fontSize: '13px' }}>✓ Local-Part Credibility Score (username quality)</div>
          <div style={{ fontSize: '13px' }}>✓ Personal name detection</div>
          <div style={{ fontSize: '13px' }}>✓ Role-based email scoring</div>
          <div style={{ fontSize: '13px' }}>✓ DNS penalties (SPF, DMARC, MX redundancy)</div>
          <div style={{ fontSize: '13px' }}>✓ Provider reputation (Gmail, Outlook, Yahoo, etc.)</div>
          <div style={{ fontSize: '13px' }}>✓ TLD quality classification (high/low trust)</div>
          <div style={{ fontSize: '13px' }}>✓ Structure and simplicity analysis</div>
          <div style={{ fontSize: '13px' }}>✓ Detects abusive/hateful/adult content penalties</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px', fontSize: '14px' }}>Advanced Detection:</div>
          <div style={{ fontSize: '13px' }}>✓ Brand impersonation detection</div>
          <div style={{ fontSize: '13px' }}>✓ Phishing risk assessment</div>
          <div style={{ fontSize: '13px' }}>✓ Business email provider detection</div>
          <div style={{ fontSize: '13px' }}>✓ Username semantic analysis (names, offensive terms)</div>
        </div>
      </div>
    </div>
  )

  const tabs = [
    {
      id: 'output',
      label: 'OUTPUT',
      content: renderEmailValidationContent,
      contentType: 'component',
    },
    {
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(mergedResult, null, 2),
      contentType: 'json',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
