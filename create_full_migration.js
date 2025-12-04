const fs = require('fs');
const tools = require('./lib/tools.js').TOOLS;

const toolIds = ['case-converter', 'email-validator', 'find-replace', 'html-minifier', 'integer-to-ip', 'ip-range-calculator', 'ip-to-integer', 'ip-validator', 'js-beautifier', 'js-minifier', 'markdown-linter', 'reverse-text', 'slug-generator', 'sort-lines', 'text-analyzer', 'whitespace-visualizer', 'word-counter'];

const updates = [];

toolIds.forEach(id => {
  const tool = tools[id];
  if (tool) {
    const inputTypes = tool.inputTypes || ['text'];
    const configSchema = tool.configSchema || [];
    const outputType = tool.outputType || 'text';
    
    const schemaJson = JSON.stringify(configSchema).replace(/'/g, "''");
    const inputTypesArray = inputTypes.map(t => `'${t}'`).join(',');
    
    const stmt = `UPDATE tools SET input_types = ARRAY[${inputTypesArray}], config_schema = '${schemaJson}'::jsonb, output_type = '${outputType}' WHERE id = '${id}';`;
    updates.push(stmt);
  }
});

const sql = updates.join('\n');
fs.writeFileSync('/tmp/tools_migration.sql', sql);
console.log('Migration written to /tmp/tools_migration.sql');
console.log('Total statements:', updates.length);
