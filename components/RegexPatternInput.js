import React, { useState, useRef } from 'react'
import styles from '../styles/regex-pattern-input.module.css'

function tokenizeRegexPattern(pattern) {
  const tokens = [];
  let i = 0;

  while (i < pattern.length) {
    const char = pattern[i];
    const nextChar = pattern[i + 1];
    const prevChar = i > 0 ? pattern[i - 1] : '';

    // Check if current char is escaped
    const isEscaped = prevChar === '\\' && (i < 2 || pattern[i - 2] !== '\\');

    if (!isEscaped) {
      // Character class
      if (char === '[') {
        let charClass = '[';
        i++;
        let depth = 1;
        while (i < pattern.length && depth > 0) {
          if (pattern[i] === '[' && pattern[i - 1] !== '\\') {
            depth++;
          } else if (pattern[i] === ']' && pattern[i - 1] !== '\\') {
            depth--;
          }
          charClass += pattern[i];
          i++;
        }
        tokens.push({ type: 'character-class', value: charClass });
        continue;
      }

      // Group
      if (char === '(') {
        let groupContent = '(';
        i++;
        let depth = 1;
        while (i < pattern.length && depth > 0) {
          if (pattern[i] === '(' && pattern[i - 1] !== '\\') {
            depth++;
          } else if (pattern[i] === ')' && pattern[i - 1] !== '\\') {
            depth--;
          }
          groupContent += pattern[i];
          i++;
        }
        tokens.push({ type: 'group', value: groupContent });
        continue;
      }

      // Quantifiers
      if (char === '{') {
        let quantifier = '{';
        i++;
        while (i < pattern.length && pattern[i] !== '}') {
          quantifier += pattern[i];
          i++;
        }
        if (i < pattern.length) quantifier += '}';
        tokens.push({ type: 'quantifier', value: quantifier });
        i++;
        continue;
      }

      // Escape sequences
      if (char === '\\' && nextChar) {
        const escaped = char + nextChar;
        tokens.push({ type: 'escape', value: escaped });
        i += 2;
        continue;
      }

      // Anchors
      if (char === '^' || char === '$') {
        tokens.push({ type: 'anchor', value: char });
        i++;
        continue;
      }

      // Quantifier operators
      if (char === '+' || char === '*' || char === '?' || char === '|') {
        tokens.push({ type: 'operator', value: char });
        i++;
        continue;
      }

      // Dot
      if (char === '.') {
        tokens.push({ type: 'dot', value: char });
        i++;
        continue;
      }
    }

    // Literal character
    tokens.push({ type: 'literal', value: char });
    i++;
  }

  return tokens;
}

function SyntaxHighlightedPattern({ pattern }) {
  const tokens = tokenizeRegexPattern(pattern);

  const tokenClassMap = {
    'character-class': styles.tokenCharClass,
    'group': styles.tokenGroup,
    'quantifier': styles.tokenQuantifier,
    'escape': styles.tokenEscape,
    'anchor': styles.tokenAnchor,
    'operator': styles.tokenOperator,
    'dot': styles.tokenDot,
    'literal': styles.tokenLiteral,
  };

  return (
    <span className={styles.highlightedPattern}>
      {tokens.map((token, idx) => (
        <span
          key={idx}
          className={tokenClassMap[token.type] || styles.tokenLiteral}
          title={getTokenHint(token.type)}
        >
          {token.value}
        </span>
      ))}
    </span>
  );
}

function getTokenHint(tokenType) {
  const hints = {
    'character-class': 'Character class - matches any character inside',
    'group': 'Capturing group - captures matched text',
    'quantifier': 'Quantifier - repeats previous element',
    'escape': 'Escape sequence - special character',
    'anchor': 'Anchor - matches position in text',
    'operator': 'Quantifier/Operator',
    'dot': 'Dot - matches any character except newline',
    'literal': 'Literal character',
  };
  return hints[tokenType] || '';
}

