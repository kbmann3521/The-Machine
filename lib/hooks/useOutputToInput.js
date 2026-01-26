import { useCallback } from 'react'

/**
 * Custom hook for "use output as input" functionality
 * Handles tool-specific logic for extracting the right output field and applying it to input
 * 
 * @param {Object} result - Tool result object
 * @param {Object} selectedTool - Currently selected tool
 * @param {string} activeToolkitSection - Active toolkit section (for text-toolkit)
 * @param {string} selectedCaseType - Selected case type (for case converter)
 * @param {Function} onInputChange - Callback to apply new input text
 * @returns {Object} { getOutputToUse, handleUseOutput, hasOutput }
 */
export function useOutputToInput(result, selectedTool, activeToolkitSection, selectedCaseType, onInputChange) {
  const getOutputToUse = useCallback(() => {
    if (!result) return null

    // For Text Toolkit, only show button for specific sections
    if (selectedTool?.toolId === 'text-toolkit' && activeToolkitSection) {
      // Only these sections support "use output as input"
      if (activeToolkitSection === 'caseConverter' && result.caseConverter) {
        return result.caseConverter[selectedCaseType]
      }

      const supportedSections = {
        'slugGenerator': 'slugGenerator',
        'reverseText': 'reverseText',
        'removeExtras': 'removeExtras',
        'sortLines': 'sortLines',
        'findReplace': 'findReplace',
        'caseConverter': 'caseConverter',
        'delimiterTransformer': 'delimiterTransformer'
      }

      const key = supportedSections[activeToolkitSection]
      if (key && result[key]) {
        return result[key]
      }
      return null
    }

    // For CSS Formatter, use the formatted field
    if (selectedTool?.toolId === 'css-formatter' && result?.formatted) {
      return result.formatted
    }

    // For Web Playground (markdown-html-formatter), use the formatted field
    if (selectedTool?.toolId === 'markdown-html-formatter' && result?.formatted) {
      return result.formatted
    }

    // For formatters (SQL, JSON, XML, YAML, JS), use the formatted field if available, otherwise output
    const formatterTools = ['sql-formatter', 'json-formatter', 'xml-formatter', 'yaml-formatter', 'js-formatter']
    if (formatterTools.includes(selectedTool?.toolId)) {
      if (result?.formatted) return result.formatted
      if (result?.output) return result.output
      return null
    }

    // For regular tools, use the output field
    if (result?.output) {
      return result.output
    }

    return null
  }, [result, selectedTool, activeToolkitSection, selectedCaseType])

  const handleUseOutput = useCallback(() => {
    const output = getOutputToUse()
    if (output && onInputChange) {
      const outputText = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
      onInputChange(outputText, null, null, false)
    }
  }, [getOutputToUse, onInputChange])

  return {
    getOutputToUse,
    handleUseOutput,
    hasOutput: !!getOutputToUse()
  }
}
