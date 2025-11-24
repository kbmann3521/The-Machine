const testCases = [
  // Speed patterns
  { input: '50 m/s', expectedTool: 'Unit Converter', description: 'Speed: meters per second with space' },
  { input: '50ms', expectedTool: 'Unit Converter', description: 'Speed: m/s without spaces' },
  { input: '50 ms', expectedTool: 'Unit Converter', description: 'Speed: m/s with space' },
  { input: '50 kmh', expectedTool: 'Unit Converter', description: 'Speed: km/h without slash' },
  { input: '50 km/h', expectedTool: 'Unit Converter', description: 'Speed: km/h with slash' },
  { input: '50 mph', expectedTool: 'Unit Converter', description: 'Speed: miles per hour abbrev' },
  { input: '50 miles per hour', expectedTool: 'Unit Converter', description: 'Speed: miles per hour spelled out' },
  { input: '100 kilometers per hour', expectedTool: 'Unit Converter', description: 'Speed: kilometers per hour' },
  
  // Weight patterns
  { input: '5.5 kg', expectedTool: 'Unit Converter', description: 'Weight: kilograms' },
  { input: '150 pounds', expectedTool: 'Unit Converter', description: 'Weight: pounds spelled' },
  { input: '10kg', expectedTool: 'Unit Converter', description: 'Weight: kg no space' },
  
  // Length patterns
  { input: '10 meters', expectedTool: 'Unit Converter', description: 'Length: meters' },
  { input: '5 miles', expectedTool: 'Unit Converter', description: 'Length: miles' },
  { input: '2.5 km', expectedTool: 'Unit Converter', description: 'Length: kilometers' },
  
  // Temperature
  { input: '25 celsius', expectedTool: 'Unit Converter', description: 'Temperature: celsius' },
  { input: '98.6 fahrenheit', expectedTool: 'Unit Converter', description: 'Temperature: fahrenheit' },
  
  // Volume
  { input: '500 ml', expectedTool: 'Unit Converter', description: 'Volume: milliliters' },
  { input: '2 liters', expectedTool: 'Unit Converter', description: 'Volume: liters' },
];

async function runTests() {
  console.log('🧪 TESTING UNIT DETECTION PATTERNS\n');
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

      const isCorrect = toolName === test.expectedTool;
      if (isCorrect) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        input: test.input,
        description: test.description,
        expectedTool: test.expectedTool,
        actualTool: toolName || 'NONE',
        suggestedConfig: suggestedConfig || {},
        status: isCorrect ? '✅' : '❌',
      });
    } catch (err) {
      console.error(`Error testing "${test.input}":`, err.message);
      failed++;
      results.push({
        input: test.input,
        description: test.description,
        expectedTool: test.expectedTool,
        actualTool: 'ERROR',
        suggestedConfig: {},
        status: '❌',
      });
    }
  }

  console.table(results);
  console.log(`\n✨ Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
  console.log(`Success rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);
}

runTests().catch(console.error);
