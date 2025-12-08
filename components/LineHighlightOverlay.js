import React, { useRef, useEffect, useState } from 'react'
import styles from '../styles/line-highlight-overlay.module.css'

export default function LineHighlightOverlay({ inputText, validationErrors = [], lintingWarnings = [] }) {
  const overlayRef = useRef(null)
  const [scrollOffset, setScrollOffset] = useState(0)

  useEffect(() => {
    const textarea = overlayRef.current?.parentElement?.querySelector('textarea')
    if (!textarea) return

    const handleScroll = () => {
      setScrollOffset(textarea.scrollTop)
    }

    textarea.addEventListener('scroll', handleScroll)
    return () => textarea.removeEventListener('scroll', handleScroll)
  }, [])

  if (!inputText || (!validationErrors.length && !lintingWarnings.length)) {
    return null
  }

  const lines = inputText.split('\n')

  // Create a map of line numbers to errors/warnings
  const lineHighlights = {}

  validationErrors.forEach(error => {
    if (error.line !== null && error.line !== undefined) {
      const lineNum = error.line - 1 // Convert to 0-indexed
      if (!lineHighlights[lineNum]) {
        lineHighlights[lineNum] = { errors: [], warnings: [] }
      }
      lineHighlights[lineNum].errors.push(error)
    }
  })

  lintingWarnings.forEach(warning => {
    if (warning.line !== null && warning.line !== undefined) {
      const lineNum = warning.line - 1 // Convert to 0-indexed
      if (!lineHighlights[lineNum]) {
        lineHighlights[lineNum] = { errors: [], warnings: [] }
      }
      lineHighlights[lineNum].warnings.push(warning)
    }
  })

  return (
    <div className={styles.overlay}>
      {lines.map((line, idx) => {
        const highlight = lineHighlights[idx]
        let highlightClass = ''
        let backgroundColor = 'transparent'

        if (highlight) {
          if (highlight.errors.length > 0) {
            highlightClass = styles.errorLine
            backgroundColor = 'rgba(239, 83, 80, 0.1)'
          } else if (highlight.warnings.length > 0) {
            highlightClass = styles.warningLine
            backgroundColor = 'rgba(255, 167, 38, 0.1)'
          }
        }

        return (
          <div
            key={idx}
            className={`${styles.highlightLine} ${highlightClass}`}
            style={{ backgroundColor }}
          />
        )
      })}
    </div>
  )
}
