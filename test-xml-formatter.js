const tools = require('./lib/tools.js');

const testCases = [
  {
    name: 'Beautify XML',
    toolId: 'xml-formatter',
    input: '<root><person id="1"><name>John</name><age>30</age></person></root>',
    config: { mode: 'beautify', indentSize: '2' },
    shouldContain: ['<person', '<name>John</name>', '<age>30</age>']
  },
  {
    name: 'Minify XML',
    toolId: 'xml-formatter',
    input: '<?xml version="1.0"?>\n<root>\n  <person>\n    <name>John</name>\n  </person>\n</root>',
    config: { mode: 'minify' },
    shouldContain: ['><', '<root><person']
  },
  {
    name: 'Validate Valid XML',
    toolId: 'xml-formatter',
    input: '<root><person><name>John</name></person></root>',
    config: { mode: 'validate' },
    shouldContain: ['valid', 'well-formed']
  },
  {
    name: 'Validate Invalid XML',
    toolId: 'xml-formatter',
    input: '<root><person><name>John</root>',
    config: { mode: 'validate' },
    shouldContain: ['error', 'Mismatched', 'Unclosed']
  },
  {
    name: 'XML to JSON',
    toolId: 'xml-formatter',
    input: '<root><person id="1"><name>John</name></person></root>',
    config: { mode: 'to-json' },
    shouldContain: ['person', 'name', 'John']
  },
  {
    name: 'Clean XML - Remove Comments',
    toolId: 'xml-formatter',
    input: '<root><!-- comment --><person><name>John</name></person></root>',
    config: { mode: 'clean', removeComments: true },
    shouldNotContain: ['<!--']
  },
  {
    name: 'Lint XML',
    toolId: 'xml-formatter',
    input: '<root><person id="1" name="John"><age>30</age></person></root>',
    config: { mode: 'lint' },
    shouldContain: ['status', 'clean', 'no linting issues', 'issues']
  },
  {
    name: 'XPath Query',
    toolId: 'xml-formatter',
    input: '<root><item id="1"><name>Item1</name></item><item id="2"><name>Item2</name></item></root>',
    config: { mode: 'xpath', xpathQuery: '//item' },
    shouldContain: ['results', 'count', 'item']
  },
  {
    name: 'XML to YAML',
    toolId: 'xml-formatter',
    input: '<root><person id="1"><name>John</name></person></root>',
    config: { mode: 'to-yaml' },
    shouldContain: ['root:', 'person:', 'name:']
  }
];

function runTests() {
  console.log('Starting XML Formatter Tests...\n');
  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: ${testCase.name}`);
    
    try {
      const result = tools.runTool(testCase.toolId, testCase.input, testCase.config);
      
      const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
      
      let testPassed = true;
      
      if (testCase.shouldContain) {
        for (const expected of testCase.shouldContain) {
          if (!resultStr.toLowerCase().includes(expected.toLowerCase())) {
            console.log(`  ❌ FAILED: Expected to contain "${expected}"`);
            testPassed = false;
          }
        }
      }
      
      if (testCase.shouldNotContain) {
        for (const unexpected of testCase.shouldNotContain) {
          if (resultStr.includes(unexpected)) {
            console.log(`  ❌ FAILED: Should not contain "${unexpected}"`);
            testPassed = false;
          }
        }
      }
      
      if (testPassed) {
        console.log(`  ✅ PASSED`);
        passed++;
      } else {
        failed++;
        console.log(`\nResult:\n${resultStr.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`  ❌ ERROR: ${error.message}`);
      failed++;
    }
    
    console.log('');
  });

  console.log(`\n=== Test Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${testCases.length}`);
}

runTests();
