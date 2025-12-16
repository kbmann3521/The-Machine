import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'
import RegexPatternInput from './RegexPatternInput'
import PatternTemplateSelector from './PatternTemplateSelector'
import { getPatternTemplate } from '../lib/regexPatterns'

export default function RegexToolkit({ config, onConfigChange, result, disabled, onGenerateText }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

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

    // Auto-generate example text
    setIsGenerating(true)
    try {
      const response = await fetch('/api/test-regex-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          patternDescription: template.description,
        }),
      })

      if (response.ok) {
        const { text } = await response.json()
        if (onGenerateText) {
          onGenerateText(text)
        }
      }
    } catch (error) {
      console.error('Error generating example text:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const warnings = result?.warnings || []
  const selectedTemplate = selectedTemplateId ? getPatternTemplate(selectedTemplateId) : null

  return (
    <div className={styles.regexToolkitContainer}>
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

      <PatternTemplateSelector
        onSelectTemplate={handleTemplateSelect}
        selectedTemplateId={selectedTemplateId}
      />
    </div>
  )
}
