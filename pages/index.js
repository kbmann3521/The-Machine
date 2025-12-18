import React, { useState, useCallback, useEffect, useRef } from 'react'
import Head from 'next/head'
import UniversalInput from '../components/UniversalInput'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import NumericConfig from '../components/NumericConfig'
import ToolOutputPanel from '../components/ToolOutputPanel'
import IPToolkitOutputPanel from '../components/IPToolkitOutputPanel'
import EmailValidatorOutputPanel from '../components/EmailValidatorOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import ToolDescriptionSidebar from '../components/ToolDescriptionSidebar'
import { FaCircleInfo } from 'react-icons/fa6'
import { TOOLS, getToolExample } from '../lib/tools'
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
  const [outputWarnings, setOutputWarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [toolLoading, setToolLoading] = useState(false)
  const [inputChangeKey, setInputChangeKey] = useState(0)
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
  const [checksumCompareText, setChecksumCompareText] = useState('')
  const [previousInputLength, setPreviousInputLength] = useState(0)
  const [numericConfig, setNumericConfig] = useState({
    precision: null,
    rounding: 'half-up',
    notation: 'auto',
    mode: 'float'
  })

  const debounceTimerRef = useRef(null)
  const selectedToolRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const visibilityMapRef = useRef({})
  const previousClassificationRef = useRef(null)
  const currentInputRef = useRef('')
  const abortControllerRef = useRef(null)
  const abortTimeoutRef = useRef(null)

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupPendingRequests()
    }
  }, [cleanupPendingRequests])

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
  useEffect(() => {
    const initializeTools = async () => {
      let allTools = []

      // First, try to fetch tool metadata from Supabase
      try {
        let response
        try {
          response = await fetch('/api/tools/get-metadata', {
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-cache',
          })
        } catch (fetchError) {
          console.debug('Tool metadata fetch error:', fetchError?.message || String(fetchError))
          throw fetchError
        }

        if (response.ok) {
          let data
          try {
            data = await response.json()
          } catch (parseError) {
            console.debug('Tool metadata parsing error:', parseError?.message || String(parseError))
            throw parseError
          }
          if (data?.tools && typeof data.tools === 'object') {
            // Use metadata from Supabase as source of truth
            allTools = Object.entries(data.tools).map(([toolId, toolData]) => {
              const localToolData = TOOLS[toolId] || {}
              // Supabase values take priority over local code values
              return {
                toolId,
                similarity: 0, // No match (white) when no input provided
                ...localToolData,
                ...toolData, // Supabase data overrides local data
              }
            })
          }
        } else {
          console.warn('Tool metadata endpoint returned non-200 status:', response.status)
        }
      } catch (error) {
        console.warn('Tool metadata fetch failed, will use local fallback:', error?.message || String(error))
      }

      // If no tools from Supabase, use local TOOLS as fallback
      if (allTools.length === 0) {
        console.warn('No tools from Supabase, using local fallback')
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
    }

    initializeTools()
  }, [])

  const handleSelectTool = useCallback(
    (tool) => {
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

      // Only reset output when switching to a different tool
      if (toolChanged) {
        setOutputResult(null)
        setError(null)
        setToolLoading(false)
      }
    },
    []
  )

  const handleInputChange = useCallback((text, image, preview) => {
    const isAddition = text.length > previousInputLength
    const isEmpty = !text || text.trim() === ''

    // Update the ref to track actual input value (not state, which may lag)
    currentInputRef.current = text

    setInputText(text)
    setInputImage(image)
    setImagePreview(preview)
    setPreviousInputLength(text.length)

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
    if (!isAddition) {
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
        try {
          // Store the classification that triggered this search
          const triggeringClassification = fastLocalClassification(text)
          previousClassificationRef.current = triggeringClassification

          // Fetch with 20 second timeout
          const controller = new AbortController()
          abortControllerRef.current = controller

          // Check if signal is already aborted before setting up timeout
          try {
            if (controller.signal.aborted) {
              return
            }
          } catch (e) {
            return
          }

          abortTimeoutRef.current = setTimeout(() => {
            try {
              if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
                abortControllerRef.current.abort()
              }
            } catch (e) {
              // Ignore abort errors
            }
          }, 20000)

          let response
          try {
            // Check again if signal was aborted during the delay
            let isAborted = false
            try {
              isAborted = controller.signal.aborted
            } catch (e) {
              isAborted = true
            }

            if (isAborted) {
              response = null
            } else {
              response = await fetch('/api/tools/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  inputText: text,
                  inputImage: preview ? 'image' : null,
                }),
                signal: controller.signal,
              })
            }
          } catch (fetchError) {
            if (abortTimeoutRef.current) {
              clearTimeout(abortTimeoutRef.current)
              abortTimeoutRef.current = null
            }
            // Handle fetch errors gracefully
            if (fetchError.name === 'AbortError') {
              console.debug('Predict API request aborted (expected during cleanup)')
              // Don't throw - let the outer catch handle the graceful fallback
              response = null
            } else {
              console.debug('Predict API fetch failed:', fetchError.message)
              throw new Error('Prediction service unavailable')
            }
          }

          // If response is null (aborted), fall back gracefully
          if (!response) {
            return
          }

          if (abortTimeoutRef.current) {
            clearTimeout(abortTimeoutRef.current)
            abortTimeoutRef.current = null
          }

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

          let toolsWithMetadata = data.predictedTools.map(tool => {
            const localToolData = TOOLS[tool.toolId] || {}
            // Supabase values take priority over local code values
            return {
              ...localToolData,
              ...tool, // Supabase data overrides local data
            }
          })

          // Filter out tools with show_in_recommendations = false
          // Only Supabase controls visibility
          toolsWithMetadata = toolsWithMetadata.filter(tool => tool.show_in_recommendations !== false)
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
          // Clean up abort timeout
          if (abortTimeoutRef.current) {
            clearTimeout(abortTimeoutRef.current)
            abortTimeoutRef.current = null
          }
          abortControllerRef.current = null
          setLoading(false)
        }
      }

      // Execute predictTools asynchronously without blocking
      // All errors are caught inside the function, so we don't need an outer catch
      predictTools().catch(err => {
        // This should rarely happen as errors are caught inside predictTools
        // but we catch it just in case
        if (err?.name !== 'AbortError') {
          console.debug('Unhandled error in predictTools:', err?.message || err)
        }
      })
    }, 300)
  }, [fastLocalClassification, previousInputLength])

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
          const response = await fetch('/api/tools/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: tool.toolId,
              inputText: textToUse,
              inputImage: imageInput,
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
          setOutputWarnings(data.warnings || [])
        }
      } catch (err) {
        const errorMessage = err?.message || 'Tool execution failed'
        setError(errorMessage)
        console.debug('Tool execution error:', errorMessage)
      } finally {
        setToolLoading(false)
      }
    },
    [inputText, imagePreview, activeToolkitSection, findReplaceConfig, diffConfig, sortLinesConfig, removeExtrasConfig, checksumCompareText]
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
  }, [selectedTool, imagePreview, configOptions, checksumCompareText, autoRunTool, inputChangeKey])


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
                />
              </div>

              {selectedTool && selectedTool?.toolId !== 'ip-address-toolkit' && (
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
                    <ToolConfigPanel
                      tool={selectedTool}
                      onConfigChange={handleConfigChange}
                      loading={toolLoading}
                      onRegenerate={handleRegenerate}
                      currentConfig={configOptions}
                      result={outputResult}
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
                      onSetGeneratedText={handleInputChange}
                    />
                  </div>
                </>
              )}

              {selectedTool?.toolId === 'ip-address-toolkit' && (
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

                  <div className={styles.ipToolkitTipsContainer}>
                    <div className={styles.tipItem}>
                      <span className={styles.tipLabel}>Single mode:</span>
                      <span className={styles.tipText}>One IP, IPv6, CIDR or range</span>
                    </div>
                    <div className={styles.tipItem}>
                      <span className={styles.tipLabel}>Bulk (2 items):</span>
                      <span className={styles.tipText}>Side-by-side comparison</span>
                    </div>
                    <div className={styles.tipItem}>
                      <span className={styles.tipLabel}>Bulk (3-7 items):</span>
                      <span className={styles.tipText}>Aggregate analysis & insights</span>
                    </div>
                  </div>
                </>
              )}
            </div>

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
