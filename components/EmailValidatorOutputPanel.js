import React, { useState, useRef } from 'react'
import styles from '../styles/tool-output.module.css'
import OutputTabs from './OutputTabs'

export default function EmailValidatorOutputPanel({ result }) {
  const [dnsData, setDnsData] = useState({})
  const dnsDebounceTimerRef = useRef(null)

  // Fetch DNS data for valid emails with 3-second debounce
  React.useEffect(() => {
    if (!result || !result.results) return

    // Clear any existing debounce timer
    if (dnsDebounceTimerRef.current) {
      clearTimeout(dnsDebounceTimerRef.current)
    }

    // Debounce DNS fetches by 1 second
    dnsDebounceTimerRef.current = setTimeout(() => {
      const fetchDnsData = async () => {
        const newDnsData = {}

        for (const emailResult of result.results) {
          if (emailResult.valid) {
            try {
              const domain = emailResult.email.split('@')[1]
              if (domain) {
                const controller = new AbortController()
                const timeout = setTimeout(() => controller.abort(), 5000) // 5 second timeout

                try {
                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
                  const dnsUrl = `${baseUrl}/api/tools/email-validator-dns`

                  const response = await fetch(dnsUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ domain }),
                    signal: controller.signal,
                    credentials: 'same-origin',
                  })
                  clearTimeout(timeout)

                  if (response.ok) {
                    const data = await response.json()
                    newDnsData[emailResult.email] = data
                  } else {
                    newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
                  }
                } catch (fetchError) {
                  clearTimeout(timeout)
                  if (fetchError.name === 'AbortError') {
                    newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup timeout' }
                  } else {
                    newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
                  }
                }
              }
            } catch (error) {
              newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
            }
          }
        }

        setDnsData(newDnsData)
      }

      fetchDnsData()
    }, 1000)

    // Cleanup on unmount
    return () => {
      if (dnsDebounceTimerRef.current) {
        clearTimeout(dnsDebounceTimerRef.current)
      }
    }
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
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>TOTAL</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>{result.total}</div>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          border: '1px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>VALID</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>{result.valid}</div>
        </div>

        <div style={{
          padding: '12px',
          backgroundColor: 'rgba(239, 83, 80, 0.1)',
          border: '1px solid rgba(239, 83, 80, 0.3)',
          borderRadius: '4px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>INVALID</div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ef5350' }}>{result.invalid}</div>
        </div>

        {result.mailcheckerAvailable && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>MAILCHECKER</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#2196f3' }}>Active</div>
          </div>
        )}

        {result.averageDeliverabilityScore !== undefined && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>AVG DELIVERABILITY</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>{result.averageDeliverabilityScore}</div>
          </div>
        )}

        {result.averageIdentityScore !== undefined && (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '4px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>AVG CAMPAIGN READINESS</div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#9c27b0' }}>{result.averageCampaignReadiness}</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{result.averageIdentityScore}</div>
          </div>
        )}
      </div>

      {/* Email validation results */}
      {result.results && result.results.length > 0 && (
        <div>
          <div style={{
            fontSize: '12px',
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
                border: `1px solid ${emailResult.valid ? 'rgba(76, 175, 80, 0.3)' : 'rgba(239, 83, 80, 0.3)'}`,
                borderRadius: '4px',
                borderLeft: `3px solid ${emailResult.valid ? '#4caf50' : '#ef5350'}`,
              }}>
                {/* Email header with status and copy button */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ color: emailResult.valid ? '#4caf50' : '#ef5350', fontSize: '14px', flexShrink: 0 }}>
                    {emailResult.valid ? '✓' : '✗'}
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '500', wordBreak: 'break-all', overflowWrap: 'break-word', minWidth: 0 }}>
                    {emailResult.email}
                  </span>
                </div>

                {/* Status and Campaign Readiness */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: emailResult.valid ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                    color: emailResult.valid ? '#4caf50' : '#ef5350',
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                  }}>
                    {emailResult.valid ? '✓ Valid' : emailResult.isDisposable ? '✗ Invalid (Disposable domain)' : emailResult.hasSyntaxError ? '✗ Invalid (Syntax error)' : '✗ Invalid'}
                  </span>

                  {emailResult.campaignReadiness && (
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: emailResult.campaignReadiness === 'Excellent' ? 'rgba(76, 175, 80, 0.15)' :
                                      emailResult.campaignReadiness === 'Good' ? 'rgba(33, 150, 243, 0.15)' :
                                      emailResult.campaignReadiness === 'Risky' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(239, 83, 80, 0.15)',
                      color: emailResult.campaignReadiness === 'Excellent' ? '#4caf50' :
                             emailResult.campaignReadiness === 'Good' ? '#2196f3' :
                             emailResult.campaignReadiness === 'Risky' ? '#ff9800' : '#ef5350',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}>
                      Campaign: {emailResult.campaignReadiness}
                    </span>
                  )}
                </div>

                {/* Issues and flags */}
                {(emailResult.issues?.length > 0 || emailResult.roleBasedEmail || emailResult.isDisposable || emailResult.hasBadReputation) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {emailResult.issues?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#ef5350', marginBottom: '4px' }}>Issues:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {emailResult.issues.map((issue, issueIdx) => (
                            <div key={issueIdx} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                              • {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(emailResult.roleBasedEmail || emailResult.isDisposable || emailResult.hasBadReputation || emailResult.usernameHeuristics?.length > 0 || emailResult.domainHeuristics?.length > 0) && (
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: '600', color: '#ff9800', marginBottom: '4px' }}>
                          ⚠ Warnings:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {emailResult.roleBasedEmail && (
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                              • Role-based email (may not be a real user account)
                            </div>
                          )}
                          {emailResult.isDisposable && (
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                              • Disposable/temporary email domain detected
                            </div>
                          )}
                          {emailResult.hasBadReputation && (
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                              • Domain has poor reputation or is on blocklist
                            </div>
                          )}
                          {emailResult.usernameHeuristics?.map((heuristic, hIdx) => (
                            <div key={`uh-${hIdx}`} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                              • Username: {heuristic}
                            </div>
                          ))}
                          {emailResult.domainHeuristics?.map((heuristic, dhIdx) => (
                            <div key={`dh-${dhIdx}`} style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '16px' }}>
                              • Domain: {heuristic}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Campaign Readiness (Identity Score) Panel */}
                {emailResult.identityScore !== undefined && (
                  <div style={{ padding: '10px', backgroundColor: 'rgba(156, 39, 176, 0.05)', borderRadius: '4px', border: '1px solid rgba(156, 39, 176, 0.2)', marginTop: '10px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Campaign Readiness
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: '700', color: emailResult.campaignReadiness === 'Excellent' ? '#4caf50' : emailResult.campaignReadiness === 'Good' ? '#2196f3' : emailResult.campaignReadiness === 'Risky' ? '#ff9800' : '#ef5350' }}>
                        {emailResult.identityScore}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                        / {emailResult.campaignReadiness}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                      Identity-based score for email campaign suitability (0–100)
                    </div>

                    {/* Score Breakdown */}
                    {emailResult.identityBreakdown && emailResult.identityBreakdown.length > 0 && (
                      <div style={{ marginBottom: '8px', padding: '8px', backgroundColor: 'rgba(156, 39, 176, 0.05)', borderRadius: '3px', border: '1px solid rgba(156, 39, 176, 0.1)' }}>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                          Score Breakdown
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {emailResult.identityBreakdown.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '10px', color: 'var(--color-text-secondary)', paddingBottom: idx < emailResult.identityBreakdown.length - 1 ? '4px' : '0px', borderBottom: idx < emailResult.identityBreakdown.length - 1 ? '1px solid rgba(156, 39, 176, 0.1)' : 'none' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', color: item.points > 0 ? '#4caf50' : item.points < 0 ? '#ef5350' : 'var(--color-text-secondary)' }}>
                                  {item.label}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                                  {item.description}
                                </div>
                              </div>
                              <div style={{ fontWeight: '700', marginLeft: '8px', textAlign: 'right', color: item.points > 0 ? '#4caf50' : item.points < 0 ? '#ef5350' : 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                {item.points > 0 ? '+' : ''}{item.points}
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '2px solid rgba(156, 39, 176, 0.3)', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '11px' }}>
                          <span>Total</span>
                          <span style={{ color: '#9c27b0' }}>{emailResult.identityScore}</span>
                        </div>
                      </div>
                    )}

                    {emailResult.identitySignals && (emailResult.identitySignals.positive.length > 0 || emailResult.identitySignals.negative.length > 0) && (
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        {emailResult.identitySignals.positive.length > 0 && (
                          <div style={{ marginBottom: '4px' }}>
                            <strong style={{ color: '#4caf50' }}>✓ Positive:</strong> {emailResult.identitySignals.positive.join(', ')}
                          </div>
                        )}
                        {emailResult.identitySignals.negative.length > 0 && (
                          <div>
                            <strong style={{ color: '#ef5350' }}>✗ Negative:</strong> {emailResult.identitySignals.negative.join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Dual Score Panels: Deliverability + Trustworthiness */}
                {emailResult.deliverabilityScore !== undefined && emailResult.trustworthinessScore !== undefined && (
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

                    {/* Human Likelihood Label (Upgrade #2) */}
                    {emailResult.humanLikelihood && (
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
                    {(emailResult.gibberishScore !== undefined || emailResult.abusiveScore !== undefined || emailResult.roleBasedEmail) && (
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
                    {(emailResult.tldQuality || emailResult.businessEmail) && (
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
                    {emailResult.phishingRisk && emailResult.phishingRisk !== 'Unknown' && (
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
                    {emailResult.normalized && (
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

                {/* Domain Analysis */}
                {emailResult.valid && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                      DOMAIN ANALYSIS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
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
                              <span style={{ color: dnsData[emailResult.email].mailHostType === 'mx' ? '#4caf50' : dnsData[emailResult.email].mailHostType === 'fallback' ? '#ff9800' : '#ef5350', fontWeight: '600' }}>
                                {dnsData[emailResult.email].mailHostType === 'mx' ? '✓ Mail Server Type: MX' : dnsData[emailResult.email].mailHostType === 'fallback' ? '⚠ Mail Server Type: Fallback (A/AAAA)' : '✗ No Mail Server'}
                              </span>
                            </div>
                          )}

                          {dnsData[emailResult.email].mxRecords && dnsData[emailResult.email].mxRecords.length > 0 && dnsData[emailResult.email].mxRecords.some(mx => mx.hostname) ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600' }}>MX Records:</div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].mxRecords.map((mx, mxIdx) => (
                                  <div key={mxIdx} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    [{mx.priority}] {mx.hostname}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : dnsData[emailResult.email].aRecords && dnsData[emailResult.email].aRecords.length > 0 ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600' }}>
                                A Records (Fallback):
                              </div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].aRecords.map((rec, idx) => (
                                  <div key={idx} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {rec.address}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : dnsData[emailResult.email].aaaaRecords && dnsData[emailResult.email].aaaaRecords.length > 0 ? (
                            <div style={{ marginTop: '4px' }}>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px', fontWeight: '600' }}>
                                AAAA Records (Fallback):
                              </div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].aaaaRecords.map((rec, idx) => (
                                  <div key={idx} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    {rec.address}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                              No mail server records found (MX, A, or AAAA)
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
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
        fontSize: '12px',
        color: 'var(--color-text-secondary)',
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-primary)' }}>Features & Scoring System:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Validation:</div>
          <div>✓ RFC-like syntax validation</div>
          <div>✓ Disposable domain detection</div>
          <div>✓ Role-based email detection</div>
          <div>✓ ICANN TLD validation</div>
          <div>✓ DNS MX record lookup</div>
          <div>✓ Domain existence verification</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Deliverability Scoring (0-100):</div>
          <div>✓ Server-side delivery probability</div>
          <div>✓ MX record validity</div>
          <div>✓ Provider reputation (Gmail, Outlook, Yahoo)</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Campaign Readiness / Identity Score (0-100):</div>
          <div>✓ Measures identity-based vs expressive/narrative patterns</div>
          <div>✓ Personal name detection</div>
          <div>✓ Role-based email scoring</div>
          <div>✓ Structure and simplicity analysis</div>
          <div>✓ Detects abusive/hateful/adult content penalties</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Enterprise Features:</div>
          <div>✓ Combined letter grade (A+ to F)</div>
          <div>✓ Brand impersonation detection</div>
          <div>✓ Business email provider detection</div>
          <div>✓ TLD quality classification (high/low trust)</div>
          <div>✓ Username semantic analysis (names, brand impersonation, offensive terms)</div>
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
      content: JSON.stringify(result, null, 2),
      contentType: 'json',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
