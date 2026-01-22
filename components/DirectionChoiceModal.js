import React from 'react'
import styles from '../styles/rule-inspector.module.css'

/**
 * DirectionChoiceModal Component
 *
 * Shows when merging duplicate selectors that exist in BOTH HTML and CSS tabs.
 * Allows user to choose which tab should contain the final merged selector.
 *
 * Props:
 *   selector: string - the selector being merged
 *   htmlCount: number - how many duplicates in HTML tab
 *   cssCount: number - how many duplicates in CSS tab
 *   onSelectDirection: (direction) => void - callback with 'html' or 'css'
 *   onCancel: () => void - callback to go back to merge confirmation
 */
export default function DirectionChoiceModal({
  selector = '',
  htmlCount = 0,
  cssCount = 0,
  onSelectDirection = null,
  onCancel = null,
}) {
  const handleSelectHtml = () => {
    if (onSelectDirection) {
      onSelectDirection('html')
    }
  }

  const handleSelectCss = () => {
    if (onSelectDirection) {
      onSelectDirection('css')
    }
  }

  return (
    <div className={styles.confirmationOverlay} onClick={onCancel}>
      <div className={styles.confirmationModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmationHeader}>
          <h3 className={styles.confirmationTitle}>
            📍 Choose Merge Direction
          </h3>
        </div>

        <div className={styles.confirmationContent}>
          <div className={styles.directionWarning}>
            <p>
              The selector <code style={{ fontWeight: 600, color: 'var(--color-accent, #0066cc)' }}>{selector}</code> exists in both tabs:
            </p>
            <ul style={{ marginTop: '12px', marginBottom: '16px' }}>
              <li><strong>HTML tab:</strong> {htmlCount} duplicate{htmlCount !== 1 ? 's' : ''}</li>
              <li><strong>CSS tab:</strong> {cssCount} duplicate{cssCount !== 1 ? 's' : ''}</li>
            </ul>
            <p>
              Choose which tab should contain the final merged selector:
            </p>
          </div>

          <div className={styles.directionChoices}>
            <button
              className={styles.directionButtonHtml}
              onClick={handleSelectHtml}
              title={`Merge to HTML tab - will consolidate ${htmlCount + cssCount} rules into HTML`}
            >
              <div className={styles.directionButtonIcon}>📄</div>
              <div className={styles.directionButtonLabel}>Merge to HTML Tab</div>
              <div className={styles.directionButtonInfo}>
                Consolidate all {htmlCount + cssCount} rules into HTML
              </div>
            </button>

            <button
              className={styles.directionButtonCss}
              onClick={handleSelectCss}
              title={`Merge to CSS tab - will consolidate ${htmlCount + cssCount} rules into CSS`}
            >
              <div className={styles.directionButtonIcon}>🎨</div>
              <div className={styles.directionButtonLabel}>Merge to CSS Tab</div>
              <div className={styles.directionButtonInfo}>
                Consolidate all {htmlCount + cssCount} rules into CSS
              </div>
            </button>
          </div>
        </div>

        <div className={styles.confirmationActions}>
          <button
            className={styles.confirmationCancelButton}
            onClick={onCancel}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  )
}
