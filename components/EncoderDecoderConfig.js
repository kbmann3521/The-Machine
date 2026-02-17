import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { MdDragIndicator } from 'react-icons/md'
import styles from '../styles/tool-config.module.css'

const AVAILABLE_TRANSFORMERS = [
  { id: 'base64', name: 'Base64' },
  { id: 'base32', name: 'Base32' },
  { id: 'url', name: 'URL Encoding' },
  { id: 'hex', name: 'Hexadecimal' },
  { id: 'binary', name: 'Binary' },
  { id: 'octal', name: 'Octal (8)' },
  { id: 'decimal', name: 'Decimal (10)' },
  { id: 'roman', name: 'Roman Numerals' },
  { id: 'ascii', name: 'ASCII/Unicode' },
  { id: 'caesar', name: 'Caesar Cipher' },
  { id: 'morse', name: 'Morse Code' },
]

export default function EncoderDecoderConfig({ config, onConfigChange }) {
  const [showTransformerMenu, setShowTransformerMenu] = useState(false)
  const [swappingIndex, setSwappingIndex] = useState(null)
  const [inlineAddIndex, setInlineAddIndex] = useState(null)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [localTransformers, setLocalTransformers] = useState(null)
  const [duplicateError, setDuplicateError] = useState(null)
  const menuRef = useRef(null)
  const swapMenuRef = useRef(null)
  const inlineAddRef = useRef(null)

  // Normalize config to ensure all required properties exist
  const normalizedConfig = useMemo(() => {
    return {
      direction: config?.direction || 'encode',
      transformers: config?.transformers || [
        { id: 'base64', name: 'Base64' },
      ],
      transformerConfigs: config?.transformerConfigs || {
        base64: { rfc_variant: 'standard', format: 'standard' },
      },
      finalOutputFormat: config?.finalOutputFormat || 'text',
      finalOutputConfig: config?.finalOutputConfig || {},
    }
  }, [config])

  // Use local transformers for immediate drag feedback, otherwise use normalized config
  const currentTransformers = useMemo(() => {
    return localTransformers || normalizedConfig.transformers
  }, [localTransformers, normalizedConfig.transformers])

  // Handle click away to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowTransformerMenu(false)
      }
      if (swapMenuRef.current && !swapMenuRef.current.contains(event.target)) {
        setSwappingIndex(null)
      }
      if (inlineAddRef.current && !inlineAddRef.current.contains(event.target)) {
        setInlineAddIndex(null)
      }
    }

    if (showTransformerMenu || swappingIndex !== null || inlineAddIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTransformerMenu, swappingIndex, inlineAddIndex])

  // Validate for duplicate characters in alphabet fields
  useEffect(() => {
    let foundError = null
    normalizedConfig.transformers.forEach(transformer => {
      const config = normalizedConfig.transformerConfigs[transformer.id] || {}
      if (config.alphabet) {
        const val = config.alphabet
        if (new Set(val).size !== val.length) {
          foundError = { transformerId: transformer.id, optionId: 'alphabet' }
        }
      }
    })
    setDuplicateError(foundError)
  }, [normalizedConfig.transformers, normalizedConfig.transformerConfigs])

  // Initialize transformers if not present in config
  useEffect(() => {
    if (!config || !config.transformers) {
      onConfigChange(normalizedConfig)
    }
  }, [config, normalizedConfig, onConfigChange])

  const handleDirectionToggle = useCallback((direction) => {
    onConfigChange({
      ...normalizedConfig,
      direction: direction,
    })
  }, [normalizedConfig, onConfigChange])

  const handleAddTransformer = useCallback((transformer, atIndex = -1) => {
    const newTransformers = [...normalizedConfig.transformers]
    if (atIndex === -1) {
      newTransformers.push(transformer)
    } else {
      newTransformers.splice(atIndex, 0, transformer)
    }

    const newConfigs = {
      ...normalizedConfig.transformerConfigs,
      [transformer.id]: getDefaultConfig(transformer.id),
    }

    onConfigChange({
      ...normalizedConfig,
      transformers: newTransformers,
      transformerConfigs: newConfigs,
    })
    setShowTransformerMenu(false)
    setInlineAddIndex(null)
  }, [normalizedConfig, onConfigChange])

  const handleRemoveTransformer = useCallback((index) => {
    const newTransformers = normalizedConfig.transformers.filter((_, i) => i !== index)
    onConfigChange({
      ...normalizedConfig,
      transformers: newTransformers,
    })
  }, [normalizedConfig, onConfigChange])

  const handleTransformerConfigChange = useCallback((transformerId, optionId, value) => {
    const newConfigs = {
      ...normalizedConfig.transformerConfigs,
      [transformerId]: {
        ...normalizedConfig.transformerConfigs[transformerId],
        [optionId]: value,
      },
    }

    onConfigChange({
      ...normalizedConfig,
      transformerConfigs: newConfigs,
    })
  }, [normalizedConfig, onConfigChange])

  const handleSwapTransformer = useCallback((index, newTransformer) => {
    const newTransformers = [...normalizedConfig.transformers]
    newTransformers[index] = newTransformer

    const newConfigs = {
      ...normalizedConfig.transformerConfigs,
      [newTransformer.id]: getDefaultConfig(newTransformer.id),
    }

    onConfigChange({
      ...normalizedConfig,
      transformers: newTransformers,
      transformerConfigs: newConfigs,
    })
    setSwappingIndex(null)
  }, [normalizedConfig, onConfigChange])

  const handleFinalOutputFormatChange = useCallback((format) => {
    onConfigChange({
      ...normalizedConfig,
      finalOutputFormat: format,
      finalOutputConfig: {}, // Reset config on format change
    })
  }, [normalizedConfig, onConfigChange])

  const handleFinalOutputConfigChange = useCallback((optionId, value) => {
    onConfigChange({
      ...normalizedConfig,
      finalOutputConfig: {
        ...normalizedConfig.finalOutputConfig,
        [optionId]: value,
      },
    })
  }, [normalizedConfig, onConfigChange])

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    setLocalTransformers([...normalizedConfig.transformers])
    e.dataTransfer.effectAllowed = 'move'

    // Set a transparent ghost image to avoid the default one
    const img = new Image()
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    e.dataTransfer.setDragImage(img, 0, 0)

    // Add dragging class after a small timeout so it doesn't affect the drag image
    const target = e.currentTarget
    setTimeout(() => {
      target.classList.add(styles.dragging)
    }, 0)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    // Midpoint logic to prevent jitter with variable item heights
    const rect = e.currentTarget.getBoundingClientRect()
    const verticalMidpoint = (rect.top + rect.bottom) / 2

    // If dragging down, only swap if mouse is below midpoint
    if (draggedIndex < index && e.clientY < verticalMidpoint) return
    // If dragging up, only swap if mouse is above midpoint
    if (draggedIndex > index && e.clientY > verticalMidpoint) return

    const newTransformers = [...localTransformers]
    const draggedItem = newTransformers[draggedIndex]
    newTransformers.splice(draggedIndex, 1)
    newTransformers.splice(index, 0, draggedItem)

    setDraggedIndex(index)
    setDragOverIndex(index)
    setLocalTransformers(newTransformers)
  }

  const handleDragEnd = () => {
    // Only call onConfigChange once when the drag is complete
    if (localTransformers) {
      onConfigChange({
        ...normalizedConfig,
        transformers: localTransformers,
      })
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
    setLocalTransformers(null)
  }

  const getTransformerModule = (transformerId) => {
    const modules = {
      base64: {
        options: [
          {
            id: 'rfc_variant',
            name: 'Variants',
            type: 'select',
            default: 'standard',
            options: [
              { value: 'standard', label: 'Base64 (RFC 3548, RFC 4648)' },
              { value: 'url', label: 'Base64url (RFC 4648 §5)' },
              { value: 'mime', label: 'Transfer encoding for MIME (RFC 2045)' },
              { value: 'original', label: 'Original Base64 (RFC 1421)' }
            ]
          },
          {
            id: 'format',
            name: 'Format Variant',
            type: 'select',
            default: 'standard',
            options: [
              { value: 'standard', label: 'Standard' },
              { value: 'no-padding', label: 'Standard (No padding)' },
              { value: 'url-safe-no-padding', label: 'URL-Safe (No padding)' },
              { value: 'url-safe', label: 'URL-Safe (Padded)' },
              { value: 'line-wrapped', label: 'Line Wrapped (MIME)' }
            ]
          },
        ],
      },
      base32: {
        options: [
          {
            id: 'variant',
            name: 'Variant',
            type: 'select',
            default: 'rfc4648',
            options: [
              { value: 'rfc4648', label: 'RFC 4648 (Standard)' },
              { value: 'base32hex', label: 'Base32Hex' },
              { value: 'crockford', label: 'Crockford' },
              { value: 'z-base-32', label: 'z-base-32' },
            ]
          },
          {
            id: 'format',
            name: 'Format Variant',
            type: 'select',
            default: 'standard',
            options: [
              { value: 'standard', label: 'Standard' },
              { value: 'no-padding', label: 'URL Safe (No padding)' },
              { value: 'line-wrapped', label: 'Line Wrapped (76 chars)' },
              { value: 'url-safe-wrapped', label: 'URL Safe Wrapped' }
            ]
          }
        ],
      },
      url: {
        options: [],
      },
      hex: {
        options: [
          {
            id: 'grouping',
            name: 'Format / Grouping',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'No Grouping' },
              { value: '1', label: 'Byte' },
              { value: '2', label: '2 Bytes' },
              { value: '3', label: '3 Bytes' },
              { value: '4', label: '4 Bytes' },
              { value: '0x-prefix', label: '0x Prefix' },
              { value: 'c-format', label: 'C Format' },
            ]
          },
        ],
      },
      binary: {
        options: [
          {
            id: 'grouping',
            name: 'Grouping',
            type: 'select',
            default: '8',
            options: [
              { value: 'none', label: 'No Grouping' },
              { value: '4', label: '4 Bits' },
              { value: '5', label: '5 Bits' },
              { value: '6', label: '6 Bits' },
              { value: '8', label: 'Byte' },
              { value: '16', label: '2 Bytes' },
              { value: '24', label: '3 Bytes' },
              { value: '32', label: '4 Bytes' },
            ]
          },
        ],
      },
      ascii: {
        options: [
          {
            id: 'separator',
            name: 'Separator',
            type: 'select',
            default: ', ',
            options: [
              { value: ', ', label: 'Comma' },
              { value: ' ', label: 'Space' },
              { value: '', label: 'None' },
            ]
          }
        ],
      },
      caesar: {
        options: [
          {
            id: 'shift',
            name: 'Shift Amount',
            type: 'number',
            default: 3,
            min: 1,
            max: 25,
          },
          {
            id: 'alphabet',
            name: 'Alphabet',
            type: 'text',
            default: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
          },
          {
            id: 'strategy',
            name: 'Case Strategy',
            type: 'select',
            default: 'preserve',
            options: [
              { value: 'preserve', label: 'Preserve' },
              { value: 'ignore', label: 'Ignore' },
              { value: 'strict', label: 'Strict (No Shift)' },
            ]
          },
          {
            id: 'foreignChars',
            name: 'Foreign Characters',
            type: 'select',
            default: 'include',
            options: [
              { value: 'include', label: 'Include' },
              { value: 'ignore', label: 'Ignore' },
            ]
          }
        ],
      },
      octal: {
        options: [
          {
            id: 'separator',
            name: 'Separator',
            type: 'select',
            default: ' ',
            options: [
              { value: ' ', label: 'Space' },
              { value: ', ', label: 'Comma' },
              { value: '', label: 'None' },
            ]
          }
        ],
      },
      decimal: {
        options: [
          {
            id: 'separator',
            name: 'Separator',
            type: 'select',
            default: ' ',
            options: [
              { value: ' ', label: 'Space' },
              { value: ', ', label: 'Comma' },
              { value: '', label: 'None' },
            ]
          }
        ],
      },
      roman: {
        options: [
          {
            id: 'separator',
            name: 'Separator',
            type: 'select',
            default: ' ',
            options: [
              { value: ' ', label: 'Space' },
              { value: ', ', label: 'Comma' },
              { value: '', label: 'None' },
            ]
          }
        ],
      },
      morse: {
        options: [
          {
            id: 'short',
            name: 'SHORT',
            type: 'text',
            default: '.',
          },
          {
            id: 'long',
            name: 'LONG',
            type: 'text',
            default: '-',
          },
          {
            id: 'space',
            name: 'SPACE',
            type: 'text',
            default: '/',
          }
        ],
      },
      final: {
        options: [
          {
            id: 'format',
            name: 'Output Format',
            type: 'select',
            default: 'text',
            options: [
              { value: 'text', label: 'Text' },
              { value: 'binary', label: 'Binary' },
              { value: 'hex', label: 'Hexadecimal' },
            ]
          }
        ]
      }
    }
    return modules[transformerId] || { options: [] }
  }

  const getDefaultConfig = (transformerId) => {
    const module = getTransformerModule(transformerId)
    const defaults = {}
    module.options.forEach(opt => {
      defaults[opt.id] = opt.default
    })
    return defaults
  }

  const usedTransformerIds = normalizedConfig.transformers.map(t => t.id)
  const availableTransformers = AVAILABLE_TRANSFORMERS.filter(t => !usedTransformerIds.includes(t.id))

  return (
    <div className={styles.container} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Direction Toggle */}
      <div className={styles.field}>
        <label className={styles.fieldLabel}>DIRECTION</label>
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--color-background-tertiary)',
          borderRadius: '6px',
          padding: '2px',
          border: '1px solid var(--color-border)',
        }}>
          <button
            onClick={() => handleDirectionToggle('encode')}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: normalizedConfig.direction === 'encode' ? '600' : '500',
              color: normalizedConfig.direction === 'encode' ? '#ffffff' : 'var(--color-text-secondary)',
              backgroundColor: normalizedConfig.direction === 'encode' ? '#0066cc' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'none',
              outline: 'none',
            }}
          >
            Encode
          </button>
          <button
            onClick={() => handleDirectionToggle('decode')}
            style={{
              flex: 1,
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: normalizedConfig.direction === 'decode' ? '600' : '500',
              color: normalizedConfig.direction === 'decode' ? '#ffffff' : 'var(--color-text-secondary)',
              backgroundColor: normalizedConfig.direction === 'decode' ? '#0066cc' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'none',
              outline: 'none',
            }}
          >
            Decode
          </button>
        </div>
      </div>

      {/* Transformers Section */}
      <div className={styles.field}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className={styles.fieldLabel}>TRANSFORMERS</label>
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setShowTransformerMenu(!showTransformerMenu)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: '600',
                height: 'auto',
                color: '#ffffff',
                backgroundColor: '#0066cc',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'none',
                outline: 'none',
              }}
              disabled={availableTransformers.length === 0}
            >
              + Add
            </button>

            {/* Transformer Menu Dropdown */}
            {showTransformerMenu && availableTransformers.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                minWidth: '160px',
                marginTop: '4px',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                {availableTransformers.map(transformer => (
                  <button
                    key={transformer.id}
                    onClick={() => handleAddTransformer(transformer)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 12px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-primary)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '12px',
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-background-tertiary)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    {transformer.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transformers List */}
        {currentTransformers.length === 0 ? (
          <div style={{
            padding: '12px',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#ffa726',
          }}>
            No transformers selected. Add at least one to proceed.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentTransformers.map((transformer, index) => {
              const module = getTransformerModule(transformer.id)
              const transformerConfig = normalizedConfig.transformerConfigs[transformer.id] || {}

              return (
                <React.Fragment key={transformer.id}>
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`${styles.transformerItem} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index && draggedIndex !== index ? styles.dragOver : ''}`}
                  >
                    {/* Transformer Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: module.options.length > 0 ? '8px' : '0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          className={styles.dragHandle}
                          onMouseDown={(e) => {
                            const parent = e.currentTarget.closest('[draggable]')
                            if (parent) parent.setAttribute('draggable', 'true')
                          }}
                          onMouseUp={(e) => {
                            const parent = e.currentTarget.closest('[draggable]')
                            if (parent) parent.setAttribute('draggable', 'false')
                          }}
                        >
                          <MdDragIndicator size={16} />
                        </div>
                        <div
                          style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          ref={swappingIndex === index ? swapMenuRef : null}
                        >
                          <span
                            onClick={() => setSwappingIndex(swappingIndex === index ? null : index)}
                            style={{
                              fontSize: '12px',
                              fontWeight: '600',
                              color: 'var(--color-text-primary)',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              backgroundColor: swappingIndex === index ? 'var(--color-background-secondary)' : 'transparent',
                              transition: 'none'
                            }}
                            onMouseEnter={(e) => {
                              if (swappingIndex !== index) e.target.style.backgroundColor = 'var(--color-background-secondary)'
                            }}
                            onMouseLeave={(e) => {
                              if (swappingIndex !== index) e.target.style.backgroundColor = 'transparent'
                            }}
                          >
                            {index + 1}. {transformer.name}
                          </span>

                          {/* Swap Menu Dropdown */}
                          {swappingIndex === index && (
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              left: 0,
                              backgroundColor: 'var(--color-background-secondary)',
                              border: '1px solid var(--color-border)',
                              borderRadius: '4px',
                              minWidth: '160px',
                              marginTop: '4px',
                              zIndex: 1001,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}>
                              {AVAILABLE_TRANSFORMERS.filter(opt => opt.id === transformer.id || !usedTransformerIds.includes(opt.id)).map(opt => (
                                <button
                                  key={opt.id}
                                  onClick={() => handleSwapTransformer(index, opt)}
                                  style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '10px 12px',
                                    border: 'none',
                                    backgroundColor: transformer.id === opt.id ? 'var(--color-background-tertiary)' : 'transparent',
                                    color: transformer.id === opt.id ? '#0066cc' : 'var(--color-text-primary)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: transformer.id === opt.id ? '600' : '400',
                                    borderBottom: '1px solid var(--color-border)',
                                    transition: 'none',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (transformer.id !== opt.id) e.target.style.backgroundColor = 'var(--color-background-tertiary)'
                                  }}
                                  onMouseLeave={(e) => {
                                    if (transformer.id !== opt.id) e.target.style.backgroundColor = 'transparent'
                                  }}
                                >
                                  {opt.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveTransformer(index)}
                        style={{
                          padding: '2px 6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: 'var(--color-text-secondary)',
                          transition: 'none',
                          outline: 'none',
                        }}
                      >
                        Remove
                      </button>
                    </div>

                    {/* Transformer Options */}
                    {module.options.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Group options by row if applicable */}
                        {(() => {
                          const rows = {}
                          const nonGrouped = []
                          module.options.forEach(opt => {
                            if (opt.row) {
                              if (!rows[opt.row]) rows[opt.row] = []
                              rows[opt.row].push(opt)
                            } else {
                              nonGrouped.push(opt)
                            }
                          })

                          const renderOption = (option) => {
                            if (option.condition && !option.condition(transformerConfig)) return null

                            return (
                              <div key={option.id} className={styles.field} style={{ flex: option.row !== undefined ? 1 : 'none' }}>
                                {option.type === 'toggle' && (
                                  <div className={styles.toggleContainer} style={{ height: '28px', padding: '4px 8px' }}>
                                    <label className={styles.toggleLabel}>
                                      <input
                                        type="checkbox"
                                        className={styles.toggleInput}
                                        checked={transformerConfig[option.id] ?? option.default}
                                        onChange={(e) => handleTransformerConfigChange(transformer.id, option.id, e.target.checked)}
                                      />
                                      <span className={styles.toggleSlider} style={{ width: '28px', height: '14px' }}></span>
                                      <span style={{ fontSize: '11px' }}>{option.name}</span>
                                    </label>
                                  </div>
                                )}

                                {option.type === 'select' && (
                                  <div className={styles.field}>
                                    <label className={styles.fieldLabel} style={{ fontSize: '10px' }}>{option.name}</label>
                                    <select
                                      className={styles.select}
                                      style={{ height: '28px', fontSize: '11px', padding: '2px 8px' }}
                                      value={transformerConfig[option.id] ?? option.default}
                                      onChange={(e) => handleTransformerConfigChange(transformer.id, option.id, e.target.value)}
                                    >
                                      {(typeof option.options === 'function' ? option.options(transformerConfig) : option.options).map(opt => {
                                        const val = typeof opt === 'object' ? opt.value : opt
                                        const label = typeof opt === 'object' ? opt.label : opt
                                        return <option key={val} value={val}>{label}</option>
                                      })}
                                    </select>
                                  </div>
                                )}

                                {option.type === 'number' && (
                                  <div className={styles.field}>
                                    <label className={styles.fieldLabel} style={{ fontSize: '10px' }}>{option.name}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <button
                                        onClick={() => handleTransformerConfigChange(transformer.id, option.id, Math.max(option.min || 0, (transformerConfig[option.id] ?? option.default) - 1))}
                                        style={{
                                          width: '20px',
                                          height: '28px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          border: '1px solid var(--color-border)',
                                          borderRadius: '4px',
                                          backgroundColor: 'var(--color-background-secondary)',
                                          color: 'var(--color-text-primary)',
                                          cursor: 'pointer',
                                          fontSize: '14px'
                                        }}
                                      >
                                        -
                                      </button>
                                      <div style={{
                                        flex: 1,
                                        height: '28px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'var(--color-background-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '4px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                      }}>
                                        {(transformerConfig[option.id] ?? option.default)} {String.fromCharCode(64 + (transformerConfig[option.id] ?? option.default))}
                                      </div>
                                      <button
                                        onClick={() => handleTransformerConfigChange(transformer.id, option.id, Math.min(option.max || 999, (transformerConfig[option.id] ?? option.default) + 1))}
                                        style={{
                                          width: '20px',
                                          height: '28px',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          border: '1px solid var(--color-border)',
                                          borderRadius: '4px',
                                          backgroundColor: 'var(--color-background-secondary)',
                                          color: 'var(--color-text-primary)',
                                          cursor: 'pointer',
                                          fontSize: '14px'
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {option.type === 'text' && (
                                  <div className={styles.field} style={{ position: 'relative' }}>
                                    <label className={styles.fieldLabel} style={{ fontSize: '10px' }}>{option.name}</label>
                                    <input
                                      type="text"
                                      className={styles.input}
                                      style={{
                                        height: '28px',
                                        fontSize: '11px',
                                        padding: '2px 8px',
                                        border: duplicateError?.transformerId === transformer.id && duplicateError?.optionId === option.id
                                          ? '1px solid #ff4d4f'
                                          : '1px solid var(--color-border)'
                                      }}
                                      value={transformerConfig[option.id] ?? option.default}
                                      onChange={(e) => {
                                        handleTransformerConfigChange(transformer.id, option.id, e.target.value)
                                      }}
                                    />
                                    {duplicateError?.transformerId === transformer.id && duplicateError?.optionId === option.id && (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: '100%',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        backgroundColor: '#ff4d4f',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '10px',
                                        whiteSpace: 'nowrap',
                                        marginBottom: '5px',
                                        zIndex: 10,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        pointerEvents: 'none'
                                      }}>
                                        Alphabet cannot contain duplicate characters
                                        <div style={{
                                          position: 'absolute',
                                          top: '100%',
                                          left: '50%',
                                          marginLeft: '-4px',
                                          borderWidth: '4px',
                                          borderStyle: 'solid',
                                          borderColor: '#ff4d4f transparent transparent transparent'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          return (
                            <>
                              {nonGrouped.map(opt => renderOption(opt))}
                              {Object.keys(rows).map(rowId => (
                                <div key={rowId} style={{ display: 'flex', gap: '8px' }}>
                                  {rows[rowId].map(opt => renderOption(opt))}
                                </div>
                              ))}
                            </>
                          )
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Inline Add Button after each transformer */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
                    <div style={{ position: 'relative' }} ref={inlineAddIndex === index ? inlineAddRef : null}>
                      <button
                        onClick={() => setInlineAddIndex(inlineAddIndex === index ? null : index)}
                        style={{
                          padding: '2px 8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#ffffff',
                          backgroundColor: '#0066cc',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                          transition: 'none',
                          outline: 'none',
                          opacity: 0.8
                        }}
                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                        onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                        disabled={availableTransformers.length === 0}
                      >
                        + Add
                      </button>

                      {/* Inline Add Menu Dropdown */}
                      {inlineAddIndex === index && availableTransformers.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: 'var(--color-background-secondary)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '4px',
                          minWidth: '160px',
                          marginTop: '4px',
                          zIndex: 1002,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}>
                          {availableTransformers.map(opt => (
                            <button
                              key={opt.id}
                              onClick={() => handleAddTransformer(opt, index + 1)}
                              style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--color-text-primary)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '12px',
                                borderBottom: '1px solid var(--color-border)',
                                transition: 'none',
                              }}
                              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--color-background-tertiary)'}
                              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              {opt.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
      </div>

      {/* Final Output Permanent Section */}
      <div className={styles.field}>
        <div style={{
          padding: '10px',
          backgroundColor: 'var(--color-background-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: '5px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-primary)' }}>
              Final Output
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className={styles.field}>
              <label className={styles.fieldLabel} style={{ fontSize: '10px' }}>Output Format</label>
              <select
                className={styles.select}
                style={{ height: '28px', fontSize: '11px', padding: '2px 8px' }}
                value={normalizedConfig.finalOutputFormat}
                onChange={(e) => handleFinalOutputFormatChange(e.target.value)}
              >
                <option value="text">Text</option>
                <option value="binary">Binary</option>
                <option value="hex">Hexadecimal</option>
              </select>
            </div>

            {normalizedConfig.finalOutputFormat === 'binary' && (
              <div className={styles.field}>
                <label className={styles.fieldLabel} style={{ fontSize: '10px' }}>Grouping</label>
                <select
                  className={styles.select}
                  style={{ height: '28px', fontSize: '11px', padding: '2px 8px' }}
                  value={normalizedConfig.finalOutputConfig.grouping || '8'}
                  onChange={(e) => handleFinalOutputConfigChange('grouping', e.target.value)}
                >
                  <option value="none">No Grouping</option>
                  <option value="4">4 Bits</option>
                  <option value="5">5 Bits</option>
                  <option value="6">6 Bits</option>
                  <option value="8">Byte</option>
                  <option value="16">2 Bytes</option>
                  <option value="24">3 Bytes</option>
                  <option value="32">4 Bytes</option>
                </select>
              </div>
            )}

            {normalizedConfig.finalOutputFormat === 'hex' && (
              <div className={styles.field}>
                <label className={styles.fieldLabel} style={{ fontSize: '10px' }}>Format / Grouping</label>
                <select
                  className={styles.select}
                  style={{ height: '28px', fontSize: '11px', padding: '2px 8px' }}
                  value={normalizedConfig.finalOutputConfig.grouping || 'none'}
                  onChange={(e) => handleFinalOutputConfigChange('grouping', e.target.value)}
                >
                  <option value="none">No Grouping</option>
                  <option value="1">Byte</option>
                  <option value="2">2 Bytes</option>
                  <option value="3">3 Bytes</option>
                  <option value="4">4 Bytes</option>
                  <option value="0x-prefix">0x Prefix</option>
                  <option value="c-format">C Format</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
