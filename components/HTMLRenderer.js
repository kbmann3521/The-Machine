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

  // Scope CSS to preview container to prevent leaking into page UI
  const scopedCss = scopeCustomCss(customCss, '.pwt-html-preview')

  return (
    <>
      {scopedCss && (
        <style>{scopedCss}</style>
      )}
      <div
        ref={rendererRef}
        className={`pwt-html-preview pwt-markdown-preview ${styles.renderer} ${className}`}
        style={{ height: '100%' }}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    </>
  )
}
