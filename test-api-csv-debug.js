const csv = 'name,age,city\nKyle,25,Austin'

const response = await fetch('http://localhost:3000/api/tools/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ inputText: csv }),
})

const data = await response.json()
console.log('CSV Input:', csv)
console.log('Top 5 Tools:')
data.predictedTools.slice(0, 5).forEach((tool, i) => {
  console.log(`${i+1}. ${tool.name} (${(tool.similarity*100).toFixed(1)}%, source: ${tool.source})`)
})
