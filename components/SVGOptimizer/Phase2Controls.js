import { useState, useEffect, useMemo } from 'react'
import styles from '../../styles/svg-optimizer.module.css'
import toolConfigStyles from '../../styles/tool-config.module.css'

const OPTIMIZATION_LEVELS = {
  safe: {
    label: 'Safe',
    description: 'Preserves rendering, accessibility, and identifiers. Only removes comments and redundant whitespace.',
    disabled: false
  },
  balanced: {
    label: 'Balanced',
    description: 'Enables precision reduction (3 decimals) and removes unused IDs. Small, typically unnoticeable visual changes.',
    disabled: false
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Maximum size reduction with precision reduction (2 decimals) and ID minification. Advanced use only.',
    disabled: false
  }
}

const PHASE2_PRESETS = {
  safe: {
    attributeCleanup: true,
    removeUnusedDefs: false,
    removeEmptyGroups: true,
    precisionReduction: false,
    decimals: 3,
    shapeConversion: false,
    pathMerging: false,
    idCleanup: 'preserve',
    textHandling: 'preserve',
    textToPathConfirmed: false
  },
  balanced: {
    attributeCleanup: true,
    removeUnusedDefs: true,
    removeEmptyGroups: true,
    precisionReduction: true,
    decimals: 3,
    shapeConversion: false,
    pathMerging: false,
    idCleanup: 'unused-only',
    textHandling: 'preserve',
    textToPathConfirmed: false
  },
  aggressive: {
    attributeCleanup: true,
    removeUnusedDefs: true,
    removeEmptyGroups: true,
    precisionReduction: true,
    decimals: 2,
    shapeConversion: true,
    pathMerging: true,
    idCleanup: 'minify',
    textHandling: 'preserve',
    textToPathConfirmed: false
  }
}

