-- Brand Studio derived pieces (business card, flyer, etc.)

CREATE TABLE IF NOT EXISTS public.brand_pieces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE SET NULL,
  strategy_id uuid REFERENCES public.brand_strategy_outputs(id) ON DELETE SET NULL,
  palette_id uuid REFERENCES public.brand_color_palettes(id) ON DELETE SET NULL,
  typography_id uuid REFERENCES public.brand_typography_sets(id) ON DELETE SET NULL,
  logo_concept_id uuid REFERENCES public.brand_logo_concepts(id) ON DELETE SET NULL,
  ai_run_id uuid REFERENCES public.brand_ai_runs(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.brand_versions(id) ON DELETE SET NULL,
  version_number integer NOT NULL DEFAULT 1,
  piece_type text NOT NULL CHECK (piece_type IN (
    'business_card',
    'flyer',
    'profile_cover',
    'email_signature',
    'letterhead',
    'quick_guide'
  )),
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
  prompt_version text NOT NULL DEFAULT 'brand_piece_v1',
  provider_used text,
  model_used text,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_pieces_project ON public.brand_pieces(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_pieces_type ON public.brand_pieces(piece_type);
CREATE INDEX IF NOT EXISTS idx_brand_pieces_status ON public.brand_pieces(status);
CREATE INDEX IF NOT EXISTS idx_brand_pieces_created ON public.brand_pieces(criado_em DESC);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_pieces ON public.brand_pieces;
CREATE TRIGGER trg_set_updated_at_brand_pieces
BEFORE UPDATE ON public.brand_pieces
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_pieces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_pieces_read ON public.brand_pieces;
DROP POLICY IF EXISTS brand_pieces_insert ON public.brand_pieces;
DROP POLICY IF EXISTS brand_pieces_update ON public.brand_pieces;
DROP POLICY IF EXISTS brand_pieces_delete ON public.brand_pieces;

CREATE POLICY brand_pieces_read
  ON public.brand_pieces
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_pieces_insert
  ON public.brand_pieces
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_pieces_update
  ON public.brand_pieces
  FOR UPDATE TO authenticated
  USING (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()))
  WITH CHECK (public.can_manage_brand(auth.uid()) OR public.can_approve_brand(auth.uid()));

CREATE POLICY brand_pieces_delete
  ON public.brand_pieces
  FOR DELETE TO authenticated
  USING (public.can_manage_brand(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_brand_pieces ON public.brand_pieces;
CREATE TRIGGER trg_audit_brand_pieces
AFTER INSERT OR UPDATE OR DELETE ON public.brand_pieces
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_pieces'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_pieces;
  END IF;
END;
$$;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('business_card_agent', 'openai', '', 0.3, 2200, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;

INSERT INTO public.brand_agent_configs (agent_key, provider, model, temperature, max_tokens, is_active, config)
VALUES ('flyer_agent', 'openai', '', 0.35, 2600, true, '{}'::jsonb)
ON CONFLICT (agent_key) DO NOTHING;
