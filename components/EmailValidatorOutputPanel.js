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

    // Check MX redundancy
    if (dnsRecord.mxRecords.length >= 2) {
      // Multiple MX records indicate mature, redundant setup - small bonus
      penalties.push({ label: 'MX Redundancy', points: 2, description: 'Multiple MX records configured — redundant, mature mail setup' })
      totalPenalty -= 2
    }
  }

  // SPF penalty
  if (!dnsRecord.spfRecord) {
    penalties.push({ label: 'No SPF Record', points: -5, description: 'Missing SPF authentication' })
    totalPenalty += 5
  }

  // DMARC policy strength scoring
  if (!dnsRecord.dmarcRecord) {
    // No DMARC at all - significant risk
    penalties.push({ label: 'No DMARC Policy', points: -10, description: 'Missing DMARC authentication policy' })
    totalPenalty += 10
  } else {
    // Extract policy from DMARC record
    const dmarcPolicy = extractDmarcPolicy(dnsRecord.dmarcRecord)

    if (dmarcPolicy === 'reject') {
      // Strong enforcement - bonus
      penalties.push({ label: 'DMARC Policy: Reject', points: 5, description: 'Strict DMARC enforcement (p=reject) — strong authentication' })
      totalPenalty -= 5
    } else if (dmarcPolicy === 'quarantine') {
      // Moderate enforcement - neutral
      penalties.push({ label: 'DMARC Policy: Quarantine', points: 0, description: 'Moderate DMARC enforcement (p=quarantine) — takes spoofing seriously' })
      totalPenalty += 0
    } else if (dmarcPolicy === 'none') {
      // Weak enforcement - mild penalty
      penalties.push({ label: 'DMARC Policy: None', points: -5, description: 'Weak DMARC enforcement (p=none) — monitoring only, not enforced' })
      totalPenalty += 5
    }

    // Check for DMARC reporting configuration
    if (hasDmarcReporting(dnsRecord.dmarcRecord)) {
      // Domain has reporting configured - maturity signal
      penalties.push({ label: 'DMARC Monitoring', points: 3, description: 'Domain receives and monitors authentication failure reports (rua/ruf) — shows mature security practices' })
      totalPenalty -= 3
    }
  }

  return { penalties, totalPenalty }
}

