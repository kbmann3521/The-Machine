const tools = require('./lib/tools.js').TOOLS;

const toolIds = ['case-converter', 'email-validator', 'find-replace', 'html-minifier', 'integer-to-ip', 'ip-range-calculator', 'ip-to-integer', 'ip-validator', 'js-beautifier', 'js-minifier', 'markdown-linter', 'reverse-text', 'slug-generator', 'sort-lines', 'text-analyzer', 'whitespace-visualizer', 'word-counter'];

let sql = '';

toolIds.forEach(id => {
  const tool = tools[id];
  if (tool) {
    const inputTypes = tool.inputTypes || ['text'];
    const configSchema = tool.configSchema || [];
    const outputType = tool.outputType || 'text';
    
    // Escape single quotes in JSON by doubling them
    const schemaJson = JSON.stringify(configSchema).replace(/'/g, "''");
    const inputTypesArray = inputTypes.map(t => `'${t}'`).join(',');
    
    sql += `UPDATE tools SET input_types = ARRAY[${inputTypesArray}], config_schema = '${schemaJson}'::jsonb, output_type = '${outputType}' WHERE id = '${id}';\n`;
  }
});

console.log(sql);
