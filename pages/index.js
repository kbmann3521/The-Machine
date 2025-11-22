import React, { useState, useCallback, useEffect, useRef } from 'react'
import Head from 'next/head'
import UniversalInput from '../components/UniversalInput'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import ToolOutputPanel from '../components/ToolOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import ToolDescriptionSidebar from '../components/ToolDescriptionSidebar'
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
    trimSpaces: true,
    removeBlankLines: true,
    removeDuplicateLines: false,
    compressLineBreaks: false,
  })
  const debounceTimerRef = useRef(null)
  const selectedToolRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const visibilityMapRef = useRef({})
  const previousClassificationRef = useRef(null)

  useEffect(() => {
    selectedToolRef.current = selectedTool
  }, [selectedTool])

  // Fast local classification using heuristics (no API call)
  const fastLocalClassification = useCallback((text) => {
    const lowerText = text.toLowerCase().trim()

    let inputType = 'text'
    let contentSummary = lowerText.substring(0, 100)
    let intentHint = 'unknown'

    // Detect input type
    if (/^https?:\/\/|^www\./.test(lowerText)) {
      inputType = 'url'
      intentHint = 'url_processing'
    } else if (/^data:image/.test(lowerText) || /\.(jpg|jpeg|png|gif|webp)$/i.test(lowerText)) {
      inputType = 'image'
      intentHint = 'image_processing'
    } else if (/^[{}\[\]<>]|function|const|let|var|class|import|export/.test(lowerText)) {
      inputType = 'code'
      intentHint = 'code_processing'
    }

    // Detect intent hints from keywords
    if (/convert|transform|change|switch/.test(lowerText)) {
      intentHint = 'transformation'
    } else if (/count|measure|analyze|statistics|metric/.test(lowerText)) {
      intentHint = 'analysis'
    } else if (/find|search|match|locate|select/.test(lowerText)) {
      intentHint = 'search'
    } else if (/remove|clean|strip|delete|trim|compress|minify/.test(lowerText)) {
      intentHint = 'cleaning'
    } else if (/encode|decode|escape|unescape|hash|crypt/.test(lowerText)) {
      intentHint = 'encoding'
    } else if (/format|beautify|pretty|indent|organize/.test(lowerText)) {
      intentHint = 'formatting'
    }

    return {
      inputType,
      contentSummary,
      intentHint,
    }
  }, [])

  // Check if classification has meaningfully changed
  const hasClassificationChanged = useCallback((newClassification) => {
    const prev = previousClassificationRef.current

    // First classification always triggers search
    if (!prev) {
      return true
    }

    // Different input type = meaningful change
    if (prev.inputType !== newClassification.inputType) {
      return true
    }

    // Different intent hint = meaningful change
    if (prev.intentHint !== newClassification.intentHint) {
      return true
    }

    // If intent is 'unknown', small text changes might not matter much
    if (prev.intentHint === 'unknown' && newClassification.intentHint === 'unknown') {
      // Only re-search if text length changes significantly (e.g., user finished a word)
      const prevLen = prev.contentSummary.length
      const newLen = newClassification.contentSummary.length
      return Math.abs(newLen - prevLen) > 5
    }

    // Same input type and intent hint = no meaningful change
    return false
  }, [])

  useEffect(() => {
    const initializeTools = async () => {
      const allTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
        toolId,
        name: toolData.name,
        description: toolData.description,
        similarity: 0.5, // Neutral similarity for unranked tools
        ...toolData,
      }))

      // Fetch visibility flags from Supabase
      try {
        const response = await fetch('/api/tools/get-visibility')
        const { visibilityMap } = await response.json()

        // Store visibility map for use in predictTools
        visibilityMapRef.current = visibilityMap

        // Filter out tools with show_in_recommendations = false
        const visibleTools = allTools.filter(tool =>
          visibilityMap[tool.toolId] !== false
        )

        setPredictedTools(visibleTools)

        // Don't set a default tool - wait for user input to select the best match
      } catch (error) {
        console.error('Failed to fetch tool visibility:', error)
        // Fallback: show all tools if API call fails
        const visibleTools = allTools.filter(tool => tool.show_in_recommendations !== false)
        visibilityMapRef.current = {}
        setPredictedTools(visibleTools)

        // Don't set a default tool - wait for user input to select the best match
      }
    }

    initializeTools()
  }, [])

  const predictTools = useCallback(async (text, image, preview) => {
    if (!text && !image) {
      setPredictedTools(prevTools => {
        const allTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
          toolId,
          name: toolData.name,
          description: toolData.description,
          similarity: 0.5, // Neutral similarity for unranked tools
          ...toolData,
        }))

        // Filter out tools with show_in_recommendations = false using the stored visibility map
        const visibleTools = allTools.filter(tool => {
          // Use visibility map from API if available, otherwise fall back to TOOLS property
          if (visibilityMapRef.current && visibilityMapRef.current.hasOwnProperty(tool.toolId)) {
            return visibilityMapRef.current[tool.toolId] !== false
          }
          return tool.show_in_recommendations !== false
        })

        // Only update if the order has changed
        const newOrder = visibleTools.map(t => t.toolId).join(',')
        const prevOrder = prevTools.map(t => t.toolId).join(',')

        if (newOrder === prevOrder) {
          return prevTools
        }

        return visibleTools
      })
      return
    }

    setError(null)
    setOutputResult(null)

    // Clear any existing loading timer
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }

    // Only show loading if the request takes longer than 500ms
    loadingTimerRef.current = setTimeout(() => {
      setLoading(true)
    }, 500)

    try {
      // Store the classification that triggered this search
      const triggeringClassification = fastLocalClassification(text)
      previousClassificationRef.current = triggeringClassification

      const response = await fetch('/api/tools/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText: text,
          inputImage: preview ? 'image' : null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to predict tools')
      }

      const data = await response.json()

      const toolsWithMetadata = data.predictedTools.map(tool => ({
        ...tool,
        ...TOOLS[tool.toolId],
      }))

      // Always auto-select the best match tool from predictions
      if (toolsWithMetadata.length > 0) {
        const topTool = toolsWithMetadata[0]
        setSelectedTool(topTool)

        // Set up initial config for the top tool
        const initialConfig = {}
        if (topTool?.configSchema) {
          topTool.configSchema.forEach(field => {
            initialConfig[field.id] = field.default || ''
          })
        }

        // Auto-detect config from input if available
        const detectedConfig = autoDetectToolConfig(topTool.toolId, text)
        if (detectedConfig) {
          Object.assign(initialConfig, detectedConfig)
        }

        setConfigOptions(initialConfig)
      }
      setPredictedTools(toolsWithMetadata)
    } catch (err) {
      console.error('Prediction error:', err)
    } finally {
      // Clear the loading timer and disable loading
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
      }
      setLoading(false)
    }
  }, [fastLocalClassification])

  const handleInputChange = useCallback((text, image, preview) => {
    setInputText(text)
    setInputImage(image)
    setImagePreview(preview)

    if (selectedToolRef.current && text) {
      const detectedConfig = autoDetectToolConfig(selectedToolRef.current.toolId, text)
      if (detectedConfig) {
        setConfigOptions(prevConfig => ({
          ...prevConfig,
          ...detectedConfig,
        }))
      }
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      // Input Stability Check: Only search if classification meaningfully changed
      const newClassification = fastLocalClassification(text)

      if (hasClassificationChanged(newClassification)) {
        // Classification changed - run full semantic search
        previousClassificationRef.current = newClassification
        predictTools(text, image, preview)
      } else {
        // Classification unchanged - reuse cached results
        // Clear loading state since we're not making API calls
        setLoading(false)
      }
    }, 700)
  }, [predictTools, fastLocalClassification, hasClassificationChanged])

  const handleImageChange = useCallback((file, preview) => {
    setInputImage(file)
    setImagePreview(preview)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Image input always triggers search (different from text)
    const imageClassification = { inputType: 'image', contentSummary: 'image', intentHint: 'image_processing' }
    previousClassificationRef.current = imageClassification
    predictTools(inputText, file, preview)
  }, [inputText, predictTools])

  const handleSelectTool = useCallback((tool) => {
    setSelectedTool(tool)
    setOutputResult(null)
    setError(null)
    setDescriptionSidebarOpen(false)

    const initialConfig = {}
    if (tool?.configSchema) {
      tool.configSchema.forEach(field => {
        initialConfig[field.id] = field.default || ''
      })
    }

    const detectedConfig = autoDetectToolConfig(tool.toolId, inputText)
    if (detectedConfig) {
      Object.assign(initialConfig, detectedConfig)
    }

    setConfigOptions(initialConfig)
  }, [inputText])

  const handleConfigChange = useCallback((config) => {
    setConfigOptions(config)
  }, [])

  const autoRunTool = useCallback(
    async (tool, config) => {
      if (!tool) {
        return
      }

      const noInputRequiredTools = []

      let textToUse = inputText
      const hasImageInput = imagePreview

      if (!textToUse && !hasImageInput) {
        const example = getToolExample(tool.toolId, config)
        if (example) {
          textToUse = example
        } else {
          const requiresInput = !noInputRequiredTools.includes(tool.toolId)
          if (requiresInput) {
            return
          }
        }
      }

      if (!textToUse && !hasImageInput) {
        return
      }

      setToolLoading(true)
      setError(null)

      try {
        if (tool.toolId === 'image-resizer' && imagePreview) {
          const resizedData = await resizeImage(imagePreview, config)
          setOutputResult(resizedData)
        } else {
          // For text-toolkit, merge find/replace, diff, or sort lines config if that section is active
          let finalConfig = config
          if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'findReplace') {
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
              trimSpaces: removeExtrasConfig.trimSpaces || true,
              removeBlankLines: removeExtrasConfig.removeBlankLines || true,
              removeDuplicateLines: removeExtrasConfig.removeDuplicateLines || false,
              compressLineBreaks: removeExtrasConfig.compressLineBreaks || false,
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

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to run tool')
          }

          setOutputResult(data.result)
        }
      } catch (err) {
        setError(err.message)
        console.error('Tool execution error:', err)
      } finally {
        setToolLoading(false)
      }
    },
    [inputText, imagePreview, activeToolkitSection, findReplaceConfig, diffConfig, sortLinesConfig]
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
            <p>Describe what you need, and we'll suggest the right tools to get the job done</p>
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
                <div className={styles.configSection}>
                  <div className={styles.configHeader}>
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
                    />
                    <button
                      className={styles.descriptionToggle}
                      onClick={() => setDescriptionSidebarOpen(!descriptionSidebarOpen)}
                      aria-label="Toggle tool description"
                      title="View tool description"
                    >
                      <span className={styles.descriptionIcon}>ℹ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.rightPanel}>
              <div className={styles.outputSection}>
                <ToolOutputPanel
                  result={outputResult}
                  outputType={selectedTool?.outputType}
                  loading={toolLoading}
                  error={error}
                  toolId={selectedTool?.toolId}
                  activeToolkitSection={activeToolkitSection}
                />
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
