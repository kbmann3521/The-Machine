import React, { useState } from 'react'
import styles from '../styles/tool-output.module.css'

export default function ToolOutputPanel({ result, outputType, loading, error, toolId }) {
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
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

  const handleCopy = async () => {
    let textToCopy = ''
    if (typeof displayResult === 'string') {
      textToCopy = displayResult
    } else {
      textToCopy = JSON.stringify(displayResult, null, 2)
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

  const handleCopyField = async (value, fieldName) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      fallbackCopy(String(value))
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  const renderStructuredOutput = () => {
    const fieldsToShow = getDisplayFields(toolId, displayResult)
    if (!fieldsToShow || fieldsToShow.length === 0) return null

    return (
      <div className={styles.structuredOutput}>
        {fieldsToShow.map((field, idx) => {
          const displayValue = typeof field.value === 'string' || typeof field.value === 'number'
            ? field.value
            : JSON.stringify(field.value)
          return (
            <div key={idx} className={styles.outputField}>
              <div className={styles.fieldHeader}>
                <span className={styles.fieldLabel}>{field.label}:</span>
                <button
                  className={styles.fieldCopyButton}
                  onClick={() => handleCopyField(displayValue, field.label)}
                  title={`Copy ${field.label}`}
                >
                  {copiedField === field.label ? '✓' : '📋'}
                </button>
              </div>
              <div className={styles.fieldValue}>{displayValue}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const getDisplayFields = (toolId, result) => {
    if (!result || typeof result !== 'object') return null

    switch (toolId) {
      case 'color-converter':
        return [
          { label: 'HEX', value: result.hex },
          { label: 'RGB', value: result.rgb },
          { label: 'HSL', value: result.hsl },
          { label: 'Detected Format', value: result.detectedFormat },
        ].filter(f => f.value)

      case 'mime-type-lookup':
        if (result.found === false) return null
        return [
          { label: 'Extension', value: result.extension || (Array.isArray(result.extensions) ? result.extensions.join(', ') : result.extensions) },
          { label: 'MIME Type', value: result.mimeType || result.extension },
        ].filter(f => f.value)

      case 'url-parser':
        return [
          { label: 'Protocol', value: result.protocol },
          { label: 'Host', value: result.host },
          { label: 'Port', value: result.port },
          { label: 'Path', value: result.path },
          { label: 'Query', value: result.query },
          { label: 'Fragment', value: result.fragment },
        ].filter(f => f.value)

      case 'base64-converter':
        return [
          { label: 'Result', value: result },
        ]

      case 'uuid-validator':
        return [
          { label: 'UUID', value: result.uuid },
          { label: 'Valid', value: result.isValid ? 'Yes' : 'No' },
        ].filter(f => f.value)

      case 'regex-tester':
        return [
          { label: 'Pattern', value: result.pattern },
          { label: 'Matches Found', value: result.matchCount },
          result.result ? { label: 'Replacement Result', value: result.result } : null,
        ].filter(f => f)

      case 'timestamp-converter':
        if (result.error) return null
        const fields = []
        if (result.readable) fields.push({ label: 'ISO 8601', value: result.readable })
        if (result.local) fields.push({ label: 'Local Date', value: result.local })
        if (result.timestamp !== undefined) fields.push({ label: 'Unix Timestamp', value: result.timestamp })
        if (result.iso) fields.push({ label: 'ISO 8601', value: result.iso })
        if (result.date) fields.push({ label: 'Input Date', value: result.date })
        return fields.length > 0 ? fields : null

      case 'text-analyzer':
        const analyzerFields = []
        if (result.readability) {
          analyzerFields.push({ label: 'Readability Level', value: result.readability.readabilityLevel })
          analyzerFields.push({ label: 'Flesch Reading Ease', value: result.readability.fleschReadingEase })
          analyzerFields.push({ label: 'Flesch-Kincaid Grade', value: result.readability.fleschKincaidGrade })
        }
        if (result.statistics) {
          analyzerFields.push({ label: 'Words', value: result.statistics.words })
          analyzerFields.push({ label: 'Characters', value: result.statistics.characters })
          analyzerFields.push({ label: 'Sentences', value: result.statistics.sentences })
          analyzerFields.push({ label: 'Lines', value: result.statistics.lines })
          analyzerFields.push({ label: 'Avg Word Length', value: result.statistics.averageWordLength?.toFixed(2) })
          analyzerFields.push({ label: 'Avg Words per Sentence', value: result.statistics.averageWordsPerSentence?.toFixed(2) })
        }
        return analyzerFields.filter(f => f.value !== undefined && f.value !== null)

      case 'word-counter':
        return [
          { label: 'Word Count', value: String(result.wordCount || 0) },
          { label: 'Character Count', value: String(result.characterCount || 0) },
          { label: 'Character Count (no spaces)', value: String(result.characterCountNoSpaces || 0) },
          { label: 'Sentence Count', value: String(result.sentenceCount || 0) },
          { label: 'Line Count', value: String(result.lineCount || 0) },
          { label: 'Paragraph Count', value: String(result.paragraphCount || 0) },
        ].filter(f => f.value !== undefined && f.value !== null)

      default:
        return null
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

    if (displayResult?.error) {
      return (
        <div className={`${styles.error} ${styles.fadeIn}`}>
          <strong>Error:</strong> {displayResult.error}
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
      const structuredView = renderStructuredOutput()
      if (structuredView) {
        return (
          <div className={contentClass}>
            {structuredView}
            <div className={styles.jsonFallback}>
              <details>
                <summary>View full JSON</summary>
                <pre className={styles.jsonOutput}>
                  <code>{JSON.stringify(displayResult, null, 2)}</code>
                </pre>
              </details>
            </div>
          </div>
        )
      }

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
