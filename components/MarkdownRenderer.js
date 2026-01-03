import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styles from '../styles/markdown-renderer.module.css'
import { scanSelectorsFromDOM } from '../lib/tools/selectorScanner'

/**
 * MarkdownRenderer Component
 *
 * Safely renders Markdown content using react-markdown + remark-gfm
 * - No raw HTML execution (safe by default)
 * - Supports tables, strikethrough, task lists, autolinks (GitHub Flavored Markdown)
 * - Custom components for styling consistency
 * - Deterministic, AST-based rendering
 */
export default function MarkdownRenderer({ markdown, className = '', customCss = '', onSelectorsDetected = null }) {
  const rendererRef = useRef(null)

  // Scan the rendered DOM for available selectors when component mounts or content changes
  useEffect(() => {
    if (!rendererRef.current || !onSelectorsDetected) return

    // Use requestAnimationFrame to ensure the DOM is fully painted before scanning
    const frameId = requestAnimationFrame(() => {
      if (!rendererRef.current) return
      const selectors = scanSelectorsFromDOM(rendererRef.current)
      onSelectorsDetected(selectors)
    })

    return () => cancelAnimationFrame(frameId)
  }, [markdown, customCss, onSelectorsDetected])

  if (!markdown || typeof markdown !== 'string') {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render
      </div>
    )
  }

  return (
    <>
      {customCss && (
        <style>{customCss}</style>
      )}
      <div ref={rendererRef} className={`pwt-markdown-preview ${styles.renderer} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className={styles.h1}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={styles.h2}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={styles.h3}>{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className={styles.h4}>{children}</h4>
          ),
          h5: ({ children }) => (
            <h5 className={styles.h5}>{children}</h5>
          ),
          h6: ({ children }) => (
            <h6 className={styles.h6}>{children}</h6>
          ),

          // Paragraphs and text
          p: ({ children }) => (
            <p className={styles.paragraph}>{children}</p>
          ),

          // Emphasis
          em: ({ children }) => (
            <em className={styles.emphasis}>{children}</em>
          ),
          strong: ({ children }) => (
            <strong className={styles.strong}>{children}</strong>
          ),

          // Code
          code: ({ inline, children }) => {
            if (inline) {
              return <code className={styles.inlineCode}>{children}</code>
            }
            return <code className={styles.codeBlock}>{children}</code>
          },
          pre: ({ children }) => (
            <pre className={styles.preBlock}>{children}</pre>
          ),

          // Links
          a: ({ href, children, title }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.link}
              title={title}
            >
              {children}
            </a>
          ),

          // Images (not rendered for safety, but show as link)
          img: ({ src, alt, title }) => (
            <span className={styles.imagePlaceholder}>
              <code className={styles.imageCode}>{alt || src}</code>
              <span className={styles.imageCaption}>
                (Image blocked for safety: {alt || 'No alt text'})
              </span>
            </span>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className={styles.unorderedList}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className={styles.orderedList}>{children}</ol>
          ),
          li: ({ children, checked }) => (
            <li className={styles.listItem}>
              {typeof checked === 'boolean' && (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className={styles.taskCheckbox}
                  aria-label="Task item"
                />
              )}
              {children}
            </li>
          ),

          // Tables (GitHub Flavored Markdown)
          table: ({ children }) => (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead>{children}</thead>,
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => <tr>{children}</tr>,
          th: ({ children, align }) => (
            <th className={styles.tableHeader} style={{ textAlign: align }}>
              {children}
            </th>
          ),
          td: ({ children, align }) => (
            <td className={styles.tableCell} style={{ textAlign: align }}>
              {children}
            </td>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className={styles.blockquote}>{children}</blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className={styles.divider} />,

          // Strikethrough (from remark-gfm)
          del: ({ children }) => (
            <del className={styles.strikethrough}>{children}</del>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
    </>
  )
}
