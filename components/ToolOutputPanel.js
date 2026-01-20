import React, { useState, useRef, useEffect } from 'react'
import { FaCopy, FaCheck } from 'react-icons/fa6'
import dynamic from 'next/dynamic'
import styles from '../styles/tool-output.module.css'
import sqlStyles from '../styles/sql-formatter.module.css'
import jsStyles from '../styles/js-formatter.module.css'
import OutputTabs from './OutputTabs'
import CSVWarningsPanel from './CSVWarningsPanel'
import MarkdownRenderer from './MarkdownRenderer'
import HTMLRenderer from './HTMLRenderer'
import { TOOLS, isScriptingLanguageTool } from '../lib/tools'
import { colorConverter } from '../lib/tools/colorConverter'
import { scanSelectorsFromHTML, extractSelectorsFromCSS } from '../lib/tools/selectorScanner'
import { scopeCss } from '../lib/tools/cssScoper'
import { extractCssFromHtml } from '../lib/tools/cssExtractor'
import { extractAndParseCssFromHtml, parseCssToRulesTree } from '../lib/tools/cssParser'
import { cssFormatter } from '../lib/tools/cssFormatter'
import { marked } from 'marked'
import UUIDValidatorOutput, { UUIDValidatorGeneratedOutput, UUIDValidatorBulkOutput } from './UUIDValidatorOutput'
import URLToolkitOutput from '../lib/tools/URLToolkitOutput'

// Lazy-load RegexTesterOutput - only needed when displaying regex results
const RegexTesterOutput = dynamic(() => import('./RegexTesterOutput'), { ssr: false })
import HTTPStatusLookupOutput from './HTTPStatusLookupOutput'
import HttpHeaderParserOutput from './HttpHeaderParserOutput'
import JWTDecoderOutput from './JWTDecoderOutput'
import MIMETypeLookupOutput from './MIMETypeLookupOutput'
import TimeNormalizerOutputPanel from './TimeNormalizerOutputPanel'
import MathEvaluatorResult from './MathEvaluatorResult'
import ResizeOutput from './ImageToolkit/outputs/ResizeOutput'

const CSSEditorInput = dynamic(() => import('./CSSEditorInput'), { ssr: false })
const MarkdownPreviewWithInspector = dynamic(() => import('./MarkdownPreviewWithInspector'), { ssr: false })

