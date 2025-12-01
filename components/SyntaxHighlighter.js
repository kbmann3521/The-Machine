import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'

// Import language components
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-sql'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-php'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-ruby'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-lua'
import 'prismjs/components/prism-r'
import 'prismjs/components/prism-swift'
import 'prismjs/components/prism-kotlin'

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
    if (codeRef.current && code) {
      Prism.highlightElement(codeRef.current)
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
