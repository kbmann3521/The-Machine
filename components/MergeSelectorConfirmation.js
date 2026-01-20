import React, { useState } from 'react'
import {
  mergeSelectedGroups,
  generateCodePreview,
  applyMergeToSourceText,
  serializeRulesToCSS
} from '../lib/tools/mergeSelectors'
import styles from '../styles/rule-inspector.module.css'

/**
 * MergeSelectorConfirmation Modal Component
 *
 * Shows a detailed preview of what will happen when merging duplicate selectors
 * and requires explicit confirmation before applying the changes.
 *
 * Props:
 *   mergeableGroups: array of mergeable rule groups
 *   rulesTree: current rules tree
 *   sourceText: original CSS source text (to preserve formatting/comments)
 *   triggeringSelector: the selector from which the merge button was clicked (only this will be pre-checked)
 *   onConfirm: (newCSSText) => void - callback when user confirms the merge
 *   onCancel: () => void - callback when user cancels
 */
export default function MergeSelectorConfirmation({
  mergeableGroups = [],
  rulesTree = [],
  sourceText = '',
  triggeringSelector = null,
  onConfirm = null,
  onCancel = null,
}) {
  // Initialize selectedSelectors - only the triggering selector is checked by default
  const [selectedSelectors, setSelectedSelectors] = useState(() => {
    if (triggeringSelector) {
      return new Set([triggeringSelector])
    }
    return new Set(mergeableGroups.map(g => g.selector))
  })
  const [expandedSelector, setExpandedSelector] = useState(
    mergeableGroups.length > 0 ? mergeableGroups[0].selector : null
  )

  if (!mergeableGroups || mergeableGroups.length === 0) {
    return null
  }

  // Generate the merge result based on selected selectors
  const mergeResult = mergeSelectedGroups(rulesTree, selectedSelectors)
  const { summary, mergeInfo } = mergeResult

  // Apply merge to source text
  // If sourceText contains .pwt-markdown-preview prefix, regenerate from rulesTree to avoid scoping issues
  let sourceToMerge = sourceText
  if (sourceText && sourceText.includes('.pwt-markdown-preview')) {
    // Regenerate unscoped CSS from rulesTree for accurate merging
    sourceToMerge = rulesTree && rulesTree.length > 0
      ? serializeRulesToCSS(rulesTree)
      : sourceText
  }

  const mergedCSS = sourceToMerge && mergeInfo
    ? applyMergeToSourceText(sourceToMerge, rulesTree, mergeInfo)
    : ''

  // Get the currently expanded selector's group for preview
  const expandedGroup = mergeableGroups.find(g => g.selector === expandedSelector)
  const isExpandedSelected = selectedSelectors.has(expandedSelector)
  const codePreview = isExpandedSelected && expandedGroup
    ? generateCodePreview(expandedGroup, rulesTree)
    : null

  const handleToggleSelector = (selector) => {
    const newSelected = new Set(selectedSelectors)
    if (newSelected.has(selector)) {
      newSelected.delete(selector)
    } else {
      newSelected.add(selector)
    }
    setSelectedSelectors(newSelected)

    // If the currently expanded selector was deselected, pick another
    if (!newSelected.has(expandedSelector) && newSelected.size > 0) {
      setExpandedSelector(Array.from(newSelected)[0])
    } else if (newSelected.has(expandedSelector)) {
      // Keep it expanded if still selected
      setExpandedSelector(expandedSelector)
    }
  }

  const handleConfirm = () => {
    if (onConfirm && selectedSelectors.size > 0) {
      onConfirm(mergedCSS)
    }
  }

  const isAnySelected = selectedSelectors.size > 0
  const selectAllText = selectedSelectors.size === mergeableGroups.length ? 'Deselect All' : 'Select All'

  const handleSelectAll = () => {
    if (selectedSelectors.size === mergeableGroups.length) {
      setSelectedSelectors(new Set())
      setExpandedSelector(null)
    } else {
      const allSelectors = new Set(mergeableGroups.map(g => g.selector))
      setSelectedSelectors(allSelectors)
      setExpandedSelector(mergeableGroups[0].selector)
    }
  }

  return (
    <div className={styles.confirmationOverlay} onClick={onCancel}>
      <div className={styles.confirmationModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmationHeader}>
          <h3 className={styles.confirmationTitle}>
            🧩 Merge Duplicate Selectors
          </h3>
        </div>

        <div className={styles.confirmationContent}>
          <p className={styles.confirmationWarning}>
            ✓ This is a safe, deterministic transformation.
            <br />
            No CSS logic changes — only consolidation.
          </p>

          {/* Summary Stats */}
          <div className={styles.mergeSummaryStats}>
            <div className={styles.mergeSummaryStat}>
              <div className={styles.mergeSummaryStatLabel}>Selectors to Merge</div>
              <div className={styles.mergeSummaryStatValue}>{summary.totalGroupsMerged}</div>
            </div>
            <div className={styles.mergeSummaryStat}>
              <div className={styles.mergeSummaryStatLabel}>Rules to Remove</div>
              <div className={styles.mergeSummaryStatValue}>{summary.totalRulesRemoved}</div>
            </div>
            <div className={styles.mergeSummaryStat}>
              <div className={styles.mergeSummaryStatLabel}>Final Rules</div>
              <div className={styles.mergeSummaryStatValue}>
                {mergeResult.mutatedRulesTree.length}
              </div>
            </div>
          </div>

          {/* Selectors with Checkboxes */}
          <div className={styles.mergeDetailsList}>
            <div className={styles.mergeDetailsHeaderRow}>
              <div className={styles.mergeDetailsTitle}>Selectors to Merge:</div>
              <button
                className={styles.mergeSelectAllButton}
                onClick={handleSelectAll}
              >
                {selectAllText}
              </button>
            </div>

            {mergeableGroups.map((group) => {
              const isSelected = selectedSelectors.has(group.selector)
              const isExpanded = expandedSelector === group.selector

              return (
                <div key={group.selector} className={styles.mergeSelectableItem}>
                  <div className={styles.mergeSelectableHeader}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelector(group.selector)}
                      className={styles.mergeCheckbox}
                    />
                    <span className={styles.mergeDetailSelector}>
                      {group.selector}
                    </span>
                    <span className={styles.mergeDetailChange}>
                      {group.count} → 1
                    </span>
                    <button
                      className={styles.mergeExpandButton}
                      onClick={() => setExpandedSelector(isExpanded ? null : group.selector)}
                      disabled={!isSelected}
                      title={isSelected ? 'Show preview' : 'Check selector to view preview'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  </div>

                  {isExpanded && isSelected && codePreview && (
                    <div className={styles.mergeCodePreview}>
                      <pre className={styles.mergeCodePreviewText}>
                        {codePreview}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.confirmationActions}>
          <button
            className={styles.confirmationCancelButton}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={styles.confirmationMergeButton}
            onClick={handleConfirm}
            disabled={!isAnySelected}
            title={isAnySelected ? 'Apply the merge to your CSS' : 'Select at least one selector to merge'}
          >
            ✓ Apply Merge
          </button>
        </div>
      </div>
    </div>
  )
}
