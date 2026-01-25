import { useEffect, useRef } from 'react'
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
  KEEP_CONTENT: true
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

export default function HTMLRenderer({ html, className = '', customCss = '', customJs = '', allowScripts = false, allowIframes = false }) {
  const rendererRef = useRef(null)
  const containerRef = useRef(null)

  if (!html || typeof html !== 'string') {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render
      </div>
    )
  }

  // Get appropriate sanitization config based on allowScripts and allowIframes flags
  const sanitizationConfig = getSanitizationConfig(allowScripts, allowIframes)

  // Special handling: Extract iframes with srcdoc before sanitization
  // DOMPurify may strip srcdoc attributes, so we need to preserve them
  const iframeMap = new Map()
  let htmlWithoutIframes = html
  let iframeCounter = 0

  if (allowIframes) {
    // Find all iframes with srcdoc attributes by manually parsing
    // Search for srcdoc=", find its closing quote, then extract the iframe tag
    let searchPos = 0
    const srcdocStartRegex = /\bsrcdoc\s*=\s*(["'])/g

    while (true) {
      srcdocStartRegex.lastIndex = searchPos
      const match = srcdocStartRegex.exec(htmlWithoutIframes)
      if (!match) break

      const quoteChar = match[1] // The quote character used (either " or ')
      const contentStart = match.index + match[0].length

      // Find the closing quote of the same type
      let contentEnd = contentStart
      let found = false
      while (contentEnd < htmlWithoutIframes.length) {
        if (htmlWithoutIframes[contentEnd] === quoteChar && htmlWithoutIframes[contentEnd - 1] !== '\\') {
          found = true
          break
        }
        contentEnd++
      }

      if (!found) {
        searchPos = match.index + 1
        continue // Unclosed quote
      }

      const srcdocContent = htmlWithoutIframes.substring(contentStart, contentEnd)

      // Find the start of the iframe tag by searching backwards from srcdoc position
      let iframeStart = match.index - 1
      while (iframeStart >= 0 && htmlWithoutIframes[iframeStart] !== '<') {
        iframeStart--
      }

      if (iframeStart < 0 || !htmlWithoutIframes.substring(iframeStart, iframeStart + 7).toLowerCase().startsWith('<iframe')) {
        searchPos = match.index + 1
        continue // Not part of an iframe
      }

      // Find the end of the iframe tag (next > after the srcdoc closing quote)
      let iframeEnd = contentEnd + 1
      let depth = 0
      while (iframeEnd < htmlWithoutIframes.length) {
        if (htmlWithoutIframes[iframeEnd] === '"' || htmlWithoutIframes[iframeEnd] === "'") {
          // Skip quoted strings
          const quoteType = htmlWithoutIframes[iframeEnd]
          iframeEnd++
          while (iframeEnd < htmlWithoutIframes.length && htmlWithoutIframes[iframeEnd] !== quoteType) {
            if (htmlWithoutIframes[iframeEnd] === '\\') iframeEnd++ // Skip escaped chars
            iframeEnd++
          }
          iframeEnd++
        } else if (htmlWithoutIframes[iframeEnd] === '>') {
          break
        } else {
          iframeEnd++
        }
      }

      if (iframeEnd >= htmlWithoutIframes.length) {
        searchPos = match.index + 1
        continue // No closing >
      }

      const fullTag = htmlWithoutIframes.substring(iframeStart, iframeEnd + 1)
      const placeholder = `<div data-iframe-placeholder="${iframeCounter}" style="display:none;"></div>`

      iframeMap.set(iframeCounter, {
        srcdocContent: srcdocContent,
        fullTag: fullTag
      })

      // Replace iframe with placeholder
      htmlWithoutIframes = htmlWithoutIframes.replace(fullTag, placeholder)
      searchPos = iframeEnd + 1
      iframeCounter++
    }
  }

  // Sanitize the HTML (styles and iframes are now replaced with placeholders)
  const sanitizedHtml = DOMPurify.sanitize(htmlWithoutIframes, sanitizationConfig)

  // Restore iframes with their original srcdoc content
  let processedHtml = sanitizedHtml

  iframeMap.forEach((iframeData, index) => {
    const placeholder = `<div data-iframe-placeholder="${index}" style="display:none;"></div>`

    // Use Base64 encoding to avoid any escaping issues with special characters
    // This ensures the full srcdoc content is preserved exactly as-is
    let encoded = ''
    try {
      encoded = btoa(unescape(encodeURIComponent(iframeData.srcdocContent)))
    } catch (e) {
      console.error('Error encoding iframe srcdoc:', e)
      encoded = ''
    }

    const restoredIframe = `<iframe data-srcdoc-b64="${encoded}" sandbox="allow-scripts allow-popups allow-modals"></iframe>`
    processedHtml = processedHtml.replace(placeholder, restoredIframe)
  })

  // Post-process to add safe attributes to links
  processedHtml = processedHtml.replace(
    /<a\s+(?![^>]*target=)/gi,
    '<a target="_blank" rel="noopener noreferrer" '
  )

  // Don't inject JS into HTML string - we'll handle it separately in useEffect
  // This avoids double-execution and ensures proper DOM context

  if (!processedHtml.trim()) {
    return (
      <div className={`${styles.emptyMessage} ${className}`}>
        No content to render (sanitization removed all content)
      </div>
    )
  }

  // Handle iframes: set srcdoc content from Base64-encoded data attribute
  // This approach bypasses DOMPurify's attribute filtering by encoding the content
  useEffect(() => {
    if (!allowIframes || !containerRef.current) return

    const iframes = containerRef.current.querySelectorAll('iframe[data-srcdoc-b64]')

    iframes.forEach((iframe) => {
      const encoded = iframe.getAttribute('data-srcdoc-b64')

      if (encoded) {
        try {
          // Decode Base64 back to original HTML
          const decoded = decodeURIComponent(escape(atob(encoded)))

          // Set the actual srcdoc property
          iframe.srcdoc = decoded

          // Remove the temporary data attribute
          iframe.removeAttribute('data-srcdoc-b64')
        } catch (error) {
          console.error('Error decoding/setting iframe srcdoc:', error)
        }
      }
    })
  }, [processedHtml, allowIframes])

  // Handle script execution after HTML is injected
  useEffect(() => {
    if (!allowScripts || !containerRef.current) return

    // Find all script tags that haven't been executed yet
    const scripts = containerRef.current.querySelectorAll('script:not([data-executed])')

    scripts.forEach(script => {
      // Mark this script as executed to avoid re-executing on subsequent renders
      script.setAttribute('data-executed', 'true')

      // If the script has a src attribute, we can't easily execute it from here
      // For now, we'll handle inline scripts only
      if (!script.src && script.textContent) {
        try {
          // Execute the script in global context using Function
          // This ensures proper scope and access to DOM/window
          const fn = new Function(script.textContent)
          fn.call(window)
        } catch (error) {
          console.error('Error executing script:', error)
        }
      }
    })
  }, [processedHtml, allowScripts])

  // Handle custom JS execution by creating and appending a script element
  // This mimics how inline scripts work in HTML and ensures proper execution context
  useEffect(() => {
    if (!customJs || !allowScripts || !rendererRef.current) return

    console.log('[HTMLRenderer] Setting up custom JS execution...')
    console.log('[HTMLRenderer] Custom JS content:', customJs.substring(0, 100) + '...')

    // Wait for the next render cycle, then wait for the DOM to be fully ready
    let timeoutId = setTimeout(() => {
      if (!rendererRef.current) {
        console.warn('[HTMLRenderer] rendererRef is no longer available')
        return
      }

      try {
        // Clean up any existing custom scripts BEFORE adding new ones
        // This prevents duplicate script execution and variable redeclaration errors
        const existingScripts = rendererRef.current.querySelectorAll('script[data-custom-js="true"]')
        existingScripts.forEach(script => script.remove())

        // Create a script element just like an inline script in HTML
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.setAttribute('data-custom-js', 'true')

        // Wrap the custom JS in an IIFE to create a new scope
        // This prevents variable redeclaration errors when code re-runs
        const wrappedJs = `(function() {\n${customJs}\n})()`

        // Set the script content
        script.textContent = wrappedJs

        // Append to the renderer (not container) so it's at the document level
        // This ensures it has access to all DOM elements
        rendererRef.current.appendChild(script)

        console.log('[HTMLRenderer] Custom JS script appended and should be executing now')
      } catch (error) {
        console.error('[HTMLRenderer] Failed to setup custom JS:', error)
      }
    }, 150) // 150ms gives plenty of time for React to finish rendering

    // Cleanup
    return () => {
      clearTimeout(timeoutId)
      // Remove custom scripts on unmount
      if (rendererRef.current) {
        const scripts = rendererRef.current.querySelectorAll('script[data-custom-js="true"]')
        scripts.forEach(script => script.remove())
      }
    }
  }, [customJs, allowScripts])


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
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: processedHtml }} />
      </div>
    </div>
  )
}
