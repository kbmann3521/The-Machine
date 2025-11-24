const testCases = [
  // Plain English
  { input: 'this is a sentence', expected: 'plain_text', topTool: 'Text Toolkit' },
  { input: 'please fix this text and remove extra spaces', expected: 'plain_text', topTool: 'Text Toolkit' },
  
  // HTML
  { input: '<div class="box"><p>Hello</p></div>', expected: 'html', topTool: 'HTML Formatter' },
  
  // CSS
  { input: 'body { margin: 0; padding: 0; }', expected: 'css', topTool: 'CSS Formatter' },
  
  // JavaScript
  { input: 'function add(a,b){return a+b;}', expected: 'js', topTool: 'JavaScript Formatter' },
  
  // JSON
  { input: '{"name":"Kyle","age":25}', expected: 'json', topTool: 'JSON Formatter' },
  
  // URL
  { input: 'https://google.com/search?q=test', expected: 'url', topTool: 'URL Converter' },
  
  // Email
  { input: 'example@gmail.com', expected: 'email', topTool: 'Email Validator' },
  
  // Base64
  { input: 'SGVsbG8gV29ybGQ=', expected: 'base64', topTool: 'Base64 Converter' },
  
  // HTML Entities
  { input: '&amp;lt;div&amp;gt;Hello&amp;lt;/div&amp;gt;', expected: 'html_entities', topTool: 'HTML Entities Converter' },
  
  // Markdown
  { input: '# Hello World\nThis is *markdown*.', expected: 'markdown', topTool: 'Markdown to HTML' },
  
  // CSV
  { input: 'name,age,city\nKyle,25,Austin', expected: 'csv', topTool: 'CSV to JSON Converter' },
  
  // XML
  { input: '<user><name>Kyle</name></user>', expected: 'xml', topTool: 'XML Formatter' },
  
  // YAML
  { input: 'name: Kyle\nage: 25', expected: 'yaml', topTool: 'YAML Formatter' },
  
  // SQL
  { input: 'SELECT * FROM users WHERE id = 1;', expected: 'sql', topTool: 'SQL Formatter' },
  
  // Regex
  { input: '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$', expected: 'regex', topTool: 'Regex Tester' },
  
  // Timestamp (Unix)
  { input: '1712345678', expected: 'timestamp', topTool: 'Timestamp Converter' },
  
  // Timestamp (Date)
  { input: '2025-11-22', expected: 'timestamp', topTool: 'Timestamp Converter' },
  
  // Math Expression
  { input: '(5 + 6) * 2', expected: 'math_expression', topTool: 'Math Expression Evaluator' },
  
  // Binary
  { input: '1100101010110', expected: 'binary', topTool: 'Binary Converter' },
  
  // Hexadecimal
  { input: 'FF22AA', expected: 'hex_number', topTool: 'Base Converter' },
  
  // Number
  { input: '245', expected: 'integer', topTool: 'Number Formatter' },
  
  // Unit Value
  { input: '10kg', expected: 'unit_value', topTool: 'Unit Converter' },

  // Speed Units - Various Formats
  { input: '50 m/s', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '50 ms', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '50 kmh', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '50 km/h', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '50 mph', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '50 miles per hour', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '100 kilometers per hour', expected: 'unit_value', topTool: 'Unit Converter' },

  // Weight Units
  { input: '5.5 kg', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '150 pounds', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '2.5 kg', expected: 'unit_value', topTool: 'Unit Converter' },

  // Length Units
  { input: '10 meters', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '5 miles', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '2.5 km', expected: 'unit_value', topTool: 'Unit Converter' },

  // Temperature
  { input: '25 celsius', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '98.6 fahrenheit', expected: 'unit_value', topTool: 'Unit Converter' },

  // Volume
  { input: '500 ml', expected: 'unit_value', topTool: 'Unit Converter' },
  { input: '2 liters', expected: 'unit_value', topTool: 'Unit Converter' },

  // File Size
  { input: '50mb', expected: 'file_size', topTool: 'File Size Converter' },
  
  // Time 12h
  { input: '1:00pm', expected: 'time_12h', topTool: 'Timezone Converter' },
  
  // Time 24h
  { input: '13:45', expected: 'time_24h', topTool: 'Timezone Converter' },
  
  // IP Address
  { input: '192.168.0.1', expected: 'ip', topTool: 'IP Address Validator' },
  
  // UUID
  { input: '550e8400-e29b-41d4-a716-446655440000', expected: 'uuid', topTool: 'UUID Validator' },
  
  // MIME Type
  { input: 'application/json', expected: 'mime', topTool: 'MIME Type Lookup' },
  
  // HTTP Header
  { input: 'Content-Type: application/json', expected: 'http_header', topTool: 'HTTP Header Parser' },
  
  // HTTP Status Code
  { input: '404', expected: 'http_status_code', topTool: 'HTTP Status Code Lookup' },
  
  // ROT13
  { input: 'uryyb jbeyq', expected: 'plain_text', topTool: 'ROT13 Cipher' },
  
  // Caesar Cipher
  { input: 'Dro aesmu lbygx pyh TEWZC yfob dro vkji nyq.', expected: 'plain_text', topTool: 'Caesar Cipher' },
  
  // Unicode
  { input: 'こんにちは', expected: 'plain_text', topTool: 'ASCII/Unicode Converter' },
  
  // Escape/Unescape
  { input: 'Hello%20World%21', expected: 'url_encoded', topTool: 'Escape/Unescape' },
  
  // SVG
  { input: '<svg width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>', expected: 'svg', topTool: 'SVG Optimizer' },
  
  // JWT
  { input: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ', expected: 'jwt', topTool: 'JWT Decoder' },
  
  // Image Base64
  { input: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', expected: 'base64_image', topTool: 'Image to Base64' },
];

async function runTests() {
  console.log('🧪 TESTING AUTO-DETECTION ENGINE\n');
  console.log(`Total test cases: ${testCases.length}\n`);
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    try {
      const response = await fetch('http://localhost:3000/api/tools/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputText: testCase.input }),
      });

      const data = await response.json();
      const topTool = data.predictedTools?.[0];

      const isCorrect = topTool?.name === testCase.topTool;
      if (isCorrect) {
        passed++;
      } else {
        failed++;
      }

      results.push({
        num: i + 1,
        input: testCase.input.substring(0, 50) + (testCase.input.length > 50 ? '...' : ''),
        expected: testCase.expected,
        expectedTool: testCase.topTool,
        actualTool: topTool?.name || 'NONE',
        actualSimilarity: topTool?.similarity || 0,
        status: isCorrect ? '✅' : '❌',
      });
    } catch (error) {
      failed++;
      results.push({
        num: i + 1,
        input: testCase.input.substring(0, 50),
        expected: testCase.expected,
        expectedTool: testCase.topTool,
        actualTool: 'ERROR',
        actualSimilarity: 0,
        status: '🔴',
      });
    }
  }

  console.log('\n📊 RESULTS SUMMARY');
  console.log(`Passed: ${passed}/${testCases.length} (${Math.round((passed/testCases.length)*100)}%)`);
  console.log(`Failed: ${failed}/${testCases.length}\n`);

  console.log('DETAILED RESULTS:');
  console.log('─'.repeat(120));
  
  results.forEach(r => {
    console.log(`${r.status} #${String(r.num).padStart(2)} | Input: "${r.input}"`);
    console.log(`   Expected: ${r.expectedTool} | Got: ${r.actualTool} (${(r.actualSimilarity*100).toFixed(1)}%)`);
    console.log('');
  });

  console.log('\n🔴 FAILED TESTS (needs fixing):');
  results.filter(r => r.status !== '✅').forEach(r => {
    console.log(`#${r.num}: "${r.input}" → Expected: ${r.expectedTool}, Got: ${r.actualTool}`);
  });
}

runTests().catch(console.error);
