/**
 * SyntaxHighlighter Component
 *
 * Simple code display component (without syntax highlighting)
 * Renders code in a readable monospace format.
 */

export default function SyntaxHighlighter({
  code = '',
  language = 'text',
  toolId = null,
  className = '',
}) {
  return (
    <pre
      style={{
        margin: 0,
        padding: '12px',
        background: 'transparent',
        fontSize: '13px',
        lineHeight: '1.5',
        fontFamily: "'Courier New', monospace",
        width: 'fit-content',
        minWidth: '100%',
        boxSizing: 'border-box',
        whiteSpace: 'pre',
      }}
    >
      <code
        className={className}
        style={{
          margin: 0,
          padding: 0,
          fontSize: '13px',
          lineHeight: '1.5',
          fontFamily: "'Courier New', monospace",
          whiteSpace: 'pre',
        }}
      >
        {code}
      </code>
    </pre>
  )
}
