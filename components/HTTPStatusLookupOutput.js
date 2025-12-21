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
  return <p className={styles.sectionTitle}>{children}</p>
}

function SectionContent({ children }) {
  return <div className={styles.sectionContent}>{children}</div>
}

function NoMatchesCard() {
  return (
    <div className={styles.noMatchesContainer}>
      <div className={styles.noMatchesCard}>
        <div className={styles.noMatchesIcon}>❌</div>
        <div className={styles.noMatchesTitle}>No matches found</div>
        <p className={styles.noMatchesMessage}>
          The input doesn't contain a valid HTTP status code or recognizable pattern.
        </p>

        <div className={styles.suggestionsSection}>
          <div className={styles.suggestionsTitle}>Try entering:</div>
          <ul className={styles.suggestionsList}>
            <li><strong>A status code:</strong> 404, 500, 429</li>
            <li><strong>A log line:</strong> "Server error: 500 occurred"</li>
            <li><strong>Error description:</strong> "payload too large", "unauthorized"</li>
            <li><strong>Multiple codes:</strong> "200, 401, 500"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ValidationWarning({ message, type = 'warning' }) {
  const variantStyles = {
    warning: {
      background: 'rgba(255, 193, 7, 0.05)',
      border: 'rgba(255, 193, 7, 0.2)',
      color: '#ffc107',
      icon: '⚠️'
    },
    info: {
      background: 'rgba(0, 102, 204, 0.05)',
      border: 'rgba(0, 102, 204, 0.2)',
      color: '#0066cc',
      icon: 'ℹ️'
    }
  }

  const variant = variantStyles[type] || variantStyles.warning

  return (
    <div className={styles.validationWarning} style={{
      background: `linear-gradient(135deg, ${variant.background} 0%, transparent 100%)`,
      borderColor: variant.border,
      borderLeftColor: variant.color
    }}>
      <span style={{ fontSize: '16px', marginRight: '8px' }}>{variant.icon}</span>
      <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
        {message}
      </span>
    </div>
  )
}

export default function HTTPStatusLookupOutput({ result, configOptions = {} }) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null)

  if (!result) {
    return null
  }

  // Handle empty result or no codes found
  if (!result.codes || result.codes.length === 0) {
    if (!result.suggestions || result.suggestions.length === 0) {
      return <NoMatchesCard />
    }

    // If a suggestion was clicked, show its full details
    if (selectedSuggestion) {
      const framework = configOptions.framework || 'node'
      const modeLabels = {
        'auto-code': 'Direct code match',
        'auto-log': 'Found in log',
        'auto-search': 'Text search match',
        'code': 'Direct code match',
        'log': 'Log analysis',
        'search': 'Text search'
      }
      const modeLabel = modeLabels['search'] || 'Code match'

      return (
        <div className={styles.container}>
          <div style={{ marginBottom: '12px' }}>
            <button
              onClick={() => setSelectedSuggestion(null)}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '12px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--color-background-secondary)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent'
              }}
            >
              ← Back to suggestions
            </button>
          </div>

          <ValidationWarning
            message={`${modeLabel}: "${selectedSuggestion.name}"`}
            type="info"
          />

          <div className={styles.headerSection}>
            <div className={styles.statusCodeLarge}>{selectedSuggestion.code}</div>
            <div className={styles.statusName}>{selectedSuggestion.name}</div>
            <div className={styles.badgesRow}>
              <StatusBadge variant="info" label={selectedSuggestion.category} />
              <StatusBadge
                variant={selectedSuggestion.retryable ? 'warning' : 'info'}
                label={selectedSuggestion.retryable ? '🔄 Retryable' : 'No Retry'}
              />
              <StatusBadge
                variant={selectedSuggestion.cacheable ? 'success' : 'info'}
                label={selectedSuggestion.cacheable ? '💾 Cacheable' : 'Not Cacheable'}
              />
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <SectionTitle>Description</SectionTitle>
            <SectionContent>
              <p className={styles.descriptionText}>{selectedSuggestion.description}</p>
            </SectionContent>
          </div>

          <div className={styles.typicalUseSection}>
            <SectionTitle>Typical Use</SectionTitle>
            <SectionContent>
              <p className={styles.descriptionText}>{selectedSuggestion.typicalUse}</p>
            </SectionContent>
          </div>

          {selectedSuggestion.commonCauses && selectedSuggestion.commonCauses.length > 0 && (
            <div className={styles.commonCausesSection}>
              <SectionTitle>Common Causes</SectionTitle>
              <SectionContent>
                <ul className={styles.causesList}>
                  {selectedSuggestion.commonCauses.map((cause, idx) => (
                    <li key={idx} className={styles.causeItem}>{cause}</li>
                  ))}
                </ul>
              </SectionContent>
            </div>
          )}

          {selectedSuggestion.devNotes && (
            <div className={styles.devNotesSection}>
              <SectionTitle>💡 Dev Notes</SectionTitle>
              <SectionContent>
                <p className={styles.devNotesText}>{selectedSuggestion.devNotes}</p>
              </SectionContent>
            </div>
          )}

          {selectedSuggestion.exampleSnippet && (
            <div className={styles.codeExampleSection}>
              <SectionTitle>Code Example ({framework})</SectionTitle>
              <SectionContent>
                <pre className={styles.codeBlock}>
                  <code>{selectedSuggestion.exampleSnippet}</code>
                </pre>
              </SectionContent>
            </div>
          )}
        </div>
      )
    }

    // Handle search suggestions mode
    return (
      <div className={styles.container}>
        <ValidationWarning
          message={`Showing best matches for: "${result.rawInput}"`}
          type="info"
        />
        <SectionTitle>Suggested Matches</SectionTitle>
        <SectionContent>
          {result.suggestions.map((code, idx) => (
            <div
              key={idx}
              className={styles.suggestionCard}
              onClick={() => setSelectedSuggestion(code)}
              style={{ cursor: 'pointer' }}
            >
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

  // Show info about which mode was used
  const modeLabels = {
    'auto-code': 'Direct code match',
    'auto-log': 'Found in log',
    'auto-search': 'Text search match',
    'code': 'Direct code match',
    'log': 'Log analysis',
    'search': 'Text search'
  }

  const modeLabel = modeLabels[result.modeUsed] || 'Code match'

  return (
    <div className={styles.container}>
      {/* Mode indicator */}
      {result.modeUsed && (
        <ValidationWarning
          message={`${modeLabel}: "${result.rawInput}"`}
          type="info"
        />
      )}

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
