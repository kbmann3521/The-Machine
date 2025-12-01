import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

// Load common language components on client side only
if (typeof window !== 'undefined') {
  require('prismjs/components/prism-javascript')
  require('prismjs/components/prism-json')
  require('prismjs/components/prism-css')
  require('prismjs/components/prism-markup')
  require('prismjs/components/prism-yaml')
  require('prismjs/components/prism-sql')
}

// Map tool types/IDs to Prism language codes
const TOOL_LANGUAGE_MAP = {
  'js-formatter': 'javascript',
  'javascript-formatter': 'javascript',
  'json-formatter': 'json',
  'css-formatter': 'css',
  'scss-formatter': 'scss',
  'html-formatter': 'markup',
  'xml-formatter': 'markup',
  'yaml-formatter': 'yaml',
  'sql-formatter': 'sql',
  'markdown-formatter': 'markdown',
  'markdown-html-formatter': 'markdown',
  'python-formatter': 'python',
  'php-formatter': 'php',
  'java-formatter': 'java',
  'cpp-formatter': 'cpp',
  'csharp-formatter': 'csharp',
  'ruby-formatter': 'ruby',
  'go-formatter': 'go',
  'rust-formatter': 'rust',
  'typescript-formatter': 'typescript',
  'bash-formatter': 'bash',
  'shell-formatter': 'bash',
  'lua-formatter': 'lua',
  'r-formatter': 'r',
  'swift-formatter': 'swift',
  'kotlin-formatter': 'kotlin',
}

export default function SyntaxHighlighter({
  code = '',
  language = 'text',
  toolId = null,
  className = '',
}) {
  const codeRef = useRef(null)

  // Determine language from toolId if not provided
  let lang = language
  if (toolId && TOOL_LANGUAGE_MAP[toolId]) {
    lang = TOOL_LANGUAGE_MAP[toolId]
  }

  // Validate language is supported by Prism
  const validLanguages = [
    'javascript', 'json', 'css', 'scss', 'markup', 'html', 'xml',
    'yaml', 'sql', 'markdown', 'python', 'php', 'java', 'cpp',
    'csharp', 'ruby', 'go', 'rust', 'typescript', 'bash', 'lua',
    'r', 'swift', 'kotlin', 'text'
  ]

  if (!validLanguages.includes(lang)) {
    lang = 'text'
  }

  useEffect(() => {
    // Dynamically load language components only on client side
    if (typeof window !== 'undefined') {
      const loadLanguageComponent = async () => {
        try {
          switch (lang) {
            case 'javascript':
            case 'typescript':
            case 'json':
            case 'css':
            case 'scss':
            case 'markup':
            case 'html':
            case 'xml':
            case 'yaml':
            case 'sql':
            case 'markdown':
            case 'python':
            case 'php':
            case 'java':
            case 'cpp':
            case 'csharp':
            case 'ruby':
            case 'go':
            case 'rust':
            case 'bash':
            case 'lua':
            case 'r':
            case 'swift':
            case 'kotlin':
              await import(`prismjs/components/prism-${lang}`)
              break
            default:
              break
          }
        } catch (e) {
          // Language component not available, will use text highlighting
          console.debug(`Prism component for ${lang} not found`)
        }
      }

      loadLanguageComponent().then(() => {
        if (codeRef.current && code) {
          Prism.highlightElement(codeRef.current)
        }
      })
    }
  }, [code, lang])

  return (
    <pre
      style={{
        margin: 0,
        padding: '12px',
        background: 'transparent',
        fontSize: '13px',
        lineHeight: '1.5',
        fontFamily: "'Courier New', monospace",
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
      }}
    >
      <code
        ref={codeRef}
        className={`language-${lang} ${className}`}
        style={{
          margin: 0,
          padding: 0,
          fontSize: '13px',
          lineHeight: '1.5',
          fontFamily: "'Courier New', monospace",
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      >
        {code}
      </code>
    </pre>
  )
}
