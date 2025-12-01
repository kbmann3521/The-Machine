import { useState, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { xml } from '@codemirror/lang-xml'
import { json } from '@codemirror/lang-json'
import { sql } from '@codemirror/lang-sql'
import { python } from '@codemirror/lang-python'
import { yaml } from '@codemirror/lang-yaml'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'
import { createTheme } from '@uiw/codemirror-themes'
import styles from '../styles/universal-input.module.css'

// Custom dark theme for CodeMirror
const customTheme = createTheme({
  theme: 'dark',
  settings: {
    background: '#1e1e1e',
    foreground: '#e0e0e0',
    caret: '#0066cc',
    selection: 'rgba(0, 102, 204, 0.3)',
    selectionMatch: 'rgba(0, 102, 204, 0.2)',
    lineHighlight: 'rgba(0, 102, 204, 0.05)',
    gutterBackground: '#2d2d2d',
    gutterForeground: '#888',
    gutterBorder: '#444',
  },
  styles: [],
})

export default function UniversalInput({ onInputChange, onImageChange, selectedTool, configOptions = {}, getToolExample, errorData = null }) {
  const getPlaceholder = () => {
    if (!selectedTool) {
      return "Type your text here... drag & drop or paste an image (Ctrl+V)"
    }

    if (getToolExample && selectedTool?.toolId) {
      const example = getToolExample(selectedTool.toolId, configOptions)
      if (example) {
        return example
      }
    }

    const staticPlaceholders = {
      'image-resizer': 'Upload an image (PNG, JPG, etc.) to resize for web or social media',
      'text-toolkit': 'Paste your article, blog post, or essay for complete text analysis',
      'word-counter': 'Paste your essay, article, or document to count words and characters',
      'case-converter': 'Paste text to convert between uppercase, lowercase, title case, etc.',
      'find-replace': 'Paste text and configure search patterns to find and replace',
      'remove-extras': 'Paste text with extra spaces or line breaks to clean up',
      'text-analyzer': 'Paste text to analyze readability, word frequency, and writing metrics',
      'base64-converter': 'Paste text or base64 string to encode or decode',
      'url-converter': 'Paste a URL or encoded string to convert formats',
      'html-entities-converter': 'Paste HTML content to encode or decode special characters',
      'html-formatter': 'Paste messy HTML code to format and indent properly',
      'plain-text-stripper': 'Paste HTML or formatted text to remove all styling and tags',
      'json-formatter': 'Paste JSON from an API or config file to format and validate',
      'reverse-text': 'Paste text to reverse character order',
      'slug-generator': 'Paste a title or heading to generate a URL-friendly slug',
      'regex-tester': 'Paste text and test regular expression patterns',
      'timestamp-converter': 'Paste a Unix timestamp or date to convert formats',
      'csv-json-converter': 'Paste CSV data from Excel or spreadsheets to convert to JSON',
      'markdown-html-converter': 'Paste Markdown or HTML content to convert between formats',
      'markdown-html-formatter': 'Paste Markdown or HTML content to convert and format',
      'xml-formatter': 'Paste XML data or configuration to format and validate',
      'yaml-formatter': 'Paste YAML config file to format and check syntax',
      'url-toolkit': 'Paste a URL to parse, validate, normalize, or manipulate',
      'url-parser': 'Paste a URL to extract and analyze components',
      'jwt-decoder': 'Paste a JWT token from your app to decode and inspect claims',
      'text-diff-checker': 'Paste your original text in the main field to compare versions',
      'color-converter': 'Paste a color value (hex, RGB, HSL, etc.) to convert formats',
      'checksum-calculator': 'Paste text to generate MD5, SHA1, SHA256 checksums',
      'escape-unescape': 'Paste text or escaped strings to convert encoding',
      'sort-lines': 'Paste text with multiple lines to sort alphabetically or numerically',
      'whitespace-visualizer': 'Paste text to visualize tabs, spaces, and line breaks',
      'ascii-unicode-converter': 'Paste text to convert between ASCII and Unicode formats',
      'punycode-converter': 'Paste an international domain name to convert to punycode',
      'binary-converter': 'Paste a number to convert between bases (binary, hex, octal, decimal)',
      'rot13-cipher': 'Paste text to apply or remove ROT13 encryption',
      'caesar-cipher': 'Paste text to apply Caesar cipher encryption',
      'css-formatter': 'Paste CSS code to format and beautify it',
      'sql-formatter': 'Paste SQL queries to format and validate',
      'http-status-lookup': 'Enter HTTP status code to see what it means',
      'mime-type-lookup': 'Enter file extension or content type to lookup MIME type',
      'http-header-parser': 'Paste HTTP headers to parse and analyze',
      'uuid-validator': 'Paste a UUID to validate format and detect version',
      'json-path-extractor': 'Paste JSON to extract data using JSONPath expressions',
      'image-to-base64': 'Upload an image to convert to base64',
      'svg-optimizer': 'Paste or upload SVG code to optimize',
      'unit-converter': 'Enter a value with unit to convert',
      'number-formatter': 'Paste numbers to format with separators or scientific notation',
      'timezone-converter': 'Paste a time and timezone to convert',
      'base-converter': 'Enter a number to convert between bases',
      'math-evaluator': 'Paste a math expression to evaluate',
      'keyword-extractor': 'Paste an article or text to extract keywords',
      'cron-tester': 'Paste a cron expression to test and preview schedule',
      'file-size-converter': 'Enter a file size to convert between units',
      'js-formatter': 'Paste JavaScript code to format or minify',
      'email-validator': 'Paste email addresses to validate format',
      'ip-validator': 'Paste IP addresses to validate',
      'ip-integer-converter': 'Paste IP address or integer to convert',
      'markdown-linter': 'Paste Markdown to check for formatting issues',
    }

    return staticPlaceholders[selectedTool.toolId] || "Type or paste content here..."
  }

  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  const getLanguage = () => {
    if (!selectedTool) return undefined
    
    const languageMap = {
      'js-formatter': javascript(),
      'javascript-minifier': javascript(),
      'json-formatter': json(),
      'xml-formatter': xml(),
      'html-formatter': html(),
      'markdown-html-formatter': markdown(),
      'markdown-html-converter': markdown(),
      'css-formatter': css(),
      'sql-formatter': sql(),
      'yaml-formatter': yaml(),
      'python-formatter': python(),
    }
    
    return languageMap[selectedTool.toolId]
  }

  const handleTextChange = (value) => {
    setInputText(value)
    setCharCount(value.length)
    onInputChange(value)
  }

  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
      setInputImage(file)
      onImageChange(file, e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setInputImage(null)
    onImageChange(null, null)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getInstructionText = () => {
    if (!selectedTool) return null

    const instructions = {
      'image-resizer': 'Upload an image to resize for web, mobile, or social media',
      'word-counter': 'Get detailed statistics on words, characters, and readability',
      'case-converter': 'Transform text case for titles, code, or any style you need',
      'find-replace': 'Search and replace with plain text or regex patterns',
      'remove-extras': 'Clean up extra spaces, tabs, and unnecessary line breaks',
      'text-analyzer': 'Analyze readability scores, word frequency, and writing quality',
      'base64-converter': 'Encode text to base64 or decode from base64',
      'url-converter': 'Encode or decode URL components and special characters',
      'html-entities-converter': 'Convert between HTML and entity-encoded text',
      'html-formatter': 'Beautify and indent HTML code for better readability',
      'plain-text-stripper': 'Remove HTML tags and formatting to get plain text',
      'json-formatter': 'Validate and format JSON with proper indentation',
      'reverse-text': 'Reverse text characters, words, or lines',
      'slug-generator': 'Create URL-friendly slugs from titles and headings',
      'regex-tester': 'Test regex patterns and see all matches highlighted',
      'timestamp-converter': 'Convert between Unix timestamps and human-readable dates',
      'csv-json-converter': 'Transform CSV spreadsheet data to JSON format',
      'markdown-html-converter': 'Convert between Markdown and HTML markup',
      'markdown-html-formatter': 'Format and convert between Markdown and HTML',
      'xml-formatter': 'Validate and format XML with proper structure',
      'yaml-formatter': 'Format YAML configuration files with correct indentation',
      'url-toolkit': 'Parse, validate, normalize, and manipulate URLs with advanced features',
      'url-parser': 'Extract and analyze URL components (domain, path, params, etc.)',
      'jwt-decoder': 'Decode and inspect JWT tokens and claims',
      'text-diff-checker': 'Compare two versions of text and highlight differences',
      'color-converter': 'Convert color values between hex, RGB, HSL, and more',
      'checksum-calculator': 'Generate MD5, SHA1, SHA256, and other checksums',
      'escape-unescape': 'Escape and unescape special characters in text',
      'sort-lines': 'Sort lines alphabetically or remove duplicates',
      'whitespace-visualizer': 'See hidden spaces, tabs, and line break characters',
      'ascii-unicode-converter': 'Convert between ASCII and Unicode encodings',
      'punycode-converter': 'Convert international domain names to punycode format',
      'binary-converter': 'Convert numbers between binary, hex, octal, and decimal',
      'rot13-cipher': 'Apply ROT13 text cipher for simple obfuscation',
      'caesar-cipher': 'Apply Caesar cipher with custom character shift amount',
      'css-formatter': 'Format and beautify CSS code with proper indentation',
      'sql-formatter': 'Format SQL queries with readable line breaks and indentation',
      'http-status-lookup': 'Look up HTTP status codes and their meanings',
      'mime-type-lookup': 'Find MIME types by file extension',
      'http-header-parser': 'Parse and analyze HTTP request and response headers',
      'uuid-validator': 'Validate UUID format and detect version',
      'json-path-extractor': 'Extract data from JSON using JSONPath expressions',
      'image-to-base64': 'Convert images to base64 for embedding in HTML or CSS',
      'svg-optimizer': 'Optimize SVG files by removing unnecessary code',
      'unit-converter': 'Convert between different units of measurement',
      'number-formatter': 'Format numbers with separators, decimals, or scientific notation',
      'timezone-converter': 'Convert times between different timezones',
      'base-converter': 'Convert numbers between different bases (binary, octal, hex)',
      'math-evaluator': 'Evaluate mathematical expressions and get results',
      'keyword-extractor': 'Automatically extract important keywords and topics',
      'cron-tester': 'Test cron expressions and preview execution schedule',
      'file-size-converter': 'Convert file sizes between different units (KB, MB, GB)',
      'js-formatter': 'Format, beautify, or minify JavaScript code',
      'email-validator': 'Validate email addresses and check format correctness',
      'ip-validator': 'Validate IPv4 and IPv6 addresses',
      'ip-integer-converter': 'Convert between IP addresses and integer representations',
      'markdown-linter': 'Check Markdown files for formatting issues and best practices',
    }

    return instructions[selectedTool.toolId] || null
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        {getInstructionText() && (
          <div className={styles.instructionLabel}>{getInstructionText()}</div>
        )}

        <div className={styles.inputFieldContainer}>
          <button
            className={styles.uploadImageButton}
            onClick={openFileDialog}
            title="Click to upload an image"
            type="button"
          >
            <svg className={styles.uploadImageIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload Image
          </button>

          <div
            className={`${styles.inputField} ${isDragging ? styles.dragging : ''} ${imagePreview ? styles.hasImage : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className={styles.fileInput}
            />
            <div className={styles.codeMirrorWrapper}>
              <CodeMirror
                value={inputText}
                onChange={handleTextChange}
                placeholder={getPlaceholder()}
                extensions={[getLanguage()].filter(Boolean)}
                className={styles.codeMirror}
                height="100%"
                theme={customTheme}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: false,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: false,
                  rectangularSelection: true,
                  highlightSelectionMatches: true,
                  searchKeymap: true,
                }}
              />
            </div>
          </div>
        </div>

        {imagePreview && (
          <div className={styles.imagePreview}>
            <div className={styles.previewHeader}>
              <span className={styles.previewLabel}>Image attached</span>
              <button
                className={styles.removeButton}
                onClick={removeImage}
                title="Remove image"
                type="button"
              >
                ✕
              </button>
            </div>
            <img
              src={imagePreview}
              alt="preview"
              className={styles.previewImage}
            />
          </div>
        )}
      </div>
    </div>
  )
}
