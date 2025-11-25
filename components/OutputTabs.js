import React, { useState } from 'react'
import { FaCopy } from 'react-icons/fa6'
import styles from '../styles/output-tabs.module.css'

export default function OutputTabs({
  friendlyView,
  jsonData,
  showCopyButton = false,
  title = 'Output',
}) {
  const [activeTab, setActiveTab] = useState('friendly')
  const [isMinified, setIsMinified] = useState(false)
  const [copied, setCopied] = useState(false)

  const getJsonString = () => {
    const json = typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2)
    return isMinified ? JSON.stringify(JSON.parse(json)) : json
  }

  const handleCopy = async () => {
    const textToCopy = activeTab === 'friendly'
      ? friendlyView?.innerText || JSON.stringify(jsonData)
      : getJsonString()

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

  return (
    <div className={styles.outputTabsContainer}>
      <div className={styles.tabsHeader}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'friendly' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('friendly')}
          >
            Friendly
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'json' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON
          </button>
        </div>

        <div className={styles.tabActions}>
          {activeTab === 'json' && (
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
        </div>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'friendly' && friendlyView && (
          <div className={styles.friendlyContent}>
            {friendlyView}
          </div>
        )}

        {activeTab === 'json' && (
          <div className={styles.jsonContent}>
            <pre className={styles.jsonCode}>
              <code>{getJsonString()}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
