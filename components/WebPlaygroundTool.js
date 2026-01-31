import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import JSEditorInput from './JSEditorInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { classifyMarkdownHtmlInput } from '../lib/contentClassifier'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function WebPlaygroundTool() {
  // Standalone page uses different detailed description format
  const standaloneDetailedDescription = {
    overview: 'This tool is designed to solve a single, specific problem quickly and reliably. It focuses on doing one job well, without unnecessary features, hidden processing, or unpredictable behavior. Whether you\'re working on a small task or integrating it into a larger workflow, this tool provides clear, consistent results you can trust.\n\nIt is built for developers, engineers, analysts, and technically minded users who want precision and transparency. There is no guessing involved—what you put in is processed deterministically, and what you get out is exactly what the rules define.',
    whatToolDoes: 'This tool validates, formats, converts, and lints Markdown and HTML content using strict, rule-based logic to produce clean, predictable output. It performs structural validation (unclosed tags, syntax errors), accessibility linting (missing alt text, semantic issues), semantic checks (heading hierarchy, duplicate elements), and best practice warnings (deprecated tags, inline styles). It does not attempt to infer meaning, rewrite content, or apply creative interpretation. Every transformation follows explicit rules designed to preserve structure, intent, and correctness.\n\nThe purpose of this tool is to save time, reduce human error, and make web documents easier to work with while remaining fully transparent about how the result was produced.',
    whyExists: 'Many online tools rely on opaque processing, AI rewriting, or server-side handling that makes it difficult to understand what actually happened to your data. This tool exists to provide a safer, more predictable alternative.\n\nIts goal is to give you confidence that the output is accurate, repeatable, and suitable for real-world use—whether that means debugging before publishing, validating accessibility, formatting for readability, converting between formats, or preparation for downstream systems.',
    commonUseCases: 'This tool is commonly used when working with Markdown and HTML documents that need to be validated, formatted, converted, or audited for quality and correctness. It is especially useful in development, documentation, content review, accessibility auditing, and deployment workflows where correctness matters.\n\nUsers often rely on this tool to check for syntax errors before publishing, validate accessibility compliance, detect deprecated HTML elements, ensure proper heading hierarchy, convert between Markdown and HTML, beautify messy code, minify for production, and ensure consistency across web content.',
    deterministic: 'This tool is fully deterministic. The same input will always produce the same output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to rewrite, infer, or modify your data. All results are generated using explicit, predefined logic so you always know what to expect and can rely on the output in automated or repeatable workflows.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can use it as often as needed, whether for quick one-off tasks or repeated daily workflows, without worrying about cost or quotas.',
    inputOutput: 'This tool expects valid Markdown or HTML input for the format it is designed to handle. It does not attempt to guess intent, repair fundamentally invalid data, or silently change meaning.\n\nThe output is structured, consistent, and designed to be immediately usable. Any limitations or constraints are intentional and exist to preserve correctness rather than introduce uncertainty.',
    whoFor: 'This tool is intended for users who value accuracy, transparency, and control. It is ideal for developers, technical professionals, technical writers, and anyone working with Markdown or HTML documents.\n\nIt is not intended for creative rewriting, content generation, or automated decision-making. If you need interpretive or generative behavior, this tool is intentionally not designed for that purpose.',
    reliability: 'Because this tool is deterministic and rule-based, it can be safely used in professional and production-adjacent environments. You always know what transformations are applied and why.\n\nThis makes it suitable for debugging, auditing, comparison, validation, and accessibility review tasks where unpredictable output would be unacceptable.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool does not use AI or machine learning. All processing is deterministic and rule-based.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted.' },
      { question: 'Will this tool change the meaning or structure of my data?', answer: 'No. The tool is designed to preserve intent and structure while applying only the transformations it explicitly supports.' },
      { question: 'Can I rely on the output for real projects?', answer: 'Yes. The output is consistent and repeatable, making it suitable for real-world use.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution to a clearly defined problem, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const webPlaygroundTool = {
    ...TOOLS['web-playground'],
    toolId: 'web-playground',
    id: 'web-playground',
    detailedDescription: standaloneDetailedDescription,
  }

  // State for input and output
  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [contentClassification, setContentClassification] = useState(() => classifyMarkdownHtmlInput(''))
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50) // Track left panel width as percentage

  // State for web-playground specific options
  const [markdownInputMode, setMarkdownInputMode] = useState('input')
  const [activeMarkdownInputTab, setActiveMarkdownInputTab] = useState('input')
  const [markdownCustomCss, setMarkdownCustomCss] = useState('')
  const [markdownCustomJs, setMarkdownCustomJs] = useState('')
  const [jsFormatterDiagnostics, setJsFormatterDiagnostics] = useState([])
  const [cssFormattedOutput, setCssFormattedOutput] = useState(null)
  const [jsFormattedOutput, setJsFormattedOutput] = useState(null)
  const [showAnalysisTab, setShowAnalysisTab] = useState(false)
  const [showRulesTab, setShowRulesTab] = useState(false)

  const [cssConfigOptions, setCssConfigOptions] = useState({
    mode: 'beautify',
    indentSize: '2',
    removeComments: true,
    addAutoprefix: false,
    browsers: 'last 2 versions',
    showValidation: true,
    showLinting: true,
    showAnalysisTab: false,
    showRulesTab: false,
  })

  const [jsConfigOptions, setJsConfigOptions] = useState({
    mode: 'format',
    indentSize: '2',
    useSemicolons: true,
    singleQuotes: true,
    trailingComma: 'es5',
    printWidth: '80',
    bracketSpacing: true,
    arrowParens: 'always',
    showAnalysis: true,
    showLinting: true,
    compressCode: false,
    removeComments: false,
    removeConsole: false,
  })

  // Configuration for web-playground
  const [configOptions, setConfigOptions] = useState({
    convertTo: 'none',
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
      // Use a small delay to allow state to settle
      const timer = setTimeout(() => {
        executeTool(inputText)
      }, 0)
      return () => clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configOptions, cssConfigOptions, jsConfigOptions, markdownCustomCss, markdownCustomJs, activeMarkdownInputTab, markdownInputMode])

  // Handle input change and execution
  const handleInputChange = useCallback((text, image = null, preview = null, isLoadExample = false) => {
    const isEmpty = !text || text.trim() === ''
    const previousLength = previousInputLengthRef.current
    const isAddition = text.length > previousLength

    const nextClassification = classifyMarkdownHtmlInput(text)
    setContentClassification(nextClassification)
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

  // Execute the web-playground tool
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
          toolId: 'web-playground',
          inputText: text,
          config: configOptions,
          markdownCustomCss,
          markdownCustomJs,
          markdownInputMode,
          cssConfigOptions,
          jsConfigOptions,
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
  }, [configOptions, markdownCustomCss, markdownCustomJs, markdownInputMode, cssConfigOptions, jsConfigOptions])

  const handleMarkdownInputTabChange = (tabId) => {
    setActiveMarkdownInputTab(tabId)
    if (tabId === 'input' || tabId === 'css' || tabId === 'js') {
      setMarkdownInputMode(tabId)
    }
  }

  const handleImageChange = () => {
    // Not used in web-playground
  }

  const handleUseCssOutputClick = () => {
    if (cssFormattedOutput) {
      setMarkdownCustomCss(cssFormattedOutput)
    }
  }

  const handleUseJsOutputClick = () => {
    if (jsFormattedOutput) {
      setMarkdownCustomJs(jsFormattedOutput)
    }
  }

  const handleUseHtmlOutputClick = () => {
    if (outputResult?.formatted) {
      setInputText(outputResult.formatted)
    }
  }

  // Use output as input hook for web-playground
  const { hasOutput: hasHtmlOutput } = useOutputToInput(
    outputResult,
    webPlaygroundTool,
    activeMarkdownInputTab,
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
          selectedTool={webPlaygroundTool}
          inputTabLabel="HTML"
          onActiveTabChange={handleMarkdownInputTabChange}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={webPlaygroundTool} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={webPlaygroundTool}
                onConfigChange={setConfigOptions}
                onCssConfigChange={setCssConfigOptions}
                currentConfig={configOptions}
                result={outputResult}
                contentClassification={contentClassification}
                cssConfigOptions={cssConfigOptions}
              />
            </div>
          }
          hasOutputToUse={activeMarkdownInputTab === 'input' && outputResult?.formatted ? true : false}
          onUseOutput={handleUseHtmlOutputClick}
          canCopyOutput={true}
          csvWarnings={null}
          useOutputLabel="Format code"
          hasCssOutputToUse={activeMarkdownInputTab === 'css' && markdownCustomCss && cssFormattedOutput ? true : false}
          onUseCssOutput={handleUseCssOutputClick}
          canCopyCssOutput={true}
          useCssOutputLabel="Format code"
          hasJsOutputToUse={activeMarkdownInputTab === 'js' && markdownCustomJs && jsFormattedOutput ? true : false}
          onUseJsOutput={handleUseJsOutputClick}
          canCopyJsOutput={true}
          useJsOutputLabel="Format code"
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
                selectedTool={webPlaygroundTool}
                configOptions={configOptions}
                getToolExample={getToolExample}
                errorData={null}
                predictedTools={[]}
                onSelectTool={() => {}}
                validationErrors={outputResult?.diagnostics && Array.isArray(outputResult.diagnostics) ? outputResult.diagnostics.filter(d => d.type === 'error') : []}
                lintingWarnings={outputResult?.diagnostics && Array.isArray(outputResult.diagnostics) ? outputResult.diagnostics.filter(d => d.type === 'warning') : []}
                result={outputResult}
                activeToolkitSection={null}
                isPreviewFullscreen={isPreviewFullscreen}
                onTogglePreviewFullscreen={setIsPreviewFullscreen}
              />
            </div>
          }
          cssContent={
            <ToolOutputPanel
              result={outputResult}
              outputType={webPlaygroundTool?.outputType}
              loading={loading}
              error={error}
              toolId="web-playground"
              activeToolkitSection={null}
              configOptions={configOptions}
              onConfigChange={setConfigOptions}
              inputText={inputText}
              imagePreview={null}
              warnings={[]}
              onInputUpdate={handleInputChange}
              showAnalysisTab={cssConfigOptions.showAnalysisTab}
              onShowAnalysisTabChange={(val) => setCssConfigOptions({ ...cssConfigOptions, showAnalysisTab: val })}
              showRulesTab={cssConfigOptions.showRulesTab}
              onShowRulesTabChange={(val) => setCssConfigOptions({ ...cssConfigOptions, showRulesTab: val })}
              isPreviewFullscreen={isPreviewFullscreen}
              onTogglePreviewFullscreen={setIsPreviewFullscreen}
              renderCssTabOnly={true}
              activeMarkdownInputTab={activeMarkdownInputTab}
              markdownInputMode={markdownInputMode}
              markdownCustomCss={markdownCustomCss}
              onMarkdownCustomCssChange={setMarkdownCustomCss}
              onCssFormattedOutput={setCssFormattedOutput}
              markdownCustomJs={markdownCustomJs}
              onMarkdownCustomJsChange={setMarkdownCustomJs}
              cssConfigOptions={cssConfigOptions}
              onCssConfigChange={setCssConfigOptions}
              jsConfigOptions={jsConfigOptions}
              onJsConfigChange={setJsConfigOptions}
              onJsFormatterDiagnosticsChange={setJsFormatterDiagnostics}
            />
          }
          jsContent={
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              padding: '16px',
              overflow: 'hidden',
            }}>
              <div style={{
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.5',
                padding: '10px 12px',
                backgroundColor: 'rgba(156, 39, 176, 0.08)',
                border: '1px solid rgba(156, 39, 176, 0.2)',
                borderRadius: '4px',
              }}>
                Edit JavaScript to add interactivity. Scripts run in the preview with access to the DOM and CSS.
              </div>
              <JSEditorInput
                value={markdownCustomJs}
                onChange={setMarkdownCustomJs}
                diagnostics={jsFormatterDiagnostics.filter(d => d.category !== 'lint')}
              />
            </div>
          }
          tabOptionsMap={{}}
        />
      </div>

      {/* Center Divider */}
      <div className={styles.divider} onMouseDown={handleDividerMouseDown} title="Drag to resize panels"></div>

      {/* Right Panel - Output/Preview */}
      <div className={styles.rightPanel}>
        <ToolOutputPanel
          result={outputResult}
          outputType={webPlaygroundTool?.outputType}
          loading={loading}
          error={error}
          toolId="web-playground"
          activeToolkitSection={null}
          configOptions={configOptions}
          onConfigChange={setConfigOptions}
          inputText={inputText}
          imagePreview={null}
          warnings={[]}
          onInputUpdate={handleInputChange}
          showAnalysisTab={showAnalysisTab}
          onShowAnalysisTabChange={setShowAnalysisTab}
          showRulesTab={showRulesTab}
          onShowRulesTabChange={setShowRulesTab}
          isPreviewFullscreen={isPreviewFullscreen}
          onTogglePreviewFullscreen={setIsPreviewFullscreen}
          activeMarkdownInputTab={activeMarkdownInputTab}
          markdownInputMode={markdownInputMode}
          markdownCustomCss={markdownCustomCss}
          onMarkdownCustomCssChange={setMarkdownCustomCss}
          onCssFormattedOutput={setCssFormattedOutput}
          markdownCustomJs={markdownCustomJs}
          onMarkdownCustomJsChange={setMarkdownCustomJs}
          cssConfigOptions={cssConfigOptions}
          onCssConfigChange={setCssConfigOptions}
          jsConfigOptions={jsConfigOptions}
          onJsConfigChange={setJsConfigOptions}
          onJsFormattedOutput={setJsFormattedOutput}
          onJsFormatterDiagnosticsChange={setJsFormatterDiagnostics}
        />
      </div>
    </div>
  )
}
