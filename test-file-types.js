const { hardDetect } = require('./lib/hardDetection.js');
const { inputTypeToTools } = require('./lib/toolMappings.js');

const tests = [
  { input: 'pdf', expectedType: 'file_type', expectedTool: 'mime-type-lookup' },
  { input: 'docx', expectedType: 'file_type', expectedTool: 'mime-type-lookup' },
  { input: 'jpg', expectedType: 'file_type', expectedTool: 'mime-type-lookup' },
  { input: 'json', expectedType: 'file_type', expectedTool: 'mime-type-lookup' },
  { input: 'png', expectedType: 'file_type', expectedTool: 'mime-type-lookup' },
  { input: 'invalid', expectedType: null, expectedTool: null },
  { input: 'pdf/extention', expectedType: 'mime', expectedTool: 'mime-type-lookup' },
];

console.log('=== File Type Detection Tests ===\n');

tests.forEach((test, idx) => {
  const result = hardDetect(test.input);
  const tools = result ? inputTypeToTools[result.type] : [];
  
  console.log(`Test ${idx + 1}: "${test.input}"`);
  console.log(`Expected type: ${test.expectedType || 'null'}`);
  console.log(`Actual type: ${result ? result.type : 'null'} (${result ? (result.confidence * 100).toFixed(0) : 0}%)`);
  
  if (test.expectedTool) {
    console.log(`Expected tool: ${test.expectedTool}`);
    console.log(`Tools mapped: ${tools.join(', ')}`);
    const hasExpectedTool = tools.includes(test.expectedTool);
    console.log(`Match: ${hasExpectedTool ? '✅' : '❌'}`);
  }
  
  console.log('---\n');
});
