import { useState, useRef, useEffect } from 'react'
import { isScriptingLanguageTool, getToolExampleCount } from '../lib/tools'
import CodeMirrorEditor from './CodeMirrorEditor'
import styles from '../styles/universal-input.module.css'

// Tools that should display line numbers in CodeMirror
const TOOLS_WITH_LINE_NUMBERS = new Set([
  'js-formatter',           // JavaScript Formatter Suite
  'json-formatter',         // JSON Formatter
  'markdown-html-formatter', // Markdown + HTML Formatter
  'sql-formatter',          // SQL Formatter
  'xml-formatter',          // XML Formatter
  'yaml-formatter',         // YAML Formatter
  'svg-optimizer',          // SVG Optimizer
])

// Map tool IDs to their correct language for syntax highlighting
const getLanguageForTool = (toolId) => {
  switch (toolId) {
    case 'json-formatter':
      return 'json'
    case 'js-formatter':
      return 'javascript'
    case 'css-formatter':
      return 'css'
    case 'html-formatter':
    case 'markdown-html-formatter':
      return 'html'
    case 'xml-formatter':
      return 'xml'
    case 'svg-optimizer':
      return 'svg'
    case 'yaml-formatter':
      return 'yaml'
    case 'sql-formatter':
      return 'sql'
    case 'text-toolkit':
    case 'text-analyzer':
    case 'find-replace':
    case 'clean-text':
    case 'reverse-text':
    case 'sort-lines':
    case 'delimiter-transformer':
      return 'text'
    default:
      return 'javascript'
  }
}

