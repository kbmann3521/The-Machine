const tools = require('./lib/tools.js').TOOLS;

const toolIds = ['case-converter', 'email-validator', 'find-replace', 'html-minifier', 'integer-to-ip', 'ip-range-calculator', 'ip-to-integer', 'ip-validator', 'js-beautifier', 'js-minifier', 'markdown-linter', 'reverse-text', 'slug-generator', 'sort-lines', 'text-analyzer', 'whitespace-visualizer', 'word-counter'];

const updates = [];
toolIds.forEach(id => {
  const tool = tools[id];
  if (tool) {
    const config = JSON.stringify(tool.configSchema || []);
    const inputTypes = tool.inputTypes || ['text'];
    const outputType = tool.outputType || 'text';
    
    updates.push({
      id,
      inputTypes,
      configSchema: config,
      outputType
    });
  }
});

console.log(JSON.stringify(updates, null, 2));
