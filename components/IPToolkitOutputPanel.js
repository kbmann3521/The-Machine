import React, { useMemo } from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import CIDROutput from './IPAddressToolkit/outputs/CIDROutput'
import BulkIPOutput from './IPAddressToolkit/outputs/BulkIPOutput'
import { detectIPInputType } from '../lib/ipInputDetection'
import { isBulkInput, parseBulkInput, classifyInputEntry } from '../lib/bulkIPParser'
import { validateIPAddress } from '../lib/tools'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ result, inputText }) {
  const detectedInput = useMemo(() => {
    if (!inputText) return null
    return detectIPInputType(inputText)
  }, [inputText])

  // Check if input is bulk
  const isBulk = useMemo(() => {
    if (!inputText) return false
    return isBulkInput(inputText)
  }, [inputText])

  // Process bulk inputs if in bulk mode
  const bulkResults = useMemo(() => {
    if (!isBulk || !inputText) return null

    const parsed = parseBulkInput(inputText, {
      softLimit: 500,
      hardLimit: 1000,
    })

    if (parsed.errors && parsed.errors.length > 0 || !parsed.entries || parsed.entries.length === 0) {
      return null
    }

    // Process each entry through validateIPAddress
    const results = parsed.entries.map((entry, idx) => {
      try {
        const inputType = classifyInputEntry(entry)
        const singleResult = validateIPAddress(entry, {
          validateIP: true,
          normalize: true,
          diagnostics: true,
          ipToInteger: true,
          ipToHex: true,
          ipToBinary: true,
          ptrRecord: true,
          classification: true,
        })

        // Enrich result with input type classification
        return {
          ...singleResult,
          input: entry,
          inputType: inputType,
          _bulkIndex: idx,
        }
      } catch (err) {
        return {
          input: entry,
          inputType: classifyInputEntry(entry),
          error: err.message,
          isValid: false,
          _bulkIndex: idx,
        }
      }
    })

    return {
      entries: results,
      warnings: parsed.warnings,
      errors: parsed.errors,
    }
  }, [isBulk, inputText])

  // Route to appropriate output component based on input type
  const renderOutput = () => {
    // If bulk mode and we have processed results, use BulkIPOutput
    if (isBulk && bulkResults) {
      return <BulkIPOutput results={bulkResults.entries} isBulkMode={true} />
    }

    // Single mode - use the original result from API
    if (!result) {
      return <SingleIPOutput result={result} detectedInput={detectedInput} />
    }

    switch (result.inputType) {
      case 'cidr':
        return <CIDROutput result={result} detectedInput={detectedInput} />
      case 'range':
        return <SingleIPOutput result={result} detectedInput={detectedInput} />
      default:
        return <SingleIPOutput result={result} detectedInput={detectedInput} />
    }
  }

  return (
    <div className={styles.outputPanelWrapper}>
      {renderOutput()}
    </div>
  )
}
