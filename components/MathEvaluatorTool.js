import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function MathEvaluatorTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool safely evaluates complex mathematical expressions with 30+ built-in functions using deterministic, rule-based logic. Support trigonometric, logarithmic, exponential, statistical, and custom functions with proper order of operations. Choose between standard floating-point and high-precision BigNumber modes, set decimal precision, customize rounding, and get detailed diagnostics including expression complexity, variable detection, and calculation assumptions.',
    whyExists: 'Manual mathematical calculations are error-prone, and many calculators lack precision or function support. This tool exists to provide a focused, comprehensive, deterministic alternative for safe expression evaluation with professional-grade accuracy.\n\nIts goal is to evaluate complex math correctly, support high precision for financial/scientific work, provide transparency through diagnostics, and give you confidence that calculations are accurate and auditable.',
    commonUseCases: 'This tool is commonly used for scientific calculations, engineering work, financial analysis, spreadsheet formula testing, educational demonstrations, and algorithm development. It is especially useful for mathematicians, engineers, scientists, financial professionals, and developers working on calculations.\n\nUsers often rely on this tool to validate formulas, perform quick complex calculations, test spreadsheet expressions, verify algorithm implementations, demonstrate mathematical concepts, and ensure calculation accuracy.',
    deterministic: 'This tool is fully deterministic. The same mathematical expression will always produce the same result. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your expressions. All calculations follow explicit mathematical rules so you always know what to expect and can rely on results in professional and scientific contexts.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with proprietary formulas and sensitive calculations knowing that they do not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can evaluate as many expressions as needed, from quick one-off calculations to complex scientific work, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts mathematical expressions in standard notation (e.g., "sin(pi/2) + ln(10)" or "factorial(5) * sqrt(16)"). It automatically parses and evaluates expressions.\n\nThe output includes the calculated result, raw calculation details, variable usage, function list, complexity analysis, and diagnostic information about assumptions and limitations.',
    whoFor: 'This tool is intended for mathematicians, engineers, scientists, financial professionals, developers, and students. It is ideal for those who need accurate calculations with high precision and transparency.\n\nIt is not intended for graphical equation solving or symbolic mathematics. This tool is specifically designed for safe, deterministic numeric expression evaluation.',
    reliability: 'Because this tool is deterministic and provides detailed diagnostics, it can be safely used in professional, scientific, and financial contexts. You always know how expressions are interpreted and can verify results.\n\nThis makes it suitable for scientific papers, financial calculations, engineering designs, quality assurance testing, and any context where calculation accuracy and auditability are critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic mathematical evaluation with no AI or machine learning involved.' },
      { question: 'Is my expression sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'What functions are supported?', answer: 'This tool supports 30+ functions: trigonometric (sin, cos, tan, etc.), logarithmic (log, ln, log2), statistical (mean, median), number theory (factorial, gcd, lcm), and more.' },
      { question: 'What is BigNumber mode?', answer: 'BigNumber mode provides arbitrary-precision decimal arithmetic for financial and scientific calculations where floating-point precision is insufficient.' },
      { question: 'Can I define custom variables?', answer: 'Yes. The tool automatically detects and reports variables used in expressions.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution for safe, accurate mathematical expression evaluation, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const mathEvaluatorTool = {
    ...TOOLS['math-evaluator'],
    toolId: 'math-evaluator',
    id: 'math-evaluator',
    detailedDescription: standaloneDetailedDescription,
  }

  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  const [configOptions, setConfigOptions] = useState({})

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
          toolId: 'math-evaluator',
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
    mathEvaluatorTool,
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
          selectedTool={mathEvaluatorTool}
          inputTabLabel="Expression"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={mathEvaluatorTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={mathEvaluatorTool}
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
                selectedTool={mathEvaluatorTool}
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
          outputType={mathEvaluatorTool?.outputType}
          loading={loading}
          error={error}
          toolId="math-evaluator"
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
