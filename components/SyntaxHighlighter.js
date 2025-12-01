import { useEffect, useRef } from 'react'
import Prism from 'prismjs'
import 'prismjs/themes/prism-tomorrow.css'
import styles from '../styles/syntax-highlighter.module.css'

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
  'escape-unescape': 'javascript',
  'base64-converter': 'text',
  'url-converter': 'text',
  'html-entities-converter': 'html',
  'csv-json-converter': 'json',
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
    <pre className={`${styles.preWrapper} ${className}`}>
      <code 
        ref={codeRef}
        className={`${styles.codeBlock} language-${lang}`}
      >
        {code}
      </code>
    </pre>
  )
}
