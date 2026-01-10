import React, { useState } from 'react'
import styles from '../styles/output-tabs.module.css'

/**
 * InputTabs Component
 * 
 * Provides tabbed interface for input area with INPUT and OPTIONS tabs
 * Follows the same pattern as OutputTabs for consistency
 * 
 * Props:
 *   inputContent: React element - the input editor component
 *   optionsContent: React element - the config options component
 *   selectedTool: tool object - used to determine which tabs to show
 */
export default function InputTabs({
  inputContent = null,
  optionsContent = null,
  selectedTool = null,
  tabActions = null,
}) {
  const [userSelectedTabId, setUserSelectedTabId] = useState('input')

  // Build tab configuration
  const tabConfig = [
    {
      id: 'input',
      label: 'INPUT',
      content: inputContent,
      contentType: 'component',
    },
  ]

  // Only show OPTIONS tab if tool is selected (has config options)
  if (selectedTool && optionsContent) {
    tabConfig.push({
      id: 'options',
      label: 'OPTIONS',
      content: optionsContent,
      contentType: 'component',
    })
  }

  // Determine which tab to show
  let currentActiveTab = null

  // If user selected a tab, use it only if it still exists
  if (userSelectedTabId && tabConfig.some(t => t.id === userSelectedTabId)) {
    currentActiveTab = userSelectedTabId
  } else {
    // No valid user selection - always use first tab (INPUT)
    currentActiveTab = tabConfig[0]?.id
  }

  const activeTabConfig = tabConfig.find(t => t.id === currentActiveTab)

  const renderTabContent = () => {
    if (!activeTabConfig) return null

    const { content, id } = activeTabConfig

    // Render component content
    if (content) {
      // Use different styling for options tab which has form controls
      // inputTabContent has no padding to fill the container seamlessly
      // optionsTabContent has padding and scroll
      const contentClass = id === 'options'
        ? `${styles.inputTabContent} ${styles.optionsTabContent}`
        : styles.inputTabContent
      return <div className={contentClass}>{content}</div>
    }

    return null
  }

  return (
    <div className={styles.outputTabsWrapper}>
      <div className={styles.outputTabsContainer}>
        <div className={styles.tabsHeader}>
          <div className={styles.tabs}>
            {tabConfig.map(tab => (
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
            {tabActions}
          </div>
        </div>

        <div className={`${styles.tabContent} ${styles.tabContentFull}`}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
