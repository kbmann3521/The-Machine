import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'
import RegexPatternInput from './RegexPatternInput'
import PatternTemplateSelector from './PatternTemplateSelector'
import { getPatternTemplate } from '../lib/regexPatterns'

export default function RegexToolkit({ config, onConfigChange, result, disabled }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)

  const handleFieldChange = (fieldId, value) => {
    const newConfig = { ...config, [fieldId]: value }
    onConfigChange(newConfig)
  }

  const handleTemplateSelect = (template) => {
    setSelectedTemplateId(template.id)
    const newConfig = {
      ...config,
      pattern: template.pattern,
      flags: template.flags,
    }
    onConfigChange(newConfig)
  }

  const warnings = result?.warnings || []
  const selectedTemplate = selectedTemplateId ? getPatternTemplate(selectedTemplateId) : null

  return (
    <div className={styles.regexToolkitContainer}>
      <PatternTemplateSelector
        onSelectTemplate={handleTemplateSelect}
        selectedTemplateId={selectedTemplateId}
      />

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
    </div>
  )
}
