-- Add QR Code Generator tool to the tools table
INSERT INTO public.tools (id, name, description, category, created_at)
VALUES
  ('qr-code-generator', 'QR Code Generator', 'Generate QR codes from text, URLs, or any data with customizable size, colors, and error correction', 'generator', NOW())
ON CONFLICT (id) DO NOTHING;

-- Update tool metadata for QR Code Generator
UPDATE public.tools 
SET 
  input_types = ARRAY['text'],
  config_schema = '[{"id":"size","label":"QR Code Size (pixels)","type":"number","placeholder":"200","default":200,"description":"Width and height of the generated QR code in pixels (50-500)"},{"id":"errorCorrectionLevel","label":"Error Correction Level","type":"select","options":[{"value":"L","label":"Low (7% recovery)"},{"value":"M","label":"Medium (15% recovery)"},{"value":"Q","label":"Quartile (25% recovery)"},{"value":"H","label":"High (30% recovery)"}],"default":"M","description":"Higher levels allow recovery from more damage but create larger codes"},{"id":"margin","label":"Quiet Zone (modules)","type":"number","placeholder":"2","default":2,"description":"Margin around the QR code in modules (0-10 recommended)"},{"id":"color","label":"Dark Color","type":"text","placeholder":"#000000","default":"#000000","description":"Hex color for dark modules (typically black)"},{"id":"bgColor","label":"Light Color","type":"text","placeholder":"#FFFFFF","default":"#FFFFFF","description":"Hex color for light modules (typically white)"}]'::jsonb,
  output_type = 'json',
  show_in_recommendations = true
WHERE id = 'qr-code-generator';
