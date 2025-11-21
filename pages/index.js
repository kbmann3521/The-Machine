import React, { useState, useCallback, useEffect, useRef } from 'react'
import Head from 'next/head'
import UniversalInput from '../components/UniversalInput'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import ToolOutputPanel from '../components/ToolOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import ToolDescriptionSidebar from '../components/ToolDescriptionSidebar'
import { TOOLS, autoDetectToolConfig } from '../lib/tools'
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
  const debounceTimerRef = useRef(null)
  const selectedToolRef = useRef(null)

  useEffect(() => {
    selectedToolRef.current = selectedTool
  }, [selectedTool])

  useEffect(() => {
    const allTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
      toolId,
      name: toolData.name,
      description: toolData.description,
      similarity: 0.75,
      ...toolData,
    }))
    setPredictedTools(allTools)
  }, [])

  const predictTools = useCallback(async (text, image, preview) => {
    if (!text && !image) {
      const allTools = Object.entries(TOOLS).map(([toolId, toolData]) => ({
        toolId,
        name: toolData.name,
        description: toolData.description,
        similarity: 0.75,
        ...toolData,
      }))
      setPredictedTools(allTools)
      return
    }

    setLoading(true)
    setError(null)
    setOutputResult(null)

    try {
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

      setPredictedTools(prevTools => {
        let finalTools = [...toolsWithMetadata]
        const currentSelected = selectedToolRef.current

        if (currentSelected) {
          // Remove the selected tool from the list if it exists
          finalTools = finalTools.filter(t => t.toolId !== currentSelected.toolId)
          // Always put the selected tool at the top
          finalTools.unshift(currentSelected)
        }

        return finalTools
      })

      setSelectedTool(prevSelected => {
        if (!prevSelected && toolsWithMetadata.length > 0) {
          return toolsWithMetadata[0]
        }
        return prevSelected
      })
    } catch (err) {
      console.error('Prediction error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

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
      predictTools(text, image, preview)
    }, 300)
  }, [predictTools])

  const handleImageChange = useCallback((file, preview) => {
    setInputImage(file)
    setImagePreview(preview)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

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

      const requiresInput = !noInputRequiredTools.includes(tool.toolId)
      if (requiresInput && !inputText && !imagePreview) {
        return
      }

      setToolLoading(true)
      setError(null)

      try {
        if (tool.toolId === 'image-resizer' && imagePreview) {
          const resizedData = await resizeImage(imagePreview, config)
          setOutputResult(resizedData)
        } else {
          const response = await fetch('/api/tools/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              toolId: tool.toolId,
              inputText,
              inputImage: imagePreview,
              config,
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
    [inputText, imagePreview]
  )

  const handleRegenerate = useCallback(() => {
    if (selectedTool) {
      autoRunTool(selectedTool, configOptions)
    }
  }, [selectedTool, configOptions, autoRunTool])

  useEffect(() => {
    if (selectedTool && inputText) {
      autoRunTool(selectedTool, configOptions)
    }
  }, [selectedTool, inputText, configOptions, autoRunTool])


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
            <p>Start typing or upload an image to get AI-powered tool suggestions</p>
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
