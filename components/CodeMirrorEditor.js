import { useEffect, useRef, useState } from 'react'
import { EditorState, Compartment, EditorSelection } from '@codemirror/state'
import { EditorView, lineNumbers } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { javascript } from '@codemirror/lang-javascript'
import { xml } from '@codemirror/lang-xml'
import { html } from '@codemirror/lang-html'
import { markdown } from '@codemirror/lang-markdown'
import { sql } from '@codemirror/lang-sql'
import { yaml } from '@codemirror/lang-yaml'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { useTheme } from '../lib/ThemeContext'
import { createFormatterLinter, createLintTheme } from '../lib/codemirrorLinting'

/**
 * ============================================================================
 * CUSTOM SYNTAX HIGHLIGHT STYLES
 * Neutral Professional Palette - Works on both light and dark backgrounds
 * Inspired by: GitHub, VS Code default, JetBrains neutral themes
 * ============================================================================
 */

// Light mode syntax colors
const syntaxLight = HighlightStyle.define([
  { tag: tags.keyword, color: '#1f4fd8' },              // Keywords (blue)
  { tag: tags.atom, color: '#9f1239' },                 // Atoms/booleans (rose)
  { tag: tags.number, color: '#9f1239' },               // Numbers (rose)
  { tag: tags.string, color: '#065f46' },               // Strings (teal/green)
  { tag: tags.comment, color: '#6b7280', fontStyle: 'italic' },  // Comments (gray)
  { tag: tags.operator, color: '#374151' },             // Operators (dark gray)
  { tag: tags.punctuation, color: '#374151' },          // Punctuation (dark gray)
  { tag: tags.propertyName, color: '#92400e' },         // Property names (amber)
  { tag: tags.className, color: '#1f4fd8' },            // Class names (blue)
  { tag: tags.variableName, color: '#0f766e' },         // Variable names (teal)
])

// Dark mode syntax colors (same hues, brighter for dark backgrounds)
const syntaxDark = HighlightStyle.define([
  { tag: tags.keyword, color: '#7aa2f7' },              // Keywords (bright blue)
  { tag: tags.atom, color: '#f7768e' },                 // Atoms/booleans (bright rose)
  { tag: tags.number, color: '#f7768e' },               // Numbers (bright rose)
  { tag: tags.string, color: '#9ece6a' },               // Strings (bright green)
  { tag: tags.comment, color: '#9aa5ce', fontStyle: 'italic' },  // Comments (light gray)
  { tag: tags.operator, color: '#c0caf5' },             // Operators (light gray)
  { tag: tags.punctuation, color: '#c0caf5' },          // Punctuation (light gray)
  { tag: tags.propertyName, color: '#e0af68' },         // Property names (bright amber)
  { tag: tags.className, color: '#7aa2f7' },            // Class names (bright blue)
  { tag: tags.variableName, color: '#7dcfff' },         // Variable names (bright cyan)
])

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

// Create theme extension based on current CSS variables and editor type
// Input editors: uses standard background
// Output editors: uses darker background in dark mode
function createDynamicTheme(editorType = 'input', isDarkMode = false) {
  const root = document.documentElement
  const vars = {
    backgroundSecondary: getComputedStyle(root).getPropertyValue('--color-background-secondary').trim(),
    backgroundTertiary: getComputedStyle(root).getPropertyValue('--color-background-tertiary').trim(),
    textPrimary: getComputedStyle(root).getPropertyValue('--color-text-primary').trim(),
    textSecondary: getComputedStyle(root).getPropertyValue('--color-text-secondary').trim(),
    border: getComputedStyle(root).getPropertyValue('--color-border').trim(),
  }

  // Output editors get a darker background in dark mode
  const editorBackground = (editorType === 'output' && isDarkMode)
    ? '#1a1a1a'  // Darker background for output in dark mode
    : vars.backgroundSecondary

  return EditorView.theme({
    '&': {
      backgroundColor: editorBackground,
      color: vars.textPrimary,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },
    '.cm-scroller': {
      flex: 1,
      overflow: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: 'rgba(128, 128, 128, 0.5) transparent',
    },
    '.cm-scroller::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '.cm-scroller::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '.cm-scroller::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(128, 128, 128, 0.5)',
      borderRadius: '3px',
    },
    '.cm-scroller::-webkit-scrollbar-thumb:hover': {
      backgroundColor: 'rgba(128, 128, 128, 0.7)',
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
    borderLeftWidth: '2px',
    marginLeft: '-1px',
  },
})

