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

// Helper function to convert PEM to ArrayBuffer
function pemToArrayBuffer(pem) {
  const binaryString = atob(
    pem
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\n/g, '')
      .replace(/\r/g, '')
  )
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Helper function to convert base64url to Uint8Array
function base64urlToUint8Array(base64url) {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

// Helper function for client-side HMAC verification using Web Crypto API
// Supports HS256, HS384, HS512
async function verifyHMACClientSide(algorithm, rawHeader, rawPayload, signatureB64Url, secret) {
  try {
    if (!secret) {
      return {
        verified: null,
        reason: 'Secret not provided — cannot verify signature',
      }
    }

    // Map HMAC algorithm to Web Crypto hash algorithm
    const hashMap = {
      HS256: 'SHA-256',
      HS384: 'SHA-384',
      HS512: 'SHA-512',
    }

    const hashAlg = hashMap[algorithm]
    if (!hashAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Use exact original segments - already trimmed by parser
    const encoder = new TextEncoder()
    const message = `${rawHeader}.${rawPayload}`
    const data = encoder.encode(message)
    const secretData = encoder.encode(secret)

    const key = await crypto.subtle.importKey(
      'raw',
      secretData,
      { name: 'HMAC', hash: hashAlg },
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

    // Debug info
    console.log(`[JWT Debug] Client-side ${algorithm} Verification:`, {
      headerLen: rawHeader.length,
      payloadLen: rawPayload.length,
      signatureLen: signatureB64Url.length,
      messageLen: message.length,
      expectedSig: base64url,
      providedSig: signatureB64Url,
      match: verified,
    })

    return {
      verified,
      reason: verified
        ? `Recomputed ${algorithm} (${hashAlg}) HMAC matches token signature`
        : 'Signature does not match. The secret is incorrect or token has been tampered with.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}`,
    }
  }
}

// Helper function for client-side RSA signature verification using Web Crypto API
// Supports RS256, RS384, RS512
async function verifyRSAClientSide(algorithm, rawHeader, rawPayload, signatureB64Url, publicKeyPem) {
  try {
    if (!publicKeyPem) {
      return {
        verified: null,
        reason: 'Public key not provided — cannot verify signature',
      }
    }

    // Validate PEM format
    if (!publicKeyPem.includes('BEGIN PUBLIC KEY') || !publicKeyPem.includes('END PUBLIC KEY')) {
      return {
        verified: false,
        reason: 'Invalid PEM format. Public key must start with "-----BEGIN PUBLIC KEY-----" and end with "-----END PUBLIC KEY-----"',
      }
    }

    // Map RSA algorithm to Web Crypto hash algorithm
    const hashMap = {
      RS256: 'SHA-256',
      RS384: 'SHA-384',
      RS512: 'SHA-512',
    }

    const hashAlg = hashMap[algorithm]
    if (!hashAlg) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Convert PEM to ArrayBuffer
    const publicKeyBuffer = pemToArrayBuffer(publicKeyPem)

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: hashAlg,
      },
      false,
      ['verify']
    )

    // Convert signature from base64url to bytes
    const signatureBytes = base64urlToUint8Array(signatureB64Url)

    // Create the message that was signed
    const encoder = new TextEncoder()
    const message = encoder.encode(`${rawHeader}.${rawPayload}`)

    // Verify the signature
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      signatureBytes,
      message
    )

    console.log(`[JWT Debug] Client-side ${algorithm} Verification:`, {
      verified,
      headerLen: rawHeader.length,
      payloadLen: rawPayload.length,
      signatureLen: signatureB64Url.length,
    })

    return {
      verified,
      reason: verified
        ? `${algorithm} (${hashAlg}) signature matches token contents`
        : 'Signature does not match. The public key does not match the private key used to sign.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}. Ensure the public key is valid.`,
    }
  }
}

