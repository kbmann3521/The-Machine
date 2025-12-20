import styles from '../styles/css-editor-sidebar.module.css'

export default function CSSEditorSidebar({ css, setCss, onSave, onClose, isSaving }) {
  const handleChange = (e) => {
    const newCss = e.target.value
    setCss(newCss)

    // Inject CSS in real-time for preview
    let styleElement = document.getElementById('blog-custom-css-live-editor')
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = 'blog-custom-css-live-editor'
      document.head.appendChild(styleElement)
    }
    styleElement.textContent = newCss
  }

  const handleSaveClick = async () => {
    try {
      await onSave()
    } catch (err) {
      console.error('Error saving CSS:', err)
      alert(`Failed to save CSS: ${err.message}`)
    }
  }

  return (
    <>
      <div className={styles.editorBackdrop} onClick={onClose} />

      <div className={styles.editorSidebar}>
        <div className={styles.editorHeader}>
          <h2 className={styles.editorTitle}>Customize Blog CSS</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close editor"
          >
            ✕
          </button>
        </div>

        <div className={styles.editorContent}>
          <p className={styles.editorDescription}>
            Edit CSS to customize all blog post styling. Changes apply in real-time.
          </p>

          <textarea
            className={styles.cssEditor}
            value={css}
            onChange={handleChange}
            placeholder=".postContent h1 { font-size: 3rem; }&#10;&#10;.postContent p { line-height: 2; }"
            spellCheck="false"
          />

          <div className={styles.editorHint}>
            <p>
              <strong>Tip:</strong> Target blog content with these selectors:
            </p>
            <ul>
              <li><code>.blog-post-content</code> - Main content wrapper</li>
              <li><code>.blog-post-content h1, h2, h3</code> - Headings</li>
              <li><code>.blog-post-content p</code> - Paragraphs</li>
              <li><code>.blog-post-content ul, ol</code> - Lists</li>
              <li><code>.blog-post-content li</code> - List items</li>
              <li><code>.blog-post-content code</code> - Inline code</li>
              <li><code>.blog-post-content pre</code> - Code blocks</li>
              <li><code>.blog-post-content a</code> - Links</li>
            </ul>
          </div>
        </div>

        <div className={styles.editorFooter}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save CSS'}
          </button>
        </div>
      </div>
    </>
  )
}
