import { useState, useRef, useEffect } from 'react'
import { forwardRef, useImperativeHandle } from 'react'
import { createPortal } from 'react-dom'
import { isScriptingLanguageTool, getToolExampleCount } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import CodeMirrorEditor from './CodeMirrorEditor'
import styles from '../styles/universal-input.module.css'

// Tools that should display line numbers in CodeMirror
const TOOLS_WITH_LINE_NUMBERS = new Set([
  'js-formatter',           // JavaScript Formatter Suite
  'json-formatter',         // JSON Formatter
  'web-playground', // Web Playground
  'sql-formatter',          // SQL Formatter
  'xml-formatter',          // XML Formatter
  'yaml-formatter',         // YAML Formatter
  'svg-optimizer',          // SVG Optimizer
  'css-formatter',          // CSS Formatter
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
    case 'web-playground':
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

const UniversalInputComponent = forwardRef(({ inputText = '', inputImage = null, imagePreview = null, onInputChange, onImageChange, onCompareTextChange, compareText = '', selectedTool, configOptions = {}, getToolExample, errorData = null, predictedTools = [], onSelectTool, result = null, activeToolkitSection = null, isPreviewFullscreen = false, onTogglePreviewFullscreen = null, standalone = false }, ref) => {
  const shouldShowLineNumbers = selectedTool && TOOLS_WITH_LINE_NUMBERS.has(selectedTool.toolId)

  const getPlaceholder = () => {
    if (!selectedTool) {
      return "Type or paste content here..."
    }
    if (selectedTool.toolId === 'ip-address-toolkit') {
      return "Enter an IP address, hostname, CIDR notation, or range (e.g., google.com, 192.168.1.1 to 192.168.1.10)..."
    }
    if (selectedTool.toolId === 'email-validator') {
      return "Type or paste emails here — one per line or separated by commas."
    }
    return "Type or paste content here..."
  }

  // Use inputText from props, with local state for immediate updates
  const [localInputText, setLocalInputText] = useState(inputText)
  const [localInputImage, setLocalInputImage] = useState(inputImage)
  const [localImagePreview, setLocalImagePreview] = useState(imagePreview)
  const [charCount, setCharCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [inputHeight, setInputHeight] = useState(255)
  const [isResizing, setIsResizing] = useState(false)
  const [exampleIndex, setExampleIndex] = useState({})
  const [imageError, setImageError] = useState(null)
  const [showExampleDropdown, setShowExampleDropdown] = useState(false)
  const fileInputRef = useRef(null)
  const inputFieldRef = useRef(null)
  const exampleDropdownRef = useRef(null)
  const examplePortalRef = useRef(null)
  const startYRef = useRef(0)
  const startHeightRef = useRef(0)
  const isPasteRef = useRef(false)

  // Maximum file size: 5MB
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

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

  // Sync prop value with local state when parent updates inputText
  useEffect(() => {
    setLocalInputText(inputText)
  }, [inputText])

  // Sync prop value with local state when parent updates imagePreview
  useEffect(() => {
    setLocalImagePreview(imagePreview)
  }, [imagePreview])

  // Sync prop value with local state when parent updates inputImage
  useEffect(() => {
    setLocalInputImage(inputImage)
  }, [inputImage])

  // Reset example index when tool changes
  useEffect(() => {
    if (selectedTool) {
      setExampleIndex(prev => ({
        ...prev,
        [selectedTool.toolId]: 0
      }))
    }
  }, [selectedTool?.toolId])

  // Close example dropdown when clicking outside
  useEffect(() => {
    if (!showExampleDropdown) return

    const handleClickOutside = (e) => {
      const isClickInButton = exampleDropdownRef.current && exampleDropdownRef.current.contains(e.target)
      const isClickInPortal = examplePortalRef.current && examplePortalRef.current.contains(e.target)

      if (!isClickInButton && !isClickInPortal) {
        setShowExampleDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showExampleDropdown])

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
    setLocalInputText(value)
    setCharCount(value.length)
    const isPaste = isPasteRef.current
    isPasteRef.current = false // Reset after use
    onInputChange(value, null, null, isPaste)
  }

  const handlePaste = (e) => {
    isPasteRef.current = true
  }

  const handleInputFile = (file) => {
    // Clear any previous errors
    setImageError(null)

    const isImage = file.type.startsWith('image/')
    const isSpreadsheet = file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

    if (!isImage && !isSpreadsheet) {
      setImageError('Please select a valid image file or spreadsheet (CSV, XLSX).')
      return
    }

    // Proactively show the spreadsheet/image icon before reading the file
    // and clear text input for spreadsheets to keep it 'internal'
    if (isSpreadsheet) {
      setLocalInputImage(file)
      setLocalInputText('')
      setCharCount(0)
      setLocalImagePreview(null)
      // Notify parent immediately that text is cleared to avoid split-second flicker
      onInputChange('', file, null, false)
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setImageError(`File is too large (${fileSizeMB}MB). Maximum allowed size is ${sizeMB}MB.`)
      return
    }

    // Log file details for debugging mobile issues
    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified,
    })

    const reader = new FileReader()
    let readerTimeout = null

    reader.onload = (e) => {
      clearTimeout(readerTimeout)
      try {
        const result = e.target.result
        if (!result) {
          console.error('FileReader result is empty')
          setImageError('Failed to read file. Please try again.')
          return
        }
        console.log('File read successfully, size:', result.length)

        if (isImage) {
          setLocalImagePreview(result)
        } else {
          // For spreadsheets, we already set localInputImage proactively
          // and we don't show a preview in the image box
        }

        setLocalInputImage(file)
        setImageError(null) // Clear error on success
        onImageChange(file, result)
        // Also trigger input change to run prediction
        // For spreadsheets, we already cleared the text proactively above
        if (!isSpreadsheet) {
          onInputChange(localInputText, file, isImage ? result : null, false)
        }
      } catch (err) {
        console.error('Error processing file:', err)
        setImageError('Error processing file: ' + err.message)
      }
    }

    reader.onerror = (err) => {
      clearTimeout(readerTimeout)
      console.error('FileReader error:', err)
      setImageError('Failed to read file. Please check file permissions and try again.')
    }

    reader.onabort = () => {
      clearTimeout(readerTimeout)
      console.warn('FileReader aborted')
      setImageError('File reading was cancelled.')
    }

    // Add timeout for FileReader
    readerTimeout = setTimeout(() => {
      console.warn('FileReader timeout - file took too long to read')
      reader.abort()
      setImageError('Loading timed out. File may be too large.')
    }, 30000)

    try {
      if (isImage) {
        reader.readAsDataURL(file)
      } else if (file.name.endsWith('.csv')) {
        reader.readAsText(file)
      } else {
        reader.readAsArrayBuffer(file)
      }
    } catch (err) {
      clearTimeout(readerTimeout)
      console.error('Error starting FileReader:', err)
      alert('Unable to read file: ' + err.message)
    }
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleInputFile(file)
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
      handleInputFile(file)
    }
  }

  const removeImage = () => {
    const isSpreadsheet = localInputImage && (localInputImage.name.endsWith('.csv') || localInputImage.name.endsWith('.xlsx') || localInputImage.name.endsWith('.xls'))

    setLocalImagePreview(null)
    setLocalInputImage(null)
    setImageError(null)
    // For spreadsheets, we might want to preserve the text if it was read
    // But the user's feedback suggests they expect it to work like an image
    onImageChange(null, null)
    // If it's a spreadsheet being removed, we should also trigger an input change
    // to clear the structured data in the parent
    if (isSpreadsheet) {
      setLocalInputText('')
      setCharCount(0)
      onInputChange('', null, null, false)
    } else {
      onInputChange(localInputText, null, null, false)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleCompareTextChange = (value) => {
    if (onCompareTextChange) {
      onCompareTextChange(value)
    }
  }

  const handleLoadExampleByIndex = (exampleNum) => {
    if (!selectedTool || !getToolExample) return

    const example = getToolExample(selectedTool.toolId, configOptions, exampleNum)
    if (example) {
      setLocalInputText(example)
      setCharCount(example.length)
      setExampleIndex(prev => ({
        ...prev,
        [selectedTool.toolId]: exampleNum
      }))
      // Pass true as fourth parameter to indicate this is a "load example" action
      // This ensures prediction always runs, even if the example is shorter than previous input
      onInputChange(example, null, null, true)
      setShowExampleDropdown(false)
    }
  }

  const handleLoadExample = () => {
    if (!selectedTool || !getToolExample) return

    const currentIndex = exampleIndex[selectedTool.toolId] || 0
    const totalExamples = getToolExampleCount(selectedTool.toolId, configOptions)
    const nextIndex = (currentIndex + 1) % totalExamples

    handleLoadExampleByIndex(nextIndex)
  }

  const handleClearInput = () => {
    setLocalInputText('')
    setCharCount(0)
    if (onCompareTextChange) {
      onCompareTextChange('')
    }
    setLocalInputImage(null)
    setLocalImagePreview(null)
    setImageError(null)
    onInputChange('', null, null, false)
  }

  // Use the custom hook for "use output as input" functionality
  const { getOutputToUse, handleUseOutput: hookHandleUseOutput, hasOutput } = useOutputToInput(
    result,
    selectedTool,
    activeToolkitSection,
    null, // selectedCaseType is no longer used - case variants are selected via chevron menu
    onInputChange
  )

  // Wrapper to also update local state
  const handleUseOutput = () => {
    const output = getOutputToUse()
    if (output) {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
      setLocalInputText(outputText)
      setCharCount(outputText.length)
    }
    hookHandleUseOutput()
  }

  // Expose handleUseOutput to parent via ref
  useImperativeHandle(ref, () => ({
    handleUseOutput
  }), [handleUseOutput])

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
      'web-playground': 'Format and convert between Markdown and HTML',
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
      'encoder-decoder': 'Unified tool for flexible data transformation with composable transformers',
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
            className={`${styles.inputField} ${isDragging ? styles.dragging : ''} ${localImagePreview ? styles.hasImage : ''} ${isResizing ? styles.resizing : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            ref={inputFieldRef}
            style={{ height: inputHeight + 'px' }}
          >
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
                    <span className={styles.buttonText}>Upload File</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,.csv,.xlsx,.xls"
                    className={styles.fileInput}
                  />
                  <div className={styles.headerButtonGroup}>
                    {selectedTool && getToolExample && getToolExample(selectedTool.toolId, configOptions) && (
                      <div ref={exampleDropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          className={styles.loadExampleButton}
                          onClick={() => setShowExampleDropdown(!showExampleDropdown)}
                          title="Load example input and see output"
                          type="button"
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '6px' }}
                        >
                          Load Example
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: '2px' }}>
                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        {showExampleDropdown && typeof window !== 'undefined' && createPortal(
                          <div
                            ref={examplePortalRef}
                            style={{
                              position: 'fixed',
                              top: exampleDropdownRef.current ? exampleDropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
                              left: exampleDropdownRef.current ? exampleDropdownRef.current.getBoundingClientRect().left : 0,
                              backgroundColor: 'var(--color-background-tertiary)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              minWidth: '130px',
                              zIndex: 99999,
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Array.from({ length: getToolExampleCount(selectedTool.toolId, configOptions) }).map((_, idx) => (
                              <button
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleLoadExampleByIndex(idx)
                                }}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  padding: '8px 12px',
                                  backgroundColor: exampleIndex[selectedTool.toolId] === idx ? 'rgba(0, 102, 204, 0.1)' : 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  textAlign: 'left',
                                  color: 'var(--color-text-primary)',
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.backgroundColor = 'rgba(0, 102, 204, 0.08)'
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.backgroundColor = exampleIndex[selectedTool.toolId] === idx ? 'rgba(0, 102, 204, 0.1)' : 'transparent'
                                }}
                                type="button"
                              >
                                Example {idx + 1}
                              </button>
                            ))}
                          </div>,
                          document.body
                        )}
                      </div>
                    )}
                    {localInputText && (
                      <>
                        <button
                          className={styles.clearInputButton}
                          onClick={handleClearInput}
                          title="Clear all input and output"
                          type="button"
                        >
                          <span className={styles.buttonText}>Clear Input</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className={styles.toolTextboxEditor}>
                {imageError && (
                  <div className={styles.imageErrorMessage}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span className={styles.errorText}>{imageError}</span>
                  </div>
                )}
                {localImagePreview ? (
                  <div className={styles.centeredImageContainer}>
                    <img
                      src={localImagePreview}
                      alt="uploaded-image"
                      className={styles.centeredImage}
                    />
                    <button
                      className={styles.removeImageOverlay}
                      onClick={removeImage}
                      title="Remove image"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ) : localInputImage && (localInputImage.name.endsWith('.csv') || localInputImage.name.endsWith('.xlsx') || localInputImage.name.endsWith('.xls')) ? (
                  <div className={styles.centeredImageContainer} style={{ backgroundColor: 'var(--color-background-tertiary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px' }}>
                      <div style={{ fontSize: '48px' }}>📄</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: '600', color: 'var(--color-text-primary)' }}>{localInputImage.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                          {(localInputImage.size / 1024).toFixed(1)} KB • Spreadsheet detected
                        </div>
                      </div>
                    </div>
                    <button
                      className={styles.removeImageOverlay}
                      onClick={removeImage}
                      title="Remove file"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <CodeMirrorEditor
                    value={localInputText}
                    onChange={handleTextChange}
                    language={getLanguageForTool(selectedTool?.toolId)}
                    placeholder={getPlaceholder()}
                    showLineNumbers={shouldShowLineNumbers}
                    editorType="input"
                    highlightingEnabled={isScriptingLanguageTool(selectedTool?.toolId)}
                    diagnostics={result?.diagnostics || []}
                    formatMode={result?.optionsApplied?.mode || 'beautify'}
                    enableLinting={true}
                    _debugDiagnostics={result?.diagnostics}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {!standalone && (
          <div className={styles.detectedToolsInsideInput}>
            {(localInputText || localImagePreview) && predictedTools.length > 0 ? (
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
            ) : !localInputText && !localImagePreview ? (
              <div className={styles.placeholderText}>
                Detected tools will appear here
              </div>
            ) : null}
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
})

UniversalInputComponent.displayName = 'UniversalInput'
export default UniversalInputComponent
