import React, { useMemo } from 'react'
import { useState, useEffect } from 'react'
import SingleIPOutput from './IPAddressToolkit/outputs/SingleIPOutput'
import CIDROutput from './IPAddressToolkit/outputs/CIDROutput'
import BulkIPOutput from './IPAddressToolkit/outputs/BulkIPOutput'
import { loadIPToolkitEngine } from '../lib/ip-toolkit-engine'
import styles from '../styles/ip-toolkit.module.css'

export default function IPToolkitOutputPanel({ result, inputText }) {
  const [detectedInput, setDetectedInput] = useState(null)
  const [isBulk, setIsBulk] = useState(false)
  const [bulkResults, setBulkResults] = useState(null)
  const [engineLoading, setEngineLoading] = useState(false)

  // Lazy-load engine and process input type detection
  useEffect(() => {
    if (!inputText) {
      setDetectedInput(null)
      setIsBulk(false)
      setBulkResults(null)
      return
    }

    setEngineLoading(true)

    const processInput = async () => {
      try {
        const engine = await loadIPToolkitEngine()

        // Detect input type
        const detected = engine.detectIPInputType(inputText)
        setDetectedInput(detected)

        // Check if bulk input
        const isBulkInput = engine.isBulkInput(inputText)
        setIsBulk(isBulkInput)

        // If bulk, process all entries
        if (isBulkInput) {
          const parsed = engine.parseBulkInput(inputText, {
            softLimit: 500,
            hardLimit: 1000,
          })

          if (parsed.errors && parsed.errors.length > 0 || !parsed.entries || parsed.entries.length === 0) {
            setBulkResults(null)
            return
          }

          // Process each entry through validateIPAddress
          const results = parsed.entries.map((entry, idx) => {
            try {
              const inputType = engine.classifyInputEntry(entry)
              const singleResult = engine.validateIPAddress(entry, {
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
                inputType: engine.classifyInputEntry(entry),
                error: err.message,
                isValid: false,
                _bulkIndex: idx,
              }
            }
          })

          setBulkResults({
            entries: results,
            warnings: parsed.warnings,
            errors: parsed.errors,
          })
        } else {
          setBulkResults(null)
        }
      } catch (error) {
        console.error('Failed to process IP input:', error)
        setDetectedInput(null)
        setIsBulk(false)
        setBulkResults(null)
      } finally {
        setEngineLoading(false)
      }
    }

    processInput()
  }, [inputText])

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
