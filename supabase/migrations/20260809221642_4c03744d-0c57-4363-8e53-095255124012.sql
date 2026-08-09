CREATE OR REPLACE FUNCTION public.can_approve_brand(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
    OR public.is_brand_role(_user_id, ARRAY['brand_admin', 'brand_reviewer']);
$$;

CREATE TABLE IF NOT EXISTS public.brand_strategy_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE SET NULL,
  ai_run_id uuid REFERENCES public.brand_ai_runs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  prompt_version text NOT NULL DEFAULT 'brand_strategy_v1',
  provider_used text,
  model_used text,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_strategy_outputs TO authenticated;
GRANT ALL ON public.brand_strategy_outputs TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_strategy_project ON public.brand_strategy_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_strategy_status ON public.brand_strategy_outputs(status);
CREATE INDEX IF NOT EXISTS idx_brand_strategy_brief ON public.brand_strategy_outputs(brief_id);
CREATE INDEX IF NOT EXISTS idx_brand_strategy_created ON public.brand_strategy_outputs(criado_em DESC);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_strategy_outputs ON public.brand_strategy_outputs;
CREATE TRIGGER trg_set_updated_at_brand_strategy_outputs
BEFORE UPDATE ON public.brand_strategy_outputs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_strategy_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_strategy_outputs_read ON public.brand_strategy_outputs;
DROP POLICY IF EXISTS brand_strategy_outputs_insert ON public.brand_strategy_outputs;
DROP POLICY IF EXISTS brand_strategy_outputs_update ON public.brand_strategy_outputs;
DROP POLICY IF EXISTS brand_strategy_outputs_delete ON public.brand_strategy_outputs;

CREATE POLICY brand_strategy_outputs_read
  ON public.brand_strategy_outputs
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_strategy_outputs_insert
  ON public.brand_strategy_outputs
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_strategy_outputs_update
  ON public.brand_strategy_outputs
  FOR UPDATE TO authenticated
  USING (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()))
  WITH CHECK (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()));

CREATE POLICY brand_strategy_outputs_delete
  ON public.brand_strategy_outputs
  FOR DELETE TO authenticated
  USING (public.can_manage_brand(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_brand_strategy_outputs ON public.brand_strategy_outputs;
CREATE TRIGGER trg_audit_brand_strategy_outputs
AFTER INSERT OR UPDATE OR DELETE ON public.brand_strategy_outputs
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_strategy_outputs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_strategy_outputs;
  END IF;
END;
$$;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('brand_strategy_agent', 'openai', '', 0.25, 3200, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;