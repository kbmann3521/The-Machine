import React from 'react'
import styles from '../../../styles/ip-toolkit.module.css'

export default function DiagnosticsOutput() {
  return (
    <div className={styles.outputSection}>
      <h2 className={styles.outputTitle}>Results</h2>

      {/* Placeholder Content */}
      <div className={styles.emptyOutput}>
        <p className={styles.emptyOutputText}>
          Enter a target IP and click "Run Diagnostics" to see results here
        </p>
      </div>

      {/* Example Result Cards (Hidden by default) */}
      <div style={{ display: 'none' }}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Ping Results</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Region:</span>
              <span className={styles.resultValue}>Auto</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Avg Latency:</span>
              <span className={styles.resultValue}>23 ms</span>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Packet Loss:</span>
              <span className={styles.resultValue}>0%</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Traceroute</h3>
          <div className={styles.cardContent}>
            <pre className={styles.traceOutput}>
{`1  192.168.1.1 (3 ms)
2  10.1.10.1 (5 ms)
3  * (timeout)
4  172.217.0.1 (28 ms)
5  8.8.8.8 (32 ms)`}
            </pre>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Reverse DNS (PTR)</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Hostname:</span>
              <span className={styles.resultValue}>dns.google</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Reputation Check</h3>
          <div className={styles.cardContent}>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Status:</span>
              <span className={`${styles.resultValue} ${styles.textGreen}`}>
                ✓ No known threats
              </span>
            </div>
            <div className={styles.scoreBar}>
              <div className={styles.scoreBarFill} style={{ width: '12%' }}></div>
            </div>
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Risk Score:</span>
              <span className={styles.resultValue}>12/100 (Low Risk)</span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>ASN Full Details</h3>
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
            <div className={styles.resultRow}>
              <span className={styles.resultLabel}>Country:</span>
              <span className={styles.resultValue}>United States</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
