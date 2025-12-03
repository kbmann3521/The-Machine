import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

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
    }
  }

  const colorScheme = colors[theme] || colors.light

  const customHighlightStyle = HighlightStyle.define([
    { tag: t.keyword, color: isDark ? '#61dafb' : '#0066cc' },
    { tag: t.atom, color: isDark ? '#c678dd' : '#c41e3a' },
    { tag: t.number, color: isDark ? '#e8a900' : '#d4a300' },
    { tag: t.string, color: isDark ? '#98c379' : '#22863a' },
    { tag: t.variable, color: colorScheme.foreground },
    { tag: t.variableName, color: isDark ? '#abb2bf' : '#24292e' },
    { tag: t.property, color: isDark ? '#abb2bf' : '#24292e' },
    { tag: t.operator, color: isDark ? '#56b6c2' : '#005cc5' },
    { tag: t.comment, color: isDark ? '#5c6370' : '#6a737d' },
    { tag: t.punctuation, color: isDark ? '#abb2bf' : '#24292e' },
    { tag: t.className, color: isDark ? '#e8a900' : '#d4a300' },
    { tag: t.tagName, color: isDark ? '#e06c75' : '#22863a' },
    { tag: t.attributeName, color: isDark ? '#e8a900' : '#d4a300' },
    { tag: t.attributeValue, color: isDark ? '#98c379' : '#22863a' },
    { tag: t.brace, color: isDark ? '#abb2bf' : '#24292e' },
  ])

  const themeOptions = {
    '.cm-content': {
      backgroundColor: colorScheme.background,
      color: colorScheme.foreground,
      fontFamily: "'Courier New', monospace",
      fontSize: '13px',
    },
    '.cm-gutters': {
      backgroundColor: colorScheme.gutterBackground,
      borderRight: `1px solid ${colorScheme.gutterBorder}`,
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
    '.cm-diagnostic-error .cm-diagnosticText::before': {
      color: isDark ? '#e06c75' : '#cb2431',
    },
  }

  const theme = EditorView.theme(themeOptions, { dark: isDark })

  return [theme, syntaxHighlighting(customHighlightStyle)]
}
