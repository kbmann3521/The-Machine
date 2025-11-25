import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/output-tabs.module.css'
import JsonFormatter from './JsonFormatter'

export default function OutputTabs({
  tabs = null,
  friendlyView = null,
  jsonData = null,
  showCopyButton = false,
  title = 'Output',
  onCopyCard = null,
}) {
  const [activeTab, setActiveTab] = useState('friendly')
  const [isMinified, setIsMinified] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedCardId, setCopiedCardId] = useState(null)

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

  if (!tabConfig || tabConfig.length === 0) {
    return null
  }

  // Set initial active tab to first tab if default doesn't exist
  const firstTabId = tabConfig[0]?.id
  if (!tabConfig.find(t => t.id === activeTab)) {
    setActiveTab(firstTabId)
  }

  const activeTabConfig = tabConfig.find(t => t.id === activeTab)

  const getJsonString = () => {
    if (!activeTabConfig?.content) return ''
    const json = typeof activeTabConfig.content === 'string'
      ? activeTabConfig.content
      : JSON.stringify(activeTabConfig.content, null, 2)
    return isMinified ? JSON.stringify(JSON.parse(json)) : json
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

    const renderObject = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object') {
        return <div className={styles.friendlyValue}>{renderValue(obj)}</div>
      }

      const isArray = Array.isArray(obj)
      const entries = isArray ? obj.map((v, i) => [i.toString(), v]) : Object.entries(obj)

      return (
        <div className={styles.friendlySection}>
          {entries.map(([key, value], idx) => (
            <div key={idx} className={styles.friendlyField}>
              <div className={styles.friendlyKey}>{key}</div>
              <div className={styles.friendlyValueContainer}>
                {typeof value === 'object' && value !== null
                  ? renderObject(value, depth + 1)
                  : <div className={styles.friendlyValue}>{renderValue(value)}</div>
                }
              </div>
            </div>
          ))}
        </div>
      )
    }

    return {
      id: 'friendly',
      label: 'Overview',
      content: renderObject(data),
      contentType: 'component',
    }
  }

  // Auto-insert friendly tab if tabs only contain JSON
  let finalTabConfig = tabConfig
  if (tabConfig.length === 1 && tabConfig[0].contentType === 'json') {
    const friendlyTab = generateFriendlyTab(tabConfig[0].content)
    if (friendlyTab) {
      finalTabConfig = [friendlyTab, ...tabConfig]
      // Set active tab to friendly if it's the first tab and no explicit active tab is set
      if (activeTab === tabConfig[0].id) {
        setActiveTab('friendly')
      }
    }
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
    } else if (typeof activeTabConfig?.content === 'function') {
      // For component/function types, we can't copy - show a message or skip
      console.warn('Cannot copy component content')
      return
    } else {
      // Fallback for objects
      textToCopy = JSON.stringify(activeTabConfig.content, null, 2)
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
    if (contentType === 'component' || typeof content === 'function') {
      return (
        <div className={styles.friendlyContent}>
          {typeof content === 'function'
            ? content({ onCopyCard: handleCopyCard, copiedCardId })
            : content
          }
        </div>
      )
    }

    // Handle JSON content
    if (contentType === 'json' || contentType === 'code') {
      return (
        <div className={styles.jsonContent}>
          <pre className={styles.jsonCode}>
            <code>{getJsonString()}</code>
          </pre>
        </div>
      )
    }

    // Handle plain text content
    if (contentType === 'text') {
      return (
        <div className={styles.textContent}>
          <pre className={styles.textCode}>
            <code>{String(content)}</code>
          </pre>
        </div>
      )
    }

    // Default: try to render as component or stringify
    if (typeof content === 'function') {
      return (
        <div className={styles.friendlyContent}>
          {content({ onCopyCard: handleCopyCard, copiedCardId })}
        </div>
      )
    }

    return (
      <div className={styles.jsonContent}>
        <pre className={styles.jsonCode}>
          <code>{JSON.stringify(content, null, 2)}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className={styles.outputTabsWrapper}>
      <div className={styles.outputTabsContainer}>
        <div className={styles.tabsHeader}>
          <div className={styles.tabs}>
            {tabConfig.map(tab => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
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
