import React, { useState, useEffect } from 'react'
import { FaCopy, FaCheck } from 'react-icons/fa6'
import OutputTabs from '../../OutputTabs'
import styles from '../../../styles/ip-toolkit.module.css'
import toolStyles from '../../../styles/tool-output.module.css'

export default function SingleIPOutput({ result, detectedInput }) {
  const [copiedField, setCopiedField] = useState(null)
  const [previousResult, setPreviousResult] = useState(null)
  const [changedFields, setChangedFields] = useState(new Set())
  const [dnsData, setDnsData] = useState(null)
  const [dnsLoading, setDnsLoading] = useState(false)
  const [dnsError, setDnsError] = useState(null)

  // Fetch DNS data when detectedInput is a hostname
  useEffect(() => {
    if (!detectedInput?.isHostname) {
      setDnsData(null)
      setDnsError(null)
      return
    }

    const fetchDNS = async () => {
      setDnsLoading(true)
      setDnsError(null)

      try {
        const hostname = detectedInput.hostname || detectedInput.description?.split('(')[1]?.slice(0, -1) || ''
        if (!hostname) {
          setDnsError('No hostname found')
          setDnsLoading(false)
          return
        }

        const response = await fetch('/api/tools/dns-lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: hostname }),
        })

        if (!response.ok) throw new Error('DNS lookup failed')
        const data = await response.json()
        setDnsData(data.data)
      } catch (err) {
        setDnsError(err.message)
      } finally {
        setDnsLoading(false)
      }
    }

    fetchDNS()
  }, [detectedInput])

  // Detect changed fields when result updates
  useEffect(() => {
    if (!previousResult || !result || result.inputType !== previousResult.inputType) {
      setPreviousResult(result)
      setChangedFields(new Set())
      return
    }

    const changed = new Set()

    // Compare all top-level string fields
    const fieldsToCheck = [
      'input',
      'normalized',
      'expanded',
      'compressed',
      'integer',
      'integerHex',
      'integerBinary',
      'binaryContinuous',
      'ptr',
      'mappedIPv4',
    ]

    fieldsToCheck.forEach(field => {
      const oldValue = previousResult[field]
      const newValue = result[field]
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changed.add(field)
      }
    })

    setChangedFields(changed)
    setPreviousResult(result)

    // Clear highlights after 5 seconds
    const timeout = setTimeout(() => {
      setChangedFields(new Set())
    }, 5000)

    return () => clearTimeout(timeout)
  }, [result])

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

  // Map of fields that should have copy buttons
  const copyableFields = {
    'Input': true,
    'Raw Input': true,
    'Normalized': true,
    'Expanded': true,
    'Compressed': true,
    'Mapped IPv4': true,
    'Decimal': true,
    'Hexadecimal': true,
    'Continuous': true,
    'Combined (Dotted)': true,
    'Binary (128-bit)': true,
    'Binary (Dotted)': true,
    'Pointer': true,
    'Zone ID': true,
    'Without Zone': true,
    'Start Address': true,
    'End Address': true,
    'Normalized (startIP)': true,
    'Compressed (startIP)': true,
    'Expanded (startIP)': true,
    'Normalized (endIP)': true,
    'Compressed (endIP)': true,
    'Expanded (endIP)': true,
  }

  const renderField = (key, value, uniqueKey, fieldPath) => {
    const isCopyable = copyableFields[key] && typeof value === 'string'
    const isChanged = fieldPath && changedFields.has(fieldPath)
    const highlightClass = isChanged ? styles.changedField : ''

    if (isCopyable) {
      return (
        <div key={uniqueKey} className={`${toolStyles.copyCard} ${highlightClass}`}>
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
      <div key={uniqueKey} className={`${styles.outputFieldRow} ${highlightClass}`}>
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

    // For hostnames, skip IP-specific sections and jump to DNS results
    if (detectedInput?.isHostname) {
      // Input Section
      const inputFields = {}
      if (result?.input) {
        inputFields['Input'] = result.input
      }
      if (Object.keys(inputFields).length > 0) {
        sections.push({
          title: 'Input',
          fields: inputFields,
        })
      }

      // DNS Lookup section (if data is available and loaded)
      if (dnsData && dnsData.forward) {
        const dnsFields = {}
        const { forward } = dnsData

        if (forward.aRecords && forward.aRecords.length > 0) {
          dnsFields['IPv4 Addresses (A)'] = forward.aRecords.map((record, i) => (
            <div key={i} style={{ fontSize: '12px', marginBottom: '4px', fontFamily: 'monospace' }}>
              {record.value} <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>(TTL: {record.ttl}s)</span>
            </div>
          ))
        }

        if (forward.aaaaRecords && forward.aaaaRecords.length > 0) {
          dnsFields['IPv6 Addresses (AAAA)'] = forward.aaaaRecords.map((record, i) => (
            <div key={i} style={{ fontSize: '12px', marginBottom: '4px', fontFamily: 'monospace' }}>
              {record.value} <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>(TTL: {record.ttl}s)</span>
            </div>
          ))
        }

        if (dnsLoading) {
          dnsFields['Status'] = 'Loading DNS records...'
        } else if (dnsError) {
          dnsFields['Error'] = dnsError
        } else if (forward.aRecords.length === 0 && forward.aaaaRecords.length === 0) {
          dnsFields['Result'] = 'No DNS records found'
        }

        if (Object.keys(dnsFields).length > 0) {
          sections.push({
            title: 'DNS Resolution',
            fields: dnsFields,
          })
        }
      } else if (dnsLoading) {
        sections.push({
          title: 'DNS Resolution',
          fields: {
            'Status': 'Loading DNS records...',
          },
        })
      } else if (dnsError) {
        sections.push({
          title: 'DNS Resolution',
          fields: {
            'Error': dnsError,
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

    // IPv6 Expansion/Compression
    if (result.version === 6) {
      const ipv6Fields = {}
      if (result.expanded) {
        ipv6Fields['Expanded'] = result.expanded
      }
      if (result.compressed) {
        ipv6Fields['Compressed'] = result.compressed
      }
      if (result.hextets && Array.isArray(result.hextets)) {
        ipv6Fields['Hextets'] = result.hextets.join(' : ')
      }
      if (result.zoneId) {
        ipv6Fields['Zone ID'] = result.zoneId
        if (result.normalizedWithoutZone) {
          ipv6Fields['Without Zone'] = result.normalizedWithoutZone
        }
      }
      if (result.isIPv4Mapped) {
        ipv6Fields['IPv4-Mapped'] = 'Yes'
        if (result.mappedIPv4) {
          ipv6Fields['Mapped IPv4'] = result.mappedIPv4
        }
      }
      if (result.ipv6Special) {
        ipv6Fields['Special Type'] = result.ipv6Special.type
        if (result.ipv6Special.description) {
          ipv6Fields['Description'] = result.ipv6Special.description
        }
        if (result.ipv6Special.rfc) {
          ipv6Fields['RFC'] = result.ipv6Special.rfc
        }
      }
      if (Object.keys(ipv6Fields).length > 0) {
        sections.push({
          title: 'IPv6 Format',
          fields: ipv6Fields,
        })
      }
    }

    // Binary octets visualization (IPv4)
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

    // IPv6 Binary representation
    if (result.ipv6Binary) {
      const ipv6BinaryFields = {}
      if (result.ipv6Binary) {
        ipv6BinaryFields['Binary (128-bit)'] = result.ipv6Binary
      }
      if (result.ipv6BinaryDotted) {
        ipv6BinaryFields['Binary (Dotted)'] = result.ipv6BinaryDotted
      }
      if (Object.keys(ipv6BinaryFields).length > 0) {
        sections.push({
          title: 'IPv6 Binary',
          fields: ipv6BinaryFields,
        })
      }
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

    // Range information (Phase 2)
    if (result.range) {
      const rangeFields = {}

      if (result.range.start) {
        rangeFields['Start Address'] = result.range.start
      }

      if (result.range.end) {
        rangeFields['End Address'] = result.range.end
      }

      if (result.range.size !== undefined) {
        rangeFields['Range Size'] = result.range.size.toLocaleString() + ' addresses'
      }

      if (result.range.isValid !== undefined) {
        rangeFields['Valid'] = result.range.isValid ? '✓ Yes' : '✗ No'
      }

      if (result.range.isIncreasing !== undefined) {
        rangeFields['Increasing Order'] = result.range.isIncreasing ? '✓ Yes' : '✗ No'
      }

      if (result.range.classificationMatch !== undefined) {
        rangeFields['Same Classification'] = result.range.classificationMatch ? '✓ Yes' : '✗ No'
      }

      if (result.range.scopeMismatch !== undefined) {
        rangeFields['Scope Match'] = result.range.scopeMismatch ? '✗ Mismatch' : '✓ Match'
      }

      if (result.range.warnings && Array.isArray(result.range.warnings)) {
        rangeFields['Warnings'] = result.range.warnings.map((warning, i) => (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: '#f57c00' }}>
            ⚠ {warning}
          </div>
        ))
      }

      if (result.range.separator) {
        rangeFields['Separator'] = result.range.separator
      }

      if (result.range.coveringSubnet) {
        rangeFields['Covering Subnet'] = result.range.coveringSubnet.subnet
      }

      if (result.range.classificationNotes && Array.isArray(result.range.classificationNotes)) {
        rangeFields['Notes'] = result.range.classificationNotes.map((note, i) => (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px' }}>
            • {note}
          </div>
        ))
      }

      if (result.range.scopeNotes && Array.isArray(result.range.scopeNotes) && result.range.scopeNotes.length > 0) {
        rangeFields['Scope Issues'] = result.range.scopeNotes.map((note, i) => (
          <div key={i} style={{ fontSize: '12px', marginBottom: '4px', color: '#d32f2f' }}>
            ✗ {note}
          </div>
        ))
      }

      if (Object.keys(rangeFields).length > 0) {
        sections.push({
          title: 'Range Details',
          fields: rangeFields,
        })
      }
    }

    // Start IP (for ranges)
    if (result.startIP) {
      const startFields = {}

      if (result.startIP.normalized) {
        startFields['Normalized'] = result.startIP.normalized
      }

      if (result.startIP.compressed) {
        startFields['Compressed'] = result.startIP.compressed
      }

      if (result.startIP.expanded) {
        startFields['Expanded'] = result.startIP.expanded
      }

      if (result.startIP.integer !== undefined) {
        startFields['Integer'] = result.startIP.integer.toString()
      }

      if (result.startIP.integerHex) {
        startFields['Hexadecimal'] = result.startIP.integerHex
      }

      if (Object.keys(startFields).length > 0) {
        sections.push({
          title: 'Start IP',
          fields: startFields,
        })
      }
    }

    // End IP (for ranges)
    if (result.endIP) {
      const endFields = {}

      if (result.endIP.normalized) {
        endFields['Normalized'] = result.endIP.normalized
      }

      if (result.endIP.compressed) {
        endFields['Compressed'] = result.endIP.compressed
      }

      if (result.endIP.expanded) {
        endFields['Expanded'] = result.endIP.expanded
      }

      if (result.endIP.integer !== undefined) {
        endFields['Integer'] = result.endIP.integer.toString()
      }

      if (result.endIP.integerHex) {
        endFields['Hexadecimal'] = result.endIP.integerHex
      }

      if (Object.keys(endFields).length > 0) {
        sections.push({
          title: 'End IP',
          fields: endFields,
        })
      }
    }

    // Reverse DNS lookup section (for IP addresses to hostnames)
    if (dnsData && dnsData.reverse) {
      const dnsFields = {}
      const { reverse } = dnsData

      if (reverse.hostname) {
        dnsFields['Hostname (PTR)'] = reverse.hostname
        if (reverse.metadata?.ttl) {
          dnsFields['TTL'] = `${reverse.metadata.ttl} seconds`
        }
      } else if (!dnsLoading) {
        dnsFields['Result'] = reverse.error || 'No reverse DNS record found'
      }

      if (dnsLoading) {
        dnsFields['Status'] = 'Loading PTR record...'
      }

      if (Object.keys(dnsFields).length > 0) {
        sections.push({
          title: 'Reverse DNS (PTR)',
          fields: dnsFields,
        })
      }
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
              {Object.entries(section.fields).map(([key, value]) => {
                const uniqueKey = `${section.title}-${key}`

                // Map field keys to their data paths for change detection
                const fieldPathMap = {
                  'Input': 'input',
                  'Normalized': 'normalized',
                  'Expanded': 'expanded',
                  'Compressed': 'compressed',
                  'Decimal': 'integer',
                  'Hexadecimal': 'integerHex',
                  'Combined (Dotted)': 'integerBinary',
                  'Continuous': 'binaryContinuous',
                  'Pointer': 'ptr',
                  'Mapped IPv4': 'mappedIPv4',
                  'Binary (128-bit)': 'ipv6Binary',
                  'Binary (Dotted)': 'ipv6BinaryDotted',
                  'Zone ID': 'zoneId',
                  'Without Zone': 'normalizedWithoutZone',
                }

                const fieldPath = fieldPathMap[key]

                if (section.isDiagnostic || typeof value !== 'string') {
                  return (
                    <div key={uniqueKey} className={section.isDiagnostic ? styles.outputFieldRowDiagnostic : styles.outputFieldRow}>
                      <span className={styles.outputFieldLabel}>{key}</span>
                      <div className={styles.outputFieldValue}>{value}</div>
                    </div>
                  )
                }
                return renderField(key, value, uniqueKey, fieldPath)
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
      content: (
        <div>
          {detectedInput && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#4caf50',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '16px' }}>✓</span>
              <span>
                Detected: <strong>{detectedInput.type}</strong>
                {detectedInput.description && ` — ${detectedInput.description}`}
              </span>
            </div>
          )}
          {buildFriendlyOutput()}
        </div>
      ),
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
