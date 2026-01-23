import { useEffect, useRef } from 'react'
import { EditorState, Compartment, EditorSelection } from '@codemirror/state'
import { EditorView, lineNumbers, keymap } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { javascript } from '@codemirror/lang-javascript'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { autocompletion } from '@codemirror/autocomplete'
import { useTheme } from '../lib/ThemeContext'
import { createFormatterLinter, createLintTheme } from '../lib/codemirrorLinting'

// Syntax highlight styles for JavaScript (matching CSSEditorInput pattern)
const syntaxLight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed' },
  { tag: tags.number, color: '#d97706' },
  { tag: tags.string, color: '#059669' },
  { tag: tags.comment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: tags.operator, color: '#6b7280' },
  { tag: tags.punctuation, color: '#9ca3af' },
])

const syntaxDark = HighlightStyle.define([
  { tag: tags.keyword, color: '#d8b4fe' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.string, color: '#a7f3d0' },
  { tag: tags.comment, color: '#9aa5ce', fontStyle: 'italic' },
  { tag: tags.operator, color: '#9ca3af' },
  { tag: tags.punctuation, color: '#6b7280' },
])

// Create dynamic theme with proper CM6 structure and dark mode support
function createDynamicTheme(isDarkMode = false) {
  const root = document.documentElement
  const vars = {
    backgroundSecondary: getComputedStyle(root).getPropertyValue('--color-background-secondary').trim(),
    backgroundTertiary: getComputedStyle(root).getPropertyValue('--color-background-tertiary').trim(),
    textPrimary: getComputedStyle(root).getPropertyValue('--color-text-primary').trim(),
    textSecondary: getComputedStyle(root).getPropertyValue('--color-text-secondary').trim(),
    border: getComputedStyle(root).getPropertyValue('--color-border').trim(),
  }

  // In dark mode, use darker background to match output preview
  const editorBackground = isDarkMode ? '#1a1a1a' : vars.backgroundSecondary

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
      backgroundColor: 'transparent',
      color: vars.textSecondary,
      border: 'none',
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
      backgroundColor: 'transparent',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgba(0, 102, 204, 0.2)',
    },
    '.cm-panel': {
      backgroundColor: vars.backgroundSecondary,
      borderColor: vars.border,
      fontSize: '12px',
    },
    '.cm-panel.cm-search': {
      padding: '8px 12px',
    },
    '.cm-panel input': {
      fontSize: '12px',
      padding: '6px 8px',
      backgroundColor: vars.backgroundTertiary,
      color: vars.textPrimary,
      borderColor: vars.border,
    },
    '.cm-panel button': {
      fontSize: '12px',
      padding: '6px 10px',
    },
  })
}

// Light mode caret: Black cursor
const caretThemeLight = EditorView.theme({
  '.cm-cursor': {
    borderLeftColor: '#000000',
    borderLeftWidth: '2px',
    marginLeft: '-1px',
  },
})

// Dark mode caret: White cursor with dark flag for proper theme scoping
const caretThemeDark = EditorView.theme({
  '.cm-cursor': {
    borderLeftColor: '#ffffff',
    borderLeftWidth: '2px',
    marginLeft: '-1px',
  },
}, { dark: true })

// Create the appropriate caret theme based on current theme
function createCaretTheme(isDarkMode) {
  return isDarkMode ? caretThemeDark : caretThemeLight
}

// Create syntax highlighting theme based on current theme
function createSyntaxTheme(isDarkMode) {
  return isDarkMode ? syntaxDark : syntaxLight
}

// Custom tab handler that inserts actual tab characters
const insertTabCharacter = (view) => {
  const state = view.state
  const changes = state.changeByRange(range => ({
    changes: { from: range.from, to: range.to, insert: '\t' },
    range: EditorSelection.cursor(range.from + 1),
  }))
  view.dispatch(changes)
  return true
}

// JavaScript global keywords and methods for autocomplete
const JS_COMPLETIONS = [
  // Global objects
  'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
  'Object', 'Promise', 'RegExp', 'String', 'Symbol', 'WeakMap', 'WeakSet',
  'ArrayBuffer', 'DataView', 'Float32Array', 'Float64Array', 'Int8Array',
  'Int16Array', 'Int32Array', 'Uint8Array', 'Uint16Array', 'Uint32Array',
  'Uint8ClampedArray', 'BigInt64Array', 'BigUint64Array', 'Map', 'Set',

  // Global functions
  'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent',
  'eval', 'isFinite', 'isNaN', 'parseFloat', 'parseInt', 'setTimeout',
  'setInterval', 'clearTimeout', 'clearInterval', 'requestAnimationFrame',
  'cancelAnimationFrame',

  // Global properties
  'undefined', 'null', 'Infinity', 'NaN', 'globalThis', 'console',

  // Common methods
  'console.log', 'console.error', 'console.warn', 'console.info',
  'Array.from', 'Array.isArray', 'Object.assign', 'Object.create',
  'Object.defineProperty', 'Object.entries', 'Object.keys', 'Object.values',
  'JSON.parse', 'JSON.stringify', 'Math.abs', 'Math.ceil', 'Math.floor',
  'Math.max', 'Math.min', 'Math.pow', 'Math.random', 'Math.round',
  'Math.sqrt', 'String.fromCharCode',

  // DOM APIs
  'document', 'window', 'navigator', 'location', 'history',
  'document.getElementById', 'document.querySelector', 'document.querySelectorAll',
  'document.createElement', 'document.addEventListener',

  // Keywords
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
  'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends',
  'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
  'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'static', 'get', 'set',

  // Literals
  'true', 'false',
]

