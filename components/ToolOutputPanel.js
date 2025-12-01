import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/tool-output.module.css'
import sqlStyles from '../styles/sql-formatter.module.css'
import jsStyles from '../styles/js-formatter.module.css'
import OutputTabs from './OutputTabs'
import CodeMirrorOutput from './CodeMirrorOutput'
import { TOOLS, isScriptingLanguageTool } from '../lib/tools'

export default function ToolOutputPanel({ result, outputType, loading, error, toolId, activeToolkitSection, configOptions, onConfigChange }) {
  const toolCategory = TOOLS[toolId]?.category
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [expandedSection, setExpandedSection] = useState('formatted')
  const [previousResult, setPreviousResult] = useState(null)
  const [previousToolId, setPreviousToolId] = useState(null)
  const [previousToolkitSection, setPreviousToolkitSection] = useState(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const handleDialectChange = (dialect) => {
    if (onConfigChange) {
      onConfigChange({
        ...configOptions,
        language: dialect
      })
    }
  }

  const renderValidationErrorsUnified = (errors, sectionTitle = 'Input Validation Errors (prevents formatting)') => {
    if (!errors || errors.length === 0) return null

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: '#ef5350',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(239, 83, 80, 0.2)',
        }}>
          {sectionTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {errors.map((error, idx) => (
            <div key={idx} style={{
              padding: '12px',
              backgroundColor: 'var(--color-background-tertiary)',
              border: '1px solid rgba(239, 83, 80, 0.2)',
              borderRadius: '4px',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ef5350' }}>
                {error.line !== null && error.column !== null
                  ? `Line ${error.line}, Column ${error.column}`
                  : 'General Error'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                {error.message}
              </div>
              {error.category && (
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                  Category: {error.category}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

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
    return <OutputTabs tabs={defaultTabs} toolCategory={toolCategory} toolId={toolId} />
  }

  // For text-toolkit, check if current section has content
  const isTextToolkitWithoutContent = toolId === 'text-toolkit' && displayResult &&
    ['findReplace', 'slugGenerator', 'reverseText', 'removeExtras', 'whitespaceVisualizer', 'sortLines'].includes(activeToolkitSection) &&
    !displayResult[getToolkitSectionKey(activeToolkitSection)]

  if (isEmpty || isTextToolkitWithoutContent) {
    return (
      <OutputTabs
        toolCategory={toolCategory}
        tabs={[
          {
            id: 'default',
            label: 'Output',
            content: 'Run the tool to see output here',
            contentType: 'text',
          },
        ]}
      />
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
    let primaryTabContent = null

    if (displayResult.formatted !== undefined) {
      primaryTabId = 'formatted'
      primaryTabContent = displayResult.formatted
    } else if (displayResult.minified !== undefined) {
      primaryTabId = 'minified'
      primaryTabContent = displayResult.minified
    } else if (displayResult.obfuscated !== undefined) {
      primaryTabId = 'obfuscated'
      primaryTabContent = displayResult.obfuscated
    }

    // Add primary tab FIRST - only show if isWellFormed is true
    if (primaryTabId && primaryTabContent) {
      if (displayResult.isWellFormed) {
        if (typeof primaryTabContent === 'string' && primaryTabContent.trim()) {
          tabs.push({
            id: primaryTabId,
            label: 'Output',
            content: primaryTabContent,
            contentType: 'codemirror',
          })
        }
      } else {
        // Show error message when code is not well-formed
        const errorContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              marginBottom: '12px',
            }}>
              Cannot format because code contains errors. Showing original code.
            </div>
            <pre style={{
              backgroundColor: 'var(--color-background-tertiary)',
              padding: '12px',
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}>
              <code>{primaryTabContent}</code>
            </pre>
          </div>
        )
        tabs.push({
          id: primaryTabId,
          label: 'Output',
          content: errorContent,
          contentType: 'component',
        })
      }
    }

    // Validation tab - show input and output errors separately
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const inputErrors = displayResult.inputDiagnostics ? displayResult.inputDiagnostics.filter(d => d.type === 'error') : []
      const outputErrors = displayResult.outputDiagnostics ? displayResult.outputDiagnostics.filter(d => d.type === 'error') : []
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error' && d.category !== 'lint')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>

            {renderValidationErrorsUnified(inputErrors, 'Input Validation Errors (prevents formatting)')}

            {outputErrors.length > 0 && (
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ff9800',
                  marginBottom: '8px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid rgba(255, 152, 0, 0.2)',
                }}>
                  Output Validation Errors (introduced by formatter)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {outputErrors.map((error, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      borderRadius: '4px',
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ff9800' }}>
                        {error.line !== null && error.column !== null
                          ? `Line ${error.line}, Column ${error.column}`
                          : 'General Error'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                        {error.message}
                      </div>
                      {error.category && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                          Category: {error.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ No validation errors found
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    // Linting tab - show warnings from diagnostics (if linting is enabled)
    if (displayResult.showLinting && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const lintingWarnings = displayResult.diagnostics.filter(d => d.type === 'warning')
      const isCodeValid = displayResult.isWellFormed !== false

      let lintingLabel = 'Linting'
      let lintingContent = null

      if (!isCodeValid) {
        lintingLabel = 'Linting (⊘)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: '#9e9e9e',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            Linting skipped because code is not valid JavaScript.
          </div>
        )
      } else if (lintingWarnings.length === 0) {
        lintingLabel = 'Linting (✓)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '4px',
            color: '#66bb6a',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ✓ No linting warnings found
          </div>
        )
      } else {
        lintingLabel = `Linting (${lintingWarnings.length})`
        lintingContent = (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintingWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid rgba(255, 167, 38, 0.2)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ffa726',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#ffa726', marginBottom: '4px', fontWeight: '600' }}>
                    ⚠️ Warning {idx + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {warning.message}
                  </div>
                  {warning.line !== null && warning.column !== null && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Line {warning.line}, Column {warning.column}
                    </div>
                  )}
                  {warning.ruleId && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Rule: {warning.ruleId}
                    </div>
                  )}
                  {warning.category && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Category: {warning.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }

      tabs.push({
        id: 'linting',
        label: lintingLabel,
        content: lintingContent,
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

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderYamlFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null
    const tabs = []

    // Determine primary output based on mode
    let primaryTabId = null
    let primaryTabContent = null

    if (displayResult.formatted !== undefined) {
      primaryTabId = 'output'
      primaryTabContent = displayResult.formatted
    }

    // Add primary tab FIRST - only show if hideOutput is false
    if (primaryTabId && primaryTabContent && !displayResult.hideOutput) {
      if (typeof primaryTabContent === 'string' && primaryTabContent.trim()) {
        tabs.push({
          id: primaryTabId,
          label: 'Output',
          content: primaryTabContent,
          contentType: 'codemirror',
        })
      }
    }

    // Validation tab
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'YAML Validation Errors')}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ Valid YAML
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    // Linting tab - show warnings from diagnostics (if linting is enabled)
    if (displayResult.showLinting && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const lintingWarnings = displayResult.diagnostics.filter(d => d.type === 'warning')
      const isYamlValid = displayResult.isWellFormed !== false

      let lintingLabel = 'Linting'
      let lintingContent = null

      if (!isYamlValid) {
        lintingLabel = 'Linting (⊘)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: '#9e9e9e',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            Linting skipped because YAML is not valid.
          </div>
        )
      } else if (lintingWarnings.length === 0) {
        lintingLabel = 'Linting (✓)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '4px',
            color: '#66bb6a',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ✓ No linting warnings found
          </div>
        )
      } else {
        lintingLabel = `Linting (${lintingWarnings.length})`
        lintingContent = (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintingWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid rgba(255, 167, 38, 0.2)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ffa726',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#ffa726', marginBottom: '4px', fontWeight: '600' }}>
                    ⚠️ Warning {idx + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {warning.message}
                  </div>
                  {warning.line !== null && warning.column !== null && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Line {warning.line}, Column {warning.column}
                    </div>
                  )}
                  {warning.category && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Category: {warning.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }

      tabs.push({
        id: 'linting',
        label: lintingLabel,
        content: lintingContent,
        contentType: 'component',
      })
    }

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderMarkdownFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null
    const tabs = []

    // Add primary output tab - always show formatted result unless hideOutput is set
    if (displayResult.formatted !== undefined) {
      tabs.push({
        id: 'formatted',
        label: 'Output',
        content: displayResult.formatted,
        contentType: 'codemirror',
      })
    }

    // Validation tab - show if enabled
    if (displayResult.showValidation !== false) {
      const validationErrors = (displayResult.diagnostics && Array.isArray(displayResult.diagnostics))
        ? displayResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
        : []

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'Markdown/HTML Validation Errors')}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ Valid Content
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    // Linting tab - show if enabled and content is valid
    if (displayResult.showLinting !== false) {
      const lintingWarnings = (displayResult.diagnostics && Array.isArray(displayResult.diagnostics))
        ? displayResult.diagnostics.filter(d => d.category === 'lint')
        : []
      const isValid = displayResult.isWellFormed !== false

      let lintingLabel = 'Linting'
      let lintingContent = null

      if (!isValid) {
        lintingLabel = 'Linting (⊘)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: '#9e9e9e',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            Linting skipped because content is not valid.
          </div>
        )
      } else if (lintingWarnings.length === 0) {
        lintingLabel = 'Linting (✓)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '4px',
            color: '#66bb6a',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ✓ No linting warnings found
          </div>
        )
      } else {
        lintingLabel = `Linting (${lintingWarnings.length})`
        lintingContent = (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintingWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid rgba(255, 167, 38, 0.2)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ffa726',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#ffa726', marginBottom: '4px', fontWeight: '600' }}>
                    ⚠️ Warning {idx + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {warning.message}
                  </div>
                  {warning.line && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Line {warning.line}{warning.column ? `, Column ${warning.column}` : ''}
                    </div>
                  )}
                  {warning.rule && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Rule: <code style={{ fontFamily: 'monospace', fontSize: '9px' }}>{warning.rule}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }

      tabs.push({
        id: 'linting',
        label: lintingLabel,
        content: lintingContent,
        contentType: 'component',
      })
    }

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderCssFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null
    const tabs = []

    // Add primary output tab first - only show if validation passed
    if (displayResult.formatted && !displayResult.hideOutput) {
      tabs.push({
        id: 'formatted',
        label: 'Output',
        content: displayResult.formatted,
        contentType: 'codemirror',
      })
    }

    // Validation tab - show validation errors and status
    if (displayResult.showValidation !== false) {
      const validationErrors = (displayResult.diagnostics && Array.isArray(displayResult.diagnostics))
        ? displayResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
        : []

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'CSS Validation Errors')}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ Valid CSS
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    // Linting tab - show warnings from diagnostics (if linting is enabled)
    if (displayResult.showLinting && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const lintingWarnings = displayResult.diagnostics.filter(d => d.category === 'lint')
      const isCssValid = displayResult.isWellFormed !== false

      let lintingLabel = 'Linting'
      let lintingContent = null

      if (!isCssValid) {
        lintingLabel = 'Linting (⊘)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: '#9e9e9e',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            Linting skipped because CSS is not valid.
          </div>
        )
      } else if (lintingWarnings.length === 0) {
        lintingLabel = 'Linting (✓)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '4px',
            color: '#66bb6a',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ✓ No linting warnings found
          </div>
        )
      } else {
        lintingLabel = `Linting (${lintingWarnings.length})`
        lintingContent = (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintingWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid rgba(255, 167, 38, 0.2)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ffa726',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#ffa726', marginBottom: '4px', fontWeight: '600' }}>
                    ⚠️ Warning {idx + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {warning.message}
                  </div>
                  {warning.line && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Line {warning.line}{warning.column ? `, Column ${warning.column}` : ''}
                    </div>
                  )}
                  {warning.rule && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Rule: <code style={{ fontFamily: 'monospace', fontSize: '9px' }}>{warning.rule}</code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }

      tabs.push({
        id: 'linting',
        label: lintingLabel,
        content: lintingContent,
        contentType: 'component',
      })
    }

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderSqlFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null

    const tabs = []

    // Add primary output tab first - only show if validation passed
    if (displayResult.formatted && !displayResult.hideOutput) {
      tabs.push({
        id: 'formatted',
        label: 'Output',
        content: displayResult.formatted,
        contentType: 'codemirror',
      })
    }

    // Validation tab - show validation errors and status
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'SQL Validation Errors')}

            {displayResult.compatibleDialects && displayResult.compatibleDialects.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ff9800',
                  marginBottom: '12px',
                }}>
                  💡 Valid for these dialects:
                </div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {displayResult.compatibleDialects.map((dialect) => {
                    const dialectLabels = {
                      postgresql: 'PostgreSQL',
                      mysql: 'MySQL',
                      tsql: 'SQL Server',
                      sqlite: 'SQLite',
                      mariadb: 'MariaDB',
                      plsql: 'Oracle',
                      bigquery: 'BigQuery',
                      redshift: 'Redshift'
                    }
                    return (
                      <button
                        key={dialect}
                        onClick={() => handleDialectChange(dialect)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: 'rgba(102, 187, 106, 0.15)',
                          border: '1px solid rgba(102, 187, 106, 0.3)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: '#2e7d32',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = 'rgba(102, 187, 106, 0.25)'
                          e.target.style.borderColor = 'rgba(102, 187, 106, 0.5)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'rgba(102, 187, 106, 0.15)'
                          e.target.style.borderColor = 'rgba(102, 187, 106, 0.3)'
                        }}
                      >
                        {dialectLabels[dialect] || dialect}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ Valid SQL
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    // Linting tab - show warnings from diagnostics (if linting is enabled)
    if (displayResult.showLinting && displayResult.lint) {
      const lintWarnings = displayResult.lint.warnings || []
      const isCodeValid = displayResult.isWellFormed !== false

      let lintingLabel = 'Linting'
      let lintingContent = null

      if (!isCodeValid) {
        lintingLabel = 'Linting (⊘)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: '#9e9e9e',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            Linting skipped because SQL is not valid.
          </div>
        )
      } else if (lintWarnings.length === 0) {
        lintingLabel = 'Linting (✓)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '4px',
            color: '#66bb6a',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ✓ No linting warnings found
          </div>
        )
      } else {
        lintingLabel = `Linting (${lintWarnings.length})`
        lintingContent = (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid rgba(255, 167, 38, 0.2)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ffa726',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#ffa726', marginBottom: '4px', fontWeight: '600' }}>
                    ⚠️ {(warning.level || 'warning').toUpperCase()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {warning.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      }

      tabs.push({
        id: 'linting',
        label: lintingLabel,
        content: lintingContent,
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

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
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

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderJwtDecoderOutput = () => {
    // If there's an error, add an error tab
    if (displayResult?.error) {
      const tabs = [
        {
          id: 'error',
          label: 'Error',
          content: displayResult.error,
          contentType: 'text',
        }
      ]
      return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
    }

    if (!displayResult || !displayResult.decoded) return null

    // Use OutputTabs with JSON-only tab, let it auto-generate the friendly view
    const tabs = [
      {
        id: 'json',
        label: 'JSON',
        content: displayResult,
        contentType: 'json',
      }
    ]

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderJsonFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null

    // Special handling for compress mode
    if (displayResult.formatted && displayResult.formatted._compressMode) {
      const compressData = [
        { label: 'Original Size', value: `${displayResult.formatted.originalSize} bytes`, key: 'originalSize' },
        { label: 'Compressed Size', value: `${displayResult.formatted.compressedSize} bytes`, key: 'compressedSize' },
        { label: 'Compression Ratio', value: `${displayResult.formatted.ratio}%`, key: 'ratio' },
        { label: 'Original (minified)', value: displayResult.formatted.original, key: 'original' },
        { label: 'Compressed (Base64)', value: displayResult.formatted.compressed, key: 'compressed' },
      ]

      const friendlyView = ({ onCopyCard, copiedCardId }) => (
        <div className={styles.structuredOutput}>
          {compressData.map((item, idx) => (
            <div key={idx} className={styles.copyCard}>
              <div className={styles.copyCardHeader}>
                <span className={styles.copyCardLabel}>{item.label}</span>
                <button
                  className="copy-action"
                  onClick={() => onCopyCard(item.value, item.key)}
                  title={`Copy ${item.label}`}
                >
                  {copiedCardId === item.key ? '✓' : <FaCopy />}
                </button>
              </div>
              <div className={styles.copyCardValue} style={{
                wordBreak: ['original', 'compressed'].includes(item.key) ? 'break-all' : 'normal',
                maxHeight: ['original', 'compressed'].includes(item.key) ? '200px' : 'auto',
                overflowY: ['original', 'compressed'].includes(item.key) ? 'auto' : 'visible',
              }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )

      const tabs = [
        {
          id: 'compress',
          label: 'Results',
          content: friendlyView,
          contentType: 'component',
        },
      ]

      return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
    }

    const tabs = []

    // Add primary output tab first - only show if validation passed
    if (displayResult.formatted && !displayResult.hideOutput) {
      tabs.push({
        id: 'formatted',
        label: 'Output',
        content: typeof displayResult.formatted === 'string' ? displayResult.formatted : JSON.stringify(displayResult.formatted, null, 2),
        contentType: 'code',
      })
    }

    // Validation tab - show validation errors and status
    if (displayResult.showValidation && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'JSON Validation Errors')}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ Valid JSON
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderXmlFormatterOutput = () => {
    // Handle string output (beautified, minified, cleaned XML)
    if (typeof displayResult === 'string') {
      const tabs = [
        {
          id: 'formatted',
          label: 'Output',
          content: displayResult,
          contentType: 'code',
        },
      ]
      return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
    }

    // Return null if displayResult is not an object
    if (!displayResult || typeof displayResult !== 'object') return null

    // Handle object output from validate, lint, xpath, to-json, to-yaml
    const tabs = []

    // Primary output: show finalXml only if well-formed
    const primaryXml = displayResult.finalXml || displayResult.cleanedXml || displayResult.formatted || displayResult.result

    // Check if there are validation errors
    const hasValidationErrors = displayResult.diagnostics && Array.isArray(displayResult.diagnostics)
      ? displayResult.diagnostics.filter(d => d.type === 'error').length > 0
      : false

    // Show output if no validation errors and we have content
    if (primaryXml && !hasValidationErrors) {
      tabs.push({
        id: 'output',
        label: 'Output',
        content: primaryXml,
        contentType: 'code',
      })
    }

    if (displayResult.result && displayResult.result !== primaryXml) {
      tabs.push({
        id: 'result',
        label: 'Result',
        content: displayResult.result,
        contentType: 'code',
      })
    }

    if (displayResult.formatted && displayResult.formatted !== primaryXml) {
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
                  backgroundColor: 'rgba(255, 167, 38, 0.1)',
                  border: '1px solid rgba(255, 167, 38, 0.2)',
                  borderRadius: '4px',
                  borderLeft: '3px solid #ffa726',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ffa726' }}>
                  ⚠️ Warning {idx + 1}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{warning}</div>
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
                  backgroundColor: 'var(--color-background-tertiary)',
                  border: '1px solid rgba(239, 83, 80, 0.2)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ef5350' }}>
                  Error {idx + 1}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{error}</div>
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

    if (displayResult.showValidation && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '16px' }}>
            <div style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
              fontWeight: '500',
            }}>
              ✗ {validationErrors.length} XML Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'Input Validation Errors (prevents formatting)')}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${validationErrors.length})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ No validation errors found
              </div>
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    if (displayResult.showLinting && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const lintingWarnings = displayResult.diagnostics.filter(d => d.type === 'warning')
      const isCodeValid = displayResult.isWellFormed !== false

      let lintingLabel = 'Linting'
      let lintingContent = null

      if (!isCodeValid) {
        lintingLabel = 'Linting (⊘)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: '#9e9e9e',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            Linting skipped because code is not valid {toolId === 'js-formatter' ? 'JavaScript' : 'XML'}.
          </div>
        )
      } else if (lintingWarnings.length === 0) {
        lintingLabel = 'Linting (✓)'
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(102, 187, 106, 0.1)',
            border: '1px solid rgba(102, 187, 106, 0.3)',
            borderRadius: '4px',
            color: '#66bb6a',
            fontSize: '13px',
            fontWeight: '500',
            textAlign: 'center',
          }}>
            ✓ No linting warnings found
          </div>
        )
      } else {
        lintingLabel = `Linting (${lintingWarnings.length})`
        lintingContent = (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintingWarnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'rgba(255, 167, 38, 0.1)',
                    border: '1px solid rgba(255, 167, 38, 0.2)',
                    borderRadius: '4px',
                    borderLeft: '3px solid #ffa726',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#ffa726', marginBottom: '4px', fontWeight: '600' }}>
                    ⚠️ Warning {idx + 1}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    {warning.message}
                  </div>
                  {warning.line !== null && warning.column !== null && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Line {warning.line}, Column {warning.column}
                    </div>
                  )}
                  {warning.ruleId && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Rule: {warning.ruleId}
                    </div>
                  )}
                  {warning.category && (
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                      Category: {warning.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      }

      tabs.push({
        id: 'linting',
        label: lintingLabel,
        content: lintingContent,
        contentType: 'component',
      })
    }


    if (tabs.length === 0) {
      return null
    }

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
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
              <span className={sqlStyles.sectionToggle}>{expandedSection === 'lint' ? '▼' : '▶'}</span>
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
              <span className={sqlStyles.sectionToggle}>{expandedSection === 'analysis' ? '��' : '▶'}</span>
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
              <span className={sqlStyles.sectionToggle}>{expandedSection === 'parseTree' ? '▼' : '���'}</span>
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
        return null

      default:
        return null
    }
  }

  // Router for output rendering
  const renderOutput = () => {
    switch (toolId) {
      case 'js-formatter':
        return renderJsFormatterOutput()
      case 'css-formatter':
        return renderCssFormatterOutput()
      case 'markdown-html-formatter':
        return renderMarkdownFormatterOutput()
      case 'sql-formatter':
        return renderSqlFormatterOutput()
      case 'color-converter':
        return renderColorConverterOutput()
      case 'jwt-decoder':
        return renderJwtDecoderOutput()
      case 'json-formatter':
        return renderJsonFormatterOutput()
      case 'xml-formatter':
        return renderXmlFormatterOutput()
      case 'yaml-formatter':
        return renderYamlFormatterOutput()
      default:
        if (typeof displayResult === 'string') {
          return <OutputTabs toolCategory={toolCategory} tabs={[{ id: 'default', label: 'Output', content: displayResult, contentType: 'text' }]} />
        } else {
          return <OutputTabs toolCategory={toolCategory} tabs={[{ id: 'json', label: 'JSON', content: JSON.stringify(displayResult, null, 2), contentType: 'json' }]} />
        }
    }
  }

  return renderOutput()
}
