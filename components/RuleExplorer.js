import React, { useState } from 'react'
import styles from '../styles/output-tabs.module.css'

/**
 * RuleExplorer: Read-only interactive tree UI for CSS rules
 *
 * Props:
 *   rules: CssRuleNode[] - Rules tree from Phase 2 analysis
 *   onSelect: (loc) => void - Callback when user clicks a rule (emits location for highlighting)
 */
export default function RuleExplorer({ rules = [], onSelect = null }) {
  const [expandedNodes, setExpandedNodes] = useState({})

  if (!rules || rules.length === 0) {
    return (
      <div className={styles.rulesExplorerEmpty}>
        <p>No rules found. CSS may be empty or invalid.</p>
      </div>
    )
  }

  const toggleExpand = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }))
  }

  const handleRuleClick = (loc) => {
    if (onSelect && loc && (loc.startLine || loc.startLine === 0)) {
      onSelect(loc)
    }
  }

  const renderRule = (node, nodeId, depth = 0) => {
    const isExpanded = expandedNodes[nodeId]
    const hasChildren = node.children && node.children.length > 0
    const hasDeclarations = node.declarations && node.declarations.length > 0

    if (node.type === 'rule') {
      return (
        <div key={nodeId} className={styles.ruleNode}>
          <div
            className={styles.ruleHeader}
            style={{ paddingLeft: `${depth * 16}px` }}
            onClick={() => handleRuleClick(node.loc)}
          >
            {hasDeclarations && (
              <button
                className={styles.ruleToggle}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(nodeId)
                }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <span className={styles.toggleIcon}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
            )}

            <span className={styles.ruleSelector}>{node.selector}</span>

            {node.specificity !== undefined && (
              <span className={styles.ruleSpecificity}>
                Specificity: {node.specificity}
              </span>
            )}

            {node.loc?.startLine && (
              <span className={styles.ruleLine}>
                Line {node.loc.startLine}
              </span>
            )}
          </div>

          {isExpanded && hasDeclarations && (
            <div
              className={styles.declarationsList}
              style={{ paddingLeft: `${(depth + 1) * 16}px` }}
            >
              {node.declarations.map((decl, idx) => (
                <div key={idx} className={styles.declaration}>
                  <span className={styles.declarationProp}>{decl.property}</span>
                  <span className={styles.declarationColon}>:</span>
                  <span className={styles.declarationValue}>{decl.value}</span>
                  <span className={styles.declarationSemicolon}>;</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    } else if (node.type === 'atrule') {
      return (
        <div key={nodeId} className={styles.atRuleNode}>
          <div
            className={styles.atRuleHeader}
            style={{ paddingLeft: `${depth * 16}px` }}
          >
            {hasChildren && (
              <button
                className={styles.ruleToggle}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleExpand(nodeId)
                }}
                title={isExpanded ? 'Collapse' : 'Expand'}
              >
                <span className={styles.toggleIcon}>
                  {isExpanded ? '▼' : '▶'}
                </span>
              </button>
            )}

            <span className={styles.atRuleName}>@{node.atRule?.name}</span>

            {node.atRule?.params && (
              <span className={styles.atRuleParams}>{node.atRule.params}</span>
            )}

            {node.loc?.startLine && (
              <span className={styles.ruleLine}>
                Line {node.loc.startLine}
              </span>
            )}
          </div>

          {isExpanded && hasChildren && (
            <div className={styles.atRuleChildren}>
              {node.children.map((child, idx) => (
                <div key={idx}>
                  {renderRule(child, `${nodeId}-child-${idx}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className={styles.rulesExplorer}>
      {rules.map((rule, idx) => (
        <div key={`root-rule-${idx}`}>
          {renderRule(rule, `root-${idx}`, 0)}
        </div>
      ))}
    </div>
  )
}
