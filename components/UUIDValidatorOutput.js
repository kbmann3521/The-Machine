import React, { useState } from 'react'
import styles from '../styles/uuid-validator.module.css'
import toolOutputStyles from '../styles/tool-output.module.css'

function CopyCard({ label, value, onCopy }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    if (onCopy) onCopy()
  }

  return (
    <div className={toolOutputStyles.copyCard}>
      <div className={toolOutputStyles.copyCardLabel}>{label}</div>
      <div className={toolOutputStyles.copyCardValue}>{value}</div>
      <button
        className={toolOutputStyles.copyCardButton}
        onClick={handleCopy}
        title="Copy to clipboard"
      >
        {isCopied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function UUIDValidatorOutput({ result }) {
  if (!result) {
    return null
  }

  // Standard validation mode - display main content only (tabs handle JSON)
  return (
    <div className={styles.container}>
      {/* Validity Status */}
      <div className={`${styles.section} ${result.valid ? styles.validSection : styles.invalidSection}`}>
        <h3>Status</h3>
        <div className={styles.statusBox}>
          <div className={styles.statusIndicator}>
            {result.valid ? <span className={styles.validIcon}>✓</span> : <span className={styles.invalidIcon}>✗</span>}
            <span>{result.valid ? 'Valid UUID' : 'Invalid UUID'}</span>
          </div>
          {result.error && (
            <div className={styles.errorMessage}>
              <strong>Reason:</strong> {result.error}
            </div>
          )}
        </div>
      </div>

      {/* Common Mistakes */}
      {result.commonMistakes && result.commonMistakes.length > 0 && (
        <div className={styles.section}>
          <h3>⚠ Detected Issues</h3>
          <ul className={styles.mistakesList}>
            {result.commonMistakes.map((mistake, idx) => (
              <li key={idx}>{mistake}</li>
            ))}
          </ul>
        </div>
      )}

      {result.valid && (
        <>
          {/* UUID Version & Variant */}
          <div className={styles.section}>
            <h3>Version & Variant</h3>
            <div className={styles.metadataGrid}>
              <div className={styles.metadataItem}>
                <label>UUID Version:</label>
                <div className={styles.metadataValue}>
                  v{result.version} ({result.versionName})
                </div>
              </div>
              <div className={styles.metadataItem}>
                <label>Variant:</label>
                <div className={styles.metadataValue}>{result.variant}</div>
              </div>
            </div>
          </div>

          {/* Normalized UUID */}
          <div className={styles.section}>
            <h3>Normalized</h3>
            <div className={styles.formatBox}>
              <code>{result.normalized}</code>
              <button
                className={styles.copyButton}
                onClick={() => copyToClipboard(result.normalized, 'normalized')}
              >
                {copiedField === 'normalized' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Alternative Formats */}
          <div className={styles.section}>
            <h3>Alternative Formats</h3>
            <div className={styles.formatsGrid}>
              <div className={styles.formatItem}>
                <label>Hex</label>
                <div className={styles.formatBox}>
                  <code>{result.hex}</code>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(result.hex, 'hex')}
                  >
                    {copiedField === 'hex' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className={styles.formatItem}>
                <label>Base64</label>
                <div className={styles.formatBox}>
                  <code>{result.base64}</code>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(result.base64, 'base64')}
                  >
                    {copiedField === 'base64' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className={styles.formatItem}>
                <label>URN</label>
                <div className={styles.formatBox}>
                  <code>{result.urn}</code>
                  <button
                    className={styles.copyButton}
                    onClick={() => copyToClipboard(result.urn, 'urn')}
                  >
                    {copiedField === 'urn' ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Version-Specific Metadata */}
          {result.version === 1 && result.metadata.timeLow && (
            <div className={styles.section}>
              <h3>Time-Based Metadata (v1)</h3>
              <div className={styles.metadataGrid}>
                <div className={styles.metadataItem}>
                  <label>Time Low:</label>
                  <code>{result.metadata.timeLow}</code>
                </div>
                <div className={styles.metadataItem}>
                  <label>Time Mid:</label>
                  <code>{result.metadata.timeMid}</code>
                </div>
                <div className={styles.metadataItem}>
                  <label>Time High:</label>
                  <code>{result.metadata.timeHigh}</code>
                </div>
                <div className={styles.metadataItem}>
                  <label>Clock Sequence:</label>
                  <code>{result.metadata.clockSequence}</code>
                </div>
                <div className={styles.metadataItem}>
                  <label>Node (MAC):</label>
                  <code>{result.metadata.node}</code>
                </div>
              </div>
            </div>
          )}

          {result.version === 7 && result.metadata.date && (
            <div className={styles.section}>
              <h3>Unix Timestamp Metadata (v7)</h3>
              <div className={styles.metadataGrid}>
                <div className={styles.metadataItem}>
                  <label>Timestamp (ms):</label>
                  <code>{result.metadata.timestampMs}</code>
                </div>
                <div className={styles.metadataItem}>
                  <label>Date/Time:</label>
                  <code>{result.metadata.date}</code>
                </div>
              </div>
            </div>
          )}

          {/* JSON Output */}
          <div className={styles.section}>
            <h3>JSON Output</h3>
            <div className={styles.jsonBox}>
              <pre>{JSON.stringify(
                {
                  input: result.input,
                  valid: result.valid,
                  version: result.version,
                  versionName: result.versionName,
                  variant: result.variant,
                  normalized: result.normalized,
                  hex: result.hex,
                  base64: result.base64,
                  urn: result.urn,
                  ...(result.metadata.node && { node: result.metadata.node }),
                  ...(result.metadata.date && { timestamp: result.metadata.date }),
                },
                null,
                2
              )}</pre>
              <button
                className={styles.copyButton}
                onClick={() =>
                  copyToClipboard(
                    JSON.stringify(
                      {
                        input: result.input,
                        valid: result.valid,
                        version: result.version,
                        versionName: result.versionName,
                        variant: result.variant,
                        normalized: result.normalized,
                        hex: result.hex,
                        base64: result.base64,
                        urn: result.urn,
                        ...(result.metadata.node && { node: result.metadata.node }),
                        ...(result.metadata.date && { timestamp: result.metadata.date }),
                      },
                      null,
                      2
                    ),
                    'json'
                  )
                }
              >
                {copiedField === 'json' ? '✓ Copied' : 'Copy JSON'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
