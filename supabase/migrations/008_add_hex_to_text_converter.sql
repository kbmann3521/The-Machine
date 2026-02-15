-- Add hexadecimal-converter tool to the tools table
INSERT INTO public.tools (id, name, description, category, input_types, output_type, config_schema, show_in_recommendations, created_at)
VALUES (
  'hexadecimal-converter',
  'Hexadecimal Converter',
  'Free, deterministic hexadecimal to text conversion with multiple encoding support, auto-detection, and batch processing',
  'encoding',
  ARRAY['text'],
  'text',
  '[
    {"id": "autoDetect", "label": "Auto-Detect Mode", "type": "toggle", "default": true},
    {"id": "mode", "label": "Mode", "type": "select", "options": [{"value": "hexToText", "label": "Hex → Text"}, {"value": "textToHex", "label": "Text → Hex"}], "default": "hexToText", "visibleWhen": {"field": "autoDetect", "value": false}},
    {"id": "charEncoding", "label": "Character Encoding", "type": "select", "options": [{"value": "utf-8", "label": "UTF-8"}, {"value": "ascii", "label": "ASCII"}, {"value": "utf-16", "label": "UTF-16"}], "default": "utf-8"},
    {"id": "hexFormat", "label": "Hex Input Format", "type": "select", "options": [{"value": "auto", "label": "Auto-detect"}, {"value": "space", "label": "Space-separated (48 65 6C 6C 6F)"}, {"value": "compact", "label": "Compact (48656C6C6F)"}, {"value": "with0x", "label": "With 0x prefix (0x48, 0x65, ...)"}, {"value": "cformat", "label": "C format (\\x48\\x65...)"}], "default": "auto"}
  ]'::jsonb,
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  input_types = EXCLUDED.input_types,
  output_type = EXCLUDED.output_type,
  config_schema = EXCLUDED.config_schema,
  show_in_recommendations = EXCLUDED.show_in_recommendations;
