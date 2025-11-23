// Test the new markdown-html-formatter tool
const { runTool } = require('./lib/tools.js');

const testCases = [
  {
    name: 'Markdown to HTML conversion',
    toolId: 'markdown-html-formatter',
    input: '# Hello\n\nThis is **bold** and *italic* text.',
    config: { convertTo: 'html', indent: '2spaces', minify: false }
  },
  {
    name: 'HTML beautify',
    toolId: 'markdown-html-formatter',
    input: '<div><p>Hello</p></div>',
    config: { convertTo: 'none', indent: '2spaces', minify: false }
  },
  {
    name: 'HTML minify',
    toolId: 'markdown-html-formatter',
    input: '<div>\n  <p>Hello</p>\n</div>',
    config: { convertTo: 'none', indent: '2spaces', minify: true }
  },
  {
    name: 'Markdown beautify',
    toolId: 'markdown-html-formatter',
    input: '# Title\n\n\n\nParagraph\n\n\nAnother',
    config: { convertTo: 'none', indent: '2spaces', minify: false }
  }
];

console.log('Testing Markdown + HTML Formatter Tool\n');
console.log('='.repeat(60));

testCases.forEach((test, i) => {
  try {
    console.log(`\n✓ Test ${i + 1}: ${test.name}`);
    const result = runTool(test.toolId, test.input, test.config);
    console.log('  Result:', typeof result === 'object' ? JSON.stringify(result, null, 2).slice(0, 150) : result.slice(0, 100));
  } catch (error) {
    console.log(`✗ Test ${i + 1} FAILED: ${error.message}`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('Test completed\n');
