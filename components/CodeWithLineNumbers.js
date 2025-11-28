import React, { useRef, useEffect } from 'react'
import LineNumbers from './LineNumbers'
import styles from '../styles/code-with-line-numbers.module.css'

export default function CodeWithLineNumbers({ content = '', children = null, isTextarea = false, textareaRef = null }) {
  const contentRef = useRef(null)
  const lineNumbersRef = useRef(null)

  const handleScroll = (scrollTop) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop
    }
  }

  useEffect(() => {
    const handleContentScroll = () => {
      if (contentRef.current && lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = contentRef.current.scrollTop
      }
    }

    const element = isTextarea ? textareaRef?.current : contentRef.current
    if (element) {
      element.addEventListener('scroll', handleContentScroll)
      return () => element.removeEventListener('scroll', handleContentScroll)
    }
  }, [isTextarea, textareaRef])

  return (
    <div className={styles.codeContainer}>
      <LineNumbers ref={lineNumbersRef} content={content} />
      <div className={styles.contentWrapper}>
        {isTextarea ? (
          children
        ) : (
          <pre ref={contentRef} className={styles.codeBlock}>
            <code>{content}</code>
          </pre>
        )}
      </div>
    </div>
  )
}
