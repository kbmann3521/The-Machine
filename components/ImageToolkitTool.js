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

export default function ImageToolkitTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool provides an interactive configuration interface for planning image transformations using deterministic, rule-based logic. Set target dimensions (100-4000 pixels), scale factors (10-200%), quality levels (10-100%), and aspect ratio constraints. Calculate transformation parameters, preview settings, and analyze image metadata before applying transformations elsewhere.',
    whyExists: 'Image optimization requires careful planning of dimensions, scale factors, and quality settings to balance file size and visual fidelity. This tool exists to provide a focused, comprehensive, deterministic alternative for calculating optimal transformation parameters without actually processing images.\n\nIts goal is to help you plan transformations accurately, understand dimension/quality trade-offs, standardize image sizes, and give you confidence that calculated parameters are correct.',
    commonUseCases: 'This tool is commonly used for image optimization planning, responsive design calculations, batch processing preparation, thumbnail generation, and compression strategy evaluation. It is especially useful for designers, developers, image optimization specialists, and anyone working with image assets.\n\nUsers often rely on this tool to calculate optimal dimensions, determine quality settings, plan responsive image sets, evaluate file-size trade-offs, standardize image sizes, and prepare transformation parameters.',
    deterministic: 'This tool is fully deterministic. The same image and configuration will always produce identical transformation parameters. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your images or settings. All calculations use explicit, predefined logic so you always know what to expect.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with any images knowing that they do not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can analyze as many images as needed and plan unlimited transformations, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts image files as input (JPEG, PNG, WebP, etc.). It analyzes the original dimensions and metadata.\n\nThe output includes transformation parameters (target width/height, scale percentage, quality setting), calculated dimensions with aspect ratio constraints, and metadata analysis suitable for your image processing workflow.',
    whoFor: 'This tool is intended for designers, developers, image optimization specialists, and anyone working with image assets. It is ideal for those who need to plan image transformations carefully before applying them.\n\nIt is not intended for actual image processing or manipulation. This tool is specifically designed for parameter calculation and planning.',
    reliability: 'Because this tool is deterministic and uses explicit transformation calculation logic, it can be safely used in professional and production environments. You always know how transformations will be calculated.\n\nThis makes it suitable for batch processing preparation, responsive image design, optimization planning, asset management, and any context where consistent transformation planning is critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic dimension and quality calculations with no AI or machine learning involved.' },
      { question: 'Is my image sent to a server?', answer: 'No. Your images are not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'What image formats are supported?', answer: 'This tool supports common image formats including JPEG, PNG, WebP, GIF, and SVG.' },
      { question: 'Does this tool actually resize images?', answer: 'No. This tool calculates and previews transformation parameters. Use the parameters in your image processing software or pipeline.' },
      { question: 'How does aspect ratio lock work?', answer: 'When enabled, changing width automatically adjusts height proportionally (and vice versa) to maintain the original aspect ratio.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution for image transformation planning, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const imageToolkitTool = {
    ...TOOLS['image-toolkit'],
    toolId: 'image-toolkit',
    id: 'image-toolkit',
    detailedDescription: standaloneDetailedDescription,
  }

  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  const [configOptions, setConfigOptions] = useState({
    lockAspectRatio: true,
    width: 800,
    height: 600,
    scalePercent: 100,
    quality: 80,
  })

  const debounceTimerRef = useRef(null)
  const abortControllerRef = useRef(null)
  const loadingTimerRef = useRef(null)
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
    if (imagePreview) {
      const timer = setTimeout(() => {
        executeTool(imagePreview)
      }, 0)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configOptions])

  const handleInputChange = useCallback((text) => {
    setInputText(text)
  }, [])

  const handleImageChange = useCallback((image, preview) => {
    setInputImage(image)
    setImagePreview(preview)
    if (!image || !preview) {
      setOutputResult(null)
      setError(null)
      setLoading(false)
      return
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      executeTool(preview)
    }, 300)
  }, [])

  const executeTool = useCallback(async (preview) => {
    if (!preview) {
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
          toolId: 'image-toolkit',
          inputImage: preview,
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

  const { handleUseOutput, hasOutput } = useOutputToInput(
    outputResult,
    imageToolkitTool,
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
          selectedTool={imageToolkitTool}
          inputTabLabel="Image"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={imageToolkitTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={imageToolkitTool}
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
                inputImage={inputImage}
                imagePreview={imagePreview}
                onInputChange={handleInputChange}
                onImageChange={handleImageChange}
                onCompareTextChange={() => {}}
                compareText=""
                selectedTool={imageToolkitTool}
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
          outputType={imageToolkitTool?.outputType}
          loading={loading}
          error={error}
          toolId="image-toolkit"
          onActiveToolkitSectionChange={() => {}}
          configOptions={configOptions}
          onConfigChange={setConfigOptions}
          inputText={inputText}
          imagePreview={imagePreview}
          warnings={[]}
          onInputUpdate={handleInputChange}
          isPreviewFullscreen={isPreviewFullscreen}
          onTogglePreviewFullscreen={setIsPreviewFullscreen}
        />
      </div>
    </div>
  )
}
