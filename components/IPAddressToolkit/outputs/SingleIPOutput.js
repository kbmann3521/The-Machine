import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function SingleIPOutput({ result }) {
  // Show empty state if no result
  if (!result) {
    return (
      <div className={styles.outputSection}>
        <h2 className={styles.outputTitle}>Results</h2>
        <div className={styles.emptyOutput}>
          <p className={styles.emptyOutputText}>
            Enter an IP address to see analysis results
          </p>
        </div>
      </div>
    )
  }

  // Show error state
  if (result.error) {
    return (
      <div className={styles.outputSection}>
        <h2 className={styles.outputTitle}>Results</h2>
        <div className={styles.card}>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Error:</span>
              <span style={{ color: '#f44336' }}>{result.error}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show results
  return (
    <div className={styles.outputSection}>
      <h2 className={styles.outputTitle}>Results</h2>

      {/* Validation Status Card */}
      {result.isValid !== undefined && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Validation Status</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Valid:</span>
              <span className={result.isValid ? styles.textGreen : ''}>
                {result.isValid ? '✓ Yes' : '✗ No'}
              </span>
            </div>
            {result.version && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Version:</span>
                <span className={styles.resultValue}>{result.version}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Normalized Form Card */}
      {result.normalized && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Normalized Form</h3>
          <div className={styles.cardContent}>
            <code className={styles.codeBlock}>{result.normalized}</code>
          </div>
        </div>
      )}

      {/* Integer Conversion Card */}
      {result.integer !== null && result.integer !== undefined && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Integer Conversion</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Decimal:</span>
              <span className={styles.resultValue}>{result.integer}</span>
            </div>
            {result.integerHex && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Hexadecimal:</span>
                <span className={styles.resultValue}>{result.integerHex}</span>
              </div>
            )}
            {result.integerBinary && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Binary:</span>
                <span className={styles.resultValue}>{result.integerBinary}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classification Card */}
      {result.classification && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Classification</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Type:</span>
              <span className={styles.resultValue}>{result.classification.type}</span>
            </div>
            {result.classification.isPrivate !== undefined && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Private:</span>
                <span className={styles.resultValue}>
                  {result.classification.isPrivate ? 'Yes' : 'No'}
                </span>
              </div>
            )}
            {result.classification.isLoopback !== undefined && result.classification.isLoopback && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Loopback:</span>
                <span className={styles.resultValue}>Yes</span>
              </div>
            )}
            {result.classification.isMulticast !== undefined && result.classification.isMulticast && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Multicast:</span>
                <span className={styles.resultValue}>Yes</span>
              </div>
            )}
            {result.classification.isLinkLocal !== undefined && result.classification.isLinkLocal && (
              <div className={styles.resultRow}>
                <span className={styles.resultLabel}>Link-Local:</span>
                <span className={styles.resultValue}>Yes</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
