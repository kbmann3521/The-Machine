import React, { useRef } from 'react'
import DOMPurify from 'dompurify'
import styles from '../styles/markdown-renderer.module.css'

/**
 * HTMLRenderer Component
 *
 * Safely renders raw HTML content
 * - DOMPurify sanitizes before rendering
 * - Uses dangerouslySetInnerHTML for direct HTML injection
 * - Selector detection works on the rendered output
 * - SVG, forms, scripts, and event handlers blocked by default
 * - All links automatically get target="_blank" and rel="noopener noreferrer"
 */

/**
 * Sanitization configuration using DOMPurify
 * Strict default policy to block high-risk vectors
 */
const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'div', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'pre', 'code', 'blockquote',
    'a', 'strong', 'em', 'del',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'hr', 'br'
  ],
  ALLOWED_ATTR: [
    'href', 'title',
    'class', 'id'
  ],
  FORBID_TAGS: [
    'script', 'iframe', 'object', 'embed', 'form', 'svg', 'math'
  ],
  FORBID_ATTR: [
    'style', 'onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout'
  ],
  KEEP_CONTENT: true
}

export default function HTMLRenderer({ html, className = '', customCss = '' }) {
  const rendererRef = useRef(null)

  if (!html || typeof html !== 'string') {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render
      </div>
    )
  }

  // Sanitize the HTML before rendering
  const sanitizedHtml = DOMPurify.sanitize(html, SANITIZATION_CONFIG)

  // Post-process to add safe attributes to links
  const processedHtml = sanitizedHtml.replace(
    /<a\s+(?![^>]*target=)/gi,
    '<a target="_blank" rel="noopener noreferrer" '
  )

  if (!processedHtml.trim()) {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render (sanitization removed all content)
      </div>
    )
  }

  return (
    <>
      {customCss && (
        <style>{customCss}</style>
      )}
      <div
        ref={rendererRef}
        className={`pwt-html-preview pwt-markdown-preview ${styles.renderer} ${className}`}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </>
  )
}