export default function ToolOutputPanel({ result, outputType, loading, error, toolId, activeToolkitSection, configOptions, onConfigChange, inputText, imagePreview, warnings = [], onInputUpdate, showAnalysisTab, onShowAnalysisTabChange, showRulesTab, onShowRulesTabChange, isPreviewFullscreen, onTogglePreviewFullscreen, renderCssTabOnly = false, activeMarkdownInputTab = 'input', markdownInputMode = 'input', markdownCustomCss: externalMarkdownCss = null, onMarkdownCustomCssChange = null, cssConfigOptions = {}, onCssConfigChange = null }) {
  const toolCategory = TOOLS[toolId]?.category
  const [copied, setCopied] = useState(false)
  const [copiedField, setCopiedField] = useState(null)
  const [expandedSection, setExpandedSection] = useState('formatted')
  const [previousResult, setPreviousResult] = useState(null)
  const [previousToolId, setPreviousToolId] = useState(null)
  const [previousToolkitSection, setPreviousToolkitSection] = useState(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [cronRunsToLoad, setCronRunsToLoad] = useState(5)
  const [enhancedResult, setEnhancedResult] = useState(null)
  const [caseConverterCopied, setCaseConverterCopied] = useState({})
  const [expandedMetric, setExpandedMetric] = useState(null)
  const [analyzerSearchQuery, setAnalyzerSearchQuery] = useState('')
  const [internalMarkdownCss, setInternalMarkdownCss] = useState('')
  // Use external prop if provided (for renderCssTabOnly mode), otherwise use internal state
  const markdownCustomCss = externalMarkdownCss !== null ? externalMarkdownCss : internalMarkdownCss
  const setMarkdownCustomCss = onMarkdownCustomCssChange || setInternalMarkdownCss
  const [scannedSelectors, setScannedSelectors] = useState({ tags: [], classes: [], suggestions: [] })
  const [cssFormatterResult, setCssFormatterResult] = useState(null)

  // Format CSS when markdownCustomCss changes (only for markdown-html-formatter)
  React.useEffect(() => {
    if (toolId === 'markdown-html-formatter' && markdownCustomCss && markdownCustomCss.trim()) {
      const formatCss = async () => {
        try {
          // Build formatter options from cssConfigOptions
          const formatterOptions = {
            mode: cssConfigOptions?.mode || 'beautify',
            indentSize: cssConfigOptions?.indentSize || '2',
            removeComments: cssConfigOptions?.removeComments !== false,
            addAutoprefix: cssConfigOptions?.addAutoprefix === true,
            browsers: cssConfigOptions?.browsers || 'last 2 versions',
            showValidation: cssConfigOptions?.showValidation !== false,
            showLinting: cssConfigOptions?.showLinting !== false,
          }
          // Call CSS formatter via API (server-side where PostCSS is available)
          const response = await fetch('/api/tools/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: 'css-formatter',
              inputText: markdownCustomCss,
              config: formatterOptions,
            }),
          })
          const { result } = await response.json()
          setCssFormatterResult(result)
        } catch (err) {
          console.error('CSS formatting error:', err)
          setCssFormatterResult(null)
        }
      }
      formatCss()
    } else {
      setCssFormatterResult(null)
    }
  }, [markdownCustomCss, toolId, cssConfigOptions])

  // If input is empty, treat as no result - render blank state
  const isInputEmpty = (!inputText || inputText.trim() === '') && !imagePreview
  const displayResult = isInputEmpty ? null : result
  const isMarkdownFormatter = toolId === 'markdown-html-formatter'
  const enableHtmlPreview = isMarkdownFormatter
    ? configOptions?.enableHtml === true
    : true
  const enableGfmFeatures = isMarkdownFormatter
    ? configOptions?.enableGfm !== false
    : true

  const shouldRenderMarkdownFormatterAsHtml = (formatterResult) => {
    if (!formatterResult) return false
    if (formatterResult.appliedConversion === 'html') {
      return true
    }
    if (formatterResult.appliedConversion === 'markdown') {
      return false
    }
    return formatterResult.contentMode === 'html'
  }

  const handleInsertSelector = (selector) => {
    // Insert selector template at the end of the CSS
    const selectorTemplate = `${selector} {

}\n`
    const newText = markdownCustomCss ? markdownCustomCss + '\n' + selectorTemplate : selectorTemplate
    setMarkdownCustomCss(newText)
  }

  const handleDialectChange = (dialect) => {
    if (onConfigChange) {
      onConfigChange({
        ...configOptions,
        language: dialect
      })
    }
  }

  const handleLoadMoreCronRuns = () => {
    const newRunCount = cronRunsToLoad + 10
    setCronRunsToLoad(newRunCount)
    if (onConfigChange) {
      onConfigChange({
        ...configOptions,
        runsToLoad: newRunCount,
      })
    }
  }

  const handleInsertXMLDeclaration = (xmlWithoutDeclaration) => {
    if (!onInputUpdate) return
    const xmlDeclaration = '<?xml version="1.0" encoding="UTF-8"?>\n'
    // Add declaration to the output and set it as new input to clear the lint warning
    const newInput = xmlDeclaration + (xmlWithoutDeclaration || '')
    onInputUpdate(newInput)
  }

  // Phase 6(E): Handle applying CSS edits from the preview inspector to the source
  // The CSS passed here is the ENTIRE mutated stylesheet (not just new rules)
  // We replace the entire input with this to preserve cascade and rule structure
  const handleApplyCSSStagedEdits = (editedCSS) => {
    if (!onInputUpdate || !editedCSS) return
    // Replace the entire CSS with the mutated version (preserves source structure)
    onInputUpdate(editedCSS)
  }

  // Handle editing embedded CSS in HTML - update the <style> block content
  const handleEmbeddedCssChange = (newEmbeddedCss) => {
    if (!onInputUpdate || !inputText) return

    // Replace the first <style> block content with the new CSS
    // This assumes all embedded CSS is in one block (simplified for now)
    const updatedHtml = inputText.replace(
      /<style[^>]*>([\s\S]*?)<\/style>/i,
      `<style>\n${newEmbeddedCss}\n</style>`
    )

    onInputUpdate(updatedHtml)
  }

  const handleSourceChange = ({ source, newContent }) => {
    if (!onInputUpdate) return
    // Only update the main input for HTML/Markdown changes, not CSS changes
    // CSS changes are handled via onCssChange callback
    if (source === 'html' || source === 'markdown') {
      onInputUpdate(newContent)
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
      'sortLines': 'sortLines',
      'delimiterTransformer': 'delimiterTransformer',
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
      setExpandedSection('formatted')
    }
  }, [toolId, previousToolId])

  React.useEffect(() => {
    if (toolId === 'text-toolkit' && activeToolkitSection !== previousToolkitSection) {
      // Clear previousResult when switching toolkit sections to prevent showing old content
      setPreviousResult(null)
      setPreviousToolkitSection(activeToolkitSection)
    }
  }, [activeToolkitSection, previousToolkitSection, toolId])

  // Scan selectors from canonical HTML for markdown formatter
  // This ensures consistent selector detection across both Markdown and HTML modes
  const emptySelectorState = React.useMemo(() => ({
    tags: [],
    classes: [],
    suggestions: { structure: [], headings: [], text: [], code: [] }
  }), [])

  React.useEffect(() => {
    if (toolId !== 'markdown-html-formatter') {
      setScannedSelectors(emptySelectorState)
      return
    }

    if (!displayResult?.formatted || typeof displayResult.formatted !== 'string') {
      setScannedSelectors(emptySelectorState)
      return
    }

    const formattedOutput = displayResult.formatted
    const selectorHtmlFlag = isMarkdownFormatter
      ? shouldRenderMarkdownFormatterAsHtml(displayResult)
      : isHtmlContent(formattedOutput)
    let htmlForSelectors = ''

    if (selectorHtmlFlag) {
      htmlForSelectors = formattedOutput
    } else {
      try {
        htmlForSelectors = marked.parse(formattedOutput)
      } catch (error) {
        console.warn('Failed to convert markdown to HTML for selector scanning:', error)
        htmlForSelectors = ''
      }
    }

    if (htmlForSelectors) {
      // Scan HTML for tag and class selectors
      const htmlSelectors = scanSelectorsFromHTML(htmlForSelectors)

      // Also extract and scan CSS from embedded <style> tags
      const embeddedCss = extractCssFromHtml(htmlForSelectors)
      const cssSelectors = embeddedCss ? extractSelectorsFromCSS(embeddedCss) : { tags: [], classes: [], suggestions: { structure: [], headings: [], text: [], code: [] } }

      // Merge HTML and CSS selectors
      const mergedTags = Array.from(new Set([...htmlSelectors.tags, ...cssSelectors.tags])).sort()
      const mergedClasses = Array.from(new Set([...htmlSelectors.classes, ...cssSelectors.classes])).sort()

      // Regenerate suggestions from merged selectors
      const { structure, headings, text, code } = htmlSelectors.suggestions
      const mergedSuggestions = {
        structure: Array.from(new Set([...structure, ...(cssSelectors.suggestions.structure || [])])).sort(),
        headings: Array.from(new Set([...headings, ...(cssSelectors.suggestions.headings || [])])).sort(),
        text: Array.from(new Set([...text, ...(cssSelectors.suggestions.text || [])])).sort(),
        code: Array.from(new Set([...code, ...(cssSelectors.suggestions.code || [])])).sort(),
      }

      setScannedSelectors({
        tags: mergedTags,
        classes: mergedClasses,
        suggestions: mergedSuggestions,
      })
    } else {
      setScannedSelectors(emptySelectorState)
    }
  }, [toolId, displayResult?.formatted, emptySelectorState])

  // For text-toolkit, check if current section has content
  const isTextToolkitWithoutContent = toolId === 'text-toolkit' && displayResult &&
    ['findReplace', 'slugGenerator', 'reverseText', 'removeExtras', 'whitespaceVisualizer', 'sortLines', 'delimiterTransformer'].includes(activeToolkitSection) &&
    !displayResult[getToolkitSectionKey(activeToolkitSection)]

  // Show blank tabs when no result (but skip for markdown formatter CSS mode)
  // Skip both when renderCssTabOnly AND when in CSS mode (markdownInputMode === 'css')
  if (!displayResult && !(toolId === 'markdown-html-formatter' && (renderCssTabOnly || markdownInputMode === 'css'))) {
    const waitingMessage = isInputEmpty ? 'Waiting for input...' : ''
    const blankTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: waitingMessage,
        contentType: 'text',
      },
      {
        id: 'json',
        label: 'JSON',
        content: waitingMessage,
        contentType: 'text',
      },
    ]
    return <OutputTabs tabs={blankTabs} toolCategory={toolCategory} toolId={toolId} showCopyButton={false} />
  }

  // Text toolkit without content for specific sections - show blank
  if (isTextToolkitWithoutContent) {
    return null
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
      } else if (activeToolkitSection === 'sortLines' && displayResult.sortLines) {
        textToCopy = displayResult.sortLines
      } else if (activeToolkitSection === 'delimiterTransformer' && displayResult.delimiterTransformer) {
        textToCopy = displayResult.delimiterTransformer
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

  // Base converter custom output
  if (toolId === 'base-converter' && displayResult?.conversions) {
    const { conversions, detectedBase, detectionReason, input, details } = displayResult

    const baseNames = {
      binary: 'Binary',
      octal: 'Octal',
      decimal: 'Decimal',
      hexadecimal: 'Hexadecimal',
    }

    const outputContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {detectedBase && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#4caf50',
          }}>
            Detected input as base {detectedBase} {detectionReason ? `(${detectionReason})` : ''}
          </div>
        )}

        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Standard Conversions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(conversions).map(([key, value]) => {
              if (key.startsWith('base_')) return null
              return (
                <div key={key} className={styles.copyCard}>
                  <div className={styles.copyCardHeader}>
                    <span className={styles.copyCardLabel}>{baseNames[key]} (base {key === 'binary' ? '2' : key === 'octal' ? '8' : key === 'decimal' ? '10' : '16'})</span>
                    <button
                      type="button"
                      className="copy-action"
                      onClick={() => handleCopyField(value, `base-${key}`)}
                      title="Copy to clipboard"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        minWidth: '32px',
                        minHeight: '28px'
                      }}
                    >
                      {copiedField === `base-${key}` ? '✓' : <FaCopy />}
                    </button>
                  </div>
                  <div className={styles.copyCardValue}>
                    {value}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {Object.entries(conversions).some(([key]) => key.startsWith('base_')) && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingTop: '8px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Custom Conversion
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(conversions).map(([key, value]) => {
                if (!key.startsWith('base_')) return null
                const baseNum = key.replace('base_', '')
                return (
                  <div key={key} className={styles.copyCard}>
                    <div className={styles.copyCardHeader}>
                      <span className={styles.copyCardLabel}>Custom Output (Base {baseNum})</span>
                      <button
                        type="button"
                        className="copy-action"
                        onClick={() => handleCopyField(value, `base-${baseNum}`)}
                        title="Copy to clipboard"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          minWidth: '32px',
                          minHeight: '28px'
                        }}
                      >
                        {copiedField === `base-${baseNum}` ? '✓' : <FaCopy />}
                      </button>
                    </div>
                    <div className={styles.copyCardValue}>
                      {value}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {details && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.2)',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary, #666)' }}>Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', color: 'var(--color-text-secondary, #666)' }}>
              {Object.entries(details).map(([key, val]) => (
                <div key={key}>
                  <strong>{key}:</strong> {String(val)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component',
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json',
          },
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  // Checksum calculator custom output
  if (toolId === 'checksum-calculator' && displayResult?.algorithm) {
    const { algorithm, conversions, metadata, byteLength, encoding, timestamp, outputFormat, primaryOutput, compareResult, detectedMode, isAutoDetected } = displayResult

    const outputFormatLabels = {
      hex: 'Hexadecimal (0x)',
      'hex-plain': 'Hex (plain)',
      decimal: 'Decimal',
      binary: 'Binary',
      'bytes-be': 'Bytes (Big-endian)',
      'bytes-le': 'Bytes (Little-endian)',
    }

    const outputContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Algorithm Info Section */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Algorithm Information
          </div>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(0, 102, 204, 0.05)',
            border: '1px solid rgba(0, 102, 204, 0.2)',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text)' }}>{metadata?.name}</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginBottom: '6px' }}>
              {metadata?.description}
            </div>
            {metadata?.polynomial && (
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '8px' }}>
                <div>Polynomial: <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '2px' }}>{metadata.polynomial}</code></div>
                <div>Initial: {metadata.initialValue}</div>
                <div>Final XOR: {metadata.finalXor}</div>
              </div>
            )}
          </div>
        </div>

        {/* Primary Checksum Output Section */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Primary Output ({outputFormatLabels[outputFormat] || outputFormat})
          </div>
          <div className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>{outputFormatLabels[outputFormat] || outputFormat}</span>
              <button
                type="button"
                className="copy-action"
                onClick={() => handleCopyField(primaryOutput, 'checksum-primary')}
                title="Copy to clipboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  minWidth: '32px',
                  minHeight: '28px'
                }}
              >
                {copiedField === 'checksum-primary' ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue} style={{ wordBreak: 'break-all', fontSize: '14px', fontWeight: '500' }}>
              {primaryOutput}
            </div>
          </div>
        </div>

        {/* All Formats Section */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            All Formats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(conversions).map(([key, value]) => {
              const labels = {
                decimal: 'Decimal',
                hex: 'Hexadecimal (0x)',
                hexPlain: 'Hex (plain)',
                binary: 'Binary',
                bytesBE: 'Bytes (Big-endian)',
                bytesLE: 'Bytes (Little-endian)',
              }
              const label = labels[key] || key
              return (
                <div key={key} className={styles.copyCard}>
                  <div className={styles.copyCardHeader}>
                    <span className={styles.copyCardLabel}>{label}</span>
                    <button
                      type="button"
                      className="copy-action"
                      onClick={() => handleCopyField(value, `checksum-${key}`)}
                      title="Copy to clipboard"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        minWidth: '32px',
                        minHeight: '28px'
                      }}
                    >
                      {copiedField === `checksum-${key}` ? '✓' : <FaCopy />}
                    </button>
                  </div>
                  <div className={styles.copyCardValue} style={{ wordBreak: 'break-all' }}>
                    {value}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Compare Mode Section */}
        {compareResult && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Comparison Results
            </div>

            {compareResult.error ? (
              <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(239, 83, 80, 0.1)',
                border: '1px solid rgba(239, 83, 80, 0.3)',
                borderRadius: '4px',
                color: '#ef5350',
                fontSize: '13px',
              }}>
                Error processing second input: {compareResult.error}
              </div>
            ) : (
              <>
                {/* Match Status */}
                <div style={{
                  padding: '16px',
                  backgroundColor: compareResult.match
                    ? 'rgba(76, 175, 80, 0.1)'
                    : 'rgba(255, 152, 0, 0.1)',
                  border: compareResult.match
                    ? '1px solid rgba(76, 175, 80, 0.3)'
                    : '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '700',
                    color: compareResult.match ? '#4caf50' : '#ff9800',
                    marginBottom: '8px',
                  }}>
                    {compareResult.match ? '✓ MATCH' : '✗ MISMATCH'}
                  </div>
                  {!compareResult.match && (
                    <div style={{
                      fontSize: '12px',
                      color: compareResult.match ? 'var(--color-text-secondary)' : '#ff9800',
                    }}>
                      Input A and Input B produce different checksums
                    </div>
                  )}
                </div>

                {/* Comparison Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Input A
                    </div>
                    <div className={styles.copyCard}>
                      <div className={styles.copyCardHeader}>
                        <span className={styles.copyCardLabel}>{outputFormatLabels[outputFormat] || outputFormat}</span>
                        <button
                          type="button"
                          className="copy-action"
                          onClick={() => handleCopyField(displayResult.primaryOutput, 'compare-input-a')}
                          title="Copy to clipboard"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            minWidth: '32px',
                            minHeight: '28px'
                          }}
                        >
                          {copiedField === 'compare-input-a' ? '✓' : <FaCopy />}
                        </button>
                      </div>
                      <div className={styles.copyCardValue} style={{ wordBreak: 'break-all' }}>
                        {displayResult.primaryOutput}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '6px',
                    }}>
                      {byteLength} bytes
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Input B
                    </div>
                    <div className={styles.copyCard}>
                      <div className={styles.copyCardHeader}>
                        <span className={styles.copyCardLabel}>{outputFormatLabels[outputFormat] || outputFormat}</span>
                        <button
                          type="button"
                          className="copy-action"
                          onClick={() => handleCopyField(compareResult.primaryOutput2, 'compare-input-b')}
                          title="Copy to clipboard"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            minWidth: '32px',
                            minHeight: '28px'
                          }}
                        >
                          {copiedField === 'compare-input-b' ? '✓' : <FaCopy />}
                        </button>
                      </div>
                      <div className={styles.copyCardValue} style={{ wordBreak: 'break-all' }}>
                        {compareResult.primaryOutput2}
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--color-text-secondary)',
                      marginTop: '6px',
                    }}>
                      {compareResult.byteLength2} bytes
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Metadata Section */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(158, 158, 158, 0.1)',
          border: '1px solid rgba(158, 158, 158, 0.2)',
          borderRadius: '4px',
          fontSize: '13px',
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Metadata</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
            <div><strong>Input Length:</strong> {byteLength} bytes</div>
            <div><strong>Encoding:</strong> {encoding}</div>
            {isAutoDetected && (
              <div>
                <strong>Input Mode:</strong>{' '}
                {detectedMode === 'text' ? 'Text (UTF-8)' :
                 detectedMode === 'hex' ? 'Hex bytes' :
                 detectedMode === 'base64' ? 'Base64' :
                 detectedMode === 'binary' ? 'Binary' :
                 detectedMode} (auto-detected)
              </div>
            )}
            <div><strong>Algorithm ID:</strong> {algorithm}</div>
            <div><strong>Output Format:</strong> {outputFormatLabels[outputFormat] || outputFormat}</div>
            <div><strong>Processed:</strong> {new Date(timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component',
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json',
          },
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  // Color converter custom output
  if (toolId === 'color-converter' && displayResult?.formats) {
    const { formats, rgb, hsl, hsv, lab, lch, cmyk, cmykProfiles, luminance, contrast, accessibility, variants, colorBlindness, detectedFormat, deltaE, gradient } = displayResult


    const handleCopyField = (value, field) => {
      let copySucceeded = false

      // Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(() => {
          copySucceeded = true
        }).catch((err) => {
          // Fallback: use old-school copy method
          console.debug('Clipboard API failed, trying fallback:', err.message)
          copySucceeded = fallbackCopy(value)
        })
      } else {
        // Fallback for non-secure contexts or if clipboard API is unavailable
        copySucceeded = fallbackCopy(value)
      }

      // Always show feedback, even if copy might fail silently
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    }

    const fallbackCopy = (text) => {
      try {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        textarea.style.top = '-9999px'
        textarea.setAttribute('readonly', '')
        document.body.appendChild(textarea)
        textarea.select()
        const success = document.execCommand('copy')
        document.body.removeChild(textarea)
        return success
      } catch (err) {
        console.warn('Fallback copy failed:', err)
        return false
      }
    }

    const ColorCard = ({ label, value, fieldId }) => (
      <div className={styles.copyCard}>
        <div className={styles.copyCardHeader}>
          <span className={styles.copyCardLabel}>{label}</span>
          <button
            type="button"
            className="copy-action"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleCopyField(value, fieldId)
            }}
            title="Copy to clipboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              minWidth: '32px',
              minHeight: '28px'
            }}
          >
            {copiedField === fieldId ? '✓' : <FaCopy />}
          </button>
        </div>
        <div className={styles.copyCardValue} style={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
          {value}
        </div>
      </div>
    )

    const ColorSwatch = ({ hexColor, size = '120px' }) => (
      <div style={{
        width: size,
        height: size,
        backgroundColor: hexColor,
        borderRadius: '8px',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }} />
    )


    const outputContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Color Preview */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          padding: '20px',
          backgroundColor: 'var(--color-background-tertiary)',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}>
          <ColorSwatch hexColor={formats.hex} size="140px" />
          <div style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '4px' }}>Detected: {detectedFormat.toUpperCase()}</div>
            <div style={{ fontSize: '11px' }}>{formats.hex}</div>
          </div>
        </div>

        {/* Base Formats */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Base Formats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <ColorCard label="HEX" value={formats.hex} fieldId="hex" />
            <ColorCard label="HEX8 (with alpha)" value={formats.hex8} fieldId="hex8" />
            <ColorCard label="RGB" value={formats.rgb} fieldId="rgb" />
            <ColorCard label="RGBA" value={formats.rgba} fieldId="rgba" />
            <ColorCard label="HSL" value={formats.hsl} fieldId="hsl" />
            <ColorCard label="HSLA" value={formats.hsla} fieldId="hsla" />
            <ColorCard label="HSV" value={formats.hsv} fieldId="hsv" />
          </div>
        </div>

        {/* Advanced Formats */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Advanced Formats
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <ColorCard label="LAB" value={formats.lab} fieldId="lab" />
            <ColorCard label="LCH" value={formats.lch} fieldId="lch" />
            <ColorCard label="CMYK (Simple)" value={formats.cmyk} fieldId="cmyk" />
            {cmykProfiles?.fogra && (
              <ColorCard label="CMYK (FOGRA Profile)" value={formats.cmykFogra} fieldId="cmykFogra" />
            )}
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(158, 158, 158, 0.1)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
            }}>
              <div><strong>Luminance:</strong> {luminance}</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Relative luminance for contrast calculation</div>
            </div>
          </div>
        </div>

        {/* CMYK Profiles Details */}
        {cmykProfiles && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              CMYK Profiles (Printing)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(66, 133, 244, 0.3)',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>Device-Dependent</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Standard formula</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  C: {cmykProfiles.simple.c}% M: {cmykProfiles.simple.m}% Y: {cmykProfiles.simple.y}% K: {cmykProfiles.simple.k}%
                </div>
              </div>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(244, 81, 30, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(244, 81, 30, 0.3)',
              }}>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>FOGRA Profile</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Industry standard (printing)</div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  C: {cmykProfiles.fogra.c}% M: {cmykProfiles.fogra.m}% Y: {cmykProfiles.fogra.y}% K: {cmykProfiles.fogra.k}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Accessibility */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Accessibility (WCAG)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(76, 175, 80, 0.3)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>vs White</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#4caf50', marginBottom: '6px' }}>
                {contrast.white}:1
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <div>AA: {accessibility.aaSmallText ? '✓' : '✗'}</div>
                <div>AAA: {accessibility.aaaSmallText ? '✓' : '✗'}</div>
              </div>
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(100, 100, 100, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(100, 100, 100, 0.3)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>vs Black</div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#666', marginBottom: '6px' }}>
                {contrast.black}:1
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                <div>AA: {accessibility.aaSmallText ? '✓' : '✗'}</div>
                <div>AAA: {accessibility.aaaSmallText ? '✓' : '✗'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Variants */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Variants & Palettes
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Shades (Darker)</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {variants.shades.map((shade, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: shade,
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                    }} />
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>-{(idx + 1) * 10}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Tints (Lighter)</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {variants.tints.map((tint, idx) => (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div style={{
                      width: '100%',
                      height: '40px',
                      backgroundColor: tint,
                      borderRadius: '4px',
                      border: '1px solid var(--color-border)',
                    }} />
                    <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>+{(idx + 1) * 10}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Complementary</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <ColorSwatch hexColor={formats.hex} size="50px" />
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center' }}>Opposite</div>
              </div>
            </div>
          </div>
        </div>

        {/* Color Blindness Simulation */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Color Blindness Simulation
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600' }}>Protanopia</div>
              <ColorSwatch hexColor={colorBlindness.protanopia.hex} size="60px" />
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{colorBlindness.protanopia.hex}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600' }}>Deuteranopia</div>
              <ColorSwatch hexColor={colorBlindness.deuteranopia.hex} size="60px" />
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{colorBlindness.deuteranopia.hex}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600' }}>Tritanopia</div>
              <ColorSwatch hexColor={colorBlindness.tritanopia.hex} size="60px" />
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{colorBlindness.tritanopia.hex}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600' }}>Achromatopsia</div>
              <ColorSwatch hexColor={colorBlindness.achromatopsia.hex} size="60px" />
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{colorBlindness.achromatopsia.hex}</div>
            </div>
          </div>
        </div>

        {/* Delta-E Comparison */}
        {deltaE && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              ⚖️ Delta-E Color Comparison
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '12px',
                backgroundColor: 'rgba(156, 39, 176, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(156, 39, 176, 0.3)',
                marginBottom: '12px',
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Comparing colors:</div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>{deltaE.color1} → {deltaE.color2}</div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{deltaE.color2Hex}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ΔE 76</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#2196f3', marginBottom: '4px' }}>{deltaE.deltaE76}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{deltaE.interpretation76}</div>
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(76, 175, 80, 0.3)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ΔE 94</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#4caf50', marginBottom: '4px' }}>{deltaE.deltaE94}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{deltaE.interpretation94}</div>
                </div>
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>ΔE 2000</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#ff9800', marginBottom: '4px' }}>{deltaE.deltaE2000}</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>{deltaE.interpretation2000}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gradient Preview */}
        {gradient?.startColor && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text)',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              Linear Gradient
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{
                width: '100%',
                height: '80px',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: gradient.css,
                marginBottom: '12px',
              }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>From:</div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                    {gradient.startColor}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>To:</div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                    {gradient.endColor}
                  </div>
                </div>
              </div>

              {(() => {
                // Find midpoint color (50%)
                const midpoint = gradient.colors.find(c => c.percentage === 50) ||
                                 gradient.colors[Math.floor(gradient.colors.length / 2)]
                // Calculate contrast ratio between start and end
                const startHex = gradient.startColor
                const endHex = gradient.endColor
                const startResult = colorConverter(startHex, {})
                const endResult = colorConverter(endHex, {})

                if (startResult.error || endResult.error) return null

                const startLum = startResult.luminance || 0
                const endLum = endResult.luminance || 0
                const lighter = Math.max(startLum, endLum)
                const darker = Math.min(startLum, endLum)
                const contrastRatio = (lighter + 0.05) / (darker + 0.05)
                const wcagPass = contrastRatio >= 4.5 ? '✓ Pass WCAG AA' : contrastRatio >= 3 ? '⚠ WCAG Large' : '✗ Fail WCAG'

                return (
                  <div style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{
                      padding: '12px',
                      backgroundColor: 'rgba(33, 150, 243, 0.05)',
                      borderRadius: '6px',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                    }}>
                      <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                        Contrast Ratio
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#2196f3', marginBottom: '4px' }}>
                        {contrastRatio.toFixed(2)}:1
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        {wcagPass}
                      </div>
                    </div>
                    {midpoint && (
                      <div style={{
                        padding: '12px',
                        backgroundColor: 'rgba(76, 175, 80, 0.05)',
                        borderRadius: '6px',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                          Midpoint (50%)
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <div style={{
                            width: '30px',
                            height: '30px',
                            backgroundColor: midpoint.hex,
                            borderRadius: '4px',
                            border: '1px solid var(--color-border)',
                          }} />
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: '600', fontFamily: 'monospace', color: '#4caf50' }}>
                              {midpoint.hex}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Color Stops:</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {gradient.colors.map((stop, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: stop.hex,
                        borderRadius: '4px',
                        border: '1px solid var(--color-border)',
                      }} />
                      <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>{stop.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <ColorCard label="CSS" value={gradient.css} fieldId="gradientCSS" />
                {gradient.tailwind && (
                  <ColorCard label="Tailwind" value={gradient.tailwind} fieldId="gradientTailwind" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Palette Export */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text)',
            marginBottom: '12px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--color-border)',
          }}>
            Export Palette
          </div>
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px',
            }}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const json = {
                    colors: [
                      { name: 'current', hex: formats.hex, rgb: formats.rgb, hsl: formats.hsl }
                    ]
                  }
                  handleCopyField(JSON.stringify(json, null, 2), 'paletteJSON')
                }}
                style={{
                  padding: '10px',
                  backgroundColor: copiedField === 'paletteJSON' ? 'rgba(76, 175, 80, 0.2)' : 'var(--color-background-tertiary)',
                  border: copiedField === 'paletteJSON' ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid var(--color-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: copiedField === 'paletteJSON' ? '#4caf50' : 'var(--color-text)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (copiedField !== 'paletteJSON') {
                    e.target.style.backgroundColor = 'var(--color-background-secondary)'
                  }
                }}
                onMouseOut={(e) => {
                  if (copiedField !== 'paletteJSON') {
                    e.target.style.backgroundColor = 'var(--color-background-tertiary)'
                  }
                }}
              >
                {copiedField === 'paletteJSON' ? '✓ Copied!' : 'JSON'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="${formats.hex}"/></svg>`
                  handleCopyField(svg, 'paletteSVG')
                }}
                style={{
                  padding: '10px',
                  backgroundColor: copiedField === 'paletteSVG' ? 'rgba(76, 175, 80, 0.2)' : 'var(--color-background-tertiary)',
                  border: copiedField === 'paletteSVG' ? '1px solid rgba(76, 175, 80, 0.5)' : '1px solid var(--color-border)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: copiedField === 'paletteSVG' ? '#4caf50' : 'var(--color-text)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => {
                  if (copiedField !== 'paletteSVG') {
                    e.target.style.backgroundColor = 'var(--color-background-secondary)'
                  }
                }}
                onMouseOut={(e) => {
                  if (copiedField !== 'paletteSVG') {
                    e.target.style.backgroundColor = 'var(--color-background-tertiary)'
                  }
                }}
              >
                {copiedField === 'paletteSVG' ? '✓ Copied!' : 'SVG'}
              </button>
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 193, 7, 0.3)',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>💡 Tip</div>
              Multiple colors? Save them as variants above to export grouped palettes.
            </div>
          </div>
        </div>
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component',
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json',
          },
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  // URL toolkit custom output
  if (toolId === 'url-toolkit' && displayResult?.components) {
    return <URLToolkitOutput result={displayResult} toolCategory={toolCategory} toolId={toolId} />
  }

  // Number formatter custom output
  if (toolId === 'number-formatter') {
    if (!displayResult || typeof displayResult !== 'object') {
      return null
    }

    if (displayResult.error) {
      const tabs = [
        {
          id: 'output',
          label: 'OUTPUT',
          content: displayResult.error,
          contentType: 'error',
        },
      ]
      return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} />
    }

    const { type, output, formatted, results, input, config } = displayResult

    let resultsList = (results && Array.isArray(results)) ? results : []
    let inputList = (input && Array.isArray(input)) ? input : []

    // If no results, return null to let default handler take over
    if (resultsList.length === 0) {
      return null
    }

    const friendlyView = ({ onCopyCard, copiedCardId }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--color-text-secondary)',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '1px solid var(--color-border)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {resultsList.length === 1 ? 'Formatted Number' : `Formatted Numbers (${resultsList.length})`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resultsList.map((result, idx) => {
            const inputNum = inputList[idx]
            const cardId = `number-${idx}`
            return (
              <div key={idx} className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>
                    {inputNum !== undefined ? `Input: ${inputNum}` : `Number ${idx + 1}`}
                  </span>
                  <button
                    className="copy-action"
                    onClick={() => onCopyCard(result, cardId)}
                    title={`Copy ${result}`}
                  >
                    {copiedCardId === cardId ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{result}</div>
              </div>
            )
          })}
        </div>
      </div>
    )

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
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

  // Time normalizer custom output (uses dedicated output panel for bulk + single mode)
  if (toolId === 'time-normalizer') {
    return <TimeNormalizerOutputPanel result={displayResult} inputText={inputText} config={configOptions} />
  }

  // Legacy time normalizer handling (keeping for backwards compatibility)
  if (toolId === 'time-normalizer-legacy' && displayResult && displayResult.humanSummary) {
    if (displayResult.error) {
      return null
    }

    const { humanSummary, inputReadable, convertedReadable, detectedFormat, inputTimezone, inputTime, inputOffset, convertedTime, outputTimezone, outputOffset, unixSeconds, unixMillis } = displayResult

    const outputContent = (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Human Summary - TOP PRIORITY */}
        <div style={{
          padding: '16px',
          backgroundColor: 'rgba(76, 175, 80, 0.08)',
          border: '2px solid rgba(76, 175, 80, 0.3)',
          borderRadius: '6px',
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Time Conversion
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              padding: '10px 0',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--color-text)',
              borderBottom: '1px solid rgba(76, 175, 80, 0.2)',
            }}>
              <strong>From:</strong> {humanSummary.from}
            </div>
            <div style={{
              padding: '10px 0',
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--color-text)',
            }}>
              <strong>To:</strong> {humanSummary.to}
            </div>
            {humanSummary.difference && (
              <div style={{
                padding: '10px 0',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}>
                <strong>Difference:</strong> {humanSummary.difference}
              </div>
            )}
            {humanSummary.dayShift !== 'Same Day' && (
              <div style={{
                padding: '10px 0',
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
              }}>
                <strong>Day Shift:</strong> {humanSummary.dayShift}
              </div>
            )}
          </div>
        </div>

        {/* Context Layer - Secondary */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Formatted Times
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {inputReadable && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Time</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(inputReadable, 'input-readable')}
                    title="Copy input time"
                  >
                    {copiedField === 'input-readable' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{inputReadable}</div>
              </div>
            )}
            {convertedReadable && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Converted Time</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(convertedReadable, 'converted-readable')}
                    title="Copy converted time"
                  >
                    {copiedField === 'converted-readable' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{convertedReadable}</div>
              </div>
            )}
          </div>
        </div>

        {/* Technical Details - Tertiary */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Technical Details
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {detectedFormat && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Detected Format</span>
                </div>
                <div className={styles.copyCardValue}>{detectedFormat}</div>
              </div>
            )}
            {inputTimezone && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Timezone</span>
                </div>
                <div className={styles.copyCardValue}>{inputTimezone}</div>
              </div>
            )}
            {inputOffset && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Offset</span>
                </div>
                <div className={styles.copyCardValue}>{inputOffset}</div>
              </div>
            )}
            {outputTimezone && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Output Timezone</span>
                </div>
                <div className={styles.copyCardValue}>{outputTimezone}</div>
              </div>
            )}
            {outputOffset && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Output Offset</span>
                </div>
                <div className={styles.copyCardValue}>{outputOffset}</div>
              </div>
            )}
            {inputTime && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Input Time (ISO)</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(inputTime, 'input-iso')}
                    title="Copy input ISO time"
                  >
                    {copiedField === 'input-iso' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue} style={{ wordBreak: 'break-all', fontSize: '12px' }}>{inputTime}</div>
              </div>
            )}
            {convertedTime && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Converted Time (ISO)</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(convertedTime, 'converted-iso')}
                    title="Copy converted ISO time"
                  >
                    {copiedField === 'converted-iso' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue} style={{ wordBreak: 'break-all', fontSize: '12px' }}>{convertedTime}</div>
              </div>
            )}
            {unixSeconds !== undefined && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Unix Timestamp (seconds)</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(String(unixSeconds), 'unix-seconds')}
                    title="Copy Unix timestamp (seconds)"
                  >
                    {copiedField === 'unix-seconds' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{unixSeconds}</div>
              </div>
            )}
            {unixMillis !== undefined && (
              <div className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>Unix Timestamp (milliseconds)</span>
                  <button
                    className="copy-action"
                    onClick={() => handleCopyField(String(unixMillis), 'unix-millis')}
                    title="Copy Unix timestamp (milliseconds)"
                  >
                    {copiedField === 'unix-millis' ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{unixMillis}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    )

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: outputContent,
        contentType: 'component',
      },
      {
        id: 'json',
        label: 'JSON',
        content: JSON.stringify(displayResult, null, 2),
        contentType: 'json',
      },
    ]

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
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

    // Check for validation errors first
    let hasValidationErrors = false
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error' && d.category !== 'lint')
      hasValidationErrors = validationErrors.length > 0
    }

    // Add primary tab FIRST - only show if isWellFormed is true AND no validation errors
    if (primaryTabId && primaryTabContent) {
      if (displayResult.isWellFormed && !hasValidationErrors) {
        if (typeof primaryTabContent === 'string' && primaryTabContent.trim()) {
          tabs.push({
            id: primaryTabId,
            label: 'OUTPUT',
            content: primaryTabContent,
            contentType: 'code',
          })
        }
      }
    }

    // Validation tab - show input and output errors separately
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const inputErrors = displayResult.inputDiagnostics ? displayResult.inputDiagnostics.filter(d => d.type === 'error') : []
      const outputErrors = displayResult.outputDiagnostics ? displayResult.outputDiagnostics.filter(d => d.type === 'error') : []
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error' && d.category !== 'lint')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div>
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
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
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
          <div>
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

    // Add JSON tab - shows input, output, and diagnostics only
    const jsonWithInputOutput = {
      input: inputText,
      output: displayResult.formatted || displayResult.minified || displayResult.obfuscated,
      isWellFormed: displayResult.isWellFormed,
      diagnostics: displayResult.diagnostics || [],
      analysis: displayResult.analysis,
      optionsApplied: {
        mode: displayResult.optionsApplied?.mode,
        indentSize: displayResult.optionsApplied?.indentSize,
      },
    }
    tabs.push({
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(jsonWithInputOutput, null, 2),
      contentType: 'code',
      language: 'json',
    })

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
          contentType: 'code',
        })
      }
    }

    // Validation tab
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div>
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
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
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
          <div>
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

    // Add JSON tab - shows input, output, and diagnostics only
    const yamlJsonWithInputOutput = {
      input: inputText,
      output: displayResult.formatted,
      isWellFormed: displayResult.isWellFormed,
      diagnostics: displayResult.diagnostics || [],
      optionsApplied: {
        mode: displayResult.optionsApplied?.mode,
        indentSize: displayResult.optionsApplied?.indentSize,
      },
    }
    tabs.push({
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(yamlJsonWithInputOutput, null, 2),
      contentType: 'code',
      language: 'json',
    })

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  // Helper to detect if content is HTML or Markdown
  const isHtmlContent = (content) => {
    if (!content || typeof content !== 'string') return false
    // Simple check: if content contains HTML-like tags, it's likely HTML
    return /<[a-z][\w\s="'/:.-]*>/i.test(content.trim())
  }

  const renderMarkdownFormatterOutput = () => {
    // Helper to remove .pwt-markdown-preview prefix from selectors
    const cleanSelector = (selector) => {
      if (typeof selector === 'string' && selector.startsWith('.pwt-markdown-preview ')) {
        return selector.replace('.pwt-markdown-preview ', '')
      }
      return selector
    }

    // If CSS mode is active, ALWAYS show CSS formatter output tabs (not renderCssTabOnly)
    // This should be checked FIRST, even if there's no HTML/Markdown input
    // Use markdownInputMode instead of activeMarkdownInputTab to preserve CSS output when clicking OPTIONS tab
    if (!renderCssTabOnly && markdownInputMode === 'css') {
      const cssOutputTabs = []

      // Always build the tabs regardless of cssFormatterResult state
      if (!cssFormatterResult) {
        // If no CSS formatter result yet, show rendered preview (if HTML/Markdown exists)
        if (displayResult && displayResult.formatted) {
          // Don't scope here - MarkdownPreviewWithInspector handles scoping internally
          const isHtml = shouldRenderMarkdownFormatterAsHtml(displayResult)

          // Extract embedded CSS from HTML (marked with origin: 'html')
          const embeddedRules = isHtml
            ? extractAndParseCssFromHtml(displayResult.formatted)
            : []

          // Parse customCss with origin: 'css' for tracking
          const customCssRules = markdownCustomCss && markdownCustomCss.trim()
            ? parseCssToRulesTree(markdownCustomCss, { origin: 'css', containerId: 'css-tab' })
            : []

          // Offset CSS tab rules' ruleIndex by embedded rules count
          // This ensures globally unique ruleIndex across all sources
          const customCssRulesWithOffset = customCssRules.map(rule => ({
            ...rule,
            ruleIndex: rule.ruleIndex + embeddedRules.length
          }))

          // Merge: embedded rules first, then customCss rules
          const mergedRulesForDisplay = [...embeddedRules, ...customCssRulesWithOffset]

          cssOutputTabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: (
              <MarkdownPreviewWithInspector
                isHtml={isHtml}
                content={displayResult.formatted}
                customCss={markdownCustomCss}
                rulesTree={mergedRulesForDisplay}
                allowHtml={enableHtmlPreview}
                enableGfm={enableGfmFeatures}
                isFullscreen={isPreviewFullscreen}
                onToggleFullscreen={onTogglePreviewFullscreen}
                onCssChange={(newCss) => setMarkdownCustomCss(newCss)}
                onHtmlChange={handleEmbeddedCssChange}
                onSourceChange={handleSourceChange}
              />
            ),
            contentType: 'component',
          })
        } else {
          // No HTML/Markdown to render yet
          cssOutputTabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: 'Waiting for results...',
            contentType: 'text',
          })
        }
      } else {
        // Check if CSS is valid
        const isValid = cssFormatterResult.isWellFormed !== false
        const validationErrors = (cssFormatterResult.diagnostics && Array.isArray(cssFormatterResult.diagnostics))
          ? cssFormatterResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
          : []

        // Add primary output tab FIRST - show rendered preview of HTML/Markdown with CSS applied
        if (displayResult && displayResult.formatted) {
          // Don't scope here - MarkdownPreviewWithInspector handles scoping internally
          const isHtml = shouldRenderMarkdownFormatterAsHtml(displayResult)

          // Extract embedded CSS from HTML (marked with origin: 'html')
          const embeddedRules = isHtml
            ? extractAndParseCssFromHtml(displayResult.formatted)
            : []

          // Get CSS rules from formatter with origin: 'css'
          // Note: formatter rules already have origin info, but ensure css-tab containerId
          const cssFormatterRules = (cssFormatterResult?.analysis?.rulesTree || []).map(rule => ({
            ...rule,
            origin: rule.origin || { source: 'css', containerId: 'css-tab' }
          }))

          // Offset CSS formatter rules' ruleIndex by embedded rules count
          // This ensures globally unique ruleIndex across all sources
          const cssFormatterRulesWithOffset = cssFormatterRules.map(rule => ({
            ...rule,
            ruleIndex: rule.ruleIndex + embeddedRules.length
          }))

          // Merge: embedded rules first, then CSS rules
          const mergedRulesForDisplay = [...embeddedRules, ...cssFormatterRulesWithOffset]

          console.log('[ToolOutputPanel CSS with formatter] isHtml:', isHtml, 'embedded:', embeddedRules.length, 'formatter:', cssFormatterRules.length, 'merged:', mergedRulesForDisplay.length)

          cssOutputTabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: (
              <MarkdownPreviewWithInspector
                isHtml={isHtml}
                content={displayResult.formatted}
                customCss={markdownCustomCss}
                rulesTree={mergedRulesForDisplay}
                allowHtml={enableHtmlPreview}
                enableGfm={enableGfmFeatures}
                isFullscreen={isPreviewFullscreen}
                onToggleFullscreen={onTogglePreviewFullscreen}
                onCssChange={(newCss) => setMarkdownCustomCss(newCss)}
                onHtmlChange={handleEmbeddedCssChange}
                onSourceChange={handleSourceChange}
              />
            ),
            contentType: 'component',
          })
        }

        // Add FORMATTED tab - show the formatted CSS code
        // Use !== undefined to allow empty strings as valid formatted output
        if (cssFormatterResult.formatted !== undefined) {
          // Check if formatted CSS is empty (e.g., from minifying empty rules)
          const isEmptyFormatted = cssFormatterResult.formatted === '' || cssFormatterResult.formatted.trim() === ''

          if (isEmptyFormatted) {
            // Show a helpful message for empty formatted CSS
            cssOutputTabs.push({
              id: 'formatted',
              label: 'FORMATTED',
              content: (
                <div style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                }}>
                  <div style={{ marginBottom: '8px', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                    ✓ Formatted CSS is empty
                  </div>
                  <div>
                    The CSS rules have no declarations or resulted in no output after formatting.
                  </div>
                </div>
              ),
              contentType: 'component',
            })
          } else {
            // Show the formatted CSS code normally
            cssOutputTabs.push({
              id: 'formatted',
              label: 'FORMATTED',
              content: cssFormatterResult.formatted,
              contentType: 'code',
              language: 'css',
            })
          }
        } else if (!isValid && validationErrors.length > 0) {
          // Show validation errors in FORMATTED if there's no formatted CSS
          cssOutputTabs.push({
            id: 'formatted',
            label: 'FORMATTED',
            content: (
              <div>
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
                  {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
                </div>
                {renderValidationErrorsUnified(validationErrors, 'CSS Validation Errors')}
              </div>
            ),
            contentType: 'component',
          })
        } else {
          // Show placeholder when CSS formatter is running but no result yet
          cssOutputTabs.push({
            id: 'formatted',
            label: 'FORMATTED',
            content: 'Waiting for CSS...',
            contentType: 'text',
          })
        }
      }

      // When there's no cssFormatterResult yet, still show FORMATTED tab as placeholder
      if (!cssFormatterResult) {
        cssOutputTabs.push({
          id: 'formatted',
          label: 'FORMATTED',
          content: 'Waiting for CSS...',
          contentType: 'text',
        })
      }

      // Add VALIDATION tab - always show (regardless of cssFormatterResult state)
      if (cssFormatterResult) {
        if (cssFormatterResult.showValidation !== false) {
          const validationErrors = (cssFormatterResult.diagnostics && Array.isArray(cssFormatterResult.diagnostics))
            ? cssFormatterResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
            : []

          if (validationErrors.length > 0) {
            const validationContent = (
              <div>
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
                  {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
                </div>
                {renderValidationErrorsUnified(validationErrors, 'CSS Validation Errors')}
              </div>
            )

            cssOutputTabs.push({
              id: 'validation',
              label: `Validation (${validationErrors.length})`,
              content: validationContent,
              contentType: 'component',
            })
          } else {
            cssOutputTabs.push({
              id: 'validation',
              label: 'Validation (✓)',
              content: (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--color-text-secondary)',
                }}>
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(102, 187, 106, 0.1)',
                    border: '1px solid rgba(102, 187, 106, 0.3)',
                    borderRadius: '4px',
                    color: '#66bb6a',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    Valid CSS
                  </div>
                </div>
              ),
              contentType: 'component',
            })
          }
        }

        // Add LINTING tab - show warnings from diagnostics (if linting is enabled)
        if (cssFormatterResult.showLinting && cssFormatterResult.diagnostics && Array.isArray(cssFormatterResult.diagnostics)) {
          const lintingWarnings = cssFormatterResult.diagnostics.filter(d => d.category === 'lint')
          const isCssValid = cssFormatterResult.isWellFormed !== false

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
              <div>
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

          cssOutputTabs.push({
            id: 'linting',
            label: lintingLabel,
            content: lintingContent,
            contentType: 'component',
          })
        }

        // Add JSON tab
        cssOutputTabs.push({
          id: 'json',
          label: 'JSON',
          content: JSON.stringify(cssFormatterResult, null, 2),
          contentType: 'json',
        })
      }

      if (cssOutputTabs.length === 0) return null

      return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={cssOutputTabs} analysisData={cssFormatterResult?.analysis} sourceText={markdownCustomCss} showCopyButton={true} showAnalysisTab={cssConfigOptions?.showAnalysisTab || false} onShowAnalysisTabChange={(val) => onCssConfigChange?.({ ...cssConfigOptions, showAnalysisTab: val })} showRulesTab={cssConfigOptions?.showRulesTab || false} onShowRulesTabChange={(val) => onCssConfigChange?.({ ...cssConfigOptions, showRulesTab: val })} isPreviewFullscreen={isPreviewFullscreen} onTogglePreviewFullscreen={onTogglePreviewFullscreen} />
    }


    // If renderCssTabOnly is true, return only the CSS editor (even with no HTML/MD input)
    if (renderCssTabOnly) {
      return (
        <div style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: '12px',
            color: 'var(--color-text-secondary)',
            lineHeight: '1.5',
            padding: '10px 12px',
            backgroundColor: 'rgba(33, 150, 243, 0.08)',
            border: '1px solid rgba(33, 150, 243, 0.2)',
            borderRadius: '4px',
          }}>
            Edit CSS to style the preview. Selectors like <code style={{ fontFamily: 'monospace', fontSize: '11px', backgroundColor: 'rgba(33, 150, 243, 0.15)', padding: '2px 4px', borderRadius: '2px' }}>h1</code>, <code style={{ fontFamily: 'monospace', fontSize: '11px', backgroundColor: 'rgba(33, 150, 243, 0.15)', padding: '2px 4px', borderRadius: '2px' }}>p</code>, etc. are auto-scoped.
          </div>

          <div style={{
            padding: '12px',
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            fontSize: '12px',
          }}>
            {(scannedSelectors.suggestions &&
              typeof scannedSelectors.suggestions === 'object' &&
              !Array.isArray(scannedSelectors.suggestions) &&
              (scannedSelectors.suggestions.structure?.length > 0 ||
               scannedSelectors.suggestions.headings?.length > 0 ||
               scannedSelectors.suggestions.text?.length > 0 ||
               scannedSelectors.suggestions.code?.length > 0)
            ) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* Structure Category */}
                {scannedSelectors.suggestions.structure?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Structure
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {scannedSelectors.suggestions.structure.map((selector, idx) => {
                        const cleanedSelector = cleanSelector(selector)
                        return (
                        <button
                          key={`structure-${idx}`}
                          onClick={() => handleInsertSelector(cleanedSelector)}
                          title={`Click to insert "${cleanedSelector}" selector`}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(76, 175, 80, 0.2)',
                            color: '#4caf50',
                            border: '1px solid rgba(76, 175, 80, 0.5)',
                            borderRadius: '3px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.3)'
                            e.target.style.borderColor = 'rgba(76, 175, 80, 0.7)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'
                            e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)'
                          }}
                        >
                          {cleanedSelector}
                        </button>
                      )
                      })}
                    </div>
                  </div>
                )}

                {/* Headings Category */}
                {scannedSelectors.suggestions.headings?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Headings
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {scannedSelectors.suggestions.headings.map((selector, idx) => {
                        const cleanedSelector = cleanSelector(selector)
                        return (
                        <button
                          key={`headings-${idx}`}
                          onClick={() => handleInsertSelector(cleanedSelector)}
                          title={`Click to insert "${cleanedSelector}" selector`}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(33, 150, 243, 0.2)',
                            color: '#2196f3',
                            border: '1px solid rgba(33, 150, 243, 0.5)',
                            borderRadius: '3px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.3)'
                            e.target.style.borderColor = 'rgba(33, 150, 243, 0.7)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.2)'
                            e.target.style.borderColor = 'rgba(33, 150, 243, 0.5)'
                          }}
                        >
                          {cleanedSelector}
                        </button>
                      )
                      })}
                    </div>
                  </div>
                )}

                {/* Text Category */}
                {scannedSelectors.suggestions.text?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Text
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {scannedSelectors.suggestions.text.map((selector, idx) => {
                        const cleanedSelector = cleanSelector(selector)
                        return (
                        <button
                          key={`text-${idx}`}
                          onClick={() => handleInsertSelector(cleanedSelector)}
                          title={`Click to insert "${cleanedSelector}" selector`}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(156, 39, 176, 0.2)',
                            color: '#9c27b0',
                            border: '1px solid rgba(156, 39, 176, 0.5)',
                            borderRadius: '3px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(156, 39, 176, 0.3)'
                            e.target.style.borderColor = 'rgba(156, 39, 176, 0.7)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(156, 39, 176, 0.2)'
                            e.target.style.borderColor = 'rgba(156, 39, 176, 0.5)'
                          }}
                        >
                          {cleanedSelector}
                        </button>
                      )
                      })}
                    </div>
                  </div>
                )}

                {/* Code Category */}
                {scannedSelectors.suggestions.code?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Code
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {scannedSelectors.suggestions.code.map((selector, idx) => {
                        const cleanedSelector = cleanSelector(selector)
                        return (
                        <button
                          key={`code-${idx}`}
                          onClick={() => handleInsertSelector(cleanedSelector)}
                          title={`Click to insert "${cleanedSelector}" selector`}
                          style={{
                            padding: '4px 6px',
                            backgroundColor: 'rgba(255, 152, 0, 0.2)',
                            color: '#ff9800',
                            border: '1px solid rgba(255, 152, 0, 0.5)',
                            borderRadius: '3px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 152, 0, 0.3)'
                            e.target.style.borderColor = 'rgba(255, 152, 0, 0.7)'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 152, 0, 0.2)'
                            e.target.style.borderColor = 'rgba(255, 152, 0, 0.5)'
                          }}
                        >
                          {cleanedSelector}
                        </button>
                      )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontStyle: 'italic' }}>
                No selectors detected yet
              </span>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 0, border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden' }}>
            <CSSEditorInput
              value={markdownCustomCss}
              onChange={setMarkdownCustomCss}
              diagnostics={cssFormatterResult?.diagnostics || []}
            />
          </div>
        </div>
      )
    }

    // If no HTML/Markdown input and not in CSS mode, show waiting state
    if (!displayResult || typeof displayResult !== 'object') return null

    const tabs = []

    // Detect if the formatted output is HTML or Markdown using formatter metadata
    const isHtml = isMarkdownFormatter
      ? shouldRenderMarkdownFormatterAsHtml(displayResult)
      : isHtmlContent(displayResult.formatted)

    // Rendered tab - shows the formatted content rendered as HTML (this will be OUTPUT tab - first)
    let renderTab = null
    if (displayResult.formatted && displayResult.isWellFormed !== false) {
      // Use MarkdownPreviewWithInspector for all modes to ensure consistent CSS extraction and application
      // This component handles both HTML mode (extracts <style> tags) and Markdown mode
      // Extract embedded CSS from HTML (marked with origin: 'html')
      const embeddedRules = isHtml
        ? extractAndParseCssFromHtml(displayResult.formatted)
        : []

      // Parse customCss with origin: 'css'
      const customCssRules = markdownCustomCss && markdownCustomCss.trim()
        ? parseCssToRulesTree(markdownCustomCss, { origin: 'css', containerId: 'css-tab' })
        : []

      // Offset CSS tab rules' ruleIndex by embedded rules count
      // This ensures globally unique ruleIndex across all sources
      // IMPORTANT: Must apply this offset regardless of which tab is active
      // to maintain stable cascade detection (render layer, not editor layer)
      const customCssRulesWithOffset = customCssRules.map(rule => ({
        ...rule,
        ruleIndex: rule.ruleIndex + embeddedRules.length
      }))

      // Merge: embedded rules first, then customCss rules
      const mergedRulesForDisplay = [...embeddedRules, ...customCssRulesWithOffset]

      renderTab = {
        id: 'output',
        label: 'OUTPUT',
        content: (
          <MarkdownPreviewWithInspector
            isHtml={isHtml}
            content={displayResult.formatted}
            customCss={markdownCustomCss}
            rulesTree={mergedRulesForDisplay}
            allowHtml={enableHtmlPreview}
            enableGfm={enableGfmFeatures}
            isFullscreen={isPreviewFullscreen}
            onToggleFullscreen={onTogglePreviewFullscreen}
            onCssChange={(newCss) => setMarkdownCustomCss(newCss)}
            onHtmlChange={handleEmbeddedCssChange}
            onSourceChange={handleSourceChange}
          />
        ),
        contentType: 'component',
      }
      tabs.push(renderTab)
    }

    // Add formatted code tab - shows the beautified source code
    if (displayResult.formatted !== undefined) {
      tabs.push({
        id: 'formatted',
        label: 'FORMATTED',
        content: displayResult.formatted,
        contentType: 'code',
        language: isHtml ? 'markup' : 'markdown',
      })
    } else if (displayResult.error) {
      // Show error message in OUTPUT tab if formatting failed
      tabs.push({
        id: 'formatted',
        label: 'OUTPUT',
        content: (
          <div style={{ padding: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
            }}>
              {displayResult.error}
            </div>
          </div>
        ),
        contentType: 'component',
      })
    }

    // Validation tab - show if enabled
    if (displayResult.showValidation !== false) {
      const validationErrors = (displayResult.diagnostics && Array.isArray(displayResult.diagnostics))
        ? displayResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
        : []

      if (validationErrors.length > 0) {
        const validationContent = (
          <div>
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
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
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
          <div>
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



    // CSS Editor tab - allows users to customize markdown rendering styles
    // Skip if we're rendering CSS tab only in the InputTabs (renderCssTabOnly mode)
    // Also skip for markdown-html-formatter since CSS is handled in the input tabs
    if (!renderCssTabOnly && displayResult.formatted && displayResult.isWellFormed !== false && toolId !== 'markdown-html-formatter') {
      tabs.push({
        id: 'css',
        label: 'CSS',
        content: (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.5',
              marginBottom: '4px',
            }}>
              💡 <strong>Preview Styling:</strong> Edit CSS to customize how the markdown appears in the preview. Selectors like <code style={{ fontFamily: 'monospace', fontSize: '11px', backgroundColor: 'var(--color-background-secondary)', padding: '2px 4px', borderRadius: '2px' }}>h1</code>, <code style={{ fontFamily: 'monospace', fontSize: '11px', backgroundColor: 'var(--color-background-secondary)', padding: '2px 4px', borderRadius: '2px' }}>p</code>, etc. are automatically scoped to the preview.
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: 'var(--color-background-secondary)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              fontSize: '12px',
            }}>
              <div style={{ marginBottom: '12px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                📍 Suggested Selectors:
              </div>

              {scannedSelectors.suggestions && (
                typeof scannedSelectors.suggestions === 'object' &&
                !Array.isArray(scannedSelectors.suggestions) &&
                (scannedSelectors.suggestions.structure?.length > 0 ||
                 scannedSelectors.suggestions.headings?.length > 0 ||
                 scannedSelectors.suggestions.text?.length > 0 ||
                 scannedSelectors.suggestions.code?.length > 0)
              ) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Structure Category */}
                  {scannedSelectors.suggestions.structure?.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        color: 'var(--color-text-secondary)',
                        marginBottom: '4px',
                      letterSpacing: '0.5px',
                    }}>
                      Structure
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {scannedSelectors.suggestions.structure.map((selector, idx) => {
                          const cleanedSelector = cleanSelector(selector)
                          return (
                          <button
                            key={`structure-${idx}`}
                            onClick={() => handleInsertSelector(cleanedSelector)}
                            title={`Click to insert "${cleanedSelector}" selector`}
                            style={{
                              padding: '4px 6px',
                              backgroundColor: 'rgba(76, 175, 80, 0.2)',
                              color: '#4caf50',
                              border: '1px solid rgba(76, 175, 80, 0.5)',
                              borderRadius: '3px',
                              fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.3)'
                              e.target.style.borderColor = 'rgba(76, 175, 80, 0.7)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(76, 175, 80, 0.2)'
                              e.target.style.borderColor = 'rgba(76, 175, 80, 0.5)'
                            }}
                          >
                            {cleanedSelector}
                          </button>
                        )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Headings Category */}
                  {scannedSelectors.suggestions.headings?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Headings
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {scannedSelectors.suggestions.headings.map((selector, idx) => {
                          const cleanedSelector = cleanSelector(selector)
                          return (
                          <button
                            key={`headings-${idx}`}
                            onClick={() => handleInsertSelector(cleanedSelector)}
                            title={`Click to insert "${cleanedSelector}" selector`}
                            style={{
                              padding: '4px 6px',
                              backgroundColor: 'rgba(33, 150, 243, 0.2)',
                              color: '#2196f3',
                              border: '1px solid rgba(33, 150, 243, 0.5)',
                              borderRadius: '3px',
                              fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.3)'
                              e.target.style.borderColor = 'rgba(33, 150, 243, 0.7)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(33, 150, 243, 0.2)'
                              e.target.style.borderColor = 'rgba(33, 150, 243, 0.5)'
                            }}
                          >
                            {cleanedSelector}
                          </button>
                        )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text Category */}
                  {scannedSelectors.suggestions.text?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Text
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {scannedSelectors.suggestions.text.map((selector, idx) => {
                          const cleanedSelector = cleanSelector(selector)
                          return (
                          <button
                            key={`text-${idx}`}
                            onClick={() => handleInsertSelector(cleanedSelector)}
                            title={`Click to insert "${cleanedSelector}" selector`}
                            style={{
                              padding: '4px 6px',
                              backgroundColor: 'rgba(156, 39, 176, 0.2)',
                              color: '#9c27b0',
                              border: '1px solid rgba(156, 39, 176, 0.5)',
                              borderRadius: '3px',
                              fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(156, 39, 176, 0.3)'
                              e.target.style.borderColor = 'rgba(156, 39, 176, 0.7)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(156, 39, 176, 0.2)'
                              e.target.style.borderColor = 'rgba(156, 39, 176, 0.5)'
                            }}
                          >
                            {cleanedSelector}
                          </button>
                        )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Code Category */}
                  {scannedSelectors.suggestions.code?.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      fontSize: '9px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: 'var(--color-text-secondary)',
                      letterSpacing: '0.5px',
                      minWidth: '60px',
                    }}>
                      Code
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {scannedSelectors.suggestions.code.map((selector, idx) => {
                          const cleanedSelector = cleanSelector(selector)
                          return (
                          <button
                            key={`code-${idx}`}
                            onClick={() => handleInsertSelector(cleanedSelector)}
                            title={`Click to insert "${cleanedSelector}" selector`}
                            style={{
                              padding: '4px 6px',
                              backgroundColor: 'rgba(255, 152, 0, 0.2)',
                              color: '#ff9800',
                              border: '1px solid rgba(255, 152, 0, 0.5)',
                              borderRadius: '3px',
                              fontSize: '10px',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = 'rgba(255, 152, 0, 0.3)'
                              e.target.style.borderColor = 'rgba(255, 152, 0, 0.7)'
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'rgba(255, 152, 0, 0.2)'
                              e.target.style.borderColor = 'rgba(255, 152, 0, 0.5)'
                            }}
                          >
                            {cleanedSelector}
                          </button>
                        )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', fontStyle: 'italic' }}>
                  No selectors detected yet
                </span>
              )}
            </div>

            <div style={{ flex: 1, minHeight: '200px', border: '1px solid var(--color-border)', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
              <CSSEditorInput
                value={markdownCustomCss}
                onChange={setMarkdownCustomCss}
                diagnostics={cssFormatterResult?.diagnostics || []}
              />
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.6',
              padding: '8px',
              backgroundColor: 'var(--color-background-secondary)',
              borderRadius: '4px',
            }}>
              <strong>Selectors like</strong> <code style={{ fontFamily: 'monospace', fontSize: '10px' }}>h1</code>, <code style={{ fontFamily: 'monospace', fontSize: '10px' }}>p</code>, <code style={{ fontFamily: 'monospace', fontSize: '10px' }}>a</code> <strong>are automatically scoped to the preview</strong>
            </div>
          </div>
        ),
        contentType: 'component',
      })
    }

    // Add JSON tab - shows input, output, and diagnostics only
    const mdJsonWithInputOutput = {
      input: inputText,
      output: displayResult.formatted,
      isWellFormed: displayResult.isWellFormed,
      diagnostics: displayResult.diagnostics || [],
      optionsApplied: {
        showValidation: displayResult.optionsApplied?.showValidation,
        showLinting: displayResult.optionsApplied?.showLinting,
      },
    }
    tabs.push({
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(mdJsonWithInputOutput, null, 2),
      contentType: 'code',
      language: 'json',
    })

    if (tabs.length === 0) return null

    return (
      <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
    )
  }

  const renderCssFormatterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null
    const tabs = []

    // Check if CSS is valid
    const isValid = displayResult.isWellFormed !== false
    const validationErrors = (displayResult.diagnostics && Array.isArray(displayResult.diagnostics))
      ? displayResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
      : []

    // Add primary output tab FIRST
    // If CSS is invalid, show validation errors instead of formatted output
    if (!isValid && validationErrors.length > 0) {
      tabs.push({
        id: 'formatted',
        label: 'OUTPUT',
        content: (
          <div>
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
              {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            {renderValidationErrorsUnified(validationErrors, 'CSS Validation Errors')}
          </div>
        ),
        contentType: 'component',
      })
    } else if (displayResult.formatted) {
      // Show formatted CSS if validation passed
      tabs.push({
        id: 'formatted',
        label: 'OUTPUT',
        content: displayResult.formatted,
        contentType: 'code',
      })
    } else if (displayResult.error) {
      // Show error message in OUTPUT tab if formatting failed
      tabs.push({
        id: 'formatted',
        label: 'OUTPUT',
        content: (
          <div style={{ padding: '16px' }}>
            <div style={{
              padding: '12px',
              backgroundColor: 'rgba(239, 83, 80, 0.1)',
              border: '1px solid rgba(239, 83, 80, 0.3)',
              borderRadius: '4px',
              color: '#ef5350',
              fontSize: '13px',
            }}>
              {displayResult.error}
            </div>
          </div>
        ),
        contentType: 'component',
      })
    }

    // Validation tab - show validation errors and status
    if (displayResult.showValidation !== false) {
      const validationErrors = (displayResult.diagnostics && Array.isArray(displayResult.diagnostics))
        ? displayResult.diagnostics.filter(d => d.type === 'error' && d.category === 'syntax')
        : []

      if (validationErrors.length > 0) {
        const validationContent = (
          <div>
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
              {validationErrors.length} Error{validationErrors.length !== 1 ? 's' : ''} Found
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
          label: 'Validation',
          content: (
            <div style={{
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                Valid CSS
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
          <div>
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

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} analysisData={displayResult.analysis} sourceText={inputText} showCopyButton={true} onApplyEdits={handleApplyCSSStagedEdits} showAnalysisTab={showAnalysisTab} onShowAnalysisTabChange={onShowAnalysisTabChange} showRulesTab={showRulesTab} onShowRulesTabChange={onShowRulesTabChange} isPreviewFullscreen={isPreviewFullscreen} onTogglePreviewFullscreen={onTogglePreviewFullscreen} />
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
        contentType: 'code',
      })
    }

    // Validation tab - show validation errors and status
    if (displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ padding: '0px' }}>
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
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
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
          <div>
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
        <div>
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

    // Add JSON tab - shows input, output, and diagnostics only
    const sqlJsonWithInputOutput = {
      input: inputText,
      output: displayResult.formatted,
      isWellFormed: displayResult.isWellFormed,
      diagnostics: displayResult.diagnostics || [],
      analysis: displayResult.analysis,
      optionsApplied: {
        language: displayResult.optionsApplied?.language,
        showLinting: displayResult.optionsApplied?.showLinting,
      },
    }
    tabs.push({
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(sqlJsonWithInputOutput, null, 2),
      contentType: 'code',
      language: 'json',
    })

    if (tabs.length === 0) return null

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderUnitConverterOutput = () => {
    if (!displayResult) return null

    // If there's no conversions, let the universal error handler take over
    // (displayResult.error will be handled at the end of this component)
    if (!displayResult.conversions) return null

    const conversions = displayResult.conversions.map(conv => ({
      label: conv.human || `${conv.value} ${conv.unit}`,
      value: conv.value,
      unit: conv.unit,
    }))

    if (conversions.length === 0) return null

    const friendlyView = ({ onCopyCard, copiedCardId }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayResult.normalizedInput && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#4caf50',
          }}>
            Detected input as {displayResult.normalizedInput.unit} ({displayResult.normalizedInput.human})
          </div>
        )}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            All Conversions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {conversions.map((conv, idx) => (
              <div key={idx} className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>{conv.label}</span>
                  <button
                    className="copy-action"
                    onClick={() => onCopyCard(conv.value.toString(), conv.label)}
                    title={`Copy ${conv.label}`}
                  >
                    {copiedCardId === conv.label ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{conv.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
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

  const renderFileSizeConverterOutput = () => {
    if (!displayResult) return null

    if (!displayResult.conversions) return null

    const unitNames = {
      'B': 'Bytes',
      'KB': 'Kilobytes',
      'MB': 'Megabytes',
      'GB': 'Gigabytes',
      'TB': 'Terabytes',
      'PB': 'Petabytes',
      'EB': 'Exabytes',
      'ZB': 'Zettabytes',
      'YB': 'Yottabytes',
    }

    const conversions = displayResult.conversions.map(conv => ({
      label: `${unitNames[conv.unit] || conv.unit} (${conv.unit})`,
      value: conv.value,
      unit: conv.unit,
    }))

    if (conversions.length === 0) return null

    const friendlyView = ({ onCopyCard, copiedCardId }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {displayResult.normalizedInput && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#4caf50',
          }}>
            Detected input as {displayResult.normalizedInput.unit} ({displayResult.normalizedInput.human})
          </div>
        )}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            All Conversions
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {conversions.map((conv, idx) => (
              <div key={idx} className={styles.copyCard}>
                <div className={styles.copyCardHeader}>
                  <span className={styles.copyCardLabel}>{conv.label}</span>
                  <button
                    className="copy-action"
                    onClick={() => onCopyCard(conv.value.toString(), conv.label)}
                    title={`Copy ${conv.label}`}
                  >
                    {copiedCardId === conv.label ? '✓' : <FaCopy />}
                  </button>
                </div>
                <div className={styles.copyCardValue}>{conv.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
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
        id: 'output',
        label: 'OUTPUT',
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
    if (!displayResult) return null

    const handleSecretChange = (secret) => {
      // Update the config with the new secret
      const newConfig = {
        ...configOptions,
        verificationSecret: secret,
      }
      setExpandedSection('formatted')

      // Notify parent to re-run the tool with the new secret
      if (onConfigChange) {
        onConfigChange(newConfig)
      }
    }

    const friendlyView = () => <JWTDecoderOutput result={displayResult} onSecretChange={handleSecretChange} />

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
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

  const renderMIMETypeLookupOutput = () => {
    if (!displayResult) return null

    const friendlyView = () => <MIMETypeLookupOutput result={displayResult} />

    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
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

    // Check for validation errors first
    let hasValidationErrors = false
    if (displayResult.showValidation && displayResult.diagnostics && Array.isArray(displayResult.diagnostics)) {
      const validationErrors = displayResult.diagnostics.filter(d => d.type === 'error')
      hasValidationErrors = validationErrors.length > 0
    }

    // Add primary output tab first - only show if validation passed AND no validation errors
    if (displayResult.formatted && !displayResult.hideOutput && !hasValidationErrors) {
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
          <div>
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
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
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
      const primaryErrors = validationErrors.filter(e => e.primary !== false) // Show primary and errors without flag
      const secondaryErrors = validationErrors.filter(e => e.secondary === true)

      if (validationErrors.length > 0) {
        const validationContent = (
          <div style={{ paddingLeft: '0px' }}>
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
              ✗ {primaryErrors.length} XML Error{primaryErrors.length !== 1 ? 's' : ''} Found
              {secondaryErrors.length > 0 && ` (+${secondaryErrors.length} related)`}
            </div>
            {renderValidationErrorsUnified(primaryErrors, 'Primary Errors')}

            {secondaryErrors.length > 0 && (
              <details style={{ marginTop: '16px' }}>
                <summary style={{
                  cursor: 'pointer',
                  padding: '12px',
                  backgroundColor: 'rgba(239, 83, 80, 0.05)',
                  border: '1px solid rgba(239, 83, 80, 0.15)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#ef5350',
                  userSelect: 'none',
                }}>
                  📋 Show related errors ({secondaryErrors.length})
                </summary>
                <div style={{ marginTop: '12px' }}>
                  {renderValidationErrorsUnified(secondaryErrors, 'Related Issues (may be caused by primary error above)')}
                </div>
              </details>
            )}
          </div>
        )

        tabs.push({
          id: 'validation',
          label: `Validation (${primaryErrors.length}${secondaryErrors.length > 0 ? `+${secondaryErrors.length}` : ''})`,
          content: validationContent,
          contentType: 'component',
        })
      } else {
        tabs.push({
          id: 'validation',
          label: 'Validation (✓)',
          content: (
            <div style={{
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
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
          <div style={{}}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lintingWarnings.map((warning, idx) => {
                const isDeclarationWarning = warning.warningType === 'missing-declaration'
                const canFixDeclaration = isDeclarationWarning && configOptions?.removeXMLDeclaration !== true
                return (
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
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                        Category: {warning.category}
                      </div>
                    )}
                    {isDeclarationWarning && (
                      <div style={{ marginTop: '8px' }}>
                        <button
                          onClick={() => {
                            const currentOutput = displayResult?.finalXml || displayResult?.formatted || ''
                            handleInsertXMLDeclaration(currentOutput)
                          }}
                          disabled={!canFixDeclaration}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: canFixDeclaration ? '#0066cc' : '#999',
                            color: 'white',
                            border: 'none',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontWeight: '500',
                            cursor: canFixDeclaration ? 'pointer' : 'not-allowed',
                            opacity: canFixDeclaration ? 1 : 0.6,
                          }}
                        >
                          {configOptions?.removeXMLDeclaration ? 'Cannot add (Remove Declaration is enabled)' : 'Add XML Declaration'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
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

    // Add JSON tab - shows input, output, and diagnostics only
    const xmlJsonWithInputOutput = {
      input: inputText,
      output: displayResult.formatted,
      isWellFormed: displayResult.isWellFormed,
      diagnostics: displayResult.diagnostics || [],
      lintWarnings: displayResult.lintWarnings || [],
      validation: displayResult.validation,
    }
    tabs.push({
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(xmlJsonWithInputOutput, null, 2),
      contentType: 'code',
      language: 'json',
    })

    if (tabs.length === 0) {
      return null
    }

    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
  }

  const renderSvgOptimizerOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') return null

    const tabs = []

    // Check if there are validation errors
    const hasValidationErrors = displayResult.validation && Array.isArray(displayResult.validation.errors)
      ? displayResult.validation.errors.length > 0
      : false

    // Output tab - only show if no validation errors
    if (displayResult.outputSvg && !hasValidationErrors) {
      tabs.push({
        id: 'output',
        label: 'Output',
        content: displayResult.outputSvg,
        contentType: 'code',
      })
    }

    // Validation tab
    if (displayResult.validation) {
      const validationErrors = displayResult.validation.errors || []
      const validationWarnings = displayResult.validation.warnings || []

      if (validationErrors.length > 0) {
        const validationContent = (
          <div>
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
              ✗ {validationErrors.length} SVG Error{validationErrors.length !== 1 ? 's' : ''} Found
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {validationErrors.map((error, idx) => (
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
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(102, 187, 106, 0.1)',
                border: '1px solid rgba(102, 187, 106, 0.3)',
                borderRadius: '4px',
                color: '#66bb6a',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✓ SVG is valid
              </div>
              {validationWarnings.length > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {validationWarnings.map((warning, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                        borderRadius: '4px',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ff9800' }}>
                        ⚠️ Warning
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>{warning}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ),
          contentType: 'component',
        })
      }
    }

    // Linting tab
    if (displayResult.linting) {
      // Support both old format (linting) and new format (lintingStages with input/output)
      const outputLinting = displayResult.lintingStages?.output || displayResult.linting
      const inputLinting = displayResult.lintingStages?.input

      const lintingWarnings = (outputLinting.warnings || []).filter(w => w.level === 'warning')
      const lintingHints = outputLinting.hints || []
      const totalLintIssues = lintingWarnings.length + lintingHints.length

      let lintingLabel = `Linting${totalLintIssues > 0 ? ` (${totalLintIssues})` : ' (✓)'}`
      let lintingContent = null

      if (!hasValidationErrors && totalLintIssues > 0) {
        lintingContent = (
          <div>
            {inputLinting && (
              <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📋 Input Analysis (before optimization)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  {(inputLinting.hints || []).length === 0 && (inputLinting.warnings || []).length === 0
                    ? 'No issues detected in input'
                    : `${(inputLinting.hints || []).length} hint(s), ${((inputLinting.warnings || []).filter(w => w.level === 'warning')).length} warning(s)`}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ✨ Output Analysis (after optimization)
              </div>
            </div>

            {lintingWarnings.length > 0 && (
              <>
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 152, 0, 0.1)',
                  border: '1px solid rgba(255, 152, 0, 0.3)',
                  borderRadius: '4px',
                  color: '#ff9800',
                  fontSize: '13px',
                  fontWeight: '500',
                }}>
                  ⚠️ {lintingWarnings.length} Warning{lintingWarnings.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {lintingWarnings.map((warning, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        border: '1px solid rgba(255, 152, 0, 0.2)',
                        borderRadius: '4px',
                        borderLeft: '3px solid #ff9800',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ff9800' }}>
                        {warning.message}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                        {warning.description}
                      </div>
                      {warning.category && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Category: {warning.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {lintingHints.length > 0 && (
              <>
                <div style={{
                  marginBottom: '12px',
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--color-text-primary)',
                }}>
                  ℹ️ {lintingHints.length} Suggestion{lintingHints.length !== 1 ? 's' : ''}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {lintingHints.map((hint, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: 'var(--color-background-tertiary)',
                        border: '1px solid rgba(33, 150, 243, 0.2)',
                        borderRadius: '4px',
                        borderLeft: '3px solid #2196f3',
                      }}
                    >
                      <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#2196f3' }}>
                        {hint.message}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-primary)' }}>
                        {hint.description}
                      </div>
                      {hint.category && (
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          Category: {hint.category}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )
      } else if (totalLintIssues === 0) {
        lintingContent = (
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
              ✓ No linting issues found
            </div>
          </div>
        )
      } else {
        lintingContent = (
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.3)',
            borderRadius: '4px',
            color: 'var(--color-text-secondary)',
            fontSize: '13px',
          }}>
            Linting disabled - validation errors must be fixed first
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

    // Analysis tab - show optimization stats
    if (displayResult.stats && !hasValidationErrors) {
      const statsContent = (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Optimization result */}
            {displayResult.optimizationResult && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: displayResult.optimizationResult === 'changes_applied' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                border: displayResult.optimizationResult === 'changes_applied' ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(33, 150, 243, 0.3)',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                color: displayResult.optimizationResult === 'changes_applied' ? '#4caf50' : '#2196f3'
              }}>
                {displayResult.optimizationResult === 'changes_applied' && '✓ Optimizations Applied'}
                {displayResult.optimizationResult === 'no_changes' && 'ℹ No Optimizations Needed'}
                {displayResult.optimizationResult === 'normalization_only' && 'ℹ Normalization Only'}
              </div>
            )}

            {/* Analysis context notes */}
            {displayResult.analysis && displayResult.analysis.context && displayResult.analysis.context.notes.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                  Why This Matters
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displayResult.analysis.context.notes.map((note, idx) => (
                    <div key={idx} style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      borderLeft: '3px solid #2196f3',
                      color: 'var(--color-text-primary)'
                    }}>
                      {note}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Phase 2 step results - show what happened */}
            {displayResult.phase2Level && displayResult.stepResults && displayResult.stepResults.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                  Optimization Steps ({displayResult.phase2Level})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {displayResult.stepResults.map((step, idx) => {
                    const bgColor = step.executed ? 'rgba(76, 175, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)'
                    const borderColor = step.executed ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)'
                    const textColor = step.executed ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'

                    return (
                      <div key={idx} style={{
                        padding: '10px 12px',
                        backgroundColor: bgColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: textColor
                      }}>
                        <div style={{ fontWeight: '600', marginBottom: step.executed || step.reason ? '4px' : '0' }}>
                          {step.executed ? '✓' : '○'} {step.step.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        {step.executed && step.message && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {step.message}
                          </div>
                        )}
                        {step.reason && (
                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                            {step.reason}
                          </div>
                        )}
                        {step.impact && (
                          <div style={{ fontSize: '11px', color: '#ff9800', marginTop: '4px' }}>
                            ⚠️ {step.impact}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size reduction stats */}
            {displayResult.stats && (
              <>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                    Size Reduction
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Original Size:</span>
                      <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{displayResult.stats.originalSize} bytes</span>
                    </div>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Optimized Size:</span>
                      <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>{displayResult.stats.optimizedSize} bytes</span>
                    </div>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      border: '1px solid rgba(76, 175, 80, 0.2)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: '#4caf50',
                      fontWeight: '600'
                    }}>
                      <span>Reduction:</span>
                      <span style={{ fontFamily: 'monospace' }}>{displayResult.stats.bytesRemoved} bytes ({displayResult.stats.reductionPercent}%)</span>
                    </div>
                  </div>
                </div>

                {/* Elements stats */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                    Elements
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Total Elements:</span>
                      <span style={{ fontWeight: '600' }}>{displayResult.stats.elements.total}</span>
                    </div>
                    {displayResult.stats.elements.removed > 0 && (
                      <div style={{
                        padding: '10px 12px',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#4caf50',
                        fontWeight: '600'
                      }}>
                        <span>Removed:</span>
                        <span>{displayResult.stats.elements.removed}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Attributes stats */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                    Attributes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--color-background-tertiary)',
                      borderRadius: '4px',
                      fontSize: '12px',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>Total Attributes:</span>
                      <span style={{ fontWeight: '600' }}>{displayResult.stats.attributes.total}</span>
                    </div>
                    {displayResult.stats.attributes.removed > 0 && (
                      <div style={{
                        padding: '10px 12px',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        borderRadius: '4px',
                        fontSize: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        color: '#4caf50',
                        fontWeight: '600'
                      }}>
                        <span>Removed:</span>
                        <span>{displayResult.stats.attributes.removed}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Precision info */}
                {displayResult.stats.precision.reduced && (
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
                      Numeric Precision
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {displayResult.stats.precision.originalDecimals && (
                        <div style={{
                          padding: '10px 12px',
                          backgroundColor: 'var(--color-background-tertiary)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'space-between'
                        }}>
                          <span>Original Decimals:</span>
                          <span style={{ fontWeight: '600' }}>{displayResult.stats.precision.originalDecimals}</span>
                        </div>
                      )}
                      {displayResult.stats.precision.optimizedDecimals && (
                        <div style={{
                          padding: '10px 12px',
                          backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          borderRadius: '4px',
                          fontSize: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#4caf50',
                          fontWeight: '600'
                        }}>
                          <span>Optimized Decimals:</span>
                          <span>{displayResult.stats.precision.optimizedDecimals}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )

      const rawReduction = displayResult?.stats?.reductionPercent
      const reductionLabel = (rawReduction !== undefined && rawReduction !== null && !Number.isNaN(Number(rawReduction)))
        ? ` (${Number(rawReduction).toFixed(1)}%)`
        : ''

      tabs.push({
        id: 'analysis',
        label: `Analysis${reductionLabel}`,
        content: statsContent,
        contentType: 'component',
      })
    }

    // JSON tab
    if (displayResult) {
      tabs.push({
        id: 'json',
        label: 'JSON',
        content: JSON.stringify(displayResult, null, 2),
        contentType: 'json',
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
    const fieldsToShow = getDisplayFields(toolId, displayResult, activeToolkitSection)
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

  const getDisplayFields = (toolId, result, section) => {
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


      case 'base64-converter':
        const base64Fields = []

        if (result.error) {
          base64Fields.push({ label: 'Error', value: result.error })
          if (result.suggestion) base64Fields.push({ label: 'Suggestion', value: result.suggestion })
        } else {
          base64Fields.push({ label: 'Mode', value: result.mode === 'encode' ? 'Encode' : 'Decode' })
          base64Fields.push({ label: 'Output', value: result.output, isMain: true })

          if (result.charEncoding) base64Fields.push({ label: 'Character Encoding', value: result.charEncoding.toUpperCase() })
          if (result.paddingStatus) base64Fields.push({ label: 'Padding Status', value: result.paddingStatus })
          if (result.warning) base64Fields.push({ label: 'Warning', value: result.warning })

          // Alternate formats
          if (result.formats) {
            if (result.formats.standard && result.mode === 'encode') {
              base64Fields.push({ label: 'Standard Base64', value: result.formats.standard })
            }
            if (result.formats.urlSafe && result.mode === 'encode') {
              base64Fields.push({ label: 'URL-Safe Version', value: result.formats.urlSafe })
            }
            if (result.formats.noPadding && result.mode === 'encode') {
              base64Fields.push({ label: 'Without Padding', value: result.formats.noPadding })
            }
            if (result.formats.wrapped && result.mode === 'encode') {
              base64Fields.push({ label: 'Line-Wrapped (MIME 76)', value: result.formats.wrapped })
            }
          }

          // Stats
          if (result.stats) {
            base64Fields.push({ label: 'Input Size', value: result.stats.inputSize })
            base64Fields.push({ label: 'Output Size', value: result.stats.outputSize })
            if (result.stats.compressionRatio) {
              base64Fields.push({ label: 'Compression Ratio', value: result.stats.compressionRatio })
            }
          }
        }

        return base64Fields.filter(f => f.value)

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

      case 'text-toolkit':
        // Text Analyzer
        if (section === 'textAnalyzer' && result.textAnalyzer && typeof result.textAnalyzer === 'object') {
          const analyzerFields = []
          if (result.textAnalyzer.readability) {
            analyzerFields.push({ label: 'Readability Level', value: result.textAnalyzer.readability.readabilityLevel })
            analyzerFields.push({ label: 'Flesch Reading Ease', value: String(result.textAnalyzer.readability.fleschReadingEase) })
            analyzerFields.push({ label: 'Flesch-Kincaid Grade', value: String(result.textAnalyzer.readability.fleschKincaidGrade) })
            analyzerFields.push({ label: 'Gunning Fog Index', value: String((result.textAnalyzer.statistics?.gunningFogIndex || 0).toFixed(1)) })
            analyzerFields.push({ label: 'SMOG Index', value: String((result.textAnalyzer.statistics?.smogIndex || 0).toFixed(1)) })
          }
          if (result.textAnalyzer.statistics) {
            analyzerFields.push({ label: 'Words', value: String(result.textAnalyzer.statistics.words) })
            analyzerFields.push({ label: 'Characters', value: String(result.textAnalyzer.statistics.characters) })
            analyzerFields.push({ label: 'Sentences', value: String(result.textAnalyzer.statistics.sentences) })
            analyzerFields.push({ label: 'Paragraphs', value: String(result.textAnalyzer.statistics.paragraphs || 0) })
            analyzerFields.push({ label: 'Avg Word Length', value: String((result.textAnalyzer.statistics.avgWordLength || 0).toFixed(2)) })
            analyzerFields.push({ label: 'Avg Words per Sentence', value: String((result.textAnalyzer.statistics.avgWordsPerSentence || 0).toFixed(2)) })
            analyzerFields.push({ label: 'Lexical Density', value: String((result.textAnalyzer.statistics.lexicalDensity || 0).toFixed(2)) + '%' })
            analyzerFields.push({ label: 'Stop Words %', value: String((result.textAnalyzer.statistics.stopWordsPercent || 0).toFixed(1)) + '%' })
            analyzerFields.push({ label: 'Est. Read Time', value: String(result.textAnalyzer.statistics.estimatedReadTimeMinutes || 0) + ' min' })
          }
          return analyzerFields.filter(f => f.value !== undefined && f.value !== null)
        }
        // All other sections render as text in OutputTabs, not structured fields
        return null

      case 'time-normalizer':
        if (result.error) return null
        const fields = []

        // Secondary context layer
        fields.push({ label: 'From', value: result.humanSummary?.from })
        fields.push({ label: 'To', value: result.humanSummary?.to })

        if (result.humanSummary?.difference !== undefined) {
          fields.push({ label: 'Time Difference', value: result.humanSummary.difference })
        }
        if (result.humanSummary?.dayShift) {
          fields.push({ label: 'Day Shift', value: result.humanSummary.dayShift })
        }

        // Tertiary technical details
        if (result.detectedFormat) {
          fields.push({ label: 'Detected Format', value: result.detectedFormat })
        }
        if (result.inputTimezone) {
          fields.push({ label: 'Input Timezone', value: result.inputTimezone })
        }
        if (result.inputReadable) {
          fields.push({ label: 'Input Time (Readable)', value: result.inputReadable })
        }
        if (result.inputTime) {
          fields.push({ label: 'Input Time (ISO)', value: result.inputTime })
        }
        if (result.inputOffset) {
          fields.push({ label: 'Input Offset', value: result.inputOffset })
        }
        if (result.convertedReadable) {
          fields.push({ label: 'Converted Time (Readable)', value: result.convertedReadable })
        }
        if (result.convertedTime) {
          fields.push({ label: 'Converted Time (ISO)', value: result.convertedTime })
        }
        if (result.outputTimezone) {
          fields.push({ label: 'Output Timezone', value: result.outputTimezone })
        }
        if (result.outputOffset) {
          fields.push({ label: 'Output Offset', value: result.outputOffset })
        }
        if (result.unixSeconds !== undefined) {
          fields.push({ label: 'Unix Timestamp (seconds)', value: String(result.unixSeconds) })
        }
        if (result.unixMillis !== undefined) {
          fields.push({ label: 'Unix Timestamp (milliseconds)', value: String(result.unixMillis) })
        }

        return fields.filter(f => f && f.value !== undefined && f.value !== null)

      default:
        return null
    }
  }

  const renderAsciiUnicodeOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: <div style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>No output</div>,
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult || {}, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    if (displayResult.error) {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: (
                <div style={{ padding: '16px', color: 'var(--color-error, #ff6b6b)' }}>
                  <strong>Error:</strong> {displayResult.error}
                </div>
              ),
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    const { fullOutput, breakdown, original, mode } = displayResult

    const hasResults = breakdown && breakdown.length > 0

    const outputContent = (
      <div className={styles.asciiOutputContainer}>
        {hasResults && (
          <div className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>
                {mode === 'toCode' ? 'Character Codes' : 'Converted Text'}
              </span>
              <button
                className="copy-action"
                onClick={() => handleCopyField(fullOutput, 'ascii-output')}
                title="Copy output"
              >
                {copiedField === 'ascii-output' ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue}>
              {fullOutput}
            </div>
          </div>
        )}

        {hasResults ? (
          <div className={styles.asciiTableContainer}>
            <table className={styles.asciiTable}>
              <thead>
                <tr>
                  <th className={styles.asciiTableHeader}>
                    {mode === 'toCode' ? 'Character' : 'Code'}
                  </th>
                  <th className={styles.asciiTableHeader}>
                    {mode === 'toCode' ? 'Code' : 'Character'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, idx) => (
                  <tr key={idx} className={styles.asciiTableRow}>
                    <td className={styles.asciiTableCell}>
                      {mode === 'toCode' ? item.char : item.code}
                    </td>
                    <td className={styles.asciiTableCell}>
                      {mode === 'toCode' ? item.code : item.char}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>
            {mode === 'toCode'
              ? 'Enter text to convert to character codes'
              : 'Enter space or comma-separated numbers (e.g., "72, 105, 33")'}
          </div>
        )}
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component'
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          }
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  const renderBase64ConverterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: <div style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>No output</div>,
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult || {}, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    if (displayResult.error) {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: (
                <div style={{ padding: '16px', color: 'var(--color-error, #ff6b6b)' }}>
                  <strong>Error:</strong> {displayResult.error}
                </div>
              ),
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    const { output, formats = {}, metadata = {} } = displayResult

    const outputContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Primary Output */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Primary Output
          </div>
          <div className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>Result</span>
              <button
                type="button"
                className="copy-action"
                onClick={() => handleCopyField(output, 'base64-primary')}
                title="Copy to clipboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  minWidth: '32px',
                  minHeight: '28px'
                }}
              >
                {copiedField === 'base64-primary' ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue} style={{ wordBreak: 'break-all' }}>
              {output}
            </div>
          </div>
        </div>

        {/* All Conversion Formats */}
        {Object.keys(formats).length > 0 && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              All Formats
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(formats).map(([formatName, formatValue]) => (
                <div key={formatName} className={styles.copyCard}>
                  <div className={styles.copyCardHeader}>
                    <span className={styles.copyCardLabel}>{formatName}</span>
                    <button
                      type="button"
                      className="copy-action"
                      onClick={() => handleCopyField(formatValue, `base64-format-${formatName}`)}
                      title="Copy to clipboard"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        minWidth: '32px',
                        minHeight: '28px'
                      }}
                    >
                      {copiedField === `base64-format-${formatName}` ? '✓' : <FaCopy />}
                    </button>
                  </div>
                  <div className={styles.copyCardValue} style={{ wordBreak: 'break-all', maxHeight: '150px', overflowY: 'auto' }}>
                    {formatValue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Summary */}
        {Object.keys(metadata).length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.2)',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Metadata</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              {Object.entries(metadata).map(([metaKey, metaValue]) => (
                <div key={metaKey}>
                  <strong>{metaKey}:</strong> {metaValue}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component'
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          }
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  const renderCaesarCipherOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: <div style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>No output</div>,
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult || {}, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    if (displayResult.error) {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: (
                <div style={{ padding: '16px', color: 'var(--color-error, #ff6b6b)' }}>
                  <strong>Error:</strong> {displayResult.error}
                </div>
              ),
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    const { output, input, bruteForce, metadata = {} } = displayResult

    const outputContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Primary Output */}
        <div>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: 'var(--color-text-secondary)',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid var(--color-border)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Result
          </div>
          <div className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>Output</span>
              <button
                type="button"
                className="copy-action"
                onClick={() => handleCopyField(output, 'caesar-output')}
                title="Copy to clipboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  minWidth: '32px',
                  minHeight: '28px'
                }}
              >
                {copiedField === 'caesar-output' ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {output}
            </div>
          </div>
        </div>

        {/* Brute Force - All 26 Shifts */}
        {bruteForce && Object.keys(bruteForce).length > 0 && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Brute Force (All 26 Shifts)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(bruteForce).map(([shiftNum, shiftResult]) => (
                <div key={shiftNum} className={styles.copyCard}>
                  <div className={styles.copyCardHeader}>
                    <span className={styles.copyCardLabel}>Shift {shiftNum}</span>
                    <button
                      type="button"
                      className="copy-action"
                      onClick={() => handleCopyField(shiftResult, `caesar-shift-${shiftNum}`)}
                      title="Copy to clipboard"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        minWidth: '32px',
                        minHeight: '28px'
                      }}
                    >
                      {copiedField === `caesar-shift-${shiftNum}` ? '✓' : <FaCopy />}
                    </button>
                  </div>
                  <div className={styles.copyCardValue} style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap', maxHeight: '120px', overflowY: 'auto' }}>
                    {shiftResult}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Summary */}
        {Object.keys(metadata).length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.2)',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Metadata</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              {Object.entries(metadata).map(([metaKey, metaValue]) => (
                <div key={metaKey}>
                  <strong>{metaKey}:</strong> {metaValue}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component'
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          }
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  const renderCronTesterOutput = () => {
    if (!displayResult || typeof displayResult !== 'object') {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: <div style={{ padding: '16px', color: 'var(--color-text-secondary)' }}>No output</div>,
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult || {}, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    if (displayResult.error) {
      return (
        <OutputTabs
          key={toolId}
          tabs={[
            {
              id: 'output',
              label: 'OUTPUT',
              content: (
                <div style={{ padding: '16px', color: 'var(--color-error, #ff6b6b)' }}>
                  <strong>Error:</strong> {displayResult.error}
                </div>
              ),
              contentType: 'component'
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult, null, 2),
              contentType: 'json'
            }
          ]}
          toolCategory={toolCategory}
          toolId={toolId}
          showCopyButton={true}
        />
      )
    }

    const { cronExpression, humanReadable, nextRuns = [], metadata = {}, valid, timezone } = displayResult

    const outputContent = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Validation Status */}
        {valid !== undefined && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: valid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
            border: `1px solid ${valid ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
            borderRadius: '4px',
            color: valid ? 'var(--color-success, #4caf50)' : 'var(--color-error, #f44336)',
            fontWeight: '600',
            fontSize: '13px',
          }}>
            {valid ? '✓ Valid Cron Expression' : '✗ Invalid Cron Expression'}
          </div>
        )}

        {/* Human-Readable Description */}
        {humanReadable && (
          <div className={styles.copyCard}>
            <div className={styles.copyCardHeader}>
              <span className={styles.copyCardLabel}>Description</span>
              <button
                type="button"
                className="copy-action"
                onClick={() => handleCopyField(humanReadable, 'cron-description')}
                title="Copy to clipboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  minWidth: '32px',
                  minHeight: '28px'
                }}
              >
                {copiedField === 'cron-description' ? '✓' : <FaCopy />}
              </button>
            </div>
            <div className={styles.copyCardValue} style={{ wordBreak: 'break-word' }}>
              {humanReadable}
            </div>
          </div>
        )}

        {/* Next Scheduled Runs */}
        {nextRuns && nextRuns.length > 0 && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-secondary)',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--color-border)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Next {nextRuns.length} Runs {timezone && `(${timezone})`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {nextRuns.map((run, idx) => (
                <div key={idx} style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--color-background-secondary, #f9f9f9)',
                  border: '1px solid var(--color-border, #ddd)',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}>
                  <div style={{ fontWeight: '600', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                    Run {idx + 1}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)', fontFamily: 'Courier New, monospace' }}>
                    {run.formatted}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleLoadMoreCronRuns}
              style={{
                marginTop: '12px',
                padding: '10px 16px',
                backgroundColor: '#0066cc',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#0052a3'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#0066cc'}
            >
              Load 10 More Runs
            </button>
          </div>
        )}

        {/* Metadata */}
        {Object.keys(metadata).length > 0 && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(158, 158, 158, 0.1)',
            border: '1px solid rgba(158, 158, 158, 0.2)',
            borderRadius: '4px',
            fontSize: '13px',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Metadata</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
              {Object.entries(metadata).map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )

    return (
      <OutputTabs
        key={toolId}
        tabs={[
          {
            id: 'output',
            label: 'OUTPUT',
            content: outputContent,
            contentType: 'component'
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          }
        ]}
        toolCategory={toolCategory}
        toolId={toolId}
        showCopyButton={true}
      />
    )
  }

  // Router for output rendering
  const renderOutput = () => {
    switch (toolId) {
      case 'image-toolkit': {
        if (displayResult?.mode === 'resize' && displayResult?.imageData) {
          const handleUpdateResultWithUrl = (transformUrl) => {
            setEnhancedResult({
              ...displayResult,
              transformUrl: transformUrl,
            })
          }

          const tabs = [
            {
              id: 'output',
              label: 'OUTPUT',
              content: <ResizeOutput result={displayResult} configOptions={configOptions} onConfigChange={onConfigChange} onUpdateUrl={handleUpdateResultWithUrl} />,
              contentType: 'component',
            },
            {
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(enhancedResult || displayResult, null, 2),
              contentType: 'json',
            },
          ]
          return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={true} />
        }
        // If no valid result, show waiting message
        const blankTabs = [
          {
            id: 'output',
            label: 'OUTPUT',
            content: 'Waiting for image upload and processing...',
            contentType: 'text',
          },
          {
            id: 'json',
            label: 'JSON',
            content: displayResult ? JSON.stringify(displayResult, null, 2) : '',
            contentType: 'json',
          },
        ]
        return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={blankTabs} showCopyButton={false} />
      }

      case 'text-toolkit': {
        const tabs = []

        if (activeToolkitSection === 'textAnalyzer' && displayResult?.textAnalyzer) {
          // Text Analyzer - show comprehensive metrics in table layout
          const analyzerData = displayResult.textAnalyzer

          // Define tiers with metrics
          const stats = analyzerData.statistics
          const readable = analyzerData.readability

          const tiers = [
            {
              id: 'tier1',
              metrics: [
                { label: 'Words', value: stats.words },
                { label: 'Characters', value: stats.characters },
                { label: 'Characters (no spaces)', value: stats.charactersNoSpaces },
                { label: 'Sentences', value: stats.sentences },
                { label: 'Paragraphs', value: stats.paragraphs },
                { label: 'Estimated read time', value: `${stats.estimatedReadTimeMinutes} min` },
                { label: 'Readability level', value: readable.readabilityLevel },
                { label: 'Flesch Reading Ease', value: readable.fleschReadingEase },
                { label: 'Flesch-Kincaid Grade', value: readable.fleschKincaidGrade },
              ]
            },
            {
              id: 'tier2',
              metrics: [
                { label: 'Average words per sentence', value: (stats.avgWordsPerSentence || 0).toFixed(2) },
                { label: 'Average word length', value: (stats.avgWordLength || 0).toFixed(2) },
                { label: 'Average syllables per word', value: (stats.avgSyllablesPerWord || 0).toFixed(2) },
                { label: 'Longest sentence', value: `${stats.longestSentenceLength} words`, expandable: true, expandContent: stats.longestSentence ? (<div><strong>Text:</strong><pre style={{ margin: '8px 0', padding: '8px', backgroundColor: 'var(--color-background-tertiary)', borderRadius: '4px', fontSize: '11px', maxHeight: '200px', overflow: 'auto' }}>{stats.longestSentence.substring(0, 500)}{stats.longestSentence.length > 500 ? '...' : ''}</pre></div>) : null },
                { label: 'Shortest sentence', value: `${stats.shortestSentenceLength} words`, expandable: true, expandContent: stats.shortestSentence ? (<div><strong>Text:</strong><pre style={{ margin: '8px 0', padding: '8px', backgroundColor: 'var(--color-background-tertiary)', borderRadius: '4px', fontSize: '11px' }}>{stats.shortestSentence}</pre></div>) : null },
                { label: 'Median sentence length', value: `${stats.medianSentenceLength} words` },
              ]
            },
            {
              id: 'tier3',
              metrics: [
                { label: 'Unique word count', value: stats.uniqueWordsFreq?.length || 0 },
                { label: 'Type-token ratio', value: (stats.typeTokenRatio || 0).toFixed(4) },
                { label: 'Lexical density', value: `${(stats.lexicalDensity || 0).toFixed(2)}%` },
                { label: 'Content density', value: `${(stats.contentDensity || 0).toFixed(2)}%` },
                { label: 'Stop words %', value: `${(stats.stopWordsPercent || 0).toFixed(1)}%` },
                { label: 'Stop words count', value: `${stats.stopWordsCount} (${(stats.stopWordsPercent || 0).toFixed(1)}%)`, expandable: true, expandContent: stats.stopWordsList && stats.stopWordsList.length > 0 ? (<div><strong>Examples:</strong><div style={{ marginTop: '8px', fontSize: '12px', lineHeight: '1.5' }}>{stats.stopWordsList.slice(0, 20).join(', ')}{stats.stopWordsList.length > 20 ? '...' : ''}</div></div>) : null },
              ]
            },
            {
              id: 'tier4',
              metrics: [
                { label: 'Gunning Fog Index', value: (stats.gunningFogIndex || 0).toFixed(1) },
                { label: 'SMOG Index', value: (stats.smogIndex || 0).toFixed(1) },
                { label: 'Coleman-Liau Index', value: (stats.colemanLiauIndex || 0).toFixed(1) },
                { label: 'Automated Readability Index', value: (stats.automatedReadabilityIndex || 0).toFixed(1) },
              ]
            },
            {
              id: 'tier5',
              metrics: [
                { label: 'Longest word', value: stats.longestWord || 'N/A' },
                { label: 'Shortest word', value: stats.shortestWord || 'N/A' },
                { label: 'Min word length', value: stats.minWordLength },
                { label: 'Max word length', value: stats.maxWordLength },
                { label: 'Median word length', value: stats.medianWordLength },
              ]
            },
            {
              id: 'tier6',
              metrics: [
                { label: 'Top keywords', value: `${stats.topKeywords?.length || 0} keywords`, expandable: true, expandContent: stats.topKeywords && stats.topKeywords.length > 0 ? (<table className={styles.frequencyTable}><thead><tr><th>Keyword</th><th style={{ textAlign: 'right' }}>Count</th><th style={{ textAlign: 'right' }}>%</th></tr></thead><tbody>{stats.topKeywords.map((item, i) => (<tr key={i}><td className={styles.frequencyTableWord}>{item.word}</td><td className={styles.frequencyTableCount}>{item.count || 0}</td><td className={styles.frequencyTablePercent}>{(item.percent || 0).toFixed(1)}%</td></tr>))}</tbody></table>) : null },
                { label: 'Unique words frequency', value: `${stats.uniqueWordsFreq?.length || 0} unique`, expandable: true, expandContent: stats.uniqueWordsFreq && stats.uniqueWordsFreq.length > 0 ? (<table className={styles.frequencyTable}><thead><tr><th>Word</th><th style={{ textAlign: 'right' }}>Count</th><th style={{ textAlign: 'right' }}>%</th></tr></thead><tbody>{stats.uniqueWordsFreq.slice(0, 15).map((item, i) => { const count = item.count || 0; const percent = stats.words ? ((count / stats.words) * 100).toFixed(1) : '0'; return (<tr key={i}><td className={styles.frequencyTableWord}>{item.word}</td><td className={styles.frequencyTableCount}>{count}</td><td className={styles.frequencyTablePercent}>{percent}%</td></tr>); })}</tbody></table>) : null },
              ]
            },
            {
              id: 'tier7',
              metrics: [
                { label: 'Uppercase count', value: stats.uppercase },
                { label: 'Lowercase count', value: stats.lowercase },
                { label: 'Digits', value: stats.digits },
                { label: 'Punctuation', value: stats.punctuation },
                { label: 'Whitespace', value: stats.whitespace, expandable: true, expandContent: (<div><strong>Whitespace Visualization:</strong><div className={styles.whitespaceVisualization}>{stats.whitespaceSafeText || 'No whitespace'}</div><div style={{ marginTop: '12px' }}><strong>Whitespace Breakdown:</strong><div style={{ marginTop: '8px', fontSize: '12px' }}>• Spaces: {stats.spaceCount || 0}<br />• Tabs: {stats.tabCount || 0}<br />• Newlines: {stats.newlineCount || 0}</div></div></div>) },
                { label: 'Spaces', value: stats.spaceCount || 0 },
                { label: 'Tabs', value: stats.tabCount || 0 },
                { label: 'Newlines', value: stats.newlineCount || 0 },
              ]
            },
          ]

          // Filter tiers based on search
          const filteredTiers = tiers.map(tier => ({
            ...tier,
            metrics: tier.metrics.filter(m => m.label.toLowerCase().includes(analyzerSearchQuery.toLowerCase()))
          })).filter(t => t.metrics.length > 0)

          const MetricRow = ({ metric }) => (
            <div className={styles.analyzerMetricRow}>
              <div
                className={styles.analyzerMetricHeader}
                onClick={() => metric.expandable && setExpandedMetric(expandedMetric === metric.label ? null : metric.label)}
                style={{ cursor: metric.expandable ? 'pointer' : 'default' }}
              >
                <div className={styles.analyzerMetricLabel}>{metric.label.toLowerCase()} - {metric.value}</div>
                {metric.expandable && (
                  <div className={styles.analyzerMetricExpander}>
                    {expandedMetric === metric.label ? '▼' : '▶'}
                  </div>
                )}
              </div>
              {metric.expandable && expandedMetric === metric.label && metric.expandContent && (
                <div className={styles.analyzerMetricDetail}>
                  {metric.expandContent}
                </div>
              )}
            </div>
          )

          const analyzerViewContent = (
            <div className={styles.analyzerTableContainer}>
              <div className={styles.analyzerSearchContainer}>
                <input
                  type="text"
                  placeholder="Search metrics..."
                  value={analyzerSearchQuery}
                  onChange={(e) => setAnalyzerSearchQuery(e.target.value)}
                  className={styles.analyzerSearchInput}
                />
              </div>

              {filteredTiers.length > 0 ? (
                filteredTiers.map(tier => (
                  <div key={tier.id}>
                    {tier.metrics.map((metric, idx) => (
                      <MetricRow key={idx} metric={metric} />
                    ))}
                  </div>
                ))
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                  No metrics match your search
                </div>
              )}
            </div>
          )
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: analyzerViewContent,
            contentType: 'component'
          })
          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult.textAnalyzer, null, 2),
            contentType: 'json'
          })
        } else if (activeToolkitSection === 'caseConverter' && displayResult?.caseConverter) {
          // Case Converter - show friendly view, plus JSON
          const caseConverterData = displayResult.caseConverter

          const handleCaseConverterCopy = (key, value) => {
            navigator.clipboard.writeText(value).catch((err) => {
              // Fallback for older browsers
              const textarea = document.createElement('textarea')
              textarea.value = value
              textarea.style.position = 'fixed'
              textarea.style.opacity = '0'
              document.body.appendChild(textarea)
              textarea.select()
              try {
                document.execCommand('copy')
              } catch (e) {
                console.error('Copy failed:', e)
              }
              document.body.removeChild(textarea)
            })
            setCaseConverterCopied(prev => ({ ...prev, [key]: true }))
            setTimeout(() => {
              setCaseConverterCopied(prev => ({ ...prev, [key]: false }))
            }, 2000)
          }

          const CaseConverterCopyCard = ({ label, value }) => (
            <div className={styles.copyCard}>
              <div className={styles.copyCardHeader}>
                <span className={styles.copyCardLabel}>{label}</span>
                <button
                  type="button"
                  className="copy-action"
                  onClick={() => handleCaseConverterCopy(label, value)}
                  title="Copy to clipboard"
                >
                  {caseConverterCopied[label] ? <FaCheck /> : <FaCopy />}
                </button>
              </div>
              <div className={styles.copyCardValue}>{value}</div>
            </div>
          )

          const friendlyViewContent = (
            <div className={styles.caseConverterView}>
              {caseConverterData.uppercase && (
                <CaseConverterCopyCard label="Uppercase" value={caseConverterData.uppercase} />
              )}
              {caseConverterData.lowercase && (
                <CaseConverterCopyCard label="Lowercase" value={caseConverterData.lowercase} />
              )}
              {caseConverterData.titleCase && (
                <CaseConverterCopyCard label="Title Case" value={caseConverterData.titleCase} />
              )}
              {caseConverterData.sentenceCase && (
                <CaseConverterCopyCard label="Sentence Case" value={caseConverterData.sentenceCase} />
              )}
            </div>
          )
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: friendlyViewContent,
            contentType: 'component'
          })
          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult.caseConverter, null, 2),
            contentType: 'json'
          })
        } else if (activeToolkitSection === 'textDiff' && displayResult?.textDiff) {
          // Diff Checker - show friendly view with differences highlighted, plus JSON
          const diffData = displayResult.textDiff

          const DiffRow = ({ lineNum, text1, text2, isIdentical }) => {
            const hasDifference = text1 !== text2
            return (
              <div className={styles.diffRow} style={{ backgroundColor: hasDifference ? 'rgba(239, 83, 80, 0.08)' : 'transparent' }}>
                <div className={styles.diffLineNum}>{lineNum}</div>
                <div className={styles.diffColumn}>
                  <div className={styles.diffColumnLabel}>Input A</div>
                  <div className={styles.diffColumnContent} style={{ color: hasDifference ? '#ef5350' : 'inherit' }}>{text1}</div>
                </div>
                <div className={styles.diffColumn}>
                  <div className={styles.diffColumnLabel}>Input B</div>
                  <div className={styles.diffColumnContent} style={{ color: hasDifference ? '#ef5350' : 'inherit' }}>{text2}</div>
                </div>
              </div>
            )
          }

          const friendlyViewContent = (
            <div className={styles.diffCheckerView}>
              <div className={styles.diffSummary}>
                <div className={styles.diffSummaryItem}>
                  <span className={styles.diffSummaryLabel}>Input A Lines:</span>
                  <span className={styles.diffSummaryValue}>{diffData.text1Lines}</span>
                </div>
                <div className={styles.diffSummaryItem}>
                  <span className={styles.diffSummaryLabel}>Input B Lines:</span>
                  <span className={styles.diffSummaryValue}>{diffData.text2Lines}</span>
                </div>
                <div className={styles.diffSummaryItem}>
                  <span className={styles.diffSummaryLabel}>Status:</span>
                  <span className={styles.diffSummaryValue} style={{ color: diffData.identical ? '#4caf50' : '#ef5350', fontWeight: 600 }}>
                    {diffData.identical ? '✓ Identical' : `${diffData.differences.length} Difference${diffData.differences.length !== 1 ? 's' : ''}`}
                  </span>
                </div>
              </div>
              {!diffData.identical && diffData.differences.length > 0 && (
                <div className={styles.diffTable}>
                  {diffData.differences.map((diff, idx) => (
                    <DiffRow key={idx} lineNum={diff.line} text1={diff.text1} text2={diff.text2} />
                  ))}
                </div>
              )}
            </div>
          )

          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: friendlyViewContent,
            contentType: 'component'
          })
          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult.textDiff, null, 2),
            contentType: 'json'
          })
        } else {
          // Text-based toolkit sections
          const textContent = displayResult?.[activeToolkitSection]
          if (textContent && typeof textContent === 'string') {
            tabs.push({
              id: 'output',
              label: 'OUTPUT',
              content: textContent,
              contentType: 'text'
            })
            // Add JSON tab for slug generator, reverse text, and clean text
            if (['slugGenerator', 'reverseText', 'removeExtras', 'sortLines', 'delimiterTransformer'].includes(activeToolkitSection)) {
              tabs.push({
                id: 'json',
                label: 'JSON',
                content: JSON.stringify({ result: textContent }, null, 2),
                contentType: 'json'
              })
            }
          } else {
            // Fallback for non-string content
            tabs.push({
              id: 'output',
              label: 'OUTPUT',
              content: typeof textContent === 'object' ? JSON.stringify(textContent, null, 2) : String(textContent),
              contentType: 'text'
            })
          }
        }

        return (
          <OutputTabs
            key={toolId}
            toolCategory={toolCategory}
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }
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
      case 'svg-optimizer':
        return renderSvgOptimizerOutput()
      case 'math-evaluator': {
        if (!displayResult || typeof displayResult !== 'object') {
          return (
            <OutputTabs
              key={toolId}
              toolCategory={toolCategory}
              toolId={toolId}
              tabs={[{
                id: 'output',
                label: 'OUTPUT',
                content: displayResult?.error || 'No output',
                contentType: 'text'
              }]}
            />
          )
        }

        const tabs = [
          {
            id: 'output',
            label: 'OUTPUT',
            content: <MathEvaluatorResult result={displayResult} expression={inputText || ''} />,
            contentType: 'component'
          },
          {
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          }
        ]

        return (
          <OutputTabs
            key={toolId}
            toolCategory={toolCategory}
            toolId={toolId}
            tabs={tabs}
            showCopyButton={true}
          />
        )
      }
      case 'jwt-decoder':
        return renderJwtDecoderOutput()
      case 'mime-type-lookup':
        return renderMIMETypeLookupOutput()
      case 'json-formatter':
        return renderJsonFormatterOutput()
      case 'xml-formatter':
        return renderXmlFormatterOutput()
      case 'yaml-formatter':
        return renderYamlFormatterOutput()
      case 'unit-converter':
        return renderUnitConverterOutput()
      case 'file-size-converter':
        return renderFileSizeConverterOutput()
      case 'ascii-unicode-converter':
        return renderAsciiUnicodeOutput()
      case 'base64-converter':
        return renderBase64ConverterOutput()
      case 'caesar-cipher':
        return renderCaesarCipherOutput()
      case 'cron-tester':
        return renderCronTesterOutput()
      case 'csv-json-converter': {
        // CSV to JSON/SQL/JS/TS output - show format-specific tab only
        const tabs = []

        // Always add warnings tab (matching validation tab pattern from JS formatter)
        const warningCount = warnings ? warnings.length : 0
        if (warningCount > 0) {
          const warningContent = (
            <div style={{ padding: '16px' }}>
              <div style={{
                marginBottom: '16px',
                padding: '12px',
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: '4px',
                color: '#ff9800',
                fontSize: '13px',
                fontWeight: '500',
              }}>
                ✗ {warningCount} Warning{warningCount !== 1 ? 's' : ''} Found
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {warnings.map((warning, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    backgroundColor: 'var(--color-background-tertiary)',
                    border: '1px solid rgba(255, 152, 0, 0.2)',
                    borderRadius: '4px',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: '#ff9800' }}>
                      {warning.message}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      {warning.description}
                    </div>
                    {warning.row !== undefined && (
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        Location: Row {warning.row + 1}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )

          tabs.push({
            id: 'warnings',
            label: `Warnings (${warningCount})`,
            content: warningContent,
            contentType: 'component',
          })
        } else {
          // Show success state when no warnings
          tabs.push({
            id: 'warnings',
            label: 'Warnings (✓)',
            content: (
              <div style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
              }}>
                <div style={{
                  padding: '16px',
                  backgroundColor: 'rgba(102, 187, 106, 0.1)',
                  border: '1px solid rgba(102, 187, 106, 0.3)',
                  borderRadius: '4px',
                  color: '#66bb6a',
                  fontSize: '13px',
                  fontWeight: '500',
                }}>
                  ✓ No warnings found
                </div>
              </div>
            ),
            contentType: 'component',
          })
        }

        if (typeof displayResult === 'string') {
          // Determine content type and label based on the output format
          // Use 'code' instead of 'json' to prevent OutputTabs from auto-inserting a friendly tab
          let contentType = 'code'
          let language = 'text'
          let tabLabel = 'OUTPUT'

          // Try to detect format from content
          if (displayResult.trim().startsWith('[') || displayResult.trim().startsWith('{')) {
            if (displayResult.includes('\n')) {
              language = 'json'
              tabLabel = 'JSON'
            } else {
              language = 'json'
              tabLabel = 'JSONL'
            }
          } else if (displayResult.trim().startsWith('INSERT INTO')) {
            language = 'sql'
            tabLabel = 'SQL'
          } else if (displayResult.trim().startsWith('export')) {
            language = displayResult.includes('Record<string, any>') ? 'typescript' : 'javascript'
            tabLabel = language === 'typescript' ? 'TypeScript' : 'JavaScript'
          } else {
            contentType = 'text'
          }

          tabs.push({
            id: 'output',
            label: tabLabel,
            content: displayResult,
            contentType: contentType,
            language: language
          })
        } else {
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: String(displayResult),
            contentType: 'text'
          })
        }

        return (
          <OutputTabs
            toolCategory={toolCategory}
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }

      case 'regex-tester': {
        const tabs = []
        const patternName = configOptions?._patternName || 'Pattern'
        const patternDescription = configOptions?._patternDescription || ''

        tabs.push({
          id: 'output',
          label: 'OUTPUT',
          content: displayResult ? (
            <RegexTesterOutput result={displayResult} inputText={inputText} patternName={patternName} patternDescription={patternDescription} />
          ) : 'No output',
          contentType: 'component'
        })

        if (displayResult?.matches) {
          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify({
              pattern: displayResult.pattern,
              flags: displayResult.flags,
              matchCount: displayResult.matchCount,
              matches: displayResult.matches,
              replacement: displayResult.replacement
            }, null, 2),
            contentType: 'json'
          })
        }

        return (
          <OutputTabs
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }

      case 'uuid-validator': {
        const mode = configOptions?.mode || 'validate'

        // Generation modes
        if (mode.startsWith('generate-')) {
          const tabs = []
          const generated = displayResult?.generated

          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: generated ? (
              <UUIDValidatorGeneratedOutput result={displayResult} />
            ) : 'No output',
            contentType: 'component'
          })

          if (generated) {
            tabs.push({
              id: 'json',
              label: 'JSON',
              content: JSON.stringify({ generated, version: displayResult.version }, null, 2),
              contentType: 'json'
            })
          }

          return (
            <OutputTabs
              toolId={toolId}
              tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
              showCopyButton={true}
            />
          )
        }

        // Bulk validation mode
        if (mode === 'bulk-validate') {
          const tabs = []
          const results = displayResult?.results

          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: results ? (
              <UUIDValidatorBulkOutput result={displayResult} />
            ) : 'No output',
            contentType: 'component'
          })

          if (results) {
            tabs.push({
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(results, null, 2),
              contentType: 'json'
            })
          }

          return (
            <OutputTabs
              toolId={toolId}
              tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
              showCopyButton={true}
            />
          )
        }

        // Standard validation mode
        const tabs = []
        tabs.push({
          id: 'output',
          label: 'OUTPUT',
          content: <UUIDValidatorOutput result={displayResult} />,
          contentType: 'component'
        })

        if (displayResult) {
          const jsonOutput = {
            input: displayResult.input,
            inputFormat: displayResult.inputFormat,
            valid: displayResult.valid,
            normalized: displayResult.normalized,
            wasNormalized: displayResult.wasNormalized,
          };

          if (displayResult.valid) {
            Object.assign(jsonOutput, {
              version: displayResult.version,
              versionName: displayResult.versionName,
              variant: displayResult.variant,
              type: displayResult.type,
              hex: displayResult.hex,
              base64: displayResult.base64,
              urn: displayResult.urn,
              ...(displayResult.bits && { bits: displayResult.bits }),
              ...(displayResult.timestamp && { timestamp: displayResult.timestamp }),
            });
          }

          Object.assign(jsonOutput, {
            summary: displayResult.summary,
            errors: displayResult.errors || [],
          });

          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(jsonOutput, null, 2),
            contentType: 'json'
          });
        }

        return (
          <OutputTabs
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }

      case 'http-status-lookup': {
        const tabs = []
        tabs.push({
          id: 'output',
          label: 'OUTPUT',
          content: <HTTPStatusLookupOutput result={displayResult} configOptions={configOptions} />,
          contentType: 'component'
        })

        if (displayResult) {
          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          })
        }

        return (
          <OutputTabs
            key={toolId}
            toolCategory={toolCategory}
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }

      case 'http-header-parser': {
        const handleStrictModeToggle = () => {
          if (onConfigChange) {
            onConfigChange({
              ...configOptions,
              strictMode: !configOptions.strictMode
            })
          }
        }

        const tabs = []
        tabs.push({
          id: 'output',
          label: 'OUTPUT',
          content: <HttpHeaderParserOutput result={displayResult} onStrictModeToggle={handleStrictModeToggle} />,
          contentType: 'component'
        })

        if (displayResult && !displayResult.error) {
          tabs.push({
            id: 'json',
            label: 'JSON',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          })
        }

        return (
          <OutputTabs
            key={toolId}
            toolCategory={toolCategory}
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }

      default: {
        const tabs = []

        // Try to render structured fields first (for tools like text-analyzer)
        const structuredFields = renderStructuredOutput()
        if (structuredFields) {
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: structuredFields,
            contentType: 'component'
          })
          // Add JSON tab for object results
          if (typeof displayResult === 'object' && displayResult !== null) {
            tabs.push({
              id: 'json',
              label: 'JSON',
              content: JSON.stringify(displayResult, null, 2),
              contentType: 'json'
            })
          }
        } else if (typeof displayResult === 'string') {
          // String output
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: displayResult,
            contentType: 'text'
          })
        } else if (typeof displayResult === 'object' && displayResult !== null) {
          // Object output - show as JSON
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: JSON.stringify(displayResult, null, 2),
            contentType: 'json'
          })
        } else {
          // Fallback
          tabs.push({
            id: 'output',
            label: 'OUTPUT',
            content: String(displayResult),
            contentType: 'text'
          })
        }

        return (
          <OutputTabs
            key={toolId}
            toolCategory={toolCategory}
            toolId={toolId}
            tabs={tabs.length > 0 ? tabs : [{ id: 'output', label: 'OUTPUT', content: 'No output', contentType: 'text' }]}
            showCopyButton={true}
          />
        )
      }
    }
  }

  // Universal error handler for all tools - check after all hooks have been called
  if (displayResult?.error) {
    // Special error handling for time-normalizer with format hints
    if (toolId === 'time-normalizer' && displayResult.acceptedFormats) {
      const errorContent = (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Error Message */}
          <div style={{
            padding: '16px',
            backgroundColor: 'rgba(239, 83, 80, 0.1)',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: '4px',
            color: '#ef5350',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>Parse Error</div>
            <div style={{ fontSize: '14px', lineHeight: '1.5' }}>{displayResult.error}</div>
          </div>

          {/* Examples Section */}
          {displayResult.examples && displayResult.examples.length > 0 && (
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text-secondary)',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Quick Examples
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
                {displayResult.examples.map((example, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--color-background-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>
                      {example.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '6px', fontFamily: 'monospace', padding: '6px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '3px' }}>
                      {example.value}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      {example.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Formats Section */}
          {displayResult.acceptedFormats && (
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--color-text-secondary)',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--color-border)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Accepted Formats
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                {Object.entries(displayResult.acceptedFormats).map(([category, formats]) => (
                  <div key={category}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--color-text)',
                      marginBottom: '8px',
                      textTransform: 'capitalize',
                    }}>
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </div>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}>
                      {formats.map((format, idx) => (
                        <li key={idx} style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>
                          {format}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )

      const tabs = [
        {
          id: 'output',
          label: 'OUTPUT',
          content: errorContent,
          contentType: 'component',
        },
        {
          id: 'json',
          label: 'JSON',
          content: displayResult,
          contentType: 'json',
        }
      ]
      return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={false} />
    }

    // Default error handling for other tools
    const tabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: displayResult.error,
        contentType: 'error',
      },
      {
        id: 'json',
        label: 'JSON',
        content: displayResult,
        contentType: 'json',
      }
    ]
    return <OutputTabs toolCategory={toolCategory} toolId={toolId} tabs={tabs} showCopyButton={false} />
  }

  return renderOutput()
}
