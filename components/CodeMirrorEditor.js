import { useEffect, useRef } from 'react'
import { EditorState, Compartment } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { useTheme } from '../lib/ThemeContext'

/**
 * ============================================================================
 * LOCKED-IN: CodeMirror 6 Color Customization Pattern
 * ============================================================================
 *
 * To change CodeMirror 6 editor colors, follow this pattern:
 *
 * 1. BACKGROUND COLORS (light/dark mode responsive):
 *    - Edit createDynamicTheme() function
 *    - Use CSS variables (--color-background-secondary, etc.)
 *    - Theme updates automatically when user toggles light/dark mode via Compartment
 *
 * 2. CARET COLOR (blinking cursor - light/dark mode responsive):
 *    - Light mode: Edit caretThemeLight constant
 *      - Change: borderLeftColor: '#000000' (currently black)
 *    - Dark mode: Edit caretThemeDark constant
 *      - Change: borderLeftColor: '#ffffff' (currently white)
 *    - Both themes use createCaretTheme(isDarkMode) to swap automatically
 *    - DO NOT remove the { dark: true } option from caretThemeDark
 *
 * 3. OTHER COLORS (selection, gutters, etc.):
 *    - Add a new EditorView.theme() constant following the pattern
 *    - Create a function to conditionally return the appropriate theme
 *    - Use createDynamicTheme() or createCaretTheme() as reference
 *
 * IMPORTANT: CM6 extensions are immutable. Use Compartment for dynamic updates.
 * All dynamic colors must be reconfigured via dispatch() in the theme useEffect.
 * ============================================================================
 */

// Create theme extension based on current CSS variables
function createDynamicTheme() {
  const root = document.documentElement
  const vars = {
    backgroundSecondary: getComputedStyle(root).getPropertyValue('--color-background-secondary').trim(),
    backgroundTertiary: getComputedStyle(root).getPropertyValue('--color-background-tertiary').trim(),
    textPrimary: getComputedStyle(root).getPropertyValue('--color-text-primary').trim(),
    textSecondary: getComputedStyle(root).getPropertyValue('--color-text-secondary').trim(),
    border: getComputedStyle(root).getPropertyValue('--color-border').trim(),
  }

  return EditorView.theme({
    '&': {
      backgroundColor: vars.backgroundSecondary,
      color: vars.textPrimary,
    },
    '.cm-gutters': {
      backgroundColor: vars.backgroundTertiary,
      color: vars.textSecondary,
      borderRight: `1px solid ${vars.border}`,
    },
    '.cm-lineNumbers': {
      minWidth: '20px !important',
      padding: '0 2px',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px',
      fontSize: '12px',
      color: vars.textSecondary,
    },
    '.cm-activeLineGutter': {
      color: vars.textPrimary,
      backgroundColor: vars.backgroundTertiary,
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(0, 102, 204, 0.2)',
    },
  })
}

/**
 * Light mode caret: Black cursor
 * Used when user's theme is set to light
 */
const caretThemeLight = EditorView.theme({
  '.cm-cursor': {
    borderLeftColor: '#000000',
  },
})

/**
 * Dark mode caret: White cursor
 * Used when user's theme is set to dark
 */
const caretThemeDark = EditorView.theme({
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
  },
}, { dark: true })

/**
 * Create the appropriate caret theme based on current theme
 */
function createCaretTheme(isDarkMode) {
  return isDarkMode ? caretThemeDark : caretThemeLight
}

export default function CodeMirrorEditor({
  value = '',
  onChange,
  language = 'javascript',
  className = '',
  style = {},
  readOnly = false,
  placeholder = '',
  showLineNumbers = false,
}) {
  const { theme } = useTheme()
  const editorRef = useRef(null)
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const valueRef = useRef(value)
  const themeCompartmentRef = useRef(new Compartment())
  const caretCompartmentRef = useRef(new Compartment())

  useEffect(() => {
    valueRef.current = value
  }, [value])

  useEffect(() => {
    if (!editorRef.current) return

    // Determine if dark mode is active
    const isDarkMode = theme === 'dark'

    // Create initial state
    const state = EditorState.create({
      doc: value ?? '',
      extensions: [
        // Line number gutter (conditional)
        showLineNumbers ? lineNumbers() : [],

        // Basic keyboard support
        keymap.of(defaultKeymap),

        // Syntax highlighting
        javascript(),

        // Soft wrapping (formatter default)
        EditorView.lineWrapping,

        // Dynamic theme based on CSS variables (using compartment for updates)
        themeCompartmentRef.current.of(createDynamicTheme()),

        // Caret theme that changes based on light/dark mode (using compartment)
        caretCompartmentRef.current.of(createCaretTheme(isDarkMode)),

        // Read-only mode if needed
        readOnly ? EditorState.readOnly.of(true) : [],

        // Track changes
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !readOnly) {
            const newValue = update.state.doc.toString()
            onChange?.(newValue)
          }
        }),
      ],
    })

    // Create editor view
    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [readOnly, showLineNumbers])

  // Update theme when theme context changes
  useEffect(() => {
    if (!viewRef.current) return

    const isDarkMode = theme === 'dark'

    // Update both the main theme and caret theme without recreating the entire editor
    viewRef.current.dispatch({
      effects: [
        themeCompartmentRef.current.reconfigure(createDynamicTheme()),
        caretCompartmentRef.current.reconfigure(createCaretTheme(isDarkMode)),
      ],
    })
  }, [theme])

  // Update editor content programmatically (only if value changed externally)
  useEffect(() => {
    if (!viewRef.current) return

    const currentValue = viewRef.current.state.doc.toString()
    if (currentValue !== valueRef.current && valueRef.current !== undefined) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: valueRef.current,
        },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        ...style,
      }}
      className={className}
      data-testid="codemirror-editor-container"
    >
      {placeholder && value === '' && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50px',
            color: 'var(--color-text-secondary)',
            opacity: '0.5',
            pointerEvents: 'none',
            fontSize: '13px',
            fontFamily: "'Courier New', monospace",
            zIndex: 1,
          }}
        >
          {placeholder}
        </div>
      )}
      <div
        ref={editorRef}
        style={{ height: '100%', width: '100%' }}
        data-testid="codemirror-editor"
      />
    </div>
  )
}
