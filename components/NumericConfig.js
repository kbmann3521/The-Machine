import React, { useState } from 'react'
import styles from '../styles/numeric-config.module.css'

export default function NumericConfig({ config, onConfigChange, floatArtifactDetected = false }) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handlePrecisionChange = (e) => {
    const value = e.target.value === '' ? null : parseInt(e.target.value, 10)
    onConfigChange({ ...config, precision: value })
  }

  const handleRoundingChange = (e) => {
    onConfigChange({ ...config, rounding: e.target.value })
  }

  const handleNotationChange = (e) => {
    onConfigChange({ ...config, notation: e.target.value })
  }

  const handleModeChange = (e) => {
    onConfigChange({ ...config, mode: e.target.value })
  }

  const handleSwitchToHighPrecision = () => {
    onConfigChange({ ...config, mode: 'bignumber' })
    setIsExpanded(true)
  }

  return (
    <div className={styles.container}>
      {floatArtifactDetected && config.mode === 'float' && (
        <div className={styles.suggestion}>
          <span className={styles.suggestionIcon}>⚠️</span>
          <span className={styles.suggestionText}>
            Floating-point precision artifact detected.
            <button className={styles.suggestionLink} onClick={handleSwitchToHighPrecision}>
              Try High Precision Mode
            </button>
          </span>
        </div>
      )}
      <div className={styles.header}>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
        >
          <span className={styles.label}>Numeric Settings</span>
          <span className={styles.icon}>{isExpanded ? '▼' : '▶'}</span>
        </button>
      </div>

      {isExpanded && (
        <div className={styles.panel}>
          <div className={styles.controlGroup}>
            <label htmlFor="numeric-mode">Numeric Mode</label>
            <select
              id="numeric-mode"
              value={config.mode}
              onChange={handleModeChange}
              className={styles.select}
            >
              <option value="float">● Standard (Fast, JS float)</option>
              <option value="bignumber">○ High Precision (Exact decimals)</option>
            </select>
            <span className={styles.hint}>
              {config.mode === 'float'
                ? 'Uses native JavaScript numbers (IEEE-754, ±15 significant digits)'
                : 'Uses arbitrary precision arithmetic for exact decimal calculations'}
            </span>
          </div>

          <div className={styles.controlGroup}>
            <label htmlFor="numeric-precision">Decimal Precision</label>
            <input
              id="numeric-precision"
              type="number"
              min="0"
              max="20"
              value={config.precision === null ? '' : config.precision}
              onChange={handlePrecisionChange}
              placeholder="Auto (no rounding)"
              className={styles.input}
            />
            <span className={styles.hint}>
              {config.precision === null
                ? 'Auto: Display full precision without rounding'
                : `Display: Round to ${config.precision} decimal place${config.precision === 1 ? '' : 's'} (formattedResult only)`}
            </span>
          </div>

          {config.precision !== null && (
            <div className={styles.controlGroup}>
              <label htmlFor="numeric-rounding">Rounding Mode</label>
              <select
                id="numeric-rounding"
                value={config.rounding}
                onChange={handleRoundingChange}
                className={styles.select}
              >
                <option value="half-up">● Half-Up (Traditional: 2.5 → 3)</option>
                <option value="half-even">○ Half-Even (Banker's: 2.5 → 2)</option>
                <option value="floor">○ Floor (Toward −∞)</option>
                <option value="ceil">○ Ceil (Toward +∞)</option>
              </select>
              <span className={styles.hint}>
                {config.rounding === 'half-up'
                  ? 'Traditional: Round 0.5 away from zero'
                  : config.rounding === 'half-even'
                  ? 'Bank-grade: Round 0.5 to nearest even (minimizes bias)'
                  : config.rounding === 'floor'
                  ? 'Always round toward negative infinity'
                  : 'Always round toward positive infinity'}
              </span>
            </div>
          )}

          <div className={styles.controlGroup}>
            <label htmlFor="numeric-notation">Notation</label>
            <select
              id="numeric-notation"
              value={config.notation}
              onChange={handleNotationChange}
              className={styles.select}
            >
              <option value="auto">Automatic</option>
              <option value="scientific">Scientific</option>
            </select>
            <span className={styles.hint}>
              {config.notation === 'auto'
                ? 'Standard notation for normal ranges'
                : 'Scientific notation for large/small numbers'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
