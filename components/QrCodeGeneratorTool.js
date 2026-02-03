import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import QRCodeGeneratorOutputPanel from './QRCodeGeneratorOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function QrCodeGeneratorTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool generates scannable QR codes from any text, URL, or data with deterministic, rule-based logic. Create QR codes with customizable size (50-500 pixels), four error correction levels (7%, 15%, 25%, 30% recovery), adjustable quiet zone margins, and custom colors for dark and light modules. Outputs both PNG (raster) and SVG (vector) formats suitable for different use cases.',
    whyExists: 'QR code generation is essential for linking physical items to digital content, but many tools are limited or unreliable. This tool exists to provide a focused, comprehensive, deterministic alternative that gives you full control over appearance and reliability.\n\nIts goal is to generate scannable codes reliably, support both formats for maximum flexibility, allow customization for branding, and give you confidence that codes will scan correctly across all devices.',
    commonUseCases: 'This tool is commonly used for marketing materials, product packaging, event tickets, WiFi sharing, contact information, payment codes, and document tracking. It is especially useful for marketers, event organizers, product teams, developers integrating QR functionality, and anyone who needs to create scannable codes.\n\nUsers often rely on this tool to generate codes for URLs, share WiFi credentials, create contact cards, generate payment information codes, produce event tickets, label products, enable document tracking, and create marketing materials.',
    deterministic: 'This tool is fully deterministic. The same input and configuration will always produce identical QR codes. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your data. All codes are generated using standard QR specification logic so you always know what to expect and can rely on the output for production use.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data (like private URLs or credentials) knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can generate as many QR codes as needed, whether for quick one-off tasks or large batch production, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts any text, URL, or data as input. It automatically validates the input and generates a corresponding QR code.\n\nThe output is a scannable QR code available in both PNG (raster image) and SVG (scalable vector) formats, along with metadata about the generated code (size, error correction level, data capacity, module count).',
    whoFor: 'This tool is intended for marketers, event organizers, product teams, developers, and anyone who needs to create scannable QR codes. It is ideal for those who value control, consistency, and high-quality output.\n\nIt is not intended for decoding QR codes or reading existing codes. This tool is specifically designed for generation and customization.',
    reliability: 'Because this tool is deterministic and based on standard QR code specifications (ISO/IEC 18004), it can be safely used in production environments. Codes generated here will scan consistently across all QR code readers.\n\nThis makes it suitable for product labels, marketing materials, official documentation, ticket systems, and any context where code reliability is critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic QR code generation based on standard specifications with no AI or machine learning involved.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. All QR code generation happens entirely in your browser.' },
      { question: 'What is error correction level?', answer: 'Error correction allows QR codes to remain scannable even if partially damaged. Higher levels tolerate more damage but create larger codes.' },
      { question: 'Should I use PNG or SVG?', answer: 'Use SVG for printing and scaling (it\'s vector-based and infinitely scalable). Use PNG for web and digital display.' },
      { question: 'How much data can a QR code hold?', answer: 'Up to 2953 bytes depending on error correction level. Higher correction levels reduce data capacity.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution for creating professional, scannable QR codes, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const qrCodeGeneratorTool = {
    ...TOOLS['qr-code-generator'],
    toolId: 'qr-code-generator',
    id: 'qr-code-generator',
    detailedDescription: standaloneDetailedDescription,
  }

  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  const [configOptions, setConfigOptions] = useState({
    size: 200,
    errorCorrectionLevel: 'M',
    margin: 2,
    color: '#000000',
    bgColor: '#FFFFFF',
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
          toolId: 'qr-code-generator',
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
    qrCodeGeneratorTool,
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
          selectedTool={qrCodeGeneratorTool}
          inputTabLabel="Content"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={qrCodeGeneratorTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={qrCodeGeneratorTool}
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
                selectedTool={qrCodeGeneratorTool}
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
        <QRCodeGeneratorOutputPanel
          result={outputResult}
          outputType={qrCodeGeneratorTool?.outputType}
          loading={loading}
          error={error}
          toolId="qr-code-generator"
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
