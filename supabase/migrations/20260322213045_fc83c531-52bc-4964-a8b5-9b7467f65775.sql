
-- Create orcamento_assets table
CREATE TABLE public.orcamento_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  file_url text NOT NULL DEFAULT '',
  file_type text NOT NULL DEFAULT 'image',
  original_name text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamento_assets ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (public form)
CREATE POLICY "Anyone can insert orcamento_assets"
  ON public.orcamento_assets FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated can read
CREATE POLICY "Authenticated can read orcamento_assets"
  ON public.orcamento_assets FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated can delete
CREATE POLICY "Authenticated can delete orcamento_assets"
  ON public.orcamento_assets FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('orcamentos-assets', 'orcamentos-assets', true);

-- Storage RLS: anyone can upload
CREATE POLICY "Anyone can upload orcamento assets"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'orcamentos-assets');

-- Storage RLS: anyone can read (public bucket)
CREATE POLICY "Anyone can read orcamento assets"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'orcamentos-assets');

-- Storage RLS: authenticated can delete
CREATE POLICY "Authenticated can delete orcamento assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'orcamentos-assets');

-- Create orcamento_analises table for future AI analysis
CREATE TABLE public.orcamento_analises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente',
  provider_used text,
  model_used text,
  prompt_version text,
  output_json jsonb DEFAULT '{}'::jsonb,
  output_text text,
  duration_ms integer,
  tokens_input integer,
  tokens_output integer,
  cost_estimated numeric,
  error_reason text,
  input_summary text,
  fallback_triggered boolean DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamento_analises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read orcamento_analises"
  ON public.orcamento_analises FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert orcamento_analises"
  ON public.orcamento_analises FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update orcamento_analises"
  ON public.orcamento_analises FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
