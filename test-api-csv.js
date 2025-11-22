const csv = 'name,age,city\nKyle,25,Austin'

const response = await fetch('http://localhost:3000/api/tools/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ inputText: csv }),
})

const data = await response.json()
const topTool = data.predictedTools?.[0]
console.log('CSV:', csv)
console.log('Top Tool:', topTool?.name)
console.log('Similarity:', topTool?.similarity)
console.log('Source:', topTool?.source)
