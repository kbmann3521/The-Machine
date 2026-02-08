import { useCallback, useState, useRef, useEffect } from 'react'
import InputTabs from './InputTabs'
import ToolOutputPanel from './ToolOutputPanel'
import UniversalInput from './UniversalInput'
import ToolDescriptionContent from './ToolDescriptionContent'
import ToolConfigPanel from './ToolConfigPanel'
import { TOOLS, getToolExample } from '../lib/tools'
import { useOutputToInput } from '../lib/hooks/useOutputToInput'
import styles from '../styles/hub.module.css'

export default function EmailValidatorTool() {
  // Standalone page uses different detailed description format
  const standaloneDetailedDescription = {
    whatToolDoes: [
      'This tool validates email addresses with professional-grade comprehensive analysis designed specifically for validating email lists for marketing campaigns, user registration, and data quality assurance. It combines multiple validation layers: RFC 5321/5322 syntax compliance, domain existence verification via real-time DNS lookups (MX/A/AAAA records), disposable domain detection (55,000+ domains), role-based email identification (admin@, support@, etc.), free provider detection (Gmail, Yahoo, Outlook, etc.), TLD quality assessment, and sophisticated multi-dimensional scoring.',
      'The analysis provides domain health scoring (based on authentication infrastructure like SPF/DMARC), local-part credibility scoring (based on username patterns and linguistic signals), and final campaign readiness scoring that combines both factors. Results include phishing risk assessment, gibberish detection, reputation analysis, and delivery guarantees—all presented with clear, actionable feedback.',
      'The purpose is to save time, reduce bounce rates, improve sender reputation, and make email validation easier while remaining fully transparent about how every result was produced. No guessing, no hidden logic, no AI interpretation—just explainable, rule-based validation you can trust.',
    ],
    whyExists: [
      'Many email validators are inaccurate, incomplete, unreliable, or overly complex. Most either do basic syntax checking (missing deliverability), or expensive API-based validation (slow and costly). This tool fills the gap with a focused, comprehensive, deterministic alternative for marketing professionals, developers, and data teams.',
      'Its goal is to give you confidence that validation is accurate, repeatable, and suitable for real-world campaign use—whether that means lead list validation, signup form hygiene, bounce rate reduction, sender reputation protection, data quality assurance, compliance checking, or bulk email validation.',
      'The tool philosophy: accurate email validation should be fast, free, privacy-respecting, and transparent about how it works. No subscriptions. No data retention. No mysterious algorithms. Just clear, rule-based analysis you can understand and rely on.',
    ],
    whatItChecks: [
      'Syntax & Format: RFC 5321/5322 compliance, local-part length (0-64 chars), domain length (0-255 chars), valid characters, proper structure',
      'DNS & Deliverability: Real-time MX record lookup, A/AAAA fallback detection, domain existence verification, mail server redundancy detection',
      'Authentication Infrastructure: SPF record presence and quality, DMARC policy strength (reject/quarantine/none/missing), DMARC monitoring capability',
      'Domain Trust: TLD quality assessment (high-trust like .com vs suspicious like .xyz), ICANN-approved TLD validation, known disposable/temporary domain detection',
      'Email Identity: Role-based pattern detection (admin, support, noreply, etc.), gibberish/random username scoring, abusive language detection, brand impersonation signals',
      'Reputation & Risk: Phishing risk scoring, trustworthiness assessment, free email provider detection, business domain identification',
      'Bulk Processing: Batch validation for email lists, filtering and sorting capabilities, export to CSV with full breakdown',
    ],
    howToUse: [
      'Single Email: Paste a single email address and hit validate. You\'ll get instant feedback with detailed scoring and breakdowns.',
      'Batch Validation: Paste multiple emails (comma-separated, newline-separated, or one per line) to validate entire lists at once.',
      'Filtering: Use the filters panel to sort results by status, campaign score range, TLD quality, gibberish level, MX records, DMARC policy, SPF presence, etc.',
      'Analysis: Review the campaign readiness score (90+ = Excellent, 75-89 = Good, 55-74 = Risky, 30-54 = Poor, <30 = Very Poor), detailed breakdowns, and actionable warnings.',
      'Export: Download validated results as CSV with all scoring, breakdown details, and DNS metrics for use in your systems.',
    ],
    commonUseCases: [
      'Email List Validation: Validate marketing lists before sending campaigns to reduce bounce rates and improve sender reputation',
      'Lead List Hygiene: Clean lead databases to identify low-quality or disposable addresses before outreach',
      'Signup Form Protection: Validate emails during user registration to prevent spam, throwaway accounts, and role-based addresses',
      'Campaign Readiness Assessment: Score email addresses by campaign suitability before sending bulk campaigns',
      'Fraud Prevention: Identify phishing patterns, brand impersonation, and suspicious infrastructure to prevent account takeover',
      'Data Quality Assurance: Ensure email data quality in CRMs, databases, and mailing lists meet compliance standards',
      'Compliance Validation: Verify email list compliance for GDPR, CAN-SPAM, and other regulations',
      'DNS Analysis: Check domain infrastructure quality (MX records, SPF, DMARC) for authentication maturity assessment',
    ],
    deterministic: 'This tool is fully deterministic and rule-based. The same email input will always produce identical output every single time. There is no randomness, machine learning, or adaptive behavior involved at any stage of processing. No AI models are used to interpret, infer, or make probabilistic judgments about your data. All results are generated using explicit, predefined validation rules so you always know exactly what to expect and can rely on the output in automated, repeatable, and production workflows.',
    privacy: 'Your data is never stored, logged, cached, or transmitted to external servers. All processing happens locally in your browser or within transient execution environments that do not retain any input, output, or metadata. There are no accounts, authentication, tracking cookies, or hidden analytics tied to your content. You can use this tool with sensitive customer data, employee lists, and private information knowing with certainty that it does not leave your device and is not saved anywhere.',
    freeToUse: 'This tool is completely and genuinely free to use. There are no usage limits, hidden paywalls, upgrades, subscriptions, API tokens, rate limits, or any paid tiers. You can validate one email or ten thousand emails without any cost or restriction. Use it for personal projects, commercial validation, bulk list cleaning, or repeated daily workflows without worrying about cost, quotas, or surprise charges.',
    inputOutput: [
      'Input: Single email address, or multiple emails in any common format (comma-separated, newline-separated, one per line). The tool does not attempt to guess intent, repair fundamentally invalid emails, or infer alternative formats.',
      'Output: Structured JSON/CSV with email validity (valid/invalid), campaign readiness score (0-100) and label, domain health scoring with infrastructure breakdown, local-part credibility scoring with identity assessment, phishing risk, role-based detection, TLD quality, gibberish score, DNS metrics (SPF, DMARC, MX records), delivery guarantees, and actionable feedback.',
    ],
    whoFor: [
      'Marketing Professionals: Validate email lists, clean databases, improve campaign deliverability, reduce bounce rates',
      'Developers & Engineers: Integrate email validation into signup forms, API endpoints, and data pipelines',
      'Data Analysts: Assess email data quality, compliance readiness, and dataset hygiene',
      'Product Managers: Understand user email quality metrics and identify problem patterns in user data',
      'Compliance Officers: Verify email data compliance and assess domain authentication infrastructure',
      'Fraud Prevention Specialists: Detect phishing patterns, suspicious infrastructure, and identity risk signals',
      'Anyone Managing Email Data: Users who need accurate, transparent, rule-based email validation without complexity or cost',
    ],
    reliability: 'Because this tool is fully deterministic and rule-based, it can be safely integrated into production systems, automated workflows, and compliance processes. You always know which validation rules are applied, exactly how scores are calculated, and why results are generated the way they are. No black boxes, no mysterious algorithms, no surprise failures.\n\nThis makes it suitable for user registration systems, email list management, CRM data validation, fraud prevention, lead scoring, campaign readiness assessment, compliance audits, and any workflow where unpredictable validation would be unacceptable.',
    faq: [
      { question: 'Does this tool use AI or machine learning?', answer: 'No. This tool does not use AI, neural networks, or machine learning. All processing is entirely rule-based and deterministic according to RFC standards, industry databases, and explicit validation logic. You get the same result every time with no surprises.' },
      { question: 'Is my email data sent to a server or stored?', answer: 'No. Your input is not stored, logged, transmitted, cached, or retained in any way. All processing happens locally in your browser (or in transient execution environments that immediately discard data). Your email data never leaves your device.' },
      { question: 'Can I use this for bulk validation of thousands of emails?', answer: 'Yes. The tool is designed for batch processing. You can validate email lists of any size. Simply paste all addresses (comma-separated or newline-separated) and the tool will process and score them all at once. Results can be exported to CSV.' },
      { question: 'Will this tool modify, normalize, or rewrite my email addresses?', answer: 'The tool analyzes and validates without modifying your original input. It normalizes Punycode (internationalized domains) for display purposes but preserves your original email address. No addresses are silently modified or "corrected."' },
      { question: 'What do the campaign readiness scores mean?', answer: '90-100 = Excellent (safe for all campaigns), 75-89 = Good (safe for most campaigns), 55-74 = Risky (proceed with caution), 30-54 = Poor (likely problem address), <30 = Very Poor (very high risk). Scores combine domain infrastructure quality and email identity assessment.' },
      { question: 'Why do some valid emails get low campaign scores?', answer: 'Campaign readiness is different from basic validity. An email can be syntactically valid but still risky for marketing (e.g., role-based addresses, domains without proper authentication). The score reflects suitability for campaigns, not just technical validity.' },
      { question: 'Can I rely on this for production use?', answer: 'Yes. The validation follows RFC 5321/5322 standards, uses verified datasets (55,000+ disposable domains, ICANN TLD list), performs real DNS lookups, and applies consistent, rule-based scoring. Results are suitable for production systems, compliance audits, and business-critical workflows.' },
      { question: 'Does the tool check if an email is currently active?', answer: 'No. The tool validates format, domain existence, and infrastructure but cannot confirm whether a specific email address has an active mailbox. It performs deliverability checks (MX records) but not mailbox verification.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything to everyone. Instead, it provides a dependable solution to a clearly defined problem—accurate, fast, privacy-respecting email validation—without compromising correctness or user control.\n\nWhether you\'re validating signup forms, cleaning marketing lists, assessing campaign readiness, or ensuring data quality, you can use this tool knowing exactly how it works, that your data is safe, and that results will always be consistent and trustworthy.\n\nAll tools on this site follow the same philosophy: deterministic behavior, zero data retention, transparent processing, and results you can understand and rely on. No surprises. No hidden costs. No data grabs.',
  }

  const emailValidatorTool = {
    ...TOOLS['email-validator'],
    toolId: 'email-validator',
    id: 'email-validator',
    detailedDescription: standaloneDetailedDescription,
  }

  // State for input and output
  const [inputText, setInputText] = useState('')
  const [outputResult, setOutputResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false)
  const [dividerLeftRatio, setDividerLeftRatio] = useState(50) // Track left panel width as percentage

  // Configuration for email-validator
  const [configOptions, setConfigOptions] = useState({})

  // Refs
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

    // Execute immediately
    executeTool(text)
  }, [])

  // Execute the email-validator tool
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
          toolId: 'email-validator',
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
    // Not used in email-validator
  }

  // Use output as input hook
  const { handleUseOutput, hasOutput } = useOutputToInput(
    outputResult,
    emailValidatorTool,
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
          selectedTool={emailValidatorTool}
          inputTabLabel="Email"
          onActiveTabChange={() => {}}
          infoContent={null}
          tabActions={null}
          optionsContent={<ToolDescriptionContent tool={emailValidatorTool} isStandaloneMode={true} />}
          globalOptionsContent={
            <div style={{ padding: '16px' }}>
              <ToolConfigPanel
                tool={emailValidatorTool}
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
                selectedTool={emailValidatorTool}
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
          outputType={emailValidatorTool?.outputType}
          loading={loading}
          error={error}
          toolId="email-validator"
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
