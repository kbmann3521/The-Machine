import React, { useState } from 'react'
import styles from '../styles/tool-output.module.css'

export default function ToolOutputPanel({ result, outputType, loading, error }) {
  const [copied, setCopied] = useState(false)

  if (!result && !loading && !error) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Results will appear here after running a tool</p>
        </div>
      </div>
    )
  }

  const handleCopy = () => {
    let textToCopy = ''
    if (typeof result === 'string') {
      textToCopy = result
    } else {
      textToCopy = JSON.stringify(result, null, 2)
    }
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderOutput = () => {
    if (loading) {
      return <div className={styles.spinner}></div>
    }

    if (error) {
      return (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )
    }

    if (!result) return null

    if (typeof result === 'string') {
      return (
        <pre className={styles.textOutput}>
          <code>{result}</code>
        </pre>
      )
    }

    if (typeof result === 'object') {
      if (outputType === 'json' || typeof result === 'object') {
        return (
          <pre className={styles.jsonOutput}>
            <code>{JSON.stringify(result, null, 2)}</code>
          </pre>
        )
      }

      if (result.type === 'table' && Array.isArray(result.data)) {
        return (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {Object.keys(result.data[0] || {}).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.data.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      return (
        <pre className={styles.jsonOutput}>
          <code>{JSON.stringify(result, null, 2)}</code>
        </pre>
      )
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Output</h3>
        {result && !loading && !error && (
          <button
            className={styles.copyButton}
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        )}
      </div>

      <div className={styles.content}>
        {renderOutput()}
      </div>
    </div>
  )
}
