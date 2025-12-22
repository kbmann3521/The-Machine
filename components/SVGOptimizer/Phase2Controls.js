import { useState, useEffect, useMemo } from 'react'
import styles from '../../styles/svg-optimizer.module.css'

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
    removeUnusedDefs: true,
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
    precisionReduction: true,
    decimals: 2,
    shapeConversion: false,
    pathMerging: false,
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
  const [outputFormat, setOutputFormat] = useState('compact')

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
      outputFormat
    }
    onConfigChange(configToSend)
  }, [selectedLevel, memoizedAdvancedConfig, phase2Source, outputFormat, onConfigChange])

  return (
    <div className={styles.phase2Controls}>
      {/* Optimization Level & Output Format Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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

        {/* Output Format Toggle */}
        <div className={styles.phase2Section}>
          <label className={styles.phase2Label}>Output Format</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <button
              onClick={() => setOutputFormat('compact')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: outputFormat === 'compact' ? '#2196f3' : 'rgba(33, 150, 243, 0.1)',
                color: outputFormat === 'compact' ? 'white' : '#2196f3',
                border: '1px solid ' + (outputFormat === 'compact' ? '#2196f3' : 'rgba(33, 150, 243, 0.3)'),
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Compact
            </button>
            <button
              onClick={() => setOutputFormat('pretty')}
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: outputFormat === 'pretty' ? '#2196f3' : 'rgba(33, 150, 243, 0.1)',
                color: outputFormat === 'pretty' ? 'white' : '#2196f3',
                border: '1px solid ' + (outputFormat === 'pretty' ? '#2196f3' : 'rgba(33, 150, 243, 0.3)'),
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Pretty
            </button>
          </div>
          <p className={styles.phase2LevelDescription} style={{ marginBottom: '0', fontSize: '11px' }}>
            {outputFormat === 'compact' ? 'Single line, minified' : 'Formatted with indentation'}
          </p>
        </div>
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
                  checked={advancedConfig.precisionReduction}
                  onChange={(e) => handleAdvancedConfigChange({ precisionReduction: e.target.checked })}
                />
                Precision Reduction
              </label>
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
