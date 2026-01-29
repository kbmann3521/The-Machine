import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import styles from '../styles/tool-config.module.css'
import { getSuggestionsForColor } from '../lib/tools/colorConverter'
import Phase2Controls from './SVGOptimizer/Phase2Controls'

// Lazy-load RegexToolkit - only needed when configuring regex patterns
const RegexToolkit = dynamic(() => import('./RegexToolkit'), { ssr: false })

export default function ToolConfigPanel({ tool, onConfigChange, loading, onRegenerate, currentConfig = {}, result, contentClassification, activeToolkitSection, onToolkitSectionChange, findReplaceConfig, onFindReplaceConfigChange, diffConfig, onDiffConfigChange, sortLinesConfig, onSortLinesConfigChange, removeExtrasConfig, onRemoveExtrasConfigChange, delimiterTransformerConfig, onDelimiterTransformerConfigChange, onSetGeneratedText, showAnalysisTab, onShowAnalysisTabChange, showRulesTab, onShowRulesTabChange, markdownInputMode = 'input', cssConfigOptions = {}, onCssConfigChange = null }) {
  const [config, setConfig] = useState({})
  const [colorSuggestions, setColorSuggestions] = useState({})
  const [activeSuggestionsField, setActiveSuggestionsField] = useState(null)
  const [localDelimiter, setLocalDelimiter] = useState(delimiterTransformerConfig?.delimiter ?? ' ')
  const [localJoinSeparator, setLocalJoinSeparator] = useState(delimiterTransformerConfig?.joinSeparator ?? ' ')

  useEffect(() => {
    if (!tool?.configSchema) return

    const initialConfig = {}

    // Use the base schema (HTML/MD options for markdown formatter)
    const effectiveSchema = tool.configSchema

    // Initialize with all defaults from effective schema
    effectiveSchema.forEach(field => {
      initialConfig[field.id] = field.default !== undefined ? field.default : ''
    })

    // Build the final config by merging with currentConfig
    let mergedConfig = { ...initialConfig }

    if (currentConfig && typeof currentConfig === 'object') {
      Object.entries(currentConfig).forEach(([key, value]) => {
        // Allow empty strings for pattern field (regex tester needs to support empty patterns)
        if (value !== undefined && value !== null) {
          if (value !== '' || key === 'pattern') {
            mergedConfig[key] = value
          }
        }
      })
    }

    setConfig(mergedConfig)
  }, [tool?.toolId, currentConfig, tool?.configSchema])

  useEffect(() => {
    if (tool?.toolId !== 'web-playground') {
      return
    }

    const mode = contentClassification?.mode || 'markdown'
    const allowedValues = new Set(['none'])
    if (mode === 'markdown') {
      allowedValues.add('html')
    }
    if (mode === 'html') {
      allowedValues.add('markdown')
    }

    setConfig(prevConfig => {
      if (!prevConfig || prevConfig.convertTo === undefined || allowedValues.has(prevConfig.convertTo)) {
        return prevConfig
      }
      const updatedConfig = { ...prevConfig, convertTo: 'none' }
      onConfigChange(updatedConfig)
      return updatedConfig
    })
  }, [contentClassification?.mode, onConfigChange, tool?.toolId])

  // Sync local delimiter state when parent config changes
  useEffect(() => {
    setLocalDelimiter(delimiterTransformerConfig?.delimiter ?? ' ')
  }, [delimiterTransformerConfig?.delimiter])

  // Sync local join separator state when parent config changes
  useEffect(() => {
    setLocalJoinSeparator(delimiterTransformerConfig?.joinSeparator ?? ' ')
  }, [delimiterTransformerConfig?.joinSeparator])

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
  const classificationMode = contentClassification?.mode || 'markdown'

  // Helper function to render CSS schema fields for markdown formatter
  const renderCssField = field => {
    const value = cssConfigOptions[field.id]
    const isMinify = cssConfigOptions.mode === 'minify'

    const cssFormatterDisabledFields = [
      'indentSize',
      'showLinting',
    ]

    const isFieldDisabled = isMinify && cssFormatterDisabledFields.includes(field.id)

    switch (field.type) {
      case 'text':
        return (
          <input
            key={field.id}
            type="text"
            className={styles.input}
            value={value || ''}
            onChange={e => onCssConfigChange?.({ ...cssConfigOptions, [field.id]: e.target.value })}
            placeholder={field.placeholder || ''}
            disabled={isFieldDisabled}
          />
        )

      case 'select':
        return (
          <select
            key={field.id}
            className={styles.select}
            value={value || field.default || ''}
            onChange={e => onCssConfigChange?.({ ...cssConfigOptions, [field.id]: e.target.value })}
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
          <div key={field.id} className={styles.toggleContainer} title={field.tooltip}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={value || false}
                onChange={e => onCssConfigChange?.({ ...cssConfigOptions, [field.id]: e.target.checked })}
                className={styles.toggleInput}
                disabled={isFieldDisabled}
              />
              <span className={styles.toggleSlider}></span>
              <span>{field.label}</span>
            </label>
            {field.tooltip && <span className={styles.tooltipIcon} title={field.tooltip}>ℹ️</span>}
          </div>
        )

      default:
        return null
    }
  }

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

    if (tool.toolId === 'web-playground' && field.id === 'convertTo') {
      const convertOptions = [{ value: 'none', label: 'None' }]
      if (classificationMode === 'markdown') {
        convertOptions.push({ value: 'html', label: 'HTML' })
      }
      if (classificationMode === 'html') {
        convertOptions.push({ value: 'markdown', label: 'Markdown' })
      }

      if (convertOptions.length <= 1) {
        return null
      }

      const normalizedValue = convertOptions.some(option => option.value === value) ? value : 'none'

      return (
        <select
          key={field.id}
          className={styles.select}
          value={normalizedValue}
          onChange={e => handleFieldChange(field.id, e.target.value)}
          disabled={isFieldDisabled}
        >
          {convertOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

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
          <div key={field.id} className={styles.toggleContainer} title={field.tooltip}>
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
            {field.tooltip && <span className={styles.tooltipIcon} title={field.tooltip}>ℹ️</span>}
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
        const minVal = field.min || 0
        const maxVal = field.max || 100

        // For display: if value is empty string, show empty; otherwise parse and show number
        // This allows the input to visually show empty when user clears it
        const displayValue = value === '' ? '' : (parseInt(value) || 0)
        // For slider: if value is empty, use the previous value from currentConfig so slider doesn't snap to 0
        const currentNumValue = parseInt(currentConfig[field.id]) || minVal
        const numValue = value === '' ? currentNumValue : (parseInt(value) || 0)

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
                  value={displayValue}
                  onChange={e => {
                    const inputValue = e.target.value

                    // Empty input - show empty visually, but don't update parent yet
                    if (inputValue === '') {
                      setConfig({ ...config, [field.id]: '' })
                      return
                    }

                    const val = parseInt(inputValue, 10)

                    // If still typing (incomplete number), return
                    if (isNaN(val)) {
                      return
                    }

                    // Valid number - update immediately WITHOUT clamping
                    // Allow any value to be entered, even if outside min/max range
                    // Aspect ratio sync should apply even during typing
                    handleFieldChange(field.id, val, false)  // false = DO apply aspect ratio sync
                  }}
                  onBlur={e => {
                    const finalValue = e.target.value.trim()

                    // On blur, if empty, revert to last valid value
                    if (finalValue === '') {
                      const currentValue = currentConfig[field.id]
                      const fallbackValue = currentValue !== undefined && currentValue !== null ? parseInt(currentValue) : minVal
                      handleFieldChange(field.id, fallbackValue, true)  // true = skip aspect ratio sync on blur
                      return
                    }

                    // Validate and clamp if it's a valid number
                    const val = parseInt(finalValue, 10)
                    if (!isNaN(val)) {
                      const clampedVal = Math.max(minVal, Math.min(maxVal, val))
                      handleFieldChange(field.id, clampedVal, true)  // true = skip aspect ratio sync on blur
                    } else {
                      // Invalid input - revert to current value
                      const currentValue = currentConfig[field.id]
                      const fallbackValue = currentValue !== undefined && currentValue !== null ? parseInt(currentValue) : minVal
                      handleFieldChange(field.id, fallbackValue, true)
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

  const analyticalSections = [
    { id: 'textAnalyzer', label: 'Text Analyzer' },
    { id: 'textDiff', label: 'Diff Checker' },
  ]

  const transformativeSections = [
    { id: 'caseConverter', label: 'Case Converter' },
    { id: 'slugGenerator', label: 'Slug Generator' },
    { id: 'reverseText', label: 'Reverse Text' },
    { id: 'removeExtras', label: 'Clean Text' },
    { id: 'sortLines', label: 'Sort Lines' },
    { id: 'findReplace', label: 'Find & Replace' },
    { id: 'delimiterTransformer', label: 'Delimiter Transformer' },
  ]

  return (
    <div className={styles.container}>
      {tool.toolId === 'text-toolkit' && (
        <div className={styles.toolkitFilters}>
          <div className={styles.filterSectionGroup}>
            <div className={styles.filterGroupLabel}>Analytical</div>
            <div className={styles.filterButtonsGrid}>
              {analyticalSections.map(section => (
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

          <div className={styles.filterSectionGroup}>
            <div className={styles.filterGroupLabel}>Transformative</div>
            <div className={styles.filterButtonsGrid}>
              {transformativeSections.map(section => (
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

          {activeToolkitSection === 'delimiterTransformer' && (
            <div className={styles.findReplaceFields}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="splitDelimiter">
                  Split By (character)
                </label>
                <input
                  id="splitDelimiter"
                  type="text"
                  className={styles.input}
                  placeholder="e.g., comma, semicolon, or space"
                  value={localDelimiter}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setLocalDelimiter(newValue)
                    onDelimiterTransformerConfigChange({
                      ...delimiterTransformerConfig,
                      delimiter: newValue
                    })
                  }}
                  maxLength="5"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Output Format
                </label>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="delimiterOutputMode"
                      value="rows"
                      checked={delimiterTransformerConfig?.mode === 'rows' || !delimiterTransformerConfig?.mode}
                      onChange={(e) => {
                        const newConfig = {
                          ...delimiterTransformerConfig,
                          mode: e.target.value
                        }
                        onDelimiterTransformerConfigChange(newConfig)
                      }}
                    />
                    <span>Rows (one per line)</span>
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="delimiterOutputMode"
                      value="singleLine"
                      checked={delimiterTransformerConfig?.mode === 'singleLine'}
                      onChange={(e) => {
                        const newConfig = {
                          ...delimiterTransformerConfig,
                          mode: e.target.value
                        }
                        onDelimiterTransformerConfigChange(newConfig)
                      }}
                    />
                    <span>Single Line (rejoin with separator)</span>
                  </label>
                </div>
              </div>
              {delimiterTransformerConfig?.mode === 'singleLine' && (
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="joinSeparator">
                    Join With (separator)
                  </label>
                  <input
                    id="joinSeparator"
                    type="text"
                    className={styles.input}
                    placeholder="e.g., space, comma, dash"
                    value={localJoinSeparator}
                    onChange={(e) => {
                      const newValue = e.target.value
                      setLocalJoinSeparator(newValue)
                      onDelimiterTransformerConfigChange({
                        ...delimiterTransformerConfig,
                        joinSeparator: newValue
                      })
                    }}
                    maxLength="5"
                    autoComplete="off"
                  />
                </div>
              )}
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

            // Always show the base schema for markdown formatter (HTML/MD options)
            const configSchema = tool.configSchema

            // Define CSS schema for web playground (Analysis/Rules toggles handled separately below)
            const cssSchema = tool.toolId === 'web-playground' ? [
              { id: 'mode', label: 'Mode', type: 'select', options: [{ value: 'beautify', label: 'Beautify' }, { value: 'minify', label: 'Minify' }], default: 'beautify' },
              { id: 'indentSize', label: 'Indent Size', type: 'select', options: [{ value: '2', label: '2 spaces' }, { value: '4', label: '4 spaces' }, { value: 'tab', label: 'Tab' }], default: '2', visibleWhen: { field: 'mode', value: 'beautify' } },
              { id: 'removeComments', label: 'Remove Comments', type: 'toggle', default: false },
              { id: 'addAutoprefix', label: 'Autoprefix (vendor prefixes)', type: 'toggle', default: false },
              { id: 'browsers', label: 'Browserslist Query', type: 'text', placeholder: 'e.g., last 2 versions, >1%, defaults', default: 'last 2 versions', visibleWhen: { field: 'addAutoprefix', value: true } },
              { id: 'showValidation', label: 'Show Validation', type: 'toggle', default: true },
              { id: 'showLinting', label: 'Show Linting', type: 'toggle', default: true },
            ] : []

            configSchema.forEach(field => {
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
                        const renderedField = renderField(field)
                        if (!renderedField) {
                          return null
                        }
                        return (
                          <div key={field.id} className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor={field.id}>
                              {field.label}
                            </label>
                            {renderedField}
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
                        const renderedField = renderField(field)
                        if (!renderedField) {
                          return null
                        }
                        return (
                          <div key={field.id} className={styles.field}>
                            <label className={styles.fieldLabel} htmlFor={field.id}>
                              {field.label}
                            </label>
                            {renderedField}
                          </div>
                        );
                      })}
                      {tool.toolId === 'css-formatter' && (
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}></label>
                          <div className={styles.toggleContainer}>
                            <label className={styles.toggleLabel}>
                              <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={showAnalysisTab || false}
                                onChange={(e) => onShowAnalysisTabChange && onShowAnalysisTabChange(e.target.checked)}
                              />
                              <span className={styles.toggleSlider}></span>
                              <span>Analysis</span>
                            </label>
                          </div>
                        </div>
                      )}
                      {tool.toolId === 'css-formatter' && (
                        <div className={styles.field}>
                          <label className={styles.fieldLabel}></label>
                          <div className={styles.toggleContainer}>
                            <label className={styles.toggleLabel}>
                              <input
                                type="checkbox"
                                className={styles.toggleInput}
                                checked={showRulesTab || false}
                                onChange={(e) => onShowRulesTabChange && onShowRulesTabChange(e.target.checked)}
                              />
                              <span className={styles.toggleSlider}></span>
                              <span>Rules</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {fieldsWithoutRow.length === 0 && tool.toolId === 'css-formatter' && (
                    <div className={styles.fieldsContainer}>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}></label>
                        <div className={styles.toggleContainer}>
                          <label className={styles.toggleLabel}>
                            <input
                              type="checkbox"
                              className={styles.toggleInput}
                              checked={showAnalysisTab || false}
                              onChange={(e) => onShowAnalysisTabChange && onShowAnalysisTabChange(e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span>Analysis</span>
                          </label>
                        </div>
                      </div>
                      <div className={styles.field}>
                        <label className={styles.fieldLabel}></label>
                        <div className={styles.toggleContainer}>
                          <label className={styles.toggleLabel}>
                            <input
                              type="checkbox"
                              className={styles.toggleInput}
                              checked={showRulesTab || false}
                              onChange={(e) => onShowRulesTabChange && onShowRulesTabChange(e.target.checked)}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span>Rules</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            }

            // Fallback: render all fields in a single grid (original behavior)
            // For markdown-html-formatter, render ONLY the options for the active tab mode
            if (tool.toolId === 'markdown-html-formatter' && cssSchema.length > 0) {
              // Only show HTML/Markdown options when INPUT tab is active
              if (markdownInputMode === 'input') {
                return (
                  <div className={styles.fieldsContainer}>
                    {configSchema.map(field => {
                      // Check visibility
                      if (field.visibleWhen) {
                        const { field: conditionField, value: conditionValue } = field.visibleWhen
                        if (config[conditionField] !== conditionValue) {
                          return null
                        }
                      }

                      const renderedField = renderField(field)
                      if (!renderedField) {
                        return null
                      }

                      return (
                        <div key={field.id} className={styles.field}>
                          <label className={styles.fieldLabel} htmlFor={field.id}>
                            {field.label}
                          </label>
                          {renderedField}
                        </div>
                      )
                    })}
                  </div>
                )
              }

              // Only show CSS options when CSS tab is active
              if (markdownInputMode === 'css') {
                return (
                  <div className={styles.fieldsContainer}>
                    {cssSchema.map(field => {
                      // Check visibility
                      if (field.visibleWhen) {
                        const { field: conditionField, value: conditionValue } = field.visibleWhen
                        if (cssConfigOptions[conditionField] !== conditionValue) {
                          return null
                        }
                      }

                      const renderedField = renderCssField(field)
                      if (!renderedField) {
                        return null
                      }

                      return (
                        <div key={`css-${field.id}`} className={styles.field}>
                          <label className={styles.fieldLabel} htmlFor={`css-${field.id}`}>
                            {field.label}
                          </label>
                          {renderedField}
                        </div>
                      )
                    })}
                    {/* Analysis/Rules toggles for CSS */}
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}></label>
                      <div className={styles.toggleContainer}>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            className={styles.toggleInput}
                            checked={cssConfigOptions?.showAnalysisTab || false}
                            onChange={(e) => onCssConfigChange?.({ ...cssConfigOptions, showAnalysisTab: e.target.checked })}
                          />
                          <span className={styles.toggleSlider}></span>
                          <span>Show Analysis Tab</span>
                        </label>
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label className={styles.fieldLabel}></label>
                      <div className={styles.toggleContainer}>
                        <label className={styles.toggleLabel}>
                          <input
                            type="checkbox"
                            className={styles.toggleInput}
                            checked={cssConfigOptions?.showRulesTab || false}
                            onChange={(e) => onCssConfigChange?.({ ...cssConfigOptions, showRulesTab: e.target.checked })}
                          />
                          <span className={styles.toggleSlider}></span>
                          <span>Show Rules Tab</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )
              }
            }

            return (
              <div className={styles.fieldsContainer}>
                {configSchema.map(field => {
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

                  const renderedField = renderField(field)
                  if (!renderedField) {
                    return null
                  }

                  return (
                    <div key={field.id} className={styles.field}>
                      <label className={styles.fieldLabel} htmlFor={field.id}>
                        {field.label}
                      </label>
                      {renderedField}
                    </div>
                  )
                })}
                {tool.toolId === 'css-formatter' && (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}></label>
                    <div className={styles.toggleContainer}>
                      <label className={styles.toggleLabel}>
                        <input
                          type="checkbox"
                          className={styles.toggleInput}
                          checked={showAnalysisTab || false}
                          onChange={(e) => onShowAnalysisTabChange && onShowAnalysisTabChange(e.target.checked)}
                        />
                        <span className={styles.toggleSlider}></span>
                        <span>Analysis</span>
                      </label>
                    </div>
                  </div>
                )}
                {tool.toolId === 'css-formatter' && (
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}></label>
                    <div className={styles.toggleContainer}>
                      <label className={styles.toggleLabel}>
                        <input
                          type="checkbox"
                          className={styles.toggleInput}
                          checked={showRulesTab || false}
                          onChange={(e) => onShowRulesTabChange && onShowRulesTabChange(e.target.checked)}
                        />
                        <span className={styles.toggleSlider}></span>
                        <span>Rules</span>
                      </label>
                    </div>
                  </div>
                )}
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
