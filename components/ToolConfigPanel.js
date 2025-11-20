import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'

export default function ToolConfigPanel({ tool, onConfigChange, loading }) {
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

  const handleRun = () => {
    onRun(tool, config)
  }

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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{tool.name}</h3>
        <p className={styles.description}>{tool.description}</p>
      </div>

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

      <button
        className={styles.runButton}
        onClick={handleRun}
        disabled={loading}
      >
        {loading ? 'Running...' : 'Run Tool'}
      </button>
    </div>
  )
}
