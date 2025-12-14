-- Remove timestamp-converter tool from the tools table
-- This tool has been deprecated and replaced with enhanced Time Normalizer functionality
DELETE FROM public.tools WHERE id = 'timestamp-converter';
