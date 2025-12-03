import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { markdown } from '@codemirror/lang-markdown'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { xml } from '@codemirror/lang-xml'
import { json } from '@codemirror/lang-json'
import { sql } from '@codemirror/lang-sql'
import { python } from '@codemirror/lang-python'
import { yaml } from '@codemirror/lang-yaml'
import { useTheme } from '../lib/ThemeContext'
import { createCustomTheme } from '../lib/codeMirrorTheme'
import styles from '../styles/code-mirror-output.module.css'

const getLanguageExtension = (toolId) => {
  const languageMap = {
    'js-formatter': javascript(),
    'javascript-minifier': javascript(),
    'json-formatter': json(),
    'xml-formatter': xml(),
    'markdown-html-formatter': markdown(),
    'css-formatter': css(),
    'sql-formatter': sql(),
    'yaml-formatter': yaml(),
    'python-formatter': python(),
  }
  return languageMap[toolId]
}

export default function CodeMirrorOutput({ code, toolId, readOnly = true }) {
  const { theme } = useTheme()

  if (!code) return null

  const codeString = typeof code === 'string' ? code : JSON.stringify(code, null, 2)

  return (
    <div className={styles.container}>
      <CodeMirror
        value={codeString}
        onChange={() => {}}
        editable={!readOnly}
        extensions={[getLanguageExtension(toolId), ...createCustomTheme(theme)].filter(Boolean)}
        className={styles.editor}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: false,
          autocompletion: false,
          rectangularSelection: true,
          highlightSelectionMatches: true,
          searchKeymap: true,
        }}
      />
    </div>
  )
}
