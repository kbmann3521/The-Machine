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

export default function EmailValidatorTool() {
  // Standalone page uses different detailed description format
  const standaloneDetailedDescription = {
    whatToolDoes: [
      'This tool validates email addresses with professional-grade comprehensive analysis designed specifically for validating email lists for marketing campaigns, user registration, and data quality assurance. It answers a fundamental question: does this address belong to a real, engaged human inbox?',
      'Email validation is often misunderstood as a binary question: can this inbox receive mail? In reality, campaign performance depends on something much more nuanced. Campaign readiness is not about technical possibility alone—it is about probability. The likelihood that an address belongs to a real, engaged human inbox and that sending to it will not degrade sender reputation.',
      'The tool combines multiple validation layers: RFC 5321/5322 syntax compliance, domain existence verification via real-time DNS lookups (MX/A/AAAA records), disposable domain detection (55,000+ domains), role-based email identification (admin@, support@, etc.), free provider detection (Gmail, Yahoo, Outlook, etc.), TLD quality assessment, and sophisticated multi-dimensional scoring.',
      'The analysis provides domain health scoring (based on authentication infrastructure maturity like SPF/DMARC), local-part gibberish scoring (based on username patterns and linguistic signals), and final campaign readiness scoring that combines both factors. Results include phishing risk assessment, gibberish detection, reputation analysis, and delivery guarantees—all presented with clear, actionable feedback.',
      'The purpose is to save time, reduce bounce rates, improve sender reputation, and make email validation easier while remaining fully transparent about how every result was produced. No guessing, no hidden logic, no AI interpretation—just explainable, rule-based validation you can trust.',
    ],
    whyExists: [
      'Email validation requires understanding a distinction that most tools miss: the difference between technical capability and practical reliability.',
      'From a purely technical standpoint, a domain needs only one thing to receive email: MX records. Everything else is optional. But optional does not mean meaningless. Domains that are actively used for email tend to exhibit a pattern of deliberate configuration. Domains that are abandoned, parked, disposable, or low-effort tend not to.',
      'Campaign readiness is about recognizing that signal. A domain with proper SPF, DMARC, multiple MX records, and DNS hygiene is not just "more compliant"—it reveals stewardship. It signals that someone cares enough to maintain infrastructure intentionally. That correlates strongly with legitimate use and reliable delivery.',
      'Similarly, local-part (username) analysis reveals human likelihood. Addresses with high entropy, non-pronounceable structure, excessive length, or synthetic segmentation are overwhelmingly associated with auto-generated accounts, scraped datasets, spam traps, and abandoned inboxes. This is not subjective judgment—it is statistical reality across email ecosystems.',
      'Most email validators fail because they treat all these signals as independent checks rather than indicators of intent and maturity. This tool fills that gap: it combines validation, analysis, and scoring in a way that reflects real campaign outcomes.',
      'Its goal is to give you confidence that validation is accurate, repeatable, and suitable for real-world use—whether that means lead list validation, signup form hygiene, bounce rate reduction, sender reputation protection, data quality assurance, compliance checking, or bulk email validation.',
      'The tool philosophy: accurate email validation should be fast, free, privacy-respecting, and transparent about how it works. No subscriptions. No data retention. No mysterious algorithms. Just clear, rule-based analysis grounded in email standards and real-world behavior patterns.',
    ],
    whatItChecks: [
      'Why Email Infrastructure and Identity Signals Matter for Campaign Readiness: Email validation is fundamentally about probability, not just technical possibility. Campaign readiness depends on whether an address belongs to a real, engaged human inbox and whether sending to it will degrade sender reputation. Signals like SPF, DMARC, DNS hygiene, and local-part structure matter, even when they do not directly control whether inbound mail is accepted. That distinction is why this tool exists: to measure what actually predicts campaign success.',

      'Domain Health Is a Measure of Intent and Maturity: From a purely technical standpoint, a domain needs only one thing to receive email: MX records. Everything else is optional. But optional does not mean meaningless. Domains that are actively used for email tend to exhibit a pattern of deliberate configuration. Domains that are abandoned, parked, disposable, or low-effort tend not to. Domain health scoring exists to measure that difference. It is not a test of correctness—it is a test of stewardship.',

      'Why SPF Matters Even for Receiving Domains: SPF (Sender Policy Framework) technically answers a narrow question: which servers are allowed to send mail as this domain? It does not determine whether the domain accepts inbound mail, whether a message sent to the domain will be rejected, or whether a mailbox exists. Yet SPF still matters for campaign readiness because it signals intentional domain management. A domain with no SPF record is often abandoned, parked, never intended for legitimate mail use, or created for disposable purposes. A domain with an SPF record—even a permissive one—has taken an explicit step to participate in the email ecosystem. That correlates strongly with legitimate use.',

      'Why Strict SPF Is a Positive Signal: A strict SPF configuration (such as v=spf1 include:_spf.google.com -all) indicates that the domain owner understands email identity, has defined authorized senders, and is confident enough to reject impersonation. This does not mean mail sent to the domain will be rejected—SPF is evaluated against the sender\'s domain, not the recipient\'s. In a receiving-quality model, strict SPF is not about enforcement—it is about confidence and care. That is why it earns a positive contribution to domain health.',

      'Why Large Providers Remain Neutral: Major mailbox providers often use permissive SPF intentionally. Their sending infrastructure is massive, dynamic, and distributed. Hard enforcement would create unacceptable false failures. As a result: permissive SPF is treated as neutral, strict SPF is rewarded, and missing SPF is a negative signal. The model does not need exceptions. The logic holds consistently across scales.',

      'Why DMARC Matters Beyond Enforcement: DMARC is frequently misunderstood as a simple enforcement switch. In practice, it does two things: defines authentication alignment expectations and enables reporting and visibility into abuse. A DMARC record with p=none still enables alignment checks, generates aggregate failure reports, and signals awareness of spoofing risk. That is why missing DMARC is more concerning than non-enforcing DMARC. Enforcement (p=quarantine or p=reject) indicates maturity and confidence, but it is not required for legitimacy. Many real domains never move beyond monitoring mode due to complex sending environments. DMARC is therefore treated as: a negative signal when absent, neutral when present without enforcement, and a positive signal when enforcement is requested. Again, this reflects intent, not capability.',

      'Why MX Configuration Quality Matters: MX records determine where mail is delivered, but their configuration reveals how reliable that delivery is likely to be. Domains that route mail through established providers, publish multiple MX records, and avoid invalid patterns (such as MX records pointing to CNAMEs) tend to be actively managed, resilient to outages, and less prone to intermittent failures. Poor MX configurations may still technically accept mail, but they increase bounce risk and delivery instability. That directly impacts campaign outcomes. For this reason, MX quality contributes to domain health as a reliability signal.',

      'Why DNS Hygiene Is a Secondary Signal: DNS hygiene signals—such as functional A/AAAA records, multiple authoritative name servers, and DNSSEC signing—do not determine deliverability, but they reveal domain seriousness. Well-maintained domains are statistically more likely to be long-lived, legitimate, and professionally managed. These signals are therefore treated as small bonuses, never penalties, never decisive on their own. They refine the score without dominating it.',

      'Why Gibberish in the Local-Part Matters: Local-part analysis addresses a different question entirely. While domain health measures infrastructure maturity, local-part gibberish scoring measures human likelihood. Addresses with high entropy, non-pronounceable structure, excessive length, or synthetic segmentation are overwhelmingly associated with auto-generated accounts, scraped datasets, spam traps, and abandoned inboxes. This is not a subjective judgment—it is a statistical reality across email ecosystems. Unlike words such as "demo" or "test," gibberish does not convey context or intent. It conveys automation. For that reason, gibberish directly degrades local-part credibility and deserves a real penalty.',

      'Why Some Language Triggers Warnings Instead of Penalties: Not all risky signals predict non-human inboxes. Words indicating testing, placeholders, NSFW language, or hostile or abusive tone often reflect intent or reputation risk, not technical or behavioral likelihood. Such signals may increase complaint probability, brand risk, and audience mismatch. But they do not reliably predict that an inbox is fake or inactive. For that reason, these signals are surfaced as warnings, not automatic penalties, with the option for stricter handling when explicitly desired. This distinction prevents moral judgment from contaminating probabilistic scoring.',

      'Why Campaign Readiness Uses the Weakest Axis: Campaign risk is constrained by the weakest component. A real person at a poorly configured domain creates bounce risk. A pristine domain with non-human users creates complaint risk. For that reason, campaign readiness is derived from the minimum of domain health and local-part gibberish scoring. This reflects real-world outcomes more accurately than averaging. Optimism does not reduce risk. Constraints define it.',

      'The Unifying Principle: Every signal falls into one of three categories: infrastructure reliability (domain health), human likelihood (local-part gibberish), and contextual risk (warnings). SPF and DMARC matter not because they accept mail, but because they reveal who is on the other end. Gibberish matters not because it is ugly, but because it predicts non-human behavior. Warnings exist because not all risks should be enforced. When these categories are kept distinct, campaign readiness becomes explainable, defensible, and aligned with real email behavior—not arbitrary rules.',
    ],
    howToUse: [
      'Single Email: Paste a single email address and hit validate. You\'ll get instant feedback showing domain health, local-part gibberish scoring, and combined campaign readiness.',
      'Understand the Scores: Domain Health Score measures infrastructure maturity (SPF, DMARC, MX configuration, DNS hygiene). Local-Part Gibberish Score measures human likelihood (username patterns and linguistic signals). Campaign Readiness combines both using the minimum (constraint model), reflecting that campaign risk is constrained by the weakest component.',
      'Batch Validation: Paste multiple emails (comma-separated, newline-separated, or one per line) to validate entire lists at once. Results stream in progressively as DNS lookups complete.',
      'Filtering: Use the filters panel to sort results by status, campaign score range, TLD quality, gibberish level, MX records, DMARC policy, SPF presence, and other infrastructure signals.',
      'Review Detailed Breakdowns: Each email shows which signals contributed to the score—missing SPF, weak DMARC, gibberish patterns, suspicious infrastructure—so you understand exactly why each address scored the way it did.',
      'Analyze Warnings: Warnings flag contextual risks (testing indicators, NSFW language, role-based addresses) that do not automatically penalize scores but warrant investigation depending on your campaign needs.',
      'Export: Download validated results as CSV with all scoring, detailed infrastructure breakdowns, and DNS metrics for integration with your systems.',
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
      'Output: Structured JSON/CSV with email validity (valid/invalid), campaign readiness score (0-100) and label, domain health scoring with infrastructure breakdown, local-part gibberish scoring with identity assessment, phishing risk, role-based detection, TLD quality, gibberish score, DNS metrics (SPF, DMARC, MX records), delivery guarantees, and actionable feedback.',
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
      { question: 'What is campaign readiness? How is it different from validity?', answer: 'Validity is binary: is the email format correct and does the domain accept mail? Campaign readiness is probabilistic: is this address likely to be a real, engaged human inbox and will sending to it degrade my reputation? An email can be technically valid but still risky for campaigns. Campaign readiness reflects suitability, not just technical correctness.' },

      { question: 'How does the two-axis scoring model work?', answer: 'The model has two independent axes: Domain Health (infrastructure maturity) and Local-Part Gibberish (human likelihood). Domain Health measures SPF, DMARC, MX configuration, DNS hygiene—signals that reveal stewardship and care. Local-Part Gibberish measures username patterns—signals that reveal automation vs. human intent. Campaign Readiness is derived from the minimum of these two scores, because campaign risk is constrained by the weakest component. A real person at a poorly configured domain creates bounce risk; a pristine domain with non-human users creates complaint risk.' },

      { question: 'Why does SPF matter if it doesn\'t control whether inbound mail is accepted?', answer: 'SPF is evaluated against the sender\'s domain, not the recipient\'s. Yet it still signals intentional domain management. A domain with no SPF is often abandoned, parked, or never intended for legitimate use. A domain with strict SPF (like v=spf1 include:_spf.google.com -all) indicates the owner understands email identity and is confident enough to reject impersonation. These are signals of stewardship that correlate with legitimate use and delivery reliability.' },

      { question: 'What does a missing DMARC record signal?', answer: 'DMARC does two things: defines authentication alignment expectations and enables reporting into abuse. A DMARC record with p=none still enables these. Missing DMARC is more concerning than non-enforcing DMARC because it signals no awareness of spoofing risk at all. Enforcement (p=quarantine or p=reject) is a positive signal but not required—many legitimate domains stay in monitoring mode. What matters is the signal: is anyone managing this domain\'s identity?' },

      { question: 'Why are NSFW and abusive language warnings instead of penalties?', answer: 'These words indicate intent or reputation risk, but they do not reliably predict that an inbox is fake or inactive. A domain might use abusive language in its messaging and still be legitimate. For that reason, such signals are surfaced as warnings—flags for you to investigate—rather than automatic penalties. This distinction prevents moral judgment from contaminating probabilistic scoring. Gibberish, by contrast, has a strong statistical correlation with non-human inboxes and does carry a penalty.' },

      { question: 'What is gibberish? Why does it matter?', answer: 'Gibberish is high-entropy, non-pronounceable, excessively long, or synthetically segmented usernames. Addresses with these patterns are overwhelmingly associated with auto-generated accounts, scraped datasets, spam traps, and abandoned inboxes. Unlike words like "demo" or "test," which convey intent, gibberish conveys automation. This is statistical reality, not subjective judgment. For that reason, gibberish directly degrades credibility and deserves a real penalty.' },

      { question: 'Does this tool use AI or machine learning?', answer: 'No. This tool does not use AI, neural networks, or machine learning. All processing is entirely rule-based and deterministic according to RFC standards, industry databases, and explicit validation logic. You get the same result every time with no surprises.' },

      { question: 'Is my email data sent to a server or stored?', answer: 'No. Your input is not stored, logged, transmitted, cached, or retained in any way. All processing happens locally in your browser (or in transient execution environments that immediately discard data). Your email data never leaves your device.' },

      { question: 'Can I use this for bulk validation of thousands of emails?', answer: 'Yes. The tool is designed for batch processing. You can validate email lists of any size. Simply paste all addresses (comma-separated or newline-separated) and the tool will process and score them all at once. Results stream in progressively as DNS lookups complete. Results can be exported to CSV.' },

      { question: 'What do the campaign readiness scores mean?', answer: '90-100 = Excellent (safe for all campaigns), 75-89 = Good (safe for most campaigns), 55-74 = Risky (proceed with caution), 30-54 = Poor (likely problem address), <30 = Very Poor (very high risk). Scores are derived from domain health and local-part gibberish assessment—both must be strong for campaign readiness to be high.' },

      { question: 'Can I rely on this for production use?', answer: 'Yes. The validation follows RFC 5321/5322 standards, uses verified datasets (55,000+ disposable domains, ICANN TLD list), performs real DNS lookups, and applies consistent, rule-based scoring. Results are suitable for production systems, compliance audits, and business-critical workflows because the logic is deterministic and explainable.' },

      { question: 'Does the tool check if an email is currently active?', answer: 'No. The tool validates format, domain existence, and infrastructure but cannot confirm whether a specific email address has an active mailbox. It performs deliverability checks (MX records) but not mailbox verification. What it does measure is whether the infrastructure and patterns signal that an address is likely to be real and engaged.' },
    ],
    finalNotes: 'This tool is intentionally focused, transparent, and predictable. It does not try to be everything to everyone. Instead, it provides a dependable solution to a clearly defined problem: measuring campaign readiness with explainable, rule-based logic that reflects real email behavior.\n\nThe philosophy is simple: every signal falls into one of three categories—infrastructure reliability (domain health), human likelihood (local-part gibberish), or contextual risk (warnings). SPF and DMARC matter because they reveal stewardship. Gibberish matters because it predicts automation. Warnings flag risks that warrant investigation but should not be automatically penalized. When these categories are kept distinct, validation becomes defensible and aligned with reality.\n\nWhether you\'re validating signup forms, cleaning marketing lists, assessing campaign readiness, reducing bounce rates, or protecting sender reputation, you can use this tool knowing exactly how it works: what each score means, which signals contributed to it, and why. Your data is safe, results are consistent and trustworthy, and you can integrate validation into production systems with confidence.\n\nAll tools on this site follow the same philosophy: deterministic behavior, zero data retention, transparent processing, and results you can understand and rely on. No surprises. No hidden costs. No data grabs. No AI. No magic. Just clear, rule-based analysis grounded in standards and real-world patterns.',
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
