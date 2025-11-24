import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/tool-output.module.css'

export default function ToolOutputPanel({ result, outputType, loading, error, toolId, activeToolkitSection }) {
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [previousResult, setPreviousResult] = useState(null)
  const [previousToolId, setPreviousToolId] = useState(null)
  const [previousToolkitSection, setPreviousToolkitSection] = useState(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const getToolkitSectionKey = (section) => {
    const keyMap = {
      'findReplace': 'findReplace',
      'slugGenerator': 'slugGenerator',
      'reverseText': 'reverseText',
      'removeExtras': 'removeExtras',
      'whitespaceVisualizer': 'whitespaceVisualizer',
      'sortLines': 'sortLines',
    }
    return keyMap[section]
  }

  React.useEffect(() => {
    if (result && !loading) {
      setPreviousResult(result)
      setIsFirstLoad(false)
    }
  }, [result, loading])

  React.useEffect(() => {
    if (toolId !== previousToolId) {
      setPreviousToolId(toolId)
      setIsFirstLoad(true)
      setPreviousResult(null)
      setPreviousToolkitSection(null)
    }
  }, [toolId, previousToolId])

  React.useEffect(() => {
    if (toolId === 'text-toolkit' && activeToolkitSection !== previousToolkitSection) {
      // Clear previousResult when switching toolkit sections to prevent showing old content
      setPreviousResult(null)
      setPreviousToolkitSection(activeToolkitSection)
    }
  }, [activeToolkitSection, previousToolkitSection, toolId])

  // For text-toolkit, only use previousResult if we haven't switched sections
  const shouldUsePreviousResult = (toolId === previousToolId) &&
    (toolId !== 'text-toolkit' || activeToolkitSection === previousToolkitSection)

  const displayResult = shouldUsePreviousResult ? (result || previousResult) : result
  const isEmpty = !displayResult && !loading && !error

  // For text-toolkit, check if current section has content
  const isTextToolkitWithoutContent = toolId === 'text-toolkit' && displayResult &&
    ['findReplace', 'slugGenerator', 'reverseText', 'removeExtras', 'whitespaceVisualizer', 'sortLines'].includes(activeToolkitSection) &&
    !displayResult[getToolkitSectionKey(activeToolkitSection)]

  if (isEmpty || isTextToolkitWithoutContent) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3>Output</h3>
        </div>
        <div className={styles.content}></div>
      </div>
    )
  }

  const handleCopy = async () => {
    let textToCopy = ''

    // Special handling for text-toolkit sections that render as full-height text
    if (toolId === 'text-toolkit' && displayResult) {
      if (activeToolkitSection === 'findReplace' && displayResult.findReplace) {
        textToCopy = displayResult.findReplace
      } else if (activeToolkitSection === 'slugGenerator' && displayResult.slugGenerator) {
        textToCopy = displayResult.slugGenerator
      } else if (activeToolkitSection === 'reverseText' && displayResult.reverseText) {
        textToCopy = displayResult.reverseText
      } else if (activeToolkitSection === 'removeExtras' && displayResult.removeExtras) {
        textToCopy = displayResult.removeExtras
      } else if (activeToolkitSection === 'whitespaceVisualizer' && displayResult.whitespaceVisualizer) {
        textToCopy = displayResult.whitespaceVisualizer
      } else if (activeToolkitSection === 'sortLines' && displayResult.sortLines) {
        textToCopy = displayResult.sortLines
      }
    }

    if (!textToCopy) {
      if (typeof displayResult === 'string') {
        textToCopy = displayResult
      } else {
        textToCopy = JSON.stringify(displayResult, null, 2)
      }
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

  const pluralizeUnitName = (unitName, value) => {
    const irregularPlurals = {
      'feet': 'feet',
      'metric ton': 'metric tons',
      'stone': 'stones',
      'ounce': 'ounces',
      'fluid ounce': 'fluid ounces',
    }

    if (value === 1 || value === 1.0) {
      return unitName
    }

    if (irregularPlurals[unitName]) {
      return irregularPlurals[unitName]
    }

    if (unitName.endsWith('y')) {
      return unitName.slice(0, -1) + 'ies'
    }

    return unitName + 's'
  }

  const renderUnitConverterCards = () => {
    if (!displayResult || !displayResult.results || !displayResult.inputUnit) return null

    const results = displayResult.results
    const inputUnit = displayResult.inputUnit
    const inputValue = displayResult.input
    const inputUnitFull = displayResult.inputUnitFull
    const inputUnitFullPluralized = displayResult.inputUnitFullPluralized
    const abbrvToFullName = displayResult.abbrvToFullName || {}

    const conversions = []
    for (const [toUnit, value] of Object.entries(results)) {
      const roundedValue = Number.isFinite(value)
        ? value > 0 && value < 0.001 || value > 999999
          ? value.toExponential(6)
          : parseFloat(value.toFixed(6))
        : value
      const fullName = abbrvToFullName[toUnit] || toUnit
      const pluralizedName = pluralizeUnitName(fullName, roundedValue)
      conversions.push({
        toUnit,
        toUnitFull: fullName,
        toUnitFullPluralized: pluralizedName,
        value: roundedValue
      })
    }

    return (
      <div className={styles.unitConverterSection}>
        <div className={styles.unitConverterHeader}>
          <h4>{inputValue} {inputUnitFullPluralized} equals:</h4>
        </div>
        <div className={styles.structuredOutput}>
          {conversions.map((conversion, idx) => (
            <div key={idx} className={styles.outputField}>
              <div className={styles.fieldHeader}>
                <span className={styles.fieldLabel}>{conversion.toUnitFullPluralized}:</span>
                <button
                  className="copy-action"
                  onClick={() => handleCopyField(
                    `${conversion.value} ${conversion.toUnitFullPluralized}`,
                    `${conversion.value} ${conversion.toUnitFullPluralized}`
                  )}
                  title={`Copy ${conversion.value} ${conversion.toUnitFullPluralized}`}
                >
                  {copiedField === `${conversion.value} ${conversion.toUnitFullPluralized}` ? '✓' : <FaCopy />}
                </button>
              </div>
              <div className={styles.fieldValue}>{conversion.value}</div>
            </div>
          ))}
        </div>
      </div>
    )
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
                  className="copy-action"
                  onClick={() => handleCopyField(displayValue, field.label)}
                  title={`Copy ${field.label}`}
                >
                  {copiedField === field.label ? '✓' : <FaCopy />}
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

    if (toolId === 'unit-converter') return null

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

      case 'text-toolkit':
        // Word Counter - show as structured fields
        if (activeToolkitSection === 'wordCounter' && result.wordCounter && typeof result.wordCounter === 'object') {
          return [
            { label: 'Word Count', value: String(result.wordCounter.wordCount || 0) },
            { label: 'Character Count', value: String(result.wordCounter.characterCount || 0) },
            { label: 'Character Count (no spaces)', value: String(result.wordCounter.characterCountNoSpaces || 0) },
            { label: 'Sentence Count', value: String(result.wordCounter.sentenceCount || 0) },
            { label: 'Line Count', value: String(result.wordCounter.lineCount || 0) },
            { label: 'Paragraph Count', value: String(result.wordCounter.paragraphCount || 0) },
          ].filter(f => f.value !== undefined && f.value !== null)
        }

        // Case Converter - show as structured fields
        if (activeToolkitSection === 'caseConverter' && result.caseConverter && typeof result.caseConverter === 'object') {
          const fields = []
          if (result.caseConverter.uppercase) {
            fields.push({ label: 'UPPERCASE', value: result.caseConverter.uppercase })
          }
          if (result.caseConverter.lowercase) {
            fields.push({ label: 'lowercase', value: result.caseConverter.lowercase })
          }
          if (result.caseConverter.titleCase) {
            fields.push({ label: 'Title Case', value: result.caseConverter.titleCase })
          }
          if (result.caseConverter.sentenceCase) {
            fields.push({ label: 'Sentence case', value: result.caseConverter.sentenceCase })
          }
          return fields.filter(f => f.value !== undefined && f.value !== null)
        }


        // Text Analyzer - show as structured fields
        if (activeToolkitSection === 'textAnalyzer' && result.textAnalyzer && typeof result.textAnalyzer === 'object') {
          const fields = []
          if (result.textAnalyzer.readability) {
            if (result.textAnalyzer.readability.readabilityLevel) {
              fields.push({ label: 'Readability Level', value: result.textAnalyzer.readability.readabilityLevel })
            }
            if (result.textAnalyzer.readability.fleschReadingEase !== undefined) {
              fields.push({ label: 'Flesch Reading Ease', value: result.textAnalyzer.readability.fleschReadingEase })
            }
            if (result.textAnalyzer.readability.fleschKincaidGrade !== undefined) {
              fields.push({ label: 'Flesch-Kincaid Grade', value: result.textAnalyzer.readability.fleschKincaidGrade })
            }
          }
          if (result.textAnalyzer.statistics) {
            if (result.textAnalyzer.statistics.words !== undefined) {
              fields.push({ label: 'Words', value: result.textAnalyzer.statistics.words })
            }
            if (result.textAnalyzer.statistics.characters !== undefined) {
              fields.push({ label: 'Characters', value: result.textAnalyzer.statistics.characters })
            }
            if (result.textAnalyzer.statistics.sentences !== undefined) {
              fields.push({ label: 'Sentences', value: result.textAnalyzer.statistics.sentences })
            }
            if (result.textAnalyzer.statistics.lines !== undefined) {
              fields.push({ label: 'Lines', value: result.textAnalyzer.statistics.lines })
            }
            if (result.textAnalyzer.statistics.averageWordLength !== undefined) {
              fields.push({ label: 'Avg Word Length', value: result.textAnalyzer.statistics.averageWordLength?.toFixed(2) })
            }
            if (result.textAnalyzer.statistics.averageWordsPerSentence !== undefined) {
              fields.push({ label: 'Avg Words per Sentence', value: result.textAnalyzer.statistics.averageWordsPerSentence?.toFixed(2) })
            }
          }
          return fields.filter(f => f.value !== undefined && f.value !== null)
        }

        // All other sections render as full-height text, not structured fields
        return null

      default:
        return null
    }
  }

  const renderOutput = () => {
    if (error) {
      return (
        <div className={styles.error}>
          <strong>Error:</strong> {error}
        </div>
      )
    }

    if (displayResult?.error) {
      return (
        <div className={styles.error}>
          <strong>Error:</strong> {displayResult.error}
        </div>
      )
    }

    if (!displayResult) {
      return null
    }

    // Special handling for text-toolkit sections that render as full-height text
    if (toolId === 'text-toolkit' && displayResult) {
      let textContent = null
      let hasContentForCurrentSection = false

      if (activeToolkitSection === 'findReplace') {
        hasContentForCurrentSection = !!displayResult.findReplace
        textContent = displayResult.findReplace
      } else if (activeToolkitSection === 'slugGenerator') {
        hasContentForCurrentSection = !!displayResult.slugGenerator
        textContent = displayResult.slugGenerator
      } else if (activeToolkitSection === 'reverseText') {
        hasContentForCurrentSection = !!displayResult.reverseText
        textContent = displayResult.reverseText
      } else if (activeToolkitSection === 'removeExtras') {
        hasContentForCurrentSection = !!displayResult.removeExtras
        textContent = displayResult.removeExtras
      } else if (activeToolkitSection === 'whitespaceVisualizer') {
        hasContentForCurrentSection = !!displayResult.whitespaceVisualizer
        textContent = displayResult.whitespaceVisualizer
      } else if (activeToolkitSection === 'sortLines') {
        hasContentForCurrentSection = !!displayResult.sortLines
        textContent = displayResult.sortLines
      }

      // Only render text content if we have it for the current section
      if (textContent) {
        return (
          <pre className={styles.textOutput}>
            <code>{textContent}</code>
          </pre>
        )
      }

      // If the current section is a full-height text section but we don't have content for it,
      // don't render the old structured output - wait for the new result
      if (!hasContentForCurrentSection && ['findReplace', 'slugGenerator', 'reverseText', 'removeExtras', 'whitespaceVisualizer', 'sortLines'].includes(activeToolkitSection)) {
        return null
      }

      // Text Diff - show JSON only
      if (activeToolkitSection === 'textDiff' && displayResult.textDiff) {
        return (
          <pre className={styles.jsonOutput}>
            <code>{JSON.stringify(displayResult.textDiff, null, 2)}</code>
          </pre>
        )
      }

      // Word Frequency - show JSON only
      if (activeToolkitSection === 'wordFrequency' && displayResult.wordFrequency) {
        return (
          <pre className={styles.jsonOutput}>
            <code>{JSON.stringify(displayResult.wordFrequency, null, 2)}</code>
          </pre>
        )
      }
    }

    if (displayResult?.resizedImage) {
      return (
        <div className={styles.imageOutput}>
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
        <pre className={styles.textOutput}>
          <code>{displayResult}</code>
        </pre>
      )
    }

    if (typeof displayResult === 'object') {
      // Special handling for unit-converter
      if (toolId === 'unit-converter') {
        const unitCards = renderUnitConverterCards()
        if (unitCards) {
          return unitCards
        }
      }

      // For text-toolkit with full-height text sections, don't show JSON fallback
      const isFullHeightTextSection = toolId === 'text-toolkit' &&
        ['findReplace', 'slugGenerator', 'reverseText', 'removeExtras', 'whitespaceVisualizer', 'sortLines'].includes(activeToolkitSection)

      if (!isFullHeightTextSection) {
        const structuredView = renderStructuredOutput()
        if (structuredView) {
          return (
            <div>
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
      }

      if (outputType === 'json' || (typeof displayResult === 'object' && !isFullHeightTextSection)) {
        return (
          <pre className={styles.jsonOutput}>
            <code>{JSON.stringify(displayResult, null, 2)}</code>
          </pre>
        )
      }

      if (displayResult.type === 'table' && Array.isArray(displayResult.data)) {
        return (
          <div className={styles.tableContainer}>
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
        <pre className={styles.jsonOutput}>
          <code>{JSON.stringify(displayResult, null, 2)}</code>
        </pre>
      )
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Output</h3>
        <div className={`${styles.buttonContainer} ${(displayResult && !loading && !error) ? styles.visible : styles.hidden}`}>
          {displayResult?.resizedImage ? (
            <button
              className="copy-action"
              onClick={handleDownloadImage}
              title="Download resized image"
            >
              ⬇ Download
            </button>
          ) : (
            <button
              className="copy-action"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              {copied ? '✓ Copied' : <><FaCopy /> Copy</>}
            </button>
          )}
        </div>
      </div>

      <div className={`${styles.content} ${loading ? styles.isLoading : ''}`}>
        {renderOutput()}
      </div>
    </div>
  )
}
