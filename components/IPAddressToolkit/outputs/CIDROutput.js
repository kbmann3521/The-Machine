import React from 'react'
import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function CIDROutput() {
  return (
    <div className={styles.outputSection}>
      <h2 className={styles.outputTitle}>Results</h2>

      {/* Placeholder Content */}
      <div className={styles.emptyOutput}>
        <p className={styles.emptyOutputText}>
          Enter a base network and click "Run Subnetting" to see results here
        </p>
      </div>

      {/* Example Result Cards (Hidden by default) */}
      <div style={{ display: 'none' }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Subnet Breakdown</h3>
          <div className={styles.tableContainer}>
            <table className={styles.resultsTable}>
              <thead>
                <tr>
                  <th>CIDR</th>
                  <th>First IP</th>
                  <th>Last IP</th>
                  <th>Hosts</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>192.168.0.0/19</td>
                  <td>192.168.0.1</td>
                  <td>192.168.31.254</td>
                  <td>8192</td>
                </tr>
                <tr>
                  <td>192.168.32.0/19</td>
                  <td>192.168.32.1</td>
                  <td>192.168.63.254</td>
                  <td>8192</td>
                </tr>
                <tr>
                  <td>192.168.64.0/19</td>
                  <td>192.168.64.1</td>
                  <td>192.168.95.254</td>
                  <td>8192</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>CIDR Visualizer</h3>
          <div className={styles.visualizerContainer}>
            <div className={styles.visualizerBlock} style={{ width: '100%' }}>
              <div className={styles.subnetBlock} style={{ flex: 1 }}>
                <span className={styles.blockLabel}>192.168.0.0/19</span>
              </div>
              <div className={styles.subnetBlock} style={{ flex: 1 }}>
                <span className={styles.blockLabel}>192.168.32.0/19</span>
              </div>
              <div className={styles.subnetBlock} style={{ flex: 1 }}>
                <span className={styles.blockLabel}>192.168.64.0/19</span>
              </div>
              <div className={styles.subnetBlock} style={{ flex: 0.3 }}>
                <span className={styles.blockLabel}>...</span>
              </div>
            </div>
            <p className={styles.helperText}>
              Each block represents a subnet scaled to its relative size
            </p>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Export</h3>
          <div className={styles.cardContent}>
            <button className={styles.downloadButton}>
              ↓ Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