export default function JSEditorInput({ value = '', onChange = null, diagnostics = [] }) {
  const { theme } = useTheme()
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const valueRef = useRef(value)
  const themeCompartmentRef = useRef(new Compartment())
  const caretCompartmentRef = useRef(new Compartment())
  const syntaxCompartmentRef = useRef(new Compartment())
  const lintThemeCompartmentRef = useRef(new Compartment())
  const linterCompartmentRef = useRef(new Compartment())

  // Keep valueRef in sync with props
  useEffect(() => {
    valueRef.current = value
  }, [value])

  // Initialize editor and set up extensions
  useEffect(() => {
    if (!editorRef.current) return

    const isDarkMode = theme === 'dark'

    // Create linter if diagnostics are available
    let linterExtensions = []
    if (diagnostics && diagnostics.length > 0) {
      const formatter = createFormatterLinter(diagnostics, {
        shouldSuppressInMinifyMode: false,
        formatMode: 'beautify',
      })
      linterExtensions = [formatter]
    }

    // Build extensions list - matching CSSEditorInput pattern
    const extensions = [
      // Line number gutter
      lineNumbers(),

      // History/Undo support
      history(),

      // Keyboard shortcuts (undo/redo, find, indent, select all, copy, paste, etc.)
      keymap.of([
        { key: 'Tab', run: insertTabCharacter }, // Tab key inserts actual tab character
        ...historyKeymap,       // Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z (redo), Ctrl+Y (redo)
        ...defaultKeymap,       // copy, paste, select all, arrow keys, etc.
        ...searchKeymap         // Ctrl/Cmd+F (find), Ctrl/Cmd+G (find next)
      ]),

      // JavaScript language support
      javascript(),

      // Autocomplete for JavaScript
      autocompletion({
        override: [
          (context) => {
            const before = context.matchBefore(/[\w$_]*/);
            if (!before) return null;

            const word = before.text;
            if (word.length === 0) return null;

            // Filter completions that start with what the user typed
            const completions = JS_COMPLETIONS
              .filter(item => item.toLowerCase().startsWith(word.toLowerCase()))
              .map(item => ({
                label: item,
                type: 'keyword',
                apply: item,
              }))

            if (completions.length === 0) return null;

            return {
              from: before.from,
              options: completions,
            }
          }
        ],
      }),

      // Syntax highlighting (token colors)
      syntaxCompartmentRef.current.of(syntaxHighlighting(createSyntaxTheme(isDarkMode))),

      // Linting and error highlighting (CM6 native)
      linterCompartmentRef.current.of(linterExtensions),

      // Linting theme colors (error/warning/info)
      lintThemeCompartmentRef.current.of(createLintTheme(isDarkMode)),

      // Line wrapping
      EditorView.lineWrapping,

      // Dynamic theme based on CSS variables
      themeCompartmentRef.current.of(createDynamicTheme(isDarkMode)),

      // Caret theme
      caretCompartmentRef.current.of(createCaretTheme(isDarkMode)),

      // Track changes
      EditorView.updateListener.of((update) => {
        if (update.docChanged && onChange) {
          onChange(update.state.doc.toString())
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
  }, [])

  // Update theme when theme context changes
  useEffect(() => {
    if (!viewRef.current) return

    const isDarkMode = theme === 'dark'

    // Update the layout theme, caret theme, syntax highlighting, and linting theme
    const effects = [
      themeCompartmentRef.current.reconfigure(createDynamicTheme(isDarkMode)),
      caretCompartmentRef.current.reconfigure(createCaretTheme(isDarkMode)),
      syntaxCompartmentRef.current.reconfigure(syntaxHighlighting(createSyntaxTheme(isDarkMode))),
      lintThemeCompartmentRef.current.reconfigure(createLintTheme(isDarkMode)),
    ]

    viewRef.current.dispatch({ effects })
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

  // Update linting when diagnostics change
  useEffect(() => {
    if (!viewRef.current) return

    // Create new linter with updated diagnostics
    let linterExtensions = []
    if (diagnostics && diagnostics.length > 0) {
      const formatter = createFormatterLinter(diagnostics, {
        shouldSuppressInMinifyMode: false,
        formatMode: 'beautify',
      })
      linterExtensions = [formatter]
    }

    // Update the linter compartment with the new linter or empty array
    viewRef.current.dispatch({
      effects: linterCompartmentRef.current.reconfigure(linterExtensions),
    })
  }, [diagnostics])

  return (
    <div
      ref={editorRef}
      style={{
        flex: 1,
        width: '100%',
        overflow: 'hidden',
        height: '100%',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
      }}
    />
  )
}
