import React from 'react'
import styles from '../styles/tool-sidebar.module.css'

export default function ToolSidebar({ predictedTools, selectedTool, onSelectTool, loading }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h2>Recommended Tools</h2>
      </div>

      {loading && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Finding best tool...</p>
        </div>
      )}

      {!loading && predictedTools.length > 0 && (
        <div className={styles.toolsList}>
          {predictedTools.map((tool, index) => (
            <button
              key={tool.toolId}
              className={`${styles.toolItem} ${
                selectedTool?.toolId === tool.toolId ? styles.selected : ''
              }`}
              onClick={() => onSelectTool(tool)}
            >
              <div className={styles.toolRank}>#{index + 1}</div>
              <div className={styles.toolContent}>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.toolDescription}>{tool.description}</p>
                <div className={styles.toolScore}>
                  Match: {(tool.similarity * 100).toFixed(0)}%
                </div>
              </div>
            </button>
          ))}
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
