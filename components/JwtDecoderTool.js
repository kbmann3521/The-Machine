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

export default function JwtDecoderTool() {
  // Standalone page uses different detailed description format
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool decodes JSON Web Tokens to inspect headers, payloads, and verify signatures using strict, rule-based logic. It performs Base64 decoding, claims extraction, expiration validation, algorithm analysis, and signature verification. It does not attempt to infer meaning, repair fundamentally invalid data, or apply creative interpretation. Every analysis follows explicit rules designed to preserve accuracy and correctness.\n\nThe purpose of this tool is to save time, reduce human error, and make JWT debugging easier while remaining fully transparent about how the analysis was produced.',
    whyExists: 'Many JWT inspection tools are limited, require online services, or compromise security by sending tokens to external servers. This tool exists to provide a focused, deterministic, client-side alternative.\n\nIts goal is to give you confidence that the analysis is accurate, repeatable, and suitable for real-world use—whether that means debugging authentication flows, verifying token claims, checking expiration, validating signatures, or analyzing OAuth 2.0 tokens.',
    commonUseCases: 'This tool is commonly used when working with JSON Web Tokens that need to be analyzed, debugged, or validated. It is especially useful in API development, authentication auditing, security review, and deployment workflows where correctness matters.\n\nUsers often rely on this tool to inspect JWT claims, check token expiration, verify signatures against JWKS endpoints, debug authentication flows, validate tokens received from external services, analyze user data in tokens, and test API authentication.',
    deterministic: 'This tool is fully deterministic. The same input will always produce the same output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your data. All results are generated using explicit, predefined logic so you always know what to expect and can rely on the output in automated or repeatable workflows.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can use it as often as needed, whether for quick one-off tasks or repeated daily workflows, without worrying about cost or quotas.',
    inputOutput: 'This tool expects valid JWT tokens as input. It does not attempt to guess intent, repair fundamentally invalid data, or silently change meaning.\n\nThe output is structured, consistent, and designed to be immediately usable. Any limitations or constraints are intentional and exist to preserve correctness rather than introduce uncertainty.',
    whoFor: 'This tool is intended for users who value accuracy, transparency, and control. It is ideal for developers, backend engineers, security professionals, and anyone working with JWT-based authentication.\n\nIt is not intended for creative rewriting, content generation, or automated decision-making. If you need interpretive or generative behavior, this tool is intentionally not designed for that purpose.',
    reliability: 'Because this tool is deterministic and rule-based, it can be safely used in professional and production-adjacent environments. You always know what validations and analyses are applied and why.\n\nThis makes it suitable for debugging, auditing, validation, and security review tasks where unpredictable output would be unacceptable.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool does not use AI or machine learning. All processing is deterministic and rule-based.' },
      { question: 'Is my token sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Decoding happens entirely in your browser.' },
      { question: 'Will this tool modify my token?', answer: 'No. The tool analyzes and decodes without modifying your input.' },
      { question: 'Can I rely on the verification results?', answer: 'Yes. The verification is deterministic and based on standard JWT specifications, making it suitable for real-world use.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution to a clearly defined problem, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const jwtDecoderTool = {
    ...TOOLS['jwt-decoder'],
    toolId: 'jwt-decoder',
    id: 'jwt-decoder',
    detailedDescription: standaloneDetailedDescription,
  }

  // State for input and output
  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50) // Track left panel width as percentage

  // Configuration for jwt-decoder
  const [configOptions, setConfigOptions] = useState({})

  // Refs
  const debounceTimerRef = useRef(null)
  const abortControllerRef = useRef(null)
  const abortTimeoutRef = useRef(null)
  const loadingTimerRef = useRef(null)
  const previousInputLengthRef = useRef(0)
  const universalInputRef = useRef(null)
  const isDraggingRef = useRef(false)
  const dividerContainerRef = useRef(null)

  // Handle divider drag move
  const handleDividerMouseMove = useCallback((e) => {
    if (!dividerContainerRef.current) return

    const container = dividerContainerRef.current
    const containerRect = container.getBoundingClientRect()
    const newLeftRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Constrain the ratio to reasonable bounds (15% to 85%)
    const constrainedRatio = Math.max(15, Math.min(85, newLeftRatio))
    setDividerLeftRatio(constrainedRatio)
  }, [])

  // Handle divider drag end
  const handleDividerMouseUp = useCallback(() => {
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleDividerMouseMove)
    document.removeEventListener('mouseup', handleDividerMouseUp)
  }, [handleDividerMouseMove])

  // Handle divider drag start
  const handleDividerMouseDown = useCallback(() => {
    isDraggingRef.current = true
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleDividerMouseMove)
    document.addEventListener('mouseup', handleDividerMouseUp)
  }, [handleDividerMouseMove, handleDividerMouseUp])

  // Auto-execute tool when config changes
  useEffect(() => {
    if (inputText?.trim()) {
      // Use a small delay to allow state to settle
      const timer = setTimeout(() => {
        executeTool(inputText)
      }, 0)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configOptions])

  // Handle input change and execution
  const handleInputChange = useCallback((text, image = null, preview = null, isLoadExample = false) => {
    const isEmpty = !text || text.trim() === ''

    setInputText(text)
    previousInputLengthRef.current = text.length

    // Clear output if empty
    if (isEmpty) {
      setOutputResult(null)
      setError(null)
      setLoading(false)
      return
    }

    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Debounce execution
    debounceTimerRef.current = setTimeout(() => {
      executeTool(text)
    }, 300)
  }, [])

  // Execute the jwt-decoder tool
  const executeTool = useCallback(async (text) => {
    if (!text.trim()) {
      setOutputResult(null)
      return
    }

    // Abort previous request
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort()
      } catch (e) {
        // Ignore
      }
    }

    // Set loading after delay
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
          toolId: 'jwt-decoder',
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

  const handleImageChange = () => {
    // Not used in jwt-decoder
  }

  // Use output as input hook
  const { handleUseOutput, hasOutput } = useOutputToInput(
    outputResult,
    jwtDecoderTool,
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
      {/* Left Panel - Input */}
      <div className={`${styles.leftPanel} ${isPreviewFullscreen ? styles.hidden : ''}`}>
        <InputTabs
          selectedTool={jwtDecoderTool}
          inputTabLabel="Token"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={jwtDecoderTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={jwtDecoderTool}
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
                selectedTool={jwtDecoderTool}
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

      {/* Center Divider */}
      <div className={styles.divider} onMouseDown={handleDividerMouseDown} title="Drag to resize panels"></div>

      {/* Right Panel - Output */}
      <div className={styles.rightPanel}>
        <ToolOutputPanel
          result={outputResult}
          outputType={jwtDecoderTool?.outputType}
          loading={loading}
          error={error}
          toolId="jwt-decoder"
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
