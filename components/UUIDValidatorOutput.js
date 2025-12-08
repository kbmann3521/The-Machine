import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/uuid-validator.module.css'
import toolOutputStyles from '../styles/tool-output.module.css'

function CopyCard({ label, value }) {
  const [isCopied, setIsCopied] = useState(false)

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
    document.body.removeChild(textarea)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      fallbackCopy(value)
    }
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
          {isCopied ? '✓' : <FaCopy />}
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
      {/* Summary */}
      <CopyCard label="Summary" value={result.summary} />

      {/* Valid Reason - Only show for invalid UUIDs */}
      {!result.valid && result.validReason && (
        <CopyCard label="Validation Reason" value={result.validReason} />
      )}

      {/* Status */}
      {!result.valid && result.errors && result.errors.length > 0 && (
        <div className={styles.errorsWarning}>
          {result.errors.map((error, idx) => (
            <div key={idx} className={styles.errorItem}>✗ {error}</div>
          ))}
        </div>
      )}

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
          {/* RFC 4122 Compliance */}
          <CopyCard label="RFC 4122 Compliant" value={result.validRFC4122 ? 'Yes' : 'No'} />

          {/* Input Format */}
          <CopyCard label="Input Format" value={result.inputFormat} />

          {/* Normalization Status */}
          <CopyCard label="Was Normalized" value={result.wasNormalized ? 'Yes' : 'No'} />

          {/* Version & Type Info */}
          <CopyCard label="UUID Version" value={`v${result.version} (${result.versionName})`} />
          {result.versionDescription && (
            <CopyCard label="Version Description" value={result.versionDescription} />
          )}
          <CopyCard label="Type" value={result.type} />
          <CopyCard label="Variant" value={result.variant} />

          {/* Normalized UUID */}
          <CopyCard label="Normalized" value={result.normalized} />

          {/* RFC 4122 Validation Details */}
          {result.bitValidation && (
            <>
              <div className={styles.sectionHeader}>RFC 4122 Validation</div>
              <CopyCard label="Version Nibble Correct" value={result.bitValidation.versionNibbleCorrect ? 'Yes' : 'No'} />
              <CopyCard label="Variant Nibble Correct" value={result.bitValidation.variantNibbleCorrect ? 'Yes' : 'No'} />
            </>
          )}

          {/* Bit Breakdown */}
          {result.bits && (
            <>
              <div className={styles.sectionHeader}>Bit Fields</div>
              {result.bits.time_low && <CopyCard label="Time Low" value={result.bits.time_low} />}
              {result.bits.time_mid && <CopyCard label="Time Mid" value={result.bits.time_mid} />}
              {result.bits.time_high_and_version && <CopyCard label="Time High & Version" value={result.bits.time_high_and_version} />}
              {result.bits.clock_seq && <CopyCard label="Clock Sequence" value={result.bits.clock_seq} />}
              {result.bits.node && <CopyCard label="Node" value={result.bits.node} />}
            </>
          )}

          {/* Byte Representation */}
          {result.bytes && (
            <>
              <div className={styles.sectionHeader}>Bytes</div>
              <CopyCard label="Bytes Array" value={`[${result.bytes.join(', ')}]`} />
            </>
          )}

          {/* Alternative Formats */}
          <div className={styles.sectionHeader}>Alternative Formats</div>
          <CopyCard label="Hex" value={result.hex} />
          {result.raw && <CopyCard label="Raw" value={result.raw} />}
          <CopyCard label="Base64" value={result.base64} />
          <CopyCard label="URN" value={result.urn} />

          {/* Version 1 Timestamp */}
          {result.version === 1 && result.timestamp && (
            <>
              <div className={styles.sectionHeader}>Time Information</div>
              <CopyCard label="Generated At" value={result.timestamp} />
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
