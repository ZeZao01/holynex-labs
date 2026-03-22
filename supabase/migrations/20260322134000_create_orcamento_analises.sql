
CREATE TABLE public.orcamento_analises (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'em_processamento',
  provider_used text NULL DEFAULT '',
  model_used text NULL DEFAULT '',
  prompt_version text NULL DEFAULT '',
  output_json jsonb NULL,
  output_text text NULL DEFAULT '',
  duration_ms integer NULL,
  tokens_input integer NULL,
  tokens_output integer NULL,
  cost_estimated numeric(12,4) NULL,
  error_reason text NULL DEFAULT '',
  input_summary text NULL DEFAULT '',
  fallback_triggered boolean NULL DEFAULT false,
  criado_em timestamp with time zone NULL DEFAULT now(),
  atualizado_em timestamp with time zone NULL DEFAULT now(),
  UNIQUE (orcamento_id, version)
);

CREATE INDEX IF NOT EXISTS idx_orcamento_analises_orcamento_id ON public.orcamento_analises (orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_analises_criado_em ON public.orcamento_analises (criado_em DESC);

ALTER TABLE public.orcamento_analises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read orcamento_analises"
  ON public.orcamento_analises
  FOR SELECT
  TO authenticated
  USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.orcamento_analises;
