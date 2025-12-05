import React, { useState } from 'react'
import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../../../styles/ip-toolkit.module.css'

export default function BulkOutput({ result }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    let textToCopy = ''

    if (typeof result === 'string') {
      textToCopy = result
    } else {
      textToCopy = JSON.stringify(result, null, 2)
    }

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      fallbackCopy(textToCopy)
    }
  }

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
    document.body.removeChild(textarea)
  }

  return (
    <div className={styles.outputSection}>
      <div className={styles.outputHeader}>
        <h3 className={styles.outputTitle}>Output</h3>
        {result && <button className="copy-action" onClick={handleCopy} title="Copy output">
          {copied ? '✓ Copied' : <><FaCopy /> Copy</>}
        </button>}
      </div>

      {/* Placeholder Content */}
      <div className={styles.emptyOutput}>
        <p className={styles.emptyOutputText}>
          No results yet
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
