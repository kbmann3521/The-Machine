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

  // Special handling for image-toolkit - show OutputTabs even when empty
  if (toolId === 'image-toolkit') {
    if (displayResult?.mode === 'resize') {
      const ResizeOutput = require('./ImageToolkit/outputs/ResizeOutput').default
      return <ResizeOutput result={displayResult} />
    }

    if (displayResult?.mode === 'base64') {
      const Base64Output = require('./ImageToolkit/outputs/Base64Output').default
      return <Base64Output result={displayResult} />
    }

    // Default placeholder with OutputTabs design
    const defaultTabs = [
      {
        id: 'default',
        label: 'Output',
        content: 'Upload an image to see results',
        contentType: 'text',
      },
    ]
    const OutputTabs = require('./OutputTabs').default
    return <OutputTabs tabs={defaultTabs} />
  }

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
        <div className={styles.content}>
          <div className={styles.placeholder}>
            <p>Run the tool to see output here</p>
          </div>
        </div>
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

    const tabs = []

    // Determine the primary output type based on which field exists
    let primaryTabId = null
    let primaryTabLabel = null
    let primaryTabContent = null

    if (displayResult.formatted !== undefined) {
      primaryTabId = 'formatted'
      primaryTabLabel = 'Formatted'
      primaryTabContent = displayResult.formatted
    } else if (displayResult.minified !== undefined) {
      primaryTabId = 'minified'
      primaryTabLabel = 'Minified'
      primaryTabContent = displayResult.minified
    } else if (displayResult.obfuscated !== undefined) {
      primaryTabId = 'obfuscated'
      primaryTabLabel = 'Obfuscated'
      primaryTabContent = displayResult.obfuscated
    }

    // Add primary tab
    if (primaryTabId && primaryTabContent) {
      if (typeof primaryTabContent === 'string' && primaryTabContent.trim()) {
        tabs.push({
          id: primaryTabId,
          label: primaryTabLabel,
          content: primaryTabContent,
          contentType: 'code',
        })
      } else {
        // Show placeholder when output is unavailable
        const placeholderContent = (
          <div style={{ padding: '16px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
            {primaryTabLabel} output will appear here once you run the formatter on valid code.
          </div>
        )
        tabs.push({
          id: primaryTabId,
          label: primaryTabLabel,
          content: placeholderContent,
          contentType: 'component',
        })
      }
    }

    if (displayResult.linting) {
      const lintContent = (
        <>
          {displayResult.linting.warnings && displayResult.linting.warnings.length > 0 ? (
            <div className={jsStyles.warningsList}>
              {displayResult.linting.warnings.map((warning, idx) => (
                <div key={idx} className={`${jsStyles.warning} ${jsStyles[warning.level || 'info']}`}>
                  <div className={jsStyles.warningLevel}>{(warning.level || 'info').toUpperCase()}</div>
                  <div className={jsStyles.warningMessage}>
                    {warning.line !== undefined && warning.column !== undefined && (
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginRight: '8px' }}>
                        Line {warning.line}, Column {warning.column}
                      </span>
                    )}
                    {warning.message}
                    {warning.ruleId && (
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginLeft: '8px' }}>
                        ({warning.ruleId})
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={jsStyles.success}>✓ No linting warnings found!</div>
          )}
        </>
      )
      tabs.push({
        id: 'linting',
        label: `Linting (${displayResult.linting.total})`,
        content: lintContent,
        contentType: 'component',
      })
    }

    if (displayResult.errors) {
      const syntaxContent = (
        <>
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
        </>
      )
      tabs.push({
        id: 'syntax',
        label: `Syntax (${displayResult.errors.status === 'valid' ? '✓' : '✗'})`,
        content: syntaxContent,
        contentType: 'component',
      })
    }

    if (displayResult.analysis) {
      const analysisContent = (
        <>
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
        </>
      )
      tabs.push({
        id: 'analysis',
        label: 'Analysis',
        content: analysisContent,
        contentType: 'component',
      })
    }

    if (displayResult.security) {
      const securityContent = (
        <>
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
        </>
      )
      tabs.push({
        id: 'security',
        label: 'Security',
        content: securityContent,
        contentType: 'component',
      })
    }

    if (tabs.length === 0) return null

    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  const renderSqlFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null

    const tabs = []

    if (displayResult.formatted) {
      tabs.push({
        id: 'formatted',
        label: 'Formatted',
        content: displayResult.formatted,
        contentType: 'code',
      })
    }

    if (displayResult.lint) {
      const lintContent = (
        <>
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
        </>
      )
      tabs.push({
        id: 'lint',
        label: `Lint (${displayResult.lint.total})`,
        content: lintContent,
        contentType: 'component',
      })
    }

    if (displayResult.analysis) {
      const analysisContent = (
        <>
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
        </>
      )
      tabs.push({
        id: 'analysis',
        label: 'Analysis',
        content: analysisContent,
        contentType: 'component',
      })
    }

    if (displayResult.parseTree) {
      const parseTreeContent = displayResult.parseTree.error
        ? `Error: ${displayResult.parseTree.error}`
        : displayResult.parseTree.structure || JSON.stringify(displayResult.parseTree, null, 2)
      tabs.push({
        id: 'parseTree',
        label: 'Parse Tree',
        content: parseTreeContent,
        contentType: 'code',
      })
    }

    if (tabs.length === 0) return null

    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  const renderColorConverterOutput = () => {
    if (!displayResult) return null

    const colorFormats = [
      { label: 'HEX', value: displayResult.hex },
      { label: 'RGB', value: displayResult.rgb },
      { label: 'HSL', value: displayResult.hsl },
      { label: 'CMYK', value: displayResult.cmyk },
      { label: 'HSV', value: displayResult.hsv },
      { label: 'Detected Format', value: displayResult.detectedFormat },
    ].filter(f => f.value)

    if (colorFormats.length === 0) return null

    const friendlyView = ({ onCopyCard, copiedCardId }) => (
      <div className={styles.structuredOutput}>
        {colorFormats.map((format, idx) => (
          <div key={idx} className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>{format.label}</span>
              <button
                className="copy-action"
                onClick={() => onCopyCard(format.value, format.label)}
                title={`Copy ${format.label}`}
              >
                {copiedCardId === format.label ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue}>{format.value}</div>
          </div>
        ))}
      </div>
    )

    const tabs = [
      {
        id: 'friendly',
        label: 'Formats',
        content: friendlyView,
        contentType: 'component',
      },
      {
        id: 'json',
        label: 'JSON',
        content: displayResult,
        contentType: 'json',
      },
    ]

    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  const renderJwtDecoderOutput = () => {
    if (!displayResult || displayResult.error) return null

    const sections = [
      { label: 'Header', value: displayResult.header },
      { label: 'Payload', value: displayResult.payload },
      { label: 'Signature', value: displayResult.signature },
    ].filter(s => s.value)

    if (sections.length === 0) return null

    const friendlyView = ({ onCopyCard, copiedCardId }) => (
      <div className={styles.structuredOutput}>
        {sections.map((section, idx) => (
          <div key={idx} className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>{section.label}</span>
              <button
                className="copy-action"
                onClick={() => onCopyCard(
                  typeof section.value === 'object' ? JSON.stringify(section.value, null, 2) : section.value,
                  section.label
                )}
                title={`Copy ${section.label}`}
              >
                {copiedCardId === section.label ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue}>
              {typeof section.value === 'object' ? JSON.stringify(section.value, null, 2) : section.value}
            </div>
          </div>
        ))}
      </div>
    )

    const tabs = [
      {
        id: 'decoded',
        label: 'Decoded',
        content: friendlyView,
        contentType: 'component',
      },
      {
        id: 'json',
        label: 'JSON',
        content: displayResult,
        contentType: 'json',
      },
    ]

    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  const renderJsonFormatterOutput = () => {
    // Handle string output (beautified, minified, or error messages)
    if (typeof displayResult === 'string') {
      // Check if it's an error message
      if (displayResult.startsWith('Error:')) {
        const tabs = [
          {
            id: 'error',
            label: 'Error',
            content: displayResult,
            contentType: 'code',
          },
        ]
        return <OutputTabs tabs={tabs} showCopyButton={true} />
      }

      // Regular string output (beautified, minified, sorted, etc.)
      const tabs = [
        {
          id: 'formatted',
          label: 'Formatted',
          content: displayResult,
          contentType: 'code',
        },
      ]
      return <OutputTabs tabs={tabs} showCopyButton={true} />
    }

    // Handle validation results
    if (displayResult.isValid !== undefined) {
      const validationContent = (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              fontSize: '20px',
              fontWeight: '600',
              color: displayResult.isValid ? '#4caf50' : '#f44336'
            }}>
              {displayResult.isValid ? '✓ Valid' : '✗ Invalid'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              {displayResult.message}
            </div>
          </div>
          {displayResult.size !== undefined && (
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>Size:</strong> {displayResult.size} bytes
            </div>
          )}
          {displayResult.lines !== undefined && (
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
              <strong>Lines:</strong> {displayResult.lines}
            </div>
          )}
          {displayResult.error && (
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(244, 67, 54, 0.1)',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              borderRadius: '5px',
              marginTop: '12px',
              color: '#f44336',
              fontSize: '13px'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>Error Details:</div>
              <div>{displayResult.error}</div>
              {displayResult.position && (
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  <strong>Position:</strong> {displayResult.position}
                </div>
              )}
              {displayResult.snippet && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '3px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  overflow: 'auto'
                }}>
                  <strong>Context:</strong> ...{displayResult.snippet}...
                </div>
              )}
            </div>
          )}
        </div>
      )

      const tabs = [
        {
          id: 'validation',
          label: `Validation (${displayResult.isValid ? '✓' : '✗'})`,
          content: validationContent,
          contentType: 'component',
        },
      ]
      return <OutputTabs tabs={tabs} showCopyButton={true} />
    }

    // Handle other object outputs (defaults to JSON tab)
    const tabs = [
      {
        id: 'json',
        label: 'JSON',
        content: displayResult,
        contentType: 'json',
      },
    ]
    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  const renderXmlFormatterOutput = () => {
    // Handle string output (beautified, minified, cleaned XML)
    if (typeof displayResult === 'string') {
      const tabs = [
        {
          id: 'formatted',
          label: 'Formatted',
          content: displayResult,
          contentType: 'code',
        },
      ]
      return <OutputTabs tabs={tabs} showCopyButton={true} />
    }

    // Handle object output from validate, lint, xpath, to-json, to-yaml
    const tabs = []

    if (displayResult.result) {
      tabs.push({
        id: 'result',
        label: 'Result',
        content: displayResult.result,
        contentType: 'code',
      })
    }

    if (displayResult.formatted) {
      tabs.push({
        id: 'formatted',
        label: 'Formatted',
        content: displayResult.formatted,
        contentType: 'code',
      })
    }

    if (displayResult.warnings && displayResult.warnings.length > 0) {
      const warningsContent = (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayResult.warnings.map((warning, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                  borderRadius: '5px',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Warning {idx + 1}
                </div>
                <div style={{ fontSize: '13px' }}>{warning}</div>
              </div>
            ))}
          </div>
        </div>
      )
      tabs.push({
        id: 'warnings',
        label: `Warnings (${displayResult.warnings.length})`,
        content: warningsContent,
        contentType: 'component',
      })
    }

    if (displayResult.errors && displayResult.errors.length > 0) {
      const errorsContent = (
        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayResult.errors.map((error, idx) => (
              <div
                key={idx}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(239, 83, 80, 0.15)',
                  border: '1px solid rgba(239, 83, 80, 0.3)',
                  borderRadius: '5px',
                  color: '#ef5350',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                  Error {idx + 1}
                </div>
                <div style={{ fontSize: '13px' }}>{error}</div>
              </div>
            ))}
          </div>
        </div>
      )
      tabs.push({
        id: 'errors',
        label: `Errors (${displayResult.errors.length})`,
        content: errorsContent,
        contentType: 'component',
      })
    }

    if (displayResult.json) {
      tabs.push({
        id: 'json',
        label: 'JSON',
        content: displayResult.json,
        contentType: 'json',
      })
    }

    if (displayResult.yaml) {
      tabs.push({
        id: 'yaml',
        label: 'YAML',
        content: displayResult.yaml,
        contentType: 'code',
      })
    }

    if (displayResult.xpathResults) {
      const xpathContent = (
        <div style={{ padding: '16px' }}>
          {Array.isArray(displayResult.xpathResults) ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayResult.xpathResults.length > 0 ? (
                displayResult.xpathResults.map((result, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '5px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      wordBreak: 'break-word',
                    }}
                  >
                    {result}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  No results found for the XPath query.
                </div>
              )}
            </div>
          ) : (
            <pre style={{ margin: 0, fontSize: '12px' }}>
              <code>{String(displayResult.xpathResults)}</code>
            </pre>
          )}
        </div>
      )
      tabs.push({
        id: 'xpath',
        label: 'XPath Results',
        content: xpathContent,
        contentType: 'component',
      })
    }

    if (tabs.length === 0) {
      return null
    }

    return <OutputTabs tabs={tabs} showCopyButton={true} />
  }

  const renderSqlFormatterOutputOld = () => {
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

    // Special handling for XML Formatter
    if (toolId === 'xml-formatter' && (typeof displayResult === 'string' || displayResult.result || displayResult.formatted)) {
      return renderXmlFormatterOutput()
    }

    // Special handling for JSON Formatter
    if (toolId === 'json-formatter' && (typeof displayResult === 'string' || displayResult.isValid !== undefined)) {
      return renderJsonFormatterOutput()
    }

    // Special handling for Color Converter
    if (toolId === 'color-converter' && displayResult && (displayResult.hex || displayResult.rgb || displayResult.hsl)) {
      return renderColorConverterOutput()
    }

    // Special handling for JWT Decoder
    if (toolId === 'jwt-decoder' && displayResult && displayResult.decoded) {
      return renderJwtDecoderOutput()
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
      const friendlyView = ({ onCopyCard, copiedCardId }) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px', border: '1px solid var(--color-border, #ddd)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary, #666)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Original</p>
              <button className="copy-action" onClick={() => onCopyCard(displayResult.original, 'original')} title="Copy original">
                {copiedCardId === 'original' ? '✓' : <FaCopy />}
              </button>
            </div>
            <code style={{ display: 'block', padding: '8px', fontFamily: 'Courier New, monospace', fontSize: '13px', wordBreak: 'break-all' }}>{displayResult.original}</code>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px', border: '1px solid var(--color-border, #ddd)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary, #666)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reversed</p>
              <button className="copy-action" onClick={() => onCopyCard(displayResult.reversed, 'reversed')} title="Copy reversed">
                {copiedCardId === 'reversed' ? '✓' : <FaCopy />}
              </button>
            </div>
            <code style={{ display: 'block', padding: '8px', fontFamily: 'Courier New, monospace', fontSize: '13px', wordBreak: 'break-all' }}>{displayResult.reversed}</code>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: '4px', border: '1px solid var(--color-border, #ddd)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <p style={{ margin: '0', fontSize: '12px', fontWeight: '700', color: 'var(--color-text-secondary, #666)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Length</p>
              <button className="copy-action" onClick={() => onCopyCard(displayResult.length, 'length')} title="Copy length">
                {copiedCardId === 'length' ? '✓' : <FaCopy />}
              </button>
            </div>
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
      <div className={`${styles.content} ${loading ? styles.isLoading : ''}`}>
        {renderOutput()}
      </div>
    </div>
  )
}
