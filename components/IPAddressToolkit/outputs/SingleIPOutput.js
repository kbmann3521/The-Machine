import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function SingleIPOutput() {
  return (
    <div className={styles.outputSection}>
      <h2 className={styles.outputTitle}>Results</h2>

      {/* Placeholder Content */}
      <div className={styles.emptyOutput}>
        <p className={styles.emptyOutputText}>
          Enter an IP address and click "Run Analysis" to see results here
        </p>
      </div>

      {/* Example Result Cards (Hidden by default) */}
      <div style={{ display: 'none' }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Validation Results</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Status:</span>
              <span className={styles.resultValue}>Valid IPv4</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Classification:</span>
              <span className={styles.resultValue}>Public / Not Reserved</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Normalized Form</h3>
          <div className={styles.cardContent}>
            <code className={styles.codeBlock}>8.8.8.8</code>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Integer Conversion</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Decimal:</span>
              <span className={styles.resultValue}>134744072</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Hexadecimal:</span>
              <span className={styles.resultValue}>0x08080808</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Binary:</span>
              <span className={styles.resultValue}>00001000.00001000.00001000.00001000</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Classification</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Type:</span>
              <span className={styles.resultValue}>Public DNS</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Organization:</span>
              <span className={styles.resultValue}>Google LLC</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ASN Information</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>ASN:</span>
              <span className={styles.resultValue}>AS15169</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Organization:</span>
              <span className={styles.resultValue}>Google LLC</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Prefix:</span>
              <span className={styles.resultValue}>8.8.0.0/16</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Geo Information</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Country:</span>
              <span className={styles.resultValue}>United States</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Region:</span>
              <span className={styles.resultValue}>California</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Safety Score</h3>
          <div className={styles.cardContent}>
            <div className={styles.scoreBar}>
              <div className={styles.scoreBarFill} style={{ width: '12%' }}></div>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Risk Score:</span>
              <span className={styles.resultValue}>12/100 (Low Risk)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