// Helper function for client-side EC signature verification using Web Crypto API
// Supports ES256, ES384, ES512
async function verifyECClientSide(algorithm, rawHeader, rawPayload, signatureB64Url, publicKeyPem) {
  try {
    if (!publicKeyPem) {
      return {
        verified: null,
        reason: 'Public key not provided — cannot verify signature',
      }
    }

    // Validate PEM format
    if (!publicKeyPem.includes('BEGIN PUBLIC KEY') || !publicKeyPem.includes('END PUBLIC KEY')) {
      return {
        verified: false,
        reason: 'Invalid PEM format. Public key must start with "-----BEGIN PUBLIC KEY-----" and end with "-----END PUBLIC KEY-----"',
      }
    }

    // Map EC algorithm to Web Crypto hash algorithm and curve name
    const hashMap = {
      ES256: { hash: 'SHA-256', curve: 'P-256' },
      ES384: { hash: 'SHA-384', curve: 'P-384' },
      ES512: { hash: 'SHA-512', curve: 'P-521' },
    }

    const algConfig = hashMap[algorithm]
    if (!algConfig) {
      return {
        verified: false,
        reason: `Unsupported algorithm: ${algorithm}`,
      }
    }

    // Convert PEM to ArrayBuffer
    const publicKeyBuffer = pemToArrayBuffer(publicKeyPem)

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      {
        name: 'ECDSA',
        hash: algConfig.hash,
      },
      false,
      ['verify']
    )

    // Convert signature from base64url to bytes
    const signatureBytes = base64urlToUint8Array(signatureB64Url)

    // Create the message that was signed
    const encoder = new TextEncoder()
    const message = encoder.encode(`${rawHeader}.${rawPayload}`)

    // Verify the signature
    const verified = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: algConfig.hash,
      },
      publicKey,
      signatureBytes,
      message
    )

    console.log(`[JWT Debug] Client-side ${algorithm} Verification:`, {
      verified,
      headerLen: rawHeader.length,
      payloadLen: rawPayload.length,
      signatureLen: signatureB64Url.length,
    })

    return {
      verified,
      reason: verified
        ? `${algorithm} (${algConfig.hash} with ${algConfig.curve} curve) signature matches token contents`
        : 'Signature does not match. The public key does not match the private key used to sign.',
    }
  } catch (error) {
    return {
      verified: false,
      reason: `Verification error: ${error.message}. Ensure the public key is valid.`,
    }
  }
}

