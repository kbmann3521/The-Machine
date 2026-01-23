import React, { useState, useEffect, useRef } from 'react'
import styles from '../styles/output-tabs.module.css'

/**
 * InputTabs Component
 *
 * Provides tabbed interface for input area with INPUT, CSS, JS, and OPTIONS tabs
 * Tab-specific options can be shown in dropdown panels next to active tab headers
 * Follows the same pattern as OutputTabs for consistency
 *
 * Props:
 *   inputContent: React element - the input editor component
 *   optionsContent: React element - the config options component
 *   selectedTool: tool object - used to determine which tabs to show
 *   tabActions: React element - action buttons for the tab header
 *   inputTabLabel: string - custom label for input tab (defaults to 'INPUT')
 *   cssContent: React element - CSS editor content (for markdown-html-formatter)
 *   jsContent: React element - JavaScript editor content (for markdown-html-formatter)
 *   infoContent: React element - info/about content shown when no tool is selected
 *   onActiveTabChange: function(tabId) - callback when active tab changes
 *   tabOptionsMap: object - map of tab IDs to their option content/controls
 *     { input: <element>, css: <element>, js: <element>, options: <element> }
 */
export default function InputTabs({
  inputContent = null,
  optionsContent = null,
  selectedTool = null,
  tabActions = null,
  inputTabLabel = 'INPUT',
  cssContent = null,
  jsContent = null,
  infoContent = null,
  onActiveTabChange = null,
  tabOptionsMap = {},
}) {
  const [userSelectedTabId, setUserSelectedTabId] = useState('input')
  const [openOptionsDropdown, setOpenOptionsDropdown] = useState(null)
  const optionsDropdownRef = useRef(null)

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

  // Add JS tab if content is provided (for markdown-html-formatter)
  if (jsContent) {
    tabConfig.push({
      id: 'js',
      label: 'JS',
      content: jsContent,
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

  // Show ABOUT tab with info content when no tool is selected
  if (!selectedTool && infoContent) {
    tabConfig.push({
      id: 'about',
      label: 'ABOUT',
      content: infoContent,
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

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openOptionsDropdown) return

    const handleClickOutside = (e) => {
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(e.target)) {
        setOpenOptionsDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openOptionsDropdown])

  const renderTabContent = () => {
    if (!activeTabConfig) return null

    const { content, id } = activeTabConfig

    // Render component content
    if (content) {
      // Use different styling for options/about tabs which have form controls
      // inputTabContent has no padding to fill the container seamlessly
      // optionsTabContent/aboutTabContent has padding and scroll
      const contentClass = (id === 'options' || id === 'about')
        ? `${styles.inputTabContent} ${styles.optionsTabContent}`
        : styles.inputTabContent
      return <div className={contentClass}>{content}</div>
    }

    return null
  }

  // Check if current active tab has options
  const hasTabOptions = tabOptionsMap && tabOptionsMap[currentActiveTab]

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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Settings gear icon - only visible for active tab if it has options */}
            {hasTabOptions && (
              <div style={{ position: 'relative' }} ref={optionsDropdownRef}>
                <button
                  className={styles.tabSettingsButton}
                  onClick={() => setOpenOptionsDropdown(openOptionsDropdown === currentActiveTab ? null : currentActiveTab)}
                  title={`Options for ${activeTabConfig?.label || 'this tab'}`}
                  aria-label={`Options for ${activeTabConfig?.label || 'this tab'}`}
                >
                  <span className={styles.settingsIcon}>⚙</span>
                </button>

                {/* Options dropdown panel */}
                {openOptionsDropdown === currentActiveTab && (
                  <div className={styles.tabOptionsDropdown}>
                    {tabOptionsMap[currentActiveTab]}
                  </div>
                )}
              </div>
            )}
            <div className={styles.tabActions}>
              {tabActions}
            </div>
          </div>
        </div>

        <div className={`${styles.tabContent} ${styles.tabContentFull}`}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
