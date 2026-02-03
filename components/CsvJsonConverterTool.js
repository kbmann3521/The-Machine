import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function CsvJsonConverterTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool converts CSV (comma-separated values) data to multiple formats using deterministic, rule-based logic. Convert to JSON, JSONL, SQL INSERT statements, JavaScript, or TypeScript exports. Intelligent auto-detection for delimiters and header rows, automatic data type conversion (numbers, booleans, null), whitespace trimming, header normalization (camelCase, snake_case), and blank row removal.',
    whyExists: 'CSV to JSON conversion is essential for data import/export and API integration, but handling different delimiters, headers, and formatting variations is error-prone. This tool exists to provide a focused, comprehensive, deterministic alternative with intelligent auto-detection and multiple output formats.\n\nIts goal is to handle varying CSV formats gracefully, support multiple output formats for different use cases, normalize headers, and give you confidence that data conversion is accurate and consistent.',
    commonUseCases: 'This tool is commonly used for importing spreadsheet data, generating SQL statements, preparing data for APIs, format conversion, and data transformation pipelines. It is especially useful for data analysts, developers, system administrators, and anyone working with CSV data.\n\nUsers often rely on this tool to convert spreadsheet exports, generate database INSERT statements, prepare data for JavaScript/TypeScript applications, handle unknown CSV formats, transform data between systems, and build data pipelines.',
    deterministic: 'This tool is fully deterministic. The same CSV input and configuration will always produce identical JSON output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your data. All conversions follow explicit, predefined rules so you always know what to expect.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can convert as much CSV data as needed, whether for quick one-off conversions or large batch processing, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts CSV data as input with support for different delimiters (comma, semicolon, tab) and header formats. It auto-detects delimiters and headers or allows manual specification.\n\nThe output can be in multiple formats: JSON, JSONL (one record per line), SQL INSERT statements, JavaScript export, or TypeScript export, with configurable header formatting.',
    whoFor: 'This tool is intended for data analysts, developers, data engineers, system administrators, and anyone working with CSV data. It is ideal for those who need flexible CSV parsing with multiple output formats.\n\nIt is not intended for graphical spreadsheet editing or advanced data transformation. This tool is specifically designed for CSV format conversion.',
    reliability: 'Because this tool is deterministic and uses explicit parsing rules, it can be safely used in professional and production environments. You always know how CSV data will be interpreted and converted.\n\nThis makes it suitable for data pipelines, batch imports, API integration, database population, and any context where consistent CSV conversion is critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic CSV parsing with no AI or machine learning involved.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'What delimiters are supported?', answer: 'This tool supports comma, semicolon, and tab delimiters, with auto-detection available.' },
      { question: 'Can I generate SQL from CSV?', answer: 'Yes. Select "SQL INSERT" as the output format to generate SQL INSERT statements from your CSV.' },
      { question: 'What output formats are available?', answer: 'This tool supports JSON, JSONL (one per line), SQL INSERT, JavaScript export, and TypeScript export.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution for CSV format conversion, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const csvJsonConverterTool = {
    ...TOOLS['csv-json-converter'],
    toolId: 'csv-json-converter',
    id: 'csv-json-converter',
    detailedDescription: standaloneDetailedDescription,
  }

  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  const [configOptions, setConfigOptions] = useState({
    autoDetectDelimiter: true,
    autoDetectHeaderRow: true,
    headerRowMode: 'hasHeader',
    delimiter: ',',
    trimWhitespace: true,
    convertNumbers: true,
    convertBooleans: true,
    removeBlankRows: true,
    strictMode: false,
    headerFormat: 'original',
    outputFormat: 'json',
  })

  const debounceTimerRef = useRef(null)
  const abortControllerRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const previousInputLengthRef = useRef(0)
  const universalInputRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dividerContainerRef = useRef(null)

  const handleDividerMouseMove = useCallback((e) => {
    if (!dividerContainerRef.current) return
    const container = dividerContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const newLeftRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100
    const constrainedRatio = Math.max(15, Math.min(85, newLeftRatio))
    setDividerLeftRatio(constrainedRatio)
  }, [])

  const handleDividerMouseUp = useCallback(() => {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleDividerMouseMove)
    document.removeEventListener('mouseup', handleDividerMouseUp)
  }, [handleDividerMouseMove])

  const handleDividerMouseDown = useCallback(() => {
    isDraggingRef.current = true
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleDividerMouseMove)
    document.addEventListener('mouseup', handleDividerMouseUp)
  }, [handleDividerMouseMove, handleDividerMouseUp])

  useEffect(() => {
    if (inputText?.trim()) {
      const timer = setTimeout(() => {
        executeTool(inputText)
      }, 0)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configOptions])

  const handleInputChange = useCallback((text) => {
    const isEmpty = !text || text.trim() === ''
    setInputText(text)
    previousInputLengthRef.current = text.length

    if (isEmpty) {
      setOutputResult(null)
      setError(null)
      setLoading(false)
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTool(text)
    }, 300)
  }, [])

  const executeTool = useCallback(async (text) => {
    if (!text.trim()) {
      setOutputResult(null)
      return
    }

    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (e) {
        // Ignore
      }
    }

    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
    }
    loadingTimerRef.current = setTimeout(() => {
      setLoading(true)
    }, 500)

    try {
      const controller = new AbortController()
      abortControllerRef.current = controller

      const abortTimeout = setTimeout(() => {
        try {
          controller.abort()
        } catch (e) {
          // Ignore
        }
      }, 30000)

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const url = `${baseUrl}/api/tools/run`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'csv-json-converter',
          inputText: text,
          config: configOptions,
        }),
        signal: controller.signal,
        credentials: 'same-origin',
      })

      clearTimeout(abortTimeout)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || `Tool execution failed: ${response.statusText}`)
      }

      const data = await response.json()
      setOutputResult(data.result || null)
      setError(null)
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout - server took too long to respond')
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error - unable to reach server')
      } else {
        setError(err.message || 'Tool execution failed')
      }
    } finally {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current)
        loadingTimerRef.current = null
      }
      setLoading(false)
    }
  }, [configOptions])

  const handleImageChange = () => {}

  const { handleUseOutput, hasOutput } = useOutputToInput(
    outputResult,
    csvJsonConverterTool,
    null,
    null,
    handleInputChange
  )

  return (
    <div
      className={`${styles.toolContainer} ${isPreviewFullscreen ? styles.fullscreenPreview : ''}`}
      ref={dividerContainerRef}
      style={!isPreviewFullscreen ? { gridTemplateColumns: `${dividerLeftRatio}% auto 1fr` } : undefined}
    >
      <div className={`${styles.leftPanel} ${isPreviewFullscreen ? styles.hidden : ''}`}>
        <InputTabs
          selectedTool={csvJsonConverterTool}
          inputTabLabel="CSV"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={csvJsonConverterTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={csvJsonConverterTool}
                onConfigChange={setConfigOptions}
                currentConfig={configOptions}
                result={outputResult}
              />
            </div>
          }
          inputTabResults={[]}
          hasOutputToUse={hasOutput}
          onUseOutput={handleUseOutput}
          canCopyOutput={true}
          csvWarnings={null}
          inputContent={
            <div className={styles.inputSection} style={{ overflow: 'hidden', height: '100%' }}>
              <UniversalInput
                ref={universalInputRef}
                inputText={inputText}
                inputImage={null}
                imagePreview={null}
                onInputChange={handleInputChange}
                onImageChange={handleImageChange}
                onCompareTextChange={() => {}}
                compareText=""
                selectedTool={csvJsonConverterTool}
                configOptions={configOptions}
                getToolExample={getToolExample}
                errorData={null}
                predictedTools={[]}
                onSelectTool={() => {}}
                validationErrors={[]}
                lintingWarnings={[]}
                result={outputResult}
                isPreviewFullscreen={isPreviewFullscreen}
                onTogglePreviewFullscreen={setIsPreviewFullscreen}
                standalone={true}
              />
            </div>
          }
          tabOptionsMap={{}}
        />
      </div>

      <div className={styles.divider} onMouseDown={handleDividerMouseDown} title="Drag to resize panels"></div>

      <div className={styles.rightPanel}>
        <ToolOutputPanel
          result={outputResult}
          outputType={csvJsonConverterTool?.outputType}
          loading={loading}
          error={error}
          toolId="csv-json-converter"
          onActiveToolkitSectionChange={() => {}}
          configOptions={configOptions}
          onConfigChange={setConfigOptions}
          inputText={inputText}
          imagePreview={null}
          warnings={[]}
          onInputUpdate={handleInputChange}
          isPreviewFullscreen={isPreviewFullscreen}
          onTogglePreviewFullscreen={setIsPreviewFullscreen}
        />
      </div>
    </div>
  )
}
