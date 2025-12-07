import React from 'react'
import styles from '../styles/csv-warnings.module.css'

export default function CSVWarningsPanel({ warnings = [] }) {
  if (!warnings || warnings.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.successMessage}>
          ✓ No issues detected
        </div>
      </div>
    )
  }

  const criticalCount = warnings.filter(w => w.severity === 'critical').length
  const warningCount = warnings.filter(w => w.severity === 'warning').length
  const infoCount = warnings.filter(w => w.severity === 'info').length

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return '🔴'
      case 'warning':
        return '🟡'
      case 'info':
        return '🔵'
      default:
        return '⚪'
    }
  }

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical':
        return 'Critical'
      case 'warning':
        return 'Warning'
      case 'info':
        return 'Info'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          Validation Results
        </h3>
        <div className={styles.summary}>
          {criticalCount > 0 && (
            <span className={styles.criticalBadge}>
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className={styles.warningBadge}>
              {warningCount} Warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
          {infoCount > 0 && (
            <span className={styles.infoBadge}>
              {infoCount} Info
            </span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {criticalCount > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Critical Issues</h4>
            <div className={styles.warningsList}>
              {warnings
                .filter(w => w.severity === 'critical')
                .map((warning, idx) => (
                  <div key={idx} className={`${styles.warningItem} ${styles.critical}`}>
                    <span className={styles.icon}>{getSeverityIcon('critical')}</span>
                    <div className={styles.content_inner}>
                      <div className={styles.message}>{warning.message}</div>
                      <div className={styles.description}>{warning.description}</div>
                      {warning.row !== undefined && (
                        <div className={styles.location}>Row {warning.row + 1}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {warningCount > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Warnings</h4>
            <div className={styles.warningsList}>
              {warnings
                .filter(w => w.severity === 'warning')
                .map((warning, idx) => (
                  <div key={idx} className={`${styles.warningItem} ${styles.warning}`}>
                    <span className={styles.icon}>{getSeverityIcon('warning')}</span>
                    <div className={styles.content_inner}>
                      <div className={styles.message}>{warning.message}</div>
                      <div className={styles.description}>{warning.description}</div>
                      {warning.row !== undefined && (
                        <div className={styles.location}>Row {warning.row + 1}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {infoCount > 0 && (
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Info</h4>
            <div className={styles.warningsList}>
              {warnings
                .filter(w => w.severity === 'info')
                .map((warning, idx) => (
                  <div key={idx} className={`${styles.warningItem} ${styles.info}`}>
                    <span className={styles.icon}>{getSeverityIcon('info')}</span>
                    <div className={styles.content_inner}>
                      <div className={styles.message}>{warning.message}</div>
                      <div className={styles.description}>{warning.description}</div>
                      {warning.row !== undefined && (
                        <div className={styles.location}>Row {warning.row + 1}</div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {warnings.some(w => w.severity === 'critical') && (
        <div className={styles.footer}>
          <p className={styles.footerMessage}>
            ⚠️ The CSV may have structural issues. Review warnings carefully before proceeding.
          </p>
        </div>
      )}
    </div>
  )
}
