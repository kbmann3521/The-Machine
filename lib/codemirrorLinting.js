/**
 * ============================================================================
 * CodeMirror 6 Linting System
 * ============================================================================
 *
 * This module provides utilities for integrating your diagnostic system
 * with CodeMirror 6's native linting and error highlighting.
 *
 * Key responsibilities:
 * 1. Convert line/column diagnostics to document offsets
 * 2. Map your severity types to CM6 severity levels
 * 3. Create theme definitions for different severities (error/warning/info)
 * 4. Provide linter factories for each formatter tool
 */

import { linter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'

/**
 * Convert line/column (1-based) to document offset (0-based)
 *
 * CodeMirror internally uses flat document offsets, not line/column pairs.
 * This adapter bridges your diagnostic format to CM6's format.
 *
 * @param {EditorState} state - CM6 EditorState
 * @param {number} line - 1-based line number
 * @param {number} column - 1-based column number
 * @returns {number} 0-based document offset
 */
export function lineColToOffset(state, line, column) {
  try {
    // CM6 uses 1-based line indexing internally
    // line() method expects 1-based line number
    if (line < 1 || line > state.doc.lines) {
      console.warn('[lineColToOffset] Line number out of range:', { line, totalLines: state.doc.lines });
      return 0;
    }

    const lineObj = state.doc.line(line)
    if (!lineObj) {
      console.warn('[lineColToOffset] Failed to get line object:', { line });
      return 0;
    }

    // lineObj.from is the absolute offset of the start of this line
    // column is 1-based, so subtract 1 to get 0-based offset within line
    const offset = lineObj.from + Math.max(0, column - 1)

    // Ensure we don't go past the end of the document
    const result = Math.min(offset, state.doc.length);
    console.log('[lineColToOffset] Converted:', { line, column, lineStart: lineObj.from, offset: result });
    return result;
  } catch (error) {
    console.warn('[lineColToOffset] Error converting line/column to offset:', { line, column, error })
    return 0
  }
}

/**
 * Map your diagnostic severity to CM6 severity levels
 *
 * Your system has:
 *   - type: "error" | "warning"
 *   - category: "syntax" | "structure" | "lint"
 *
 * CM6 expects:
 *   - severity: "error" | "warning" | "info"
 *
 * Rule:
 *   - Structural/syntax errors (type="error") → "error" (red, wavy)
 *   - Lint warnings (category="lint") → "warning" (yellow, wavy)
 *   - Other warnings → "warning"
 *   - Info messages → "info" (blue, dotted)
 *
 * @param {Object} diagnostic - Your diagnostic object
 * @returns {string} CM6 severity level
 */
export function mapSeverity(diagnostic) {
  // Structural and syntax errors are always "error"
  if (diagnostic.type === 'error') {
    return 'error'
  }

  // Lint warnings are "warning"
  if (diagnostic.category === 'lint' || diagnostic.type === 'warning') {
    return 'warning'
  }

  // Info messages
  if (diagnostic.type === 'info') {
    return 'info'
  }

  // Default to warning if uncertain
  return 'warning'
}

/**
 * Dark mode theme for linting diagnostics
 * Applies colors to underlines, gutter markers, and hover tooltips
 * Gutter markers are hidden (display: none)
 * Tooltips appear at cursor on hover
 */
export const lintThemeDark = EditorView.theme(
  {
    /* Error underline: CM6 default with cursor indicator */
    '.cm-lintRange-error': {
      cursor: 'help',
    },

    /* Warning underline: CM6 default with cursor indicator */
    '.cm-lintRange-warning': {
      cursor: 'help',
    },

    /* Info underline: CM6 default with cursor indicator */
    '.cm-lintRange-info': {
      cursor: 'help',
    },

    /* Hide gutter markers - only show underlines */
    '.cm-lintMarker-error': {
      display: 'none',
    },

    '.cm-lintMarker-warning': {
      display: 'none',
    },

    '.cm-lintMarker-info': {
      display: 'none',
    },

    /* Style tooltip panel */
    '.cm-tooltip.cm-lint-tooltip': {
      backgroundColor: 'var(--color-background-tertiary)',
      border: '1px solid var(--color-border)',
      borderRadius: '4px',
      color: 'var(--color-text-primary)',
      fontSize: '12px',
      padding: '8px 12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    },

    /* Tooltip arrow styling */
    '.cm-tooltip.cm-lint-tooltip > :last-child': {
      color: 'var(--color-border)',
    },
  },
  { dark: true }
)

/**
 * Light mode theme for linting diagnostics
 * Uses slightly darker colors for contrast on light backgrounds
 * Gutter markers are hidden (display: none)
 * Tooltips appear at cursor on hover
 */
export const lintThemeLight = EditorView.theme({
  /* Error underline: CM6 default with cursor indicator */
  '.cm-lintRange-error': {
    cursor: 'help',
  },

  /* Warning underline: CM6 default with cursor indicator */
  '.cm-lintRange-warning': {
    cursor: 'help',
  },

  /* Info underline: CM6 default with cursor indicator */
  '.cm-lintRange-info': {
    cursor: 'help',
  },

  /* Hide gutter markers - only show underlines */
  '.cm-lintMarker-error': {
    display: 'none',
  },

  '.cm-lintMarker-warning': {
    display: 'none',
  },

  '.cm-lintMarker-info': {
    display: 'none',
  },

  /* Style tooltip panel */
  '.cm-tooltip.cm-lint-tooltip': {
    backgroundColor: 'var(--color-background-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: '4px',
    color: 'var(--color-text-primary)',
    fontSize: '12px',
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },

  /* Tooltip arrow styling */
  '.cm-tooltip.cm-lint-tooltip > :last-child': {
    color: 'var(--color-border)',
  },
})

/**
 * Select the appropriate lint theme based on dark mode flag
 *
 * @param {boolean} isDarkMode - Whether dark mode is active
 * @returns {EditorView.theme} The appropriate theme
 */
export function createLintTheme(isDarkMode) {
  return isDarkMode ? lintThemeDark : lintThemeLight
}

/**
 * Expand a diagnostic position to cover the entire word/identifier
 *
 * Instead of underlining just the first character, this extends the range
 * to cover the whole identifier (e.g., userName, fetchUserData).
 *
 * This makes the underline look intentional and professional,
 * matching how VS Code and other professional tools highlight errors.
 *
 * @param {EditorState} state - CM6 EditorState
 * @param {number} pos - The character offset (from lineColToOffset)
 * @returns {Object} { from, to } expanded to word boundaries
 */
export function expandToWord(state, pos) {
  try {
    const line = state.doc.lineAt(pos)
    const lineText = line.text
    const offset = pos - line.from

    // Find the start of the word: search backwards from current position
    // Matches: word characters (\w = [a-zA-Z0-9_])
    const leftMatch = lineText.slice(0, offset).search(/\w+$/)
    const wordStart = leftMatch === -1 ? offset : leftMatch

    // Find the end of the word: search forwards from current position
    // Matches: non-word characters, or end of line
    const rightMatch = lineText.slice(offset).search(/\W/)
    const wordEnd = rightMatch === -1 ? lineText.length : offset + rightMatch

    return {
      from: line.from + wordStart,
      to: line.from + wordEnd,
    }
  } catch (error) {
    console.warn('Error expanding to word:', { pos, error })
    // Fallback: just underline the single character
    return { from: pos, to: pos + 1 }
  }
}

/**
 * Create a linter function for your formatter tool
 *
 * This is the main integration point between your diagnostics and CM6.
 * It takes your diagnostic array and converts it to CM6 format.
 *
 * @param {Array<Object>} diagnosticsArray - Your diagnostics (with line/column)
 * @param {Object} options - Configuration options
 *   - shouldSuppressInMinifyMode: boolean (default: true)
 *   - formatMode: 'beautify' | 'minify' | 'compact' (default: 'beautify')
 * @returns {Function} CM6 linter function
 */
export function createFormatterLinter(diagnosticsArray, options = {}) {
  const {
    shouldSuppressInMinifyMode = true,
    formatMode = 'beautify',
  } = options

  console.log('[createFormatterLinter] Creating linter with', diagnosticsArray.length, 'diagnostics');
  if (diagnosticsArray.length > 0) {
    console.log('[createFormatterLinter] First diagnostic:', diagnosticsArray[0]);
  }

  return linter((view) => {
    const cmDiagnostics = []

    // If in minify mode and we should suppress readability heuristics
    const isMinifyMode = formatMode === 'minify'
    const suppressReadability = shouldSuppressInMinifyMode && isMinifyMode

    console.log('[createFormatterLinter] Linter function called with', view.state.doc.lines, 'lines in editor');

    // Process each diagnostic from your system
    for (const d of diagnosticsArray) {
      // Skip readability heuristics in minify mode
      if (suppressReadability && d.category === 'lint') {
        continue
      }

      // Must have line and column to convert (check explicitly for null/undefined, not falsy)
      if (d.line === null || d.line === undefined || d.column === null || d.column === undefined) {
        console.log('[createFormatterLinter] Skipping diagnostic - no line/column:', d);
        continue
      }

      try {
        console.log('[createFormatterLinter] Processing diagnostic:', { line: d.line, column: d.column, message: d.message });
        const from = lineColToOffset(view.state, d.line, d.column);
        console.log('[createFormatterLinter] Converted to offset:', from);

        // Fix for underline placement:
        // If columnEnd is provided (from YAML validation), use it for precise highlighting.
        // Otherwise, expand to word boundaries (better for lint warnings).
        // This prevents misplaced underlines and matches IDE behavior (VS Code, ESLint, etc.)
        let to
        if (d.columnEnd && typeof d.columnEnd === 'number') {
          // YAML validation errors have refined columnEnd from source text analysis
          to = lineColToOffset(view.state, d.line, d.columnEnd)
        } else {
          // Linting warnings use word expansion to highlight full identifiers
          const range = expandToWord(view.state, from)
          to = range.to
        }

        to = Math.min(to, view.state.doc.length)

        cmDiagnostics.push({
          from: Math.max(0, from),
          to: Math.max(from, to),
          severity: mapSeverity(d),
          message: d.message || 'Unknown diagnostic',
        })
        console.log('[createFormatterLinter] Added diagnostic:', { from: Math.max(0, from), to: Math.max(from, to) });
      } catch (error) {
        console.warn('[createFormatterLinter] Failed to process diagnostic:', d, error)
      }
    }

    console.log('[createFormatterLinter] Returning', cmDiagnostics.length, 'CM diagnostics');
    return cmDiagnostics
  })
}

/**
 * Create a linter for a specific formatter tool
 *
 * This factory function reduces boilerplate when you have tool-specific
 * linting configurations.
 *
 * Example:
 *   const xmlLinter = createToolLinter(xmlDiagnostics, {
 *     tool: 'xml',
 *     suppressInMinifyMode: true,
 *     formatMode: selectedMode
 *   })
 *
 * @param {Array<Object>} diagnosticsArray - Tool-specific diagnostics
 * @param {Object} config - Tool configuration
 * @returns {Function} CM6 linter function ready to add to extensions
 */
export function createToolLinter(diagnosticsArray, config = {}) {
  const {
    tool = 'unknown',
    suppressInMinifyMode = true,
    formatMode = 'beautify',
  } = config

  return createFormatterLinter(diagnosticsArray, {
    shouldSuppressInMinifyMode: suppressInMinifyMode,
    formatMode,
  })
}

export default {
  lineColToOffset,
  mapSeverity,
  createLintTheme,
  createFormatterLinter,
  createToolLinter,
  lintThemeDark,
  lintThemeLight,
}
