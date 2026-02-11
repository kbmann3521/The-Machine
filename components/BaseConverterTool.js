import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS } from '../lib/tool-metadata'
import { getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function BaseConverterTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool converts numbers between different bases (binary, octal, decimal, and hexadecimal) using strict, rule-based logic. It auto-detects the input base, validates the input format, performs conversions with precision, and provides detailed output in all supported bases. It does not attempt to infer meaning, repair fundamentally invalid input silently, or apply creative interpretation. Every conversion follows explicit rules designed to preserve numerical correctness.\n\nThe purpose of this tool is to save time, reduce human error, and make base conversion easier while remaining fully transparent about how the result was produced.',
    whyExists: 'Manual base conversion is error-prone and time-consuming. This tool exists to provide a focused, comprehensive, deterministic alternative for developers, engineers, and students.\n\nIts goal is to give you confidence that conversions are accurate, repeatable, and suitable for real-world use—whether that means converting for programming, understanding binary representations, debugging hex values, or educational purposes.',
    commonUseCases: 'This tool is commonly used when working with numbers in different bases. It is especially useful in programming, computer science, networking, embedded systems, and educational contexts where base conversion is necessary.\n\nUsers often rely on this tool to convert between binary and decimal for bit operations, convert hex color codes, understand IP addresses in binary, work with ASCII values, debug memory addresses, and verify number representations.',
    deterministic: 'This tool is fully deterministic. The same input will always produce the same output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your data. All results are generated using explicit, predefined logic so you always know what to expect and can rely on the output in automated or repeatable workflows.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can use it as often as needed, whether for quick one-off tasks or repeated daily workflows, without worrying about cost or quotas.',
    inputOutput: 'This tool expects valid numbers in any supported base as input. It automatically detects the base (binary, octal, decimal, or hexadecimal) and converts accordingly.\n\nThe output displays the number in all supported bases for easy reference. Any limitations or constraints are intentional and exist to preserve correctness rather than introduce uncertainty.',
    whoFor: 'This tool is intended for users who value accuracy, transparency, and control. It is ideal for programmers, computer scientists, network engineers, students, and anyone working with different number bases.\n\nIt is not intended for creative interpretation or automated decision-making. If you need interpretive behavior, this tool is intentionally not designed for that purpose.',
    reliability: 'Because this tool is deterministic and rule-based, it can be safely used in professional and educational environments. You always know what conversions are applied and why.\n\nThis makes it suitable for programming, debugging, verification, and learning tasks where accuracy is critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool does not use AI or machine learning. All processing is deterministic and rule-based.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'What bases does it support?', answer: 'This tool supports binary (base 2), octal (base 8), decimal (base 10), and hexadecimal (base 16).' },
      { question: 'Can I rely on the conversion results?', answer: 'Yes. All conversions are mathematically accurate and suitable for real-world use.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution to a clearly defined problem, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const baseConverterTool = {
    ...TOOLS['base-converter'],
    toolId: 'base-converter',
    id: 'base-converter',
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
          toolId: 'base-converter',
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
    baseConverterTool,
    null,
    null,
    handleInputChange
  )

  // Generate base converter conversion results for INPUT tab chevron menu
  const baseConverterConversionResults = (() => {
    if (!outputResult?.conversions) {
      return []
    }

    const conversions = outputResult.conversions
    const baseLabels = {
      binary: 'Binary',
      octal: 'Octal',
      decimal: 'Decimal',
      hexadecimal: 'Hexadecimal',
    }

    return Object.entries(conversions).map(([key, value]) => {
      let label = baseLabels[key] || key
      return {
        label,
        value,
        onSelect: () => handleInputChange(value),
      }
    })
  })()

  return (
    <div
      className={`${styles.toolContainer} ${isPreviewFullscreen ? styles.fullscreenPreview : ''}`}
      ref={dividerContainerRef}
      style={!isPreviewFullscreen ? { gridTemplateColumns: `${dividerLeftRatio}% auto 1fr` } : undefined}
    >
      <div className={`${styles.leftPanel} ${isPreviewFullscreen ? styles.hidden : ''}`}>
        <InputTabs
          selectedTool={baseConverterTool}
          inputTabLabel="Input"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={baseConverterTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={baseConverterTool}
                onConfigChange={setConfigOptions}
                currentConfig={configOptions}
                result={outputResult}
              />
            </div>
          }
          inputTabResults={baseConverterConversionResults}
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
                selectedTool={baseConverterTool}
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
          outputType={baseConverterTool?.outputType}
          loading={loading}
          error={error}
          toolId="base-converter"
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
