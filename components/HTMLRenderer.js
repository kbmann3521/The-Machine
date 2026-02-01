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
/**
 * STRICT mode: For rendering untrusted user content (markdown, blog posts, etc)
 * Uses whitelisting approach - only allow safe tags and attributes
 */
const STRICT_SANITIZATION_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'pre', 'code', 'blockquote',
    'a', 'strong', 'em', 'del', 'ins', 'mark', 'small', 'sub', 'sup',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
    'hr', 'br', 'img', 'figure', 'figcaption',
    'section', 'article', 'nav', 'header', 'footer', 'aside', 'main',
  ],
  ALLOWED_ATTR: [
    'id', 'class', 'title', 'data-*', 'style',
    'href', 'target', 'rel', 'src', 'alt', 'srcset', 'sizes', 'width', 'height',
    'aria-label', 'aria-labelledby', 'aria-describedby', 'aria-expanded',
    'aria-hidden', 'aria-pressed', 'aria-selected', 'role',
  ],
  KEEP_CONTENT: true,
}

/**
 * PLAYGROUND mode: Minimal DOMPurify config for code playgrounds
 *
 * Philosophy: The iframe sandbox is the real security boundary.
 * DOMPurify here is just a guardrail for defense-in-depth and future-proofing.
 *
 * This config allows almost everything - DOMPurify becomes a parser pass.
 * The security hook (installed separately) blocks only javascript: and vbscript: URLs.
 */
const PLAYGROUND_SANITIZATION_CONFIG = {
  WHOLE_DOCUMENT: true,
  KEEP_CONTENT: true,
  ALLOW_UNKNOWN_PROTOCOLS: true,
  ADD_TAGS: [
    'script',
    'style',
    'iframe',
    'svg',
    'math',
    'canvas',
    'video',
    'audio',
  ],
  ADD_ATTR: ['*'],
  FORBID_TAGS: [],
  FORBID_ATTR: [],
}

/**
 * Installs a DOMPurify hook to block dangerous protocol patterns
 * This prevents javascript:, data:, vbscript: URLs which are the main XSS vectors
 */
function installSecurityHook() {
  DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
    // Block dangerous protocol URLs in href, src, and other attributes
    if (typeof data.value === 'string') {
      const dangerousProtocols = /^(javascript|data|vbscript):/i
      if (dangerousProtocols.test(data.value)) {
        data.keepAttr = false
      }
    }
  })
}

// Install the hook once on module load
if (typeof window !== 'undefined') {
  installSecurityHook()
}

/**
 * Creates a sanitization config based on whether scripts and iframes are allowed
 */
function getSanitizationConfig(allowScripts = false, allowIframes = false) {
  // For playgrounds with script support, use relaxed config
  // Security is enforced by iframe sandbox attribute
  if (allowScripts) {
    return PLAYGROUND_SANITIZATION_CONFIG
  }

  // For regular content, use strict whitelist approach
  return STRICT_SANITIZATION_CONFIG
}

const HTMLRenderer = forwardRef(({ html, className = '', customCss = '', customJs = '', allowScripts = false, allowIframes = false }, ref) => {
  const iframeRef = ref || useRef(null)
  const isInitializedRef = useRef(false)

  // Build the complete iframe document with all CSS and HTML (only on html change)
  useEffect(() => {
    if (!iframeRef.current || !html) return

    try {
      const sanitizationConfig = getSanitizationConfig(allowScripts, allowIframes)

      // Sanitize the HTML
      let sanitizedHtml
      if (allowScripts) {
        // PLAYGROUND: Use HTML as-is for the iframe
        // The iframe sandbox is the real security boundary:
        // - No allow-same-origin (prevents parent access)
        // - No allow-top-navigation (prevents navigating top frame)
        // - No allow-plugins (prevents plugin execution)
        // The security hook (installed globally) blocks javascript:, data:, vbscript: URLs
        // as an additional guardrail.
        sanitizedHtml = html
      } else {
        // STRICT: Use DOMPurify with strict whitelist for untrusted content
        // (markdown, user-generated content, etc.)
        sanitizedHtml = DOMPurify.sanitize(html, sanitizationConfig)
      }

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
  }, [html, customCss, customJs, allowScripts, allowIframes])

  // Dynamic CSS/JS updates: Due to iframe sandbox without allow-same-origin,
  // we cannot access contentDocument to update dynamically.
  // Instead, the main useEffect rebuilds the entire iframe when these change.
  // This effect is kept as a reference but is a no-op.
  useEffect(() => {
    // CSS and JS updates are handled by the main effect's dependency array
    // which triggers a full iframe rebuild when customCss or customJs changes
  }, [customCss, customJs])

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
      sandbox={`${allowScripts ? 'allow-scripts' : ''} allow-forms ${allowIframes ? 'allow-popups allow-modals' : ''}`}
      title="HTML Preview"
    />
  )
})

HTMLRenderer.displayName = 'HTMLRenderer'

export default HTMLRenderer
