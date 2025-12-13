import React, { useState } from 'react'
import { FaCopy, FaCheck } from 'react-icons/fa6'
import OutputTabs from '../../OutputTabs'
import styles from '../../../styles/ip-toolkit.module.css'
import toolStyles from '../../../styles/tool-output.module.css'

export default function CIDROutput({ result }) {
  const [copiedField, setCopiedField] = useState(null)

  const handleCopyField = async (value, fieldName) => {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }

  // High-value copyable fields for networking engineers
  const copyableFields = {
    'CIDR Notation': true,
    'Netmask': true,
    'Wildcard Mask': true,
    'Network Address': true,
    'Broadcast Address': true,
    'First Host': true,
    'Last Host': true,
    'Base IP': true,
    'Hexadecimal': true,
    'Integer': true,
    'First Address': true,
    'Last Address': true,
  }

  const renderField = (key, value, uniqueKey) => {
    const isCopyable = copyableFields[key] && typeof value === 'string'

    if (isCopyable) {
      return (
        <div key={uniqueKey} className={toolStyles.copyCard}>
          <div className={toolStyles.copyCardHeader}>
            <span className={toolStyles.copyCardLabel}>{key}</span>
            <button
              type="button"
              className="copy-action"
              onClick={() => handleCopyField(value, uniqueKey)}
              title="Copy to clipboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                minWidth: '32px',
                minHeight: '28px',
              }}
            >
              {copiedField === uniqueKey ? '✓' : <FaCopy />}
            </button>
          </div>
          <div className={toolStyles.copyCardValue}>{value}</div>
        </div>
      )
    }

    return (
      <div key={uniqueKey} className={styles.outputFieldRow}>
        <span className={styles.outputFieldLabel}>{key}</span>
        <div className={styles.outputFieldValue}>{value}</div>
      </div>
    )
  }
  // Show empty state if no result
  if (!result) {
    const emptyTabs = [
      {
        id: 'output',
        label: 'OUTPUT',
        content: 'Enter a CIDR notation (e.g., 192.168.1.0/24) to see subnet analysis',
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

    // Input section
    if (result.input) {
      sections.push({
        title: 'Input',
        fields: {
          'CIDR Notation': result.input,
        },
      })
    }

    // CIDR Details
    if (result.cidr) {
      const cidrFields = {}

      if (result.cidr.cidr !== undefined) {
        cidrFields['Prefix Length'] = `/${result.cidr.cidr}`
      }

      if (result.cidr.cidrType) {
        cidrFields['CIDR Type'] = result.cidr.cidrType
        if (result.cidr.cidrTypeDescription) {
          cidrFields['Type Description'] = result.cidr.cidrTypeDescription
        }
      }

      if (result.cidr.netmask) {
        cidrFields['Netmask'] = result.cidr.netmask
      }

      if (result.cidr.netmaskBinary) {
        cidrFields['Netmask (Binary)'] = result.cidr.netmaskBinary
      }

      if (result.cidr.wildcardMask) {
        cidrFields['Wildcard Mask'] = result.cidr.wildcardMask
      }

      if (result.cidr.networkBits !== undefined && result.cidr.hostBits !== undefined) {
        cidrFields['Network Bits'] = result.cidr.networkBits
        cidrFields['Host Bits'] = result.cidr.hostBits
      }

      if (Object.keys(cidrFields).length > 0) {
        sections.push({
          title: 'Mask Information',
          fields: cidrFields,
        })
      }
    }

    // Network Details
    if (result.cidr && result.version === 4) {
      const networkFields = {}

      if (result.cidr.networkAddress) {
        networkFields['Network Address'] = result.cidr.networkAddress
      }

      if (result.cidr.broadcastAddress) {
        networkFields['Broadcast Address'] = result.cidr.broadcastAddress
      }

      if (result.cidr.firstHost) {
        networkFields['First Host'] = result.cidr.firstHost
      }

      if (result.cidr.lastHost) {
        networkFields['Last Host'] = result.cidr.lastHost
      }

      if (Object.keys(networkFields).length > 0) {
        sections.push({
          title: 'Network Addresses',
          fields: networkFields,
        })
      }
    }

    // Host Information
    if (result.cidr && result.version === 4) {
      const hostFields = {}

      if (result.cidr.totalHosts !== undefined) {
        hostFields['Total Hosts'] = result.cidr.totalHosts.toLocaleString()
      }

      if (result.cidr.usableHosts !== undefined) {
        hostFields['Usable Hosts'] = result.cidr.usableHosts.toLocaleString()
      }

      if (Object.keys(hostFields).length > 0) {
        sections.push({
          title: 'Host Count',
          fields: hostFields,
        })
      }
    }

    // IPv6 Network Details (Version 6 only)
    if (result.version === 6 && result.cidr) {
      const ipv6Fields = {}

      if (result.cidr.networkAddress) {
        ipv6Fields['Network Address'] = result.cidr.networkAddress
      }

      if (result.cidr.firstAddress) {
        ipv6Fields['First Address'] = result.cidr.firstAddress
      }

      if (result.cidr.lastAddress) {
        ipv6Fields['Last Address'] = result.cidr.lastAddress
      }

      if (result.cidr.hostCount) {
        if (result.cidr.hostCount.scientific) {
          ipv6Fields['Total Hosts'] = result.cidr.hostCount.scientific
        }
        if (result.cidr.hostCount.approximate) {
          ipv6Fields['Approximate'] = result.cidr.hostCount.approximate
        }
      }

      if (Object.keys(ipv6Fields).length > 0) {
        sections.push({
          title: 'IPv6 Network',
          fields: ipv6Fields,
        })
      }
    }

    // Base IP Information
    if (result.baseIP) {
      const baseFields = {}

      if (result.baseIP.normalized) {
        baseFields['Base IP'] = result.baseIP.normalized
      }

      if (result.baseIP.integer !== undefined) {
        baseFields['Integer'] = result.baseIP.integer.toString()
      }

      if (result.baseIP.integerHex) {
        baseFields['Hexadecimal'] = result.baseIP.integerHex
      }

      if (result.baseIP.classification) {
        const classif = result.baseIP.classification
        baseFields['Classification'] = classif.type || 'Unknown'
        if (classif.scope) {
          baseFields['Scope'] = classif.scope
        }
      }

      if (Object.keys(baseFields).length > 0) {
        sections.push({
          title: 'Base IP Analysis',
          fields: baseFields,
        })
      }
    }

    // Visualization (simple subnet bar)
    if (result.cidr && result.version === 4) {
      const cidrValue = result.cidr.cidr || 0
      const fillPercentage = (cidrValue / 32) * 100
      const visualizationContent = (
        <div style={{ marginTop: '10px' }}>
          <div style={{
            display: 'flex',
            height: '20px',
            backgroundColor: '#e0e0e0',
            borderRadius: '4px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${fillPercentage}%`,
              backgroundColor: '#4caf50',
              transition: 'width 0.3s ease',
            }}></div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            marginTop: '4px',
            color: '#666',
          }}>
            <span>Network ({result.cidr.networkBits || 0} bits)</span>
            <span>Host ({result.cidr.hostBits || 0} bits)</span>
          </div>
        </div>
      )

      sections.push({
        title: 'Subnet Visualization',
        fields: {
          'Distribution': visualizationContent,
        },
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
              {Object.entries(section.fields).map(([key, value]) => {
                const uniqueKey = `${section.title}-${key}`
                if (typeof value !== 'string') {
                  return (
                    <div key={uniqueKey} className={styles.outputFieldRow}>
                      <span className={styles.outputFieldLabel}>{key}</span>
                      <div className={styles.outputFieldValue}>{value}</div>
                    </div>
                  )
                }
                return renderField(key, value, uniqueKey)
              })}
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
