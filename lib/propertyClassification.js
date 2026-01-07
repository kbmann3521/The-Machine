/**
 * Property Impact Classification System
 * 
 * Classifies CSS properties by their likely impact on layout/appearance
 * Uses heuristic buckets instead of attempting complete spec coverage
 * 
 * Impact Classes:
 * 🟢 'visual' - cosmetic changes (colors, shadows, etc.)
 * 🟡 'layout' - may affect spacing/flow (margin, padding, etc.)
 * 🔵 'interactive' - affects behavior/animation (cursor, transition, etc.)
 * 🔴 'structural' - may change element structure/positioning (display, position, overflow, etc.)
 * ⚪ 'unknown' - uncategorized (default fallback)
 */

const VISUAL_PROPERTIES = new Set([
  'color',
  'background',
  'background-color',
  'background-image',
  'background-position',
  'background-size',
  'background-repeat',
  'opacity',
  'box-shadow',
  'text-shadow',
  'border-color',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'outline',
  'outline-color',
  'outline-width',
  'outline-style',
  'filter',
  'backdrop-filter',
  'box-decoration-break',
  'text-decoration',
  'text-decoration-color',
  'text-decoration-line',
  'text-decoration-style',
  'text-decoration-thickness',
  'text-underline-offset',
])

const LAYOUT_PROPERTIES = new Set([
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex',
  'flex-basis',
  'flex-grow',
  'flex-shrink',
  'gap',
  'row-gap',
  'column-gap',
  'grid-auto-flow',
  'grid-auto-columns',
  'grid-auto-rows',
  'grid-column',
  'grid-row',
  'grid-column-start',
  'grid-column-end',
  'grid-row-start',
  'grid-row-end',
  'grid-template-columns',
  'grid-template-rows',
  'grid-template-areas',
  'justify-content',
  'align-content',
  'align-items',
  'justify-items',
  'justify-self',
  'align-self',
])

const INTERACTIVE_PROPERTIES = new Set([
  'cursor',
  'pointer-events',
  'user-select',
  'transition',
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'transition-delay',
  'animation',
  'animation-name',
  'animation-duration',
  'animation-timing-function',
  'animation-delay',
  'animation-iteration-count',
  'animation-direction',
  'animation-fill-mode',
  'transform',
  'transform-origin',
  'transform-style',
  'perspective',
  'perspective-origin',
  'backface-visibility',
])

const STRUCTURAL_PROPERTIES = new Set([
  'display',
  'position',
  'overflow',
  'overflow-x',
  'overflow-y',
  'overflow-wrap',
  'word-break',
  'word-wrap',
  'white-space',
  'contain',
  'visibility',
  'z-index',
  'top',
  'right',
  'bottom',
  'left',
  'inset',
  'inset-block',
  'inset-inline',
  'inset-block-start',
  'inset-block-end',
  'inset-inline-start',
  'inset-inline-end',
  'float',
  'clear',
  'clip',
  'clip-path',
  'content',
  'counter-reset',
  'counter-increment',
])

/**
 * Classify a CSS property by its impact type
 * @param {string} property - CSS property name (lowercase)
 * @returns {string} - One of: 'visual', 'layout', 'interactive', 'structural', 'unknown'
 */
export function classifyProperty(property) {
  if (!property) return 'unknown'

  const prop = property.toLowerCase().trim()

  if (VISUAL_PROPERTIES.has(prop)) return 'visual'
  if (LAYOUT_PROPERTIES.has(prop)) return 'layout'
  if (INTERACTIVE_PROPERTIES.has(prop)) return 'interactive'
  if (STRUCTURAL_PROPERTIES.has(prop)) return 'structural'

  return 'unknown'
}

/**
 * Get impact badge info for a property
 * @param {string} property - CSS property name
 * @returns {object} - { emoji, label, description }
 */
export function getImpactBadgeInfo(property) {
  const impact = classifyProperty(property)

  const badgeMap = {
    visual: {
      emoji: '🟢',
      label: 'Visual',
      description: 'Cosmetic change (colors, shadows, etc.)',
    },
    layout: {
      emoji: '🟡',
      label: 'Layout',
      description: 'May affect spacing or flow',
    },
    interactive: {
      emoji: '🔵',
      label: 'Interactive',
      description: 'Affects behavior or animation',
    },
    structural: {
      emoji: '🔴',
      label: 'Structural',
      description: 'May change element structure or positioning',
    },
    unknown: {
      emoji: '⚪',
      label: 'Other',
      description: 'CSS property',
    },
  }

  return badgeMap[impact] || badgeMap.unknown
}

export default {
  classifyProperty,
  getImpactBadgeInfo,
}
