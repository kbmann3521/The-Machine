import React, { useState } from 'react'
import styles from '../styles/uuid-validator.module.css'
import toolOutputStyles from '../styles/tool-output.module.css'

function CopyCard({ label, value }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className={toolOutputStyles.copyCard}>
      <div className={toolOutputStyles.copyCardHeader}>
        <span className={toolOutputStyles.copyCardLabel}>{label}</span>
        <button
          type="button"
          className="copy-action"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {isCopied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <div className={toolOutputStyles.copyCardValue}>{value}</div>
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
      {/* Status */}
      <div className={toolOutputStyles.copyCard}>
        <div className={toolOutputStyles.copyCardHeader}>
          <span className={toolOutputStyles.copyCardLabel}>
            {result.valid ? 'Status: Valid UUID' : 'Status: Invalid UUID'}
          </span>
        </div>
        {result.error && (
          <div className={styles.errorMessage}>
            <strong>Error:</strong> {result.error}
          </div>
        )}
      </div>

      {/* Common Mistakes Warning */}
      {result.commonMistakes && result.commonMistakes.length > 0 && (
        <div className={styles.mistakesWarning}>
          {result.commonMistakes.map((mistake, idx) => (
            <div key={idx} className={styles.mistakeItem}>⚠ {mistake}</div>
          ))}
        </div>
      )}

      {result.valid && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Version & Variant */}
          <CopyCard label="UUID Version" value={`v${result.version} (${result.versionName})`} />
          <CopyCard label="Variant" value={result.variant} />

          {/* Normalized UUID */}
          <CopyCard label="Normalized" value={result.normalized} />

          {/* Alternative Formats */}
          <CopyCard label="Hex" value={result.hex} />
          <CopyCard label="Base64" value={result.base64} />
          <CopyCard label="URN" value={result.urn} />

          {/* Version-Specific Metadata */}
          {result.version === 1 && result.metadata.timeLow && (
            <>
              <CopyCard label="Time Low" value={result.metadata.timeLow} />
              <CopyCard label="Time Mid" value={result.metadata.timeMid} />
              <CopyCard label="Time High" value={result.metadata.timeHigh} />
              <CopyCard label="Clock Sequence" value={result.metadata.clockSequence} />
              <CopyCard label="Node (MAC)" value={result.metadata.node} />
            </>
          )}

          {result.version === 7 && result.metadata.date && (
            <>
              <CopyCard label="Timestamp (ms)" value={result.metadata.timestampMs?.toString() || ''} />
              <CopyCard label="Date/Time" value={result.metadata.date} />
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function UUIDValidatorGeneratedOutput({ result }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <CopyCard label={`Generated UUID ${result.version}`} value={result.generated} />
    </div>
  )
}

export function UUIDValidatorBulkOutput({ result }) {
  return (
    <div className={styles.container}>
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
  )
}
