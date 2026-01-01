import styles from '../styles/tool-output.module.css'

/**
 * WhitespaceVisualization Component
 * Visual representation of whitespace characters in text
 */
export function WhitespaceVisualization({ whitespaceCount, spaceCount, tabCount, newlineCount }) {
  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Whitespace Breakdown:</strong>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>
          • Spaces: {spaceCount || 0}<br />
          • Tabs: {tabCount || 0}<br />
          • Newlines: {newlineCount || 0}<br />
          • Total: {whitespaceCount || 0}
        </div>
      </div>
    </div>
  )
}

/**
 * StopWordsDetail Component
 * Shows stop words list and percentage
 */
export function StopWordsDetail({ stopWordsList, stopWordsCount, stopWordsPercent, totalWords }) {
  const displayList = stopWordsList && Array.isArray(stopWordsList)
    ? stopWordsList.slice(0, 30)
    : []

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Stop Words Statistics:</strong>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>
          • Count: {stopWordsCount || 0}<br />
          • Percentage: {(stopWordsPercent || 0).toFixed(2)}%<br />
          • Total words: {totalWords || 0}
        </div>
      </div>
      {displayList.length > 0 && (
        <div style={{ marginTop: '8px' }}>
          <strong>Examples:</strong>
          <div style={{ marginTop: '4px' }}>
            {displayList.map((word, i) => (
              <span key={i}>{word}{i < displayList.length - 1 ? ', ' : ''}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * LongestSentenceDetail Component
 * Shows the longest sentence found in the text
 */
export function LongestSentenceDetail({ longestSentence, longestSentenceLength }) {
  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Longest Sentence Details:</strong>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>
          • Word count: {longestSentenceLength || 0} words
        </div>
      </div>
      {longestSentence && (
        <div style={{ marginTop: '8px' }}>
          <strong>Text:</strong>
          <pre className={styles.analyzerMetricDetail} style={{ padding: '8px 12px', margin: '4px 0 0 0' }}>
            {longestSentence.substring(0, 500)}
            {longestSentence.length > 500 ? '...' : ''}
          </pre>
        </div>
      )}
    </div>
  )
}

/**
 * ShortestSentenceDetail Component
 * Shows the shortest sentence found in the text
 */
export function ShortestSentenceDetail({ shortestSentence, shortestSentenceLength }) {
  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Shortest Sentence Details:</strong>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>
          • Word count: {shortestSentenceLength || 0} words
        </div>
      </div>
      {shortestSentence && (
        <div style={{ marginTop: '8px' }}>
          <strong>Text:</strong>
          <pre className={styles.analyzerMetricDetail} style={{ padding: '8px 12px', margin: '4px 0 0 0' }}>
            {shortestSentence}
          </pre>
        </div>
      )}
    </div>
  )
}

/**
 * UniqueWordsDetail Component
 * Shows unique word frequency table
 */
export function UniqueWordsDetail({ uniqueWordsFreq, totalWords }) {
  const sortedWords = uniqueWordsFreq && Array.isArray(uniqueWordsFreq)
    ? [...uniqueWordsFreq].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 20)
    : []

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Top 20 Unique Words by Frequency:</strong>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>
          • Total unique words: {uniqueWordsFreq?.length || 0}
        </div>
      </div>
      {sortedWords.length > 0 && (
        <table className={styles.frequencyTable}>
          <thead>
            <tr>
              <th>Word</th>
              <th style={{ textAlign: 'right' }}>Count</th>
              <th style={{ textAlign: 'right' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {sortedWords.map((item, i) => {
              const count = item.count || 0
              const percent = totalWords ? ((count / totalWords) * 100).toFixed(1) : '0'
              return (
                <tr key={i}>
                  <td className={styles.frequencyTableWord}>{item.word}</td>
                  <td className={styles.frequencyTableCount}>{count}</td>
                  <td className={styles.frequencyTablePercent}>{percent}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

/**
 * TopKeywordsDetail Component
 * Shows top content keywords (non-stop words)
 */
export function TopKeywordsDetail({ topKeywords }) {
  const keywords = topKeywords && Array.isArray(topKeywords) ? topKeywords : []

  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Top Content Keywords (Top 5):</strong>
      </div>
      {keywords.length > 0 && (
        <table className={styles.frequencyTable}>
          <thead>
            <tr>
              <th>Keyword</th>
              <th style={{ textAlign: 'right' }}>Count</th>
              <th style={{ textAlign: 'right' }}>%</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((item, i) => (
              <tr key={i}>
                <td className={styles.frequencyTableWord}>{item.word}</td>
                <td className={styles.frequencyTableCount}>{item.count || 0}</td>
                <td className={styles.frequencyTablePercent}>{(item.percent || 0).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

/**
 * WordLengthDistribution Component
 * Shows min, max, and median word lengths with examples
 */
export function WordLengthDistribution({
  minWordLength,
  maxWordLength,
  medianWordLength,
  avgWordLength,
  longestWord,
  shortestWord
}) {
  return (
    <div>
      <div style={{ marginBottom: '8px' }}>
        <strong>Word Length Distribution:</strong>
        <div style={{ marginTop: '4px', fontSize: '11px' }}>
          • Average: {(avgWordLength || 0).toFixed(2)} chars<br />
          • Shortest: {minWordLength || 0} chars
          {shortestWord && <span> ("{shortestWord}")</span>}
          <br />
          • Median: {medianWordLength || 0} chars<br />
          • Longest: {maxWordLength || 0} chars
          {longestWord && <span> ("{longestWord}")</span>}
        </div>
      </div>
    </div>
  )
}
