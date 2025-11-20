import React, { useState } from 'react'
import styles from '../styles/tool-output.module.css'

export default function ToolOutputPanel({ result, outputType, loading, error }) {
  const [copied, setCopied] = useState(false)
  const [previousResult, setPreviousResult] = useState(null)

  React.useEffect(() => {
    if (result && !loading) {
      setPreviousResult(result)
    }
  }, [result, loading])

  const displayResult = result || previousResult
  const isEmpty = !displayResult && !loading && !error

  if (isEmpty) {
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
    if (typeof displayResult === 'string') {
      textToCopy = displayResult
    } else {
      textToCopy = JSON.stringify(displayResult, null, 2)
    }
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadImage = () => {
    if (displayResult?.resizedImage) {
      const link = document.createElement('a')
      link.href = displayResult.resizedImage
      link.download = `resized-image-${Date.now()}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const renderOutput = () => {
    if (error) {
      return (
        <div className={`${styles.error} ${styles.fadeIn}`}>
          <strong>Error:</strong> {error}
        </div>
      )
    }

    if (!displayResult) {
      if (loading) {
        return (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Processing...</p>
          </div>
        )
      }
      return null
    }

    const contentClass = loading ? styles.fadingOut : styles.fadeIn

    if (displayResult?.resizedImage) {
      return (
        <div className={`${styles.imageOutput} ${contentClass}`}>
          <img src={displayResult.resizedImage} alt="Resized" className={styles.outputImage} />
          <div className={styles.imageInfo}>
            <p>Original: {displayResult.originalDimensions.width} x {displayResult.originalDimensions.height}px</p>
            <p>Resized: {displayResult.newDimensions.width} x {displayResult.newDimensions.height}px</p>
          </div>
        </div>
      )
    }

    if (typeof displayResult === 'string') {
      return (
        <pre className={`${styles.textOutput} ${contentClass}`}>
          <code>{displayResult}</code>
        </pre>
      )
    }

    if (typeof displayResult === 'object') {
      if (outputType === 'json' || typeof displayResult === 'object') {
        return (
          <pre className={`${styles.jsonOutput} ${contentClass}`}>
            <code>{JSON.stringify(displayResult, null, 2)}</code>
          </pre>
        )
      }

      if (displayResult.type === 'table' && Array.isArray(displayResult.data)) {
        return (
          <div className={`${styles.tableContainer} ${contentClass}`}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {Object.keys(displayResult.data[0] || {}).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayResult.data.map((row, idx) => (
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
        <pre className={`${styles.jsonOutput} ${contentClass}`}>
          <code>{JSON.stringify(displayResult, null, 2)}</code>
        </pre>
      )
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Output</h3>
        {displayResult && !loading && !error && (
          <>
            {displayResult?.resizedImage ? (
              <button
                className={styles.copyButton}
                onClick={handleDownloadImage}
                title="Download resized image"
              >
                ⬇ Download
              </button>
            ) : (
              <button
                className={styles.copyButton}
                onClick={handleCopy}
                title="Copy to clipboard"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
          </>
        )}
      </div>

      <div className={`${styles.content} ${loading ? styles.isLoading : ''}`}>
        {renderOutput()}
      </div>
    </div>
  )
}
