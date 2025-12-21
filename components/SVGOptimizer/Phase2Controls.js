import { useState, useEffect, useMemo } from 'react'
import styles from '../../styles/svg-optimizer.module.css'

const OPTIMIZATION_LEVELS = {
  safe: {
    label: 'Safe',
    description: 'Preserves rendering, accessibility, and identifiers.',
    disabled: false
  },
  balanced: {
    label: 'Balanced',
    description: 'May introduce small, typically unnoticeable visual changes.',
    disabled: false
  },
  aggressive: {
    label: 'Aggressive',
    description: 'Maximum size reduction. Advanced use only.',
    disabled: false
  }
}

export default function Phase2Controls({ onConfigChange, safetyFlags }) {
  const [selectedLevel, setSelectedLevel] = useState('safe')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedConfig, setAdvancedConfig] = useState({
    attributeCleanup: true,
    precisionReduction: false,
    decimals: 3,
    shapeConversion: false,
    pathMerging: false,
    idCleanup: 'preserve',
    textHandling: 'preserve',
    textToPathConfirmed: false
  })

  const isAggressiveBlocked = safetyFlags?.hasAnimations || safetyFlags?.hasScripts || safetyFlags?.hasBrokenReferences
  const aggressiveBlockReason = safetyFlags?.hasAnimations
    ? 'Animations detected'
    : safetyFlags?.hasScripts
    ? 'Scripts detected'
    : safetyFlags?.hasBrokenReferences
    ? 'Broken ID references'
    : null

  const memoizedAdvancedConfig = useMemo(
    () => advancedConfig,
    [
      advancedConfig.attributeCleanup,
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
        overrides: memoizedAdvancedConfig
      }
    }
    onConfigChange(configToSend)
  }, [selectedLevel, memoizedAdvancedConfig, onConfigChange])

  return (
    <div className={styles.phase2Controls}>
      {/* Optimization Level Selector */}
      <div className={styles.phase2Section}>
        <label className={styles.phase2Label}>Optimization Level</label>
        <div className={styles.phase2LevelGroup}>
          {Object.entries(OPTIMIZATION_LEVELS).map(([key, level]) => {
            const disabled = key === 'aggressive' && isAggressiveBlocked
            return (
              <div key={key} className={styles.phase2LevelOption}>
                <input
                  type="radio"
                  id={`level-${key}`}
                  name="optimizationLevel"
                  value={key}
                  checked={selectedLevel === key}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  disabled={disabled}
                  className={styles.phase2Radio}
                />
                <label htmlFor={`level-${key}`} className={styles.phase2RadioLabel}>
                  <span className={styles.phase2RadioText}>{level.label}</span>
                  {disabled && (
                    <span
                      className={styles.phase2Disabled}
                      title={aggressiveBlockReason}
                    >
                      ({aggressiveBlockReason})
                    </span>
                  )}
                </label>
              </div>
            )
          })}
        </div>
        <p className={styles.phase2LevelDescription}>
          {OPTIMIZATION_LEVELS[selectedLevel].description}
        </p>
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
                  onChange={(e) => setAdvancedConfig({ ...advancedConfig, attributeCleanup: e.target.checked })}
                />
                Attribute Cleanup
              </label>
              <span className={styles.phase2OptionDescription}>Remove default and redundant attributes</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2CheckboxLabel}>
                <input
                  type="checkbox"
                  checked={advancedConfig.precisionReduction}
                  onChange={(e) => setAdvancedConfig({ ...advancedConfig, precisionReduction: e.target.checked })}
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
                      onChange={(e) => setAdvancedConfig({ ...advancedConfig, decimals: parseInt(e.target.value) })}
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
                  onChange={(e) => setAdvancedConfig({ ...advancedConfig, shapeConversion: e.target.checked })}
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
                  onChange={(e) => setAdvancedConfig({ ...advancedConfig, pathMerging: e.target.checked })}
                  disabled={!advancedConfig.shapeConversion}
                />
                Path Merging
              </label>
              <span className={styles.phase2OptionDescription}>Merge paths with identical styles</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2Label}>ID Cleanup Mode</label>
              <select
                value={advancedConfig.idCleanup}
                onChange={(e) => setAdvancedConfig({ ...advancedConfig, idCleanup: e.target.value })}
                className={styles.phase2Select}
              >
                <option value="preserve">Preserve All IDs</option>
                <option value="remove-unused">Remove Unused IDs</option>
                <option value="minify">Minify IDs</option>
              </select>
              <span className={styles.phase2OptionDescription}>Control how IDs are handled</span>
            </div>

            <div className={styles.phase2Option}>
              <label className={styles.phase2Label}>Text Handling</label>
              <select
                value={advancedConfig.textHandling}
                onChange={(e) => setAdvancedConfig({ ...advancedConfig, textHandling: e.target.value, textToPathConfirmed: false })}
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
                      onChange={(e) => setAdvancedConfig({ ...advancedConfig, textToPathConfirmed: e.target.checked })}
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

      {selectedLevel === 'aggressive' && isAggressiveBlocked && (
        <div className={styles.phase2BlockedMessage}>
          <strong>Aggressive mode blocked:</strong> {aggressiveBlockReason}. This SVG contains features that may be affected by aggressive optimization.
        </div>
      )}
    </div>
  )
}
