import React, { useState } from 'react'
import OutputTabs from '../../OutputTabs'
import styles from '../../../styles/ip-toolkit.module.css'

export default function SingleIPOutput({ result }) {
  // Show empty state if no result
  if (!result) {
    const emptyTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: 'Enter an IP address to see analysis results',
        contentType: 'text',
      },
      {
        id: 'json',
        label: 'JSON',
        content: '',
        contentType: 'json',
      },
    ]
    return <OutputTabs tabs={emptyTabs} showCopyButton={false} />
  }

  // Show error state
  if (result.error) {
    const errorTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: `Error: ${result.error}`,
        contentType: 'text',
      },
      {
        id: 'json',
        label: 'JSON',
        content: JSON.stringify(result, null, 2),
        contentType: 'json',
      },
    ]
    return <OutputTabs tabs={errorTabs} showCopyButton={true} />
  }

  // Build friendly output
  const buildFriendlyOutput = () => {
    const sections = []

    // Input Section (with rawInput if it differs from normalized input)
    const inputFields = {}
    if (result.input) {
      inputFields['Input'] = result.input
    }
    if (result.rawInput && result.rawInput !== result.input) {
      inputFields['Raw Input'] = result.rawInput
    }
    if (Object.keys(inputFields).length > 0) {
      sections.push({
        title: 'Input',
        fields: inputFields,
      })
    }

    if (result.isValid !== undefined) {
      const validationFields = {
        'Valid': result.isValid ? '✓ Yes' : '✗ No',
      }
      if (result.metadata?.versionString) {
        validationFields['Version'] = result.metadata.versionString
      }
      if (result.isIPv4 !== undefined) {
        validationFields['IPv4'] = result.isIPv4 ? '✓ Yes' : '✗ No'
      }
      if (result.isIPv6 !== undefined) {
        validationFields['IPv6'] = result.isIPv6 ? '✓ Yes' : '✗ No'
      }
      sections.push({
        title: 'Validation Status',
        fields: validationFields,
      })
    }

    if (result.normalized) {
      sections.push({
        title: 'Normalized Form',
        fields: {
          'Normalized': result.normalized,
        },
      })
    }

    // Binary octets visualization (Phase 4 foundation)
    if (result.binaryOctets && Array.isArray(result.binaryOctets)) {
      const binaryFields = {
        'Octet 1': result.binaryOctets[0] || '',
        'Octet 2': result.binaryOctets[1] || '',
        'Octet 3': result.binaryOctets[2] || '',
        'Octet 4': result.binaryOctets[3] || '',
        'Combined (Dotted)': result.integerBinary || '',
      }
      if (result.binaryContinuous) {
        binaryFields['Continuous'] = result.binaryContinuous
      }
      sections.push({
        title: 'Binary Representation',
        fields: binaryFields,
      })
    }

    if (result.integer !== null && result.integer !== undefined) {
      sections.push({
        title: 'Integer Conversion',
        fields: {
          'Decimal': result.integer.toString(),
          ...(result.integerHex && { 'Hexadecimal': result.integerHex }),
        },
      })
    }

    if (result.ptr) {
      sections.push({
        title: 'PTR (Reverse DNS)',
        fields: {
          'Pointer': result.ptr,
          'Type': result.version === 4 ? 'in-addr.arpa' : 'ip6.arpa',
        },
      })
    }

    if (result.classification) {
      const classFields = {
        'Type': result.classification.type,
        ...(result.classification.subtype && { 'Subtype': result.classification.subtype }),
        ...(result.classification.rfc && { 'RFC': result.classification.rfc }),
        ...(result.classification.scope && { 'Scope': result.classification.scope }),
      }

      if (result.classification.isPrivate !== undefined) {
        classFields['Private'] = result.classification.isPrivate ? 'Yes' : 'No'
      }
      if (result.classification.isPublic !== undefined) {
        classFields['Public'] = result.classification.isPublic ? 'Yes' : 'No'
      }
      if (result.classification.isLoopback) {
        classFields['Loopback'] = 'Yes'
      }
      if (result.classification.isMulticast) {
        classFields['Multicast'] = 'Yes'
      }
      if (result.classification.isLinkLocal) {
        classFields['Link-Local'] = 'Yes'
      }
      if (result.classification.isDocumentation) {
        classFields['Documentation'] = 'Yes'
      }
      if (result.classification.range) {
        classFields['Range'] = result.classification.range
      }

      sections.push({
        title: 'RFC Classification',
        fields: classFields,
      })
    }

    // Diagnostics section (showing allIssues if available, otherwise individual sections)
    if (result.allIssues && Array.isArray(result.allIssues) && result.allIssues.length > 0) {
      const allIssuesFields = {}
      allIssuesFields['Issues'] = result.allIssues.map((issue, i) => {
        const severityColor = issue.severity === 'error' ? '#f44336' : issue.severity === 'warning' ? '#ff9800' : '#4caf50'
        const severityIcon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡'
        return (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: severityColor }}>
            {severityIcon} <strong>{issue.code}:</strong> {issue.message}
          </div>
        )
      })
      sections.push({
        title: 'Diagnostics',
        fields: allIssuesFields,
        isDiagnostic: true,
      })
    } else if (result.diagnostics && (result.diagnostics.errors?.length > 0 || result.diagnostics.warnings?.length > 0 || result.diagnostics.tips?.length > 0)) {
      const diagnosticFields = {}

      if (result.diagnostics.errors?.length > 0) {
        diagnosticFields['❌ Errors'] = result.diagnostics.errors.map((e, i) => (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: '#f44336' }}>
            <strong>{e.code}:</strong> {e.message}
          </div>
        ))
      }

      if (result.diagnostics.warnings?.length > 0) {
        diagnosticFields['⚠️ Warnings'] = result.diagnostics.warnings.map((w, i) => (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: '#ff9800' }}>
            <strong>{w.code}:</strong> {w.message}
          </div>
        ))
      }

      if (result.diagnostics.tips?.length > 0) {
        diagnosticFields['💡 Tips'] = result.diagnostics.tips.map((t, i) => (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: '#4caf50' }}>
            <strong>{t.code}:</strong> {t.message}
          </div>
        ))
      }

      sections.push({
        title: 'Diagnostics',
        fields: diagnosticFields,
        isDiagnostic: true,
      })
    }

    return (
      <div>
        {sections.map((section, idx) => (
          <div key={idx} className={styles.outputSectionContainer}>
            <div className={styles.outputSectionTitle}>
              {section.title}
            </div>
            <div className={styles.outputSectionContent}>
              {Object.entries(section.fields).map(([key, value]) => (
                <div key={key} className={section.isDiagnostic ? styles.outputFieldRowDiagnostic : styles.outputFieldRow}>
                  <span className={styles.outputFieldLabel}>
                    {key}
                  </span>
                  <div className={styles.outputFieldValue}>
                    {Array.isArray(value) ? value : value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Create tabs
  const tabs = [
    {
      id: 'output',
      label: 'OUTPUT',
      content: buildFriendlyOutput(),
      contentType: 'component',
    },
    {
      id: 'json',
      label: 'JSON',
      content: JSON.stringify(result, null, 2),
      contentType: 'json',
    },
  ]

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
