import React, { useState, useCallback, useEffect, useRef } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import UniversalInput from '../components/UniversalInput'
import InputTabs from '../components/InputTabs'
import dynamic from 'next/dynamic'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import NumericConfig from '../components/NumericConfig'
import ToolOutputPanel from '../components/ToolOutputPanel'
import JSEditorInput from '../components/JSEditorInput'
import IPToolkitOutputPanel from '../components/IPToolkitOutputPanel'
import EmailValidatorOutputPanel from '../components/EmailValidatorOutputPanel'
import QRCodeGeneratorOutputPanel from '../components/QRCodeGeneratorOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import PageFooter from '../components/PageFooter'
import ToolDescriptionSidebar from '../components/ToolDescriptionSidebar'
import ToolDescriptionContent from '../components/ToolDescriptionContent'
import ValuePropositionCard from '../components/ValuePropositionCard'
import { TOOLS, getToolExample } from '../lib/tools'
import { resizeImage } from '../lib/imageUtils'
import { generateFAQSchema, generateBreadcrumbSchema, generateSoftwareAppSchema, generatePageMetadata } from '../lib/seoUtils'
import { withSeoSettings } from '../lib/getSeoSettings'
import { classifyMarkdownHtmlInput } from '../lib/contentClassifier'
import styles from '../styles/hub.module.css'
import configStyles from '../styles/tool-config.module.css'

