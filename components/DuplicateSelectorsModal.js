import React from 'react'
import styles from '../styles/rule-inspector.module.css'

/**
 * Helper to get origin label for a rule
 */
function getOriginLabel(rule) {
  if (!rule?.origin) return 'CSS'
  const source = rule.origin.source

  if (source === 'html') {
    return 'HTML <style>'
  } else if (source === 'css') {
    return 'CSS tab'
  }
  return 'CSS'
}

/**
 * DuplicateSelectorsModal Component
 *
 * Shows a list of all duplicate selector occurrences with their locations.
 * Supports both regular selectors and @keyframes selectors.
 *
 * Props:
 *   selector: string - The selector to show duplicates for (e.g., ".button" or "@keyframes fadeIn")
 *   affectingRules: array - All rules affecting the selector (for regular selectors)
 *   keyframes: array - All keyframe groups (for keyframe selectors)
 *   onClose: () => void - Callback when modal is closed
 */
export default function DuplicateSelectorsModal({
  selector = '',
  affectingRules = [],
  keyframes = [],
  onClose = null,
}) {
  if (!selector) {
    return null
  }

  // Check if this is a keyframe selector
  const isKeyframeSelector = selector.startsWith('@keyframes ')
  let duplicateRules = []

  if (isKeyframeSelector) {
    // Extract keyframe name from selector (e.g., "@keyframes fadeIn" → "fadeIn")
    const keyframeName = selector.replace('@keyframes ', '')
    // Filter all keyframe groups with the same name (duplicates)
    duplicateRules = keyframes.filter(kf => kf.name === keyframeName)
  } else {
    // Filter all rules with the same selector (duplicates)
    duplicateRules = affectingRules.filter(r => r.selector === selector)
  }

  if (duplicateRules.length <= 1) {
    return null
  }

  return (
    <div className={styles.confirmationOverlay} onClick={onClose}>
      <div className={styles.confirmationModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmationHeader}>
          <h3 className={styles.confirmationTitle}>
            🧩 Duplicate {isKeyframeSelector ? 'Keyframes' : 'Selectors'} ({duplicateRules.length})
          </h3>
        </div>

        <div className={styles.confirmationContent}>
          <p className={styles.confirmationWarning}>
            This {isKeyframeSelector ? 'keyframe animation' : 'selector'} appears <strong>{duplicateRules.length} times</strong> in your CSS.
            <br />
            {isKeyframeSelector
              ? 'Animation steps from each occurrence may override each other.'
              : 'Properties from each occurrence may cascade and override each other.'}
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            {duplicateRules.map((rule, idx) => {
              const label = isKeyframeSelector
                ? `@keyframes ${rule.name}`
                : rule.selector

              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--color-border, #ddd)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 102, 204, 0.02)',
                    fontSize: '12px',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}>
                    <span style={{
                      fontWeight: '600',
                      color: 'var(--color-text-primary, #000)',
                    }}>
                      {idx + 1}. {label}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    fontSize: '11px',
                    color: 'var(--color-text-secondary, #666)',
                  }}>
                    {isKeyframeSelector ? (
                      <>
                        {rule.loc && (
                          <span>
                            <strong>Line:</strong> {rule.loc.startLine}
                            {rule.loc.startLine !== rule.loc.endLine && `–${rule.loc.endLine}`}
                          </span>
                        )}
                        {rule.rules && rule.rules.length > 0 && (
                          <span>
                            <strong>Steps:</strong> {rule.rules.length}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span>
                          <strong>Origin:</strong> {getOriginLabel(rule)}
                        </span>
                        {rule.loc && (
                          <span>
                            <strong>Line:</strong> {rule.loc.startLine}
                            {rule.loc.startLine !== rule.loc.endLine && `–${rule.loc.endLine}`}
                          </span>
                        )}
                        {rule.declarations && rule.declarations.length > 0 && (
                          <span>
                            <strong>Properties:</strong> {rule.declarations.length}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '4px',
            fontSize: '12px',
            color: 'var(--color-text-primary, #000)',
            lineHeight: '1.5',
          }}>
            <strong>💡 Tip:</strong> {isKeyframeSelector
              ? 'Consider consolidating duplicate keyframe animations to avoid animation conflicts. Merge steps or reorganize your animations for better maintainability.'
              : 'Consider consolidating duplicate selectors to avoid cascade conflicts. Look for opportunities to merge these rules or reorganize your CSS for better maintainability.'
            }
          </div>
        </div>

        <div className={styles.confirmationActions}>
          <button
            className={styles.confirmationCancelButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
