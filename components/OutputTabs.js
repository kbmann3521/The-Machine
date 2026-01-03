import React, { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/output-tabs.module.css'

// Dynamically import CodeMirrorEditor to avoid SSR issues
const CodeMirrorEditor = dynamic(() => import('./CodeMirrorEditor'), { ssr: false })

export default function OutputTabs({
  tabs = null,
  friendlyView = null,
  jsonData = null,
  showCopyButton = false,
  title = 'Output',
  onCopyCard = null,
  toolCategory = null,
  toolId = null,
}) {
  const [userSelectedTabId, setUserSelectedTabId] = useState(null)
  const [isMinified, setIsMinified] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCardId, setCopiedCardId] = useState(null)
  const codeContentRef = useRef(null)
  const textContentRef = useRef(null)
  const prevToolIdRef = useRef(toolId)

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
      if (typeof content === 'function') {
        return (
          <div className={styles.friendlyContent}>
            {content({ onCopyCard: handleCopyCard, copiedCardId })}
          </div>
        )
      }
      return (
        <div className={styles.friendlyContent}>
          {content}
        </div>
      )
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
      const showLineNumbers = language !== 'json'
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
      return (
        <div className={styles.friendlyContent}>
          {content({ onCopyCard: handleCopyCard, copiedCardId })}
        </div>
      )
    }

    // Handle React elements
    if (React.isValidElement(content)) {
      return (
        <div className={styles.friendlyContent}>
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
  )
}
