import React, { useState, useRef } from 'react'
import styles from '../styles/universal-input.module.css'

export default function UniversalInput({ onInputChange, onImageChange, onPredict }) {
  const [inputText, setInputText] = useState('')
  const [inputImage, setInputImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [charCount, setCharCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const handleTextChange = (e) => {
    const text = e.target.value
    setInputText(text)
    setCharCount(text.length)
    onInputChange(text)
  }

  const handleImageFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
      setInputImage(file)
      onImageChange(file, e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleImageFile(file)
    }
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault()
          const file = items[i].getAsFile()
          if (file) {
            handleImageFile(file)
          }
          break
        }
      }
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setInputImage(null)
    onImageChange(null, null)
  }

  const handleRunClick = () => {
    if (inputText || inputImage) {
      onPredict(inputText, inputImage, imagePreview)
    } else {
      alert('Please enter text or upload an image')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputSection}>
        <div className={styles.textareaWrapper}>
          <label className={styles.label}>Enter Text or Upload Image</label>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={inputText}
            onChange={handleTextChange}
            onPaste={handlePaste}
            placeholder="Type text here... or paste an image (Ctrl+V)"
          />
          <div className={styles.charCounter}>{charCount} characters</div>
        </div>

        <div
          className={`${styles.dropZone} ${isDragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={styles.dropZoneContent}>
            <svg className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drag & drop an image here</p>
            <p className={styles.subtext}>or click to select</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className={styles.fileInput}
            onClick={(e) => {
              const rect = e.currentTarget.parentElement.getBoundingClientRect()
              const x = e.clientX - rect.left
              const y = e.clientY - rect.top
              if (
                x > 0 &&
                x < rect.width &&
                y > 0 &&
                y < rect.height
              ) {
                e.currentTarget.click()
              }
            }}
          />
        </div>

        {imagePreview && (
          <div className={styles.imagePreview}>
            <div className={styles.previewLabel}>Image Preview</div>
            <div className={styles.previewContainer}>
              <img src={imagePreview} alt="Preview" />
              <button
                className={styles.removeButton}
                onClick={removeImage}
                title="Remove image"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <button className={styles.runButton} onClick={handleRunClick}>
          Predict Tool & Run
        </button>
      </div>
    </div>
  )
}
