import { useEffect, useRef, forwardRef } from 'react'
import DOMPurify from 'dompurify'
import styles from '../styles/markdown-renderer.module.css'

/**
 * HTMLRenderer Component (Iframe-based)
 *
 * Safely renders raw HTML content inside a sandboxed iframe
 * - DOMPurify sanitizes before rendering
 * - Iframe provides true isolation from host page
 * - Media queries work correctly (iframe has own viewport)
 * - CSS is naturally scoped (no .pwt-preview hacks needed)
 * - Theme/dark mode completely isolated
 * - Selector detection works on iframe DOM
 * - Supports rich HTML5 features: SVG, forms, details/summary, images, etc.
 */

/**
 * Base sanitization configuration using DOMPurify
 * Balanced policy: allows rich HTML/CSS content while blocking high-risk vectors
 */
const BASE_SANITIZATION_CONFIG = {
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
    // Progress & meter
    'progress', 'meter',
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
    // iFrame attributes
    'sandbox', 'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'srcdoc',
    // SVG attributes
    'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2',
    'points', 'viewBox', 'preserveAspectRatio', 'fill', 'stroke',
    'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity',
    'transform', 'fill-opacity', 'stroke-opacity', 'clip-path',
    'href', 'xlink:href', 'xmlns', 'xmlns:xlink',
    'offset', 'stop-color', 'stop-opacity',
    'font-size', 'font-family', 'text-anchor', 'font-weight',
  ],
  KEEP_CONTENT: true,
  RETURN_DOM_FRAGMENT: false,
  RETURN_DOM: false
}

/**
 * Creates a sanitization config based on whether scripts and iframes are allowed
 */
function getSanitizationConfig(allowScripts = false, allowIframes = false) {
  const forbiddenTags = ['object', 'embed', 'math']

  // Add script and iframe to forbidden list based on flags
  if (!allowScripts) forbiddenTags.push('script')
  if (!allowIframes) forbiddenTags.push('iframe')

  const config = {
    ...BASE_SANITIZATION_CONFIG,
    FORBID_TAGS: forbiddenTags,
    ALLOW_DATA_ATTR: true,  // Allow data-* attributes
    FORBID_ATTR: allowScripts
      ? []  // Allow all attributes (including event handlers) when scripts are enabled
      : [  // Default: block event handlers
        'onerror', 'onclick', 'onload', 'onmouseover', 'onmouseout', 'onchange',
        'oninput', 'onkeydown', 'onkeyup', 'onsubmit', 'onfocus', 'onblur'
      ],
  }

  // When scripts are allowed, add 'script' to ALLOWED_TAGS
  if (allowScripts && !config.ALLOWED_TAGS.includes('script')) {
    config.ALLOWED_TAGS = [...config.ALLOWED_TAGS, 'script']
  }

  // When iframes are allowed, add 'iframe' to ALLOWED_TAGS
  if (allowIframes && !config.ALLOWED_TAGS.includes('iframe')) {
    config.ALLOWED_TAGS = [...config.ALLOWED_TAGS, 'iframe']
  }

  return config
}

const HTMLRenderer = forwardRef(({ html, className = '', customCss = '', customJs = '', allowScripts = false, allowIframes = false }, ref) => {
  const iframeRef = ref || useRef(null)
  const isInitializedRef = useRef(false)

  // Build the complete iframe document with all CSS and HTML (only on html change)
  useEffect(() => {
    if (!iframeRef.current || !html) return

    try {
      const sanitizationConfig = getSanitizationConfig(allowScripts, allowIframes)

      // Sanitize the HTML (formatter output should already be well-formed)
      const sanitizedHtml = DOMPurify.sanitize(html, sanitizationConfig)

      // Build the complete HTML document for the iframe
      // customCss (serialized rules) is placed at end so it overrides via cascade
      const iframeDoc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html {
      background: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
    }
    body {
      background: #ffffff;
      color: #000000;
      padding: 16px;
      overflow-y: auto;
      overflow-x: hidden;
    }
  </style>
</head>
<body>
  ${sanitizedHtml}
  <style id="custom-css">${customCss || ''}</style>
  ${customJs && allowScripts ? `<script>${customJs}</script>` : ''}
</body>
</html>`

      // Set iframe content using srcdoc
      iframeRef.current.srcdoc = iframeDoc
      isInitializedRef.current = true
    } catch (error) {
      console.error('[HTMLRenderer] Error building iframe document:', error)
    }
  }, [html, allowScripts, allowIframes])

  // Update only the custom CSS without reloading the iframe
  useEffect(() => {
    if (!iframeRef.current || !isInitializedRef.current) return

    try {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document
      if (!iframeDoc) return

      let styleTag = iframeDoc.getElementById('custom-css')
      if (!styleTag) {
        // Create the style tag if it doesn't exist
        styleTag = iframeDoc.createElement('style')
        styleTag.id = 'custom-css'

        // Append to head if available, otherwise body, otherwise return early
        if (iframeDoc.head) {
          iframeDoc.head.appendChild(styleTag)
        } else if (iframeDoc.body) {
          iframeDoc.body.appendChild(styleTag)
        } else {
          // Document not ready yet, skip this update
          return
        }
      }

      // Update the style content without reloading
      styleTag.textContent = customCss || ''
    } catch (error) {
      console.error('[HTMLRenderer] Error updating custom CSS:', error)
    }
  }, [customCss])

  if (!html || typeof html !== 'string') {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render
      </div>
    )
  }

  return (
    <iframe
      ref={iframeRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        display: 'block',
        backgroundColor: '#ffffff',
      }}
      sandbox={`allow-same-origin ${allowScripts ? 'allow-scripts' : ''} ${allowIframes ? 'allow-popups allow-modals' : ''}`}
      title="HTML Preview"
    />
  )
})

HTMLRenderer.displayName = 'HTMLRenderer'

export default HTMLRenderer
