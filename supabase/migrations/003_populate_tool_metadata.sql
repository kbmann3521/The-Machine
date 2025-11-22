-- Populate missing tool metadata from lib/tools.js definitions
-- This migration updates 18 tools that have null/empty input_types, config_schema, or output_type

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"caseType","label":"Case Type","type":"select","options":[{"value":"uppercase","label":"UPPERCASE"},{"value":"lowercase","label":"lowercase"},{"value":"titlecase","label":"Title Case"},{"value":"sentencecase","label":"Sentence case"}],"default":"uppercase"}]'::jsonb, output_type = 'text' WHERE id = 'case-converter';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'json' WHERE id = 'email-validator';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"findText","label":"Find","type":"text","placeholder":"Text to find","default":""},{"id":"replaceText","label":"Replace With","type":"text","placeholder":"Replacement text","default":""},{"id":"useRegex","label":"Use Regular Expression","type":"toggle","default":false},{"id":"matchCase","label":"Match Case","type":"toggle","default":false}]'::jsonb, output_type = 'text' WHERE id = 'find-replace';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'text' WHERE id = 'html-minifier';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'json' WHERE id = 'integer-to-ip';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'json' WHERE id = 'ip-range-calculator';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'json' WHERE id = 'ip-to-integer';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"version","label":"IP Version","type":"select","options":[{"value":"both","label":"IPv4 and IPv6"},{"value":"4","label":"IPv4 Only"},{"value":"6","label":"IPv6 Only"}],"default":"both"}]'::jsonb, output_type = 'json' WHERE id = 'ip-validator';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'text' WHERE id = 'js-beautifier';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'text' WHERE id = 'js-minifier';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"strictMode","label":"Strict Mode","type":"toggle","default":false}]'::jsonb, output_type = 'json' WHERE id = 'markdown-linter';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"trimSpaces","label":"Trim Leading/Trailing Spaces","type":"toggle","default":true},{"id":"removeBlankLines","label":"Remove Blank Lines","type":"toggle","default":true},{"id":"removeDuplicateLines","label":"Remove Duplicate Lines","type":"toggle","default":false},{"id":"compressLineBreaks","label":"Compress Line Breaks","type":"toggle","default":false}]'::jsonb, output_type = 'text' WHERE id = 'remove-extras';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'text' WHERE id = 'reverse-text';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"separator","label":"Separator","type":"select","options":[{"value":"-","label":"Hyphen (-)"},{"value":"_","label":"Underscore (_)"},{"value":"","label":"None"}],"default":"-"}]'::jsonb, output_type = 'text' WHERE id = 'slug-generator';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"order","label":"Sort Order","type":"select","options":[{"value":"asc","label":"Ascending (A-Z)"},{"value":"desc","label":"Descending (Z-A)"},{"value":"length","label":"By Length (Short to Long)"}],"default":"asc"},{"id":"removeDuplicates","label":"Remove Duplicates","type":"toggle","default":false}]'::jsonb, output_type = 'text' WHERE id = 'sort-lines';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[{"id":"analyzeType","label":"Analysis Type","type":"select","options":[{"value":"readability","label":"Readability Score"},{"value":"stats","label":"Text Statistics"},{"value":"both","label":"Both"}],"default":"both"}]'::jsonb, output_type = 'json' WHERE id = 'text-analyzer';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'text' WHERE id = 'whitespace-visualizer';

UPDATE tools SET input_types = ARRAY['text'], config_schema = '[]'::jsonb, output_type = 'json' WHERE id = 'word-counter';
