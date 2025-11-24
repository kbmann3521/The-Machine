import React, { useState, useMemo, useRef, useEffect } from 'react'
import { FaFont, FaImage, FaHashtag, FaLettercase, FaSearch, FaCopy, FaBarChart, FaCode, FaLink, FaTag, FaClipboard, FaRotateRight, FaSlug, FaClock, FaFileExcel, FaMarkdown, FaFileCode, FaGlobe, FaTicket, FaExchangeAlt, FaPalette, FaCheckCircle, FaQuoteLeft, FaArrowsAltH, FaEye, FaLock, FaQuestion, FaMagic, FaTerminal, FaHeading, FaCalculator, FaGaugeHigh, FaDatabase, FaNetworkWired, FaStream, FaRuler, FaJava, FaEnvelope, FaKey, FaToggleOn, FaNetworkWire } from 'react-icons/fa6'
import { BsRegex } from 'react-icons/bs'
import { ImCalculator } from 'react-icons/im'
import styles from '../styles/tool-sidebar.module.css'

// Map tool IDs to react-icons
const toolIcons = {
  'text-toolkit': FaFont,
  'image-resizer': FaImage,
  'word-counter': FaHashtag,
  'case-converter': FaLettercase,
  'find-replace': FaSearch,
  'remove-extras': FaCopy,
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
  const itemRefs = useRef({})
  const prevPositionsRef = useRef({})

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

    // Move selected tool to the top
    if (selectedTool) {
      const selectedIndex = tools.findIndex(tool => tool.toolId === selectedTool.toolId)
      if (selectedIndex > 0) {
        const reordered = [...tools]
        const [selected] = reordered.splice(selectedIndex, 1)
        reordered.unshift(selected)
        return reordered
      }
    }

    return tools
  }, [predictedTools, searchQuery, selectedTool])

  const topMatch = filteredTools[0]

  // FLIP animation on desktop
  useEffect(() => {
    // Only animate on desktop
    if (typeof window !== 'undefined' && window.innerWidth <= 991) {
      return
    }

    // Store current positions before render
    const currentPositions = {}
    filteredTools.forEach((tool) => {
      const el = itemRefs.current[tool.toolId]
      if (el) {
        const rect = el.getBoundingClientRect()
        currentPositions[tool.toolId] = {
          top: rect.top,
          left: rect.left,
          height: rect.height,
        }
      }
    })

    // Calculate deltas and apply transforms
    setTimeout(() => {
      filteredTools.forEach((tool) => {
        const el = itemRefs.current[tool.toolId]
        if (!el) return

        const newRect = el.getBoundingClientRect()
        const oldPos = prevPositionsRef.current[tool.toolId]

        if (oldPos) {
          const deltaY = oldPos.top - newRect.top
          const deltaX = oldPos.left - newRect.left

          if (Math.abs(deltaY) > 0 || Math.abs(deltaX) > 0) {
            // Reset any previous transforms
            el.style.transition = 'none'
            el.style.transform = `translate(${deltaX}px, ${deltaY}px)`

            // Force reflow to apply the transform
            el.offsetHeight

            // Animate to final position
            el.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            el.style.transform = 'translate(0, 0)'
          }
        }
      })

      prevPositionsRef.current = currentPositions
    }, 0)
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

            return (
              <article
                key={tool.toolId}
                className={`${styles.toolItem} ${
                  isSelected ? styles.selected : ''
                } ${isTopMatch && !searchQuery ? styles.topMatch : ''}`}
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
                <h3
                  className={styles.toolName}
                  style={{ color: getScoreColor(tool.similarity) }}
                  title={getScoreLabel(tool.similarity)}
                >
                  {tool.name}
                </h3>
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
