const { hardDetect } = require('./lib/hardDetection.js');

const testCases = [
  {
    name: 'Mixed junk markup',
    input: 'Here is text *** with random ** and stray *',
    expected: 'markdown_clean'
  },
  {
    name: 'Misused underscores',
    input: 'This _text is _kind of _broken_',
    expected: 'markdown_clean'
  },
  {
    name: 'Markdown in sentences',
    input: 'I saw a # sign in my message\nand some random **stuff**',
    expected: 'markdown_clean'
  },
  {
    name: 'Stray asterisks after copy/paste',
    input: 'This is from a PDF ***\nand it has weird alignment *',
    expected: 'markdown_clean'
  },
];

console.log('Testing Broken Markdown Cases\n');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

testCases.forEach((test, i) => {
  const result = hardDetect(test.input);
  const isPass = result?.type === test.expected;
  
  if (isPass) {
    passed++;
    console.log(`✓ Test ${i + 1}: ${test.name}`);
  } else {
    failed++;
    console.log(`✗ Test ${i + 1}: ${test.name}`);
    console.log(`  Expected: ${test.expected}`);
    console.log(`  Got: ${result?.type} (confidence: ${result?.confidence})`);
    console.log(`  Reason: ${result?.reason}`);
  }
});

console.log('='.repeat(60));
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);
