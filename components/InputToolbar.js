import React, { useRef } from 'react'
import styles from '../styles/universal-input.module.css'

/**
 * InputToolbar Component
 * 
 * Toolbar containing input controls:
 * - Upload Image
 * - Load Example (conditional)
 * - Clear Input (conditional)
 * - Case Type Select (for case converter, conditional)
 * - Use Output button (conditional)
 * 
 * Props:
 *   selectedTool: tool object
 *   configOptions: current config
 *   getToolExample: function to get example
 *   inputText: current input text
 *   result: current output result
 *   activeToolkitSection: which toolkit section is active
 *   selectedCaseType: selected case type (for case converter)
 *   onImageSelect: callback when image is selected
 *   onLoadExample: callback to load example
 *   onClearInput: callback to clear input
 *   onUseOutput: callback to use output as input
 *   onCaseTypeChange: callback when case type changes
 */
export default function InputToolbar({
  selectedTool = null,
  configOptions = {},
  getToolExample = null,
  inputText = '',
  result = null,
  activeToolkitSection = null,
  selectedCaseType = 'uppercase',
  onImageSelect = null,
  onLoadExample = null,
  onClearInput = null,
  onUseOutput = null,
  onCaseTypeChange = null,
}) {
  const fileInputRef = useRef(null)

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file && onImageSelect) {
      onImageSelect(file)
    }
  }

  const getOutputToUse = () => {
    if (!result) return null
    if (result.output) return result.output
    if (result.result) return result.result
    if (typeof result === 'string') return result
    return null
  }

  const hasExample = selectedTool && getToolExample && getToolExample(selectedTool.toolId, configOptions)
  const hasOutput = inputText && getOutputToUse()

  return (
    <div className={styles.toolTextboxHeader}>
      <div className={styles.headerContent}>
        <button
          className={styles.uploadImageButton}
          onClick={openFileDialog}
          title="Click to upload an image"
          type="button"
        >
          <svg className={styles.uploadImageIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span className={styles.buttonText}>Upload Image</span>
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          className={styles.fileInput}
        />

        <div className={styles.headerButtonGroup}>
          {hasExample && (
            <button
              className={styles.loadExampleButton}
              onClick={onLoadExample}
              title="Load example input and see output"
              type="button"
            >
              Load Example
            </button>
          )}
          {inputText && (
            <>
              <button
                className={styles.clearInputButton}
                onClick={onClearInput}
                title="Clear all input and output"
                type="button"
              >
                <span className={styles.buttonText}>Clear Input</span>
              </button>
              {hasOutput && (
                <>
                  {activeToolkitSection === 'caseConverter' && (
                    <select
                      className={styles.caseTypeSelect}
                      value={selectedCaseType}
                      onChange={(e) => onCaseTypeChange?.(e.target.value)}
                      title="Select case type to use"
                    >
                      <option value="uppercase">UPPERCASE</option>
                      <option value="lowercase">lowercase</option>
                      <option value="titleCase">Title Case</option>
                      <option value="sentenceCase">Sentence case</option>
                    </select>
                  )}
                  <button
                    className={styles.useOutputButton}
                    onClick={onUseOutput}
                    title="Use output as input"
                    type="button"
                    aria-label="Use output as input"
                  >
                    ⬇️
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
