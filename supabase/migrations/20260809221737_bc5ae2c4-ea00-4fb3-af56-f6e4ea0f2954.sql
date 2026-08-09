CREATE TABLE IF NOT EXISTS public.brand_color_palettes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE SET NULL,
  strategy_id uuid REFERENCES public.brand_strategy_outputs(id) ON DELETE SET NULL,
  ai_run_id uuid REFERENCES public.brand_ai_runs(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.brand_versions(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  prompt_version text NOT NULL DEFAULT 'brand_palette_v1',
  provider_used text,
  model_used text,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_color_palettes TO authenticated;
GRANT ALL ON public.brand_color_palettes TO service_role;

CREATE TABLE IF NOT EXISTS public.brand_typography_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE SET NULL,
  strategy_id uuid REFERENCES public.brand_strategy_outputs(id) ON DELETE SET NULL,
  ai_run_id uuid REFERENCES public.brand_ai_runs(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.brand_versions(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  prompt_version text NOT NULL DEFAULT 'brand_typography_v1',
  provider_used text,
  model_used text,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_typography_sets TO authenticated;
GRANT ALL ON public.brand_typography_sets TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_palettes_project ON public.brand_color_palettes(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_palettes_status ON public.brand_color_palettes(status);
CREATE INDEX IF NOT EXISTS idx_brand_palettes_brief ON public.brand_color_palettes(brief_id);
CREATE INDEX IF NOT EXISTS idx_brand_palettes_strategy ON public.brand_color_palettes(strategy_id);
CREATE INDEX IF NOT EXISTS idx_brand_palettes_version ON public.brand_color_palettes(version_number);
CREATE INDEX IF NOT EXISTS idx_brand_palettes_created ON public.brand_color_palettes(criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_brand_typography_project ON public.brand_typography_sets(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_typography_status ON public.brand_typography_sets(status);
CREATE INDEX IF NOT EXISTS idx_brand_typography_brief ON public.brand_typography_sets(brief_id);
CREATE INDEX IF NOT EXISTS idx_brand_typography_strategy ON public.brand_typography_sets(strategy_id);
CREATE INDEX IF NOT EXISTS idx_brand_typography_version ON public.brand_typography_sets(version_number);
CREATE INDEX IF NOT EXISTS idx_brand_typography_created ON public.brand_typography_sets(criado_em DESC);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_color_palettes ON public.brand_color_palettes;
CREATE TRIGGER trg_set_updated_at_brand_color_palettes
BEFORE UPDATE ON public.brand_color_palettes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_typography_sets ON public.brand_typography_sets;
CREATE TRIGGER trg_set_updated_at_brand_typography_sets
BEFORE UPDATE ON public.brand_typography_sets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_color_palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_typography_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_color_palettes_read ON public.brand_color_palettes;
DROP POLICY IF EXISTS brand_color_palettes_insert ON public.brand_color_palettes;
DROP POLICY IF EXISTS brand_color_palettes_update ON public.brand_color_palettes;
DROP POLICY IF EXISTS brand_color_palettes_delete ON public.brand_color_palettes;

CREATE POLICY brand_color_palettes_read
  ON public.brand_color_palettes
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_color_palettes_insert
  ON public.brand_color_palettes
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_color_palettes_update
  ON public.brand_color_palettes
  FOR UPDATE TO authenticated
  USING (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()))
  WITH CHECK (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()));

CREATE POLICY brand_color_palettes_delete
  ON public.brand_color_palettes
  FOR DELETE TO authenticated
  USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_typography_sets_read ON public.brand_typography_sets;
DROP POLICY IF EXISTS brand_typography_sets_insert ON public.brand_typography_sets;
DROP POLICY IF EXISTS brand_typography_sets_update ON public.brand_typography_sets;
DROP POLICY IF EXISTS brand_typography_sets_delete ON public.brand_typography_sets;

CREATE POLICY brand_typography_sets_read
  ON public.brand_typography_sets
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_typography_sets_insert
  ON public.brand_typography_sets
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_typography_sets_update
  ON public.brand_typography_sets
  FOR UPDATE TO authenticated
  USING (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()))
  WITH CHECK (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()));

CREATE POLICY brand_typography_sets_delete
  ON public.brand_typography_sets
  FOR DELETE TO authenticated
  USING (public.can_manage_brand(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_brand_color_palettes ON public.brand_color_palettes;
CREATE TRIGGER trg_audit_brand_color_palettes
AFTER INSERT OR UPDATE OR DELETE ON public.brand_color_palettes
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_typography_sets ON public.brand_typography_sets;
CREATE TRIGGER trg_audit_brand_typography_sets
AFTER INSERT OR UPDATE OR DELETE ON public.brand_typography_sets
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_color_palettes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_color_palettes;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_typography_sets'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_typography_sets;
  END IF;
END;
$$;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('color_palette_agent', 'openai', '', 0.25, 2400, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('typography_agent', 'openai', '', 0.25, 2400, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;