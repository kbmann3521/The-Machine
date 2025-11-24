const testCases = [
  // Exact matches (should still work)
  { input: '50 celsius', expectedTool: 'Unit Converter', expectedType: 'temperature' },
  { input: '50 km/h', expectedTool: 'Unit Converter', expectedType: 'speed' },
  { input: '2 liters', expectedTool: 'Unit Converter', expectedType: 'volume' },
  
  // Fuzzy matches (1-2 character differences)
  { input: '50 celcius', expectedTool: 'Unit Converter', expectedType: 'temperature', description: 'celcius (typo of celsius)' },
  { input: '50 fahreneit', expectedTool: 'Unit Converter', expectedType: 'temperature', description: 'fahreneit (typo of fahrenheit)' },
  { input: '50 leters', expectedTool: 'Unit Converter', expectedType: 'volume', description: 'leters (typo of liters)' },
  { input: '50 litres', expectedTool: 'Unit Converter', expectedType: 'volume', description: 'litres (variant)' },
  { input: '100 metes', expectedTool: 'Unit Converter', expectedType: 'length', description: 'metes (typo of meters)' },
  { input: '50 kilogram', expectedTool: 'Unit Converter', expectedType: 'weight', description: 'kilogram (exact but maybe fuzzy)' },
  { input: '50 grm', expectedTool: 'Unit Converter', expectedType: 'weight', description: 'grm (typo of gram)' },
  { input: '500 ml', expectedTool: 'Unit Converter', expectedType: 'volume', description: 'ml (exact)' },
  { input: '25 kelvin', expectedTool: 'Unit Converter', expectedType: 'temperature', description: 'kelvin (exact)' },
];

async function runTests() {
  console.log('🧪 TESTING FUZZY UNIT DETECTION\n');
  console.log(`Total test cases: ${testCases.length}\n`);
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of testCases) {
    try {
      const response = await fetch('http://localhost:3000/api/tools/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: test.input }),
      });

      const data = await response.json();
      const topTool = data.predictedTools?.[0];
      const toolName = topTool?.name;
      const suggestedConfig = topTool?.suggestedConfig;
      const suggestedType = suggestedConfig?.type;

      const toolMatch = toolName === test.expectedTool;
      const typeMatch = !test.expectedType || suggestedType === test.expectedType;
      const isCorrect = toolMatch && typeMatch;
      
      if (isCorrect) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        input: test.input,
        description: test.description || '',
        expectedType: test.expectedType || 'N/A',
        actualType: suggestedType || 'NONE',
        actualTool: toolName || 'NONE',
        status: isCorrect ? '✅' : '❌',
      });
    } catch (err) {
      console.error(`Error testing "${test.input}":`, err.message);
      failed++;
      results.push({
        input: test.input,
        description: test.description || '',
        expectedType: test.expectedType || 'N/A',
        actualType: 'ERROR',
        actualTool: 'ERROR',
        status: '❌',
      });
    }
  }

  console.table(results);
  console.log(`\n✨ Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
  console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
}

runTests().catch(console.error);