export default function EmailValidatorOutputPanel({ result }) {
  const [dnsData, setDnsData] = useState({})
  const dnsAbortControllerRef = React.useRef(null)

  // Merge DNS data into results for JSON output and update valid flags/stats based on DNS
  const mergedResult = React.useMemo(() => {
    if (!result) return result

    // Update individual results with DNS data and recalculated valid status
    const updatedResults = result.results.map(emailResult => {
      const dnsRecord = dnsData[emailResult.email]
      const isInvalidByDns = dnsRecord?.mailHostType === 'none'
      const isActuallyValid = emailResult.valid && !emailResult.isDisposable && !isInvalidByDns

      // Calculate adjusted DHS based on DNS penalties
      let adjustedDhs = emailResult.dhsScore || 75
      let finalIdentityScore = emailResult.identityScore || 0

      if (isActuallyValid && dnsRecord) {
        const { totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)
        adjustedDhs = Math.max(0, Math.min(100, adjustedDhs - dnsTotalAdjustment))
        const lcsScore = emailResult.lcsScore || 100
        finalIdentityScore = Math.min(adjustedDhs, lcsScore)
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
        identityScore: finalIdentityScore,
        dhsScore: adjustedDhs,
        issues,
        dnsRecord: dnsRecord || undefined
      }
    })

    // Recalculate summary stats for JSON output (using adjusted identity scores)
    const validCount = updatedResults.filter(r => r.valid).length
    const invalidCount = updatedResults.length - validCount

    const validEmailsForAverage = updatedResults.filter(r => r.valid)
    let newAverageIdentityScore = undefined
    let newAverageCampaignReadiness = undefined

    if (validEmailsForAverage.length > 0) {
      newAverageIdentityScore = Math.round(
        validEmailsForAverage.reduce((sum, r) => sum + r.identityScore, 0) / validEmailsForAverage.length
      )

      if (newAverageIdentityScore >= 85) newAverageCampaignReadiness = 'Excellent'
      else if (newAverageIdentityScore >= 70) newAverageCampaignReadiness = 'Good'
      else if (newAverageIdentityScore >= 50) newAverageCampaignReadiness = 'Risky'
      else newAverageCampaignReadiness = 'Poor'
    }

    return {
      ...result,
      valid: validCount,
      invalid: invalidCount,
      averageIdentityScore: newAverageIdentityScore,
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

      // Calculate adjusted DHS based on DNS penalties
      let adjustedIdentityScore = emailResult.identityScore || 0
      if (isActuallyValid && dnsRecord) {
        const { totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)
        const adjustedDhs = Math.max(0, Math.min(100, (emailResult.dhsScore || 75) - dnsTotalAdjustment))
        const lcsScore = emailResult.lcsScore || 100
        adjustedIdentityScore = Math.min(adjustedDhs, lcsScore)
      }

      return {
        ...emailResult,
        isActuallyValid,
        adjustedIdentityScore
      }
    })

    const validCount = updatedResults.filter(r => r.isActuallyValid).length
    const invalidCount = updatedResults.length - validCount

    // Recalculate average only for actually valid emails (using adjusted scores)
    const validEmailsForAverage = updatedResults.filter(r => r.isActuallyValid)
    let newAverageIdentityScore = undefined
    let newAverageCampaignReadiness = undefined

    if (validEmailsForAverage.length > 0) {
      newAverageIdentityScore = Math.round(
        validEmailsForAverage.reduce((sum, r) => sum + r.adjustedIdentityScore, 0) / validEmailsForAverage.length
      )

      if (newAverageIdentityScore >= 85) newAverageCampaignReadiness = 'Excellent'
      else if (newAverageIdentityScore >= 70) newAverageCampaignReadiness = 'Good'
      else if (newAverageIdentityScore >= 50) newAverageCampaignReadiness = 'Risky'
      else newAverageCampaignReadiness = 'Poor'
    }

    return {
      valid: validCount,
      invalid: invalidCount,
      averageIdentityScore: newAverageIdentityScore,
      averageCampaignReadiness: newAverageCampaignReadiness
    }
  }, [result, dnsData])

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
        const newDnsData = {}
        const abortController = new AbortController()
        dnsAbortControllerRef.current = abortController

        // Create promises for each domain lookup
        const dnsPromises = result.results
          .filter(emailResult => emailResult.valid)
          .map(async (emailResult) => {
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
                  newDnsData[emailResult.email] = data
                } else {
                  newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
                }
              } catch (fetchError) {
                clearTimeout(timeoutId)
                if (fetchError.name === 'AbortError') {
                  newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup timeout' }
                } else {
                  newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
                }
              }
            } catch (error) {
              newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
            }
          })

        // Wait for all DNS lookups to complete (even partial)
        await Promise.all(dnsPromises).catch(() => {}) // Ignore any errors, we handled them individually

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setDnsData(newDnsData)
        }
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>TOTAL</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#4caf50' }}>{result.total}</div>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>VALID</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#4caf50' }}>{recalculatedStats?.valid ?? result.valid}</div>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          border: '1px solid rgba(239, 83, 80, 0.3)',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>INVALID</div>
          <div style={{ fontSize: '20px', fontWeight: '600', color: '#ef5350' }}>{recalculatedStats?.invalid ?? result.invalid}</div>
        </div>

        {result.mailcheckerAvailable && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>MAILCHECKER</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#2196f3' }}>Active</div>
          </div>
        )}

        {recalculatedStats?.averageIdentityScore !== undefined && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>AVG CAMPAIGN READINESS</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#9c27b0' }}>{recalculatedStats.averageCampaignReadiness}</div>
            <div style={{ fontSize: '15px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{recalculatedStats.averageIdentityScore}</div>
          </div>
        )}
      </div>

      {/* Email validation results */}
      {result.results && result.results.length > 0 && (
        <div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Email Results
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.results.map((emailResult, idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                backgroundColor: 'var(--color-background-tertiary)',
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

                      const dhsScore = emailResult.dhsScore || 75
                      const lcsCap = emailResult.lcsCap || 100
                      const adjustedDHS = Math.max(0, Math.min(100, dhsScore - dnsTotalAdjustment))
                      const adjustedScore = Math.min(adjustedDHS, lcsCap)

                      let readinessLevel = 'Poor'
                      if (adjustedScore >= 85) readinessLevel = 'Excellent'
                      else if (adjustedScore >= 70) readinessLevel = 'Good'
                      else if (adjustedScore >= 50) readinessLevel = 'Risky'
                      else readinessLevel = 'Poor'

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
                          fontSize: '11px',
                          fontWeight: '600',
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
                      {dnsData[emailResult.email]?.mailHostType === 'none' && (
                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • This domain has no mail server records (MX/A/AAAA). Email cannot be delivered.
                        </div>
                      )}
                      {emailResult.issues?.map((issue, issueIdx) => (
                        <div key={issueIdx} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Valid emails: Show warnings and details */}
                {emailResult.valid && dnsData[emailResult.email]?.mailHostType !== 'none' && !emailResult.isDisposable && (emailResult.roleBasedEmail || emailResult.hasBadReputation || emailResult.usernameHeuristics?.length > 0 || emailResult.domainHeuristics?.length > 0) && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#ff9800', marginBottom: '4px' }}>
                      ⚠ Warnings:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
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
                      {emailResult.usernameHeuristics?.map((heuristic, hIdx) => (
                        <div key={`uh-${hIdx}`} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • Username: {heuristic}
                        </div>
                      ))}
                      {emailResult.domainHeuristics?.map((heuristic, dhIdx) => (
                        <div key={`dh-${dhIdx}`} style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                          • Domain: {heuristic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}


                {/* Campaign Readiness (Identity Score) Panel - Only show for valid emails */}
                {emailResult.identityScore !== undefined && emailResult.valid && dnsData[emailResult.email]?.mailHostType !== 'none' && !emailResult.isDisposable && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(156, 39, 176, 0.05)', borderRadius: '4px', border: '1px solid rgba(156, 39, 176, 0.2)', marginTop: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Campaign Readiness
                    </div>
                    {(() => {
                      const dnsRecord = dnsData[emailResult.email]
                      const { penalties: dnsPenalties, totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)

                      // ===== SINGLE SOURCE OF TRUTH: Use backend-calculated values directly =====
                      // These are authoritative values from calculateIdentityScore() backend
                      const dhsScore = emailResult.dhsScore || 75  // Domain Health Score (infrastructure)
                      const lcsScore = emailResult.lcsScore || 100 // Local-Part Credibility Score (identity)

                      // Apply DNS adjustments to DHS only
                      const adjustedDHS = Math.max(0, Math.min(100, dhsScore - dnsTotalAdjustment))

                      // Final score = min(adjusted DHS, LCS)
                      // This ensures bad identity cannot be rescued by good domain
                      const adjustedScore = Math.min(adjustedDHS, lcsScore)

                      // Determine campaign readiness based on adjusted score
                      let readinessLevel = 'Poor'
                      if (adjustedScore >= 85) readinessLevel = 'Excellent'
                      else if (adjustedScore >= 70) readinessLevel = 'Good'
                      else if (adjustedScore >= 50) readinessLevel = 'Risky'
                      else readinessLevel = 'Poor'

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
                    {emailResult.identityBreakdown && emailResult.identityBreakdown.length > 0 && (
                      <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(156, 39, 176, 0.05)', borderRadius: '3px', border: '1px solid rgba(156, 39, 176, 0.1)' }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Score Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(() => {
                            const dnsRecord = dnsData[emailResult.email]
                            const { penalties: dnsPenalties, totalPenalty: dnsTotalAdjustment } = calculateDnsRecordPenalties(dnsRecord)

                            // ===== SINGLE SOURCE OF TRUTH (breakdown section): Same values as above =====
                            // Ensures displayed scores match final calculation
                            const dhsScore = emailResult.dhsScore || 75
                            const lcsScore = emailResult.lcsScore || 100
                            const adjustedDHS = Math.max(0, Math.min(100, dhsScore - dnsTotalAdjustment))
                            const adjustedScore = Math.min(adjustedDHS, lcsScore)

                            // Reorganize breakdown:
                            // 1. Update DHS header to show final adjusted value
                            // 2. Merge DNS items into DHS section so everything is visible
                            // 3. Update final score description to show actual values
                            const breakdownWithDns = [...(emailResult.identityBreakdown || [])]

                            // Find indices for DHS header, separator before LCS, and final score
                            let dhsSectionIndex = -1
                            let separatorBeforeLcsIndex = -1
                            let finalScoreIndex = -1

                            for (let i = 0; i < breakdownWithDns.length; i++) {
                              if (breakdownWithDns[i].isSectionHeader && breakdownWithDns[i].label.startsWith('Domain Health Score')) {
                                dhsSectionIndex = i
                              }
                              if (breakdownWithDns[i].isSectionHeader && breakdownWithDns[i].label.startsWith('Local-Part Credibility Score')) {
                                separatorBeforeLcsIndex = i - 1
                              }
                              if (breakdownWithDns[i].label === 'Final Campaign Readiness Score') {
                                finalScoreIndex = i
                              }
                            }

                            // STEP 1: Insert DNS penalties into DHS section (before the separator that precedes LCS)
                            // This must happen BEFORE we update indices
                            if (dhsSectionIndex >= 0 && separatorBeforeLcsIndex >= 0 && dnsPenalties.length > 0) {
                              breakdownWithDns.splice(separatorBeforeLcsIndex, 0, ...dnsPenalties)
                              // Adjust finalScoreIndex if it comes after the insertion point
                              if (finalScoreIndex >= separatorBeforeLcsIndex) {
                                finalScoreIndex += dnsPenalties.length
                              }
                            }

                            // STEP 2: Update DHS header to show final adjusted value
                            if (dhsSectionIndex >= 0) {
                              breakdownWithDns[dhsSectionIndex] = {
                                ...breakdownWithDns[dhsSectionIndex],
                                points: adjustedDHS  // Show final adjusted DHS in header
                              }
                            }

                            // STEP 3: Update final score description to show actual values
                            if (finalScoreIndex >= 0) {
                              breakdownWithDns[finalScoreIndex] = {
                                ...breakdownWithDns[finalScoreIndex],
                                points: adjustedScore,  // Ensure points is the final score, not a delta
                                description: `min(Domain Health Score (${Math.round(adjustedDHS)}), Local-Part Credibility Score (${lcsScore}))`,
                                isFinalScore: true  // Flag to render without +/- prefix
                              }
                            }

                            return (
                              <>
                                {breakdownWithDns.map((item, idx) => {
                                  // Skip separators and headers
                                  if (item.isSeparator) {
                                    return <div key={idx} style={{ height: '8px' }} />
                                  }

                                  if (item.isSectionHeader) {
                                    return (
                                      <div key={idx} style={{ marginTop: idx > 0 ? '8px' : '0px', marginBottom: '4px', paddingBottom: '4px', borderBottom: '1px solid rgba(156, 39, 176, 0.2)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#9c27b0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                          {item.label}: {Math.round(item.points)}
                                        </div>
                                        {item.description && <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{item.description}</div>}
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
                                      <div key={idx} style={{ padding: '6px 0', marginTop: '4px', paddingTop: '6px', borderTop: '1px solid rgba(156, 39, 176, 0.3)', display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#9c27b0' }}>
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
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: item.isSubItem ? '12px' : '13px', color: 'var(--color-text-secondary)', paddingBottom: idx < breakdownWithDns.length - 1 ? '4px' : '0px', borderBottom: idx < breakdownWithDns.length - 1 ? '1px solid rgba(156, 39, 176, 0.1)' : 'none', paddingLeft: item.isSubItem ? '24px' : '0px' }}>
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
                      </div>
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
            ))}
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
