import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FaFont, FaImage, FaHashtag, FaLettercase, FaSearch, FaCopy, FaBarChart, FaCode, FaLink, FaTag, FaClipboard, FaRotateRight, FaSlug, FaClock, FaFileExcel, FaMarkdown, FaFileCode, FaGlobe, FaTicket, FaExchangeAlt, FaPalette, FaCheckCircle, FaQuoteLeft, FaArrowsAltH, FaEye, FaLock, FaQuestion, FaMagic, FaTerminal, FaHeading, FaCalculator, FaGaugeHigh, FaDatabase, FaNetworkWired, FaStream, FaRuler, FaJava, FaEnvelope, FaKey, FaToggleOn, FaNetworkWire, FaTrash, FaCheck } from 'react-icons/fa6'
import { BsRegex } from 'react-icons/bs'
import { ImCalculator } from 'react-icons/im'
import styles from '../styles/tool-sidebar.module.css'

// Map tool IDs to react-icons
const toolIcons = {
  'text-toolkit': FaFont,
  'image-toolkit': FaImage,
  'image-resizer': FaImage,
  'word-counter': FaHashtag,
  'case-converter': FaLettercase,
  'find-replace': FaSearch,
  'text-analyzer': FaBarChart,
  'base64-converter': FaCode,
  'url-converter': FaLink,
  'html-entities-converter': FaTag,
  'html-formatter': FaCode,
  'plain-text-stripper': FaCopy,
  'json-formatter': FaCode,
  'reverse-text': FaRotateRight,
  'slug-generator': FaSlug,
  'regex-tester': BsRegex,
  'timestamp-converter': FaClock,
  'csv-json-converter': FaFileExcel,
  'markdown-html-converter': FaMarkdown,
  'markdown-html-formatter': FaMarkdown,
  'markdown-linter': FaMarkdown,
  'xml-formatter': FaCode,
  'yaml-formatter': FaCode,
  'url-toolkit': FaGlobe,
  'url-parser': FaGlobe,
  'jwt-decoder': FaTicket,
  'text-diff-checker': FaExchangeAlt,
  'color-converter': FaPalette,
  'checksum-calculator': ImCalculator,
  'escape-unescape': FaQuoteLeft,
  'sort-lines': FaArrowsAltH,
  'whitespace-visualizer': FaEye,
  'ascii-unicode-converter': FaFont,
  'binary-converter': FaToggleOn,
  'rot13-cipher': FaLock,
  'caesar-cipher': FaLock,
  'css-formatter': FaCode,
  'sql-formatter': FaTerminal,
  'http-status-lookup': FaQuestion,
  'mime-type-lookup': FaFileCode,
  'http-header-parser': FaNetworkWired,
  'uuid-validator': FaTicket,
  'json-path-extractor': FaCode,
  'image-to-base64': FaImage,
  'svg-optimizer': FaImage,
  'unit-converter': FaRuler,
  'number-formatter': FaHashtag,
  'timezone-converter': FaClock,
  'base-converter': FaCode,
  'math-evaluator': FaCalculator,
  'keyword-extractor': FaSearch,
  'cron-tester': FaClock,
  'file-size-converter': FaRuler,
  'js-formatter': FaCode,
  'email-validator': FaEnvelope,
  'ip-validator': FaNetworkWired,
  'ip-integer-converter': FaNetworkWired,
  'ip-range-calculator': FaNetworkWired,
  'ip-address-toolkit': FaNetworkWired,
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

export default function ToolSidebar({ predictedTools, selectedTool, onSelectTool, loading }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [markedForDeletion, setMarkedForDeletion] = useState({})
  const [markingTool, setMarkingTool] = useState(null)
  const itemRefs = useRef({})
  const prevPositionsRef = useRef({})

  const handleMarkForDelete = async (e, toolId, currentMarked) => {
    e.stopPropagation()
    e.preventDefault()

    setMarkingTool(toolId)
    const newMarked = !currentMarked

    try {
      const response = await fetch('/api/tools/mark-for-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId,
          marked: newMarked,
        }),
      })

      if (response.ok) {
        setMarkedForDeletion(prev => ({
          ...prev,
          [toolId]: newMarked,
        }))
      } else {
        console.error('Failed to mark tool for deletion')
      }
    } catch (error) {
      console.error('Error marking tool for deletion:', error)
    } finally {
      setMarkingTool(null)
    }
  }

  const filteredTools = useMemo(() => {
    let tools = predictedTools

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
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Search by tool name or function..."
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search tools"
        />
      </div>

      {filteredTools.length > 0 && (
        <nav className={styles.toolsList} aria-label="Available tools">
          {filteredTools.map((tool, index) => {
            const isTopMatch = topMatch && tool.toolId === topMatch.toolId && tool.similarity >= 0.75
            const isSelected = selectedTool?.toolId === tool.toolId

            const isMarked = markedForDeletion[tool.toolId] || tool.markForDelete || false
            const isMarking = markingTool === tool.toolId

            return (
              <article
                key={tool.toolId}
                ref={(el) => setItemRef(tool.toolId, el)}
                className={`${styles.toolItem} ${
                  isSelected ? styles.selected : ''
                } ${isTopMatch && !searchQuery ? styles.topMatch : ''} ${
                  isMarked ? styles.markedForDeletion : ''
                }`}
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
                  <h3
                    className={styles.toolName}
                    style={{ color: getScoreColor(tool.similarity) }}
                    title={getScoreLabel(tool.similarity)}
                  >
                    {tool.name}
                  </h3>
                  <span
                    className={styles.scoreLabel}
                    title={`Similarity: ${(tool.similarity * 100).toFixed(0)}%`}
                  >
                    {(tool.similarity * 100).toFixed(0)}%
                  </span>
                </div>
                <button
                  className={`${styles.markDeleteBtn} ${isMarked ? styles.marked : ''}`}
                  onClick={(e) => handleMarkForDelete(e, tool.toolId, isMarked)}
                  disabled={isMarking}
                  title={isMarked ? 'Marked for deletion' : 'Mark for deletion'}
                  aria-label={`Mark ${tool.name} for deletion`}
                >
                  {isMarking ? (
                    <span className={styles.spinner} />
                  ) : isMarked ? (
                    <FaCheck />
                  ) : (
                    <FaTrash />
                  )}
                </button>
              </article>
            )
          })}
        </nav>
      )}

      {predictedTools.length > 0 && filteredTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools match your search. Try a different query.</p>
        </div>
      )}

      {predictedTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools available. Enter text or upload an image to get started.</p>
        </div>
      )}
    </aside>
  )
}
