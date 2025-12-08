import React, { useState } from 'react'
import { FaCopy, FaChevronDown, FaChevronRight } from 'react-icons/fa6'
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

function Badge({ label, variant = 'default' }) {
  const badgeClasses = {
    default: styles.badgeDefault,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
  }

  return <span className={`${styles.badge} ${badgeClasses[variant]}`}>{label}</span>
}

function VersionExplanation({ version, expanded, onToggle }) {
  const explanations = {
    1: 'Time-based UUID generated from MAC address and timestamp. Useful for sorting and chronological ordering, but reveals the MAC address.',
    3: 'Name-based UUID using MD5 hash. Deterministic - same namespace and name always produce the same UUID. Good for consistency but less random.',
    4: 'Randomly generated UUID using cryptographic randomness. Most common choice for distributed systems with no ordering requirements.',
    5: 'Name-based UUID using SHA-1 hash. Like v3 but with better security properties. Deterministic for same namespace/name.',
    7: 'Unix timestamp-based UUID with random component. Ordered by time, database-friendly for sorting, modern alternative to v1 without privacy concerns.',
  }

  return (
    <div className={styles.collapsibleSection}>
      <button
        type="button"
        className={styles.collapsibleHeader}
        onClick={onToggle}
      >
        {expanded ? <FaChevronDown /> : <FaChevronRight />}
        <span>About UUID v{version}</span>
      </button>
      {expanded && (
        <div className={styles.collapsibleContent}>
          {explanations[version]}
        </div>
      )}
    </div>
  )
}

function DatabaseSuggestion({ version }) {
  const suggestions = {
    1: 'Suitable for chronological ordering. ⚠️ Privacy concern: MAC address is embedded.',
    3: 'Not recommended for primary use. Better for deterministic generation in name-spaces.',
    4: 'Best for distributed systems, sharding, and random distribution. No ordering guarantees.',
    5: 'Similar to v3 but with SHA-1. Use when deterministic UUIDs are required.',
    7: '✓ Best for modern databases. Ordered by timestamp, optimized for B-tree indexing, excellent for sorting and range queries.',
  }

  return (
    <div className={styles.databaseSuggestion}>
      <div className={styles.suggestionLabel}>Database Recommendation</div>
      <div className={styles.suggestionText}>{suggestions[version]}</div>
    </div>
  )
}

function SecurityNotes({ version }) {
  const securityInfo = {
    1: {
      risks: [
        'Contains MAC address → reveals network hardware identity',
        'Timestamp embedded → creation time is visible',
        'Not anonymous → can be traced to specific machine',
        'Predictable sequence if timestamp is known',
      ],
      suitable: 'Suitable for: Internal systems where privacy is not a concern',
    },
    3: {
      risks: [
        'Deterministic → same input always produces same UUID',
        'Hash collision theoretically possible (low probability)',
        'Not suitable for secrets or authentication tokens',
      ],
      suitable: 'Suitable for: Consistent namespace-based identifiers, stable references',
    },
    4: {
      risks: [
        'Cryptographically random → unpredictable',
        'Not reversible → cannot extract original data',
        'No embedded metadata',
      ],
      suitable: 'Suitable for: URLs, invitations, API keys, session tokens, security-sensitive applications',
    },
    5: {
      risks: [
        'Deterministic → same input always produces same UUID',
        'SHA-1 hash used → cryptographically stronger than v3 MD5',
        'Not suitable for secrets or authentication tokens',
      ],
      suitable: 'Suitable for: Consistent namespace-based identifiers, stable references with better hash security',
    },
    7: {
      risks: [
        'Timestamp embedded → creation time is visible (millisecond precision)',
        'Random component → unpredictable except for timestamp portion',
        'Timestamp can be extracted → reveals when UUID was generated',
      ],
      suitable: 'Suitable for: Modern distributed systems, database ordering, audit logs with temporal ordering',
    },
  }

  const info = securityInfo[version] || securityInfo[4]

  return (
    <div className={styles.securityPanel}>
      <div className={styles.securityHeader}>🔐 Security Notes</div>
      <div className={styles.securityRisks}>
        <div className={styles.riskLabel}>Characteristics:</div>
        <ul className={styles.riskList}>
          {info.risks.map((risk, idx) => (
            <li key={idx}>{risk}</li>
          ))}
        </ul>
      </div>
      <div className={styles.securitySuitable}>
        {info.suitable}
      </div>
    </div>
  )
}

function SortabilityBadge({ version }) {
  const sortability = {
    1: { label: 'Sortable (by time)', variant: 'success' },
    3: { label: 'Not Sortable', variant: 'warning' },
    4: { label: 'Not Sortable', variant: 'warning' },
    5: { label: 'Not Sortable', variant: 'warning' },
    7: { label: 'HIGHLY Sortable', variant: 'success' },
  }

  const info = sortability[version] || sortability[4]

  return <Badge label={`Sortability: ${info.label}`} variant={info.variant} />
}

export default function UUIDValidatorOutput({ result }) {
  const [expandedExplanation, setExpandedExplanation] = useState(false)

  if (!result) {
    return null
  }

  const hasTimestamp = result.version === 1 && result.timestamp
  const hasTimestampV7 = result.version === 7

  // Standard validation mode - display main content only (tabs handle JSON)
  return (
    <div className={styles.container}>
      {/* Summary */}
      <CopyCard label="Summary" value={result.summary} />

      {/* Badges Row - Status indicators */}
      {result.valid && (
        <div className={styles.badgesRow}>
          <Badge label={`Version ${result.version}`} variant="info" />
          {result.validRFC4122 && <Badge label="RFC 4122 ✓" variant="success" />}
          {hasTimestamp && <Badge label="Has Timestamp ✓" variant="success" />}
          {hasTimestampV7 && <Badge label="Time-Ordered ✓" variant="success" />}
          <SortabilityBadge version={result.version} />
        </div>
      )}

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
          {/* Collapsible Explanation Section */}
          <VersionExplanation
            version={result.version}
            expanded={expandedExplanation}
            onToggle={() => setExpandedExplanation(!expandedExplanation)}
          />

          {/* Security Notes */}
          <SecurityNotes version={result.version} />

          {/* Database Recommendation */}
          <DatabaseSuggestion version={result.version} />

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

          {/* Version 1 & 7 Timestamp */}
          {(result.version === 1 || result.version === 7) && result.timestamp && (
            <>
              <div className={styles.sectionHeader}>Time Information</div>
              <CopyCard
                label={result.version === 7 ? 'Timestamp (from UUID)' : 'Generated At'}
                value={result.timestamp}
              />
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
