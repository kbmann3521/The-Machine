import { useCallback, useState, useRef, useEffect, useMemo } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import EncoderDecoderConfig from './EncoderDecoderConfig'
import { TOOLS } from '../lib/tool-metadata'
import { getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function EncoderDecoderTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool converts text and data through a chain of customizable transformers. You can stack multiple encoders (Base64, URL encoding, Hex, etc.) together to create complex transformation pipelines. It supports both encoding and decoding in either direction.',
    whyExists: 'Manual data transformation is tedious and error-prone. This tool exists to provide a flexible, composable alternative for developers who need to transform data through multiple encoding layers.',
    commonUseCases: 'Commonly used for encoding data for transmission, creating secure tokens, converting between formats, and debugging encoded payloads.',
    deterministic: 'This tool is fully deterministic. The same input with the same transformer configuration will always produce the same output.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser.',
    freeToUse: 'This tool is completely free to use with no usage limits, paywalls, or subscriptions.',
    inputOutput: 'This tool expects text data as input. You can apply multiple layers of transformers to achieve complex results.',
    whoFor: 'This tool is intended for developers, data engineers, and security professionals who need flexible data transformation capabilities.',
    reliability: 'Because this tool is deterministic and rule-based, it can be safely used in professional and educational environments.',
    faq: [
      { question: 'Can I chain multiple transformers?', answer: 'Yes. You can add multiple transformers and they will be applied in sequence.' },
      { question: 'What transformers are available?', answer: 'Currently supports Base64, Base32 (Standard, Base32Hex, Crockford, z-base-32), URL encoding, Hexadecimal, Binary, Octal, Decimal, Roman Numerals, ASCII/Unicode, Caesar Cipher, Morse Code, and Enigma Machine.' },
      { question: 'Can I use both encode and decode?', answer: 'Yes. You can toggle between encoding and decoding at any time.' },
    ],
    examples: [
      'Base64: "Hello World" → "SGVsbG8gV29ybGQ="',
      'URL Encode: "Hello World!" → "Hello%20World!"',
      'Base32 (Standard): "Hell" → "JBSXG6A="',
      'Base32 (No Padding): "Hell" → "JBSXG6A"',
      'Base32 (Crockford): "C00L-1S-B32" (Decodes with normalization)',
      'Base32 (z-base-32): "Hello" → "pb1sa5dx"',
      'Hexadecimal: "Hello" → "48656C6C6F"',
      'Binary: "abc" → "01100001 01100010 01100011"',
      'Octal: "Hi" → "110 151"',
      'Decimal: "Hi" → "72 105"',
      'Roman Numerals: "Hi" → "LXXII CV"',
      'Caesar Cipher (Shift 3): "abc" → "def"',
      'Morse Code: "SOS" → "... --- ..."',
      'Enigma Machine: "HELLO" → "FTZMG" (with default M3 UKW-B configuration)',
      'Chained: "Hello" → Base64 → Hex → "534756736247383D"',
    ],
    finalNotes: 'This tool provides a flexible foundation for data transformation with the option to add custom transformers.',
  }

  const encoderDecoderTool = {
    ...TOOLS['encoder-decoder'],
    toolId: 'encoder-decoder',
    id: 'encoder-decoder',
    name: 'Encoder & Decoder',
    detailedDescription: standaloneDetailedDescription,
  }

  // State for input and output
  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50)

  // Configuration for encoder-decoder
  const [configOptions, setConfigOptions] = useState({
    direction: 'encode',
    transformers: [
      { id: 'base64', name: 'Base64' },
    ],
    transformerConfigs: {
      base64: { rfc_variant: 'standard', format: 'standard' },
      morse: { short: '.', long: '-', space: '/', charSeparator: ' ' },
      enigma: {
        model: 'Enigma M3',
        reflector: 'UKW B',
        reflectorPos: 1, reflectorRing: 1,
        rotor1: 'I', rotor1Pos: 1, rotor1Ring: 1,
        rotor2: 'II', rotor2Pos: 1, rotor2Ring: 1,
        rotor3: 'III', rotor3Pos: 1, rotor3Ring: 1,
        rotor4: 'Beta', rotor4Pos: 1, rotor4Ring: 1,
        plugboard: '',
        caseStrategy: 'preserve',
        foreignChars: 'ignore'
      }
    },
    finalOutputFormat: 'text',
    finalOutputConfig: {},
  })

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

    // Debounce execution
    debounceTimerRef.current = setTimeout(() => {
      executeTool(text)
    }, 300)
  }, [])

  // Execute the encoder-decoder tool
  const executeTool = useCallback(async (text) => {
    if (!text.trim()) {
      setOutputResult(null)
      return
    }

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
          toolId: 'encoder-decoder',
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
    // Not used in encoder-decoder
  }

  // Use output as input hook
  const { handleUseOutput, hasOutput } = useOutputToInput(
    outputResult,
    encoderDecoderTool,
    null,
    null,
    handleInputChange
  )

  // Build inputTabResults from output
  const inputTabResults = useMemo(() => {
    if (!outputResult?.output) {
      return []
    }

    return [
      {
        label: 'Output',
        value: outputResult.output,
        onSelect: () => handleInputChange(outputResult.output),
      },
    ]
  }, [outputResult?.output, handleInputChange])

  return (
    <div
      className={`${styles.toolContainer} ${isPreviewFullscreen ? styles.fullscreenPreview : ''}`}
      ref={dividerContainerRef}
      style={!isPreviewFullscreen ? { gridTemplateColumns: `${dividerLeftRatio}% auto 1fr` } : undefined}
    >
      {/* Left Panel - Input */}
      <div className={`${styles.leftPanel} ${isPreviewFullscreen ? styles.hidden : ''}`}>
        <InputTabs
          selectedTool={encoderDecoderTool}
          inputTabLabel="Text"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={encoderDecoderTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <EncoderDecoderConfig
                config={configOptions}
                onConfigChange={setConfigOptions}
              />
            </div>
          }
          inputTabResults={inputTabResults}
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
                selectedTool={encoderDecoderTool}
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
          outputType={encoderDecoderTool?.outputType}
          loading={loading}
          error={error}
          toolId="encoder-decoder"
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
