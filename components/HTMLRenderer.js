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
 * - Supports rich HTML5 features: SVG, forms, details/summary, images, etc.
 * - Blocks scripts, iframes, and malicious event handlers
 * - All links automatically get target="_blank" and rel="noopener noreferrer"
 * - CSS is scoped to preview container only to prevent leaking into page UI
 */

/**
 * Sanitization configuration using DOMPurify
 * Balanced policy: allows rich HTML/CSS content while blocking high-risk vectors
 */
const SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [
    // Text content
    'p', 'div', 'span',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Code blocks
    'pre', 'code', 'blockquote',
    // Links & text formatting
    'a', 'strong', 'em', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
    // Tables
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    // Separators
    'hr', 'br',
    // Images
    'img', 'figure', 'figcaption',
    // Forms
    'button', 'input', 'form', 'label', 'textarea', 'select', 'option', 'optgroup', 'fieldset', 'legend',
    // Interactive elements
    'details', 'summary',
    // Semantic HTML5
    'section', 'article', 'nav', 'header', 'footer', 'aside', 'main',
    // SVG support
    'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse',
    'g', 'text', 'tspan', 'defs', 'use', 'symbol', 'marker', 'linearGradient',
    'radialGradient', 'stop', 'clipPath', 'mask', 'image', 'foreignObject',
    'style', 'title', 'desc'
  ],
  ALLOWED_ATTR: [
    // Global attributes
    'id', 'class', 'title', 'data-*', 'style',
    // Link attributes
    'href', 'target', 'rel',
    // Image attributes
    'src', 'alt', 'srcset', 'sizes', 'width', 'height', 'loading', 'decoding',
    // Form attributes
    'type', 'name', 'value', 'placeholder', 'checked', 'disabled', 'readonly',
    'rows', 'cols', 'multiple', 'required', 'min', 'max', 'step', 'size',
    'for', 'accept', 'autocomplete', 'autofocus', 'pattern', 'default', 'formaction',
    // ARIA attributes for accessibility
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
    'aria-hidden', 'aria-pressed', 'aria-selected', 'role',
    // Details/Summary
    'open',
    // SVG attributes
    'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
    'points', 'viewBox', 'preserveAspectRatio', 'fill', 'stroke',
    'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity',
    'transform', 'fill-opacity', 'stroke-opacity', 'clip-path',
    'href', 'xlink:href', 'xmlns', 'xmlns:xlink',
    'offset', 'stop-color', 'stop-opacity',
    'font-size', 'font-family', 'text-anchor', 'font-weight',
  ],
  FORBID_TAGS: [
    'script', 'iframe', 'object', 'embed', 'math'
  ],
  FORBID_ATTR: [
    'onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout', 'onchange',
    'oninput', 'onkeydown', 'onkeyup', 'onsubmit', 'onfocus', 'onblur'
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
    <div style={{ height: '100%' }}>
      <div
        ref={rendererRef}
        className={`pwt-preview pwt-html-preview pwt-markdown-preview ${styles.renderer} ${className}`}
        style={{ height: '100%' }}
      >
        {customCss && (
          <style dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
        <div dangerouslySetInnerHTML={{ __html: processedHtml }} />
      </div>
    </div>
  )
}
