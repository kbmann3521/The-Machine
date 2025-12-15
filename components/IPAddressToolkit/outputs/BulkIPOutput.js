import React, { useState, useMemo } from 'react'
import { FaChevronDown, FaDownload, FaFilter } from 'react-icons/fa6'
import OutputTabs from '../../OutputTabs'
import SingleIPOutput from './SingleIPOutput'
import CIDROutput from './CIDROutput'
import BulkIPComparisonPane from './BulkIPComparisonPane'
import BulkIPMultiComparison from './BulkIPMultiComparison'
import styles from '../../../styles/ip-toolkit.module.css'
import toolStyles from '../../../styles/tool-output.module.css'
import {
  filterBulkResults,
  exportToCSV,
  exportToJSON,
  generateBulkSummary,
} from '../../../lib/bulkIPParser'

export default function BulkIPOutput({ results = [], isBulkMode = false }) {
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [typeFilter, setTypeFilter] = useState('All')
  const [privacyFilter, setPrivacyFilter] = useState('All')
  const [searchText, setSearchText] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())

  // Filter results
  const filteredResults = useMemo(() => {
    return filterBulkResults(results, {
      typeFilter: typeFilter !== 'All' ? typeFilter : undefined,
      privacyFilter: privacyFilter !== 'All' ? privacyFilter : undefined,
      searchText,
    })
  }, [results, typeFilter, privacyFilter, searchText])

  // Generate summary
  const summary = useMemo(() => generateBulkSummary(results), [results])

  // Get unique types from results
  const uniqueTypes = useMemo(() => {
    const types = new Set(results.map(r => r.inputType).filter(Boolean))
    return ['All', ...Array.from(types).sort()]
  }, [results])

  // Get unique privacy types from results
  const uniquePrivacy = useMemo(() => {
    const privacy = new Set(results.map(r => r.privacy).filter(Boolean))
    return Array.from(privacy).sort()
  }, [results])

  const handleToggleExpand = (index) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const handleToggleSelect = (index) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedItems(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === filteredResults.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(filteredResults.map((_, idx) => idx)))
    }
  }


  const handleExportJSON = () => {
    const json = exportToJSON(filteredResults.length > 0 ? filteredResults : results)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-ip-results.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportCSV = () => {
    const csv = exportToCSV(filteredResults.length > 0 ? filteredResults : results)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'bulk-ip-results.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderBulkOutput = () => {
    if (!results || results.length === 0) {
      return (
        <div className={toolStyles.emptyState}>
          Enter multiple IP addresses, hostnames, or CIDR ranges to see bulk analysis results.
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Summary Card */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
          gap: '8px'
        }}>
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            borderLeft: '3px solid var(--color-text-primary)',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '4px', letterSpacing: '0.3px' }}>Total</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-text-primary)' }}>{summary.total}</div>
          </div>

          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '6px',
            borderLeft: '3px solid #4caf50',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#4caf50', marginBottom: '4px', letterSpacing: '0.3px' }}>Valid</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4caf50' }}>{summary.valid}</div>
          </div>

          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(244, 67, 54, 0.08)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: '6px',
            borderLeft: '3px solid #f44336',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#f44336', marginBottom: '4px', letterSpacing: '0.3px' }}>Invalid</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#f44336' }}>{summary.invalid}</div>
          </div>

          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(33, 150, 243, 0.08)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            borderRadius: '6px',
            borderLeft: '3px solid #2196f3',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#2196f3', marginBottom: '4px', letterSpacing: '0.3px' }}>Private</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#2196f3' }}>{summary.byPrivacy['Private'] || 0}</div>
          </div>

          <div style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(255, 152, 0, 0.08)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '6px',
            borderLeft: '3px solid #ff9800',
          }}>
            <div style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase', color: '#ff9800', marginBottom: '4px', letterSpacing: '0.3px' }}>Public</div>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#ff9800' }}>{summary.byPrivacy['Public'] || 0}</div>
          </div>
        </div>

        {/* Type & Privacy Filters */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
          {uniqueTypes.map(type => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              style={{
                padding: '4px 10px',
                backgroundColor: typeFilter === type ? 'rgba(33, 150, 243, 0.2)' : 'transparent',
                border: typeFilter === type ? '1px solid #2196f3' : '1px solid var(--color-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                color: typeFilter === type ? '#2196f3' : 'var(--color-text-primary)',
                transition: 'all 0.2s',
              }}
            >
              {type}
            </button>
          ))}

          {uniquePrivacy.length > 0 && (
            <>
              <div style={{ paddingLeft: '4px', borderLeft: '1px solid var(--color-border)' }} />
              {uniquePrivacy.map(privacy => (
                <button
                  key={privacy}
                  onClick={() => setPrivacyFilter(privacy)}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: privacyFilter === privacy ? 'rgba(76, 175, 80, 0.2)' : 'transparent',
                    border: privacyFilter === privacy ? '1px solid #4caf50' : '1px solid var(--color-border)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: privacyFilter === privacy ? '#4caf50' : 'var(--color-text-primary)',
                    transition: 'all 0.2s',
                  }}
                >
                  {privacy}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Search & Export Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by IP, hostname..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{
              padding: '6px 8px',
              fontSize: '12px',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              backgroundColor: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              flex: '1',
              minWidth: '150px',
            }}
          />

          <button
            onClick={handleExportJSON}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
            }}
            title="Export filtered results to JSON"
          >
            <FaDownload style={{ fontSize: '12px' }} />
            JSON
          </button>

          <button
            onClick={handleExportCSV}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-text-primary)',
            }}
            title="Export filtered results to CSV"
          >
            <FaDownload style={{ fontSize: '12px' }} />
            CSV
          </button>

          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            {filteredResults.length} of {results.length} results
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredResults.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: '12px',
            }}>
              No results match the selected filters.
            </div>
          ) : (
            filteredResults.map((result, idx) => {
              const isExpanded = expandedItems.has(idx)
              const isSelected = selectedItems.has(idx)
              const typeColor = {
                'IPv4': '#2196f3',
                'IPv6': '#9c27b0',
                'CIDR': '#ff9800',
                'Hostname': '#4caf50',
                'Range': '#f44336',
                'Invalid': '#9e9e9e',
              }[result.inputType] || '#757575'

              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: isExpanded ? 'var(--color-background-secondary)' : 'transparent',
                  }}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => handleToggleExpand(idx)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      cursor: 'pointer',
                      backgroundColor: isExpanded ? 'var(--color-background-secondary)' : 'transparent',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <FaChevronDown
                      style={{
                        fontSize: '12px',
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s',
                        color: 'var(--color-text-secondary)',
                      }}
                    />

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(idx)}
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer' }}
                    />

                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        fontFamily: 'monospace',
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}>
                        {result.input}
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        fontSize: '11px',
                        color: 'var(--color-text-secondary)',
                      }}>
                        <span style={{ color: typeColor, fontWeight: '600' }}>
                          {result.inputType}
                        </span>
                        {result.classification && (
                          <span>
                            {result.classification.type}
                            {result.classification.isPrivate && ' • Private'}
                            {result.classification.isPublic && ' • Public'}
                          </span>
                        )}
                        {result.isValid === false && (
                          <span style={{ color: '#f44336' }}>Invalid</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Content (Expanded) - Full output component */}
                  {isExpanded && (
                    <div style={{
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background-primary)',
                    }}>
                      {result.inputType === 'CIDR' ? (
                        <div style={{ padding: '12px 16px' }}>
                          <CIDROutput
                            result={result}
                            detectedInput={{
                              type: 'CIDR',
                              description: result.input
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{ padding: '12px 16px' }}>
                          <SingleIPOutput
                            result={result}
                            detectedInput={{
                              type: result.inputType,
                              description: result.input,
                              isHostname: result.inputType === 'Hostname',
                              hostname: result.inputType === 'Hostname' ? result.input : undefined,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // Build tabs array
  const tabs = [
    {
      id: 'output',
      label: 'OUTPUT',
      content: renderBulkOutput(),
      contentType: 'component',
    },
  ]

  // Add comparison tab for 2+ items
  if (results.length >= 2) {
    const comparisonContent = results.length === 2 ? (
      <BulkIPComparisonPane
        resultsA={results[0]}
        resultsB={results[1]}
        typeA={results[0].inputType}
        typeB={results[1].inputType}
      />
    ) : (
      <BulkIPMultiComparison
        results={results}
        types={results.map(r => r.inputType)}
      />
    )

    tabs.push({
      id: 'comparison',
      label: 'COMPARISON',
      content: comparisonContent,
      contentType: 'component',
    })
  }

  // Add JSON tab
  tabs.push({
    id: 'json',
    label: 'JSON',
    content: JSON.stringify(results, null, 2),
    contentType: 'json',
  })

  return <OutputTabs tabs={tabs} showCopyButton={true} />
}
