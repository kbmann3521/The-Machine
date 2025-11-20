import React, { useState, useRef } from 'react'
import styles from '../styles/universal-input.module.css'

export default function UniversalInput({ onInputChange, onImageChange, selectedTool }) {
  const getPlaceholder = () => {
    if (!selectedTool) {
      return "Type your text here... drag & drop or paste an image (Ctrl+V)"
    }

    const placeholders = {
      'image-resizer': 'Upload an image to resize',
      'word-counter': 'Paste your text to count words, characters, sentences, and lines...',
      'case-converter': 'Enter text to convert case (uppercase, lowercase, title case, etc.)...',
      'find-replace': 'Paste text and configure find/replace options...',
      'remove-extras': 'Paste text with extra spaces, line breaks, etc. to clean...',
      'text-analyzer': 'Paste text to analyze (word frequency, readability, etc.)...',
      'base64-converter': 'Paste text or base64 string to encode/decode...',
      'url-converter': 'Paste a URL to convert or encode/decode...',
      'html-entities-converter': 'Paste HTML content to convert entities...',
      'html-formatter': 'Paste HTML code to format and beautify...',
      'plain-text-stripper': 'Paste HTML or styled text to strip formatting...',
      'json-formatter': 'Paste JSON code to format and validate...',
      'reverse-text': 'Paste text to reverse character order...',
      'slug-generator': 'Paste text to convert to URL-friendly slug...',
      'regex-tester': 'Paste text and test regex patterns...',
      'timestamp-converter': 'Paste unix timestamp (e.g., 1234567890) or date...',
      'csv-json-converter': 'Paste CSV data to convert to JSON...',
      'markdown-html-converter': 'Paste Markdown or HTML to convert...',
      'xml-formatter': 'Paste XML code to format...',
      'yaml-formatter': 'Paste YAML configuration to format...',
      'url-parser': 'Paste a URL to parse components...',
      'jwt-decoder': 'Paste a JWT token to decode...',
      'text-diff-checker': 'Paste the first text to compare...',
      'color-converter': 'Paste color value (hex, rgb, hsl, etc.)...',
      'checksum-calculator': 'Paste text to calculate checksums...',
      'escape-unescape': 'Paste text or escaped strings to convert...',
      'sort-lines': 'Paste text with multiple lines to sort...',
      'whitespace-visualizer': 'Paste text to visualize whitespace and special chars...',
      'ascii-unicode-converter': 'Paste ASCII or Unicode text to convert...',
      'punycode-converter': 'Paste domain name or punycode to convert...',
      'binary-converter': 'Paste binary, hex, or octal number to convert...',
      'rot13-cipher': 'Paste text to apply ROT13 cipher...',
      'caesar-cipher': 'Paste text to apply Caesar cipher...',
      'css-formatter': 'Paste CSS code to format and beautify...',
      'sql-formatter': 'Paste SQL query to format and beautify...',
      'http-status-lookup': 'Enter HTTP status code (e.g., 404, 500)...',
      'mime-type-lookup': 'Enter file extension (e.g., .jpg, .pdf)...',
      'http-header-parser': 'Paste HTTP headers to parse and analyze...',
      'uuid-validator': 'Paste UUID to validate format...',
      'json-path-extractor': 'Paste JSON to extract paths...',
      'image-to-base64': 'Upload an image to convert to base64...',
      'svg-optimizer': 'Paste SVG code to optimize...',
      'unit-converter': 'Enter value with unit (e.g., 5km, 100lb)...',
      'number-formatter': 'Enter number to format with different notations...',
      'timezone-converter': 'Enter time to convert (e.g., 1:00 PM, 13:00, 2:30 PM)...',
      'base-converter': 'Enter number and select base to convert between...',
      'math-evaluator': 'Paste math expression to evaluate (e.g., 2+2*3)...',
      'keyword-extractor': 'Paste text to extract important keywords...',
      'cron-tester': 'Paste cron expression to test and validate...',
      'file-size-converter': 'Enter file size with unit (e.g., 1024MB, 5GB)...',
      'js-minifier': 'Paste JavaScript code to minify...',
      'js-beautifier': 'Paste JavaScript code to format and beautify...',
      'html-minifier': 'Paste HTML code to minify...',
      'email-validator': 'Enter email address to validate format...',
      'ip-validator': 'Enter IP address to validate...',
      'ip-to-integer': 'Paste IP address to convert to integer...',
      'integer-to-ip': 'Paste integer to convert to IP address...',
      'ip-range-calculator': 'Paste IP address with CIDR notation (e.g., 192.168.1.0/24)...',
      'markdown-linter': 'Paste Markdown to check for issues...',
    }

    return placeholders[selectedTool.toolId] || "Type or paste content here..."
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

  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
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
