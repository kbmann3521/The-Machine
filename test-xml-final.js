const tools = require('./lib/tools.js');

console.log('Testing XML Formatter...\n');

const tests = [
  {
    name: 'Beautify',
    input: '<root><person id="1"><name>John</name></person></root>',
    config: { mode: 'beautify' }
  },
  {
    name: 'Minify',
    input: '<?xml version="1.0"?>\n<root>\n  <person>\n    <name>John</name>\n  </person>\n</root>',
    config: { mode: 'minify' }
  },
  {
    name: 'Validate',
    input: '<root><person><name>John</name></person></root>',
    config: { mode: 'validate' }
  },
  {
    name: 'XML→JSON',
    input: '<root><person id="1"><name>John</name></person></root>',
    config: { mode: 'to-json' }
  },
  {
    name: 'XML→YAML',
    input: '<root><person id="1"><name>John</name></person></root>',
    config: { mode: 'to-yaml' }
  },
  {
    name: 'Clean',
    input: '<root><!-- comment --><person><name>John</name></person></root>',
    config: { mode: 'clean', removeComments: true }
  },
  {
    name: 'Lint',
    input: '<root><person id="1" name="John"><age>30</age></person></root>',
    config: { mode: 'lint' }
  },
  {
    name: 'XPath',
    input: '<root><item id="1"><name>Item1</name></item><item id="2"><name>Item2</name></item></root>',
    config: { mode: 'xpath', xpathQuery: '//item' }
  }
];

let passed = 0;
tests.forEach(test => {
  try {
    const result = tools.runTool('xml-formatter', test.input, test.config);
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
    console.log(`✅ ${test.name}: ${resultStr.substring(0, 100)}...`);
    passed++;
  } catch (e) {
    console.log(`❌ ${test.name}: ${e.message}`);
  }
});

console.log(`\n${passed}/${tests.length} tests passed`);
