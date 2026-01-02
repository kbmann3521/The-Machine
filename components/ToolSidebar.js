import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FaFont, FaImage, FaHashtag, FaCode, FaClock, FaFileExcel, FaMarkdown, FaFileCode, FaGlobe, FaTicket, FaPalette, FaQuoteLeft, FaLock, FaTerminal, FaQuestion, FaNetworkWired, FaRuler, FaEnvelope, FaToggleOn, FaCalculator, FaChevronLeft } from 'react-icons/fa6'
import { BsRegex, BsQrCode } from 'react-icons/bs'
import { ImCalculator } from 'react-icons/im'
import styles from '../styles/tool-sidebar.module.css'

// Map tool IDs to react-icons
const toolIcons = {
  'text-toolkit': FaFont,
  'image-toolkit': FaImage,
  'base64-converter': FaCode,
  'json-formatter': FaCode,
  'regex-tester': BsRegex,
  'csv-json-converter': FaFileExcel,
  'markdown-html-formatter': FaMarkdown,
  'xml-formatter': FaCode,
  'yaml-formatter': FaCode,
  'url-toolkit': FaGlobe,
  'jwt-decoder': FaTicket,
  'color-converter': FaPalette,
  'checksum-calculator': ImCalculator,
  'escape-unescape': FaQuoteLeft,
  'ascii-unicode-converter': FaFont,
  'caesar-cipher': FaLock,
  'css-formatter': FaCode,
  'sql-formatter': FaTerminal,
  'http-status-lookup': FaQuestion,
  'mime-type-lookup': FaFileCode,
  'http-header-parser': FaNetworkWired,
  'uuid-validator': FaTicket,
  'image-to-base64': FaImage,
  'svg-optimizer': FaImage,
  'unit-converter': FaRuler,
  'number-formatter': FaHashtag,
  'time-normalizer': FaClock,
  'base-converter': FaCode,
  'math-evaluator': FaCalculator,
  'cron-tester': FaClock,
  'file-size-converter': FaRuler,
  'js-formatter': FaCode,
  'email-validator': FaEnvelope,
  'ip-address-toolkit': FaNetworkWired,
  'qr-code-generator': BsQrCode,
}

const getScoreColor = (similarity) => {
  // Create gradient from green (high similarity) to white (low similarity)
  const hue = similarity * 120 // 0 = red, 120 = green
  const saturation = similarity * 70 // 0% to 70% saturation
  const lightness = 50 + (1 - similarity) * 25 // 50% to 75% lightness (fade to white)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

const getScoreLabel = (similarity) => {
  if (similarity >= 0.85) return 'Excellent match'
  if (similarity >= 0.75) return 'Good match'
  if (similarity >= 0.6) return 'Possible match'
  return 'Available'
}

export default function ToolSidebar({ predictedTools, selectedTool, onSelectTool, loading, initialLoading, sidebarOpen = true, onSidebarToggle }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCascadeAnimation, setShowCascadeAnimation] = useState(true)
  const itemRefs = useRef({})
  const prevPositionsRef = useRef({})
  const hasLoadedRef = useRef(false)

  const filteredTools = useMemo(() => {
    let tools = [...predictedTools].sort((a, b) => a.name.localeCompare(b.name))

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      )
    }

    return tools
  }, [predictedTools, searchQuery])

  const topMatch = filteredTools[0]

  // Disable cascade animation after initial load or when searching
  useEffect(() => {
    if (!initialLoading && !hasLoadedRef.current) {
      // First time tools finish loading - allow animation for this render
      hasLoadedRef.current = true
    } else if (searchQuery.trim()) {
      // Disable animation when user starts searching
      setShowCascadeAnimation(false)
    } else if (!searchQuery.trim() && !initialLoading) {
      // Re-enable animation when search is cleared (but only on subsequent clears)
      if (hasLoadedRef.current) {
        setShowCascadeAnimation(false)
      }
    }
  }, [initialLoading, searchQuery])

  // Position tracking (animations disabled)
  useEffect(() => {
    requestAnimationFrame(() => {
      const newPositions = {}
      filteredTools.forEach((tool) => {
        const el = itemRefs.current[tool.toolId]
        if (!el) return
        const rect = el.getBoundingClientRect()
        newPositions[tool.toolId] = {
          top: rect.top,
          left: rect.left,
          height: rect.height,
        }
      })
      prevPositionsRef.current = newPositions
    })
  }, [filteredTools])

  const setItemRef = (toolId, el) => {
    if (el) {
      itemRefs.current[toolId] = el
    } else {
      delete itemRefs.current[toolId]
    }
  }

  return (
    <aside className={`${styles.sidebar} ${!sidebarOpen ? styles.collapsed : ''}`}>
      <div className={styles.header}>
        <button
          className={styles.collapseButton}
          onClick={() => onSidebarToggle?.(!sidebarOpen)}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <FaChevronLeft />
        </button>
        <input
          type="text"
          placeholder="Search by tool name or function..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search tools"
        />
      </div>

      {initialLoading && (
        <div className={styles.loadingState}>
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner} />
            <div className={styles.spinnerDots}>
              <div className={styles.dot} />
              <div className={styles.dot} />
              <div className={styles.dot} />
            </div>
            <p className={styles.loadingText}>Loading tools...</p>
          </div>
        </div>
      )}

      {!initialLoading && filteredTools.length > 0 && (
        <nav className={styles.toolsList} aria-label="Available tools">
          {filteredTools.map((tool, index) => {
            const isTopMatch = topMatch && tool.toolId === topMatch.toolId && tool.similarity >= 0.75
            const isSelected = selectedTool?.toolId === tool.toolId

            return (
              <article
                key={tool.toolId}
                ref={(el) => setItemRef(tool.toolId, el)}
                className={`${styles.toolItem} ${
                  showCascadeAnimation ? styles.toolItemAnimated : ''
                } ${
                  isSelected ? styles.selected : ''
                } ${isTopMatch && !searchQuery ? styles.topMatch : ''}`}
                style={showCascadeAnimation ? { animationDelay: `${index * 50}ms` } : {}}
                onClick={() => onSelectTool(tool)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectTool(tool)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                title={`${tool.name} - ${getScoreLabel(tool.similarity)}`}
              >
                {toolIcons[tool.toolId] && (
                  <div className={styles.toolIcon}>
                    {React.createElement(toolIcons[tool.toolId])}
                  </div>
                )}
                <div className={styles.toolNameContainer}>
                  <h3 className={styles.toolName}>
                    {tool.name}
                  </h3>
                </div>
              </article>
            )
          })}
        </nav>
      )}

      {!initialLoading && predictedTools.length > 0 && filteredTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools match your search. Try a different query.</p>
        </div>
      )}

      {!initialLoading && predictedTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools available. Enter text or upload an image to get started.</p>
        </div>
      )}
    </aside>
  )
}
