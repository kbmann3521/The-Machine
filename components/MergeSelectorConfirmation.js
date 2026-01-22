import React, { useState } from 'react'
import {
  mergeSelectedGroups,
  generateCodePreview,
  applyMergeToSourceText,
  serializeRulesToCSS,
  serializeMergedRulesByOrigin,
} from '../lib/tools/mergeSelectors'
import DirectionChoiceModal from './DirectionChoiceModal'
import styles from '../styles/rule-inspector.module.css'

/**
 * MergeSelectorConfirmation Modal Component
 *
 * Shows a detailed preview of what will happen when merging duplicate selectors
 * and requires explicit confirmation before applying the changes.
 *
 * Props:
 *   mergeableGroups: array of mergeable rule groups
 *   rulesTree: current rules tree (contains rules from both HTML and CSS sources)
 *   sourceText: original CSS source text (to preserve formatting/comments)
 *   triggeringSelector: the selector from which the merge button was clicked (only this will be pre-checked)
 *   onConfirm: (mergeResult) => void - callback when user confirms the merge
 *              where mergeResult = { mergedCSS, mergedHTML } with rules serialized by origin
 *   onCancel: () => void - callback when user cancels
 */
export default function MergeSelectorConfirmation({
  mergeableGroups = [],
  rulesTree = [],
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

  // State for direction choice modal
  const [showDirectionModal, setShowDirectionModal] = useState(false)
  const [directionModalData, setDirectionModalData] = useState(null)

  if (!mergeableGroups || mergeableGroups.length === 0) {
    return null
  }

  // Generate the merge result based on selected selectors
  const mergeResult = mergeSelectedGroups(rulesTree, selectedSelectors)
  const { summary, mutatedRulesTree } = mergeResult

  // Serialize the merged rulesTree back to CSS by origin
  // This gives us separate CSS for HTML (<style>) and CSS (tab) sources
  const mergedByOrigin = serializeMergedRulesByOrigin(mutatedRulesTree)
  const mergedCSS = mergedByOrigin.css
  const mergedHTML = mergedByOrigin.html

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

  // Check if any selected group has cross-tab duplicates
  const selectedGroups = mergeableGroups.filter(g => selectedSelectors.has(g.selector))
  const groupsWithCrossTabDuplicates = selectedGroups.filter(group => {
    const htmlRules = group.rules.filter(r => r.origin?.source === 'html')
    const cssRules = group.rules.filter(r => r.origin?.source === 'css' || !r.origin?.source)
    const hasHtmlRules = htmlRules.length > 0
    const hasCssRules = cssRules.length > 0
    return hasHtmlRules && hasCssRules // Cross-tab duplicate
  })

  const hasCrossTabDuplicates = groupsWithCrossTabDuplicates.length > 0

  const handleConfirm = () => {
    if (!onConfirm || selectedSelectors.size === 0) return

    // If there are cross-tab duplicates, show direction choice modal
    if (hasCrossTabDuplicates) {
      // Get info about the first cross-tab duplicate for the modal
      const firstCrossTabbedGroup = groupsWithCrossTabDuplicates[0]
      const htmlCount = firstCrossTabbedGroup.rules.filter(r => r.origin?.source === 'html').length
      const cssCount = firstCrossTabbedGroup.rules.filter(r => r.origin?.source === 'css' || !r.origin?.source).length

      setDirectionModalData({
        selector: firstCrossTabbedGroup.selector,
        htmlCount,
        cssCount,
      })
      setShowDirectionModal(true)
      return
    }

    // No cross-tab duplicates - apply merge with default direction (CSS)
    applyMergeWithDirection('css')
  }

  const applyMergeWithDirection = (direction) => {
    // Re-compute merge with the specified direction
    const mergeResultWithDirection = mergeSelectedGroups(rulesTree, selectedSelectors, direction)
    const mergedByOriginWithDir = serializeMergedRulesByOrigin(mergeResultWithDirection.mutatedRulesTree)

    if (onConfirm) {
      onConfirm({
        mergedCSS: mergedByOriginWithDir.css,
        mergedHTML: mergedByOriginWithDir.html,
      })
    }

    setShowDirectionModal(false)
    setDirectionModalData(null)
  }

  const handleDirectionChoice = (direction) => {
    applyMergeWithDirection(direction)
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

      {/* Direction Choice Modal - shown when cross-tab duplicates exist */}
      {showDirectionModal && directionModalData && (
        <DirectionChoiceModal
          selector={directionModalData.selector}
          htmlCount={directionModalData.htmlCount}
          cssCount={directionModalData.cssCount}
          onSelectDirection={handleDirectionChoice}
          onCancel={() => {
            setShowDirectionModal(false)
            setDirectionModalData(null)
          }}
        />
      )}
    </div>
  )
}
