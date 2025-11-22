import React, { useState, useRef } from 'react'
import styles from '../styles/universal-input.module.css'

export default function UniversalInput({ onInputChange, onImageChange, selectedTool, configOptions = {}, getToolExample }) {
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
      'xml-formatter': 'Paste XML data or configuration to format and validate',
      'yaml-formatter': 'Paste YAML config file to format and check syntax',
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
      'binary-converter': 'Paste a binary, hex, or octal number to convert formats',
      'rot13-cipher': 'Paste text to apply ROT13 cipher for simple obfuscation',
      'caesar-cipher': 'Paste text to apply Caesar cipher with custom shift',
      'css-formatter': 'Paste minified CSS code to format and indent properly',
      'sql-formatter': 'Paste a SQL query to format and improve readability',
      'http-status-lookup': 'Enter an HTTP status code (e.g., 404, 500) to see what it means',
      'mime-type-lookup': 'Enter a file extension (e.g., .jpg, .pdf) to find its MIME type',
      'http-header-parser': 'Paste HTTP headers from a request or response to analyze',
      'uuid-validator': 'Paste a UUID to validate format and version',
      'json-path-extractor': 'Paste JSON data to extract and navigate with JSONPath expressions',
      'image-to-base64': 'Upload an image to convert to base64 for embedding in HTML/CSS',
      'svg-optimizer': 'Paste SVG code to optimize and reduce file size',
      'unit-converter': 'Enter a value with unit (e.g., 5km, 100lb, 32°C) to convert',
      'number-formatter': 'Enter a number to format with separators, decimals, or notation',
      'timezone-converter': 'Enter a time (e.g., 2:30 PM, 14:30) to convert between timezones',
      'base-converter': 'Enter a number to convert between decimal, binary, hex, octal',
      'math-evaluator': 'Paste a math expression (e.g., (10 + 5) * 2) to calculate result',
      'keyword-extractor': 'Paste an article or text to automatically extract key topics',
      'cron-tester': 'Paste a cron expression to test schedule and see next run times',
      'file-size-converter': 'Enter a file size (e.g., 1024MB, 5GB) to convert units',
      'js-formatter': 'Paste JavaScript code to format, beautify, or minify',
      'html-minifier': 'Paste HTML code to minify and reduce file size',
      'email-validator': 'Enter an email address to validate format and syntax',
      'ip-validator': 'Enter an IP address (IPv4 or IPv6) to validate format',
      'ip-to-integer': 'Paste an IP address to convert to its integer representation',
      'integer-to-ip': 'Paste an integer to convert to an IP address',
      'ip-range-calculator': 'Paste an IP with CIDR notation (e.g., 192.168.1.0/24) to analyze',
      'markdown-linter': 'Paste Markdown content to check for formatting issues and lint errors',
    }

    return staticPlaceholders[selectedTool.toolId] || "Type or paste content here..."
  }
  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleTextChange = (e) => {
    const text = e.target.value
    setInputText(text)
    setCharCount(text.length)
    onInputChange(text, inputImage, imagePreview)
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
      onInputChange(inputText, file, e.target.result)
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

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault()
          const file = items[i].getAsFile()
          if (file) {
            handleImageFile(file)
          }
          break
        }
      }
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setInputImage(null)
    onImageChange(null, null)
    onInputChange(inputText, null, null)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const getInstructionText = () => {
    if (!selectedTool) return null

    const instructions = {
      'image-resizer': 'Upload an image to resize',
      'word-counter': 'Paste your text to count words, characters, sentences, and lines',
      'case-converter': 'Enter text to convert between different case styles',
      'find-replace': 'Paste text and configure find/replace options',
      'remove-extras': 'Paste text with extra spaces and line breaks to clean',
      'text-analyzer': 'Paste text to analyze readability and generate statistics',
      'base64-converter': 'Paste text or base64 string to encode/decode',
      'url-converter': 'Paste text or URL-encoded string to encode/decode',
      'html-entities-converter': 'Paste HTML content to convert entities',
      'html-formatter': 'Paste HTML code to format and beautify',
      'plain-text-stripper': 'Paste HTML or styled text to strip formatting',
      'json-formatter': 'Paste JSON code to format and validate',
      'reverse-text': 'Paste text to reverse character order',
      'slug-generator': 'Paste text to convert to URL-friendly slug',
      'regex-tester': 'Paste text and test regex patterns',
      'timestamp-converter': 'Paste Unix timestamp or date to convert',
      'csv-json-converter': 'Paste CSV data or JSON to convert',
      'markdown-html-converter': 'Paste Markdown or HTML to convert',
      'xml-formatter': 'Paste XML code to format and beautify',
      'yaml-formatter': 'Paste YAML configuration to format',
      'url-parser': 'Paste a URL to parse components',
      'jwt-decoder': 'Paste a JWT token to decode',
      'text-diff-checker': 'Paste text to compare with another',
      'color-converter': 'Paste color value (hex, rgb, hsl, etc.)',
      'checksum-calculator': 'Paste text to calculate checksums',
      'escape-unescape': 'Paste text or escaped strings to convert',
      'sort-lines': 'Paste text with multiple lines to sort',
      'whitespace-visualizer': 'Paste text to visualize whitespace and special characters',
      'ascii-unicode-converter': 'Paste ASCII text or Unicode codes to convert',
      'punycode-converter': 'Paste domain name or punycode to convert',
      'binary-converter': 'Paste binary, hex, octal, or decimal number to convert',
      'rot13-cipher': 'Paste text to apply ROT13 cipher',
      'caesar-cipher': 'Paste text to apply Caesar cipher',
      'css-formatter': 'Paste CSS code to format and beautify',
      'sql-formatter': 'Paste SQL query to format and beautify',
      'http-status-lookup': 'Enter HTTP status code to look up',
      'mime-type-lookup': 'Enter file extension to look up MIME type',
      'http-header-parser': 'Paste HTTP headers to parse and analyze',
      'uuid-validator': 'Paste UUID to validate format',
      'json-path-extractor': 'Paste JSON to extract paths',
      'image-to-base64': 'Upload an image to convert to base64',
      'svg-optimizer': 'Paste SVG code to optimize',
      'unit-converter': 'Enter value with unit to convert',
      'number-formatter': 'Enter number to format with different notations',
      'timezone-converter': 'Enter time to convert between timezones',
      'base-converter': 'Enter number and select base to convert between',
      'math-evaluator': 'Paste math expression to evaluate',
      'keyword-extractor': 'Paste text to extract important keywords',
      'cron-tester': 'Paste cron expression to test and validate',
      'file-size-converter': 'Enter file size with unit to convert',
      'js-formatter': 'Paste JavaScript code to format, minify, or beautify',
      'email-validator': 'Enter email address to validate format',
      'ip-validator': 'Enter IP address to validate',
      'ip-integer-converter': 'Paste IP address or integer to convert',
      'markdown-linter': 'Paste Markdown to check for issues',
    }

    return instructions[selectedTool.toolId] || null
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        {getInstructionText() && (
          <div className={styles.instructionLabel}>{getInstructionText()}</div>
        )}
        <div
          className={`${styles.inputField} ${isDragging ? styles.dragging : ''} ${imagePreview ? styles.hasImage : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={inputText}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder={getPlaceholder()}
          />

          <div className={styles.buttonGroup}>
            <button
              className={styles.uploadButton}
              onClick={openFileDialog}
              title="Click to upload an image"
              type="button"
            >
              <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className={styles.fileInput}
          />

          <div className={styles.charCounter}>{charCount} characters</div>
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
            <img src={imagePreview} alt="Preview" className={styles.previewImage} />
          </div>
        )}
      </div>
    </div>
  )
}
