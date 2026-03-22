-- Add missing lead fields and assets support
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS descricao_detalhada text DEFAULT '',
  ADD COLUMN IF NOT EXISTS orcamento_estimado text DEFAULT '';

-- Table to track lead assets
CREATE TABLE IF NOT EXISTS public.orcamento_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text DEFAULT 'image',
  original_name text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamento_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orcamento assets" ON public.orcamento_assets
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read orcamento assets" ON public.orcamento_assets
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete orcamento assets" ON public.orcamento_assets
  FOR DELETE
  TO authenticated
  USING (true);

-- Storage bucket for lead assets
INSERT INTO storage.buckets (id, name, public) VALUES ('orcamentos-assets', 'orcamentos-assets', true);

-- Storage policies
CREATE POLICY "Anyone can read orcamento assets" ON storage.objects FOR SELECT USING (bucket_id = 'orcamentos-assets');
CREATE POLICY "Anyone can upload orcamento assets" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'orcamentos-assets');
CREATE POLICY "Authenticated users can delete orcamento assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'orcamentos-assets');
