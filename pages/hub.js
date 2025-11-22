import React, { useState, useCallback } from 'react'
import UniversalInput from '../components/UniversalInput'
import ToolSidebar from '../components/ToolSidebar'
import ToolConfigPanel from '../components/ToolConfigPanel'
import ToolOutputPanel from '../components/ToolOutputPanel'
import { TOOLS } from '../lib/tools'
import styles from '../styles/hub.module.css'

export default function Hub() {
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
  const [activeToolkitSection, setActiveToolkitSection] = useState('wordCounter')
  const [findReplaceConfig, setFindReplaceConfig] = useState({
    findText: '',
    replaceText: '',
    useRegex: false,
    matchCase: false,
  })

  const handleInputChange = useCallback((text) => {
    setInputText(text)
  }, [])

  const handleImageChange = useCallback((file, preview) => {
    setInputImage(file)
    setImagePreview(preview)
  }, [])

  const handlePredict = useCallback(async (text, image, preview) => {
    setLoading(true)
    setError(null)
    setSelectedTool(null)
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

      setPredictedTools(toolsWithMetadata)
      if (toolsWithMetadata.length > 0) {
        setSelectedTool(toolsWithMetadata[0])
      }
    } catch (err) {
      setError(err.message)
      console.error('Prediction error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelectTool = useCallback((tool) => {
    setSelectedTool(tool)
    setOutputResult(null)
    setError(null)
  }, [])

  const handleConfigChange = useCallback((config) => {
    setConfigOptions(config)
  }, [])

  const handleRunTool = useCallback(async (tool, config) => {
    if (!inputText) {
      setError('Please enter text to process')
      return
    }

    setToolLoading(true)
    setError(null)
    setOutputResult(null)

    try {
      // For text-toolkit, merge find/replace config if that section is active
      let finalConfig = config
      if (tool.toolId === 'text-toolkit' && activeToolkitSection === 'findReplace') {
        finalConfig = {
          ...config,
          findText: findReplaceConfig.findText || '',
          replaceText: findReplaceConfig.replaceText || '',
          useRegex: findReplaceConfig.useRegex || false,
          matchCase: findReplaceConfig.matchCase || false,
        }
      }

      const response = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.toolId,
          inputText,
          config: finalConfig,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to run tool')
      }

      const data = await response.json()
      setOutputResult(data.result)
    } catch (err) {
      setError(err.message)
      console.error('Tool execution error:', err)
    } finally {
      setToolLoading(false)
    }
  }, [inputText, activeToolkitSection, findReplaceConfig])

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
          <h1>All-in-One Internet Tools</h1>
          <p>Enter text or upload an image, and get AI-powered tool suggestions</p>
        </div>

        <div className={styles.content}>
          <UniversalInput
            onInputChange={handleInputChange}
            onImageChange={handleImageChange}
            onPredict={handlePredict}
            selectedTool={selectedTool}
          />

          {selectedTool && (
            <div className={styles.configSection}>
              <ToolConfigPanel
                tool={selectedTool}
                onRun={handleRunTool}
                onConfigChange={handleConfigChange}
                loading={toolLoading}
                activeToolkitSection={activeToolkitSection}
                onToolkitSectionChange={setActiveToolkitSection}
                findReplaceConfig={findReplaceConfig}
                onFindReplaceConfigChange={setFindReplaceConfig}
              />
            </div>
          )}

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
      </main>
    </div>
  )
}