export default function JWTDecoderOutput({ result, onSecretChange }) {
  const [verificationSecret, setVerificationSecret] = useState('')
  const [showSecretInput, setShowSecretInput] = useState(false)
  const [verificationPublicKey, setVerificationPublicKey] = useState('')
  const [showPublicKeyInput, setShowPublicKeyInput] = useState(false)
  const [clientSignatureVerification, setClientSignatureVerification] = useState(null)
  const [useAutoFetch, setUseAutoFetch] = useState(true)
  const [showKeyDetails, setShowKeyDetails] = useState(false)

  // Re-verify signature when secret/public key changes (client-side for HS256/384/512, RS256/384/512, and ES256/384/512)
  useEffect(() => {
    if (!result || !result.decoded || !result.rawSegments) {
      setClientSignatureVerification(null)
      return
    }

    const alg = result.token.header?.alg
    const hmacAlgorithms = ['HS256', 'HS384', 'HS512']
    const rsaAlgorithms = ['RS256', 'RS384', 'RS512']
    const ecAlgorithms = ['ES256', 'ES384', 'ES512']

    if (hmacAlgorithms.includes(alg)) {
      // Verify asynchronously
      const verify = async () => {
        const verification = await verifyHMACClientSide(
          alg,
          result.rawSegments.header,
          result.rawSegments.payload,
          result.rawSegments.signature,
          verificationSecret
        )
        setClientSignatureVerification(verification)
      }

      verify()
    } else if (rsaAlgorithms.includes(alg)) {
      // Verify asynchronously
      const verify = async () => {
        const verification = await verifyRSAClientSide(
          alg,
          result.rawSegments.header,
          result.rawSegments.payload,
          result.rawSegments.signature,
          verificationPublicKey
        )
        setClientSignatureVerification(verification)
      }

      verify()
    } else if (ecAlgorithms.includes(alg)) {
      // Verify asynchronously
      const verify = async () => {
        const verification = await verifyECClientSide(
          alg,
          result.rawSegments.header,
          result.rawSegments.payload,
          result.rawSegments.signature,
          verificationPublicKey
        )
        setClientSignatureVerification(verification)
      }

      verify()
    } else {
      setClientSignatureVerification(null)
    }
  }, [result, verificationSecret, verificationPublicKey])

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
      {/* 0. Status Summary */}
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

      {/* 1. Token Intelligence + 2. Time-to-Live */}
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

            {/* Time-to-Live (TTL) Analysis */}
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

      {/* 3. Security & Privacy Analysis */}
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

      {/* 4. Header Analysis */}
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

      {/* 5. Signature Verification */}
      {signatureVerification && (
        <StatusSection title="Signature Verification" icon="🔐">
          {(() => {
            const hmacAlgorithms = ['HS256', 'HS384', 'HS512']
            const rsaAlgorithms = ['RS256', 'RS384', 'RS512']
            const ecAlgorithms = ['ES256', 'ES384', 'ES512']
            const verificationToDisplay = (hmacAlgorithms.includes(signatureVerification.algorithm) || rsaAlgorithms.includes(signatureVerification.algorithm) || ecAlgorithms.includes(signatureVerification.algorithm)) && clientSignatureVerification
              ? clientSignatureVerification
              : signatureVerification

            const kid = token?.header?.kid
            const iss = token?.payload?.iss
            const hasJwks = rsaAlgorithms.includes(signatureVerification.algorithm) && kid && iss
            const keySource = signatureVerification.keySource || 'manual'

            return (
              <div className={styles.signatureVerificationSection}>
                <div className={styles.signatureVerificationCard}>
                  <div className={styles.verificationAlgorithm}>
                    <span className={styles.algoLabel}>Algorithm:</span>
                    <span className={styles.algoValue}>{signatureVerification.algorithm}</span>
                  </div>

                  {hmacAlgorithms.includes(signatureVerification.algorithm) && (
                    <div className={styles.verificationInputSection}>
                      <label htmlFor="verification-secret" className={styles.verificationInputLabel}>
                        <span>Verification Secret</span>
                        {verificationSecret && (
                          <span className={styles.verificationInputIndicator}>✓ Provided</span>
                        )}
                      </label>
                      <div className={styles.secretInputWrapper}>
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
                    </div>
                  )}

                  {rsaAlgorithms.includes(signatureVerification.algorithm) && (
                    <>
                      {hasJwks && (
                        <div className={styles.keySourceSelector}>
                          <div className={styles.keySourceLabel}>Key Source</div>
                          <div className={styles.keySourceOptions}>
                            <label className={styles.radioOption}>
                              <input
                                type="radio"
                                name="keySource"
                                value="auto"
                                checked={useAutoFetch}
                                onChange={() => setUseAutoFetch(true)}
                              />
                              <span className={styles.radioLabel}>Auto-fetch from issuer (recommended)</span>
                            </label>
                            <label className={styles.radioOption}>
                              <input
                                type="radio"
                                name="keySource"
                                value="manual"
                                checked={!useAutoFetch}
                                onChange={() => setUseAutoFetch(false)}
                              />
                              <span className={styles.radioLabel}>Provide public key manually</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {useAutoFetch && hasJwks && (
                        <div className={styles.jwksInfoSection}>
                          <div className={styles.jwksInfoItem}>
                            <span className={styles.jwksLabel}>Issuer:</span>
                            <span className={styles.jwksValue}>{iss}</span>
                          </div>
                          <div className={styles.jwksInfoItem}>
                            <span className={styles.jwksLabel}>Key ID:</span>
                            <span className={styles.jwksValue}>{kid}</span>
                          </div>
                          {signatureVerification.jwksUrl && (
                            <div className={styles.jwksInfoItem}>
                              <span className={styles.jwksLabel}>JWKS URL:</span>
                              <span className={styles.jwksValue}>{signatureVerification.jwksUrl}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!useAutoFetch && (
                        <div className={styles.verificationInputSection}>
                          <label htmlFor="verification-public-key" className={styles.verificationInputLabel}>
                            <span>Public Key (PEM Format)</span>
                            {verificationPublicKey && (
                              <span className={styles.verificationInputIndicator}>✓ Provided</span>
                            )}
                          </label>
                          <textarea
                            id="verification-public-key"
                            value={verificationPublicKey}
                            onChange={(e) => {
                              setVerificationPublicKey(e.target.value)
                            }}
                            placeholder={`-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu5...\n-----END PUBLIC KEY-----`}
                            className={styles.publicKeyInput}
                          />
                          {showPublicKeyInput && (
                            <div className={styles.publicKeyDetails}>
                              <p className={styles.detailsLabel}>📌 Expected Format:</p>
                              <code className={styles.detailsCode}>
{`-----BEGIN PUBLIC KEY-----
[base64-encoded key data]
-----END PUBLIC KEY-----`}
                              </code>
                            </div>
                          )}
                        </div>
                      )}

                      {!hasJwks && (
                        <div className={styles.verificationInputSection}>
                          <label htmlFor="verification-public-key" className={styles.verificationInputLabel}>
                            <span>Public Key (PEM Format)</span>
                            {verificationPublicKey && (
                              <span className={styles.verificationInputIndicator}>✓ Provided</span>
                            )}
                          </label>
                          <textarea
                            id="verification-public-key"
                            value={verificationPublicKey}
                            onChange={(e) => {
                              setVerificationPublicKey(e.target.value)
                            }}
                            placeholder={`-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu5...\n-----END PUBLIC KEY-----`}
                            className={styles.publicKeyInput}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {ecAlgorithms.includes(signatureVerification.algorithm) && (
                    <div className={styles.verificationInputSection}>
                      <label htmlFor="verification-public-key-ec" className={styles.verificationInputLabel}>
                        <span>Public Key (PEM Format)</span>
                        {verificationPublicKey && (
                          <span className={styles.verificationInputIndicator}>✓ Provided</span>
                        )}
                      </label>
                      <textarea
                        id="verification-public-key-ec"
                        value={verificationPublicKey}
                        onChange={(e) => {
                          setVerificationPublicKey(e.target.value)
                        }}
                        placeholder={`-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE4fqY4ilv...\n-----END PUBLIC KEY-----`}
                        className={styles.publicKeyInput}
                      />
                      <div className={styles.publicKeyHint}>
                        <span className={styles.hintText}>💡 For {signatureVerification.algorithm}, provide an EC public key in PEM format.</span>
                      </div>
                    </div>
                  )}

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

                  {keySource === 'jwks' && signatureVerification.keyId && (
                    <div className={styles.jwksVerificationMetadata}>
                      <span className={styles.metadataItem}>🔑 Verified with key ID: <strong>{signatureVerification.keyId}</strong></span>
                      {signatureVerification.issuer && (
                        <span className={styles.metadataItem}>📍 Issuer: <strong>{signatureVerification.issuer}</strong></span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </StatusSection>
      )}

      {/* 6. Token Structure (Header / Payload / Signature) */}
      <StatusSection title="Token Structure" icon="🧱">
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

      {/* 7. Decoded JSON (Raw) - Header and Payload prettified */}
      <StatusSection title="Decoded JSON" icon="📝">
        <div className={styles.decodedJsonSection}>
          <div className={styles.decodedJsonItem}>
            <div className={styles.decodedJsonItemTitle}>Header</div>
            <CopyCard label="Header" value={raw.header} />
          </div>
          <div className={styles.decodedJsonItem}>
            <div className={styles.decodedJsonItemTitle}>Payload</div>
            <CopyCard label="Payload" value={raw.payload} />
          </div>
        </div>
      </StatusSection>

      {/* 8. Claims (Field-by-field View) */}
      <StatusSection title="Claims" icon="📋">
        <div className={styles.claimsFieldByFieldSection}>
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
      </StatusSection>

      {/* 9. Claim Analysis (Semantic Validation) */}
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

      {/* 10. Claim Presence Summary */}
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