export default function Phase2Controls({ onConfigChange, safetyFlags }) {
  const [selectedLevel, setSelectedLevel] = useState('safe')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [phase2Source, setPhase2Source] = useState('preset')
  const [advancedConfig, setAdvancedConfig] = useState(PHASE2_PRESETS.safe)
  const [isMinified, setIsMinified] = useState(false)

  const isAggressiveBlocked = safetyFlags?.hasAnimations || safetyFlags?.hasScripts || safetyFlags?.hasBrokenReferences
  const aggressiveBlockReason = safetyFlags?.hasAnimations
    ? 'Animations detected'
    : safetyFlags?.hasScripts
    ? 'Scripts detected'
    : safetyFlags?.hasBrokenReferences
    ? 'Broken ID references'
    : null

  const handleLevelChange = (newLevel) => {
    setSelectedLevel(newLevel)
    setAdvancedConfig(PHASE2_PRESETS[newLevel])
    setPhase2Source('preset')
  }

  const handleAdvancedConfigChange = (updates) => {
    setAdvancedConfig(prev => ({ ...prev, ...updates }))
    setPhase2Source('custom')
  }

  const memoizedAdvancedConfig = useMemo(
    () => advancedConfig,
    [
      advancedConfig.attributeCleanup,
      advancedConfig.removeUnusedDefs,
      advancedConfig.removeEmptyGroups,
      advancedConfig.precisionReduction,
      advancedConfig.decimals,
      advancedConfig.shapeConversion,
      advancedConfig.pathMerging,
      advancedConfig.idCleanup,
      advancedConfig.textHandling,
      advancedConfig.textToPathConfirmed
    ]
  )

  useEffect(() => {
    const configToSend = {
      phase2: {
        enabled: true,
        level: selectedLevel,
        source: phase2Source,
        overrides: memoizedAdvancedConfig
      },
      outputFormat: isMinified ? 'compact' : 'pretty'
    }
    onConfigChange(configToSend)
  }, [selectedLevel, memoizedAdvancedConfig, phase2Source, isMinified, onConfigChange])

  return (
    <div className={styles.phase2Controls}>
      {/* Optimization Level Dropdown */}
      <div className={styles.phase2Section}>
        <label className={styles.phase2Label} htmlFor="level-dropdown">Optimization Level</label>
        <select
          id="level-dropdown"
          value={selectedLevel}
          onChange={(e) => {
            const newLevel = e.target.value
            if (newLevel === 'aggressive' && isAggressiveBlocked) return
            handleLevelChange(newLevel)
          }}
          disabled={isAggressiveBlocked && selectedLevel === 'aggressive'}
          className={styles.phase2Select}
          style={{ marginBottom: '8px' }}
        >
          {Object.entries(OPTIMIZATION_LEVELS).map(([key, level]) => {
            const disabled = key === 'aggressive' && isAggressiveBlocked
            return (
              <option key={key} value={key} disabled={disabled}>
                {level.label}
                {disabled ? ` (${aggressiveBlockReason})` : ''}
              </option>
            )
          })}
        </select>
        <p className={styles.phase2LevelDescription} style={{ marginBottom: '0' }}>
          {OPTIMIZATION_LEVELS[selectedLevel].description}
        </p>
      </div>

      {/* Minify Toggle */}
      <div className={toolConfigStyles.toggleContainer}>
        <label className={toolConfigStyles.toggleLabel}>
          <input
            type="checkbox"
            checked={isMinified}
            onChange={(e) => setIsMinified(e.target.checked)}
            className={toolConfigStyles.toggleInput}
          />
          <span className={toolConfigStyles.toggleSlider}></span>
          <span>Minify</span>
        </label>
      </div>

      {/* Advanced Options */}
      <div className={styles.phase2Section}>
        <button
          className={styles.phase2AdvancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div className={styles.phase2Advanced}>
            <div className={styles.phase2Option}>
              <label className={styles.phase2CheckboxLabel}>
                <input
                  type="checkbox"
                  checked={advancedConfig.attributeCleanup}
                  onChange={(e) => handleAdvancedConfigChange({ attributeCleanup: e.target.checked })}
                />
                Attribute Cleanup
              </label>
              <span className={styles.phase2OptionDescription}>Remove default and redundant attributes</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2CheckboxLabel}>
                <input
                  type="checkbox"
                  checked={advancedConfig.removeUnusedDefs}
                  onChange={(e) => handleAdvancedConfigChange({ removeUnusedDefs: e.target.checked })}
                />
                Remove Unused Defs
              </label>
              <span className={styles.phase2OptionDescription}>Remove unused gradients, masks, filters, and patterns from &lt;defs&gt;</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2CheckboxLabel}>
                <input
                  type="checkbox"
                  checked={advancedConfig.removeEmptyGroups !== false}
                  onChange={(e) => handleAdvancedConfigChange({ removeEmptyGroups: e.target.checked })}
                />
                Remove Empty Groups
              </label>
              <span className={styles.phase2OptionDescription}>Remove empty &lt;g&gt; elements with no children or attributes</span>
            </div>

            <div className={styles.phase2Option}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className={styles.phase2CheckboxLabel}>
                  <input
                    type="checkbox"
                    checked={advancedConfig.precisionReduction}
                    onChange={(e) => handleAdvancedConfigChange({ precisionReduction: e.target.checked })}
                  />
                  Precision Reduction
                </label>
                {safetyFlags?.hasText && advancedConfig.precisionReduction && advancedConfig.decimals < 3 && (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '3px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    color: '#856404',
                    fontWeight: '500',
                    whiteSpace: 'nowrap'
                  }}>
                    <span>⚠</span>
                    <span>Text detected — precision &lt; 3 may affect glyphs</span>
                  </span>
                )}
              </div>
              {advancedConfig.precisionReduction && (
                <div className={styles.phase2Indent}>
                  <label className={styles.phase2SliderLabel}>
                    Decimal Places: {advancedConfig.decimals}
                    <input
                      type="range"
                      min="0"
                      max="6"
                      value={advancedConfig.decimals}
                      onChange={(e) => handleAdvancedConfigChange({ decimals: parseInt(e.target.value) })}
                      className={styles.phase2Slider}
                    />
                  </label>
                </div>
              )}
              <span className={styles.phase2OptionDescription}>Reduce numeric precision in coordinates</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2CheckboxLabel}>
                <input
                  type="checkbox"
                  checked={advancedConfig.shapeConversion}
                  onChange={(e) => handleAdvancedConfigChange({ shapeConversion: e.target.checked })}
                />
                Shape Conversion
              </label>
              <span className={styles.phase2OptionDescription}>Convert shapes (circle, rect, etc) to paths</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2CheckboxLabel}>
                <input
                  type="checkbox"
                  checked={advancedConfig.pathMerging}
                  onChange={(e) => handleAdvancedConfigChange({ pathMerging: e.target.checked })}
                />
                Path Merging
              </label>
              <span className={styles.phase2OptionDescription}>Merge paths with identical styles (only if fill, stroke, fill-rule, and transform match)</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2Label}>ID Cleanup Mode</label>
              <select
                value={advancedConfig.idCleanup}
                onChange={(e) => handleAdvancedConfigChange({ idCleanup: e.target.value })}
                className={styles.phase2Select}
              >
                <option value="preserve">Preserve All IDs</option>
                <option value="unused-only">Remove Unused IDs</option>
                <option value="minify">Minify IDs</option>
              </select>
              <span className={styles.phase2OptionDescription}>Control how IDs are handled during optimization</span>

              {advancedConfig.idCleanup === 'unused-only' && (
                <div className={styles.phase2OptionNote}>
                  ℹ️ Removes IDs not referenced internally. External CSS/JS selectors may break.
                </div>
              )}

              {advancedConfig.idCleanup === 'minify' && (
                <div className={styles.phase2OptionWarning}>
                  ⚠️ Minified IDs (a, b, c...) will break external CSS/JS selectors. Use only for standalone SVGs.
                </div>
              )}
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2Label}>Text Handling</label>
              <select
                value={advancedConfig.textHandling}
                onChange={(e) => handleAdvancedConfigChange({ textHandling: e.target.value, textToPathConfirmed: false })}
                className={styles.phase2Select}
              >
                <option value="preserve">Preserve Text</option>
                <option value="warn-only">Warn Only</option>
                <option value="convert-to-path">Convert to Paths</option>
              </select>

              {advancedConfig.textHandling === 'convert-to-path' && (
                <div className={styles.phase2TextConfirmation}>
                  <label className={styles.phase2CheckboxLabel}>
                    <input
                      type="checkbox"
                      checked={advancedConfig.textToPathConfirmed}
                      onChange={(e) => handleAdvancedConfigChange({ textToPathConfirmed: e.target.checked })}
                    />
                    <span style={{ color: '#ff9800' }}>I understand this is irreversible and may reduce accessibility</span>
                  </label>
                </div>
              )}
              <span className={styles.phase2OptionDescription}>How to handle text elements</span>
            </div>
          </div>
        )}
      </div>

      {selectedLevel === 'aggressive' && !isAggressiveBlocked && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '4px',
          marginTop: '12px',
          fontSize: '13px',
          color: '#856404'
        }}>
          <strong>⚠ Warning:</strong> Aggressive mode may break external JavaScript selectors and CSS rules that reference element IDs. Review the optimized SVG before deploying to production.
        </div>
      )}

      {selectedLevel === 'aggressive' && isAggressiveBlocked && (
        <div className={styles.phase2BlockedMessage}>
          <strong>Aggressive mode blocked:</strong> {aggressiveBlockReason}. This SVG contains features that may be affected by aggressive optimization.
        </div>
      )}
    </div>
  )
}
