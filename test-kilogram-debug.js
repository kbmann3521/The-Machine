const testCases = [
  { input: '50 kg' },
  { input: '50 kilogram' },
  { input: '5 kilogram' },
];

async function test() {
  for (const test of testCases) {
    const response = await fetch('http://localhost:3000/api/tools/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: test.input }),
    });
    const data = await response.json();
    const top = data.predictedTools?.[0];
    console.log(`"${test.input}" → ${top?.name} (type: ${top?.suggestedConfig?.type || 'N/A'})`);
  }
}

test().catch(console.error);
