import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function HttpStatusLookupTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool provides deterministic HTTP status code lookup with auto-detection, rich metadata, and code examples for multiple frameworks. Enter an HTTP status code, log line, or description to get instant guidance on status codes, meanings, common causes, retryability, and framework-specific implementation examples. It supports multiple lookup modes and works with single or bulk status codes from logs.',
    whyExists: 'HTTP status codes can be confusing and ambiguous. This tool exists to provide a focused, comprehensive, deterministic alternative for developers and API users who need to quickly understand status codes and implement them correctly.\n\nIts goal is to eliminate the need to search documentation, provide instant access to code examples for your framework, and give you confidence that the information is accurate and up-to-date.',
    commonUseCases: 'This tool is commonly used when debugging HTTP errors from logs, understanding API responses, developing APIs, and choosing correct status codes for your application. It is especially useful in web development, API design, backend engineering, DevOps, and integration testing.\n\nUsers often rely on this tool to understand error codes from logs, learn the semantics of status codes, check retryability and cacheability, generate code examples for their framework, analyze multiple errors in bulk, and understand common causes and best practices.',
    deterministic: 'This tool is fully deterministic. The same input will always produce the same output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your input. All results are generated using explicit, predefined data and logic so you always know what to expect and can rely on the output in automated or repeatable workflows.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can use it as often as needed, whether for quick one-off tasks or repeated daily workflows, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts HTTP status codes, log lines containing codes, or free-form descriptions. Auto mode detects what you entered and processes accordingly.\n\nThe output is structured JSON containing status code information, meanings, metadata (retryability, cacheability, common causes), developer notes, and code examples for the selected framework.',
    whoFor: 'This tool is intended for API developers, backend engineers, DevOps professionals, QA engineers, and anyone working with HTTP-based systems. It is ideal for those who value accuracy, transparency, and quick access to correct information.\n\nIt is not intended for creative rewriting, content generation, or automated decision-making. If you need interpretive or generative behavior, this tool is intentionally not designed for that purpose.',
    reliability: 'Because this tool is deterministic and based on standard HTTP specifications and framework documentation, it can be safely used in professional and production environments. You always know where the information comes from and why.\n\nThis makes it suitable for code review checklists, documentation generation, API design reviews, and educational purposes where accurate, reliable information is essential.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic lookup tables and static data. There is no AI or machine learning involved.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'Can this tool analyze log files?', answer: 'Yes. Switch to "Analyze log" mode to extract and analyze multiple HTTP status codes from a single log or paste.' },
      { question: 'How many frameworks are supported?', answer: 'This tool provides code examples for 9 frameworks: Node/Express, Next.js, FastAPI, Flask, Go, PHP, Ruby, Nginx, and Cloudflare Workers.' },
      { question: 'Can I use this for API documentation?', answer: 'Yes. The deterministic output makes this tool suitable for generating consistent API documentation and error reference guides.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution to a clearly defined problem, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const httpStatusLookupTool = {
    ...TOOLS['http-status-lookup'],
    toolId: 'http-status-lookup',
    id: 'http-status-lookup',
    detailedDescription: standaloneDetailedDescription,
  }

  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  const [configOptions, setConfigOptions] = useState({
    mode: 'auto',
    framework: 'node',
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
          toolId: 'http-status-lookup',
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
    httpStatusLookupTool,
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
          selectedTool={httpStatusLookupTool}
          inputTabLabel="Status Code"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={httpStatusLookupTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={httpStatusLookupTool}
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
                selectedTool={httpStatusLookupTool}
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
          outputType={httpStatusLookupTool?.outputType}
          loading={loading}
          error={error}
          toolId="http-status-lookup"
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
