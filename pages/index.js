import React, { useState, useCallback, useEffect, useRef } from 'react'
import Head from 'next/head'
import UniversalInput from '../components/UniversalInput'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import ToolOutputPanel from '../components/ToolOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import ToolDescriptionSidebar from '../components/ToolDescriptionSidebar'
import IPToolkitConfigPanel from '../components/IPToolkitConfigPanel'
import IPToolkitOutputPanel from '../components/IPToolkitOutputPanel'
import { FaCircleInfo } from 'react-icons/fa6'
import { TOOLS, autoDetectToolConfig, getToolExample } from '../lib/tools'
import { resizeImage } from '../lib/imageUtils'
import { generateFAQSchema, generateBreadcrumbSchema, generateSoftwareAppSchema } from '../lib/seoUtils'
import styles from '../styles/hub.module.css'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [predictedTools, setPredictedTools] = useState([])
  const [selectedTool, setSelectedTool] = useState(null)
  const [configOptions, setConfigOptions] = useState({})
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [descriptionSidebarOpen, setDescriptionSidebarOpen] = useState(false)
  const [activeToolkitSection, setActiveToolkitSection] = useState('wordCounter')
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
  const [advancedMode, setAdvancedMode] = useState(false)
  const [previousInputLength, setPreviousInputLength] = useState(0)
  const [ipToolkitMode, setIpToolkitMode] = useState('single-ip')

  const debounceTimerRef = useRef(null)
  const selectedToolRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const visibilityMapRef = useRef({})
  const previousClassificationRef = useRef(null)

  useEffect(() => {
    selectedToolRef.current = selectedTool
  }, [selectedTool])

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
  const detectCleanTextIssues = useCallback((text) => {
    if (!text || typeof text !== 'string') return null

    const issues = {
      hasExcessiveSpaces: /  +/.test(text), // Multiple consecutive spaces
      hasBlankLines: /\n\s*\n/.test(text), // Multiple newlines with optional whitespace
      hasMixedWhitespace: /[\t\u00A0\u2003]/.test(text), // Tabs, non-breaking spaces, em spaces
      hasExcessiveLineBreaks: /\n\n\n/.test(text), // 3+ consecutive newlines
    }

    // Return true if ANY cleaning issue is detected
    const hasIssues = Object.values(issues).some(issue => issue)

    return hasIssues ? issues : null
  }, [])

  useEffect(() => {
    const initializeTools = async () => {
      let allTools = []

      // First, try to fetch tool metadata from Supabase
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 4000) // 4 second timeout

        const response = await fetch('/api/tools/get-metadata', {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        })
        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          if (data?.tools && typeof data.tools === 'object') {
            // Use metadata from Supabase
            allTools = Object.entries(data.tools).map(([toolId, toolData]) => ({
              toolId,
              similarity: 0, // No match (white) when no input provided
              ...toolData,
              // Merge with local TOOLS for any missing properties
              ...(TOOLS[toolId] || {}),
            }))
          }
        }
      } catch (error) {
        console.debug('Tool metadata fetch failed, using local fallback:', error?.message)
      }

      // If no tools from Supabase, fall back to local TOOLS
      if (allTools.length === 0) {
        allTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: 0, // No match (white) when no input provided
          ...toolData,
        }))
      }

      // Filter out tools with show_in_recommendations = false
      const visibleTools = allTools.filter(tool => tool.show_in_recommendations !== false)

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
    }

    initializeTools()
  }, [])

  const handleSelectTool = useCallback(
    (tool) => {
      setSelectedTool(tool)
      setAdvancedMode(true) // User manually selected - exit auto-detect

      // Initialize config for the selected tool
      const initialConfig = {}
      if (tool?.configSchema) {
        tool.configSchema.forEach(field => {
          initialConfig[field.id] = field.default || ''
        })
      }
      setConfigOptions(initialConfig)
    },
    []
  )

  const handleInputChange = useCallback((text, image, preview) => {
    const isAddition = text.length > previousInputLength

    setInputText(text)
    setInputImage(image)
    setImagePreview(preview)
    setPreviousInputLength(text.length)

    if (selectedToolRef.current && text) {
      // Skip auto-detection for JSON formatter - beautify is always the default
      if (selectedToolRef.current.toolId !== 'json-formatter') {
        const detectedConfig = autoDetectToolConfig(selectedToolRef.current.toolId, text)
        if (detectedConfig) {
          setConfigOptions(prevConfig => ({
            ...prevConfig,
            ...detectedConfig,
          }))
        }
      }
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setError(null)
      setOutputResult(null)

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
        try {
          // Store the classification that triggered this search
          const triggeringClassification = fastLocalClassification(text)
          previousClassificationRef.current = triggeringClassification

          // Fetch with 20 second timeout
          const controller = new AbortController()
          const abortTimeoutId = setTimeout(() => controller.abort(), 20000)

          let response
          try {
            response = await fetch('/api/tools/predict', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                inputText: text,
                inputImage: preview ? 'image' : null,
              }),
              signal: controller.signal,
            })
          } catch (fetchError) {
            clearTimeout(abortTimeoutId)
            // Handle fetch errors gracefully
            console.debug('Predict API fetch failed:', fetchError.message)
            // Fall through to use local prediction
            throw new Error('Prediction service unavailable')
          }

          clearTimeout(abortTimeoutId)

          if (!response || !response.ok) {
            const errorText = response ? await response.text() : 'No response'
            console.debug('Predict API error:', response?.status, errorText)
            throw new Error('Prediction service unavailable')
          }

          let data
          try {
            data = await response.json()
          } catch (jsonError) {
            console.debug('Failed to parse prediction response')
            throw new Error('Invalid response from prediction service')
          }

          if (!data || !Array.isArray(data.predictedTools)) {
            throw new Error('Invalid prediction data')
          }

          let toolsWithMetadata = data.predictedTools.map(tool => ({
            ...tool,
            ...TOOLS[tool.toolId],
          }))

          // Filter out tools with show_in_recommendations = false
          toolsWithMetadata = toolsWithMetadata.filter(tool => tool.show_in_recommendations !== false)

          // Auto-select the best match tool ONLY on input addition when not in advanced mode
          if (toolsWithMetadata.length > 0) {
            const topTool = toolsWithMetadata[0]
            // Only auto-select if:
            // 1. Input was added (not deleted) AND
            // 2. Not in advanced mode (user hasn't manually selected a tool)
            if (isAddition && !advancedMode) {
              console.log('Auto-selecting:', topTool.name)
              setSelectedTool(topTool)
            }

            // Check for text cleaning issues
            const cleanTextIssues = detectCleanTextIssues(text)

            // If top tool is Text Toolkit and there are cleaning issues, auto-switch to removeExtras
            if (topTool.toolId === 'text-toolkit' && cleanTextIssues) {
              setActiveToolkitSection('removeExtras')

              // Pre-enable relevant cleaning options based on detected issues
              const updatedConfig = { ...removeExtrasConfig }
              if (cleanTextIssues.hasExcessiveSpaces) {
                updatedConfig.compressSpaces = true
              }
              if (cleanTextIssues.hasBlankLines) {
                updatedConfig.removeBlankLines = true
              }
              if (cleanTextIssues.hasMixedWhitespace) {
                updatedConfig.normalizeWhitespace = true
              }
              if (cleanTextIssues.hasExcessiveLineBreaks) {
                updatedConfig.removeBlankLines = true
              }
              setRemoveExtrasConfig(updatedConfig)
            }

            // Set up initial config for the top tool
            const initialConfig = {}
            if (topTool?.configSchema) {
              topTool.configSchema.forEach(field => {
                initialConfig[field.id] = field.default || ''
              })
            }

            // Use suggested config from API, or fall back to local auto-detection
            if (topTool?.suggestedConfig) {
              Object.assign(initialConfig, topTool.suggestedConfig)
              // Apply activeToolkitSection if specified for text-toolkit
              if (topTool.toolId === 'text-toolkit' && topTool.suggestedConfig.activeToolkitSection) {
                setActiveToolkitSection(topTool.suggestedConfig.activeToolkitSection)
              }
            } else if (topTool.toolId !== 'json-formatter') {
              // Skip auto-detection for JSON formatter - beautify is always the default
              const detectedConfig = autoDetectToolConfig(topTool.toolId, text)
              if (detectedConfig) {
                Object.assign(initialConfig, detectedConfig)
              }
            }

            setConfigOptions(initialConfig)
          }
          setPredictedTools(toolsWithMetadata)
        } catch (err) {
          // Silently fail - the app will continue with the existing tool list
          // This prevents network errors from blocking the user
          console.debug('Prediction unavailable:', err?.message || err)
          // Don't set error - let user continue with whatever tools are already displayed
        } finally {
          // Clear the loading timer and disable loading
          if (loadingTimerRef.current) {
            clearTimeout(loadingTimerRef.current)
            loadingTimerRef.current = null
          }
          setLoading(false)
        }
      }

      predictTools()
    }, 300)
  }, [fastLocalClassification, selectedTool, advancedMode, detectCleanTextIssues, previousInputLength])

  const handleImageChange = useCallback((image, preview) => {
    setInputImage(image)
    setImagePreview(preview)
  }, [])

  const handleConfigChange = useCallback(
    (newConfig) => {
      setConfigOptions(newConfig)
    },
    []
  )

  const autoRunTool = useCallback(
    async (tool, config) => {
      if (!tool) return

      setToolLoading(true)

      try {
        let textToUse = inputText || ''

        // If no input, try to get an example/placeholder for any tool
        if (!textToUse && !imagePreview) {
          const example = getToolExample(tool.toolId, config)
          if (example) {
            textToUse = example
          } else {
            // No input and no example available - don't run the tool
            setToolLoading(false)
            setOutputResult(null)
            return
          }
        }

        // If still no input and no image, don't run the tool
        if (!textToUse && !imagePreview) {
          setToolLoading(false)
          setOutputResult(null)
          return
        }

        // Special handling for various tools with their own configs
        let finalConfig = config

        if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'findReplace') {
          finalConfig = {
            ...config,
            findText: findReplaceConfig.findText || '',
            replaceText: findReplaceConfig.replaceText || '',
            useRegex: findReplaceConfig.useRegex || false,
            matchCase: findReplaceConfig.matchCase || false,
          }
        } else if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'diff') {
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
        }

        const response = await fetch('/api/tools/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            toolId: tool.toolId,
            inputText: textToUse,
            inputImage: imagePreview,
            config: finalConfig,
          }),
        })

        if (!response) {
          throw new Error('No response from server')
        }

        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          throw new Error('Invalid response from server')
        }

        if (!response.ok) {
          throw new Error(data?.error || `Server error: ${response.status}`)
        }

        setOutputResult(data.result)
      } catch (err) {
        const errorMessage = err?.message || 'Tool execution failed'
        setError(errorMessage)
        console.debug('Tool execution error:', errorMessage)
      } finally {
        setToolLoading(false)
      }
    },
    [inputText, imagePreview, activeToolkitSection, findReplaceConfig, diffConfig, sortLinesConfig, removeExtrasConfig]
  )

  const handleRegenerate = useCallback(() => {
    if (selectedTool) {
      autoRunTool(selectedTool, configOptions)
    }
  }, [selectedTool, configOptions, autoRunTool])

  useEffect(() => {
    if (selectedTool) {
      const hasExample = getToolExample(selectedTool.toolId, configOptions)
      if (inputText || hasExample || imagePreview) {
        autoRunTool(selectedTool, configOptions)
      }
    }
  }, [selectedTool, inputText, configOptions, autoRunTool, imagePreview, activeToolkitSection])


  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateSoftwareAppSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFAQSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbSchema([
              { name: 'Tools', item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://your-domain.com'}/` }
            ])),
          }}
        />
      </Head>

      <div className={styles.layout}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>All-in-One Internet Tools</h1>
            <p>Paste anything — we'll auto-detect the perfect tool</p>
          </div>
          <ThemeToggle />
        </div>

        <div className={`${styles.bodyContainer} ${descriptionSidebarOpen ? styles.sidebarOpenDesktop : ''}`}>
          <ToolSidebar
            predictedTools={predictedTools}
            selectedTool={selectedTool}
            onSelectTool={handleSelectTool}
            loading={loading}
          />

          <main className={styles.mainContent}>
            <div className={styles.content}>
          <div className={styles.toolContainer}>
            <div className={styles.leftPanel}>
              <div className={styles.inputSection}>
                <UniversalInput
                  onInputChange={handleInputChange}
                  onImageChange={handleImageChange}
                  selectedTool={selectedTool}
                  configOptions={configOptions}
                  getToolExample={getToolExample}
                />
              </div>

              {selectedTool && (
                <>
                  <div className={styles.toolHeader}>
                    <div>
                      <h2 className={styles.toolTitle}>{selectedTool.name}</h2>
                      {selectedTool.description && (
                        <p className={styles.toolDescription}>{selectedTool.description}</p>
                      )}
                    </div>
                    <button
                      className={styles.descriptionToggle}
                      onClick={() => setDescriptionSidebarOpen(!descriptionSidebarOpen)}
                      aria-label="Toggle tool description"
                      title="View tool description"
                    >
                      <FaCircleInfo className={styles.descriptionIcon} />
                    </button>
                  </div>

                  <div className={styles.configSection}>
                    {selectedTool?.toolId === 'ip-address-toolkit' ? (
                      <IPToolkitConfigPanel />
                    ) : (
                      <ToolConfigPanel
                        tool={selectedTool}
                        onConfigChange={handleConfigChange}
                        loading={toolLoading}
                        onRegenerate={handleRegenerate}
                        currentConfig={configOptions}
                        activeToolkitSection={activeToolkitSection}
                        onToolkitSectionChange={setActiveToolkitSection}
                        findReplaceConfig={findReplaceConfig}
                        onFindReplaceConfigChange={setFindReplaceConfig}
                        diffConfig={diffConfig}
                        onDiffConfigChange={setDiffConfig}
                        sortLinesConfig={sortLinesConfig}
                        onSortLinesConfigChange={setSortLinesConfig}
                        removeExtrasConfig={removeExtrasConfig}
                        onRemoveExtrasConfigChange={setRemoveExtrasConfig}
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={styles.rightPanel}>
              <div className={styles.outputSection}>
                {selectedTool?.toolId === 'ip-address-toolkit' ? (
                  <IPToolkitOutputPanel activeMode={ipToolkitMode} result={outputResult} />
                ) : (
                  <ToolOutputPanel
                    result={outputResult}
                    outputType={selectedTool?.outputType}
                    loading={toolLoading}
                    error={error}
                    toolId={selectedTool?.toolId}
                    activeToolkitSection={activeToolkitSection}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
        </div>

        <ToolDescriptionSidebar
          tool={selectedTool}
          isOpen={descriptionSidebarOpen}
          onToggle={() => setDescriptionSidebarOpen(!descriptionSidebarOpen)}
        />

        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <p>© 2024 Pioneer Web Tools. All rights reserved.</p>
          </div>
        </footer>
      </div>

      {descriptionSidebarOpen && (
        <div
          className={styles.sidebarOverlay}
          onClick={() => setDescriptionSidebarOpen(false)}
        />
      )}
    </>
  )
}
