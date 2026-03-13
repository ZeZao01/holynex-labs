
ALTER TABLE public.pdf_versoes
ADD COLUMN IF NOT EXISTS status text DEFAULT 'gerado',
ADD COLUMN IF NOT EXISTS template_used text DEFAULT '',
ADD COLUMN IF NOT EXISTS emissor_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS document_code text DEFAULT '',
ADD COLUMN IF NOT EXISTS document_hash text DEFAULT '',
ADD COLUMN IF NOT EXISTS snapshot jsonb DEFAULT '{}'::jsonb;
