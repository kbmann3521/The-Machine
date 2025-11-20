import React, { useState, useCallback, useEffect, useRef } from 'react'
import UniversalInput from '../components/UniversalInput'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import ToolOutputPanel from '../components/ToolOutputPanel'
import ThemeToggle from '../components/ThemeToggle'
import { TOOLS } from '../lib/tools'
import { resizeImage } from '../lib/imageUtils'
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
  const debounceTimerRef = useRef(null)

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

      setSelectedTool(prevSelected => {
        let finalTools = toolsWithMetadata

        if (prevSelected) {
          const isSelectedInPredicted = toolsWithMetadata.some(t => t.toolId === prevSelected.toolId)
          if (!isSelectedInPredicted) {
            finalTools = [prevSelected, ...toolsWithMetadata]
          }
        }

        setPredictedTools(finalTools)

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

    const initialConfig = {}
    if (tool?.configSchema) {
      tool.configSchema.forEach(field => {
        initialConfig[field.id] = field.default || ''
      })
    }
    setConfigOptions(initialConfig)
  }, [])

  const handleConfigChange = useCallback((config) => {
    setConfigOptions(config)
  }, [])

  const autoRunTool = useCallback(
    async (tool, config) => {
      if (!tool) {
        return
      }

      if (!inputText && !imagePreview) {
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

          if (!response.ok) {
            throw new Error('Failed to run tool')
          }

          const data = await response.json()
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

  useEffect(() => {
    if (selectedTool && inputText) {
      autoRunTool(selectedTool, configOptions)
    }
  }, [selectedTool, inputText, configOptions, autoRunTool])


  return (
    <div className={styles.layout}>
      <ToolSidebar
        predictedTools={predictedTools}
        selectedTool={selectedTool}
        onSelectTool={handleSelectTool}
        loading={loading}
      />

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h1>All-in-One Internet Tools</h1>
            <p>Start typing or upload an image to get AI-powered tool suggestions</p>
          </div>
          <ThemeToggle />
        </div>

        <div className={styles.content}>
          <div className={styles.toolContainer}>
            <div className={styles.leftPanel}>
              <div className={styles.inputSection}>
                <UniversalInput
                  onInputChange={handleInputChange}
                  onImageChange={handleImageChange}
                />
              </div>

              {selectedTool && (
                <div className={styles.configSection}>
                  <ToolConfigPanel
                    tool={selectedTool}
                    onConfigChange={handleConfigChange}
                    loading={toolLoading}
                  />
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
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
