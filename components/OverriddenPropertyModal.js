import React from 'react'
import styles from '../styles/rule-inspector.module.css'

/**
 * Helper to get origin label for a rule
 */
function getOriginLabel(rule) {
  if (!rule?.origin) return 'CSS'
  const source = rule.origin.source

  if (source === 'html') {
    return 'HTML <style>'
  } else if (source === 'css') {
    return 'CSS tab'
  }
  return 'CSS'
}

/**
 * OverriddenPropertyModal Component
 *
 * Shows information about an overridden property and suggests solutions:
 * 1. Edit the effective property in the later rule directly
 * 2. Merge the selectors to consolidate the rules
 *
 * Props:
 *   property: string - The property name (e.g., "color")
 *   ruleIndex: number - Index of the rule containing the overridden property
 *   selector: string - The selector of the rule
 *   overridingRuleIndex: number - Index of the rule that overrides this property
 *   overridingRule: object - The rule object containing the effective property
 *   affectingRules: array - All rules affecting the selector
 *   onMergeClick: (mergeableGroups) => void - Callback when user clicks merge suggestion
 *   onNavigateToEffective: () => void - Callback when user wants to navigate to effective rule
 *   onClose: () => void - Callback when modal is closed
 */
export default function OverriddenPropertyModal({
  property = '',
  ruleIndex = null,
  selector = '',
  overridingRuleIndex = null,
  overridingRule = null,
  affectingRules = [],
  mergeableGroups = [],
  onMergeClick = null,
  onClose = null,
}) {
  if (!property || overridingRule === null) {
    return null
  }

  // Find if this rule and the overriding rule have the same selector (mergeable)
  const isMergeable = mergeableGroups && mergeableGroups.some(group => group.selector === selector)

  // Find the overridden rule to get its origin info
  const overriddenRule = affectingRules.find(r => r.ruleIndex === ruleIndex)

  return (
    <div className={styles.confirmationOverlay} onClick={onClose}>
      <div className={styles.confirmationModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.confirmationHeader}>
          <h3 className={styles.confirmationTitle}>
            ⚠️ Property Overridden
          </h3>
        </div>

        <div className={styles.confirmationContent}>
          <p className={styles.confirmationWarning}>
            This property is overridden by a later rule in the CSS cascade.
            <br />
            Changes here will have no effect on the preview.
          </p>

          {/* Current Property Info */}
          <div className={styles.overriddenPropertyDetails}>
            <div className={styles.overriddenPropertySection}>
              <div className={styles.overriddenPropertyLabel}>Current Rule (Overridden):</div>
              <div className={styles.overriddenPropertyValue}>
                <code className={styles.overriddenPropertySelector}>{selector}</code>
                {overriddenRule?.origin && (
                  <span className={styles.overriddenPropertyOrigin} title={`Origin: ${getOriginLabel(overriddenRule)}`}>
                    {getOriginLabel(overriddenRule)}
                  </span>
                )}
                {overridingRule.loc && (
                  <span className={styles.overriddenPropertyLineNumber}>
                    Line {ruleIndex !== undefined ? ruleIndex : '?'}
                  </span>
                )}
              </div>
              <div className={styles.overriddenPropertyDecl}>
                {property}: <span className={styles.overriddenPropertyDeclValue}>...</span>;
              </div>
            </div>

            {/* Effective Property Info */}
            <div className={styles.overriddenPropertyArrow}>↓ cascade ↓</div>
            <div className={styles.overriddenPropertySection}>
              <div className={styles.overriddenPropertyLabel}>Effective Rule (Overriding):</div>
              <div className={styles.overriddenPropertyValue}>
                <code className={styles.overriddenPropertySelector}>{overridingRule.selector}</code>
                {overridingRule?.origin && (
                  <span className={styles.overriddenPropertyOrigin} title={`Origin: ${getOriginLabel(overridingRule)}`}>
                    {getOriginLabel(overridingRule)}
                  </span>
                )}
                {overridingRule.loc && (
                  <span className={styles.overriddenPropertyLineNumber}>
                    Line {overridingRule.loc.startLine}
                  </span>
                )}
              </div>
              <div className={styles.overriddenPropertyDecl}>
                {property}: <span className={styles.overriddenPropertyDeclValue}>
                  {overridingRule.declarations?.find(d => d.property === property)?.value || 'N/A'}
                </span>;
              </div>
            </div>
          </div>

          {/* Solutions */}
          <div className={styles.solutionsPanel}>
            <div className={styles.solutionsLabel}>💡 Suggested Solutions:</div>

            {/* Solution 1: Edit the effective property */}
            <div className={styles.solutionItem}>
              <div className={styles.solutionNumber}>1</div>
              <div className={styles.solutionContent}>
                <div className={styles.solutionTitle}>Edit the effective property</div>
                <div className={styles.solutionDescription}>
                  Click on the <code className={styles.inlineCode}>{property}</code> property in the rule at Line {overridingRule.loc?.startLine} to edit it there instead. That's where the actual change will be applied.
                </div>
              </div>
            </div>

            {/* Solution 2: Merge selectors (if applicable) */}
            {isMergeable && (
              <div className={styles.solutionItem}>
                <div className={styles.solutionNumber}>2</div>
                <div className={styles.solutionContent}>
                  <div className={styles.solutionTitle}>Merge selectors</div>
                  <div className={styles.solutionDescription}>
                    Combine the rules with the same selector into a single rule, so all properties are in one place. This eliminates the cascade conflict.
                  </div>
                  <div className={styles.solutionPros}>
                    <span className={styles.solutionProLabel}>✓ Pros:</span> Cleaner code, single rule location, no cascade surprises
                  </div>
                  <div className={styles.solutionCons}>
                    <span className={styles.solutionConLabel}>✗ Cons:</span> May lose important rule ordering if cascade is intentional; loses media query or pseudo-state isolation
                  </div>
                </div>
              </div>
            )}

            {/* Solution 3: Leave as-is (if not mergeable) */}
            {!isMergeable && (
              <div className={styles.solutionItem}>
                <div className={styles.solutionNumber}>2</div>
                <div className={styles.solutionContent}>
                  <div className={styles.solutionTitle}>Understand the cascade</div>
                  <div className={styles.solutionDescription}>
                    This override is intentional. The rule at Line {overridingRule.loc?.startLine} is more specific or comes later in the stylesheet, so it wins. Remove this property if it's not needed, or adjust the logic.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.confirmationActions}>
          <button
            className={styles.confirmationCancelButton}
            onClick={onClose}
          >
            Close
          </button>
          {isMergeable && onMergeClick && (
            <button
              className={styles.confirmationMergeButton}
              onClick={() => onMergeClick(mergeableGroups)}
              title="Open merge selectors dialog"
            >
              🧩 Merge Selectors
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
