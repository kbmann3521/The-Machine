const testCases = [
  // Exact matches should always work
  { input: '50 kg', expectedTool: 'Unit Converter', expectedType: 'weight' },
  { input: '25 celsius', expectedTool: 'Unit Converter', expectedType: 'temperature' },
  { input: '100 meters', expectedTool: 'Unit Converter', expectedType: 'length' },
  { input: '2 liters', expectedTool: 'Unit Converter', expectedType: 'volume' },
  
  // Fuzzy matches (typos within 2 character edit distance)
  { input: '50 celcius', expectedTool: 'Unit Converter', expectedType: 'temperature', note: 'typo: celcius' },
  { input: '100 metres', expectedTool: 'Unit Converter', expectedType: 'length', note: 'variant: metres' },
  { input: '50 leters', expectedTool: 'Unit Converter', expectedType: 'volume', note: 'typo: leters' },
  { input: '5 grams', expectedTool: 'Unit Converter', expectedType: 'weight', note: 'spelled out' },
  { input: '50 kilogram', expectedTool: 'Unit Converter', expectedType: 'weight', note: 'full word' },
];

async function test() {
  console.log('🧪 FINAL FUZZY UNIT DETECTION TEST\n');
  let passed = 0;
  let failed = 0;
  
  for (const tc of testCases) {
    const res = await fetch('http://localhost:3000/api/tools/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputText: tc.input }),
    });
    const data = await res.json();
    const top = data.predictedTools?.[0];
    const toolOK = top?.name === tc.expectedTool;
    const typeOK = top?.suggestedConfig?.type === tc.expectedType;
    const ok = toolOK && typeOK;
    if (ok) passed++;
    else failed++;
    
    const status = ok ? '✅' : '❌';
    console.log(`${status} "${tc.input}" (${tc.note || 'exact'}) → ${top?.name}/${top?.suggestedConfig?.type || 'N/A'}`);
  }
  
  console.log(`\n✨ Results: ${passed}/${testCases.length} passed (${((passed/testCases.length)*100).toFixed(1)}%)`);
}

test().catch(console.error);
