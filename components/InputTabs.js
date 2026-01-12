import React, { useState, useEffect } from 'react'
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
 *   tabActions: React element - action buttons for the tab header
 *   inputTabLabel: string - custom label for input tab (defaults to 'INPUT')
 *   cssContent: React element - CSS editor content (for markdown-html-formatter)
 *   onActiveTabChange: function(tabId) - callback when active tab changes
 */
export default function InputTabs({
  inputContent = null,
  optionsContent = null,
  selectedTool = null,
  tabActions = null,
  inputTabLabel = 'INPUT',
  cssContent = null,
  onActiveTabChange = null,
}) {
  const [userSelectedTabId, setUserSelectedTabId] = useState('input')

  // Notify parent when active tab changes
  useEffect(() => {
    if (onActiveTabChange) {
      onActiveTabChange(userSelectedTabId)
    }
  }, [userSelectedTabId, onActiveTabChange])

  // Build tab configuration
  const tabConfig = [
    {
      id: 'input',
      label: inputTabLabel,
      content: inputContent,
      contentType: 'component',
    },
  ]

  // Add CSS tab if content is provided (for markdown-html-formatter)
  if (cssContent) {
    tabConfig.push({
      id: 'css',
      label: 'CSS',
      content: cssContent,
      contentType: 'component',
    })
  }

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
