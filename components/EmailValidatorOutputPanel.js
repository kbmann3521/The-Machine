import React, { useState } from 'react'
import styles from '../styles/tool-output.module.css'
import OutputTabs from './OutputTabs'

export default function EmailValidatorOutputPanel({ result }) {
  const [dnsData, setDnsData] = useState({})

  // Fetch DNS data for valid emails
  React.useEffect(() => {
    if (!result || !result.results) return

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
                const response = await fetch('/api/tools/email-validator-dns', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ domain }),
                  signal: controller.signal
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
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>AVG SCORE</div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>{result.averageDeliverabilityScore}</div>
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

                {/* Status label */}
                <div style={{ marginBottom: '8px' }}>
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

                    {/* Combined Grade Panel (Upgrade #1) */}
                    {emailResult.combinedGrade && (
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

                    {/* Business Email Intelligence (Upgrade #3) */}
                    {emailResult.businessEmail && (
                      <div style={{ padding: '10px', backgroundColor: 'rgba(0, 150, 136, 0.05)', borderRadius: '4px', border: '1px solid rgba(0, 150, 136, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Business Email Provider
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#009688', marginBottom: '3px' }}>
                          {emailResult.businessEmail.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          Type: <strong>{emailResult.businessEmail.type}</strong>
                        </div>
                      </div>
                    )}

                    {/* Phishing Risk (FIX #2: Separated from humanLikelihood) */}
                    {emailResult.phishingRisk && emailResult.phishingRisk !== 'Unknown' && (
                      <div style={{ padding: '10px', backgroundColor: emailResult.phishingRisk === 'Very High' ? 'rgba(244, 67, 54, 0.05)' : emailResult.phishingRisk === 'High' ? 'rgba(255, 152, 0, 0.05)' : emailResult.phishingRisk === 'Medium' ? 'rgba(255, 193, 7, 0.05)' : 'rgba(76, 175, 80, 0.05)', borderRadius: '4px', border: emailResult.phishingRisk === 'Very High' ? '1px solid rgba(244, 67, 54, 0.2)' : emailResult.phishingRisk === 'High' ? '1px solid rgba(255, 152, 0, 0.2)' : emailResult.phishingRisk === 'Medium' ? '1px solid rgba(255, 193, 7, 0.2)' : '1px solid rgba(76, 175, 80, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Phishing Risk
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: emailResult.phishingRisk === 'Very High' ? '#f44336' : emailResult.phishingRisk === 'High' ? '#ff9800' : emailResult.phishingRisk === 'Medium' ? '#ffc107' : '#4caf50', marginBottom: '3px' }}>
                          {emailResult.phishingRisk}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          {emailResult.phishingRisk === 'Very High' ? 'Role-based email on corporate domain - high impersonation risk' : emailResult.phishingRisk === 'High' ? 'Role-based email on freemail - potential phishing risk' : emailResult.phishingRisk === 'Medium' ? 'Moderate phishing risk detected' : 'Low phishing risk'}
                        </div>
                      </div>
                    )}

                    {/* TLD Quality (Upgrade #4) - Only show for valid emails */}
                    {emailResult.tldQuality && emailResult.deliverabilityScore > 0 && (
                      <div style={{ padding: '10px', backgroundColor: emailResult.tldQuality === 'high-trust' ? 'rgba(76, 175, 80, 0.05)' : emailResult.tldQuality === 'low-trust' ? 'rgba(239, 83, 80, 0.05)' : 'rgba(158, 158, 158, 0.05)', borderRadius: '4px', border: emailResult.tldQuality === 'high-trust' ? '1px solid rgba(76, 175, 80, 0.2)' : emailResult.tldQuality === 'low-trust' ? '1px solid rgba(239, 83, 80, 0.2)' : '1px solid rgba(158, 158, 158, 0.2)', marginTop: '12px' }}>
                        <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          TLD Quality
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: emailResult.tldQuality === 'high-trust' ? '#4caf50' : emailResult.tldQuality === 'low-trust' ? '#ef5350' : '#9e9e9e' }}>
                          {emailResult.tldQuality === 'high-trust' ? '✓ High-Trust TLD' : emailResult.tldQuality === 'low-trust' ? '✗ Low-Trust / Suspicious TLD' : '◐ Neutral TLD'}
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
                          {dnsData[emailResult.email].mxRecords && dnsData[emailResult.email].mxRecords.length > 0 && dnsData[emailResult.email].mxRecords.some(mx => mx.hostname) ? (
                            <div>
                              <div style={{ color: 'var(--color-text-secondary)', marginBottom: '3px' }}>MX Records:</div>
                              <div style={{ marginLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {dnsData[emailResult.email].mxRecords.map((mx, mxIdx) => (
                                  <div key={mxIdx} style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                                    [{mx.priority}] {mx.hostname}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                              No MX records (may use A records)
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
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Trustworthiness Scoring (0-100):</div>
          <div>✓ Username pattern analysis (gibberish detection)</div>
          <div>✓ Role-based email flagging</div>
          <div>✓ Human-like pattern recognition</div>
          <div>✓ Suspicious TLD detection</div>
          <div>✓ Disposable domain flagging</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Enterprise Features:</div>
          <div>✓ Combined letter grade (A+ to F)</div>
          <div>✓ Human likelihood labels (very likely human → bot)</div>
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
