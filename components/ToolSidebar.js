import React, { useState, useMemo } from 'react'
import styles from '../styles/tool-sidebar.module.css'

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
