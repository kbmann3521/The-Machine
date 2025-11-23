const { hardDetect } = require('./lib/hardDetection.js');

const testCases = [
  {
    name: '# Title with HTML inside',
    input: '# Title\nThis is a paragraph with <strong>HTML</strong> inside.',
    expected: 'markdown_html'
  },
  {
    name: 'Markdown table',
    input: '| Name  | Score |\n|-------|--------|\n| Kyle  | 95     |\n| Sarah | 89     |',
    expected: 'markdown_html'
  },
  {
    name: 'Code fence',
    input: '```javascript\nfunction test() {\n  return "hello";\n}\n```',
    expected: 'markdown_html'
  },
  {
    name: 'Bold and italic',
    input: 'This is **bold**, *italic*, and ***both***.',
    expected: 'markdown_html'
  },
  {
    name: 'Header with description',
    input: '# My Project\nThis is the description of my project.',
    expected: 'markdown_html'
  },
  {
    name: 'Broken emphasis (unmatched)',
    input: 'This *is broken and never ends',
    expected: 'markdown_clean'
  },
  {
    name: 'Unmatched bold',
    input: 'Here is **bold that never closes',
    expected: 'markdown_clean'
  },
  {
    name: 'OCR-like spacing',
    input: 'Th is te xt w a s c op ied fr om a P D F',
    expected: 'markdown_clean'
  },
  {
    name: 'Random emphasis in text',
    input: 'I *really* need this cleaned up\nbut don\'t convert it to HTML',
    expected: 'markdown_html'
  }
];

console.log('Testing Markdown Detection with Priority Logic\n');
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
