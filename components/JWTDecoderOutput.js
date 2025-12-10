import { useState, useEffect } from 'react'
import { FaCopy, FaCheck } from 'react-icons/fa6'
import styles from '../styles/jwt-decoder.module.css'
import toolOutputStyles from '../styles/tool-output.module.css'

function CopyCard({ label, value, variant = 'default' }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className={`${toolOutputStyles.copyCard} ${variant === 'highlight' ? styles.cardHighlight : ''}`}>
      <div className={toolOutputStyles.copyCardHeader}>
        <span className={toolOutputStyles.copyCardLabel}>{label}</span>
        <button
          type="button"
          className="copy-action"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {isCopied ? <FaCheck /> : <FaCopy />}
        </button>
      </div>
      <div className={toolOutputStyles.copyCardValue}>{value}</div>
    </div>
  )
}

function IssueBadge({ level }) {
  const config = {
    error: { icon: '✕', label: 'Error', color: '#ef5350' },
    warning: { icon: '⚠', label: 'Warning', color: '#ffc107' },
    info: { icon: 'ℹ', label: 'Info', color: '#2196f3' },
  }
  const cfg = config[level] || config.info

  return (
    <span className={`${styles.issueBadge} ${styles[`issueBadge-${level}`]}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function StatusSection({ title, icon, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <h3 className={styles.sectionTitle}>{title}</h3>
      </div>
      <div className={styles.sectionContent}>{children}</div>
    </div>
  )
}

function ClaimRow({ name, value, isTimestamp, timestamp }) {
  const [expanded, setExpanded] = useState(false)
  const hasTimestampData = isTimestamp && timestamp

  return (
    <div className={styles.claimRow}>
      <div className={styles.claimName}>{name}</div>
      <div className={styles.claimValue}>
        {JSON.stringify(value)}
      </div>
      {hasTimestampData && (
        <button
          className={styles.expandClaimButton}
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Hide details' : 'Show details'}
        >
          {expanded ? '▼' : '▶'}
        </button>
      )}
      {expanded && hasTimestampData && (
        <div className={styles.timestampDetails}>
          <div className={styles.timestampItem}>
            <span className={styles.timestampLabel}>UTC:</span>
            <span className={styles.timestampValue}>{timestamp.utc}</span>
          </div>
          <div className={styles.timestampItem}>
            <span className={styles.timestampLabel}>Local:</span>
            <span className={styles.timestampValue}>{timestamp.local}</span>
          </div>
          <div className={styles.timestampItem}>
            <span className={styles.timestampLabel}>Status:</span>
            <span className={`${styles.timestampValue} ${styles[`status-${timestamp.status}`]}`}>
              {timestamp.status === 'expired' ? '❌' : timestamp.status === 'future' ? '⏳' : '✅'} {timestamp.relative}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function for client-side HS256 verification using Web Crypto API
async function verifyHS256ClientSide(rawHeader, rawPayload, signatureB64Url, secret) {
  try {
    if (!secret) {
      return {
        verified: null,
        reason: 'Secret not provided — cannot verify signature',
      }
    }

    const encoder = new TextEncoder()
    const data = encoder.encode(`${rawHeader}.${rawPayload}`)
    const secretData = encoder.encode(secret)

    const key = await crypto.subtle.importKey(
      'raw',
      secretData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign('HMAC', key, data)
    const signatureArray = new Uint8Array(signature)

    // Convert to base64url
    let binaryString = ''
    for (let i = 0; i < signatureArray.byteLength; i++) {
      binaryString += String.fromCharCode(signatureArray[i])
    }
    const base64 = btoa(binaryString)
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    const verified = base64url === signatureB64Url

    return {
      verified,
      reason: verified
        ? 'Recomputed HMAC matches token signature'
        : 'Signature does not match. The secret is incorrect or token has been tampered with.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

export default function JWTDecoderOutput({ result, onSecretChange }) {
  const [expandedHeader, setExpandedHeader] = useState(false)
  const [expandedPayload, setExpandedPayload] = useState(true)
  const [expandedRawHeader, setExpandedRawHeader] = useState(false)
  const [expandedRawPayload, setExpandedRawPayload] = useState(false)
  const [verificationSecret, setVerificationSecret] = useState('')
  const [showSecretInput, setShowSecretInput] = useState(false)
  const [clientSignatureVerification, setClientSignatureVerification] = useState(null)

  // Re-verify signature when secret changes (client-side for HS256)
  React.useEffect(() => {
    if (!result || !result.decoded || !result.rawSegments) {
      setClientSignatureVerification(null)
      return
    }

    const { header, alg } = result.token
    if (alg !== 'HS256') {
      setClientSignatureVerification(null)
      return
    }

    // Verify asynchronously
    const verify = async () => {
      const verification = await verifyHS256ClientSide(
        result.rawSegments.header,
        result.rawSegments.payload,
        result.rawSegments.signature,
        verificationSecret
      )
      setClientSignatureVerification(verification)
    }

    verify()
  }, [result, verificationSecret])

  if (!result || !result.decoded) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>❌</div>
          <div className={styles.emptyTitle}>Unable to decode</div>
          <p className={styles.emptyMessage}>{result?.error || 'Invalid JWT format'}</p>
          {result?.raw?.header && (
            <div className={styles.rawDecodeFailureSection}>
              <p className={styles.failureLabel}>Raw decoded header:</p>
              <CopyCard label="Header (decoded)" value={result.raw.header} />
            </div>
          )}
          {result?.raw?.payload && (
            <div className={styles.rawDecodeFailureSection}>
              <p className={styles.failureLabel}>Raw decoded payload:</p>
              <CopyCard label="Payload (decoded)" value={result.raw.payload} />
            </div>
          )}
        </div>
      </div>
    )
  }

  const { token, raw, validation, timestamps, claims, diagnostics, summary, tokenType, ttlAnalysis, sensitiveData, headerSecurityWarnings, signatureVerification } = result

  return (
    <div className={styles.container}>
      {/* Summary Badge */}
      <div className={styles.summarySection}>
        <div className={`${styles.summaryBadge} ${summary.valid ? styles.summaryValid : styles.summaryInvalid}`}>
          <span className={styles.summaryIcon}>{summary.valid ? '✅' : '⚠️'}</span>
          <div className={styles.summaryContent}>
            <div className={styles.summaryStatus}>
              {summary.valid ? 'Valid JWT Structure' : 'Issues Found'}
            </div>
            <div className={styles.summaryStats}>
              {summary.errorCount > 0 && <span className={styles.errorCount}>{summary.errorCount} error{summary.errorCount !== 1 ? 's' : ''}</span>}
              {summary.warningCount > 0 && <span className={styles.warningCount}>{summary.warningCount} warning{summary.warningCount !== 1 ? 's' : ''}</span>}
              {summary.infoCount > 0 && <span className={styles.infoCount}>{summary.infoCount} info</span>}
              {summary.errorCount === 0 && summary.warningCount === 0 && summary.infoCount === 0 && <span className={styles.validCount}>No issues</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Phase 2: Token Type Analysis */}
      {tokenType && (
        <StatusSection title="Token Intelligence" icon="🧠">
          <div className={styles.tokenTypeSection}>
            <div className={styles.tokenTypeCard}>
              <div className={styles.tokenTypeLabel}>Type</div>
              <div className={styles.tokenTypeValue}>{tokenType.type}</div>
              <div className={styles.tokenTypeConfidence}>
                <span className={`${styles.confidenceBadge} ${styles[`confidence-${tokenType.confidence}`]}`}>
                  {tokenType.confidence} confidence
                </span>
              </div>
              {tokenType.signals.length > 0 && (
                <div className={styles.tokenTypeSignals}>
                  <div className={styles.signalsLabel}>Signals:</div>
                  <div className={styles.signalsList}>
                    {tokenType.signals.map((signal, idx) => (
                      <span key={idx} className={styles.signalTag}>{signal}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* TTL Analysis */}
            {ttlAnalysis && (
              <div className={styles.ttlAnalysisCard}>
                <div className={styles.ttlLabel}>Time-to-Live (TTL)</div>
                {ttlAnalysis.ttlSeconds !== null ? (
                  <>
                    <div className={styles.ttlValue}>
                      {ttlAnalysis.ttlSeconds} seconds ({(ttlAnalysis.ttlSeconds / 3600).toFixed(1)} hours)
                    </div>
                    <div className={`${styles.ttlStatus} ${styles[`ttlStatus-${ttlAnalysis.status}`]}`}>
                      {ttlAnalysis.status}
                    </div>
                    {ttlAnalysis.notes.length > 0 && (
                      <div className={styles.ttlNotes}>
                        {ttlAnalysis.notes.map((note, idx) => (
                          <div key={idx} className={styles.ttlNote}>• {note}</div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.ttlMissing}>Expiration time not available</div>
                )}
              </div>
            )}
          </div>
        </StatusSection>
      )}

      {/* Phase 2: Sensitive Data Detection */}
      {sensitiveData && (sensitiveData.containsPII || sensitiveData.containsSensitive || sensitiveData.containsFreeText) && (
        <StatusSection title="Security & Privacy" icon="🔒">
          <div className={styles.sensitiveDataWarnings}>
            {sensitiveData.containsSensitive && (
              <div className={`${styles.sensitiveAlert} ${styles.sensitiveAlertError}`}>
                <span className={styles.alertIcon}>🚨</span>
                <span className={styles.alertText}>Payload contains sensitive data fields. Never store secrets or keys in tokens.</span>
              </div>
            )}
            {sensitiveData.containsPII && (
              <div className={`${styles.sensitiveAlert} ${styles.sensitiveAlertWarning}`}>
                <span className={styles.alertIcon}>⚠️</span>
                <span className={styles.alertText}>Payload contains personally identifiable information (PII). Consider minimizing personal data in tokens.</span>
              </div>
            )}
            {sensitiveData.containsFreeText && (
              <div className={`${styles.sensitiveAlert} ${styles.sensitiveAlertInfo}`}>
                <span className={styles.alertIcon}>ℹ️</span>
                <span className={styles.alertText}>Payload contains unstructured free-text data. Consider using structured fields instead.</span>
              </div>
            )}
          </div>
        </StatusSection>
      )}

      {/* Phase 2: Header Security Warnings */}
      {headerSecurityWarnings && headerSecurityWarnings.length > 0 && (
        <StatusSection title="Header Analysis" icon="📌">
          <div className={styles.headerWarningsList}>
            {headerSecurityWarnings.map((warning, idx) => (
              <div key={idx} className={`${styles.headerWarningItem} ${styles[`headerWarning-${warning.level}`]}`}>
                <IssueBadge level={warning.level} />
                <span className={styles.warningText}>{warning.message}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {/* Phase 3: Signature Verification */}
      {signatureVerification && (
        <StatusSection title="Signature Verification" icon="🔐">
          <div className={styles.signatureVerificationSection}>
            {signatureVerification.algorithm === 'HS256' && (
              <div className={styles.secretInputContainer}>
                <div className={styles.secretInputHeader}>
                  <label htmlFor="verification-secret" className={styles.secretLabel}>
                    HS256 Verification Secret:
                  </label>
                  {verificationSecret && (
                    <span className={styles.secretIndicator}>✓ Secret provided</span>
                  )}
                </div>
                <input
                  id="verification-secret"
                  type={showSecretInput ? 'text' : 'password'}
                  value={verificationSecret}
                  onChange={(e) => {
                    setVerificationSecret(e.target.value)
                  }}
                  placeholder="Enter the secret used to sign this token"
                  className={styles.secretInput}
                />
                <button
                  type="button"
                  className={styles.secretToggleButton}
                  onClick={() => setShowSecretInput(!showSecretInput)}
                  title={showSecretInput ? 'Hide secret' : 'Show secret'}
                >
                  {showSecretInput ? '🙈' : '👁️'}
                </button>
              </div>
            )}
            {(() => {
              // Use client-side verification for HS256, fall back to server-side for others
              const verificationToDisplay = signatureVerification.algorithm === 'HS256' && clientSignatureVerification
                ? clientSignatureVerification
                : signatureVerification

              return (
                <div className={`${styles.signatureVerificationCard} ${styles[`verification-${verificationToDisplay.verified === true ? 'valid' : verificationToDisplay.verified === false ? 'invalid' : 'unknown'}`]}`}>
                  <div className={styles.verificationAlgorithm}>
                    <span className={styles.algoLabel}>Algorithm:</span>
                    <span className={styles.algoValue}>{signatureVerification.algorithm}</span>
                  </div>
                  <div className={`${styles.verificationStatus} ${styles[`status-${verificationToDisplay.verified === true ? 'valid' : verificationToDisplay.verified === false ? 'invalid' : 'unknown'}`]}`}>
                    {verificationToDisplay.verified === true && (
                      <>
                        <span className={styles.statusIcon}>✅</span>
                        <span className={styles.statusText}>Signature Valid</span>
                      </>
                    )}
                    {verificationToDisplay.verified === false && (
                      <>
                        <span className={styles.statusIcon}>❌</span>
                        <span className={styles.statusText}>Signature Invalid</span>
                      </>
                    )}
                    {verificationToDisplay.verified === null && (
                      <>
                        <span className={styles.statusIcon}>❓</span>
                        <span className={styles.statusText}>Cannot Verify</span>
                      </>
                    )}
                  </div>
                  <div className={styles.verificationReason}>
                    <span className={styles.reasonLabel}>Details:</span>
                    <span className={styles.reasonText}>{verificationToDisplay.reason}</span>
                  </div>
                </div>
              )
            })()}
          </div>
        </StatusSection>
      )}

      {/* Token Structure */}
      <StatusSection title="Token Structure" icon="🔐">
        <div className={styles.tokenStructure}>
          <div className={styles.tokenPart}>
            <div className={styles.tokenPartLabel}>Header</div>
            <div className={styles.tokenPartValue}>{raw.header.substring(0, 50)}{raw.header.length > 50 ? '...' : ''}</div>
          </div>
          <div className={styles.tokenPart}>
            <div className={styles.tokenPartLabel}>Payload</div>
            <div className={styles.tokenPartValue}>{raw.payload.substring(0, 50)}{raw.payload.length > 50 ? '...' : ''}</div>
          </div>
          <div className={styles.tokenPart}>
            <div className={styles.tokenPartLabel}>Signature</div>
            <div className={styles.tokenPartValue}>{token.signature.substring(0, 50)}{token.signature.length > 50 ? '...' : ''}</div>
          </div>
        </div>
      </StatusSection>

      {/* Raw Decoded Text (Phase 1.5) */}
      <StatusSection title="Decoded Values" icon="📝">
        <div className={styles.rawDecodedSection}>
          {/* Header */}
          <div className={styles.rawDecodedItem}>
            <button
              className={styles.rawExpandButton}
              onClick={() => setExpandedRawHeader(!expandedRawHeader)}
            >
              <span className={`${styles.rawExpandChevron} ${expandedRawHeader ? styles.rawExpandChevronOpen : ''}`}>▶</span>
              Header (raw decoded)
            </button>
            {expandedRawHeader && (
              <CopyCard label="Header" value={raw.header} />
            )}
          </div>

          {/* Payload */}
          <div className={styles.rawDecodedItem}>
            <button
              className={styles.rawExpandButton}
              onClick={() => setExpandedRawPayload(!expandedRawPayload)}
            >
              <span className={`${styles.rawExpandChevron} ${expandedRawPayload ? styles.rawExpandChevronOpen : ''}`}>▶</span>
              Payload (raw decoded)
            </button>
            {expandedRawPayload && (
              <CopyCard label="Payload" value={raw.payload} />
            )}
          </div>
        </div>
      </StatusSection>

      {/* Header */}
      <StatusSection title="Header" icon="📋">
        <div className={styles.expandableSection}>
          <button
            className={styles.expandButton}
            onClick={() => setExpandedHeader(!expandedHeader)}
          >
            <span className={`${styles.expandChevron} ${expandedHeader ? styles.expandChevronOpen : ''}`}>▶</span>
            {expandedHeader ? 'Hide' : 'Show'} Header Details
          </button>
          {expandedHeader && (
            <div className={styles.detailsContent}>
              <div className={styles.claimsGrid}>
                {Object.entries(token.header).map(([key, value]) => (
                  <div key={key} className={styles.headerRow}>
                    <span className={styles.claimName}>{key}</span>
                    <span className={styles.claimValue}>{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
              {validation.headerDuplicateKeys && validation.headerDuplicateKeys.length > 0 && (
                <div className={styles.duplicateKeysWarning}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Duplicate keys found: {validation.headerDuplicateKeys.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </StatusSection>

      {/* Payload */}
      <StatusSection title="Payload (Claims)" icon="📦">
        <div className={styles.expandableSection}>
          <button
            className={styles.expandButton}
            onClick={() => setExpandedPayload(!expandedPayload)}
          >
            <span className={`${styles.expandChevron} ${expandedPayload ? styles.expandChevronOpen : ''}`}>▶</span>
            {expandedPayload ? 'Hide' : 'Show'} Claims
          </button>
          {expandedPayload && (
            <div className={styles.detailsContent}>
              <div className={styles.claimsGrid}>
                {Object.entries(token.payload).map(([key, value]) => (
                  <ClaimRow
                    key={key}
                    name={key}
                    value={value}
                    isTimestamp={['exp', 'iat', 'nbf'].includes(key)}
                    timestamp={timestamps[key]}
                  />
                ))}
              </div>
              {validation.payloadDuplicateKeys && validation.payloadDuplicateKeys.length > 0 && (
                <div className={styles.duplicateKeysWarning}>
                  <span className={styles.warningIcon}>⚠️</span>
                  <span>Duplicate keys found: {validation.payloadDuplicateKeys.join(', ')}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </StatusSection>

      {/* Signature */}
      <StatusSection title="Signature" icon="✍️">
        <CopyCard label="Signature Value" value={token.signature} variant="highlight" />
        <p className={styles.signatureNote}>
          ℹ️ This tool cannot verify the signature without the secret key. Use your backend or jwt.io to verify.
        </p>
      </StatusSection>

      {/* Diagnostics */}
      {diagnostics.length > 0 && (
        <StatusSection title="Claim Analysis" icon="🔍">
          <div className={styles.diagnosticsList}>
            {diagnostics.map((issue, idx) => (
              <div key={idx} className={`${styles.diagnosticsItem} ${styles[`diagnostics-${issue.level}`]}`}>
                <IssueBadge level={issue.level} />
                <span className={styles.diagnosticMessage}>{issue.message}</span>
              </div>
            ))}
          </div>
        </StatusSection>
      )}

      {/* Claim Presence */}
      <StatusSection title="Claim Presence" icon="📌">
        <div className={styles.claimPresenceList}>
          <div className={styles.claimPresenceGroup}>
            <h4 className={styles.claimPresenceTitle}>Present Claims ({claims.present.length})</h4>
            {claims.present.length > 0 ? (
              <div className={styles.claimPresenceItems}>
                {claims.present.map((claim) => (
                  <span key={claim} className={styles.claimPresenceBadge}>
                    ✅ {claim}
                  </span>
                ))}
              </div>
            ) : (
              <p className={styles.claimPresenceEmpty}>No standard claims found</p>
            )}
          </div>
        </div>
      </StatusSection>

    </div>
  )
}