/**
 * Dark mode caret: White cursor
 * Used when user's theme is set to dark
 */
const caretThemeDark = EditorView.theme({
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
    borderLeftWidth: '2px',
    marginLeft: '-1px',
  },
}, { dark: true })

/**
 * Create the appropriate caret theme based on current theme
 */
function createCaretTheme(isDarkMode) {
  return isDarkMode ? caretThemeDark : caretThemeLight
}

/**
 * Create syntax highlighting theme based on current theme
 * Uses professional neutral color palette that works on both light and dark backgrounds
 */
function createSyntaxTheme(isDarkMode) {
  return isDarkMode ? syntaxDark : syntaxLight
}

/**
 * Get the appropriate language extension based on language type
 * Supports: javascript, json, xml/svg, html, markdown, sql, yaml, text
 */
function getLanguageExtension(language = 'javascript') {
  switch (language?.toLowerCase()) {
    case 'json':
      // JSON uses JavaScript parser with json: true flag
      return javascript({ json: true })
    case 'xml':
    case 'svg':
      // SVG uses XML language (no separate SVG language exists)
      return xml()
    case 'html':
    case 'markup':
      return html()
    case 'markdown':
      return markdown()
    case 'sql':
      return sql()
    case 'yaml':
      return yaml()
    case 'text':
      // Plain text mode with no syntax highlighting or language-specific features
      // This disables auto-indentation and other language-specific behaviors
      return []
    case 'javascript':
    default:
      return javascript()
  }
}

