#!/usr/bin/env python3
import json
import subprocess

# Get the tool data from lib/tools.js
result = subprocess.run(['node', '-e', '''
const tools = require("./lib/tools.js").TOOLS;
const ids = ["case-converter", "email-validator", "find-replace", "html-minifier", "integer-to-ip", "ip-range-calculator", "ip-to-integer", "ip-validator", "js-beautifier", "js-minifier", "markdown-linter", "remove-extras", "reverse-text", "slug-generator", "sort-lines", "text-analyzer", "whitespace-visualizer", "word-counter"];
const result = {};
ids.forEach(id => {
  const tool = tools[id];
  if (tool) {
    result[id] = {
      input_types: tool.inputTypes || ["text"],
      config_schema: JSON.stringify(tool.configSchema || []),
      output_type: tool.outputType || "text"
    };
  }
});
console.log(JSON.stringify(result, null, 2));
'''], capture_output=True, text=True)

data = json.loads(result.stdout)

# Generate SQL
statements = []
for tool_id, tool_data in data.items():
    input_types_sql = "ARRAY[" + ",".join([f"'{t}'" for t in tool_data['input_types']]) + "]"
    config_json = tool_data['config_schema'].replace("'", "''")
    sql = f"UPDATE tools SET input_types = {input_types_sql}, config_schema = '{config_json}'::jsonb, output_type = '{tool_data['output_type']}' WHERE id = '{tool_id}';"
    statements.append(sql)

migration = "\n".join(statements)
print(migration)
