-- Add new tools to the tools table
INSERT INTO public.tools (id, name, description, category, embedding, created_at)
VALUES
  ('js-minifier', 'JavaScript Minifier', 'Minify JavaScript code to reduce file size', 'formatter', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('js-beautifier', 'JavaScript Beautifier', 'Format and beautify JavaScript code with proper indentation', 'formatter', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('html-minifier', 'HTML Minifier', 'Minify HTML code to reduce file size', 'formatter', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('email-validator', 'Email Validator', 'Validate email addresses and check format correctness', 'validator', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('ip-validator', 'IP Address Validator', 'Validate IPv4 and IPv6 addresses', 'validator', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('ip-to-integer', 'IP to Integer Converter', 'Convert IPv4 addresses to integer representation', 'converter', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('integer-to-ip', 'Integer to IP Converter', 'Convert integer values back to IPv4 addresses', 'converter', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('ip-range-calculator', 'IP Range Calculator', 'Calculate CIDR ranges, subnets, and IP boundaries', 'calculator', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW()),
  ('markdown-linter', 'Markdown Linter', 'Lint and validate Markdown files for common issues', 'validator', '[0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]', NOW())
ON CONFLICT (id) DO NOTHING;
