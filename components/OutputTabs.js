import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/output-tabs.module.css'
import RuleExplorer from './RuleExplorer'
import MergeSelectorConfirmation from './MergeSelectorConfirmation'

// Dynamically import CodeMirrorEditor to avoid SSR issues
const CodeMirrorEditor = dynamic(() => import('./CodeMirrorEditor'), { ssr: false })

// Dynamically import CSSPreview to avoid SSR issues
const CSSPreview = dynamic(() => import('./CSSPreview'), { ssr: false })

export default function OutputTabs({
  tabs = null,
  friendlyView = null,
  jsonData = null,
  showCopyButton = false,
  title = 'Output',
  onCopyCard = null,
  toolCategory = null,
  toolId = null,
  analysisData = null,
  sourceText = null,
  onApplyEdits = null,
  showAnalysisTab = false,
  onShowAnalysisTabChange = null,
  showRulesTab = false,
  onShowRulesTabChange = null,
  isPreviewFullscreen = false,
  onTogglePreviewFullscreen = null,
  jsOptionsContent = null,
  showJsOptionsModal = false,
  onToggleJsOptionsModal = null,
}) {
  const [userSelectedTabId, setUserSelectedTabId] = useState(null)
  const [isMinified, setIsMinified] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCardId, setCopiedCardId] = useState(null)
  const [highlightedRange, setHighlightedRange] = useState(null)
  const [localShowAnalysisTab, setLocalShowAnalysisTab] = useState(showAnalysisTab)
  const [localShowRulesTab, setLocalShowRulesTab] = useState(showRulesTab)
  const [mergeableGroups, setMergeableGroups] = useState(null) // Phase 7E: Track mergeable groups for confirmation
  const [localShowJsOptionsModal, setLocalShowJsOptionsModal] = useState(false)
  const codeContentRef = useRef(null)
  const textContentRef = useRef(null)
  const prevToolIdRef = useRef(toolId)
  const editorRef = useRef(null)

  // Use provided props if available, otherwise use local state
  const finalShowAnalysisTab = showAnalysisTab !== undefined ? showAnalysisTab : localShowAnalysisTab
  const finalShowRulesTab = showRulesTab !== undefined ? showRulesTab : localShowRulesTab

  const handleShowAnalysisTabChange = (value) => {
    if (onShowAnalysisTabChange) {
      onShowAnalysisTabChange(value)
    } else {
      setLocalShowAnalysisTab(value)
    }
  }

  const handleShowRulesTabChange = (value) => {
    if (onShowRulesTabChange) {
      onShowRulesTabChange(value)
    } else {
      setLocalShowRulesTab(value)
    }
  }

  // Generate analysis tab for CSS Formatter (Phase 2)
  const generateAnalysisTab = (analysis) => {
    if (!analysis || typeof analysis !== 'object') {
      return null
    }

    const analysisContent = (
      <div className={styles.analysisPanel}>
          {/* Total Stats */}
          <div className={styles.analysisSection}>
            <h3 className={styles.analysisSectionTitle}>Overview</h3>
            <div className={styles.analysisGrid}>
              <div className={styles.analysisStat}>
                <div className={styles.statLabel}>Total Rules</div>
                <div className={styles.statValue}>{analysis.totalRules || 0}</div>
              </div>
              <div className={styles.analysisStat}>
                <div className={styles.statLabel}>Unique Selectors</div>
                <div className={styles.statValue}>{analysis.uniqueSelectors?.length || 0}</div>
              </div>
              <div className={styles.analysisStat}>
                <div className={styles.statLabel}>Unique Properties</div>
                <div className={styles.statValue}>{analysis.uniqueProperties?.length || 0}</div>
              </div>
              <div className={styles.analysisStat}>
                <div className={styles.statLabel}>Max Nesting Depth</div>
                <div className={styles.statValue}>{analysis.maxNestingDepth || 0}</div>
              </div>
            </div>
          </div>

          {/* CSS Variables */}
          {analysis.variables && (analysis.variables.declared?.length > 0 || analysis.variables.used?.length > 0) && (
            <div className={styles.analysisSection}>
              <h3 className={styles.analysisSectionTitle}>CSS Variables ({(analysis.variables.declared?.length || 0) + (analysis.variables.used?.length || 0)})</h3>
              <div className={styles.variablesList}>
                {/* Declared Variables */}
                {analysis.variables.declared && analysis.variables.declared.length > 0 && (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Declared Variables
                    </div>
                    {analysis.variables.declared.map((variable, idx) => (
                      <div key={`decl-${idx}`} className={styles.variableItem}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                          <code className={styles.variableName}>{variable.name}</code>
                          <span className={styles.variableValue}>{variable.value}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexShrink: 0 }}>
                          {variable.scope && variable.scope !== ':root' && (
                            <span style={{ fontSize: '10px', color: '#999', fontFamily: 'monospace' }}>
                              {variable.scope}
                            </span>
                          )}
                          {variable.loc?.startLine && <span className={styles.variableLine}>Line {variable.loc.startLine}</span>}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Used Variables */}
                {analysis.variables.used && analysis.variables.used.length > 0 && (
                  <>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--color-text-secondary)', marginBottom: '8px', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Used Variables
                    </div>
                    {analysis.variables.used.map((variable, idx) => (
                      <div key={`used-${idx}`} className={styles.variableItem}>
                        <code className={styles.variableName}>{variable.name}</code>
                        <span className={styles.variableValue} style={{ fontSize: '11px' }}>in {variable.property}</span>
                        {variable.loc?.startLine && <span className={styles.variableLine}>Line {variable.loc.startLine}</span>}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Media Queries */}
          {analysis.mediaQueries && analysis.mediaQueries.length > 0 && (
            <div className={styles.analysisSection}>
              <h3 className={styles.analysisSectionTitle}>Media Queries ({analysis.mediaQueries.length})</h3>
              <div className={styles.mediaQueriesList}>
                {analysis.mediaQueries.map((mq, idx) => (
                  <div key={idx} className={styles.mediaQueryItem}>
                    <code className={styles.mediaQueryText}>@media {mq.query}</code>
                    <div className={styles.mediaQueryMeta}>
                      {mq.breakpoint && <span className={styles.breakpoint}>Breakpoint: {mq.breakpoint}</span>}
                      <span className={styles.ruleCount}>{mq.ruleCount} rule{mq.ruleCount !== 1 ? 's' : ''}</span>
                      {mq.line && <span className={styles.lineNum}>Line {mq.line}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unique Selectors */}
          {analysis.uniqueSelectors && analysis.uniqueSelectors.length > 0 && (
            <div className={styles.analysisSection}>
              <h3 className={styles.analysisSectionTitle}>Unique Selectors ({analysis.uniqueSelectors.length})</h3>
              <div className={styles.selectorsList}>
                {analysis.uniqueSelectors.map((selector, idx) => (
                  <div key={idx} className={styles.selectorItem}>
                    <code className={styles.selector}>{selector}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unique Properties */}
          {analysis.uniqueProperties && analysis.uniqueProperties.length > 0 && (
            <div className={styles.analysisSection}>
              <h3 className={styles.analysisSectionTitle}>Properties Used ({analysis.uniqueProperties.length})</h3>
              <div className={styles.propertiesList}>
                {analysis.uniqueProperties.map((prop, idx) => (
                  <span key={idx} className={styles.propertyTag}>{prop}</span>
                ))}
              </div>
            </div>
          )}

          {/* At-Rules */}
          {analysis.atRules && analysis.atRules.length > 0 && (
            <div className={styles.analysisSection}>
              <h3 className={styles.analysisSectionTitle}>At-Rules ({analysis.atRules.length})</h3>
              <div className={styles.atRulesList}>
                {analysis.atRules.map((rule, idx) => (
                  <div key={idx} className={styles.atRuleItem}>
                    <code className={styles.atRuleName}>@{rule.name}</code>
                    {rule.params && <span className={styles.atRuleParams}>{rule.params}</span>}
                    {rule.line && <span className={styles.lineNum}>Line {rule.line}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicate Declarations */}
          {analysis.duplicateDeclarations && analysis.duplicateDeclarations.length > 0 && (
            <div className={styles.analysisSection}>
              <h3 className={styles.analysisSectionTitle}>Duplicate Declarations ({analysis.duplicateDeclarations.length})</h3>
              <div className={styles.duplicatesList}>
                {analysis.duplicateDeclarations.map((dup, idx) => (
                  <div key={idx} className={styles.duplicateItem}>
                    <div className={styles.duplicateProp}>
                      <code>{dup.prop}: {dup.value}</code>
                    </div>
                    <div className={styles.duplicateSelectors}>
                      {dup.selectors.map((sel, sIdx) => (
                        <span key={sIdx} className={styles.dupSelector}>{sel}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    )

    return {
      id: 'analysis',
      label: 'Analysis',
      content: analysisContent,
      contentType: 'analysis',
    }
  }

  // Generate a user-friendly view from JSON data
  const generateFriendlyTab = (jsonContent) => {
    let data = jsonContent
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
      } catch (e) {
        return null
      }
    }

    const isJWT = (obj) => {
      if (typeof obj !== 'object' || obj === null) return false
      return (obj.header || obj.payload) && (obj.signature !== undefined)
    }

    const renderValue = (val) => {
      if (val === null) return 'null'
      if (typeof val === 'boolean') return val ? 'Yes' : 'No'
      if (typeof val === 'number') return val.toString()
      if (typeof val === 'string') return val
      if (Array.isArray(val)) {
        if (val.length === 0) return '(empty array)'
        if (typeof val[0] === 'object') {
          return `${val.length} item${val.length !== 1 ? 's' : ''}`
        }
        return val.join(', ')
      }
      if (typeof val === 'object') {
        const keys = Object.keys(val)
        return `${keys.length} field${keys.length !== 1 ? 's' : ''}`
      }
      return String(val)
    }

    const renderKeyValueField = (key, value, cardId, onCopyCard, copiedCardId) => {
      const displayValue = renderValue(value)
      return (
        <div key={cardId} className={styles.dataCard}>
          <div className={styles.dataCardHeader}>
            <span className={styles.dataCardLabel}>{key}</span>
            {onCopyCard && (
              <button
                className="copy-action"
                onClick={() => onCopyCard(displayValue, cardId)}
                title={`Copy ${key}`}
              >
                {copiedCardId === cardId ? '✓' : <FaCopy />}
              </button>
            )}
          </div>
          <div className={styles.dataCardValue}>{displayValue}</div>
        </div>
      )
    }

    const renderSection = (title, obj, sectionId, onCopyCard, copiedCardId) => {
      if (!obj || typeof obj !== 'object') return null

      const entries = Object.entries(obj)
      const sectionContentClass = toolId === 'base64-converter' ? `${styles.dataSectionContent} ${styles.singleColumn}` : styles.dataSectionContent
      return (
        <div key={sectionId} className={styles.dataSection}>
          <div className={styles.dataSectionTitle}>{title}</div>
          <div className={sectionContentClass}>
            {entries.map(([key, value], idx) => {
              const cardId = `${sectionId}-${key}`
              return (
                <div key={idx} className={styles.dataCardWrapper}>
                  {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                    <div className={styles.nestedDataCard}>
                      <div className={styles.nestedKey}>{key}</div>
                      <div className={styles.nestedObject}>
                        {Object.entries(value).map(([nestedKey, nestedValue], nestedIdx) => (
                          <div key={nestedIdx} className={styles.nestedField}>
                            <span className={styles.nestedKeyName}>{nestedKey}:</span>
                            <span className={styles.nestedValue}>{renderValue(nestedValue)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    renderKeyValueField(key, value, cardId, onCopyCard, copiedCardId)
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    const renderFriendlyJWT = (jwtData, onCopyCard, copiedCardId) => {
      return (
        <div className={styles.friendlyContent}>
          {jwtData.header && renderSection('Header', jwtData.header, 'header', onCopyCard, copiedCardId)}
          {jwtData.payload && renderSection('Payload', jwtData.payload, 'payload', onCopyCard, copiedCardId)}
          {jwtData.signature && (
            <div className={styles.dataSection}>
              <div className={styles.dataSectionTitle}>Signature</div>
              <div className={styles.dataSectionContent}>
                <div className={styles.signatureCard}>
                  <div className={styles.signatureValue}>{jwtData.signature}</div>
                  {onCopyCard && (
                    <button
                      className="copy-action"
                      onClick={() => onCopyCard(jwtData.signature, 'signature')}
                      title="Copy signature"
                    >
                      {copiedCardId === 'signature' ? '✓' : <FaCopy />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }

    const renderObject = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object') {
        return <div className={styles.friendlyValue}>{renderValue(obj)}</div>
      }

      const isArray = Array.isArray(obj)
      const entries = isArray ? obj.map((v, i) => [i.toString(), v]) : Object.entries(obj)

      return (
        <div className={styles.friendlyContent}>
          {entries.map(([key, value], idx) => {
            const cardId = `field-${idx}`
            return (
              <div key={idx} className={styles.dataCardWrapper}>
                {typeof value === 'object' && value !== null && !Array.isArray(value) ? (
                  <div className={styles.nestedDataCard}>
                    <div className={styles.nestedKey}>{key}</div>
                    <div className={styles.nestedObject}>
                      {Object.entries(value).map(([nestedKey, nestedValue], nestedIdx) => (
                        <div key={nestedIdx} className={styles.nestedField}>
                          <span className={styles.nestedKeyName}>{nestedKey}:</span>
                          <span className={styles.nestedValue}>{renderValue(nestedValue)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  renderKeyValueField(key, value, cardId, null, null)
                )}
              </div>
            )
          })}
        </div>
      )
    }

    // Detect JWT and render specially
    if (isJWT(data)) {
      return {
        id: 'formatted',
        label: 'Output',
        content: ({ onCopyCard, copiedCardId }) => renderFriendlyJWT(data, onCopyCard, copiedCardId),
        contentType: 'component',
      }
    }

    return {
      id: 'formatted',
      label: 'Output',
      content: renderObject(data),
      contentType: 'component',
    }
  }

  // Support both old API (friendlyView + jsonData) and new API (tabs array)
  let tabConfig = tabs
  if (!tabs && (friendlyView || jsonData)) {
    // Legacy mode: construct tabs from friendlyView and jsonData
    tabConfig = []
    if (friendlyView) {
      tabConfig.push({
        id: 'friendly',
        label: 'Friendly',
        content: friendlyView,
        contentType: 'component',
      })
    }
    if (jsonData) {
      tabConfig.push({
        id: 'json',
        label: 'JSON',
        content: jsonData,
        contentType: 'json',
      })
    }
  }

  // Add Analysis tab for CSS Formatter (Phase 2) and Web Playground in CSS mode
  if ((toolId === 'css-formatter' || toolId === 'web-playground') && analysisData && finalShowAnalysisTab) {
    if (!tabConfig) {
      tabConfig = []
    }
    // Only add analysis tab if it doesn't already exist
    const hasAnalysisTab = tabConfig.some(t => t.id === 'analysis')
    if (!hasAnalysisTab) {
      const analysisTab = generateAnalysisTab(analysisData)
      if (analysisTab) {
        // Insert analysis tab after the first tab (typically output/formatted)
        tabConfig.splice(1, 0, analysisTab)
      }
    }
  }

  // Add Rules tab for CSS Formatter (Phase 3) and Web Playground in CSS mode
  if ((toolId === 'css-formatter' || toolId === 'web-playground') && analysisData && analysisData.rulesTree && finalShowRulesTab) {
    if (!tabConfig) {
      tabConfig = []
    }
    // Only add rules tab if it doesn't already exist
    const hasRulesTab = tabConfig.some(t => t.id === 'rules')
    if (!hasRulesTab && analysisData.rulesTree.length > 0) {
      const rulesTab = {
        id: 'rules',
        label: 'Rules',
        content: (
          <RuleExplorer
            rules={analysisData.rulesTree}
            onSelect={(loc) => {
              setHighlightedRange(loc)
              // Auto-scroll to the Rules tab was clicked
              setUserSelectedTabId('rules')
            }}
            onMergeClick={(groups) => {
              setMergeableGroups(groups)
            }}
          />
        ),
        contentType: 'component',
      }
      // Insert rules tab after analysis tab if it exists, otherwise after output
      const analysisTabIdx = tabConfig.findIndex(t => t.id === 'analysis')
      if (analysisTabIdx >= 0) {
        tabConfig.splice(analysisTabIdx + 1, 0, rulesTab)
      } else {
        tabConfig.splice(1, 0, rulesTab)
      }
    }
  }

  // Add comprehensive JSON tab for CSS Formatter (Phase 3+)
  if (toolId === 'css-formatter' && analysisData) {
    if (!tabConfig) {
      tabConfig = []
    }
    // Only add JSON tab if it doesn't already exist
    const hasJsonTab = tabConfig.some(t => t.id === 'toolkit-json')
    if (!hasJsonTab) {
      // Create consolidated analysis JSON
      const consolidatedData = {
        metadata: {
          totalRules: analysisData.totalRules,
          uniqueSelectorsCount: analysisData.uniqueSelectors?.length || 0,
          uniquePropertiesCount: analysisData.uniqueProperties?.length || 0,
          maxNestingDepth: analysisData.maxNestingDepth,
        },
        selectors: analysisData.uniqueSelectors || [],
        properties: analysisData.uniqueProperties || [],
        variables: analysisData.variables || [],
        mediaQueries: analysisData.mediaQueries || [],
        atRules: analysisData.atRules || [],
        specificity: analysisData.specificity || [],
        duplicateDeclarations: analysisData.duplicateDeclarations || [],
        rulesTree: analysisData.rulesTree || [],
      }

      const jsonTab = {
        id: 'toolkit-json',
        label: 'JSON',
        content: JSON.stringify(consolidatedData, null, 2),
        contentType: 'json',
        language: 'json',
      }

      // Add JSON tab at the end
      tabConfig.push(jsonTab)
    }
  }

  // Auto-insert friendly tab if tabs only contain JSON
  let finalTabConfig = tabConfig
  if (tabConfig && tabConfig.length === 1 && tabConfig[0].contentType === 'json') {
    const friendlyTab = generateFriendlyTab(tabConfig[0].content)
    if (friendlyTab) {
      // Change the JSON tab label to "JSON" when showing friendly view
      const jsonTab = { ...tabConfig[0], label: 'JSON' }
      finalTabConfig = [friendlyTab, jsonTab]
    }
  }

  if (!finalTabConfig || finalTabConfig.length === 0) {
    return null
  }

  // CRITICAL: Ensure OUTPUT/FORMATTED tab always exists and is FIRST
  // This prevents flashing validation/json tabs when switching tools
  const hasOutputTab = finalTabConfig.some(t => t.id === 'output' || t.id === 'formatted')
  if (!hasOutputTab && finalTabConfig.length > 0) {
    // Add output tab as first tab if it doesn't exist
    const firstTab = finalTabConfig[0]
    const outputTab = {
      id: 'output',
      label: 'OUTPUT',
      content: firstTab.content,
      contentType: firstTab.contentType
    }
    finalTabConfig = [outputTab, ...finalTabConfig]
  } else if (hasOutputTab) {
    // If output exists but isn't first, move it to first
    const outputIdx = finalTabConfig.findIndex(t => t.id === 'output' || t.id === 'formatted')
    if (outputIdx > 0) {
      const [outputTab] = finalTabConfig.splice(outputIdx, 1)
      finalTabConfig.unshift(outputTab)
    }
  }

  // When tool changes, reset user selection so it defaults back to output
  useEffect(() => {
    if (toolId !== prevToolIdRef.current) {
      prevToolIdRef.current = toolId
      setUserSelectedTabId(null)
    }
  }, [toolId])

  // Determine which tab to show
  // Always prefer OUTPUT/FORMATTED unless user explicitly selected something else
  let currentActiveTab = null

  // If user selected a tab, use it only if it still exists
  if (userSelectedTabId && finalTabConfig.some(t => t.id === userSelectedTabId)) {
    currentActiveTab = userSelectedTabId
  } else {
    // No valid user selection - always use first tab
    // (guaranteed to be OUTPUT/FORMATTED due to reordering above)
    currentActiveTab = finalTabConfig[0]?.id
  }
  const activeTabConfig = finalTabConfig.find(t => t.id === currentActiveTab)

  const getJsonString = () => {
    if (!activeTabConfig?.content) return ''
    const json = typeof activeTabConfig.content === 'string'
      ? activeTabConfig.content
      : JSON.stringify(activeTabConfig.content, null, 2)
    return isMinified ? JSON.stringify(JSON.parse(json)) : json
  }

  const handleCopy = async () => {
    let textToCopy = ''

    if (!activeTabConfig) return

    // For JSON/code content types, use the formatted string
    if (activeTabConfig?.contentType === 'json' || activeTabConfig?.contentType === 'code') {
      textToCopy = getJsonString()
    } else if (activeTabConfig?.contentType === 'text') {
      // For text, just use the content as-is
      textToCopy = String(activeTabConfig.content)
    } else if (typeof activeTabConfig?.content === 'string') {
      // If content is a string, copy it directly
      textToCopy = activeTabConfig.content
    } else if (typeof activeTabConfig?.content === 'function' || React.isValidElement(activeTabConfig?.content)) {
      // For component/function types, we can't copy - show a message or skip
      console.warn('Cannot copy component content')
      return
    } else {
      // Fallback for serializable objects - with circular reference protection
      try {
        textToCopy = JSON.stringify(activeTabConfig.content, (key, value) => {
          // Skip DOM elements and React Fiber nodes
          if (value && typeof value === 'object' && (value.nodeType || value.__reactFiber$ || value.__reactProps$)) {
            return undefined
          }
          return value
        }, 2)
      } catch (err) {
        // If serialization fails, skip copying
        console.warn('Cannot copy content: ', err)
        return
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

  const handleCopyCard = async (value, cardId) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedCardId(cardId)
      setTimeout(() => setCopiedCardId(null), 2000)
    } catch (err) {
      fallbackCopy(String(value))
      setCopiedCardId(cardId)
      setTimeout(() => setCopiedCardId(null), 2000)
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

  const renderTabContent = () => {
    if (!activeTabConfig) return null

    const { contentType, content, actions } = activeTabConfig

    // Handle component/function content (e.g., friendlyView)
    if (contentType === 'component') {
      // Use special styling for preview tab to enable proper scrolling
      const isPreviewTab = activeTabConfig.id === 'preview' && toolId === 'css-formatter'
      const contentClass = isPreviewTab ? styles.previewTabContent : styles.friendlyContent

      if (typeof content === 'function') {
        return (
          <div className={contentClass}>
            {content({ onCopyCard: handleCopyCard, copiedCardId })}
          </div>
        )
      }
      return (
        <div className={contentClass}>
          {content}
        </div>
      )
    }

    // Handle analysis content (no wrapper)
    if (contentType === 'analysis') {
      return content
    }

    // Handle JSON content
    if (contentType === 'json' || contentType === 'code') {
      const codeContent = getJsonString()

      // Determine language from tab config or toolId
      let language = activeTabConfig.language || 'text'
      if (!language || language === 'text') {
        if (toolId === 'json-formatter') language = 'json'
        else if (toolId === 'js-formatter') language = 'javascript'
        else if (toolId === 'css-formatter') language = 'css'
        else if (toolId === 'html-formatter' || toolId === 'markdown-html-formatter') language = 'markup'
        else if (toolId === 'xml-formatter') language = 'markup'
        else if (toolId === 'svg-optimizer') language = 'markup'
        else if (toolId === 'yaml-formatter') language = 'yaml'
        else if (toolId === 'sql-formatter') language = 'sql'
        else if (contentType === 'json') language = 'json'
      }

      // Use CodeMirror for all code/JSON tabs
      // Disable line gutters for CSV converter exports (JS/TS/SQL)
      const showLineNumbers = language !== 'json' && toolId !== 'csv-json-converter'
      return (
        <div className={styles.codeContentWithLineNumbers} style={{ height: '100%' }}>
          <div className={styles.codeContentWrapper} ref={codeContentRef} style={{ height: '100%' }}>
            <CodeMirrorEditor
              value={codeContent}
              language={language}
              readOnly={true}
              showLineNumbers={showLineNumbers}
              editorType="output"
              style={{ height: '100%' }}
              highlightingEnabled={true}
            />
          </div>
        </div>
      )
    }

    // Handle error content
    if (contentType === 'error') {
      return (
        <div className={styles.errorContent}>
          <div className={styles.errorMessage}>{String(content)}</div>
        </div>
      )
    }

    // Handle plain text content
    if (contentType === 'text') {
      const textContent = String(content)

      return (
        <div className={styles.codeContentWithLineNumbers}>
          <div className={styles.codeContentWrapper} ref={textContentRef}>
            <pre className={styles.textCode}>
              <code>{textContent}</code>
            </pre>
          </div>
        </div>
      )
    }

    // Handle React components
    if (typeof content === 'function') {
      const isPreviewTab = activeTabConfig.id === 'preview' && toolId === 'css-formatter'
      const contentClass = isPreviewTab ? styles.previewTabContent : styles.friendlyContent
      return (
        <div className={contentClass}>
          {content({ onCopyCard: handleCopyCard, copiedCardId })}
        </div>
      )
    }

    // Handle React elements
    if (React.isValidElement(content)) {
      const isPreviewTab = activeTabConfig.id === 'preview' && toolId === 'css-formatter'
      const contentClass = isPreviewTab ? styles.previewTabContent : styles.friendlyContent
      return (
        <div className={contentClass}>
          {content}
        </div>
      )
    }

    const jsonContent = JSON.stringify(content, null, 2)
    return (
      <div className={`${styles.codeContentWithLineNumbers} ${styles.codeContentNoLineNumbers}`} style={{ height: '100%' }}>
        <div className={styles.codeContentWrapper} style={{ height: '100%' }}>
          <CodeMirrorEditor
            value={jsonContent}
            language="json"
            readOnly={true}
            showLineNumbers={false}
            editorType="output"
            style={{ height: '100%' }}
            highlightingEnabled={true}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.outputTabsWrapper}>
        <div className={styles.outputTabsContainer}>
          <div className={styles.tabsHeader}>
            <div className={styles.tabs}>
              {finalTabConfig.map(tab => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${currentActiveTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setUserSelectedTabId(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className={styles.tabActions}>
              {activeTabConfig?.contentType === 'json' && (
                <button
                  className={styles.minifyToggle}
                  onClick={() => setIsMinified(!isMinified)}
                  title={isMinified ? 'Expand JSON' : 'Minify JSON'}
                >
                  {isMinified ? 'Expand' : 'Minify'}
                </button>
              )}

              {jsOptionsContent && (
                <button
                  className="copy-action"
                  onClick={() => setLocalShowJsOptionsModal(!localShowJsOptionsModal)}
                  title="JavaScript options"
                >
                  ⚙️
                </button>
              )}

              {showCopyButton && (
                <button className="copy-action" onClick={handleCopy} title="Copy output">
                  {copied ? '✓ Copied' : <><FaCopy /> Copy</>}
                </button>
              )}

              {activeTabConfig?.actions && (
                activeTabConfig.actions.map((action, idx) => (
                  <button
                    key={idx}
                    className={action.className || 'copy-action'}
                    onClick={() => action.onClick && action.onClick()}
                    title={action.title}
                  >
                    {action.label || action.icon}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={`${styles.tabContent} ${styles.tabContentFull}`}>
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* JavaScript Options Modal */}
      {localShowJsOptionsModal && jsOptionsContent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
        }}>
          <div style={{
            backgroundColor: 'var(--color-background-primary)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: '0', fontSize: '16px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                JavaScript Options
              </h2>
              <button
                onClick={() => setLocalShowJsOptionsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close options"
              >
                ✕
              </button>
            </div>
            {jsOptionsContent}
          </div>
        </div>
      )}

      {/* Phase 7E: Merge Selector Confirmation Modal */}
      {mergeableGroups && analysisData?.rulesTree && (
        <MergeSelectorConfirmation
          mergeableGroups={mergeableGroups}
          rulesTree={analysisData.rulesTree}
          sourceText={sourceText}
          onConfirm={(mergedCSS) => {
            if (onApplyEdits) {
              onApplyEdits(mergedCSS)
            }
            setMergeableGroups(null)
          }}
          onCancel={() => setMergeableGroups(null)}
        />
      )}
    </>
  )
}
