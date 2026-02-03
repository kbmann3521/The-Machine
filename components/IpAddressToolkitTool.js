import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import IPToolkitOutputPanel from './IPToolkitOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function IpAddressToolkitTool() {
  const standaloneDetailedDescription = {
    whatToolDoes: 'This tool provides comprehensive IP address analysis and network utilities in one place. Validate individual IPv4 and IPv6 addresses, analyze IP ranges, process bulk IP lists with filtering and comparison, calculate CIDR subnets, and run network diagnostics. Single IP analysis includes validation, normalization, integer conversion, public/private classification, geolocation, ASN lookup, reverse DNS, and safety scoring. Bulk mode supports side-by-side comparison for 2 IPs and aggregate analysis with outlier detection for 3+ IPs.',
    whyExists: 'IP address management is essential for network engineers, security professionals, and developers. This tool exists to provide a focused, comprehensive, deterministic alternative that combines multiple IP utilities without requiring separate tools.\n\nIts goal is to eliminate the need to search multiple resources, provide instant validation and analysis, support both IPv4 and IPv6, handle bulk processing for large datasets, and give you confidence that results are accurate and based on standard networking concepts.',
    commonUseCases: 'This tool is commonly used for IP validation, network infrastructure planning, security analysis, and bulk IP list processing. It is especially useful for network administrators, security engineers, DevOps professionals, system architects, and anyone working with IP addresses and network ranges.\n\nUsers often rely on this tool to validate IP addresses in logs, analyze geolocation for regional user bases, check IP reputation, plan subnet configurations, process firewall logs, monitor network connectivity, identify private vs public addresses, and detect security threats.',
    deterministic: 'This tool is fully deterministic. The same input and configuration will always produce the same output. There is no randomness, learning, or adaptive behavior involved at any stage of processing.\n\nNo AI models are used to interpret, infer, or modify your data. All results are generated using explicit, predefined logic based on IP standards and network classifications so you always know what to expect.',
    privacy: 'Your data is never stored, logged, or transmitted. All processing happens locally in your browser or within a transient execution environment that does not retain input or output.\n\nThere are no accounts, tracking, or hidden analytics tied to your content. You can use this tool with sensitive data knowing that it does not leave your device or get saved anywhere.',
    freeToUse: 'This tool is completely free to use. There are no usage limits, paywalls, subscriptions, or hidden restrictions.\n\nYou can use it as often as needed, whether for quick one-off lookups or repeated daily analysis, without worrying about cost or quotas.',
    inputOutput: 'This tool accepts single IP addresses, IP ranges (e.g., 192.168.1.1 to 192.168.1.10), CIDR notation (e.g., 192.168.1.0/24), or bulk lists of IPs (one per line).\n\nThe output is structured JSON containing comprehensive analysis including validation status, classification, geolocation, conversion formats, network details, and comparison analysis for bulk mode. Results can be viewed as cards, JSON, or CSV depending on your needs.',
    whoFor: 'This tool is intended for network engineers, security professionals, system administrators, DevOps engineers, and developers working with IP addresses and networks. It is ideal for those who value accuracy, comprehensive analysis, and quick access to IP information.\n\nIt is not intended for hacking, unauthorized network access, or malicious purposes. This tool is designed for legitimate network administration, security research, and infrastructure planning.',
    reliability: 'Because this tool is deterministic and based on standard IP specifications and network classifications, it can be safely used in professional and production environments. You always know the analysis is consistent and reliable.\n\nThis makes it suitable for infrastructure planning, security audits, compliance documentation, network monitoring, and any context where accurate IP analysis is critical.',
    faq: [
      { question: 'Does this tool use AI?', answer: 'No. This tool uses deterministic IP validation, classification, and network logic with no AI or machine learning involved.' },
      { question: 'Is my data sent to a server?', answer: 'No. Your input is not stored, logged, or transmitted. Processing happens entirely in your browser.' },
      { question: 'Does this tool support both IPv4 and IPv6?', answer: 'Yes. This tool automatically detects and supports both IPv4 and IPv6 addresses with appropriate analysis for each.' },
      { question: 'Can I process multiple IPs at once?', answer: 'Yes. Bulk mode supports processing up to 10,000 IPs with filtering, deduplication, and comparison features.' },
      { question: 'What is CIDR notation?', answer: 'CIDR (Classless Inter-Domain Routing) is a way to represent IP ranges compactly, e.g., 192.168.1.0/24 represents all IPs from 192.168.1.0 to 192.168.1.255.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything at once. Instead, it provides a dependable solution for comprehensive IP address analysis, without compromising privacy or correctness.\n\nIf you use multiple tools on this site, each one follows the same philosophy: deterministic behavior, zero data retention, and results you can trust.',
  }

  const ipAddressToolkitTool = {
    ...TOOLS['ip-address-toolkit'],
    toolId: 'ip-address-toolkit',
    id: 'ip-address-toolkit',
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
          toolId: 'ip-address-toolkit',
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
    ipAddressToolkitTool,
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
          selectedTool={ipAddressToolkitTool}
          inputTabLabel="IP Address"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={ipAddressToolkitTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={ipAddressToolkitTool}
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
                selectedTool={ipAddressToolkitTool}
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
        <IPToolkitOutputPanel
          result={outputResult}
          outputType={ipAddressToolkitTool?.outputType}
          loading={loading}
          error={error}
          toolId="ip-address-toolkit"
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
