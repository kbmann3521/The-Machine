const { hardDetect } = require('./lib/hardDetection.js');
const { inputTypeToTools } = require('./lib/toolMappings.js');
const { TOOLS } = require('./lib/tools.js');

const tests = [
  {
    input: 'pdf/extention',
    expectedType: 'mime',
    expectedTool: 'mime-type-lookup',
  },
  {
    input: 'pdf, jpg, docx, etx',
    expectedType: 'file_extensions',
    expectedTool: 'file-size-converter',
    shouldNotInclude: 'text-toolkit',
  },
  {
    input: 'こんにちは',
    expectedType: 'unicode_text',
    expectedTool: 'ascii-unicode-converter',
    shouldNotInclude: 'text-toolkit',
  },
];

console.log('=== User Feedback Test Cases ===\n');

tests.forEach((test, idx) => {
  const result = hardDetect(test.input);
  const tools = result ? inputTypeToTools[result.type] : [];
  
  console.log(`Test ${idx + 1}: "${test.input}"`);
  console.log(`Expected type: ${test.expectedType}`);
  console.log(`Actual type: ${result ? result.type : 'null'} (${result ? (result.confidence * 100).toFixed(0) : 0}%)`);
  console.log(`Tools mapped: ${tools.join(', ')}`);
  
  // Check if Text Toolkit should NOT be included
  if (test.shouldNotInclude) {
    const hasUnwantedTool = tools.includes(test.shouldNotInclude);
    console.log(`Contains ${test.shouldNotInclude}? ${hasUnwantedTool ? '❌ YES (BAD)' : '✅ NO (GOOD)'}`);
  }
  
  // Check if expected tool is included
  if (test.expectedTool) {
    const hasExpectedTool = tools.includes(test.expectedTool);
    console.log(`Contains ${test.expectedTool}? ${hasExpectedTool ? '✅ YES (GOOD)' : '❌ NO (BAD)'}`);
  }
  
  console.log('---\n');
});
