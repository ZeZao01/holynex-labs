-- Brand Studio logo concepts + critic workflow

CREATE TABLE IF NOT EXISTS public.brand_logo_concepts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE SET NULL,
  strategy_id uuid REFERENCES public.brand_strategy_outputs(id) ON DELETE SET NULL,
  palette_id uuid REFERENCES public.brand_color_palettes(id) ON DELETE SET NULL,
  typography_id uuid REFERENCES public.brand_typography_sets(id) ON DELETE SET NULL,
  ai_run_id uuid REFERENCES public.brand_ai_runs(id) ON DELETE SET NULL,
  critic_ai_run_id uuid REFERENCES public.brand_ai_runs(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.brand_versions(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  prompt_version text NOT NULL DEFAULT 'brand_logo_concept_v1',
  provider_used text,
  model_used text,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  selected_concept_index integer,
  selected_concept_title text,
  critic_status text NOT NULL DEFAULT 'pendente' CHECK (critic_status IN ('pendente', 'concluido')),
  critic_prompt_version text NOT NULL DEFAULT 'brand_logo_critic_v1',
  critic_provider_used text,
  critic_model_used text,
  critic_payload jsonb,
  critic_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_logo_project ON public.brand_logo_concepts(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_logo_status ON public.brand_logo_concepts(status);
CREATE INDEX IF NOT EXISTS idx_brand_logo_critic_status ON public.brand_logo_concepts(critic_status);
CREATE INDEX IF NOT EXISTS idx_brand_logo_version ON public.brand_logo_concepts(version_number);
CREATE INDEX IF NOT EXISTS idx_brand_logo_created ON public.brand_logo_concepts(criado_em DESC);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_logo_concepts ON public.brand_logo_concepts;
CREATE TRIGGER trg_set_updated_at_brand_logo_concepts
BEFORE UPDATE ON public.brand_logo_concepts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_logo_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_logo_concepts_read ON public.brand_logo_concepts;
DROP POLICY IF EXISTS brand_logo_concepts_insert ON public.brand_logo_concepts;
DROP POLICY IF EXISTS brand_logo_concepts_update ON public.brand_logo_concepts;
DROP POLICY IF EXISTS brand_logo_concepts_delete ON public.brand_logo_concepts;

CREATE POLICY brand_logo_concepts_read
  ON public.brand_logo_concepts
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_logo_concepts_insert
  ON public.brand_logo_concepts
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_logo_concepts_update
  ON public.brand_logo_concepts
  FOR UPDATE TO authenticated
  USING (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()))
  WITH CHECK (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()));

CREATE POLICY brand_logo_concepts_delete
  ON public.brand_logo_concepts
  FOR DELETE TO authenticated
  USING (public.can_manage_brand(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_brand_logo_concepts ON public.brand_logo_concepts;
CREATE TRIGGER trg_audit_brand_logo_concepts
AFTER INSERT OR UPDATE OR DELETE ON public.brand_logo_concepts
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_logo_concepts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_logo_concepts;
  END IF;
END;
$$;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('logo_concept_agent', 'openai', '', 0.25, 2600, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('logo_critic_agent', 'openai', '', 0.25, 2000, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;
