import React, { useState, useEffect } from 'react'
import styles from '../styles/property-editor.module.css'

/**
 * Detect property type for the correct editor component
 */
export function getPropertyEditorType(property) {
  // Color properties
  if (['color', 'background-color', 'background', 'border-color', 'fill', 'stroke'].includes(property)) {
    return 'color'
  }

  // Numeric properties with units
  if ([
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'font-size', 'line-height', 'border-radius', 'width', 'height',
    'top', 'right', 'bottom', 'left',
  ].includes(property)) {
    return 'spacing'
  }

  // Numeric without units
  if (['opacity', 'font-weight', 'z-index'].includes(property)) {
    return 'numeric'
  }

  // Enum/select properties
  if (['text-align', 'display', 'position', 'flex-direction'].includes(property)) {
    return 'select'
  }

  // Default: text input
  return 'text'
}

/**
 * ColorEditor Component
 * Edits color properties with a color picker
 */
export function ColorEditor({ value = '#000000', onChange }) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleColorChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  const handleInputChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Validate hex before calling onChange
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue)
    }
  }

  return (
    <div className={styles.colorEditor}>
      <input
        type="color"
        value={inputValue}
        onChange={handleColorChange}
        className={styles.colorPicker}
        title="Pick a color"
      />
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="#000000"
        className={styles.colorInput}
        title="Enter hex color (e.g., #0066cc)"
      />
    </div>
  )
}

/**
 * SpacingEditor Component
 * Edits spacing properties (padding, margin) with unit support
 */
export function SpacingEditor({ value = '0px', onChange }) {
  const [inputValue, setInputValue] = useState(value)
  const [numericPart, setNumericPart] = useState('')
  const [unitPart, setUnitPart] = useState('px')

  useEffect(() => {
    // Parse current value into numeric and unit parts
    const match = value.match(/^([-\d.]+)(px|em|rem|%|vh|vw)?$/)
    if (match) {
      setNumericPart(match[1])
      setUnitPart(match[2] || 'px')
    }
    setInputValue(value)
  }, [value])

  const handleNumericChange = (e) => {
    const newNumeric = e.target.value
    setNumericPart(newNumeric)
    const newValue = `${newNumeric}${unitPart}`
    setInputValue(newValue)
    onChange(newValue)
  }

  const handleUnitChange = (e) => {
    const newUnit = e.target.value
    setUnitPart(newUnit)
    const newValue = `${numericPart}${newUnit}`
    setInputValue(newValue)
    onChange(newValue)
  }

  const handleDirectInput = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    // Parse and validate
    const match = newValue.match(/^([-\d.]+)(px|em|rem|%|vh|vw)?$/)
    if (match) {
      onChange(newValue)
    }
  }

  return (
    <div className={styles.spacingEditor}>
      <input
        type="number"
        value={numericPart}
        onChange={handleNumericChange}
        placeholder="0"
        className={styles.numericInput}
        title="Enter numeric value"
      />
      <select
        value={unitPart}
        onChange={handleUnitChange}
        className={styles.unitSelect}
      >
        <option value="px">px</option>
        <option value="em">em</option>
        <option value="rem">rem</option>
        <option value="%">%</option>
        <option value="vh">vh</option>
        <option value="vw">vw</option>
      </select>
      <input
        type="text"
        value={inputValue}
        onChange={handleDirectInput}
        placeholder="0px"
        className={styles.directInput}
        title="Or enter directly (e.g., 10px)"
      />
    </div>
  )
}

/**
 * NumericEditor Component
 * Edits numeric properties without units
 */
export function NumericEditor({ value = '0', onChange, property = '' }) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate based on property type
    let isValid = false

    if (property === 'opacity') {
      // opacity: 0-1
      const num = parseFloat(newValue)
      isValid = !isNaN(num) && num >= 0 && num <= 1
    } else if (property === 'font-weight') {
      // font-weight: 100-900 or keywords
      const num = parseInt(newValue)
      isValid = !isNaN(num) && num >= 100 && num <= 900
    } else if (property === 'z-index') {
      // z-index: any integer
      const num = parseInt(newValue)
      isValid = !isNaN(num)
    } else {
      // Default: any number
      const num = parseFloat(newValue)
      isValid = !isNaN(num)
    }

    if (isValid) {
      onChange(newValue)
    }
  }

  const getMin = () => property === 'opacity' ? '0' : undefined
  const getMax = () => property === 'opacity' ? '1' : undefined
  const getStep = () => property === 'opacity' ? '0.1' : '1'

  return (
    <input
      type="number"
      value={inputValue}
      onChange={handleChange}
      min={getMin()}
      max={getMax()}
      step={getStep()}
      className={styles.numericInput}
      title={`Enter value for ${property}`}
    />
  )
}

/**
 * SelectEditor Component
 * Edits enum properties with dropdown
 */
export function SelectEditor({ value = '', onChange, property = '' }) {
  const getOptions = (prop) => {
    const optionMap = {
      'text-align': ['left', 'center', 'right', 'justify', 'inherit'],
      'display': ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'],
      'position': ['static', 'relative', 'absolute', 'fixed', 'sticky'],
      'flex-direction': ['row', 'column', 'row-reverse', 'column-reverse'],
    }
    return optionMap[prop] || []
  }

  const options = getOptions(property)

  if (!options.length) {
    return <TextEditor value={value} onChange={onChange} />
  }

  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={styles.selectInput}>
      <option value="">-- Select --</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  )
}

/**
 * TextEditor Component
 * Generic text input for any property
 */
export function TextEditor({ value = '', onChange }) {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleChange = (e) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
  }

  return (
    <input
      type="text"
      value={inputValue}
      onChange={handleChange}
      className={styles.textInput}
      title="Enter value"
    />
  )
}

/**
 * PropertyEditorDispatcher Component
 * Routes to the correct editor based on property type
 */
export function PropertyEditorDispatcher({ property = '', value = '', onChange }) {
  const editorType = getPropertyEditorType(property)

  switch (editorType) {
    case 'color':
      return <ColorEditor value={value} onChange={onChange} />
    case 'spacing':
      return <SpacingEditor value={value} onChange={onChange} />
    case 'numeric':
      return <NumericEditor value={value} onChange={onChange} property={property} />
    case 'select':
      return <SelectEditor value={value} onChange={onChange} property={property} />
    default:
      return <TextEditor value={value} onChange={onChange} />
  }
}
