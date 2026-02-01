import { useState, useRef, useEffect } from 'react'
import { forwardRef, useImperativeHandle } from 'react'
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

const UniversalInputComponent = forwardRef(({ inputText = '', inputImage = null, imagePreview = null, onInputChange, onImageChange, onCompareTextChange, compareText = '', selectedTool, configOptions = {}, getToolExample, errorData = null, predictedTools = [], onSelectTool, result = null, activeToolkitSection = null, isPreviewFullscreen = false, onTogglePreviewFullscreen = null }, ref) => {
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
  const fileInputRef = useRef(null)
  const inputFieldRef = useRef(null)
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

  const handleImageFile = (file) => {
    // Clear any previous errors
    setImageError(null)

    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (JPG, PNG, GIF, WebP, etc.)')
      return
    }

    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      const sizeMB = (MAX_IMAGE_SIZE / (1024 * 1024)).toFixed(0)
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
      setImageError(`Image file is too large (${fileSizeMB}MB). Maximum allowed size is ${sizeMB}MB.`)
      return
    }

    // Log file details for debugging mobile issues
    console.log('Image file selected:', {
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
          setImageError('Failed to read image file. Please try again.')
          return
        }
        console.log('Image file read successfully, size:', result.length)
        setLocalImagePreview(result)
        setLocalInputImage(file)
        setImageError(null) // Clear error on success
        onImageChange(file, result)
        // Also trigger input change to run prediction for image toolkit detection
        console.log('Calling onInputChange for image prediction:', { text: localInputText, hasFile: !!file, hasPreview: !!result })
        onInputChange(localInputText, file, result, false)
      } catch (err) {
        console.error('Error processing image file:', err)
        setImageError('Error processing image file: ' + err.message)
      }
    }

    reader.onerror = (err) => {
      clearTimeout(readerTimeout)
      console.error('FileReader error:', err)
      setImageError('Failed to read image file. Please check file permissions and try again.')
    }

    reader.onabort = () => {
      clearTimeout(readerTimeout)
      console.warn('FileReader aborted')
      setImageError('File reading was cancelled.')
    }

    // Add timeout for FileReader (some mobile devices may hang)
    readerTimeout = setTimeout(() => {
      console.warn('FileReader timeout - image file took too long to read')
      reader.abort()
      setImageError('Image loading timed out. File may be too large. Please try with a smaller image.')
    }, 30000) // 30 second timeout

    try {
      reader.readAsDataURL(file)
    } catch (err) {
      clearTimeout(readerTimeout)
      console.error('Error starting FileReader:', err)
      alert('Unable to read file: ' + err.message)
    }
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
    setLocalImagePreview(null)
    setLocalInputImage(null)
    setImageError(null)
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
      setLocalInputText(example)
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
                    <span className={styles.buttonText}>Upload Image</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className={styles.fileInput}
                  />
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
