import React from 'react'
import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function BulkOutput() {
  return (
    <div className={styles.outputSection}>
      <h2 className={styles.outputTitle}>Results</h2>

      {/* Placeholder Content */}
      <div className={styles.emptyOutput}>
        <p className={styles.emptyOutputText}>
          Enter IP addresses and click "Run Bulk Processing" to see results here
        </p>
      </div>

      {/* Example Result Cards (Hidden by default) */}
      <div style={{ display: 'none' }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Summary</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Total IPs:</span>
              <span className={styles.resultValue}>538</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Valid:</span>
              <span className={styles.resultValue}>501</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Invalid:</span>
              <span className={styles.resultValue}>37</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Private:</span>
              <span className={styles.resultValue}>14</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Duplicates Removed:</span>
              <span className={styles.resultValue}>82</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Results Table</h3>
          <div className={styles.tableContainer}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Valid</th>
                  <th>Type</th>
                  <th>Geo</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>8.8.8.8</td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeSuccess}>✓</span>
                  </td>
                  <td>Public</td>
                  <td>US</td>
                </tr>
                <tr>
                  <td>10.0.0.1</td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeSuccess}>✓</span>
                  </td>
                  <td>Private</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td>999.999.1.1</td>
                  <td>
                    <span className={styles.badge + ' ' + styles.badgeError}>✗</span>
                  </td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>CIDR Compression Output</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Compressed:</span>
              <span className={styles.resultValue}>192.168.0.0/23</span>
            </div>
            <p className={styles.helperText}>
              192.168.0.0/24 + 192.168.1.0/24 → 192.168.0.0/23
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Download Results</h3>
          <div className={styles.cardContent}>
            <button className={styles.downloadButton}>
              ↓ Download CSV
            </button>
            <button className={styles.downloadButton}>
              ↓ Download JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
