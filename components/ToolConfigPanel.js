import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'

export default function ToolConfigPanel({ tool, onConfigChange, loading, onRegenerate, currentConfig = {}, activeToolkitSection, onToolkitSectionChange, findReplaceConfig, onFindReplaceConfigChange, diffConfig, onDiffConfigChange, sortLinesConfig, onSortLinesConfigChange, removeExtrasConfig, onRemoveExtrasConfigChange }) {
  const [config, setConfig] = useState({})

  useEffect(() => {
    if (tool?.configSchema) {
      const initialConfig = {}
      tool.configSchema.forEach(field => {
        initialConfig[field.id] = field.default || ''
      })
      // Merge with currentConfig (which includes suggestedConfig from API)
      const mergedConfig = { ...initialConfig, ...currentConfig }
      setConfig(mergedConfig)
    }
  }, [tool, currentConfig])

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
    { id: 'wordFrequency', label: 'Word Frequency' },
    { id: 'caseConverter', label: 'Case Converter' },
    { id: 'textAnalyzer', label: 'Text Analyzer' },
    { id: 'slugGenerator', label: 'Slug Generator' },
    { id: 'reverseText', label: 'Reverse Text' },
    { id: 'removeExtras', label: 'Clean Text' },
    { id: 'whitespaceVisualizer', label: 'Whitespace' },
    { id: 'sortLines', label: 'Sort Lines' },
    { id: 'findReplace', label: 'Find & Replace' },
    { id: 'textDiff', label: 'Diff Checker' },
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

          {activeToolkitSection === 'findReplace' && (
            <div className={styles.findReplaceFields}>
              <div className={styles.findReplaceInputs}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="findText">
                    Find
                  </label>
                  <input
                    id="findText"
                    type="text"
                    className={styles.input}
                    placeholder="Enter text or pattern to search for"
                    value={findReplaceConfig?.findText || ''}
                    onChange={(e) => onFindReplaceConfigChange({ ...findReplaceConfig, findText: e.target.value })}
                  />
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="replaceText">
                    Replace
                  </label>
                  <input
                    id="replaceText"
                    type="text"
                    className={styles.input}
                    placeholder="Enter replacement text"
                    value={findReplaceConfig?.replaceText || ''}
                    onChange={(e) => onFindReplaceConfigChange({ ...findReplaceConfig, replaceText: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.findReplaceToggles}>
                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={findReplaceConfig?.useRegex || false}
                    onChange={(e) => onFindReplaceConfigChange({ ...findReplaceConfig, useRegex: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Regex</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={findReplaceConfig?.matchCase || false}
                    onChange={(e) => onFindReplaceConfigChange({ ...findReplaceConfig, matchCase: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Match Case</span>
                </label>
              </div>
            </div>
          )}

          {activeToolkitSection === 'sortLines' && (
            <div className={styles.findReplaceFields}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="sortOrder">
                  Sort Order
                </label>
                <select
                  id="sortOrder"
                  className={styles.input}
                  value={sortLinesConfig?.order || 'asc'}
                  onChange={(e) => onSortLinesConfigChange({ ...sortLinesConfig, order: e.target.value })}
                >
                  <option value="asc">Ascending (A-Z)</option>
                  <option value="desc">Descending (Z-A)</option>
                  <option value="length-asc">By Length (Short to Long)</option>
                  <option value="length-desc">By Length (Long to Short)</option>
                  <option value="numeric">Numeric (0-9)</option>
                  <option value="reverse">Reverse Order</option>
                </select>
              </div>

              <div className={styles.findReplaceToggles}>
                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={sortLinesConfig?.caseSensitive || false}
                    onChange={(e) => onSortLinesConfigChange({ ...sortLinesConfig, caseSensitive: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Case-Sensitive</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={sortLinesConfig?.removeDuplicates || false}
                    onChange={(e) => onSortLinesConfigChange({ ...sortLinesConfig, removeDuplicates: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Remove Duplicates</span>
                </label>
              </div>
            </div>
          )}

          {activeToolkitSection === 'removeExtras' && (
            <div className={styles.findReplaceFields}>
              <div className={styles.findReplaceToggles}>
                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.removePdfGarbage !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, removePdfGarbage: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Remove PDF Garbage</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.removeInvisibleChars !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, removeInvisibleChars: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Remove Invisible Chars</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.stripHtml !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, stripHtml: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Strip HTML</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.stripMarkdown !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, stripMarkdown: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Strip Markdown</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.normalizeWhitespace !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, normalizeWhitespace: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Normalize Whitespace</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.fixPunctuationSpacing !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, fixPunctuationSpacing: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Fix Punctuation Spacing</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.compressSpaces !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, compressSpaces: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Compress Spaces</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.trimLines !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, trimLines: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Trim Lines</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.removeLineBreaks !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, removeLineBreaks: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Remove Line Breaks</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.removeBlankLines !== false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, removeBlankLines: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Remove Blank Lines</span>
                </label>

                <label className={styles.inlineToggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={removeExtrasConfig?.removeDuplicateLines || false}
                    onChange={(e) => onRemoveExtrasConfigChange({ ...removeExtrasConfig, removeDuplicateLines: e.target.checked })}
                  />
                  <span className={styles.toggleSlider}></span>
                  <span>Remove Duplicates</span>
                </label>
              </div>
            </div>
          )}

          {activeToolkitSection === 'textDiff' && (
            <div className={styles.findReplaceFields}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="text2">
                  Compare With
                </label>
                <textarea
                  id="text2"
                  className={styles.textarea}
                  placeholder="Paste the second version to compare with the first"
                  value={diffConfig?.text2 || ''}
                  onChange={(e) => onDiffConfigChange({ ...diffConfig, text2: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tool.configSchema && tool.configSchema.length > 0 && tool.toolId !== 'text-toolkit' && (
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
