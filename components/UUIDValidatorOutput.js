import React, { useState } from 'react'
import styles from '../styles/uuid-validator.module.css'

export default function UUIDValidatorOutput({ result, selectedMode = 'validate' }) {
  const [copiedField, setCopiedField] = useState(null)

  if (!result) {
    return null
  }

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text)
    setCopiedField(fieldName)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Generation mode
  if (result.generated) {
    return (
      <div className={styles.container}>
        <div className={styles.generatedSection}>
          <h3>Generated UUID {result.version}</h3>
          <div className={styles.generatedBox}>
            <code>{result.generated}</code>
            <button
              className={styles.copyButton}
              onClick={() => copyToClipboard(result.generated, 'generated')}
            >
              {copiedField === 'generated' ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Bulk validation mode
  if (result.mode === 'bulk') {
    return (
      <div className={styles.container}>
        <div className={styles.bulkSection}>
          <h3>Bulk Validation Results</h3>
          <div className={styles.bulkTable}>
            <table>
              <thead>
                <tr>
                  <th>Row</th>
                  <th>Input</th>
                  <th>Valid</th>
                  <th>Version</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((row, idx) => (
                  <tr key={idx} className={row.valid ? styles.validRow : styles.invalidRow}>
                    <td>{row.row}</td>
                    <td>{row.input}</td>
                    <td>{row.valid ? '✓' : '✗'}</td>
                    <td>{row.version ? `v${row.version}` : '—'}</td>
                    <td>{row.error || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // Standard validation mode
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
