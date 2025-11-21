import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'

export default function ToolConfigPanel({ tool, onConfigChange, loading, onRegenerate, currentConfig = {}, activeToolkitSection, onToolkitSectionChange, findReplaceConfig, onFindReplaceConfigChange }) {
  const [config, setConfig] = useState({})

  useEffect(() => {
    if (tool?.configSchema) {
      const initialConfig = {}
      tool.configSchema.forEach(field => {
        initialConfig[field.id] = field.default || ''
      })
      setConfig(initialConfig)
      onConfigChange(initialConfig)
    }
  }, [tool, onConfigChange])

  useEffect(() => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...currentConfig,
    }))
  }, [currentConfig])

  if (!tool) {
    return (
      <div className={styles.container}>
        <p className={styles.placeholder}>Select a tool to configure</p>
      </div>
    )
  }

  const handleFieldChange = (fieldId, value) => {
    const newConfig = { ...config, [fieldId]: value }
    setConfig(newConfig)
    onConfigChange(newConfig)
  }

  const noInputRequiredTools = [
    'random-string-generator',
    'variable-name-generator',
    'function-name-generator',
    'api-endpoint-generator',
    'lorem-ipsum-generator',
  ]

  const isGeneratorTool = tool && noInputRequiredTools.includes(tool.toolId)

  const renderField = field => {
    const value = config[field.id]

    switch (field.type) {
      case 'text':
        return (
          <input
            key={field.id}
            type="text"
            className={styles.input}
            value={value || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
          />
        )

      case 'number':
        return (
          <input
            key={field.id}
            type="number"
            className={styles.input}
            value={value || ''}
            onChange={e => handleFieldChange(field.id, parseInt(e.target.value) || e.target.value)}
            placeholder={field.placeholder || ''}
          />
        )

      case 'textarea':
        return (
          <textarea
            key={field.id}
            className={styles.textarea}
            value={value || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            rows={4}
          />
        )

      case 'select':
        return (
          <select
            key={field.id}
            className={styles.select}
            value={value || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
          >
            <option value="">Select an option</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'toggle':
        return (
          <div key={field.id} className={styles.toggleContainer}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={value || false}
                onChange={e => handleFieldChange(field.id, e.target.checked)}
                className={styles.toggleInput}
              />
              <span className={styles.toggleSlider}></span>
              <span>{field.label}</span>
            </label>
          </div>
        )

      case 'slider':
        return (
          <div key={field.id} className={styles.sliderContainer}>
            <input
              type="range"
              className={styles.slider}
              min={field.min || 0}
              max={field.max || 100}
              value={value || 0}
              onChange={e => handleFieldChange(field.id, parseInt(e.target.value))}
            />
            <span className={styles.sliderValue}>{value || 0}</span>
          </div>
        )

      default:
        return null
    }
  }

  const toolkitSections = [
    { id: 'wordCounter', label: 'Word Counter' },
    { id: 'caseConverter', label: 'Case Converter' },
    { id: 'textAnalyzer', label: 'Text Analyzer' },
    { id: 'slugGenerator', label: 'Slug Generator' },
    { id: 'reverseText', label: 'Reverse Text' },
    { id: 'removeExtras', label: 'Clean Text' },
    { id: 'whitespaceVisualizer', label: 'Whitespace' },
    { id: 'sortLines', label: 'Sort Lines' },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{tool.name}</h3>
        <p className={styles.description}>{tool.description}</p>
      </div>

      {tool.toolId === 'text-toolkit' && (
        <div className={styles.toolkitFilters}>
          <div className={styles.filterLabel}>Filter Results:</div>
          <div className={styles.filterButtonsGrid}>
            {toolkitSections.map(section => (
              <button
                key={section.id}
                className={`${styles.filterButton} ${activeToolkitSection === section.id ? styles.filterButtonActive : ''}`}
                onClick={() => onToolkitSectionChange(section.id)}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tool.configSchema && tool.configSchema.length > 0 && (
        <div className={styles.fieldsContainer}>
          {tool.configSchema.map(field => (
            <div key={field.id} className={styles.field}>
              <label className={styles.fieldLabel} htmlFor={field.id}>
                {field.label}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>
      )}

      {isGeneratorTool && (
        <button
          className={styles.regenerateButton}
          onClick={onRegenerate}
          disabled={loading}
          title="Generate new output with current settings"
        >
          {loading ? 'Generating...' : '🔄 Regenerate'}
        </button>
      )}
    </div>
  )
}
