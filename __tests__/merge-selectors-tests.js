/**
 * Test Suite: Merge Selectors (Phase 7E)
 * 
 * Tests the critical bug fix where CSS-only duplicates were incorrectly removing HTML rules
 * 
 * Issue: When merging selectors that exist in BOTH HTML and CSS tabs:
 * - If only CSS has duplicates → should merge CSS duplicates and keep HTML rules
 * - If only HTML has duplicates → should merge HTML duplicates and keep CSS rules
 * - Bug was: removedRuleIndices was removing ALL rules except base rule, including from other sources
 * - Fix: Only remove duplicates from the source that has duplicates
 */

import {
  findAllMergeableGroups,
  mergeRuleGroup,
  mergeSelectedGroups,
  serializeMergedRulesByOrigin,
} from '../lib/tools/mergeSelectors'

// Test Case 1: CSS-only duplicates with HTML rule present
// This is the exact test case from Kyle's bug report
function testCssOnlyDuplicatesPreservesHtml() {
  console.log('\n=== TEST 1: CSS-only Duplicates (preserve HTML rules) ===')
  
  // Input: 1 HTML rule + 2 CSS duplicate rules for ".button"
  const rulesTree = [
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 0,
      origin: { source: 'html' },
      loc: { startLine: 1, endLine: 1 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 1,
      origin: { source: 'css' },
      loc: { startLine: 5, endLine: 5 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 2,
      origin: { source: 'css' },
      loc: { startLine: 9, endLine: 9 }
    }
  ]
  
  // Find mergeable groups
  const mergeableGroups = findAllMergeableGroups(rulesTree)
  console.log(`✓ Found ${mergeableGroups.length} mergeable group(s)`)
  
  if (mergeableGroups.length === 0) {
    console.error('✗ FAILED: Expected to find 1 mergeable group')
    return false
  }
  
  const group = mergeableGroups[0]
  console.log(`  Group: ${group.selector} with ${group.count} rules`)
  
  // Merge the group
  const mergeResult = mergeRuleGroup(group)
  console.log(`  Merged rule ruleIndex: ${mergeResult.mergedRule.ruleIndex}`)
  console.log(`  Merged rule origin: ${mergeResult.mergedRule.origin?.source}`)
  console.log(`  Rules to remove indices: [${mergeResult.removedRuleIndices.join(', ')}]`)
  
  // CRITICAL CHECKS:
  // 1. Should only remove CSS duplicate (index 2), NOT the HTML rule (index 0)
  const removedSet = new Set(mergeResult.removedRuleIndices)
  
  if (removedSet.has(0)) {
    console.error('✗ FAILED: HTML rule (index 0) should NOT be removed for CSS-only duplicates')
    return false
  }
  
  if (!removedSet.has(2)) {
    console.error('✗ FAILED: CSS duplicate (index 2) should be removed')
    return false
  }
  
  console.log('✓ Correct rules marked for removal (only CSS duplicate, not HTML)')
  
  // Now test the full merge flow
  const mergeResult2 = mergeSelectedGroups(rulesTree, new Set(['.button']))
  const { mutatedRulesTree } = mergeResult2
  
  console.log(`✓ After merge: ${mutatedRulesTree.length} rules remain`)
  
  // Should have 2 rules: 1 HTML + 1 merged CSS
  if (mutatedRulesTree.length !== 2) {
    console.error(`✗ FAILED: Expected 2 rules after merge (1 HTML + 1 CSS), got ${mutatedRulesTree.length}`)
    return false
  }
  
  // Check origins
  const htmlRule = mutatedRulesTree.find(r => r.origin?.source === 'html')
  const cssRule = mutatedRulesTree.find(r => r.origin?.source === 'css')
  
  if (!htmlRule) {
    console.error('✗ FAILED: HTML rule missing after merge')
    return false
  }
  
  if (!cssRule) {
    console.error('✗ FAILED: CSS rule missing after merge')
    return false
  }
  
  console.log('✓ Both HTML and CSS rules preserved')
  
  // Serialize by origin
  const serialized = serializeMergedRulesByOrigin(mutatedRulesTree)
  console.log(`  HTML output: ${serialized.html.length > 0 ? '1 rule' : 'empty'}`)
  console.log(`  CSS output: ${serialized.css.length > 0 ? '1 rule' : 'empty'}`)
  
  if (serialized.html.length === 0 || serialized.css.length === 0) {
    console.error('✗ FAILED: Both HTML and CSS outputs should have content')
    return false
  }
  
  console.log('✓ PASS: CSS-only duplicates handled correctly')
  return true
}

// Test Case 2: HTML-only duplicates with CSS rule present
function testHtmlOnlyDuplicatesPreservesCss() {
  console.log('\n=== TEST 2: HTML-only Duplicates (preserve CSS rules) ===')
  
  // Input: 2 HTML duplicate rules + 1 CSS rule for ".button"
  const rulesTree = [
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 0,
      origin: { source: 'html' },
      loc: { startLine: 1, endLine: 1 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 1,
      origin: { source: 'html' },
      loc: { startLine: 5, endLine: 5 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 2,
      origin: { source: 'css' },
      loc: { startLine: 9, endLine: 9 }
    }
  ]
  
  const mergeableGroups = findAllMergeableGroups(rulesTree)
  if (mergeableGroups.length === 0) {
    console.error('✗ FAILED: Expected to find 1 mergeable group')
    return false
  }
  
  const group = mergeableGroups[0]
  const mergeResult = mergeRuleGroup(group)
  
  console.log(`✓ Found mergeable group: ${group.selector}`)
  console.log(`  Rules to remove indices: [${mergeResult.removedRuleIndices.join(', ')}]`)
  
  // CRITICAL: Should only remove HTML duplicate (index 1), NOT the CSS rule (index 2)
  const removedSet = new Set(mergeResult.removedRuleIndices)
  
  if (removedSet.has(2)) {
    console.error('✗ FAILED: CSS rule (index 2) should NOT be removed for HTML-only duplicates')
    return false
  }
  
  if (!removedSet.has(1)) {
    console.error('✗ FAILED: HTML duplicate (index 1) should be removed')
    return false
  }
  
  console.log('✓ Correct rules marked for removal (only HTML duplicate, not CSS)')
  
  const mergeResult2 = mergeSelectedGroups(rulesTree, new Set(['.button']))
  const { mutatedRulesTree } = mergeResult2
  
  // Should have 2 rules: 1 merged HTML + 1 CSS
  if (mutatedRulesTree.length !== 2) {
    console.error(`✗ FAILED: Expected 2 rules after merge, got ${mutatedRulesTree.length}`)
    return false
  }
  
  console.log('✓ PASS: HTML-only duplicates handled correctly')
  return true
}

// Test Case 3: Both HTML and CSS have duplicates (consolidate into CSS)
function testBothSourcesHaveDuplicates() {
  console.log('\n=== TEST 3: Both sources have duplicates (consolidate to CSS) ===')
  
  // Input: 2 HTML rules + 2 CSS rules (duplicates in both)
  const rulesTree = [
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'red' }],
      ruleIndex: 0,
      origin: { source: 'html' },
      loc: { startLine: 1, endLine: 1 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'blue' }],
      ruleIndex: 1,
      origin: { source: 'html' },
      loc: { startLine: 5, endLine: 5 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'green' }],
      ruleIndex: 2,
      origin: { source: 'css' },
      loc: { startLine: 9, endLine: 9 }
    },
    {
      type: 'rule',
      selector: '.button',
      declarations: [{ property: 'color', value: 'yellow' }],
      ruleIndex: 3,
      origin: { source: 'css' },
      loc: { startLine: 13, endLine: 13 }
    }
  ]
  
  const mergeableGroups = findAllMergeableGroups(rulesTree)
  if (mergeableGroups.length === 0) {
    console.error('✗ FAILED: Expected to find 1 mergeable group')
    return false
  }
  
  const group = mergeableGroups[0]
  const mergeResult = mergeRuleGroup(group)
  
  console.log(`✓ Found mergeable group: ${group.selector}`)
  console.log(`  Merged rule origin: ${mergeResult.mergedRule.origin?.source}`)
  console.log(`  Rules to remove indices: [${mergeResult.removedRuleIndices.join(', ')}]`)
  
  // When both have duplicates, should consolidate into CSS
  if (mergeResult.mergedRule.origin?.source !== 'css') {
    console.error('✗ FAILED: Consolidation should be to CSS when both sources have duplicates')
    return false
  }
  
  console.log('✓ Consolidation correctly set to CSS')
  
  const mergeResult2 = mergeSelectedGroups(rulesTree, new Set(['.button']))
  const { mutatedRulesTree } = mergeResult2
  
  // Should have 1 rule (all consolidated into CSS)
  if (mutatedRulesTree.length !== 1) {
    console.error(`✗ FAILED: Expected 1 rule after consolidation, got ${mutatedRulesTree.length}`)
    return false
  }
  
  if (mutatedRulesTree[0].origin?.source !== 'css') {
    console.error('✗ FAILED: Final rule should have CSS origin')
    return false
  }
  
  console.log('✓ PASS: Both sources consolidation handled correctly')
  return true
}

// Run all tests
export function runMergeSelectorTests() {
  console.log('=' .repeat(60))
  console.log('MERGE SELECTORS TEST SUITE - Phase 7E Fix')
  console.log('=' .repeat(60))
  
  const results = []
  results.push(testCssOnlyDuplicatesPreservesHtml())
  results.push(testHtmlOnlyDuplicatesPreservesCss())
  results.push(testBothSourcesHaveDuplicates())
  
  console.log('\n' + '=' .repeat(60))
  const passed = results.filter(r => r).length
  const total = results.length
  console.log(`RESULTS: ${passed}/${total} tests passed`)
  console.log('=' .repeat(60))
  
  return {
    totalTests: total,
    passedTests: passed,
    failedTests: total - passed,
    allPassed: passed === total
  }
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  const results = runMergeSelectorTests()
  process.exit(results.allPassed ? 0 : 1)
}

export default runMergeSelectorTests
