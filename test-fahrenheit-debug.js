function levenshteinDistance(a, b) {
  const aLen = a.length
  const bLen = b.length
  const matrix = Array(bLen + 1).fill(null).map(() => Array(aLen + 1).fill(0))

  for (let i = 0; i <= aLen; i++) matrix[0][i] = i
  for (let j = 0; j <= bLen; j++) matrix[j][0] = j

  for (let j = 1; j <= bLen; j++) {
    for (let i = 1; i <= aLen; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      )
    }
  }

  return matrix[bLen][aLen]
}

const testCases = [
  ['fahreneit', 'fahrenheit'],
  ['fahreneit', 'gram'],
  ['fahreneit', 'grm'],
  ['fahreneit', 'kelvin'],
];

for (const [from, to] of testCases) {
  const distance = levenshteinDistance(from, to);
  const lenDiff = Math.abs(from.length - to.length);
  const score = distance + (lenDiff * 0.2);
  console.log(`"${from}" → "${to}": distance=${distance}, lenDiff=${lenDiff}, score=${score.toFixed(2)}`);
}
