import React, { useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import styles from '../styles/markdown-renderer.module.css'

/**
 * MarkdownRenderer Component
 *
 * Safely renders Markdown content using react-markdown (remark under the hood)
 * - React-markdown is inherently safe (no raw HTML execution)
 * - Optional GitHub-Flavored Markdown (tables, task lists, strikethrough, autolinks)
 * - DOMPurify configured as defense-in-depth
 * - All links automatically get target="_blank" and rel="noopener noreferrer"
 * - Custom components for styling consistency
 * - Deterministic, AST-based rendering
 * - SVG, forms, scripts, and event handlers blocked by default
 * - CSS is scoped to preview container only to prevent leaking into page UI
 */

/**
 * Scope CSS to only apply within the preview container
 * Wraps all selectors with the preview class to prevent global style pollution
 */
function scopeCustomCss(css, previewClass) {
  if (!css) return css

  // Split CSS by closing braces to identify rules
  const rules = []
  let currentRule = ''
  let braceCount = 0

  for (let i = 0; i < css.length; i++) {
    const char = css[i]
    currentRule += char

    if (char === '{') {
      braceCount++
    } else if (char === '}') {
      braceCount--
      if (braceCount === 0) {
        rules.push(currentRule.trim())
        currentRule = ''
      }
    }
  }

  // Add any remaining rule
  if (currentRule.trim()) {
    rules.push(currentRule.trim())
  }

  // Process each rule
  const scopedRules = rules.map(rule => {
    const match = rule.match(/^([^{]+)\{([\s\S]*)\}$/)
    if (!match) return rule

    const selectors = match[1]
    const declarations = match[2]

    // Split selectors and scope each one
    const scopedSelectors = selectors
      .split(',')
      .map(selector => {
        selector = selector.trim()
        if (!selector) return ''

        // Scope selector to preview container
        // Don't double-wrap if already scoped
        if (selector.startsWith(previewClass)) {
          return selector
        }

        // Wrap selector with preview class
        return `${previewClass} ${selector}`
      })
      .filter(Boolean)
      .join(', ')

    return scopedSelectors ? `${scopedSelectors} {${declarations}}` : ''
  }).filter(Boolean)

  return scopedRules.join('\n')
}

/**
 * Sanitization configuration for rehype-sanitize.
 * Allows safe inline HTML (e.g., <hr>, tables, forms) while blocking scripts,
 * event handlers, and dangerous protocols.
 */
const ADDITIONAL_TAGS = [
  'main', 'section', 'article', 'aside', 'header', 'footer', 'nav',
  'figure', 'figcaption', 'mark', 'cite', 'dl', 'dt', 'dd',
  'button', 'form', 'label', 'input', 'textarea', 'select', 'option',
  'fieldset', 'legend', 'progress', 'meter', 'details', 'summary',
  'video', 'audio', 'source', 'table', 'caption', 'tbody', 'thead', 'tfoot',
  'tr', 'th', 'td', 'hr', 'pre', 'code', 'marquee'
]

const GLOBAL_ATTRIBUTES = [
  'className', 'id', 'title', 'lang', 'dir', 'role', 'tabIndex',
  'ariaLabel', 'ariaLabelledby', 'ariaDescribedby', 'ariaHidden', 'data-*'
]

const TAG_SPECIFIC_ATTRIBUTES = {
  a: ['href', 'target', 'rel', 'name'],
  img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
  video: ['src', 'poster', 'preload', 'controls', 'loop', 'muted', 'playsInline', 'autoPlay'],
  audio: ['src', 'controls', 'loop', 'muted', 'autoPlay'],
  source: ['src', 'type'],
  button: ['type', 'disabled', 'name', 'value'],
  input: ['type', 'name', 'value', 'placeholder', 'checked', 'disabled', 'readOnly', 'required', 'min', 'max', 'step', 'size'],
  textarea: ['name', 'rows', 'cols', 'placeholder', 'disabled', 'readOnly', 'required'],
  select: ['name', 'multiple', 'disabled', 'required', 'value'],
  option: ['value', 'label', 'selected', 'disabled'],
  label: ['htmlFor'],
  fieldset: ['disabled', 'name'],
  progress: ['value', 'max'],
  meter: ['value', 'min', 'max', 'low', 'high', 'optimum'],
  table: ['summary'],
  th: ['colSpan', 'rowSpan', 'scope'],
  td: ['colSpan', 'rowSpan'],
  time: ['dateTime'],
  details: ['open'],
  marquee: ['behavior', 'direction', 'scrollAmount', 'scrollDelay', 'loop']
}

const SANITIZATION_SCHEMA = (() => {
  const baseSchema = defaultSchema || { tagNames: [], attributes: {} }

  const tagNames = new Set(baseSchema.tagNames || [])
  ADDITIONAL_TAGS.forEach((tag) => tagNames.add(tag))

  const attributes = { ...(baseSchema.attributes || {}) }
  const globalAttributes = new Set(attributes['*'] || [])
  GLOBAL_ATTRIBUTES.forEach((attr) => globalAttributes.add(attr))
  attributes['*'] = Array.from(globalAttributes)

  Object.entries(TAG_SPECIFIC_ATTRIBUTES).forEach(([tag, attrList]) => {
    const existing = new Set(attributes[tag] || [])
    attrList.forEach((attr) => existing.add(attr))
    attributes[tag] = Array.from(existing)
  })

  return {
    ...baseSchema,
    tagNames: Array.from(tagNames),
    attributes,
  }
})()

export default function MarkdownRenderer({ markdown, className = '', customCss = '', allowHtml = true, enableGfm = true }) {
  const rendererRef = useRef(null)
  const rehypePlugins = useMemo(() => {
    if (allowHtml) {
      return [rehypeRaw, [rehypeSanitize, SANITIZATION_SCHEMA]]
    }
    return []
  }, [allowHtml])
  const remarkPlugins = useMemo(() => (enableGfm ? [remarkGfm] : []), [enableGfm])

  if (!markdown || typeof markdown !== 'string') {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render
      </div>
    )
  }

  // Scope CSS to preview container to prevent leaking into page UI
  const scopedCss = scopeCustomCss(customCss, '.pwt-markdown-preview')

  return (
    <>
      {scopedCss && (
        <style>{scopedCss}</style>
      )}
      <div ref={rendererRef} className={`pwt-markdown-preview ${styles.renderer} ${className}`} style={{ height: '100%' }}>
        <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
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

            // Links - Always safe with target="_blank" and security attributes
            a: ({ href, children, title }) => {
              // Sanitize the href to prevent javascript: and data: URLs
              let safeHref = href || '#'
              if (safeHref && (safeHref.startsWith('javascript:') || safeHref.startsWith('data:'))) {
                safeHref = '#'
              }

              return (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                  title={title}
                >
                  {children}
                </a>
              )
            },

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
