import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import styles from '../styles/line-numbers.module.css'

const LineNumbers = forwardRef(({ content = '', onScroll = null, lineHeight = 1.5 }, ref) => {
  const containerRef = useRef(null)

  useImperativeHandle(ref, () => ({
    scrollTop: (value) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = value
      }
    },
    get scrollTop() {
      return containerRef.current?.scrollTop || 0
    },
    set scrollTop(value) {
      if (containerRef.current) {
        containerRef.current.scrollTop = value
      }
    }
  }), [])

  useEffect(() => {
    if (onScroll) {
      const handleScroll = (e) => {
        onScroll(e.target.scrollTop, e.target.scrollLeft)
      }
      const container = containerRef.current
      if (container) {
        container.addEventListener('scroll', handleScroll)
        return () => container.removeEventListener('scroll', handleScroll)
      }
    }
  }, [onScroll])

  const lines = content ? content.split('\n') : ['']
  const lineCount = lines.length

  return (
    <div className={styles.lineNumbersContainer} ref={containerRef}>
      <div className={styles.lineNumbersList} style={{ lineHeight: `${lineHeight}` }}>
        {Array.from({ length: lineCount }, (_, i) => (
          <div key={i + 1} className={styles.lineNumber}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  )
})

LineNumbers.displayName = 'LineNumbers'

export default LineNumbers
