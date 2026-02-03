import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function ChecksumCalculatorTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool calculates checksums and hashes using 11+ algorithms with deterministic, rule-based logic. Support CRC (8/16/32 variants), Adler-32, Fletcher checksums, and cryptographic hashes (MD5, SHA-1/256/512). Process multiple input formats (text, hex, base64, binary) with auto-detection and flexible output formatting (hex, decimal, binary, big/little-endian bytes).',
    whyExists: 'Checksum calculation is essential for data integrity verification, but remembering algorithm parameters and output formats is difficult. This tool exists to provide a focused, comprehensive, deterministic alternative with support for multiple algorithms and flexible formatting.\n\nIts goal is to eliminate manual calculations, support both legacy checksums and modern hashing, provide detailed algorithm metadata, and give you confidence that integrity verification is accurate.',
    commonUseCases: 'This tool is commonly used for file integrity verification, network packet checksums, data corruption detection, cryptographic hashing, debugging binary data, and testing transmission protocols. It is especially useful for developers, system administrators, network engineers, security professionals, and data forensics specialists.\n\nUsers often rely on this tool to verify file integrity, detect transmission errors, generate hashes for security, debug binary data, test protocols, analyze network packets, and ensure data authenticity.',
    deterministic: 'This tool is fully deterministic. The same input and algorithm will always produce identical checksums. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your data. All calculations use explicit, standard algorithm implementations so you always know what to expect.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can calculate as many checksums as needed, from single calculations to batch processing, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts data in multiple formats: plain text, hexadecimal bytes, Base64, or binary. It auto-detects the format or allows explicit specification.\n\nThe output includes the calculated checksum/hash in multiple formats (hexadecimal, decimal, binary, big-endian bytes, little-endian bytes) along with detailed algorithm metadata and input information.',
    whoFor: 'This tool is intended for developers, system administrators, network engineers, security professionals, and anyone working with data integrity verification. It is ideal for those who need professional-grade checksum calculation with flexibility.\n\nIt is not intended for password hashing or cryptographic key generation. This tool is specifically designed for data integrity verification and hash calculation.',
    reliability: 'Because this tool is deterministic and uses standard algorithm implementations, it can be safely used in professional and production environments. You always know how checksums are calculated and can verify results independently.\n\nThis makes it suitable for data integrity checks, file verification systems, forensics analysis, network testing, and any context where accurate checksum calculation is critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic checksum algorithms with no AI or machine learning involved.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'What algorithms are supported?', answer: 'This tool supports 11+ algorithms: CRC variants, Adler-32, Fletcher checksums, and cryptographic hashes (MD5, SHA-1/256/512).' },
      { question: 'Which is better: CRC or SHA?', answer: 'CRC is fast and good for detecting accidental errors. SHA is cryptographic and detects intentional tampering. Choose based on your use case.' },
      { question: 'Can I compare two checksums?', answer: 'Yes. Enable Compare Mode to verify if two checksums match.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution for professional checksum calculation, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const checksumCalculatorTool = {
    ...TOOLS['checksum-calculator'],
    toolId: 'checksum-calculator',
    id: 'checksum-calculator',
    detailedDescription: standaloneDetailedDescription,
  }

  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  const [configOptions, setConfigOptions] = useState({
    algorithm: 'crc32',
    autoDetect: true,
    inputMode: 'text',
    outputFormat: 'hex',
    compareMode: false,
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
          toolId: 'checksum-calculator',
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
    checksumCalculatorTool,
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
          selectedTool={checksumCalculatorTool}
          inputTabLabel="Data"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={checksumCalculatorTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={checksumCalculatorTool}
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
                selectedTool={checksumCalculatorTool}
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
          outputType={checksumCalculatorTool?.outputType}
          loading={loading}
          error={error}
          toolId="checksum-calculator"
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
