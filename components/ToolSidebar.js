import React, { useState, useMemo } from 'react'
import { FaFont, FaImage, FaHashtag, FaLettercase, FaSearch, FaCopy, FaBarChart, FaCode, FaLink, FaTag, FaClipboard, FaRotateRight, FaSlug, FaClock, FaFileExcel, FaMarkdown, FaFileCode, FaYaml, FaGlobe, FaTicket, FaExchangeAlt, FaPalette, FaCheckCircle, FaQuoteLeft, FaArrowsAltH, FaEye, FaUnicode, FaBinary, FaLock, FaQuestion, FaMagic, FaTerminal, FaHeading, FaCalculator, FaGaugeHigh, FaDatabase, FaNetworkWired, FaStream, FaRuler, FaJava, FaEnvelope, FaBroadcast, FaKey } from 'react-icons/fa6'
import { BsRegex } from 'react-icons/bs'
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
  'yaml-formatter': FaYaml,
  'url-parser': FaGlobe,
  'jwt-decoder': FaTicket,
  'text-diff-checker': FaExchangeAlt,
  'color-converter': FaPalette,
  'checksum-calculator': FaCheckCircle,
  'escape-unescape': FaQuoteLeft,
  'sort-lines': FaArrowsAltH,
  'whitespace-visualizer': FaEye,
  'ascii-unicode-converter': FaUnicode,
  'binary-converter': FaBinary,
  'rot13-cipher': FaLock,
  'caesar-cipher': FaLock,
  'css-formatter': FaCode,
  'sql-formatter': FaTerminal,
  'http-status-lookup': FaQuestion,
  'mime-type-lookup': FaMagic,
  'http-header-parser': FaBroadcast,
  'uuid-validator': FaCheckCircle,
  'json-path-extractor': FaSearch,
  'image-to-base64': FaImage,
  'svg-optimizer': FaImage,
  'unit-converter': FaArrowsAltH,
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

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return predictedTools

    const query = searchQuery.toLowerCase()
    return predictedTools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query)
    )
  }, [predictedTools, searchQuery])

  const topMatch = filteredTools[0]

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

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Finding best tool...</p>
        </div>
      )}

      {!loading && filteredTools.length > 0 && (
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

      {!loading && predictedTools.length > 0 && filteredTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools match your search. Try a different query.</p>
        </div>
      )}

      {!loading && predictedTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools available. Enter text or upload an image to get started.</p>
        </div>
      )}
    </aside>
  )
}
