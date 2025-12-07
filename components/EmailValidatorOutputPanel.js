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
              const response = await fetch('/api/tools/email-validator-dns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain })
              })
              if (response.ok) {
                const data = await response.json()
                newDnsData[emailResult.email] = data
              } else {
                newDnsData[emailResult.email] = { domainExists: null, mxRecords: [], error: 'Lookup failed' }
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
        content: 'Enter an email address to validate',
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
                    {emailResult.valid ? '✓ Valid' : emailResult.isDisposable ? '✗ Invalid (Disposable domain)' : '✗ Invalid'}
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

                {/* Deliverability Score */}
                {emailResult.deliverabilityScore !== undefined && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      DELIVERABILITY SCORE
                    </div>

                    {/* Score bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{
                        width: '100%',
                        height: '10px',
                        backgroundColor: 'var(--color-background-secondary)',
                        borderRadius: '5px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${emailResult.deliverabilityScore}%`,
                          backgroundColor: emailResult.deliverabilityScore >= 85 ? '#4caf50' :
                                           emailResult.deliverabilityScore >= 70 ? '#2196f3' :
                                           emailResult.deliverabilityScore >= 50 ? '#ff9800' : '#ef5350',
                          borderRadius: '5px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '30px', textAlign: 'right' }}>
                        {emailResult.deliverabilityScore}
                      </span>
                    </div>

                    {/* Score meaning */}
                    {emailResult.deliverabilityMeaning && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: '500', marginBottom: '8px' }}>
                        {emailResult.deliverabilityMeaning}
                      </div>
                    )}

                    {/* Penalties breakdown */}
                    {emailResult.penalties && emailResult.penalties.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(239, 83, 80, 0.2)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#ef5350', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Penalties Applied:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {emailResult.penalties.map((penalty, penaltyIdx) => (
                            <div key={penaltyIdx} style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                              • {penalty.issue} <span style={{ color: '#ef5350', fontWeight: '600' }}>-{penalty.deduction}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bonuses breakdown */}
                    {emailResult.bonuses && emailResult.bonuses.length > 0 && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(76, 175, 80, 0.2)' }}>
                        <div style={{ fontSize: '10px', fontWeight: '600', color: '#4caf50', marginBottom: '4px', textTransform: 'uppercase' }}>
                          Bonuses Applied:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {emailResult.bonuses.map((bonus, bonusIdx) => (
                            <div key={bonusIdx} style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                              • {bonus.feature} <span style={{ color: '#4caf50', fontWeight: '600' }}>+{bonus.bonus}</span>
                            </div>
                          ))}
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
          <div>✓ Bad reputation provider identification</div>
          <div>✓ Role-based email detection</div>
          <div>✓ Invalid domain pattern detection</div>
          <div>✓ ICANN TLD validation</div>
          <div>✓ DNS MX record lookup</div>
          <div>✓ Domain existence verification</div>
          <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginTop: '4px' }}>Scoring (0-100):</div>
          <div>✓ High-risk penalties (syntax, disposable, spammy TLDs)</div>
          <div>✓ Medium-risk penalties (role-based, automated, free-mail)</div>
          <div>✓ Low-risk penalties (whitespace, subdomains, non-ASCII)</div>
          <div>✓ Professional score mapping (Excellent → Guaranteed bad)</div>
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
