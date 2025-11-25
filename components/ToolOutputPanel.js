import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/tool-output.module.css'
import sqlStyles from '../styles/sql-formatter.module.css'
import jsStyles from '../styles/js-formatter.module.css'
import OutputTabs from './OutputTabs'

export default function ToolOutputPanel({ result, outputType, loading, error, toolId, activeToolkitSection }) {
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [expandedSection, setExpandedSection] = useState('formatted')
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

  const renderJsFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null

    return (
      <div className={jsStyles.jsFormatterContainer}>
        {/* Formatted JavaScript Section */}
        {displayResult.formatted && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'formatted' ? null : 'formatted')}>
              <span className={jsStyles.sectionTitle}>Formatted Code</span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'formatted' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'formatted' && (
              <div className={jsStyles.sectionContent}>
                <pre className={jsStyles.jsCode}>
                  <code>{displayResult.formatted}</code>
                </pre>
                <button
                  className={jsStyles.copyButton}
                  onClick={() => handleCopyField(displayResult.formatted, 'formatted-js')}
                  title="Copy formatted code"
                >
                  {copiedField === 'formatted-js' ? '✓ Copied' : <><FaCopy /> Copy</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Minified JavaScript Section */}
        {displayResult.minified && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'minified' ? null : 'minified')}>
              <span className={jsStyles.sectionTitle}>Minified Code</span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'minified' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'minified' && (
              <div className={jsStyles.sectionContent}>
                <pre className={jsStyles.jsCode}>
                  <code>{displayResult.minified}</code>
                </pre>
                <button
                  className={jsStyles.copyButton}
                  onClick={() => handleCopyField(displayResult.minified, 'minified-js')}
                  title="Copy minified code"
                >
                  {copiedField === 'minified-js' ? '✓ Copied' : <><FaCopy /> Copy</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Obfuscated JavaScript Section */}
        {displayResult.obfuscated && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'obfuscated' ? null : 'obfuscated')}>
              <span className={jsStyles.sectionTitle}>Obfuscated Code</span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'obfuscated' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'obfuscated' && (
              <div className={jsStyles.sectionContent}>
                <pre className={jsStyles.jsCode}>
                  <code>{displayResult.obfuscated}</code>
                </pre>
                <button
                  className={jsStyles.copyButton}
                  onClick={() => handleCopyField(displayResult.obfuscated, 'obfuscated-js')}
                  title="Copy obfuscated code"
                >
                  {copiedField === 'obfuscated-js' ? '✓ Copied' : <><FaCopy /> Copy</>}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Syntax Errors Section */}
        {displayResult.errors && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'errors' ? null : 'errors')}>
              <span className={jsStyles.sectionTitle}>
                Syntax Check ({displayResult.errors.status})
              </span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'errors' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'errors' && (
              <div className={jsStyles.sectionContent}>
                {displayResult.errors.status === 'valid' ? (
                  <div className={jsStyles.success}>✓ No syntax errors found!</div>
                ) : (
                  <div className={jsStyles.errorsList}>
                    {displayResult.errors.errors && displayResult.errors.errors.map((error, idx) => (
                      <div key={idx} className={jsStyles.error}>
                        <div className={jsStyles.errorMessage}>
                          <strong>Line {error.line}, Column {error.column}</strong>: {error.message}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Linting Section */}
        {displayResult.linting && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'linting' ? null : 'linting')}>
              <span className={jsStyles.sectionTitle}>
                Linting Warnings ({displayResult.linting.total})
              </span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'linting' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'linting' && (
              <div className={jsStyles.sectionContent}>
                {displayResult.linting.warnings && displayResult.linting.warnings.length > 0 ? (
                  <div className={jsStyles.warningsList}>
                    {displayResult.linting.warnings.map((warning, idx) => (
                      <div key={idx} className={`${jsStyles.warning} ${jsStyles[warning.level || 'info']}`}>
                        <div className={jsStyles.warningLevel}>{(warning.level || 'info').toUpperCase()}</div>
                        <div className={jsStyles.warningMessage}>{warning.message}</div>
                        {warning.suggestion && (
                          <div className={jsStyles.warningSuggestion}>💡 {warning.suggestion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={jsStyles.success}>✓ No linting warnings found!</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Code Analysis Section */}
        {displayResult.analysis && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}>
              <span className={jsStyles.sectionTitle}>Code Analysis</span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'analysis' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'analysis' && (
              <div className={jsStyles.sectionContent}>
                <div className={jsStyles.analysisGrid}>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Lines</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.lineCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Characters</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.characterCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Functions</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.functionCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Arrow Functions</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.arrowFunctionCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Variables</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.variableCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Imports</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.importCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Exports</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.exportCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Complexity</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.cyclomaticComplexity || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Classes</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.classCount || 0}</span>
                  </div>
                  <div className={jsStyles.analysisItem}>
                    <span className={jsStyles.analysisLabel}>Longest Line</span>
                    <span className={jsStyles.analysisValue}>{displayResult.analysis.longestLine || 0}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security Scan Section */}
        {displayResult.security && (
          <div className={jsStyles.jsSection}>
            <div className={jsStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'security' ? null : 'security')}>
              <span className={jsStyles.sectionTitle}>Security Scan</span>
              <span className={jsStyles.sectionToggle}>{expandedSection === 'security' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'security' && (
              <div className={jsStyles.sectionContent}>
                <div style={{ marginBottom: '10px' }}>
                  <span className={`${jsStyles.securityBadge} ${jsStyles[displayResult.security.riskLevel || 'safe']}`}>
                    Risk Level: {displayResult.security.riskLevel?.toUpperCase() || 'SAFE'}
                  </span>
                </div>
                {displayResult.security.issues && displayResult.security.issues.length > 0 ? (
                  <div className={jsStyles.issuesList}>
                    {displayResult.security.issues.map((issue, idx) => (
                      <div key={idx} className={jsStyles.issueItem}>
                        <strong>{issue.pattern}</strong> - Severity: {issue.severity}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={jsStyles.success}>✓ No security issues detected!</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderSqlFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null

    return (
      <div className={sqlStyles.sqlFormatterContainer}>
        {/* Formatted SQL Section */}
        <div className={sqlStyles.sqlSection}>
          <div className={sqlStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'formatted' ? null : 'formatted')}>
            <span className={sqlStyles.sectionTitle}>Formatted SQL</span>
            <span className={sqlStyles.sectionToggle}>{expandedSection === 'formatted' ? '▼' : '▶'}</span>
          </div>
          {expandedSection === 'formatted' && (
            <div className={sqlStyles.sectionContent}>
              <pre className={sqlStyles.sqlCode}>
                <code>{displayResult.formatted || ''}</code>
              </pre>
              <button
                className={sqlStyles.copyButton}
                onClick={() => handleCopyField(displayResult.formatted, 'formatted-sql')}
                title="Copy formatted SQL"
              >
                {copiedField === 'formatted-sql' ? '✓ Copied' : <><FaCopy /> Copy</>}
              </button>
            </div>
          )}
        </div>

        {/* Lint Warnings Section */}
        {displayResult.lint && (
          <div className={sqlStyles.sqlSection}>
            <div className={sqlStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'lint' ? null : 'lint')}>
              <span className={sqlStyles.sectionTitle}>
                Lint Warnings ({displayResult.lint.total})
              </span>
              <span className={sqlStyles.sectionToggle}>{expandedSection === 'lint' ? '▼' : '��'}</span>
            </div>
            {expandedSection === 'lint' && (
              <div className={sqlStyles.sectionContent}>
                {displayResult.lint.warnings && displayResult.lint.warnings.length > 0 ? (
                  <div className={sqlStyles.warningsList}>
                    {displayResult.lint.warnings.map((warning, idx) => (
                      <div key={idx} className={`${sqlStyles.warning} ${sqlStyles[warning.level || 'info']}`}>
                        <div className={sqlStyles.warningLevel}>{(warning.level || 'info').toUpperCase()}</div>
                        <div className={sqlStyles.warningMessage}>{warning.message}</div>
                        {warning.suggestion && (
                          <div className={sqlStyles.warningSuggestion}>💡 {warning.suggestion}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={sqlStyles.success}>✓ No lint warnings found!</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Query Analysis Section */}
        {displayResult.analysis && (
          <div className={sqlStyles.sqlSection}>
            <div className={sqlStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'analysis' ? null : 'analysis')}>
              <span className={sqlStyles.sectionTitle}>Query Analysis</span>
              <span className={sqlStyles.sectionToggle}>{expandedSection === 'analysis' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'analysis' && (
              <div className={sqlStyles.sectionContent}>
                <div className={sqlStyles.analysisGrid}>
                  <div className={sqlStyles.analysisItem}>
                    <span className={sqlStyles.analysisLabel}>Query Type:</span>
                    <span className={sqlStyles.analysisValue}>{displayResult.analysis.queryType || 'UNKNOWN'}</span>
                  </div>
                  <div className={sqlStyles.analysisItem}>
                    <span className={sqlStyles.analysisLabel}>Has Joins:</span>
                    <span className={sqlStyles.analysisValue}>{displayResult.analysis.hasJoin ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={sqlStyles.analysisItem}>
                    <span className={sqlStyles.analysisLabel}>Has Subqueries:</span>
                    <span className={sqlStyles.analysisValue}>{displayResult.analysis.hasSubquery ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={sqlStyles.analysisItem}>
                    <span className={sqlStyles.analysisLabel}>Has Aggregation:</span>
                    <span className={sqlStyles.analysisValue}>{displayResult.analysis.hasAggregation ? 'Yes' : 'No'}</span>
                  </div>
                </div>

                {displayResult.analysis.tables && displayResult.analysis.tables.length > 0 && (
                  <div className={sqlStyles.analysisSubsection}>
                    <h4>Tables Used:</h4>
                    <div className={sqlStyles.tagList}>
                      {displayResult.analysis.tables.map((table, idx) => (
                        <span key={idx} className={sqlStyles.tag}>{table}</span>
                      ))}
                    </div>
                  </div>
                )}

                {displayResult.analysis.columns && displayResult.analysis.columns.length > 0 && (
                  <div className={sqlStyles.analysisSubsection}>
                    <h4>Columns Used:</h4>
                    <div className={sqlStyles.tagList}>
                      {displayResult.analysis.columns.map((column, idx) => (
                        <span key={idx} className={sqlStyles.tag}>{column}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Parse Tree Section */}
        {displayResult.parseTree && (
          <div className={sqlStyles.sqlSection}>
            <div className={sqlStyles.sectionHeader} onClick={() => setExpandedSection(expandedSection === 'parseTree' ? null : 'parseTree')}>
              <span className={sqlStyles.sectionTitle}>Parse Tree</span>
              <span className={sqlStyles.sectionToggle}>{expandedSection === 'parseTree' ? '▼' : '▶'}</span>
            </div>
            {expandedSection === 'parseTree' && (
              <div className={sqlStyles.sectionContent}>
                {displayResult.parseTree.error ? (
                  <div className={styles.error}>{displayResult.parseTree.error}</div>
                ) : (
                  <pre className={sqlStyles.jsonCode}>
                    <code>{displayResult.parseTree.structure || JSON.stringify(displayResult.parseTree, null, 2)}</code>
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
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
    // Handle new format from unitConverterTool
    if (displayResult?.status === 'ok' && displayResult?.conversions && displayResult?.normalizedInput) {
      const { normalizedInput, conversions } = displayResult

      return (
        <div className={styles.unitConverterSection}>
          <div className={styles.unitConverterHeader}>
            <h4>{normalizedInput.human} equals:</h4>
          </div>
          <div className={styles.structuredOutput}>
            {conversions.map((conversion, idx) => (
              <div key={idx} className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>{conversion.unit}</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(
                      conversion.human,
                      `conversion-${idx}`
                    )}
                    title={`Copy ${conversion.human}`}
                  >
                    {copiedField === `conversion-${idx}` ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{conversion.value}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    // Handle old format for backward compatibility
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
            <div key={idx} className={styles.copyCard}>
              <div className={styles.copyCardHeader}>
                <span className={styles.copyCardLabel}>{conversion.toUnit}</span>
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
              <div className={styles.copyCardValue}>{conversion.value}</div>
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
            <div key={idx} className={styles.copyCard}>
              <div className={styles.copyCardHeader}>
                <span className={styles.copyCardLabel}>{field.label}</span>
                <button
                  className="copy-action"
                  onClick={() => handleCopyField(displayValue, field.label)}
                  title={`Copy ${field.label}`}
                >
                  {copiedField === field.label ? '✓' : <FaCopy />}
                </button>
              </div>
              <div className={styles.copyCardValue}>{displayValue}</div>
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

    // Special handling for SQL Formatter
    if (toolId === 'sql-formatter' && displayResult.formatted) {
      return renderSqlFormatterOutput()
    }

    // Special handling for JavaScript Formatter
    if (toolId === 'js-formatter' && (displayResult.formatted || displayResult.minified || displayResult.obfuscated || displayResult.errors || displayResult.linting || displayResult.analysis || displayResult.security)) {
      return renderJsFormatterOutput()
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

    // String Reverse - show friendly + JSON tabs
    if (toolId === 'string-reverse' && displayResult.reversed !== undefined) {
      const friendlyView = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px', border: '1px solid var(--color-border, #ddd)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary, #666)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original</p>
            <code style={{ display: 'block', padding: '8px', fontFamily: 'Courier New, monospace', fontSize: '13px', wordBreak: 'break-all' }}>{displayResult.original}</code>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px', border: '1px solid var(--color-border, #ddd)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary, #666)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reversed</p>
            <code style={{ display: 'block', padding: '8px', fontFamily: 'Courier New, monospace', fontSize: '13px', wordBreak: 'break-all' }}>{displayResult.reversed}</code>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px', border: '1px solid var(--color-border, #ddd)' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary, #666)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Length</p>
            <p style={{ margin: '0', padding: '8px', fontFamily: 'Courier New, monospace', fontSize: '13px' }}>{displayResult.length} characters</p>
          </div>
        </div>
      )
      return <OutputTabs friendlyView={friendlyView} jsonData={displayResult} showCopyButton={true} />
    }

    // Text Stats - show friendly + JSON tabs
    if (toolId === 'text-stats' && displayResult.characters !== undefined) {
      const stats = [
        { id: 'characters', label: 'Characters', value: displayResult.characters },
        { id: 'without-spaces', label: 'Without Spaces', value: displayResult.charactersWithoutSpaces },
        { id: 'words', label: 'Words', value: displayResult.words },
        { id: 'lines', label: 'Lines', value: displayResult.lines },
        { id: 'paragraphs', label: 'Paragraphs', value: displayResult.paragraphs },
        { id: 'sentences', label: 'Sentences', value: displayResult.sentences },
        { id: 'avg-word-length', label: 'Avg Word Length', value: displayResult.averageWordLength },
        { id: 'avg-words-per-line', label: 'Avg Words/Line', value: displayResult.averageWordsPerLine },
      ]

      const friendlyView = ({ onCopyCard, copiedCardId }) => (
        <div className={styles.structuredOutput}>
          {stats.map((stat) => (
            <div key={stat.id} className={styles.copyCard}>
              <div className={styles.copyCardHeader}>
                <span className={styles.copyCardLabel}>{stat.label}</span>
                <button
                  className="copy-action"
                  onClick={() => onCopyCard(stat.value, stat.id)}
                  title={`Copy ${stat.label}`}
                >
                  {copiedCardId === stat.id ? '✓' : <FaCopy />}
                </button>
              </div>
              <div className={styles.copyCardValue}>{stat.value}</div>
            </div>
          ))}
        </div>
      )
      return <OutputTabs friendlyView={friendlyView} jsonData={displayResult} showCopyButton={true} />
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
        // Show hint for incomplete input states
        if (displayResult?.status && displayResult.status !== 'ok') {
          const hints = {
            'empty': 'Enter a value with a unit, like "100 pounds" or "250 cm"',
            'incomplete-number-or-unit': 'Keep typing... enter something like "100 pounds"',
            'unknown-unit': 'Unit not recognized. Try "100 pounds", "250 cm", "5 ft", or "72 F"',
            'parse-failed': 'Could not parse the input. Try "100 pounds" or "250 cm"'
          }
          return (
            <div className={styles.hint}>
              {hints[displayResult.status] || 'Keep typing...'}
            </div>
          )
        }

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
