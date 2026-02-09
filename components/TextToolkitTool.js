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

export default function TextToolkitTool() {
  // Standalone page uses different detailed description format
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool processes text using strict, rule-based logic to produce clean, predictable output. It combines 12+ specialized utilities for text analysis and transformation: word counting, readability analysis, case conversion, slug generation, find and replace, text diffing, line sorting, delimiter transformation, and advanced text cleaning. It does not attempt to infer meaning, rewrite content, or apply creative interpretation. Every transformation follows explicit rules designed to preserve structure, intent, and correctness.\n\nThe purpose of this tool is to save time, reduce human error, and make text data easier to work with while remaining fully transparent about how the result was produced.',
    whyExists: 'Many online tools rely on opaque processing, AI rewriting, or server-side handling that makes it difficult to understand what actually happened to your data. This tool exists to provide a safer, more predictable alternative.\n\nIts goal is to give you confidence that the output is accurate, repeatable, and suitable for real-world use—whether that means analyzing readability, debugging text issues, preparing data for import, or validation before processing.',
    commonUseCases: 'This tool is commonly used when working with raw, machine-generated, or inconsistent text that needs to be analyzed, cleaned, inspected, or standardized. It is especially useful in development, documentation, content analysis, data preparation, debugging, and review workflows where correctness matters.\n\nUsers often rely on this tool to quickly analyze text readability, generate URL slugs, compare versions, clean PDF-extracted text, remove invisible characters, organize lists, transform case, and ensure consistency before committing to a codebase or publishing.',
    deterministic: 'This tool is fully deterministic. The same input will always produce the same output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to rewrite, infer, or modify your data. All results are generated using explicit, predefined logic so you always know what to expect and can rely on the output in automated or repeatable workflows.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can use it as often as needed, whether for quick one-off tasks or repeated daily workflows, without worrying about cost or quotas.',
    inputOutput: 'This tool expects valid text input for the format it is designed to handle. It does not attempt to guess intent, repair fundamentally invalid data, or silently change meaning.\n\nThe output is structured, consistent, and designed to be immediately usable. Any limitations or constraints are intentional and exist to preserve correctness rather than introduce uncertainty.',
    whoFor: 'This tool is intended for users who value accuracy, transparency, and control. It is ideal for developers, technical professionals, students, and anyone working with text or structured data.\n\nIt is not intended for creative rewriting, content generation, or automated decision-making. If you need interpretive or generative behavior, this tool is intentionally not designed for that purpose.',
    reliability: 'Because this tool is deterministic and rule-based, it can be safely used in professional and production-adjacent environments. You always know what transformations are applied and why.\n\nThis makes it suitable for debugging, auditing, comparison, validation, and analysis tasks where unpredictable output would be unacceptable.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool does not use AI or machine learning. All processing is deterministic and rule-based.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted.' },
      { question: 'Will this tool change the meaning or structure of my data?', answer: 'No. The tool is designed to preserve intent and structure while applying only the transformations it explicitly supports.' },
      { question: 'Can I rely on the output for real projects?', answer: 'Yes. The output is consistent and repeatable, making it suitable for real-world use.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution to a clearly defined problem, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const textToolkitTool = {
    ...TOOLS['text-toolkit'],
    toolId: 'text-toolkit',
    id: 'text-toolkit',
    detailedDescription: standaloneDetailedDescription,
  }

  // State for input and output
  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50) // Track left panel width as percentage

  // State for text-toolkit specific sections
  const [activeToolkitSection, setActiveToolkitSection] = useState('textAnalyzer')

  // Configuration for text-toolkit
  const [configOptions, setConfigOptions] = useState({})

  // Separate config states for each toolkit section (mirrors main page)
  const [findReplaceConfig, setFindReplaceConfig] = useState({
    findText: '',
    replaceText: '',
    useRegex: false,
    matchCase: false,
  })
  const [diffConfig, setDiffConfig] = useState({
    text2: '',
  })
  const [sortLinesConfig, setSortLinesConfig] = useState({
    order: 'asc',
    caseSensitive: false,
    removeDuplicates: false,
  })
  const [removeExtrasConfig, setRemoveExtrasConfig] = useState({
    removePdfGarbage: true,
    removeInvisibleChars: true,
    stripHtml: true,
    stripMarkdown: true,
    normalizeWhitespace: true,
    fixPunctuationSpacing: true,
    compressSpaces: true,
    trimLines: true,
    removeLineBreaks: true,
    removeBlankLines: true,
    removeTimestamps: false,
    removeDuplicateLines: false,
  })
  const [delimiterTransformerConfig, setDelimiterTransformerConfig] = useState({
    delimiter: ' ',
    mode: 'rows',
    joinSeparator: ' ',
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

  // Auto-execute tool when config or section changes
  useEffect(() => {
    if (inputText?.trim()) {
      // Use a small delay to allow state to settle
      const timer = setTimeout(() => {
        executeTool(inputText)
      }, 0)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeToolkitSection, findReplaceConfig, diffConfig, sortLinesConfig, removeExtrasConfig, delimiterTransformerConfig])

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

  // Execute the text-toolkit tool
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

      // Build final config based on active section (mirrors main page logic)
      let finalConfig = {}

      if (activeToolkitSection === 'findReplace') {
        finalConfig = {
          findText: findReplaceConfig.findText || '',
          replaceText: findReplaceConfig.replaceText || '',
          useRegex: findReplaceConfig.useRegex || false,
          matchCase: findReplaceConfig.matchCase || false,
        }
      } else if (activeToolkitSection === 'textDiff') {
        finalConfig = {
          text2: diffConfig.text2 || '',
        }
      } else if (activeToolkitSection === 'sortLines') {
        finalConfig = {
          order: sortLinesConfig.order || 'asc',
          caseSensitive: sortLinesConfig.caseSensitive || false,
          removeDuplicates: sortLinesConfig.removeDuplicates || false,
        }
      } else if (activeToolkitSection === 'removeExtras') {
        finalConfig = {
          removePdfGarbage: removeExtrasConfig.removePdfGarbage !== false,
          removeInvisibleChars: removeExtrasConfig.removeInvisibleChars !== false,
          stripHtml: removeExtrasConfig.stripHtml !== false,
          stripMarkdown: removeExtrasConfig.stripMarkdown !== false,
          normalizeWhitespace: removeExtrasConfig.normalizeWhitespace !== false,
          fixPunctuationSpacing: removeExtrasConfig.fixPunctuationSpacing !== false,
          compressSpaces: removeExtrasConfig.compressSpaces !== false,
          trimLines: removeExtrasConfig.trimLines !== false,
          removeLineBreaks: removeExtrasConfig.removeLineBreaks === true,
          removeBlankLines: removeExtrasConfig.removeBlankLines !== false,
          removeTimestamps: removeExtrasConfig.removeTimestamps === true,
          removeDuplicateLines: removeExtrasConfig.removeDuplicateLines === true,
        }
      } else if (activeToolkitSection === 'delimiterTransformer') {
        finalConfig = {
          delimiter: delimiterTransformerConfig.delimiter ?? ' ',
          mode: delimiterTransformerConfig.mode ?? 'rows',
          joinSeparator: delimiterTransformerConfig.joinSeparator ?? ',',
        }
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
      const url = `${baseUrl}/api/tools/run`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: 'text-toolkit',
          inputText: text,
          config: finalConfig,
          activeToolkitSection,
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
  }, [activeToolkitSection, findReplaceConfig, diffConfig, sortLinesConfig, removeExtrasConfig, delimiterTransformerConfig])

  const handleImageChange = () => {
    // Not used in text-toolkit
  }

  // Use output as input hook
  const { handleUseOutput, hasOutput } = useOutputToInput(
    outputResult,
    textToolkitTool,
    activeToolkitSection,
    null,
    handleInputChange
  )

  // Generate case conversion results for INPUT tab chevron menu
  // These results will be displayed in the dropdown when in caseConverter mode
  const caseConversionResults = (() => {
    if (activeToolkitSection !== 'caseConverter' || !outputResult?.caseConverter) {
      return []
    }

    const caseResults = outputResult.caseConverter
    return [
      {
        label: 'UPPERCASE',
        value: caseResults.uppercase,
        onSelect: () => handleInputChange(caseResults.uppercase),
      },
      {
        label: 'lowercase',
        value: caseResults.lowercase,
        onSelect: () => handleInputChange(caseResults.lowercase),
      },
      {
        label: 'Title Case',
        value: caseResults.titleCase,
        onSelect: () => handleInputChange(caseResults.titleCase),
      },
      {
        label: 'Sentence case',
        value: caseResults.sentenceCase,
        onSelect: () => handleInputChange(caseResults.sentenceCase),
      },
      {
        label: 'rAnDoM CaSe',
        value: caseResults.randomCase,
        onSelect: () => handleInputChange(caseResults.randomCase),
      },
      {
        label: 'aLtErNaTiNg CaSe',
        value: caseResults.alternatingCase,
        onSelect: () => handleInputChange(caseResults.alternatingCase),
      },
      {
        label: 'iNVERSE cASE',
        value: caseResults.inverseCase,
        onSelect: () => handleInputChange(caseResults.inverseCase),
      },
      {
        label: 'camelCase',
        value: caseResults.camelCase,
        onSelect: () => handleInputChange(caseResults.camelCase),
      },
      {
        label: 'PascalCase',
        value: caseResults.pascalCase,
        onSelect: () => handleInputChange(caseResults.pascalCase),
      },
      {
        label: 'snake_case',
        value: caseResults.snakeCase,
        onSelect: () => handleInputChange(caseResults.snakeCase),
      },
      {
        label: 'kebab-case',
        value: caseResults.kebabCase,
        onSelect: () => handleInputChange(caseResults.kebabCase),
      },
      {
        label: 'CONSTANT_CASE',
        value: caseResults.constantCase,
        onSelect: () => handleInputChange(caseResults.constantCase),
      },
      {
        label: 'dot.case',
        value: caseResults.dotCase,
        onSelect: () => handleInputChange(caseResults.dotCase),
      },
      {
        label: 'path/case',
        value: caseResults.pathCase,
        onSelect: () => handleInputChange(caseResults.pathCase),
      },
      {
        label: 'Train-Case',
        value: caseResults.trainCase,
        onSelect: () => handleInputChange(caseResults.trainCase),
      },
    ]
  })()

  return (
    <div
      className={`${styles.toolContainer} ${isPreviewFullscreen ? styles.fullscreenPreview : ''}`}
      ref={dividerContainerRef}
      style={!isPreviewFullscreen ? { gridTemplateColumns: `${dividerLeftRatio}% auto 1fr` } : undefined}
    >
      {/* Left Panel - Input */}
      <div className={`${styles.leftPanel} ${isPreviewFullscreen ? styles.hidden : ''}`}>
        <InputTabs
          selectedTool={textToolkitTool}
          inputTabLabel="Text"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={textToolkitTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={textToolkitTool}
                onConfigChange={setConfigOptions}
                onToolkitSectionChange={setActiveToolkitSection}
                activeToolkitSection={activeToolkitSection}
                currentConfig={configOptions}
                result={outputResult}
                findReplaceConfig={findReplaceConfig}
                onFindReplaceConfigChange={setFindReplaceConfig}
                diffConfig={diffConfig}
                onDiffConfigChange={setDiffConfig}
                sortLinesConfig={sortLinesConfig}
                onSortLinesConfigChange={setSortLinesConfig}
                removeExtrasConfig={removeExtrasConfig}
                onRemoveExtrasConfigChange={setRemoveExtrasConfig}
                delimiterTransformerConfig={delimiterTransformerConfig}
                onDelimiterTransformerConfigChange={setDelimiterTransformerConfig}
              />
            </div>
          }
          inputTabResults={caseConversionResults}
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
                selectedTool={textToolkitTool}
                configOptions={configOptions}
                getToolExample={getToolExample}
                errorData={null}
                predictedTools={[]}
                onSelectTool={() => {}}
                validationErrors={[]}
                lintingWarnings={[]}
                result={outputResult}
                activeToolkitSection={activeToolkitSection}
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
          outputType={textToolkitTool?.outputType}
          loading={loading}
          error={error}
          toolId="text-toolkit"
          activeToolkitSection={activeToolkitSection}
          onActiveToolkitSectionChange={setActiveToolkitSection}
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
