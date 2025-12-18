import React from 'react'
import styles from '../styles/numeric-config.module.css'

export default function NumericConfig({ config, onConfigChange, floatArtifactDetected = false }) {
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
  }

  return (
    <div className={styles.container}>
      {floatArtifactDetected && config.mode === 'float' && (
        <div className={styles.suggestion}>
          <span className={styles.suggestionIcon}>⚠️</span>
          <span className={styles.suggestionText}>
            Floating-point precision artifact detected.
            <button className={styles.suggestionLink} onClick={handleSwitchToHighPrecision}>
              Switch to High Precision (Exact Math)
            </button>
          </span>
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.title}>Numeric Settings</span>
      </div>

      <div className={styles.panel}>
        <div className={styles.controlGroup}>
          <label htmlFor="numeric-mode">Numeric Mode</label>
          <select
            id="numeric-mode"
            value={config.mode}
            onChange={handleModeChange}
            className={styles.select}
          >
            <option value="float">● Standard (Fast, JS Float)</option>
            <option value="bignumber">○ High Precision (Exact Decimal / BigNumber)</option>
          </select>
          <span className={styles.hint}>
            {config.mode === 'float'
              ? 'Uses native JavaScript numbers (IEEE-754, ±15 significant digits)'
              : 'Uses arbitrary-precision decimal math. Eliminates floating-point rounding errors. Slower, but numerically exact.'}
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
            <option value="auto">● Auto (Standard for typical, Scientific for extreme)</option>
            <option value="standard">○ Standard (Full decimal expansion)</option>
            <option value="scientific">○ Scientific (1.23e+6, 4.56e-7)</option>
          </select>
          <span className={styles.hint}>
            {config.notation === 'auto'
              ? 'Smart: Use standard for normal ranges, scientific for very large/small'
              : config.notation === 'standard'
              ? 'Always show decimal notation (e.g., 1000000)'
              : 'Always show exponential notation (e.g., 1e+6)'}
          </span>
        </div>
      </div>
    </div>
  )
}
