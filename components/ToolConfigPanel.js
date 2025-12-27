import React, { useState, useEffect } from 'react'
import styles from '../styles/tool-config.module.css'
import { getSuggestionsForColor } from '../lib/tools/colorConverter'
import RegexToolkit from './RegexToolkit'
import Phase2Controls from './SVGOptimizer/Phase2Controls'

export default function ToolConfigPanel({ tool, onConfigChange, loading, onRegenerate, currentConfig = {}, result, activeToolkitSection, onToolkitSectionChange, findReplaceConfig, onFindReplaceConfigChange, diffConfig, onDiffConfigChange, sortLinesConfig, onSortLinesConfigChange, removeExtrasConfig, onRemoveExtrasConfigChange, onSetGeneratedText }) {
  const [config, setConfig] = useState({})
  const [colorSuggestions, setColorSuggestions] = useState({})
  const [activeSuggestionsField, setActiveSuggestionsField] = useState(null)

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
  }, [tool?.toolId, currentConfig])

  if (!tool) {
    return (
      <div className={styles.container}>
        <p className={styles.placeholder}></p>
      </div>
    )
  }

  const handleFieldChange = (fieldId, value, skipAspectRatioSync = false) => {
    const newConfig = { ...config, [fieldId]: value }

    // For image-toolkit with aspect ratio locking, calculate the other dimension immediately
    // This prevents the glitchy two-step update that was happening in useEffect
    // BUT: Skip this for number inputs (they should be independent)
    // Only sync when user moves the SLIDER
    if (!skipAspectRatioSync && tool.toolId === 'image-toolkit' && newConfig.lockAspectRatio && config.aspectRatio) {
      if (fieldId === 'width' && value !== config.width) {
        // Width changed, calculate new height
        newConfig.height = Math.round(value / config.aspectRatio)
      } else if (fieldId === 'height' && value !== config.height) {
        // Height changed, calculate new width
        newConfig.width = Math.round(value * config.aspectRatio)
      }
    }

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
    const isJsFormatterInMinify = tool.toolId === 'js-formatter' && config.mode === 'minify'
    const isCssFormatterInMinify = tool.toolId === 'css-formatter' && config.mode === 'minify'
    const isBaseConverterAutoDetect = tool.toolId === 'base-converter' && config.autoDetect
    const isChecksumAutoDetect = tool.toolId === 'checksum-calculator' && config.autoDetect

    const jsFormatterDisabledFields = [
      'useSemicolons',
      'singleQuotes',
      'bracketSpacing',
      'indentSize',
      'trailingComma',
      'printWidth',
      'arrowParens',
      'showLinting',
    ]

    const cssFormatterDisabledFields = [
      'indentSize',
      'showLinting',
    ]

    const baseConverterDisabledFields = ['fromBase']

    const checksumDisabledFields = ['inputMode']

    const isFieldDisabled =
      (isJsFormatterInMinify && jsFormatterDisabledFields.includes(field.id)) ||
      (isCssFormatterInMinify && cssFormatterDisabledFields.includes(field.id)) ||
      (isBaseConverterAutoDetect && baseConverterDisabledFields.includes(field.id)) ||
      (isChecksumAutoDetect && checksumDisabledFields.includes(field.id))

    switch (field.type) {
      case 'text':
        // Special handling for color inputs with autocomplete
        if (field.id === 'secondColor' || field.id === 'gradientEndColor') {
          const isActive = activeSuggestionsField === field.id
          const fieldSuggestions = colorSuggestions[field.id] || []

          return (
            <div key={field.id} style={{ position: 'relative' }} onMouseLeave={() => setActiveSuggestionsField(null)}>
              <input
                type="text"
                className={styles.input}
                value={value || ''}
                onChange={(e) => {
                  handleFieldChange(field.id, e.target.value)
                  if (e.target.value.length > 0) {
                    const suggestions = getSuggestionsForColor(e.target.value)
                    setColorSuggestions(prev => ({ ...prev, [field.id]: suggestions }))
                    setActiveSuggestionsField(field.id)
                  } else {
                    setActiveSuggestionsField(null)
                  }
                }}
                onFocus={(e) => {
                  if (e.target.value.length > 0) {
                    const suggestions = getSuggestionsForColor(e.target.value)
                    if (suggestions.length > 0) {
                      setColorSuggestions(prev => ({ ...prev, [field.id]: suggestions }))
                      setActiveSuggestionsField(field.id)
                    }
                  }
                }}
                onBlur={() => setActiveSuggestionsField(null)}
                placeholder={field.placeholder || ''}
                disabled={isFieldDisabled}
              />
              {isActive && fieldSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'var(--color-background-secondary)',
                  border: '1px solid var(--color-border)',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  zIndex: 10,
                  maxHeight: '150px',
                  overflowY: 'auto',
                }}>
                  {fieldSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.name}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleFieldChange(field.id, suggestion.name)
                        setActiveSuggestionsField(null)
                      }}
                      style={{
                        padding: '8px 10px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-background-tertiary)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: suggestion.hex,
                        border: '1px solid var(--color-border)',
                        borderRadius: '3px',
                      }} />
                      <span>{suggestion.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>
                        {suggestion.hex}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        }

        return (
          <input
            key={field.id}
            type="text"
            className={styles.input}
            value={value || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder || ''}
            disabled={isFieldDisabled}
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
            disabled={isFieldDisabled}
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
            disabled={isFieldDisabled}
          />
        )

      case 'select':
        return (
          <select
            key={field.id}
            className={styles.select}
            value={value || field.default || ''}
            onChange={e => handleFieldChange(field.id, e.target.value)}
            disabled={isFieldDisabled}
          >
            {!field.hideEmptyOption && <option value="">Select an option</option>}
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
                disabled={isFieldDisabled}
              />
              <span className={styles.toggleSlider}></span>
              <span>{field.label}</span>
            </label>
          </div>
        )

      case 'checkbox':
        return (
          <label key={field.id} className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => handleFieldChange(field.id, e.target.checked)}
              disabled={isFieldDisabled}
            />
            <span>{field.label}</span>
          </label>
        )

      case 'slider': {
        // Determine unit label based on field ID
        const getUnit = () => {
          if (field.id === 'quality') return '%'
          if (field.id === 'scalePercent') return '%'
          if (field.id === 'width' || field.id === 'height') return 'px'
          return ''
        }

        const unit = getUnit()
        const numValue = parseInt(value) || 0
        const minVal = field.min || 0
        const maxVal = field.max || 100

        // For image-toolkit, check if this is Scale or Width/Height
        const isScaleField = field.id === 'scalePercent'
        const isDimensionField = field.id === 'width' || field.id === 'height'
        const isImageToolkit = tool.toolId === 'image-toolkit'

        // Determine if field should be disabled based on Scale mode
        let isDisabledByScale = false
        if (isImageToolkit && isDimensionField && config.scalePercent !== 100) {
          // If scale is not 100%, width/height are controlled by scale
          isDisabledByScale = true
        }

        const finalDisabled = isFieldDisabled || isDisabledByScale

        return (
          <div key={field.id} className={styles.sliderContainer}>
            <div className={styles.sliderInputWrapper}>
              <input
                type="range"
                className={`${styles.slider} ${finalDisabled ? styles.sliderDisabled : ''}`}
                min={minVal}
                max={maxVal}
                value={numValue}
                onChange={e => handleFieldChange(field.id, parseInt(e.target.value))}
                disabled={finalDisabled}
              />
              <div className={styles.sliderInputGroup}>
                <input
                  type="number"
                  className={styles.sliderInput}
                  min={minVal}
                  max={maxVal}
                  value={numValue}
                  onChange={e => {
                    const inputValue = e.target.value

                    // Allow empty string for UX (backspace, etc) - just update local display
                    if (inputValue === '') {
                      setConfig({ ...config, [field.id]: '' })
                      return
                    }

                    const val = parseInt(inputValue, 10)

                    // If still typing (incomplete number like "12"), allow it
                    if (isNaN(val)) {
                      return
                    }

                    // Only call handleFieldChange (which triggers onConfigChange)
                    // when we have a valid number
                    // Clamp to min/max range
                    const clampedVal = Math.max(minVal, Math.min(maxVal, val))
                    // Skip aspect ratio sync for number inputs - user is typing manually
                    handleFieldChange(field.id, clampedVal, true)
                  }}
                  onBlur={e => {
                    const finalValue = e.target.value.trim()

                    // On blur, if empty, reset to current valid value
                    if (finalValue === '') {
                      // Skip aspect ratio sync when resetting empty field
                      handleFieldChange(field.id, numValue, true)
                      return
                    }

                    const val = parseInt(finalValue, 10)
                    if (isNaN(val)) {
                      // Invalid input, reset to current value
                      // Skip aspect ratio sync when fixing invalid input
                      handleFieldChange(field.id, numValue, true)
                    }
                  }}
                  disabled={finalDisabled}
                />
                {unit && <span className={styles.sliderUnit}>{unit}</span>}
              </div>
            </div>
            {isImageToolkit && isDimensionField && config.scalePercent !== 100 && (
              <div className={styles.sliderHint}>
                Scale mode active ({config.scalePercent}%). Adjust scale slider to change dimensions.
              </div>
            )}
          </div>
        )
      }

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
                    placeholder=""
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
                    placeholder=""
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
                  placeholder=""
                  value={diffConfig?.text2 || ''}
                  onChange={(e) => onDiffConfigChange({ ...diffConfig, text2: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tool.toolId === 'svg-optimizer' && (
        <Phase2Controls
          onConfigChange={onConfigChange}
          safetyFlags={result?.safetyFlags}
        />
      )}

      {tool.configSchema && tool.configSchema.length > 0 && tool.toolId !== 'text-toolkit' && (
        <div>
          {tool.toolId === 'regex-tester' && (
            <RegexToolkit
              config={config}
              onConfigChange={onConfigChange}
              result={result}
              disabled={false}
              onGenerateText={onSetGeneratedText}
            />
          )}

          {(() => {
            // Group fields by row number (if specified)
            const rows = {}
            const fieldsWithoutRow = []

            tool.configSchema.forEach(field => {
              // Check visibility
              if (field.visibleWhen) {
                const { field: conditionField, value: conditionValue } = field.visibleWhen
                if (config[conditionField] !== conditionValue) {
                  return
                }
              }

              if (field.row !== undefined) {
                if (!rows[field.row]) rows[field.row] = []
                rows[field.row].push(field)
              } else {
                fieldsWithoutRow.push(field)
              }
            })

            // If there are fields with row numbers, render them grouped by row
            if (Object.keys(rows).length > 0) {
              return (
                <>
                  {Object.keys(rows).sort((a, b) => a - b).map(rowNum => (
                    <div key={`row-${rowNum}`} className={styles.fieldsContainer}>
                      {rows[rowNum].map(field => {
                        if (tool.toolId === 'regex-tester' && ['pattern', 'flags', 'replacement'].includes(field.id)) {
                          return null;
                        }
                        return (
                          <div key={field.id} className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor={field.id}>
                              {field.label}
                            </label>
                            {renderField(field)}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  {fieldsWithoutRow.length > 0 && (
                    <div className={styles.fieldsContainer}>
                      {fieldsWithoutRow.map(field => {
                        if (tool.toolId === 'regex-tester' && ['pattern', 'flags', 'replacement'].includes(field.id)) {
                          return null;
                        }
                        return (
                          <div key={field.id} className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor={field.id}>
                              {field.label}
                            </label>
                            {renderField(field)}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )
            }

            // Fallback: render all fields in a single grid (original behavior)
            return (
              <div className={styles.fieldsContainer}>
                {tool.configSchema.map(field => {
                  // Skip fields handled by RegexToolkit for regex-tester
                  if (tool.toolId === 'regex-tester' && ['pattern', 'flags', 'replacement'].includes(field.id)) {
                    return null;
                  }

                  // Check visibility
                  if (field.visibleWhen) {
                    const { field: conditionField, value: conditionValue } = field.visibleWhen
                    if (config[conditionField] !== conditionValue) {
                      return null
                    }
                  }

                  return (
                    <div key={field.id} className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor={field.id}>
                        {field.label}
                      </label>
                      {renderField(field)}
                    </div>
                  )
                })}
              </div>
            )
          })()}
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
