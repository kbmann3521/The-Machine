import { EditorView } from '@codemirror/view'

export const createCustomTheme = (theme) => {
  const isDark = theme === 'dark'
  
  const colors = {
    light: {
      background: 'var(--color-background-secondary)',
      foreground: 'var(--color-text-primary)',
      selection: 'rgba(0, 102, 204, 0.15)',
      cursor: 'var(--color-text-primary)',
      lineNumber: 'var(--color-text-secondary)',
      lineNumberBackground: 'var(--color-background-primary)',
      gutterBackground: 'var(--color-background-primary)',
      gutterBorder: 'var(--color-border)',
      keyword: '#0066cc',
      string: '#22863a',
      number: '#d4a300',
      comment: '#6a737d',
      atom: '#c41e3a',
    },
    dark: {
      background: 'var(--color-background-secondary)',
      foreground: 'var(--color-text-primary)',
      selection: 'rgba(0, 102, 204, 0.25)',
      cursor: 'var(--color-text-primary)',
      lineNumber: 'var(--color-text-secondary)',
      lineNumberBackground: 'var(--color-background-primary)',
      gutterBackground: 'var(--color-background-primary)',
      gutterBorder: 'var(--color-border)',
      keyword: '#61dafb',
      string: '#98c379',
      number: '#e8a900',
      comment: '#5c6370',
      atom: '#c678dd',
    }
  }

  const colorScheme = colors[theme] || colors.light

  const themeOptions = {
    '.cm-content': {
      backgroundColor: colorScheme.background,
      color: colorScheme.foreground,
      fontFamily: "'Courier New', monospace",
      fontSize: '13px',
      caretColor: colorScheme.cursor,
    },
    '.cm-gutters': {
      backgroundColor: colorScheme.gutterBackground,
      borderRight: `1px solid ${colorScheme.gutterBorder}`,
      color: colorScheme.lineNumber,
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: colorScheme.lineNumber,
    },
    '.cm-cursor': {
      borderLeftColor: colorScheme.cursor,
    },
    '.cm-selection': {
      backgroundColor: colorScheme.selection,
    },
    '.cm-selectionMatch': {
      backgroundColor: colorScheme.selection,
    },
    '.cm-activeLine': {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    },
    '.cm-matchingBracket': {
      outline: `1px solid ${isDark ? '#56b6c2' : '#005cc5'}`,
      backgroundColor: isDark ? 'rgba(86, 182, 194, 0.1)' : 'rgba(0, 92, 197, 0.1)',
    },
    '.cm-nonmatchingBracket': {
      backgroundColor: isDark ? 'rgba(224, 108, 117, 0.1)' : 'rgba(196, 30, 58, 0.1)',
    },
    '.cm-searchMatch': {
      backgroundColor: isDark ? 'rgba(232, 169, 0, 0.3)' : 'rgba(212, 163, 0, 0.3)',
      outline: `1px solid ${isDark ? '#e8a900' : '#d4a300'}`,
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: isDark ? 'rgba(232, 169, 0, 0.5)' : 'rgba(212, 163, 0, 0.5)',
    },
    '.cm-keyword': {
      color: colorScheme.keyword,
    },
    '.cm-string': {
      color: colorScheme.string,
    },
    '.cm-number': {
      color: colorScheme.number,
    },
    '.cm-comment': {
      color: colorScheme.comment,
    },
    '.cm-atom': {
      color: colorScheme.atom,
    },
    '.cm-variable': {
      color: colorScheme.foreground,
    },
    '.cm-property': {
      color: colorScheme.foreground,
    },
    '.cm-operator': {
      color: isDark ? '#56b6c2' : '#005cc5',
    },
    '.cm-punctuation': {
      color: colorScheme.foreground,
    },
    '.cm-tagName': {
      color: isDark ? '#e06c75' : '#22863a',
    },
    '.cm-attributeName': {
      color: colorScheme.number,
    },
    '.cm-attributeValue': {
      color: colorScheme.string,
    },
  }

  const editorTheme = EditorView.theme(themeOptions, { dark: isDark })

  return [editorTheme]
}
