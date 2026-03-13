
CREATE TABLE public.ai_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case text NOT NULL DEFAULT '',
  entity_type text NOT NULL DEFAULT '',
  entity_id uuid NULL,
  provider_used text NOT NULL DEFAULT '',
  model_used text NOT NULL DEFAULT '',
  prompt_version text NOT NULL DEFAULT 'v1.0',
  fallback_triggered boolean NOT NULL DEFAULT false,
  output_valid boolean NOT NULL DEFAULT true,
  human_approved boolean NULL,
  status text NOT NULL DEFAULT 'solicitado',
  error_reason text NULL DEFAULT '',
  input_summary text NULL DEFAULT '',
  output_data jsonb NULL DEFAULT '{}'::jsonb,
  output_text text NULL DEFAULT '',
  duration_ms integer NULL DEFAULT 0,
  reviewed_by text NULL DEFAULT '',
  reviewed_at timestamptz NULL,
  notas text NULL DEFAULT '',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read ai_executions" ON public.ai_executions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert ai_executions" ON public.ai_executions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ai_executions" ON public.ai_executions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anon insert ai_executions" ON public.ai_executions FOR INSERT TO anon WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_executions;
