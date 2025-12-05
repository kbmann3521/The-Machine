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

    if (result.isValid !== undefined) {
      sections.push({
        title: 'Validation Status',
        fields: {
          'Valid': result.isValid ? '✓ Yes' : '✗ No',
          ...(result.version && { 'Version': result.version }),
        },
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

    if (result.integer !== null && result.integer !== undefined) {
      sections.push({
        title: 'Integer Conversion',
        fields: {
          'Decimal': result.integer,
          ...(result.integerHex && { 'Hexadecimal': result.integerHex }),
          ...(result.integerBinary && { 'Binary': result.integerBinary }),
        },
      })
    }

    if (result.classification) {
      const classFields = {
        'Type': result.classification.type,
        ...(result.classification.isPrivate !== undefined && {
          'Private': result.classification.isPrivate ? 'Yes' : 'No',
        }),
        ...(result.classification.isLoopback && {
          'Loopback': 'Yes',
        }),
        ...(result.classification.isMulticast && {
          'Multicast': 'Yes',
        }),
        ...(result.classification.isLinkLocal && {
          'Link-Local': 'Yes',
        }),
      }
      sections.push({
        title: 'Classification',
        fields: classFields,
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
                <div key={key} className={styles.outputFieldRow}>
                  <span className={styles.outputFieldLabel}>
                    {key}
                  </span>
                  <span className={styles.outputFieldValue}>
                    {value}
                  </span>
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