// Custom tab handler that inserts actual tab characters (\t)
// instead of spaces, so tab count in text analyzer works correctly
const insertTabCharacter = (view) => {
  const state = view.state
  const changes = state.changeByRange(range => ({
    changes: { from: range.from, to: range.to, insert: '\t' },
    range: EditorSelection.cursor(range.from + 1),
  }))
  view.dispatch(changes)
  return true
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
  editorType = 'input',
  highlightingEnabled = true,
  diagnostics = [],
  formatMode = 'beautify',
  enableLinting = true,
}) {
  const { theme } = useTheme()
  const editorRef = useRef(null)
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const valueRef = useRef(value)
  const themeCompartmentRef = useRef(new Compartment())
  const caretCompartmentRef = useRef(new Compartment())
  const syntaxCompartmentRef = useRef(new Compartment())
  const lintThemeCompartmentRef = useRef(new Compartment())
  const linterCompartmentRef = useRef(new Compartment())
  const [gutterWidth, setGutterWidth] = useState(0)

  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Calculate gutter width when line numbers are shown
  useEffect(() => {
    if (!viewRef.current || !showLineNumbers) {
      setGutterWidth(0)
      return
    }

    const measureGutterWidth = () => {
      const gutterElement = editorRef.current?.querySelector('.cm-gutters')
      if (gutterElement) {
        setGutterWidth(gutterElement.offsetWidth)
      }
    }

    // Measure after a short delay to ensure CM6 has rendered
    const timer = setTimeout(measureGutterWidth, 50)

    // Also set up a ResizeObserver to track gutter width changes
    if (editorRef.current) {
      const gutterElement = editorRef.current.querySelector('.cm-gutters')
      if (gutterElement) {
        const observer = new ResizeObserver(measureGutterWidth)
        observer.observe(gutterElement)
        return () => observer.disconnect()
      }
    }

    return () => clearTimeout(timer)
  }, [showLineNumbers, viewRef.current])

  useEffect(() => {
    if (!editorRef.current) return

    // Determine if dark mode is active
    const isDarkMode = theme === 'dark'

    // Create linter if diagnostics are available and linting is enabled
    let linterExtensions = []
    if (enableLinting && diagnostics && diagnostics.length > 0) {
      const formatter = createFormatterLinter(diagnostics, {
        shouldSuppressInMinifyMode: true,
        formatMode,
      })
      linterExtensions = [formatter]
    }

    // Build extensions list
    const extensions = [
      // Line number gutter (conditional)
      ...(showLineNumbers ? [lineNumbers()] : []),

      // History/Undo support (input only) - CRITICAL: must be included for Ctrl+Z to work
      ...(!readOnly ? [history()] : []),

      // Keyboard shortcuts (undo/redo, find, indent, select all, copy, paste, etc.)
      // Input editor: full set with undo/redo + search
      // Output editor: read-only safe (no undo/redo)
      ...(!readOnly ? [
        keymap.of([
          { key: 'Tab', run: insertTabCharacter }, // Tab key inserts actual tab character
          ...historyKeymap,       // Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z (redo), Ctrl+Y (redo)
          ...defaultKeymap,       // copy, paste, select all, arrow keys, etc.
          ...searchKeymap         // Ctrl/Cmd+F (find), Ctrl/Cmd+G (find next)
        ])
      ] : [
        keymap.of([
          ...defaultKeymap,       // copy, select all, etc.
          ...searchKeymap         // Ctrl/Cmd+F (find)
        ])
      ]),

      // Language-specific syntax highlighting (parser)
      getLanguageExtension(language),

      // Syntax highlighting (token colors)
      syntaxCompartmentRef.current.of(highlightingEnabled ? syntaxHighlighting(createSyntaxTheme(isDarkMode)) : []),

      // Linting and error highlighting (CM6 native)
      linterCompartmentRef.current.of(linterExtensions),

      // Linting theme colors (error/warning/info)
      lintThemeCompartmentRef.current.of(createLintTheme(isDarkMode)),

      // Line wrapping (input only)
      ...(editorType === 'input' ? [EditorView.lineWrapping] : []),

      // Dynamic theme based on CSS variables
      themeCompartmentRef.current.of(createDynamicTheme(editorType, isDarkMode)),

      // Caret theme
      caretCompartmentRef.current.of(createCaretTheme(isDarkMode)),

      // Read-only mode (output editors only)
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),

      // Track changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged && !readOnly) {
          const newValue = update.state.doc.toString()
          onChange?.(newValue)
        }
      }),
    ]

    // Create initial state
    const state = EditorState.create({
      doc: value ?? '',
      extensions,
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
  }, [readOnly, showLineNumbers, theme, editorType, language, highlightingEnabled])

  // Update theme when theme context changes
  useEffect(() => {
    if (!viewRef.current) return

    const isDarkMode = theme === 'dark'

    // Update the layout theme, caret theme, syntax highlighting, and linting theme
    const effects = [
      themeCompartmentRef.current.reconfigure(createDynamicTheme(editorType, isDarkMode)),
      caretCompartmentRef.current.reconfigure(createCaretTheme(isDarkMode)),
      lintThemeCompartmentRef.current.reconfigure(createLintTheme(isDarkMode)),
    ]

    // Update syntax highlighting if it's enabled
    if (highlightingEnabled) {
      effects.push(syntaxCompartmentRef.current.reconfigure(syntaxHighlighting(createSyntaxTheme(isDarkMode))))
    }

    viewRef.current.dispatch({ effects })
  }, [theme, editorType, highlightingEnabled])

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

  // Update linting when diagnostics or formatMode changes
  useEffect(() => {
    if (!viewRef.current || !enableLinting) return

    // Create new linter with updated diagnostics
    let linterExtensions = []
    if (diagnostics && diagnostics.length > 0) {
      const formatter = createFormatterLinter(diagnostics, {
        shouldSuppressInMinifyMode: true,
        formatMode,
      })
      linterExtensions = [formatter]
    }

    // Update the linter compartment with the new linter or empty array
    // This ensures errors are cleared when there are no diagnostics
    viewRef.current.dispatch({
      effects: linterCompartmentRef.current.reconfigure(linterExtensions),
    })
  }, [diagnostics, formatMode, enableLinting])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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
            left: `${gutterWidth + 8}px`,
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
        style={{ flex: 1, width: '100%', overflow: 'hidden' }}
        data-testid="codemirror-editor"
      />
    </div>
  )
}