function WarningsList({ warnings }) {
  if (!warnings || warnings.length === 0) {
    return null;
  }

  const errorWarnings = warnings.filter(w => w.severity === 'error');
  const regularWarnings = warnings.filter(w => w.severity === 'warning');
  const infoWarnings = warnings.filter(w => w.severity === 'info');

  return (
    <div className={styles.warningsContainer}>
      {errorWarnings.length > 0 && (
        <div className={styles.warningGroup}>
          {errorWarnings.map((warning, idx) => (
            <div key={`error-${idx}`} className={`${styles.warning} ${styles.warningError}`}>
              <span className={styles.warningIcon}>❌</span>
              <div className={styles.warningContent}>
                <div className={styles.warningMessage}>{warning.message}</div>
                <div className={styles.warningSuggestion}>{warning.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {regularWarnings.length > 0 && (
        <div className={styles.warningGroup}>
          {regularWarnings.map((warning, idx) => (
            <div key={`warning-${idx}`} className={`${styles.warning} ${styles.warningRegular}`}>
              <span className={styles.warningIcon}>⚠️</span>
              <div className={styles.warningContent}>
                <div className={styles.warningMessage}>{warning.message}</div>
                <div className={styles.warningSuggestion}>{warning.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {infoWarnings.length > 0 && (
        <div className={styles.warningGroup}>
          {infoWarnings.map((warning, idx) => (
            <div key={`info-${idx}`} className={`${styles.warning} ${styles.warningInfo}`}>
              <span className={styles.warningIcon}>ℹ️</span>
              <div className={styles.warningContent}>
                <div className={styles.warningMessage}>{warning.message}</div>
                <div className={styles.warningSuggestion}>{warning.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RegexPatternInput({
  value,
  onChange,
  flags,
  onFlagsChange,
  warnings,
  placeholder = 'Enter regex pattern...',
  disabled = false,
  selectedTemplate = null,
}) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const hasErrors = warnings && warnings.some(w => w.severity === 'error');

  return (
    <div className={styles.container}>
      <div className={`${styles.inputWrapper} ${focused ? styles.focused : ''} ${hasErrors ? styles.error : ''}`}>
        <div className={styles.patternDisplay}>
          <div className={styles.slash}>/</div>
          <SyntaxHighlightedPattern pattern={value} />
          <div className={styles.slash}>/</div>
        </div>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck="false"
          autoComplete="off"
        />
      </div>

      <div className={styles.flagsContainer}>
        <label className={styles.flagLabel}>Flags:</label>
        <div className={styles.flagButtons}>
          {['g', 'i', 'm', 's', 'd', 'u', 'y'].map((flag) => (
            <button
              key={flag}
              className={`${styles.flagButton} ${flags && flags.includes(flag) ? styles.flagActive : ''}`}
              onClick={() => {
                const currentFlags = flags || '';
                const newFlags = currentFlags.includes(flag)
                  ? currentFlags.replace(flag, '')
                  : currentFlags + flag;
                onFlagsChange(newFlags);
              }}
              title={getFlagDescription(flag)}
              disabled={disabled}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>

      {selectedTemplate && (
        <div className={styles.templateInfo}>
          <div className={styles.templateInfoContent}>
            <span className={styles.templateBadge}>Template: {selectedTemplate.name}</span>
            <span className={styles.templateDescription}>{selectedTemplate.description}</span>
          </div>
        </div>
      )}

      <WarningsList warnings={warnings} />
    </div>
  );
}

function getFlagDescription(flag) {
  const descriptions = {
    g: 'Global - find all matches',
    i: 'Case-insensitive',
    m: 'Multiline - ^ and $ match line breaks',
    s: 'DotAll - . matches newlines',
    d: 'HasIndices - capture group indices',
    u: 'Unicode mode',
    y: 'Sticky - match from lastIndex',
  };
  return descriptions[flag] || '';
}
