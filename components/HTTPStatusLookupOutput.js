import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/http-status-lookup.module.css'
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

function StatusBadge({ variant = 'info', label }) {
  const badgeClasses = {
    success: styles.badgeSuccess,
    error: styles.badgeError,
    warning: styles.badgeWarning,
    info: styles.badgeInfo,
  }

  return (
    <span className={`${styles.badge} ${badgeClasses[variant]}`}>
      {label}
    </span>
  )
}

function SectionTitle({ children }) {
  return <div className={styles.sectionTitle}>{children}</div>
}

function SectionContent({ children }) {
  return <div className={styles.sectionContent}>{children}</div>
}

export default function HTTPStatusLookupOutput({ result, configOptions = {} }) {
  if (!result) {
    return null
  }

  // Handle empty result or no codes found
  if (!result.codes || result.codes.length === 0) {
    if (!result.suggestions || result.suggestions.length === 0) {
      return (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          No matching HTTP status codes found. Try a different input or mode.
        </div>
      )
    }
    // Handle search suggestions mode
    return (
      <div className={styles.container}>
        <SectionTitle>Suggested Matches</SectionTitle>
        <SectionContent>
          {result.suggestions.map((code, idx) => (
            <div key={idx} className={styles.suggestionCard}>
              <div className={styles.statusCodeLarge}>{code.code}</div>
              <div className={styles.statusName}>{code.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {code.description}
              </div>
            </div>
          ))}
        </SectionContent>
      </div>
    )
  }

  // Handle primary code display
  const primaryCode = result.codes[0]
  const framework = configOptions.framework || 'node'

  return (
    <div className={styles.container}>
      {/* Status Code Header */}
      <div className={styles.headerSection}>
        <div className={styles.statusCodeLarge}>{primaryCode.code}</div>
        <div className={styles.statusName}>{primaryCode.name}</div>
        <div className={styles.badgesRow}>
          <StatusBadge variant="info" label={primaryCode.category} />
          <StatusBadge
            variant={primaryCode.retryable ? 'warning' : 'info'}
            label={primaryCode.retryable ? '🔄 Retryable' : 'No Retry'}
          />
          <StatusBadge
            variant={primaryCode.cacheable ? 'success' : 'info'}
            label={primaryCode.cacheable ? '💾 Cacheable' : 'Not Cacheable'}
          />
        </div>
      </div>

      {/* Description */}
      <div className={styles.descriptionSection}>
        <SectionTitle>Description</SectionTitle>
        <SectionContent>
          <p className={styles.descriptionText}>{primaryCode.description}</p>
        </SectionContent>
      </div>

      {/* Typical Use */}
      <div className={styles.typicalUseSection}>
        <SectionTitle>Typical Use</SectionTitle>
        <SectionContent>
          <p className={styles.descriptionText}>{primaryCode.typicalUse}</p>
        </SectionContent>
      </div>

      {/* Common Causes */}
      {primaryCode.commonCauses && primaryCode.commonCauses.length > 0 && (
        <div className={styles.commonCausesSection}>
          <SectionTitle>Common Causes</SectionTitle>
          <SectionContent>
            <ul className={styles.causesList}>
              {primaryCode.commonCauses.map((cause, idx) => (
                <li key={idx} className={styles.causeItem}>{cause}</li>
              ))}
            </ul>
          </SectionContent>
        </div>
      )}

      {/* Dev Notes */}
      {primaryCode.devNotes && (
        <div className={styles.devNotesSection}>
          <SectionTitle>💡 Dev Notes</SectionTitle>
          <SectionContent>
            <p className={styles.devNotesText}>{primaryCode.devNotes}</p>
          </SectionContent>
        </div>
      )}

      {/* Code Example */}
      {primaryCode.exampleSnippet && (
        <div className={styles.codeExampleSection}>
          <SectionTitle>Code Example ({framework})</SectionTitle>
          <SectionContent>
            <pre className={styles.codeBlock}>
              <code>{primaryCode.exampleSnippet}</code>
            </pre>
          </SectionContent>
        </div>
      )}

      {/* Multiple Codes Found */}
      {result.codes.length > 1 && (
        <div className={styles.otherCodesSection}>
          <SectionTitle>Other Codes Found</SectionTitle>
          <SectionContent>
            <div className={styles.codesList}>
              {result.codes.slice(1).map((code, idx) => (
                <div key={idx} className={styles.codeListItem}>
                  <span className={styles.codeNumber}>{code.code}</span>
                  <span className={styles.codeName}>{code.name}</span>
                </div>
              ))}
            </div>
          </SectionContent>
        </div>
      )}
    </div>
  )
}