export default function Home(props) {
  const router = useRouter()
  const siteName = props?.siteName || 'All-in-One Internet Tools'
  const testTitle = props?.testTitle || 'All-in-One Internet Tools'
  const testDescription = props?.testDescription || 'Paste anything — we\'ll auto-detect the perfect tool'
  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [predictedTools, setPredictedTools] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [configOptions, setConfigOptions] = useState({})
  const [outputResult, setOutputResult] = useState(null)
  const [outputWarnings, setOutputWarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [inputChangeKey, setInputChangeKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeToolkitSection, setActiveToolkitSection] = useState('textAnalyzer')
  const [findReplaceConfig, setFindReplaceConfig] = useState({
    findText: '',
    replaceText: '',
    useRegex: false,
    matchCase: false,
  })
  const [diffConfig, setDiffConfig] = useState({
    text2: '',
  })
  const [sortLinesConfig, setSortLinesConfig] = useState({
    order: 'asc',
    caseSensitive: false,
    removeDuplicates: false,
  })
  const [removeExtrasConfig, setRemoveExtrasConfig] = useState({
    removePdfGarbage: true,
    removeInvisibleChars: true,
    stripHtml: true,
    stripMarkdown: true,
    normalizeWhitespace: true,
    fixPunctuationSpacing: true,
    compressSpaces: true,
    trimLines: true,
    removeLineBreaks: true,
    removeBlankLines: true,
    removeTimestamps: false,
    removeDuplicateLines: false,
  })
  const [delimiterTransformerConfig, setDelimiterTransformerConfig] = useState({
    delimiter: ' ',
    mode: 'rows',
    joinSeparator: ' ',
  })
  const [checksumCompareText, setChecksumCompareText] = useState('')
  const [previousInputLength, setPreviousInputLength] = useState(0)
  const [numericConfig, setNumericConfig] = useState({
    precision: null,
    rounding: 'half-up',
    notation: 'auto',
    mode: 'float'
  })
  const [initialToolsLoading, setInitialToolsLoading] = useState(true)
  const [contentClassification, setContentClassification] = useState(() => classifyMarkdownHtmlInput(''))
  const [showAnalysisTab, setShowAnalysisTab] = useState(false)
  const [showRulesTab, setShowRulesTab] = useState(false)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [markdownCustomCss, setMarkdownCustomCss] = useState('')
  const [markdownCustomJs, setMarkdownCustomJs] = useState('')
  const [cssFormattedOutput, setCssFormattedOutput] = useState(null)
  const [jsFormattedOutput, setJsFormattedOutput] = useState(null)
  const [jsFormatterDiagnostics, setJsFormatterDiagnostics] = useState([])
  const [activeMarkdownInputTab, setActiveMarkdownInputTab] = useState('input')
  const [markdownInputMode, setMarkdownInputMode] = useState('input') // 'input', 'css', or 'js' - tracks which input mode is active
  const [cssConfigOptions, setCssConfigOptions] = useState({
    mode: 'beautify',
    indentSize: '2',
    removeComments: true,
    addAutoprefix: false,
    browsers: 'last 2 versions',
    showValidation: true,
    showLinting: true,
    showAnalysisTab: false,
    showRulesTab: false,
  })

  const [jsConfigOptions, setJsConfigOptions] = useState({
    mode: 'format',
    indentSize: '2',
    useSemicolons: true,
    singleQuotes: true,
    trailingComma: 'es5',
    printWidth: '80',
    bracketSpacing: true,
    arrowParens: 'always',
    showAnalysis: true,
    showLinting: true,
    compressCode: false,
    removeComments: false,
    removeConsole: false,
  })

  // When active tab changes, track if it's a content mode (input/css/js) vs options
  const handleMarkdownInputTabChange = (tabId) => {
    setActiveMarkdownInputTab(tabId)
    // Update the mode only if it's a content tab (input, css, or js)
    if (tabId === 'input' || tabId === 'css' || tabId === 'js') {
      setMarkdownInputMode(tabId)
    }
  }

  const debounceTimerRef = useRef(null)
  const selectedToolRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const visibilityMapRef = useRef({})
  const previousClassificationRef = useRef(null)
  const currentInputRef = useRef('')
  const abortControllerRef = useRef(null)
  const abortTimeoutRef = useRef(null)
  const previousSidebarStateRef = useRef(null) // Track sidebar state when entering fullscreen
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50) // Track left panel width as percentage
  const isDraggingRef = useRef(false)
  const dividerContainerRef = useRef(null)
  const universalInputRef = useRef(null)
  const [isDesktop, setIsDesktop] = useState(true)

  // Cleanup function for pending timers and requests
  const cleanupPendingRequests = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = null
    }
    if (abortTimeoutRef.current) {
      clearTimeout(abortTimeoutRef.current)
      abortTimeoutRef.current = null
    }
    // Only abort if the signal hasn't already been aborted
    if (abortControllerRef.current) {
      try {
        const signal = abortControllerRef.current.signal
        if (signal && !signal.aborted) {
          abortControllerRef.current.abort()
        }
      } catch (e) {
        // Ignore abort errors during cleanup
      } finally {
        abortControllerRef.current = null
      }
    }
  }, [])

  // Handle divider drag move
  const handleDividerMouseMove = useCallback((e) => {
    if (!dividerContainerRef.current) return

    const container = dividerContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const newLeftRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Constrain the ratio to reasonable bounds (15% to 85%)
    const constrainedRatio = Math.max(15, Math.min(85, newLeftRatio))
    setDividerLeftRatio(constrainedRatio)
  }, [])

  // Handle divider drag end
  const handleDividerMouseUp = useCallback(() => {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleDividerMouseMove)
    document.removeEventListener('mouseup', handleDividerMouseUp)
  }, [handleDividerMouseMove])

  // Handle divider drag start
  const handleDividerMouseDown = useCallback(() => {
    isDraggingRef.current = true
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleDividerMouseMove)
    document.addEventListener('mouseup', handleDividerMouseUp)
  }, [handleDividerMouseMove, handleDividerMouseUp])

  // Track desktop/mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth > 1024)
    }

    // Set initial value
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPendingRequests()
    }
  }, [cleanupPendingRequests])

  useEffect(() => {
    selectedToolRef.current = selectedTool
  }, [selectedTool])

  // Auto-exit fullscreen when tool changes
  useEffect(() => {
    if (isPreviewFullscreen) {
      setIsPreviewFullscreen(false)
    }
  }, [selectedTool])

  // Auto-collapse sidebar when entering fullscreen on desktop only, auto-expand when exiting
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768

    if (isPreviewFullscreen) {
      // Entering fullscreen on desktop: save current state and collapse
      if (isDesktop) {
        previousSidebarStateRef.current = sidebarOpen
        if (sidebarOpen) {
          setSidebarOpen(false)
        }
      }
    } else if (previousSidebarStateRef.current !== null) {
      // Exiting fullscreen: restore previous state
      setSidebarOpen(previousSidebarStateRef.current)
      previousSidebarStateRef.current = null
    }
  }, [isPreviewFullscreen])

  // Fast local classification using heuristics (no API call)
  // Only detects strong signals; backend handles nuanced detection
  const fastLocalClassification = useCallback((text) => {
    const lowerText = text.toLowerCase().trim()
    let inputType = 'text'
    let contentSummary = lowerText.substring(0, 100)
    let intentHint = 'unknown'

    if (!lowerText) {
      return { inputType, contentSummary, intentHint }
    }

    // Strong indicators only — URLs, data URIs, etc.
    if (/^https?:\/\/|^www\./.test(lowerText)) {
      inputType = 'url'
      intentHint = 'url_processing'
    } else if (/^data:image/.test(lowerText)) {
      inputType = 'image'
      intentHint = 'image_processing'
    }

    // Let the backend detection matrix handle numeric/unit/plain text nuance
    return { inputType, contentSummary, intentHint }
  }, [])

  // Detect text cleaning issues in the input
  useEffect(() => {
    const initializeTools = async () => {
      let allTools = []

      try {
        // First, try to fetch tool metadata from server
        try {
          let response = null
          let data = null

          try {
            // Use absolute URL to ensure fetch works correctly in all contexts
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
            const metadataUrl = `${baseUrl}/api/tools/get-metadata`

            // Create abort controller with 15 second timeout for metadata fetch
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            try {
              response = await fetch(metadataUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                signal: controller.signal,
              })
              clearTimeout(timeoutId)
            } catch (fetchErr) {
              clearTimeout(timeoutId)
              if (fetchErr.name === 'AbortError') {
                console.debug('Tool metadata fetch timed out (15s timeout)')
              } else {
                console.debug('Tool metadata fetch error:', fetchErr?.message || String(fetchErr))
              }
              throw fetchErr
            }
          } catch (fetchError) {
            console.debug('Tool metadata fetch failed:', fetchError?.message || String(fetchError))
            throw fetchError
          }

          if (response && response.ok) {
            try {
              data = await response.json()
            } catch (parseError) {
              console.debug('Tool metadata parsing error:', parseError?.message || String(parseError))
              throw parseError
            }

            if (data?.tools && typeof data.tools === 'object') {
              // Use metadata from server as source of truth
              allTools = Object.entries(data.tools).map(([toolId, toolData]) => {
                const localToolData = TOOLS[toolId] || {}
                // Server values take priority over local code values
                return {
                  toolId,
                  similarity: 0, // No match (white) when no input provided
                  ...localToolData,
                  ...toolData, // Server data overrides local data
                }
              })
            }
          } else if (response) {
            console.warn('Tool metadata endpoint returned status:', response.status)
          }
        } catch (error) {
          console.warn('Tool metadata fetch failed, will use local fallback:', error?.message || String(error))
        }

        // If no tools from server, use local TOOLS as fallback
        if (allTools.length === 0) {
          allTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
            toolId,
            similarity: 0,
            ...toolData,
          }))
        }

        // Filter out tools with show_in_recommendations = false
        let visibleTools = allTools.filter(tool => tool.show_in_recommendations !== false)

        // Ensure selected tool is always in the visible list
        if (selectedToolRef.current && !visibleTools.find(t => t.toolId === selectedToolRef.current.toolId)) {
          visibleTools = [selectedToolRef.current, ...visibleTools]
        }

        // Sync visibility map from tool metadata
        const newVisibilityMap = {}
        allTools.forEach(tool => {
          if (tool.show_in_recommendations !== undefined) {
            newVisibilityMap[tool.toolId] = tool.show_in_recommendations !== false
          }
        })

        if (Object.keys(newVisibilityMap).length > 0) {
          visibilityMapRef.current = newVisibilityMap
        }

        setPredictedTools(visibleTools)
      } catch (err) {
        console.error('Unexpected error in initializeTools:', err?.message || String(err))
        // Set tools to empty fallback if something goes wrong
        const fallbackTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
          toolId,
          similarity: 0,
          ...toolData,
        }))
        setPredictedTools(fallbackTools)
      } finally {
        setInitialToolsLoading(false)
      }
    }

    initializeTools()
  }, [])

  const handleSelectTool = useCallback(
    (tool) => {
      // Check if clicking the same tool that's already selected
      const isAlreadySelected = selectedToolRef.current?.toolId === tool?.toolId

      if (isAlreadySelected) {
        // Deselect the tool
        setSelectedTool(null)
        setOutputWarnings([])
        selectedToolRef.current = null
        setOutputResult(null)
        setError(null)
        setToolLoading(false)
        router.push('/', undefined, { shallow: true })
      } else {
        // Select the new tool
        // Only reset output if tool is actually changing
        const toolChanged = selectedToolRef.current?.toolId !== tool?.toolId

        setSelectedTool(tool)
        setOutputWarnings([]) // Clear warnings when tool changes
        selectedToolRef.current = tool  // Update ref for next comparison

        // Initialize config for the selected tool (always, not just on change)
        const initialConfig = {}
        if (tool?.configSchema) {
          tool.configSchema.forEach(field => {
            initialConfig[field.id] = field.default || ''
          })
        }
        setConfigOptions(initialConfig)

        // Update URL with selected tool
        if (tool?.toolId) {
          router.push({ query: { tool: tool.toolId } }, undefined, { shallow: true })
        }

        // Only reset output when switching to a different tool
        if (toolChanged) {
          setOutputResult(null)
          setError(null)
          setToolLoading(false)
        }
      }
    },
    [router]
  )

  const handleHomeClick = useCallback(() => {
    setSelectedTool(null)
    setOutputWarnings([])
    selectedToolRef.current = null
    setOutputResult(null)
    setError(null)
    setToolLoading(false)
    router.push('/', undefined, { shallow: true })
  }, [router])

  // Handle tool selection from URL query parameter
  useEffect(() => {
    if (!router.isReady || !router.query.tool || predictedTools.length === 0) return

    const toolId = router.query.tool
    const tool = predictedTools.find(t => t.toolId === toolId)

    if (tool && selectedToolRef.current?.toolId !== toolId) {
      handleSelectTool(tool)
    }
  }, [router.isReady, router.query.tool, predictedTools, handleSelectTool])

  const handleInputChange = useCallback((text, image, preview, isLoadExample) => {
    const isAddition = text.length > previousInputLength
    const isEmpty = !text || text.trim() === ''
    const hasImage = preview !== null && preview !== undefined

    if (hasImage) {
      console.log('Image detected in input change:', { text: text.substring(0, 50), hasImage: true, isEmpty, isAddition, isLoadExample })
    }

    const nextClassification = classifyMarkdownHtmlInput(text)
    setContentClassification(nextClassification)

    // Update the ref to track actual input value (not state, which may lag)
    currentInputRef.current = text

    setInputText(text)
    setInputImage(image)
    setImagePreview(preview)
    setPreviousInputLength(text.length)

    // Reset regex tester config to defaults when loading an example
    if (isLoadExample && selectedTool?.toolId === 'regex-tester') {
      const defaultConfig = {
        pattern: '[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        flags: 'g',
        replacement: ''
      }
      setConfigOptions(defaultConfig)
    }

    // Increment key to trigger effect on EVERY input change, bypassing batching
    setInputChangeKey(prev => prev + 1)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Clear output immediately if input is empty based on actual value, not state
    if (isEmpty) {
      setOutputResult(null)
      setError(null)
      setLoading(false)
    }

    // Only run prediction if text was ADDED, not when deleting
    // Exception: Always run prediction when loading an example, pasting content, or uploading an image
    // The fourth parameter can be either isPaste or isLoadExample flag
    if (!isAddition && !isLoadExample && !hasImage) {
      setLoading(false)
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      // Clean up any existing abort controller from previous request
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort()
        } catch (e) {
          // Ignore
        }
      }
      if (abortTimeoutRef.current) {
        clearTimeout(abortTimeoutRef.current)
        abortTimeoutRef.current = null
      }

      // Clear any existing loading timer
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }

      // Only show loading if the request takes longer than 500ms
      loadingTimerRef.current = setTimeout(() => {
        setLoading(true)
      }, 500)

      const predictTools = async () => {
        let controller = null

        try {
          // Store the classification that triggered this search
          const triggeringClassification = fastLocalClassification(text)
          previousClassificationRef.current = triggeringClassification

          // Fetch with 20 second timeout
          try {
            controller = new AbortController()
            abortControllerRef.current = controller
          } catch (e) {
            console.debug('Failed to create AbortController:', e?.message || String(e))
            throw new Error('Prediction service unavailable')
          }

          // Set up timeout to abort fetch if it takes too long
          abortTimeoutRef.current = setTimeout(() => {
            try {
              if (controller && !controller.signal.aborted) {
                controller.abort()
              }
            } catch (e) {
              // Ignore errors during abort
            }
          }, 20000)

          let response = null

          try {
            // Only proceed with fetch if controller exists and signal hasn't been aborted
            if (!controller) {
              throw new Error('Prediction service unavailable')
            }

            // Check if signal is already aborted (shouldn't be at this point)
            let isSignalAborted = false
            try {
              isSignalAborted = controller.signal.aborted
            } catch (e) {
              // If we can't even check the signal, something is very wrong
              throw e
            }

            if (isSignalAborted) {
              // Signal was aborted, don't attempt fetch
              return
            }

            const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
            const predictUrl = `${baseUrl}/api/tools/predict`

            try {
              const predictPayload = {
                inputText: text,
                inputImage: preview ? 'image' : null,
              }
              console.log('Sending prediction request with payload:', predictPayload)
              response = await fetch(predictUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(predictPayload),
                signal: controller.signal,
                credentials: 'same-origin',
              })
            } catch (innerFetchError) {
              // Re-throw to be caught by outer catch block
              throw innerFetchError
            }
          } catch (fetchError) {
            // Clear timeout before handling error
            if (abortTimeoutRef.current) {
              clearTimeout(abortTimeoutRef.current)
              abortTimeoutRef.current = null
            }

            // Handle fetch errors gracefully
            if (fetchError.name === 'AbortError') {
              console.debug('Predict API request aborted')
              // Silently return - request was cancelled
              return
            }

            if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
              console.debug('Network error during prediction:', fetchError.message)
            } else {
              console.debug('Predict API fetch error:', fetchError?.message || String(fetchError))
            }

            // Don't throw - fall back gracefully to existing tools
            return
          }

          // Clear timeout since fetch completed
          if (abortTimeoutRef.current) {
            clearTimeout(abortTimeoutRef.current)
            abortTimeoutRef.current = null
          }

          // Validate response
          if (!response) {
            console.debug('No response from predict API')
            return
          }

          if (!response.ok) {
            const errorText = response ? await response.text() : 'No response'
            console.debug('Predict API error:', response?.status, errorText)
            return
          }

          // Parse response
          let data
          try {
            data = await response.json()
          } catch (jsonError) {
            console.debug('Failed to parse prediction response:', jsonError?.message || String(jsonError))
            return
          }

          // Validate data structure
          if (!data || !Array.isArray(data.predictedTools)) {
            console.debug('Invalid prediction data structure')
            return
          }

          console.log('Prediction response received with tools:', data.predictedTools.slice(0, 5).map(t => ({ toolId: t.toolId, similarity: t.similarity })))

          // Map tools with metadata
          let toolsWithMetadata = data.predictedTools.map(tool => {
            const localToolData = TOOLS[tool.toolId] || {}
            return {
              ...localToolData,
              ...tool,
            }
          })

          // Filter out tools with show_in_recommendations = false
          toolsWithMetadata = toolsWithMetadata.filter(tool => tool.show_in_recommendations !== false)
          console.log('After filtering, showing tools:', toolsWithMetadata.slice(0, 5).map(t => ({ toolId: t.toolId, name: t.name, similarity: t.similarity })))
          setPredictedTools(toolsWithMetadata)
        } catch (err) {
          // Catch any unexpected errors
          console.debug('Unexpected error in predictTools:', err?.message || String(err))
          // Don't throw - let app continue with existing tool list
        } finally {
          // Always clean up resources
          if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current)
            loadingTimerRef.current = null
          }
          if (abortTimeoutRef.current) {
            clearTimeout(abortTimeoutRef.current)
            abortTimeoutRef.current = null
          }
          // Only clear controller ref if it's still the one we created
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null
          }
          setLoading(false)
        }
      }

      // Execute predictTools asynchronously without blocking
      predictTools().catch(err => {
        console.debug('Unhandled error in predictTools:', err?.message || String(err))
      })
    }, 300)
  }, [fastLocalClassification, previousInputLength, selectedTool, setConfigOptions])

  const handleImageChange = useCallback((image, preview) => {
    setInputImage(image)
    setImagePreview(preview)
  }, [])


  const handleConfigChange = useCallback(
    (newConfig) => {
      setConfigOptions(prevConfig => ({
        ...prevConfig,
        ...newConfig
      }))
    },
    []
  )

  const autoRunTool = useCallback(
    async (tool, config, textInput = inputText, imageInput = imagePreview) => {
      if (!tool) return

      setToolLoading(true)

      try {
        let textToUse = textInput || ''

        // If no input and no image, don't run the tool
        if (!textToUse && !imageInput) {
          setToolLoading(false)
          return
        }

        // Special handling for various tools with their own configs
        let finalConfig = config

        if (tool.toolId === 'math-evaluator') {
          finalConfig = {
            ...config,
            ...numericConfig,
          }
        } else if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'findReplace') {
          finalConfig = {
            ...config,
            findText: findReplaceConfig.findText || '',
            replaceText: findReplaceConfig.replaceText || '',
            useRegex: findReplaceConfig.useRegex || false,
            matchCase: findReplaceConfig.matchCase || false,
          }
        } else if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'textDiff') {
          finalConfig = {
            ...config,
            text2: diffConfig.text2 || '',
          }
        } else if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'sortLines') {
          finalConfig = {
            ...config,
            order: sortLinesConfig.order || 'asc',
            caseSensitive: sortLinesConfig.caseSensitive || false,
            removeDuplicates: sortLinesConfig.removeDuplicates || false,
          }
        } else if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'removeExtras') {
          finalConfig = {
            ...config,
            removePdfGarbage: removeExtrasConfig.removePdfGarbage !== false,
            removeInvisibleChars: removeExtrasConfig.removeInvisibleChars !== false,
            stripHtml: removeExtrasConfig.stripHtml !== false,
            stripMarkdown: removeExtrasConfig.stripMarkdown !== false,
            normalizeWhitespace: removeExtrasConfig.normalizeWhitespace !== false,
            fixPunctuationSpacing: removeExtrasConfig.fixPunctuationSpacing !== false,
            compressSpaces: removeExtrasConfig.compressSpaces !== false,
            trimLines: removeExtrasConfig.trimLines !== false,
            removeLineBreaks: removeExtrasConfig.removeLineBreaks === true,
            removeBlankLines: removeExtrasConfig.removeBlankLines !== false,
            removeTimestamps: removeExtrasConfig.removeTimestamps === true,
            removeDuplicateLines: removeExtrasConfig.removeDuplicateLines === true,
          }
        } else if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'delimiterTransformer') {
          finalConfig = {
            ...config,
            delimiter: delimiterTransformerConfig.delimiter ?? ' ',
            mode: delimiterTransformerConfig.mode ?? 'rows',
            joinSeparator: delimiterTransformerConfig.joinSeparator ?? ',',
          }
        } else if (tool.toolId === 'checksum-calculator') {
          finalConfig = {
            ...config,
            compareText: checksumCompareText || '',
          }
        }

        // JWT Decoder uses client-side decoding only (no JWT sent to server)
        if (tool.toolId === 'jwt-decoder') {
          const { jwtDecoderClient } = await import('../lib/jwtDecoderClient.js')
          const result = jwtDecoderClient(textToUse, finalConfig)
          setOutputResult(result)
          setOutputWarnings([])
        } else {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
          const runUrl = `${baseUrl}/api/tools/run`

          let controller = null
          let timeoutId = null
          let response = null

          try {
            // Create abort controller with 30 second timeout
            try {
              controller = new AbortController()
            } catch (e) {
              throw new Error('Failed to create request controller')
            }

            timeoutId = setTimeout(() => {
              try {
                if (controller && !controller.signal.aborted) {
                  controller.abort()
                }
              } catch (e) {
                // Ignore abort errors
              }
            }, 30000)

            // Make the fetch request
            try {
              response = await fetch(runUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  toolId: tool.toolId,
                  inputText: textToUse,
                  inputImage: imageInput,
                  config: finalConfig,
                }),
                credentials: 'same-origin',
                signal: controller.signal,
              })
            } catch (fetchErr) {
              if (fetchErr.name === 'AbortError') {
                throw new Error('Request timeout - server took too long to respond')
              }
              if (fetchErr instanceof TypeError && fetchErr.message.includes('fetch')) {
                throw new Error('Network error - unable to reach server')
              }
              throw fetchErr
            } finally {
              // Clear timeout
              if (timeoutId) {
                clearTimeout(timeoutId)
                timeoutId = null
              }
            }

            // Validate response exists
            if (!response) {
              throw new Error('No response from server')
            }

            // Parse response JSON
            let data
            try {
              data = await response.json()
            } catch (jsonError) {
              console.debug('Failed to parse tool response:', jsonError?.message || String(jsonError))
              throw new Error('Invalid response from server')
            }

            // Check response status
            if (!response.ok) {
              throw new Error(data?.error || `Server error: ${response.status}`)
            }

            // Validate and set result
            setOutputResult(data.result)
            setOutputWarnings(data.warnings || [])
          } catch (err) {
            // Rethrow errors to be caught by outer catch block
            throw err
          } finally {
            // Always clear timeout
            if (timeoutId) {
              clearTimeout(timeoutId)
            }
          }
        }
      } catch (err) {
        const errorMessage = err?.message || 'Tool execution failed'
        setError(errorMessage)
        console.debug('Tool execution error:', errorMessage)
      } finally {
        setToolLoading(false)
      }
    },
    [inputText, imagePreview, activeToolkitSection, findReplaceConfig, diffConfig, sortLinesConfig, removeExtrasConfig, checksumCompareText, numericConfig, delimiterTransformerConfig]
  )

  const handleRegenerate = useCallback(() => {
    if (selectedTool) {
      autoRunTool(selectedTool, configOptions)
    }
  }, [selectedTool, configOptions, autoRunTool])

  // Run tool in real-time as input or config changes
  useEffect(() => {
    if (!selectedTool) return

    // Always use the actual current input value from ref, not the batched state
    const actualInput = currentInputRef.current
    const isEmpty = !actualInput || actualInput.trim() === ''

    // If actual input is empty, clear output immediately and stop
    if (isEmpty && !imagePreview) {
      setOutputResult(null)
      setError(null)
      setLoading(false)
      return
    }

    const runTool = async () => {
      // Use the actual input from ref, not state which may be batched/stale
      await autoRunTool(selectedTool, configOptions, actualInput, imagePreview)
    }

    runTool()
  }, [selectedTool, imagePreview, configOptions, checksumCompareText, autoRunTool, inputChangeKey, findReplaceConfig, diffConfig, sortLinesConfig, removeExtrasConfig, delimiterTransformerConfig, activeToolkitSection])

  // Helper function to determine if there's output to use
  const getHasOutputToUse = () => {
    if (!outputResult) return false
    if (!selectedTool) return false

    // For Text Toolkit, check specific sections
    if (selectedTool.toolId === 'text-toolkit' && activeToolkitSection) {
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
      return key && outputResult[key]
    }

    // For CSS Formatter, check formatted field
    if (selectedTool.toolId === 'css-formatter' && outputResult?.formatted) {
      return true
    }

    // For Web Playground, check formatted field
    if (selectedTool.toolId === 'web-playground' && outputResult?.formatted) {
      return true
    }

    // For formatters, check formatted or output field
    const formatterTools = ['sql-formatter', 'json-formatter', 'xml-formatter', 'yaml-formatter', 'js-formatter']
    if (formatterTools.includes(selectedTool.toolId)) {
      return !!(outputResult?.formatted || outputResult?.output)
    }

    // For regular tools, check output field
    return !!outputResult?.output
  }

  // Helper function to determine if a tool supports copying output to input
  const getCanCopyOutput = () => {
    if (!selectedTool) return false

    // Tools that don't support copying output back to input
    const nonCopyableTools = [
      'base-converter',
      'qr-code-generator',
      'ip-toolkit',
      'email-validator',
      'image-resizer',
      'image-compressor',
      'json-to-table'
    ]

    return !nonCopyableTools.includes(selectedTool.toolId)
  }

  // Handler for use output button
  const handleUseOutputClick = () => {
    if (universalInputRef.current?.handleUseOutput) {
      universalInputRef.current.handleUseOutput()
    }
  }

  // Generate case conversion results for INPUT tab chevron menu
  // Used by text-toolkit when in caseConverter mode
  const caseConversionResults = (() => {
    if (selectedTool?.toolId !== 'text-toolkit' || activeToolkitSection !== 'caseConverter' || !outputResult?.caseConverter) {
      return []
    }

    const caseResults = outputResult.caseConverter
    return [
      {
        label: 'UPPERCASE',
        value: caseResults.uppercase,
        onSelect: () => handleInputChange(caseResults.uppercase),
      },
      {
        label: 'lowercase',
        value: caseResults.lowercase,
        onSelect: () => handleInputChange(caseResults.lowercase),
      },
      {
        label: 'Title Case',
        value: caseResults.titleCase,
        onSelect: () => handleInputChange(caseResults.titleCase),
      },
      {
        label: 'Sentence case',
        value: caseResults.sentenceCase,
        onSelect: () => handleInputChange(caseResults.sentenceCase),
      },
    ]
  })()

  // Handler for replacing CSS input with formatted CSS output
  const handleUseCssOutputClick = () => {
    if (cssFormattedOutput && activeMarkdownInputTab === 'css') {
      setMarkdownCustomCss(cssFormattedOutput)
    }
  }

  // Handler for replacing JS input with formatted JS output
  const handleUseJsOutputClick = () => {
    if (jsFormattedOutput && activeMarkdownInputTab === 'js') {
      setMarkdownCustomJs(jsFormattedOutput)
    }
  }

  return (
    <>
      <Head>
        {/* Dynamic meta tags based on selected tool */}
        {(() => {
          const metadata = generatePageMetadata({
            seoSettings: props?.seoSettings || {},
            title: selectedTool ? selectedTool.name : testTitle,
            description: selectedTool ? selectedTool.description : testDescription,
            path: selectedTool ? `/?tool=${selectedTool.toolId}` : '/',
            tool: selectedTool || null,
          })

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pioneerwebtools.com'
          const canonicalUrl = metadata.canonical || siteUrl

          return (
            <>
              <title>{metadata.title}</title>
              <meta name="description" content={metadata.description} />
              {metadata.keywords && <meta name="keywords" content={metadata.keywords} />}
              <link rel="canonical" href={canonicalUrl} />

              {/* Open Graph Tags for social sharing */}
              <meta property="og:title" content={metadata.openGraph?.title || metadata.title} />
              <meta property="og:description" content={metadata.openGraph?.description || metadata.description} />
              <meta property="og:url" content={metadata.openGraph?.url || canonicalUrl} />
              <meta property="og:type" content={metadata.openGraph?.type || 'website'} />
              {metadata.openGraph?.image && <meta property="og:image" content={metadata.openGraph.image} />}

              {/* Twitter Card Tags */}
              <meta name="twitter:card" content={metadata.twitter?.card || 'summary_large_image'} />
              <meta name="twitter:title" content={metadata.twitter?.title || metadata.title} />
              <meta name="twitter:description" content={metadata.twitter?.description || metadata.description} />
              {metadata.twitter?.site && <meta name="twitter:site" content={metadata.twitter.site} />}
              {metadata.twitter?.creator && <meta name="twitter:creator" content={metadata.twitter.creator} />}
            </>
          )
        })()}

        {/* Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateSoftwareAppSchema(props?.seoSettings || {})),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema(props?.seoSettings || {})),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema(props?.seoSettings || {}, [
              { name: 'Tools', path: '/' }
            ])),
          }}
        />
      </Head>

      <div className={styles.layout}>
        <div className={styles.header}>
          <button
            className={styles.headerContent}
            onClick={handleHomeClick}
            title="Go to home and deselect tool"
            aria-label="Go to home and deselect tool"
          >
            <h1>{siteName}</h1>
            <p>Paste anything — we'll auto-detect the perfect tool</p>
          </button>
          <ThemeToggle />
        </div>

        <div className={styles.bodyContainer}>
          <ToolSidebar
            predictedTools={predictedTools}
            selectedTool={selectedTool}
            onSelectTool={handleSelectTool}
            loading={loading}
            initialLoading={initialToolsLoading}
            sidebarOpen={sidebarOpen}
            onSidebarToggle={setSidebarOpen}
          />

          <main className={styles.mainContent}>
            <div className={styles.content}>
          <div
            className={`${styles.toolContainer} ${isPreviewFullscreen ? styles.fullscreenPreview : ''}`}
            ref={dividerContainerRef}
            style={!isPreviewFullscreen && isDesktop ? {
              gridTemplateColumns: `${dividerLeftRatio}% auto 1fr`
            } : undefined}
          >
            <div className={`${styles.leftPanel} ${isPreviewFullscreen ? styles.hidden : ''}`}>
              <InputTabs
                selectedTool={selectedTool}
                inputTabLabel={selectedTool?.toolId === 'web-playground' ? 'HTML' : 'INPUT'}
                onActiveTabChange={selectedTool?.toolId === 'web-playground' ? handleMarkdownInputTabChange : null}
                infoContent={!selectedTool && <ValuePropositionCard />}
                tabActions={null}
                inputTabResults={caseConversionResults}
                hasOutputToUse={getHasOutputToUse()}
                onUseOutput={getCanCopyOutput() ? handleUseOutputClick : null}
                canCopyOutput={getCanCopyOutput()}
                useOutputLabel={selectedTool?.toolId === 'web-playground' ? 'Format code' : 'Replace with output'}
                hasCssOutputToUse={selectedTool?.toolId === 'web-playground' && activeMarkdownInputTab === 'css' && markdownCustomCss && cssFormattedOutput ? true : false}
                onUseCssOutput={selectedTool?.toolId === 'web-playground' ? () => handleUseCssOutputClick() : null}
                canCopyCssOutput={true}
                useCssOutputLabel={selectedTool?.toolId === 'web-playground' ? 'Format code' : 'Replace with output'}
                hasJsOutputToUse={selectedTool?.toolId === 'web-playground' && activeMarkdownInputTab === 'js' && markdownCustomJs && jsFormattedOutput ? true : false}
                onUseJsOutput={selectedTool?.toolId === 'web-playground' ? () => handleUseJsOutputClick() : null}
                canCopyJsOutput={true}
                useJsOutputLabel={selectedTool?.toolId === 'web-playground' ? 'Format code' : 'Replace with output'}
                cssContent={selectedTool?.toolId === 'web-playground' ? (
                  <ToolOutputPanel
                    result={outputResult}
                    outputType={selectedTool?.outputType}
                    loading={toolLoading}
                    error={error}
                    toolId={selectedTool?.toolId}
                    activeToolkitSection={activeToolkitSection}
                    configOptions={configOptions}
                    onConfigChange={setConfigOptions}
                    inputText={inputText}
                    imagePreview={imagePreview}
                    warnings={outputWarnings}
                    onInputUpdate={(text) => handleInputChange(text, null, null, true)}
                    showAnalysisTab={showAnalysisTab}
                    onShowAnalysisTabChange={setShowAnalysisTab}
                    showRulesTab={showRulesTab}
                    onShowRulesTabChange={setShowRulesTab}
                    isPreviewFullscreen={isPreviewFullscreen}
                    onTogglePreviewFullscreen={setIsPreviewFullscreen}
                    renderCssTabOnly={true}
                    activeMarkdownInputTab={activeMarkdownInputTab}
                    markdownInputMode={markdownInputMode}
                    markdownCustomCss={markdownCustomCss}
                    onMarkdownCustomCssChange={setMarkdownCustomCss}
                    onCssFormattedOutput={setCssFormattedOutput}
                    markdownCustomJs={markdownCustomJs}
                    onMarkdownCustomJsChange={setMarkdownCustomJs}
                    cssConfigOptions={cssConfigOptions}
                    onCssConfigChange={setCssConfigOptions}
                    jsConfigOptions={jsConfigOptions}
                    onJsConfigChange={setJsConfigOptions}
                    onJsFormatterDiagnosticsChange={setJsFormatterDiagnostics}
                  />
                ) : null}
                jsContent={selectedTool?.toolId === 'web-playground' ? (
                  <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '16px',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: '1.5',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(156, 39, 176, 0.08)',
                      border: '1px solid rgba(156, 39, 176, 0.2)',
                      borderRadius: '4px',
                    }}>
                      Edit JavaScript to add interactivity. Scripts run in the preview with access to the DOM and CSS.
                    </div>
                    <JSEditorInput
                      value={markdownCustomJs}
                      onChange={setMarkdownCustomJs}
                      diagnostics={jsFormatterDiagnostics.filter(d => d.category !== 'lint')}
                    />
                  </div>
                ) : null}
                inputContent={
                  <div className={styles.inputSection} style={{ overflow: 'hidden', height: '100%' }}>
                    <UniversalInput
                      ref={universalInputRef}
                      inputText={inputText}
                      inputImage={inputImage}
                      imagePreview={imagePreview}
                      onInputChange={handleInputChange}
                      onImageChange={handleImageChange}
                      onCompareTextChange={setChecksumCompareText}
                      compareText={checksumCompareText}
                      selectedTool={selectedTool}
                      configOptions={configOptions}
                      getToolExample={getToolExample}
                      errorData={selectedTool?.toolId === 'js-formatter' ? outputResult : null}
                      predictedTools={predictedTools}
                      onSelectTool={handleSelectTool}
                      validationErrors={outputResult?.diagnostics && Array.isArray(outputResult.diagnostics) ? outputResult.diagnostics.filter(d => d.type === 'error') : []}
                      lintingWarnings={outputResult?.diagnostics && Array.isArray(outputResult.diagnostics) ? outputResult.diagnostics.filter(d => d.type === 'warning') : []}
                      result={outputResult}
                      activeToolkitSection={activeToolkitSection}
                      isPreviewFullscreen={isPreviewFullscreen}
                      onTogglePreviewFullscreen={setIsPreviewFullscreen}
                    />
                  </div>
                }
                optionsContent={
                  selectedTool ? (
                    <div className={styles.configSection}>
                      <ToolDescriptionContent tool={selectedTool} />
                    </div>
                  ) : null
                }
                globalOptionsContent={
                  selectedTool ? (
                    <div className={styles.configSection}>
                      <ToolConfigPanel
                        tool={selectedTool}
                        onConfigChange={handleConfigChange}
                        onCssConfigChange={setCssConfigOptions}
                        loading={toolLoading}
                        onRegenerate={handleRegenerate}
                        currentConfig={configOptions}
                        result={outputResult}
                        contentClassification={contentClassification}
                        activeToolkitSection={activeToolkitSection}
                        onToolkitSectionChange={setActiveToolkitSection}
                        markdownInputMode={selectedTool?.toolId === 'web-playground' ? 'input' : undefined}
                        cssConfigOptions={cssConfigOptions}
                        findReplaceConfig={findReplaceConfig}
                        onFindReplaceConfigChange={setFindReplaceConfig}
                        diffConfig={diffConfig}
                        onDiffConfigChange={setDiffConfig}
                        sortLinesConfig={sortLinesConfig}
                        onSortLinesConfigChange={setSortLinesConfig}
                        removeExtrasConfig={removeExtrasConfig}
                        onRemoveExtrasConfigChange={setRemoveExtrasConfig}
                        delimiterTransformerConfig={delimiterTransformerConfig}
                        onDelimiterTransformerConfigChange={setDelimiterTransformerConfig}
                        onSetGeneratedText={handleInputChange}
                        showAnalysisTab={showAnalysisTab}
                        onShowAnalysisTabChange={setShowAnalysisTab}
                        showRulesTab={showRulesTab}
                        onShowRulesTabChange={setShowRulesTab}
                      />
                      {selectedTool?.toolId === 'math-evaluator' && (
                        <NumericConfig config={numericConfig} onConfigChange={setNumericConfig} floatArtifactDetected={outputResult?.diagnostics?.warnings?.some(w => w.includes('Floating-point precision artifact'))} />
                      )}
                    </div>
                  ) : null
                }
                tabOptionsMap={{}}
              />
            </div>

            <div
              className={styles.divider}
              onMouseDown={handleDividerMouseDown}
              title="Drag to resize panels"
            />

            <div className={styles.rightPanel}>
              <div className={styles.outputSection}>
                {selectedTool?.toolId === 'ip-address-toolkit' ? (
                  <IPToolkitOutputPanel
                    key={selectedTool?.toolId}
                    result={outputResult}
                    inputText={inputText}
                  />
                ) : selectedTool?.toolId === 'email-validator' ? (
                  <EmailValidatorOutputPanel
                    key={selectedTool?.toolId}
                    result={outputResult}
                  />
                ) : selectedTool?.toolId === 'qr-code-generator' ? (
                  <QRCodeGeneratorOutputPanel
                    key={selectedTool?.toolId}
                    result={outputResult}
                  />
                ) : (
                  <ToolOutputPanel
                    key={selectedTool?.toolId}
                    result={outputResult}
                    outputType={selectedTool?.outputType}
                    loading={toolLoading}
                    error={error}
                    toolId={selectedTool?.toolId}
                    activeToolkitSection={activeToolkitSection}
                    configOptions={configOptions}
                    onConfigChange={setConfigOptions}
                    inputText={inputText}
                    imagePreview={imagePreview}
                    warnings={outputWarnings}
                    onInputUpdate={(text) => handleInputChange(text, null, null, true)}
                    showAnalysisTab={showAnalysisTab}
                    onShowAnalysisTabChange={setShowAnalysisTab}
                    showRulesTab={showRulesTab}
                    onShowRulesTabChange={setShowRulesTab}
                    isPreviewFullscreen={isPreviewFullscreen}
                    onTogglePreviewFullscreen={setIsPreviewFullscreen}
                    renderCssTabOnly={false}
                    activeMarkdownInputTab={activeMarkdownInputTab}
                    markdownInputMode={markdownInputMode}
                    markdownCustomCss={markdownCustomCss}
                    onMarkdownCustomCssChange={setMarkdownCustomCss}
                    markdownCustomJs={markdownCustomJs}
                    onMarkdownCustomJsChange={setMarkdownCustomJs}
                    onJsFormattedOutput={setJsFormattedOutput}
                    cssConfigOptions={cssConfigOptions}
                    onCssConfigChange={setCssConfigOptions}
                    jsConfigOptions={jsConfigOptions}
                    onJsConfigChange={setJsConfigOptions}
                    onJsFormatterDiagnosticsChange={setJsFormatterDiagnostics}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
        </div>



        <PageFooter showBackToTools={false} />
      </div>


    </>
  )
}

export async function getServerSideProps() {
  const { fetchSeoSettings } = await import('../lib/getSeoSettings')

  const seoSettings = await fetchSeoSettings()

  return {
    props: {
      siteName: seoSettings?.site_name || 'All-in-One Internet Tools',
      testTitle: seoSettings?.default_title || 'All-in-One Internet Tools',
      testDescription: seoSettings?.default_description || 'Paste anything — we\'ll auto-detect the perfect tool',
      seoSettings: seoSettings || {},
    },
  }
}
