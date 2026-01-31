import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'
import RegexPatternInput from './RegexPatternInput'
import PatternTemplateSelector from './PatternTemplateSelector'
import { getPatternTemplate } from '../lib/regexPatterns'

export default function RegexToolkit({ config, onConfigChange, result, disabled, onGenerateText }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [testMode, setTestMode] = useState(false)

  const handleFieldChange = (fieldId, value) => {
    const newConfig = { ...config, [fieldId]: value }
    onConfigChange(newConfig)
  }

  const handleTemplateSelect = async (template) => {
    setSelectedTemplateId(template.id)
    const newConfig = {
      ...config,
      pattern: template.pattern,
      flags: template.flags,
      _patternName: template.name,
      _patternDescription: template.description,
    }
    onConfigChange(newConfig)

    // Auto-generate example text only if test mode is on
    if (testMode) {
      setIsGenerating(true)
      try {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || '')
        const generateUrl = `${baseUrl}/api/test-regex-patterns`

        const response = await fetch(generateUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'generate',
            patternName: template.name,
            patternDescription: template.description,
          }),
          credentials: 'same-origin',
        })

        if (response.ok) {
          const { text } = await response.json()
          if (onGenerateText) {
            onGenerateText(text, null, null)
          }
        }
      } catch (error) {
        console.error('Error generating example text:', error)
      } finally {
        setIsGenerating(false)
      }
    }
  }

  const warnings = result?.warnings || []
  const selectedTemplate = selectedTemplateId ? getPatternTemplate(selectedTemplateId) : null

  return (
    <div className={styles.regexToolkitContainer}>
      {/*
        TEST MODE TOGGLE PANEL - DISABLED FOR NOW
        Purpose: Allows users to enable 'Test Mode' which auto-generates example text when selecting regex pattern templates
        Functionality:
          - When enabled, clicking a template will generate sample input text based on the pattern
          - Calls /api/test-regex-patterns with action 'generate' to create example text
        How to re-enable: Uncomment this entire block and ensure setTestMode state is still present above
        Status: Keeping functional code intact (handleTemplateSelect still references testMode) but hiding UI
      */}
      {/* <div className={styles.testModeToggle}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={testMode}
            onChange={(e) => setTestMode(e.target.checked)}
            className={styles.toggleCheckbox}
            disabled={disabled}
          />
          <span className={styles.toggleText}>
            {testMode ? '🧪 Test Mode: ON' : '🧪 Test Mode: OFF'}
          </span>
        </label>
        <p className={styles.toggleHint}>
          {testMode
            ? 'Click a template to auto-generate realistic example text'
            : 'Toggle on to auto-generate example text when selecting templates'}
        </p>
      </div> */}

      <div className={styles.fieldsContainer}>
        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="pattern">
            Regex Pattern
          </label>
          <RegexPatternInput
            value={config.pattern || ''}
            onChange={(newValue) => handleFieldChange('pattern', newValue)}
            flags={config.flags || 'g'}
            onFlagsChange={(newFlags) => handleFieldChange('flags', newFlags)}
            warnings={warnings}
            placeholder="/pattern/flags"
            disabled={disabled}
            selectedTemplate={selectedTemplate}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel} htmlFor="replacement">
            Replacement (optional)
          </label>
          <input
            id="replacement"
            type="text"
            className={styles.input}
            value={config.replacement || ''}
            onChange={(e) => handleFieldChange('replacement', e.target.value)}
            placeholder="Leave empty to find only"
            disabled={disabled}
          />
        </div>
      </div>

      {/*
        PATTERN TEMPLATE SELECTOR - DISABLED FOR NOW
        Purpose: Displays a categorized list of pre-built regex pattern templates (Email, URL, Phone, Order Numbers, etc.)
        Functionality:
          - Users can search, browse, and select templates to auto-fill the regex pattern field
          - Shows template name, description, and category
          - Calls handleTemplateSelect when a template is clicked
          - If testMode is enabled, also auto-generates example text for the selected template
        How to re-enable: Uncomment this component and ensure PatternTemplateSelector import at top is active
        Status: Keeping functional code intact (handleTemplateSelect still works) but hiding UI
      */}
      {/* <PatternTemplateSelector
        onSelectTemplate={handleTemplateSelect}
        selectedTemplateId={selectedTemplateId}
      /> */}
    </div>
  )
}
