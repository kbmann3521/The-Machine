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
        // For case converter, selectedCaseType is now handled via the INPUT tab chevron menu
        // Return null here as case variants are selected directly
        return null
      }

      const supportedSections = {
        'slugGenerator': 'slugGenerator',
        'reverseText': 'reverseText',
        'removeExtras': 'removeExtras',
        'sortLines': 'sortLines',
        'findReplace': 'findReplace',
        'caseConverter': 'caseConverter',
        'delimiterTransformer': 'delimiterTransformer',
        'numberRows': 'numberRows'
      }

      const key = supportedSections[activeToolkitSection]
      if (key && result[key]) {
        return result[key]
      }
      return null
    }

    // For ASCII/Unicode Converter, use the fullOutput field
    if (selectedTool?.toolId === 'ascii-unicode-converter' && result?.fullOutput) {
      return result.fullOutput
    }

    // For CSS Formatter, use the formatted field
    if (selectedTool?.toolId === 'css-formatter' && result?.formatted) {
      return result.formatted
    }

    // For Web Playground, use the formatted field
    if (selectedTool?.toolId === 'web-playground' && result?.formatted) {
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
