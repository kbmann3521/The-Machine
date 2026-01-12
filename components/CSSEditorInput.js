import { useEffect, useRef } from 'react'
import { EditorState, Compartment, EditorSelection } from '@codemirror/state'
import { EditorView, lineNumbers, Decoration, ViewPlugin, MatchDecorator, WidgetType } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap, historyKeymap, history } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { css } from '@codemirror/lang-css'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { autocompletion } from '@codemirror/autocomplete'
import { useTheme } from '../lib/ThemeContext'
import { createFormatterLinter, createLintTheme } from '../lib/codemirrorLinting'

// Syntax highlight styles for CSS
const syntaxLight = HighlightStyle.define([
  { tag: tags.keyword, color: '#7c3aed' },
  { tag: tags.atom, color: '#7c3aed' },
  { tag: tags.number, color: '#d97706' },
  { tag: tags.string, color: '#059669' },
  { tag: tags.comment, color: '#9ca3af', fontStyle: 'italic' },
  { tag: tags.operator, color: '#6b7280' },
  { tag: tags.punctuation, color: '#9ca3af' },
  { tag: tags.propertyName, color: '#2563eb' },
])

const syntaxDark = HighlightStyle.define([
  { tag: tags.keyword, color: '#d8b4fe' },
  { tag: tags.atom, color: '#d8b4fe' },
  { tag: tags.number, color: '#fbbf24' },
  { tag: tags.string, color: '#a7f3d0' },
  { tag: tags.comment, color: '#9aa5ce', fontStyle: 'italic' },
  { tag: tags.operator, color: '#9ca3af' },
  { tag: tags.punctuation, color: '#6b7280' },
  { tag: tags.propertyName, color: '#7dd3fc' },
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

// CSS color values (named colors + common hex/rgb values)
const CSS_COLORS = [
  // Named colors
  'aliceblue', 'antiquewhite', 'aqua', 'aquamarine', 'azure',
  'beige', 'bisque', 'black', 'blanchedalmond', 'blue',
  'blueviolet', 'brown', 'burlywood',
  'cadetblue', 'chartreuse', 'chocolate', 'coral', 'cornflowerblue',
  'cornsilk', 'crimson', 'cyan',
  'darkblue', 'darkcyan', 'darkgoldenrod', 'darkgray', 'darkgreen',
  'darkgrey', 'darkkhaki', 'darkmagenta', 'darkolivegreen', 'darkorange',
  'darkorchid', 'darkred', 'darksalmon', 'darkseagreen', 'darkslateblue',
  'darkslategray', 'darkslategrey', 'darkturquoise', 'darkviolet', 'deeppink',
  'deepskyblue', 'dimgray', 'dimgrey', 'dodgerblue',
  'firebrick', 'floralwhite', 'forestgreen', 'fuchsia',
  'gainsboro', 'ghostwhite', 'gold', 'goldenrod', 'gray',
  'green', 'greenyellow', 'grey',
  'honeydew', 'hotpink',
  'indianred', 'indigo', 'ivory',
  'khaki',
  'lavender', 'lavenderblush', 'lawngreen', 'lemonchiffon', 'lightblue',
  'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen',
  'lightgrey', 'lightpink', 'lightsalmon', 'lightseagreen', 'lightskyblue',
  'lightslategray', 'lightslategrey', 'lightsteelblue', 'lightyellow', 'lime',
  'limegreen', 'linen',
  'magenta', 'maroon', 'mediumaquamarine', 'mediumblue', 'mediumorchid',
  'mediumpurple', 'mediumseagreen', 'mediumslateblue', 'mediumspringgreen',
  'mediumturquoise', 'mediumvioletred', 'midnightblue', 'mintcream',
  'mistyrose', 'moccasin',
  'navajowhite', 'navy',
  'oldlace', 'olive', 'olivedrab', 'orange', 'orangered', 'orchid',
  'palegoldenrod', 'palegreen', 'paleturquoise', 'palevioletred', 'papayawhip',
  'peachpuff', 'peru', 'pink', 'plum', 'powderblue', 'purple',
  'red', 'rosybrown', 'royalblue',
  'saddlebrown', 'salmon', 'sandybrown', 'seagreen', 'seashell', 'sienna',
  'silver', 'skyblue', 'slateblue', 'slategray', 'slategrey', 'snow',
  'springgreen', 'steelblue',
  'tan', 'teal', 'thistle', 'tomato', 'turquoise',
  'violet',
  'wheat', 'white', 'whitesmoke',
  'yellow', 'yellowgreen',
  'transparent', 'currentcolor', 'inherit',

  // Common hex colors
  '#000', '#000000', '#fff', '#ffffff',
  '#f00', '#ff0000', '#0f0', '#00ff00', '#00f', '#0000ff',
  '#f0f', '#ff00ff', '#0ff', '#00ffff',
  '#808080', '#c0c0c0',

  // RGB/RGBA examples
  'rgb(0,0,0)', 'rgb(255,255,255)', 'rgb(255,0,0)', 'rgb(0,255,0)', 'rgb(0,0,255)',
  'rgba(0,0,0,1)', 'rgba(255,255,255,1)', 'rgba(255,0,0,0.5)',

  // HSL/HSLA examples
  'hsl(0,0%,0%)', 'hsl(0,0%,100%)', 'hsl(0,100%,50%)',
  'hsla(0,0%,0%,1)', 'hsla(0,100%,50%,0.5)',
]

// CSS properties autocomplete list
const CSS_PROPERTIES = [
  // Layout & Display
  'display', 'visibility', 'opacity', 'z-index',
  'position', 'top', 'right', 'bottom', 'left',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-style', 'border-color', 'border-radius',
  'box-sizing', 'overflow', 'overflow-x', 'overflow-y', 'clip',

  // Flexbox
  'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content',
  'align-items', 'align-content', 'gap', 'row-gap', 'column-gap',
  'flex-grow', 'flex-shrink', 'flex-basis', 'align-self',

  // Grid
  'grid', 'grid-template', 'grid-template-columns', 'grid-template-rows',
  'grid-template-areas', 'grid-auto-columns', 'grid-auto-rows',
  'grid-auto-flow', 'grid-column', 'grid-row', 'grid-column-start',
  'grid-column-end', 'grid-row-start', 'grid-row-end', 'grid-area',

  // Text & Font
  'color', 'background', 'background-color', 'background-image',
  'background-position', 'background-size', 'background-repeat',
  'font', 'font-family', 'font-size', 'font-weight', 'font-style',
  'font-variant', 'font-stretch', 'line-height', 'letter-spacing',
  'word-spacing', 'text-align', 'text-decoration', 'text-decoration-color',
  'text-decoration-style', 'text-decoration-line', 'text-transform',
  'text-indent', 'text-shadow', 'white-space', 'word-break',
  'word-wrap', 'overflow-wrap', 'text-orientation', 'writing-mode',

  // Backgrounds & Borders
  'background-attachment', 'background-blend-mode', 'background-clip',
  'background-origin', 'border-collapse', 'border-image', 'border-image-outset',
  'border-image-repeat', 'border-image-slice', 'border-image-source',
  'border-image-width', 'border-spacing', 'box-shadow', 'outline',
  'outline-width', 'outline-style', 'outline-color', 'outline-offset',

  // Transform & Transition
  'transform', 'transform-origin', 'transform-style', 'perspective',
  'perspective-origin', 'transition', 'transition-property', 'transition-duration',
  'transition-timing-function', 'transition-delay', 'animation',
  'animation-name', 'animation-duration', 'animation-timing-function',
  'animation-delay', 'animation-iteration-count', 'animation-direction',
  'animation-fill-mode', 'animation-play-state',

  // Filters & Effects
  'filter', 'backdrop-filter', 'mix-blend-mode',

  // Lists & Counters
  'list-style', 'list-style-type', 'list-style-position', 'list-style-image',
  'counter-reset', 'counter-increment',

  // Tables
  'empty-cells', 'table-layout', 'vertical-align',

  // Other
  'cursor', 'user-select', 'pointer-events', 'touch-action',
  'resize', 'contain', 'content', 'quotes', 'caret-color',
  'accent-color', 'all', 'direction', 'unicode-bidi',
  'hyphens', 'lang', 'page', 'paint-order',
  'tab-size', 'text-underline-offset', 'text-underline-position',

  // Scroll
  'scroll-behavior', 'scroll-snap-type', 'scroll-snap-align',
  'scroll-snap-stop', 'scroll-margin', 'scroll-margin-top',
  'scroll-margin-right', 'scroll-margin-bottom', 'scroll-margin-left',
  'scroll-padding', 'scroll-padding-top', 'scroll-padding-right',
  'scroll-padding-bottom', 'scroll-padding-left',

  // Scrollbar
  'scrollbar-width', 'scrollbar-color',

  // Will-change
  'will-change',

  // Mask
  'mask', 'mask-image', 'mask-position', 'mask-size', 'mask-repeat',
  'mask-origin', 'mask-clip', 'mask-composite',

  // SVG
  'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset',
  'stroke-linecap', 'stroke-linejoin', 'stroke-miterlimit', 'fill-rule',
  'clip-rule', 'paint-order', 'text-anchor', 'alignment-baseline',
]

// Test selectors - comprehensive list of CSS selectors (can be replaced with actual rules data later)
const TEST_SELECTORS = [
  // HTML Elements
  'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio',
  'b', 'base', 'basefont', 'bdi', 'bdo', 'big', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup',
  'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt',
  'em', 'embed',
  'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins',
  'kbd', 'keygen',
  'label', 'legend', 'li', 'link',
  'main', 'map', 'mark', 'marquee', 'menu', 'menuitem', 'meta', 'meter',
  'nav', 'noindex', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'picture', 'pre', 'progress',
  'q',
  's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
  'u', 'ul',
  'var', 'video',
  'wbr',

  // Pseudo-classes
  ':active',
  ':any',
  ':blank',
  ':checked',
  ':current',
  ':default',
  ':defined',
  ':disabled',
  ':empty',
  ':enabled',
  ':first',
  ':first-child',
  ':first-of-type',
  ':focus',
  ':focus-visible',
  ':focus-within',
  ':future',
  ':hover',
  ':indeterminate',
  ':in-range',
  ':invalid',
  ':is',
  ':lang',
  ':last-child',
  ':last-of-type',
  ':left',
  ':link',
  ':local-link',
  ':matches',
  ':modal',
  ':not',
  ':nth-child',
  ':nth-of-type',
  ':nth-last-child',
  ':nth-last-of-type',
  ':only-child',
  ':only-of-type',
  ':optional',
  ':out-of-range',
  ':past',
  ':paused',
  ':played',
  ':playing',
  ':placeholder-shown',
  ':read-only',
  ':read-write',
  ':required',
  ':right',
  ':root',
  ':scope',
  ':seeking',
  ':stalled',
  ':target',
  ':target-within',
  ':user-invalid',
  ':valid',
  ':visited',
  ':where',

  // Pseudo-elements
  '::after',
  '::backdrop',
  '::before',
  '::cue',
  '::cue-region',
  '::first-letter',
  '::first-line',
  '::grammar-error',
  '::marker',
  '::placeholder',
  '::selection',
  '::slotted',
  '::spelling-error',

  // Vendor-specific Pseudo-classes (Webkit)
  ':-webkit-any',
  ':-webkit-autofill',
  ':-webkit-autofill-strong',
  ':-webkit-drag',

  // Vendor-specific Pseudo-classes (Mozilla)
  ':-moz-broken',
  ':-moz-deck',
  ':-moz-loading',
  ':-moz-locale-dir(ltr)',
  ':-moz-locale-dir(rtl)',
  ':-moz-read-only',
  ':-moz-read-write',
  ':-moz-suppressed',
  ':-moz-ui-invalid',
  ':-moz-ui-valid',
  ':-moz-user-disabled',

  // Vendor-specific Pseudo-elements (Webkit)
  '::-webkit-calendar-picker-indicator',
  '::-webkit-clear-button',
  '::-webkit-color-swatch',
  '::-webkit-color-swatch-wrapper',
  '::-webkit-details-marker',
  '::-webkit-file-upload-button',
  '::-webkit-inner-spin-button',
  '::-webkit-input-placeholder',
  '::-webkit-media-controls',
  '::-webkit-media-controls-current-time-display',
  '::-webkit-media-controls-enclosure',
  '::-webkit-media-controls-fullscreen-button',
  '::-webkit-media-controls-mute-button',
  '::-webkit-media-controls-overlay-enclosure',
  '::-webkit-media-controls-panel',
  '::-webkit-media-controls-play-button',
  '::-webkit-media-controls-timeline',
  '::-webkit-media-controls-timeline-container',
  '::-webkit-media-controls-time-remaining-display',
  '::-webkit-media-controls-toggle-closed-captions-button',
  '::-webkit-media-controls-volume-slider',
  '::-webkit-media-controls-volume-slider-container',
  '::-webkit-media-slider-container',
  '::-webkit-media-slider-thumb',
  '::-webkit-media-text-track-container',
  '::-webkit-media-text-track-display',
  '::-webkit-media-text-track-region',
  '::-webkit-media-text-track-region-cue',
  '::-webkit-outer-spin-button',
  '::-webkit-search-cancel-button',
  '::-webkit-search-decoration',
  '::-webkit-search-results-button',
  '::-webkit-search-results-decoration',
  '::-webkit-slider-runnable-track',
  '::-webkit-slider-thumb',
  '::-webkit-textfield-decoration-container',

  // Vendor-specific Pseudo-elements (Mozilla)
  '::-moz-color-swatch',
  '::-moz-focus-inner',
  '::-moz-list-button',
  '::-moz-number-spin-box',
  '::-moz-number-spin-down',
  '::-moz-number-spin-up',
  '::-moz-number-wrapper',
  '::-moz-progress-bar',
  '::-moz-range-progress',
  '::-moz-range-thumb',
  '::-moz-range-track',
  '::-moz-selection',

  // Vendor-specific Pseudo-elements (IE/Edge)
  '::-ms-browse',
  '::-ms-check',
  '::-ms-clear',
  '::-ms-expand',
  '::-ms-fill',
  '::-ms-fill-lower',
  '::-ms-fill-upper',
  '::-ms-reveal',
  '::-ms-thumb',
  '::-ms-ticks-after',
  '::-ms-ticks-before',
  '::-ms-tooltip',
  '::-ms-track',
  '::-ms-value',

  // Common classes and IDs
  '.container', '.wrapper', '.header', '.footer', '.main', '.content', '.sidebar',
  '.navbar', '.nav', '.menu', '.section', '.article', '.card', '.modal', '.dialog',
  '.button', '.btn', '.button-primary', '.button-secondary',
  '.text', '.text-primary', '.text-secondary', '.text-center', '.text-left', '.text-right',
  '.hidden', '.visible', '.active', '.disabled', '.loading',
  '.row', '.column', '.col', '.grid',
  '#app', '#root', '#main', '#header', '#footer', '#sidebar',

  // Attribute selectors
  '[type="text"]', '[type="button"]', '[type="checkbox"]', '[type="radio"]',
  '[disabled]', '[readonly]', '[required]',
  '[href]', '[src]', '[alt]',
  '[class*=""]', '[id^=""]', '[data-*]',
]

// Create autocomplete source for CSS selectors
function createSelectorCompletion() {
  return (context) => {
    // Match the current word being typed - just grab the actual selector text
    const before = context.matchBefore(/[\w\-.:#\[\]"'=@$*^|~]*/);
    if (!before) return null;

    // Get the word being completed
    const word = before.text;
    if (word.length === 0) return null;

    // Check if we're inside a rule (between { and })
    const doc = context.state.doc.toString();
    const cursorPos = context.pos;
    const beforeCursor = doc.substring(0, cursorPos);
    const openBraces = (beforeCursor.match(/\{/g) || []).length;
    const closeBraces = (beforeCursor.match(/\}/g) || []).length;

    // If we're inside a rule block, don't show selector completions
    if (openBraces > closeBraces) return null;

    // Filter selectors that start with what the user typed
    const completions = TEST_SELECTORS
      .filter(selector => selector.toLowerCase().startsWith(word.toLowerCase()))
      .map(selector => ({
        label: selector,
        type: 'keyword',
        apply: selector,
      }))

    if (completions.length === 0) return null;

    return {
      from: before.from,
      options: completions,
    }
  }
}

// Create autocomplete source for CSS properties
function createPropertyCompletion() {
  return (context) => {
    // Match property names (can include hyphens)
    const before = context.matchBefore(/[\w\-]*/);
    if (!before) return null;

    const word = before.text;
    if (word.length === 0) return null;

    // Check if we're inside a rule (between { and })
    const doc = context.state.doc.toString();
    const cursorPos = context.pos;
    const beforeCursor = doc.substring(0, cursorPos);
    const openBraces = (beforeCursor.match(/\{/g) || []).length;
    const closeBraces = (beforeCursor.match(/\}/g) || []).length;

    // Only show property completions if we're inside a rule block
    if (openBraces <= closeBraces) return null;

    // Don't show completions if we're after a colon (we're typing a value)
    const lastOpenBrace = beforeCursor.lastIndexOf('{');
    const ruleContent = beforeCursor.substring(lastOpenBrace);
    if (ruleContent.includes(':') && !ruleContent.substring(ruleContent.lastIndexOf(':')).includes(';')) {
      return null;
    }

    // Filter properties that start with what the user typed
    const completions = CSS_PROPERTIES
      .filter(prop => prop.toLowerCase().startsWith(word.toLowerCase()))
      .map(prop => ({
        label: prop,
        type: 'property',
        apply: prop + ': ',  // Auto-add the colon and space
      }))

    if (completions.length === 0) return null;

    return {
      from: before.from,
      options: completions,
    }
  }
}

// List of color-related CSS properties
const COLOR_PROPERTIES = [
  'color', 'background-color', 'border-color', 'outline-color',
  'text-decoration-color', 'text-shadow', 'box-shadow',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'caret-color', 'accent-color', 'fill', 'stroke',
]

// Helper function to extract color value from CSS text
// Converts named colors and various color formats to hex for the color picker
function colorToHex(color) {
  // If it's already a hex color
  if (color.startsWith('#')) {
    return color.length === 4 ? color : color;
  }

  // Common named colors to hex mapping
  const colorMap = {
    'red': '#ff0000', 'green': '#008000', 'blue': '#0000ff',
    'white': '#ffffff', 'black': '#000000', 'yellow': '#ffff00',
    'cyan': '#00ffff', 'magenta': '#ff00ff', 'silver': '#c0c0c0',
    'gray': '#808080', 'maroon': '#800000', 'olive': '#808000',
    'lime': '#00ff00', 'aqua': '#00ffff', 'teal': '#008080',
    'navy': '#000080', 'fuchsia': '#ff00ff', 'purple': '#800080',
    'transparent': '#ffffff00',
  };

  const lower = color.toLowerCase();
  if (colorMap[lower]) return colorMap[lower];

  // Try to parse rgb/rgba
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Default to black if we can't parse
  return '#000000';
}

// Helper function to get the nearest valid color value
function normalizeColorValue(color) {
  // Return the original value as-is
  return color.trim();
}

// Create a color picker widget
function createColorPickerWidget(color, onChange) {
  const widget = document.createElement('span');
  widget.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0 2px;
    vertical-align: middle;
  `;

  // Color preview square
  const preview = document.createElement('span');
  preview.style.cssText = `
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 1px solid var(--color-border);
    border-radius: 2px;
    cursor: pointer;
    background-color: ${color};
    box-sizing: border-box;
  `;

  // Hidden color input
  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = colorToHex(color);
  colorInput.style.display = 'none';

  // Handle color change
  colorInput.addEventListener('change', (e) => {
    onChange(e.target.value);
  });

  // Click preview to open color picker
  preview.addEventListener('click', () => {
    colorInput.click();
  });

  widget.appendChild(preview);
  widget.appendChild(colorInput);

  return widget;
}

// Helper to convert hex to RGB string
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})`;
  }
  return null;
}

// Helper to check if a color string is RGB format
function isRgbFormat(color) {
  return color.toLowerCase().startsWith('rgb');
}

// Color picker widget class extending WidgetType
class ColorPickerWidget extends WidgetType {
  constructor(color, view, pos, length) {
    super();
    this.color = color;
    this.view = view;
    this.pos = pos;
    this.length = length;
    this.originalColor = color;
  }

  toDOM() {
    const container = document.createElement('span');
    container.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin: 0 0px;
      vertical-align: baseline;
    `;

    // Color preview square
    const preview = document.createElement('span');
    preview.title = `Click to pick color`;
    preview.style.cssText = `
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 1px solid rgba(128, 128, 128, 0.6);
      border-radius: 2px;
      cursor: pointer;
      background-color: ${this.color};
      box-sizing: border-box;
      flex-shrink: 0;
      transition: transform 0.1s, box-shadow 0.1s;
    `;

    preview.addEventListener('mouseenter', () => {
      preview.style.transform = 'scale(1.2)';
      preview.style.boxShadow = '0 0 6px rgba(0, 0, 0, 0.4)';
    });

    preview.addEventListener('mouseleave', () => {
      preview.style.transform = 'scale(1)';
      preview.style.boxShadow = 'none';
    });

    // Hidden color input
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = colorToHex(this.color);
    colorInput.style.display = 'none';

    // Track the last replacement value to find it next time
    let lastReplacementValue = this.originalColor;

    // Handle color change with live update
    const handleColorChange = (newHexColor) => {
      // Determine what format to use based on the original color
      let replacementValue = newHexColor;

      // If original was RGB, convert back to RGB
      if (isRgbFormat(this.originalColor)) {
        replacementValue = hexToRgb(newHexColor);
      }

      // Update the color input preview
      preview.style.backgroundColor = newHexColor;

      // Update the editor text - find the current position using the last replacement value
      if (this.view) {
        const doc = this.view.state.doc.toString();
        // Find the color in the current document using the last value we replaced
        const searchStart = Math.max(0, this.pos - 20);
        const searchEnd = Math.min(doc.length, this.pos + 100);
        const searchArea = doc.substring(searchStart, searchEnd);
        const colorIndex = searchArea.indexOf(lastReplacementValue);

        if (colorIndex !== -1) {
          const actualPos = searchStart + colorIndex;
          this.view.dispatch({
            changes: {
              from: actualPos,
              to: actualPos + lastReplacementValue.length,
              insert: replacementValue,
            },
          });
          // Update tracking for next time
          lastReplacementValue = replacementValue;
        }
      }
    };

    // Handle both input (live) and change (final) events
    colorInput.addEventListener('input', (e) => {
      handleColorChange(e.target.value);
    });

    colorInput.addEventListener('change', (e) => {
      handleColorChange(e.target.value);
    });

    // Click preview to open color picker
    preview.addEventListener('click', () => {
      colorInput.click();
    });

    container.appendChild(preview);

    return container;
  }

  eq(other) {
    return other instanceof ColorPickerWidget && other.color === this.color;
  }
}

// Create color picker plugin
function createColorPickerPlugin() {
  const colorRegex = /#[0-9a-fA-F]{3,8}|rgb[a]?\([^)]+\)|hsl[a]?\([^)]+\)|(aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|transparent|currentcolor|inherit)\b/gi;

  return ViewPlugin.fromClass(
    class {
      decorations;
      view;

      constructor(view) {
        this.view = view;
        this.decorations = this.computeDecorations(view);
      }

      computeDecorations(view) {
        const decorations = [];
        const doc = view.state.doc.toString();
        let match;
        const regex = new RegExp(colorRegex.source, colorRegex.flags);

        while ((match = regex.exec(doc)) !== null) {
          decorations.push(
            Decoration.widget({
              widget: new ColorPickerWidget(match[0], view, match.index, match[0].length),
              side: 1,
            }).range(match.index, match.index)
          );
        }

        return Decoration.set(decorations);
      }

      update(update) {
        if (update.docChanged) {
          this.decorations = this.computeDecorations(update.view);
        }
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

// CSS value units and keywords
const CSS_UNITS = [
  // Absolute lengths
  'px', 'cm', 'mm', 'in', 'pt', 'pc',
  // Relative lengths
  'em', 'ex', 'ch', 'rem', 'vw', 'vh', 'vmin', 'vmax',
  // Percentages
  '%',
  // Global keywords
  'auto', 'inherit', 'initial', 'unset', 'revert',
  // Color-related values
  'transparent', 'currentColor',
  // Display values
  'block', 'inline', 'inline-block', 'flex', 'grid', 'none', 'contents',
  // Position values
  'static', 'relative', 'absolute', 'fixed', 'sticky',
  // Overflow values
  'visible', 'hidden', 'scroll', 'auto',
  // Text-align values
  'left', 'right', 'center', 'justify', 'start', 'end',
  // Float values
  'float',
  // Font weight
  'normal', 'bold', 'bolder', 'lighter',
  // Font style
  'italic', 'oblique',
  // Text decoration
  'underline', 'overline', 'line-through', 'none',
  // Transform/animation keywords
  'ease', 'linear', 'ease-in', 'ease-out', 'ease-in-out',
  // Background repeat
  'repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round',
  // Background position
  'top', 'bottom', 'left', 'right',
  // Border style
  'solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none',
  // Box sizing
  'border-box', 'content-box',
  // Cursor values
  'pointer', 'default', 'text', 'wait', 'move', 'not-allowed',
  // Whitespace
  'normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line', 'break-spaces',
]

// Create autocomplete source for CSS value units and keywords
function createValueCompletion() {
  return (context) => {
    // Match only letters for units/keywords (not numbers, which can come before units)
    // This allows "10p" to suggest "px" by matching just the "p" part
    const before = context.matchBefore(/[a-zA-Z\-]*/);
    if (!before) return null;

    const word = before.text;
    // Only show completions if user has typed at least 1 character
    if (word.length === 0) return null;

    // Check if we're inside a rule and after a colon
    const doc = context.state.doc.toString();
    const cursorPos = context.pos;
    const beforeCursor = doc.substring(0, cursorPos);
    const openBraces = (beforeCursor.match(/\{/g) || []).length;
    const closeBraces = (beforeCursor.match(/\}/g) || []).length;

    // Must be inside a rule block
    if (openBraces <= closeBraces) return null;

    // Find the current line/statement to determine if we're after a colon
    const lastOpenBrace = beforeCursor.lastIndexOf('{');
    const ruleContent = beforeCursor.substring(lastOpenBrace);
    const lastColon = ruleContent.lastIndexOf(':');
    const lastSemicolon = ruleContent.lastIndexOf(';');

    // Only show value completions if we're after a colon and before a semicolon/closing brace
    if (lastColon === -1) return null;
    if (lastSemicolon > lastColon) return null;

    // Filter units/keywords that match what the user typed
    const completions = CSS_UNITS
      .filter(unit => unit.toLowerCase().startsWith(word.toLowerCase()))
      .map(unit => ({
        label: unit,
        type: 'keyword',
        apply: unit,
      }))

    if (completions.length === 0) return null;

    return {
      from: before.from,
      options: completions,
    }
  }
}

// Create autocomplete source for CSS color values
function createColorCompletion() {
  return (context) => {
    // Match color values (hex, rgb, named colors, etc.)
    const before = context.matchBefore(/[\w\-#%(),.]*/);
    if (!before) return null;

    const word = before.text;
    if (word.length === 0) return null;

    // Check if we're inside a rule and after a colon
    const doc = context.state.doc.toString();
    const cursorPos = context.pos;
    const beforeCursor = doc.substring(0, cursorPos);
    const openBraces = (beforeCursor.match(/\{/g) || []).length;
    const closeBraces = (beforeCursor.match(/\}/g) || []).length;

    // Must be inside a rule block
    if (openBraces <= closeBraces) return null;

    // Find the current line/statement to determine if we're in a color property
    const lastOpenBrace = beforeCursor.lastIndexOf('{');
    const ruleContent = beforeCursor.substring(lastOpenBrace);
    const lastColon = ruleContent.lastIndexOf(':');
    const lastSemicolon = ruleContent.lastIndexOf(';');

    // Only show colors if we're after a colon and before a semicolon/closing brace
    if (lastColon === -1 || (lastSemicolon > lastColon)) return null;

    // Get the property name to check if it's a color property
    const propertyMatch = ruleContent.substring(0, lastColon).match(/[\w\-]+\s*$/);
    if (!propertyMatch) return null;

    const propertyName = propertyMatch[0].trim().toLowerCase();

    // Only show color completions for color-related properties
    const isColorProperty = COLOR_PROPERTIES.includes(propertyName) ||
                          propertyName.includes('color') ||
                          propertyName.includes('shadow');

    if (!isColorProperty) return null;

    // Filter colors that start with what the user typed
    const completions = CSS_COLORS
      .filter(color => color.toLowerCase().startsWith(word.toLowerCase()))
      .map(color => ({
        label: color,
        type: 'keyword',
        apply: color,
      }))

    if (completions.length === 0) return null;

    return {
      from: before.from,
      options: completions,
    }
  }
}

// Export CSS lists for reuse in other components (like RuleInspector)
export { CSS_PROPERTIES, CSS_UNITS, CSS_COLORS }

export default function CSSEditorInput({ value = '', onChange = null, diagnostics = [] }) {
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

    // Build extensions list - matching CodeMirrorEditor pattern
    const extensions = [
      // Line number gutter
      lineNumbers(),

      // History/Undo support - CRITICAL: must be included for Ctrl+Z to work
      history(),

      // Keyboard shortcuts (undo/redo, find, indent, select all, copy, paste, etc.)
      keymap.of([
        { key: 'Tab', run: insertTabCharacter }, // Tab key inserts actual tab character
        ...historyKeymap,       // Ctrl/Cmd+Z (undo), Ctrl/Cmd+Shift+Z (redo), Ctrl+Y (redo)
        ...defaultKeymap,       // copy, paste, select all, arrow keys, etc.
        ...searchKeymap         // Ctrl/Cmd+F (find), Ctrl/Cmd+G (find next)
      ]),

      // CSS language support
      css(),

      // Autocomplete for CSS selectors, properties, values, and colors
      autocompletion({
        override: [createSelectorCompletion(), createPropertyCompletion(), createValueCompletion(), createColorCompletion()],
      }),

      // Color picker widgets
      createColorPickerPlugin(),

      // Syntax highlighting (token colors)
      syntaxCompartmentRef.current.of(syntaxHighlighting(createSyntaxTheme(isDarkMode))),

      // Linting and error highlighting (CM6 native)
      linterCompartmentRef.current.of(linterExtensions),

      // Linting theme colors (error/warning/info)
      lintThemeCompartmentRef.current.of(createLintTheme(isDarkMode)),

      // Line wrapping - CRITICAL for proper editor display
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
      }}
    />
  )
}
