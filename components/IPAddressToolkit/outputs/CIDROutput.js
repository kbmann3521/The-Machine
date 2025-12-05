import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../../../styles/ip-toolkit.module.css'

export default function CIDROutput({ result }) {
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