export default function UniversalInput({ onInputChange, onImageChange, onCompareTextChange, compareText = '', selectedTool, configOptions = {}, getToolExample, errorData = null, predictedTools = [], onSelectTool, result = null, activeToolkitSection = null }) {
  const shouldShowLineNumbers = selectedTool && TOOLS_WITH_LINE_NUMBERS.has(selectedTool.toolId)

  const getPlaceholder = () => {
    if (!selectedTool) {
      return "Type or paste content here..."
    }
    if (selectedTool.toolId === 'ip-address-toolkit') {
      return "Enter an IP address, hostname, CIDR notation, or range (e.g., google.com, 192.168.1.1 to 192.168.1.10)..."
    }
    return "Type or paste content here..."
  }

  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [inputHeight, setInputHeight] = useState(255)
  const [isResizing, setIsResizing] = useState(false)
  const [exampleIndex, setExampleIndex] = useState({})
  const [selectedCaseType, setSelectedCaseType] = useState('lowercase')
  const fileInputRef = useRef(null)
  const inputFieldRef = useRef(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)
  const isPasteRef = useRef(false)

  // Load saved height from localStorage on mount (client-side only)
  useEffect(() => {
    const savedHeight = localStorage.getItem('inputBoxHeight')
    if (savedHeight) {
      const height = Math.max(255, Math.min(510, parseInt(savedHeight, 10)))
      setInputHeight(height)
    }
  }, [])

  // Auto-save height whenever it changes (debounced via resize end)
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem('inputBoxHeight', inputHeight.toString())
    }
  }, [inputHeight, isResizing])

  // Reset example index when tool changes
  useEffect(() => {
    if (selectedTool) {
      setExampleIndex(prev => ({
        ...prev,
        [selectedTool.toolId]: 0
      }))
    }
  }, [selectedTool?.toolId])

  // Handle resize start
  const handleResizeStart = (e) => {
    setIsResizing(true)
    startYRef.current = e.clientY
    startHeightRef.current = inputHeight
  }

  // Handle resize move
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      const delta = e.clientY - startYRef.current
      const newHeight = Math.max(255, Math.min(510, startHeightRef.current + delta))
      setInputHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleTextChange = (value) => {
    setInputText(value)
    setCharCount(value.length)
    const isPaste = isPasteRef.current
    isPasteRef.current = false // Reset after use
    onInputChange(value, null, null, isPaste)
  }

  const handlePaste = (e) => {
    isPasteRef.current = true
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

  const handleCompareTextChange = (value) => {
    if (onCompareTextChange) {
      onCompareTextChange(value)
    }
  }

  const handleLoadExample = () => {
    if (!selectedTool || !getToolExample) return

    const currentIndex = exampleIndex[selectedTool.toolId] || 0
    const totalExamples = getToolExampleCount(selectedTool.toolId, configOptions)
    const nextIndex = (currentIndex + 1) % totalExamples

    const example = getToolExample(selectedTool.toolId, configOptions, nextIndex)
    if (example) {
      setInputText(example)
      setCharCount(example.length)
      setExampleIndex(prev => ({
        ...prev,
        [selectedTool.toolId]: nextIndex
      }))
      // Pass true as fourth parameter to indicate this is a "load example" action
      // This ensures prediction always runs, even if the example is shorter than previous input
      onInputChange(example, null, null, true)
    }
  }

  const handleClearInput = () => {
    setInputText('')
    setCharCount(0)
    if (onCompareTextChange) {
      onCompareTextChange('')
    }
    setInputImage(null)
    setImagePreview(null)
    onInputChange('', null, null, false)
  }

  const getOutputToUse = () => {
    if (!result) return null

    // For Text Toolkit, only show button for specific sections
    if (selectedTool?.toolId === 'text-toolkit' && activeToolkitSection) {
      // Only these sections support "use output as input"
      if (activeToolkitSection === 'caseConverter' && result.caseConverter) {
        return result.caseConverter[selectedCaseType]
      }

      const supportedSections = {
        'slugGenerator': 'slugGenerator',
        'reverseText': 'reverseText',
        'removeExtras': 'removeExtras',
        'sortLines': 'sortLines',
        'findReplace': 'findReplace',
        'caseConverter': 'caseConverter',
        'delimiterTransformer': 'delimiterTransformer'
      }

      const key = supportedSections[activeToolkitSection]
      if (key && result[key]) {
        return result[key]
      }
      return null
    }

    // For regular tools, use the output field
    if (result?.output) {
      return result.output
    }

    return null
  }

  const handleUseOutput = () => {
    const output = getOutputToUse()
    if (output) {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
      setInputText(outputText)
      setCharCount(outputText.length)
      onInputChange(outputText, null, null, false)
    }
  }

  const getInstructionText = () => {
    if (!selectedTool) return null

    const instructions = {
      'case-converter': 'Transform text case for titles, code, or any style you need',
      'find-replace': 'Search and replace with plain text or regex patterns',
      'text-analyzer': 'Analyze readability scores, word frequency, and writing quality',
      'base64-converter': 'Encode text to base64 or decode from base64',
      'url-converter': 'Encode or decode URL components and special characters',
      'html-entities-converter': 'Convert between HTML and entity-encoded text',
      'html-formatter': 'Beautify and indent HTML code for better readability',
      'json-formatter': 'Validate and format JSON with proper indentation',
      'reverse-text': 'Reverse text characters, words, or lines',
      'regex-tester': 'Test regex patterns with live matching and replacement',
      'csv-json-converter': 'Transform CSV spreadsheet data to JSON format',
      'markdown-html-formatter': 'Format and convert between Markdown and HTML',
      'xml-formatter': 'Validate and format XML with proper structure',
      'yaml-formatter': 'Format YAML configuration files with correct indentation',
      'url-toolkit': 'Parse, validate, normalize, and manipulate URLs with advanced features',
      'jwt-decoder': 'Decode and inspect JWT tokens and claims',
      'text-diff-checker': 'Compare two versions of text and highlight differences',
      'color-converter': 'Convert color values between hex, RGB, HSL, and more',
      'checksum-calculator': 'Generate MD5, SHA1, SHA256, and other checksums',
      'escape-unescape': 'Escape and unescape special characters in text',
      'whitespace-visualizer': 'See hidden spaces, tabs, and line break characters',
      'ascii-unicode-converter': 'Convert between ASCII and Unicode encodings',
      'punycode-converter': 'Convert international domain names to punycode format',
      'rot13-cipher': 'Apply ROT13 text cipher for simple obfuscation',
      'caesar-cipher': 'Apply Caesar cipher with custom character shift amount',
      'css-formatter': 'Format and beautify CSS code with proper indentation',
      'sql-formatter': 'Format SQL queries with readable line breaks and indentation',
      'http-status-lookup': 'Paste status code, log line, or description to auto-detect and get dev guidance',
      'mime-type-lookup': 'Find MIME types by file extension',
      'http-header-parser': 'Parse, validate, and analyze HTTP headers with security checks',
      'uuid-validator': 'Validate UUID format and detect version',
      'json-path-extractor': 'Extract data from JSON using JSONPath expressions',
      'image-to-base64': 'Convert images to base64 for embedding in HTML or CSS',
      'svg-optimizer': 'Optimize SVG files by removing unnecessary code',
      'unit-converter': 'Convert between different units of measurement',
      'number-formatter': 'Format numbers with separators, decimals, percentages, abbreviations, and scientific notation',
      'time-normalizer': 'Convert and normalize times between different timezones',
      'base-converter': 'Convert numbers between different bases (binary, octal, hex)',
      'math-evaluator': 'Evaluate mathematical expressions and get results',
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
        <div className={styles.inputFieldContainer}>
          <div
            className={`${styles.inputField} ${isDragging ? styles.dragging : ''} ${imagePreview ? styles.hasImage : ''} ${isResizing ? styles.resizing : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={inputFieldRef}
            style={{ height: inputHeight + 'px' }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className={styles.fileInput}
            />
            <div className={styles.toolTextbox}>
              <div className={styles.toolTextboxHeader}>
                <div className={styles.headerContent}>
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
                    <span className={styles.buttonText}>Upload Image</span>
                  </button>
                  <div className={styles.headerButtonGroup}>
                    {selectedTool && getToolExample && getToolExample(selectedTool.toolId, configOptions) && (
                      <button
                        className={styles.loadExampleButton}
                        onClick={handleLoadExample}
                        title="Load example input and see output"
                        type="button"
                      >
                        Load Example
                      </button>
                    )}
                    {inputText && (
                      <>
                        <button
                          className={styles.clearInputButton}
                          onClick={handleClearInput}
                          title="Clear all input and output"
                          type="button"
                        >
                          <span className={styles.buttonText}>Clear Input</span>
                        </button>
                        {getOutputToUse() && (
                          <>
                            {activeToolkitSection === 'caseConverter' && (
                              <select
                                className={styles.caseTypeSelect}
                                value={selectedCaseType}
                                onChange={(e) => setSelectedCaseType(e.target.value)}
                                title="Select case type to use"
                              >
                                <option value="uppercase">UPPERCASE</option>
                                <option value="lowercase">lowercase</option>
                                <option value="titleCase">Title Case</option>
                                <option value="sentenceCase">Sentence case</option>
                              </select>
                            )}
                            <button
                              className={styles.useOutputButton}
                              onClick={handleUseOutput}
                              title="Use output as input"
                              type="button"
                              aria-label="Use output as input"
                            >
                              ⬇️
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.toolTextboxEditor}>
                <CodeMirrorEditor
                  value={inputText}
                  onChange={handleTextChange}
                  language={getLanguageForTool(selectedTool?.toolId)}
                  placeholder={getPlaceholder()}
                  showLineNumbers={shouldShowLineNumbers}
                  editorType="input"
                  highlightingEnabled={isScriptingLanguageTool(selectedTool?.toolId)}
                  diagnostics={result?.diagnostics || []}
                  formatMode={result?.optionsApplied?.mode || 'beautify'}
                  enableLinting={true}
                />
              </div>
            </div>
            <div
              className={styles.resizeHandle}
              onMouseDown={handleResizeStart}
              title="Drag to resize input box"
            />
          </div>
        </div>

        <div className={styles.detectedToolsInsideInput}>
          {inputText && predictedTools.length > 0 ? (
            predictedTools.filter(tool => tool.similarity >= 0.6).map(tool => {
              // Map similarity (0.6-1.0) to opacity (0.3-1.0) based on confidence
              // Lower bound (0.6 similarity) = 30% opacity, upper bound (1.0) = 100% opacity
              const opacity = 0.3 + (tool.similarity - 0.6) * 1.75
              return (
                <button
                  key={tool.toolId}
                  className={styles.detectedToolButton}
                  style={{ opacity }}
                  onClick={() => onSelectTool(tool)}
                  type="button"
                  title={`Switch to ${tool.name}`}
                >
                  {tool.name}
                </button>
              )
            })
          ) : !inputText ? (
            <div className={styles.placeholderText}>
              Detected tools will appear here
            </div>
          ) : null}
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

        {selectedTool?.toolId === 'checksum-calculator' && configOptions.compareMode && (
          <div className={styles.compareInputWrapper}>
            <div className={styles.compareInputLabel}>Input B (Compare)</div>
            <div className={styles.toolTextbox} style={{ minHeight: '140px' }}>
              <div className={styles.toolTextboxEditor}>
                <CodeMirrorEditor
                  value={compareText || ''}
                  onChange={handleCompareTextChange}
                  language={getLanguageForTool(selectedTool?.toolId)}
                  placeholder="Enter second input to compare checksums..."
                  showLineNumbers={shouldShowLineNumbers}
                  editorType="input"
                  highlightingEnabled={isScriptingLanguageTool(selectedTool?.toolId)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
