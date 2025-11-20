import React, { useState, useMemo } from 'react'
import styles from '../styles/tool-sidebar.module.css'

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

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <input
          type="text"
          placeholder="Search tools..."
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
          {filteredTools.map((tool, index) => (
            <article
              key={tool.toolId}
              className={`${styles.toolItem} ${
                selectedTool?.toolId === tool.toolId ? styles.selected : ''
              }`}
              onClick={() => onSelectTool(tool)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectTool(tool)}
              role="button"
              tabIndex={0}
              aria-pressed={selectedTool?.toolId === tool.toolId}
            >
              <div className={styles.toolRank}>#{index + 1}</div>
              <section className={styles.toolContent}>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.toolDescription}>{tool.description}</p>
                <div className={styles.toolScore}>
                  Match: {(tool.similarity * 100).toFixed(0)}%
                </div>
              </section>
            </article>
          ))}
        </nav>
      )}

      {!loading && predictedTools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tools available. Enter text or upload an image to get started.</p>
        </div>
      )}
    </aside>
  )
}
