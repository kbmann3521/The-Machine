import React, { useState, useEffect, useRef } from 'react'
import { FaChevronDown } from 'react-icons/fa6'
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
 *   cssContent: React element - CSS editor content (for web-playground)
 *   jsContent: React element - JavaScript editor content (for web-playground)
 *   infoContent: React element - info/about content shown when no tool is selected
 *   onActiveTabChange: function(tabId) - callback when active tab changes
 *   tabOptionsMap: object - map of tab IDs to their option content/controls
 *     { input: <element>, css: <element>, js: <element>, options: <element> }
 *   globalOptionsContent: React element - global options content (shown in modal)
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
  globalOptionsContent = null,
  hasOutputToUse = false,
  onUseOutput = null,
  canCopyOutput = true,
  useOutputLabel = 'Replace with output',
  hasCssOutputToUse = false,
  onUseCssOutput = null,
  canCopyCssOutput = true,
  useCssOutputLabel = 'Replace with output',
  hasJsOutputToUse = false,
  onUseJsOutput = null,
  canCopyJsOutput = true,
  useJsOutputLabel = 'Replace with output',
}) {
  const [userSelectedTabId, setUserSelectedTabId] = useState('input')
  const [openOptionsDropdown, setOpenOptionsDropdown] = useState(null)
  const [openGlobalOptions, setOpenGlobalOptions] = useState(false)
  const [closingGlobalOptions, setClosingGlobalOptions] = useState(false)
  const [showUseOutputMenu, setShowUseOutputMenu] = useState(false)
  const [showUseCssOutputMenu, setShowUseCssOutputMenu] = useState(false)
  const [showUseJsOutputMenu, setShowUseJsOutputMenu] = useState(false)
  const optionsDropdownRef = useRef(null)
  const globalOptionsRef = useRef(null)
  const useOutputMenuRef = useRef(null)
  const useCssOutputMenuRef = useRef(null)
  const useJsOutputMenuRef = useRef(null)

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

  // Add CSS tab if content is provided (for web-playground)
  if (cssContent) {
    tabConfig.push({
      id: 'css',
      label: 'CSS',
      content: cssContent,
      contentType: 'component',
    })
  }

  // Add JS tab if content is provided (for web-playground)
  if (jsContent) {
    tabConfig.push({
      id: 'js',
      label: 'JS',
      content: jsContent,
      contentType: 'component',
    })
  }

  // Only show DESCRIPTION tab if tool is selected
  if (selectedTool && optionsContent) {
    tabConfig.push({
      id: 'options',
      label: 'DESCRIPTION',
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

  // Handle closing animation for global options
  useEffect(() => {
    if (!closingGlobalOptions) return

    const timer = setTimeout(() => {
      setOpenGlobalOptions(false)
      setClosingGlobalOptions(false)
    }, 120) // Match animation duration

    return () => clearTimeout(timer)
  }, [closingGlobalOptions])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openOptionsDropdown && !openGlobalOptions && !showUseOutputMenu && !showUseCssOutputMenu && !showUseJsOutputMenu && !closingGlobalOptions) return

    const handleClickOutside = (e) => {
      if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(e.target)) {
        setOpenOptionsDropdown(null)
      }
      if (globalOptionsRef.current && !globalOptionsRef.current.contains(e.target) && openGlobalOptions && !closingGlobalOptions) {
        setClosingGlobalOptions(true)
      }
      if (useOutputMenuRef.current && !useOutputMenuRef.current.contains(e.target)) {
        setShowUseOutputMenu(false)
      }
      if (useCssOutputMenuRef.current && !useCssOutputMenuRef.current.contains(e.target)) {
        setShowUseCssOutputMenu(false)
      }
      if (useJsOutputMenuRef.current && !useJsOutputMenuRef.current.contains(e.target)) {
        setShowUseJsOutputMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [openOptionsDropdown, openGlobalOptions, showUseOutputMenu, showUseCssOutputMenu, showUseJsOutputMenu, closingGlobalOptions])

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
              <div
                key={tab.id}
                className={styles.tabWrapper}
              >
                <button
                  className={`${styles.tab} ${currentActiveTab === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setUserSelectedTabId(tab.id)}
                >
                  {tab.label}
                </button>
                {tab.id === 'input' && (
                  <div
                    className={styles.useOutputContainer}
                    ref={useOutputMenuRef}
                  >
                    <button
                      className={styles.useOutputChevron}
                      onClick={() => setShowUseOutputMenu(!showUseOutputMenu)}
                      type="button"
                      aria-label={useOutputLabel}
                    >
                      <FaChevronDown size={12} />
                    </button>
                    {showUseOutputMenu && (
                      <div className={styles.useOutputMenu}>
                        {!canCopyOutput ? (
                          <div className={styles.useOutputMenuDisabled}>
                            This output can't be copied
                          </div>
                        ) : !hasOutputToUse ? (
                          <div className={styles.useOutputMenuDisabled}>
                            Nothing to copy to input
                          </div>
                        ) : (
                          <button
                            className={styles.useOutputMenuButton}
                            onClick={() => {
                              onUseOutput()
                              setShowUseOutputMenu(false)
                            }}
                            type="button"
                          >
                            {useOutputLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {tab.id === 'css' && (
                  <div
                    className={styles.useOutputContainer}
                    ref={useCssOutputMenuRef}
                  >
                    <button
                      className={styles.useOutputChevron}
                      onClick={() => setShowUseCssOutputMenu(!showUseCssOutputMenu)}
                      type="button"
                      aria-label={useCssOutputLabel}
                    >
                      <FaChevronDown size={12} />
                    </button>
                    {showUseCssOutputMenu && (
                      <div className={styles.useOutputMenu}>
                        {!canCopyCssOutput ? (
                          <div className={styles.useOutputMenuDisabled}>
                            This output can't be copied
                          </div>
                        ) : !hasCssOutputToUse ? (
                          <div className={styles.useOutputMenuDisabled}>
                            Nothing to copy to input
                          </div>
                        ) : (
                          <button
                            className={styles.useOutputMenuButton}
                            onClick={() => {
                              onUseCssOutput()
                              setShowUseCssOutputMenu(false)
                            }}
                            type="button"
                          >
                            {useCssOutputLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {tab.id === 'js' && (
                  <div
                    className={styles.useOutputContainer}
                    ref={useJsOutputMenuRef}
                  >
                    <button
                      className={styles.useOutputChevron}
                      onClick={() => setShowUseJsOutputMenu(!showUseJsOutputMenu)}
                      type="button"
                      aria-label={useJsOutputLabel}
                    >
                      <FaChevronDown size={12} />
                    </button>
                    {showUseJsOutputMenu && (
                      <div className={styles.useOutputMenu}>
                        {!canCopyJsOutput ? (
                          <div className={styles.useOutputMenuDisabled}>
                            This output can't be copied
                          </div>
                        ) : !hasJsOutputToUse ? (
                          <div className={styles.useOutputMenuDisabled}>
                            Nothing to copy to input
                          </div>
                        ) : (
                          <button
                            className={styles.useOutputMenuButton}
                            onClick={() => {
                              onUseJsOutput()
                              setShowUseJsOutputMenu(false)
                            }}
                            type="button"
                          >
                            {useJsOutputLabel}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Global options - always shown if globalOptionsContent is provided */}
            {globalOptionsContent && (
              <div className={styles.tabOptionsContainer} ref={globalOptionsRef}>
                <button
                  className={styles.tabSettingsButton}
                  onClick={() => {
                    if (openGlobalOptions) {
                      setClosingGlobalOptions(true)
                    } else {
                      setOpenGlobalOptions(true)
                    }
                  }}
                  title="Global options"
                  aria-label="Global options"
                >
                  <span className={styles.settingsIcon}>⚙</span>
                </button>

                {/* Global options modal */}
                {(openGlobalOptions || closingGlobalOptions) && (
                  <div className={`${styles.globalDropdownMenu} ${closingGlobalOptions ? styles.closing : ''}`}>
                    <div className={styles.globalOptionsHeader}>
                      <h2 className={styles.globalOptionsTitle}>Options</h2>
                    </div>
                    <div className={styles.globalOptionsContent}>
                      {globalOptionsContent}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings gear icon - only visible for active tab if it has options */}
            {hasTabOptions && (
              <div className={styles.tabOptionsContainer} ref={optionsDropdownRef}>
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
            {tabActions && (
              <div className={styles.tabActions}>
                {tabActions}
              </div>
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
