import React from 'react'

/**
 * UseOutputButton Component
 * 
 * Reusable button for applying output back to input.
 * Uses the global .use-output-button CSS class for consistent styling.
 * 
 * Props:
 *   onClick: function to call when button is clicked (typically applies output to input)
 *   disabled: (optional) whether button is disabled
 *   title: (optional) tooltip text, defaults to "Use output as input"
 *   className: (optional) additional CSS classes to append
 *   children: (optional) button content, defaults to ⬇️
 */
export default function UseOutputButton({
  onClick,
  disabled = false,
  title = 'Use output as input',
  className = '',
  children = '⬇️',
}) {
  return (
    <button
      className={`use-output-button${className ? ` ${className}` : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      type="button"
      aria-label={title}
    >
      {children}
    </button>
  )
}
