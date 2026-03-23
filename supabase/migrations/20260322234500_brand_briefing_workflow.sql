-- Brand Studio briefing workflow (structured intake + references + context normalization)

-- ---------------------------------------------------------------------
-- brand_projects links
-- ---------------------------------------------------------------------

ALTER TABLE public.brand_projects
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS proposal_id uuid,
  ADD COLUMN IF NOT EXISTS project_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brand_projects_lead_id_fkey'
      AND conrelid = 'public.brand_projects'::regclass
  ) THEN
    ALTER TABLE public.brand_projects
      ADD CONSTRAINT brand_projects_lead_id_fkey
      FOREIGN KEY (lead_id)
      REFERENCES public.orcamentos(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brand_projects_proposal_id_fkey'
      AND conrelid = 'public.brand_projects'::regclass
  ) THEN
    ALTER TABLE public.brand_projects
      ADD CONSTRAINT brand_projects_proposal_id_fkey
      FOREIGN KEY (proposal_id)
      REFERENCES public.propostas(id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'brand_projects_project_id_fkey'
      AND conrelid = 'public.brand_projects'::regclass
  ) THEN
    ALTER TABLE public.brand_projects
      ADD CONSTRAINT brand_projects_project_id_fkey
      FOREIGN KEY (project_id)
      REFERENCES public.projects(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_brand_projects_lead_id ON public.brand_projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_brand_projects_client_id ON public.brand_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_brand_projects_proposal_id ON public.brand_projects(proposal_id);
CREATE INDEX IF NOT EXISTS idx_brand_projects_project_id ON public.brand_projects(project_id);

-- ---------------------------------------------------------------------
-- brand_briefs structured fields
-- ---------------------------------------------------------------------

ALTER TABLE public.brand_briefs
  ADD COLUMN IF NOT EXISTS nome_marca text,
  ADD COLUMN IF NOT EXISTS slogan text,
  ADD COLUMN IF NOT EXISTS nicho text,
  ADD COLUMN IF NOT EXISTS publico_alvo_detalhado text,
  ADD COLUMN IF NOT EXISTS proposta_valor text,
  ADD COLUMN IF NOT EXISTS concorrentes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS estilos_desejados text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS estilos_evitar text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS objetivos_identidade text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS observacoes_adicionais text,
  ADD COLUMN IF NOT EXISTS referencia_visual_contexto text,
  ADD COLUMN IF NOT EXISTS normalized_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS missing_questions text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS readiness_score numeric(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS normalized_at timestamptz,
  ADD COLUMN IF NOT EXISTS gap_summary text;

CREATE INDEX IF NOT EXISTS idx_brand_briefs_project_updated ON public.brand_briefs(project_id, atualizado_em DESC);
CREATE INDEX IF NOT EXISTS idx_brand_briefs_readiness_score ON public.brand_briefs(readiness_score DESC);

-- ---------------------------------------------------------------------
-- brand_brief_references table
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.brand_brief_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE CASCADE,
  reference_type text NOT NULL CHECK (reference_type IN ('image', 'url', 'note')),
  bucket text NOT NULL DEFAULT 'brand-references',
  storage_path text,
  public_url text,
  source_url text,
  note text,
  original_name text,
  mime_type text,
  size_bytes bigint,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_brief_references_project ON public.brand_brief_references(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_brief_references_brief ON public.brand_brief_references(brief_id);
CREATE INDEX IF NOT EXISTS idx_brand_brief_references_type ON public.brand_brief_references(reference_type);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_brief_references ON public.brand_brief_references;
CREATE TRIGGER trg_set_updated_at_brand_brief_references
BEFORE UPDATE ON public.brand_brief_references
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_brief_references ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_brief_references_read ON public.brand_brief_references;
DROP POLICY IF EXISTS brand_brief_references_insert ON public.brand_brief_references;
DROP POLICY IF EXISTS brand_brief_references_update ON public.brand_brief_references;
DROP POLICY IF EXISTS brand_brief_references_delete ON public.brand_brief_references;

CREATE POLICY brand_brief_references_read
  ON public.brand_brief_references
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_brief_references_insert
  ON public.brand_brief_references
  FOR INSERT TO authenticated
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_brief_references_update
  ON public.brand_brief_references
  FOR UPDATE TO authenticated
  USING (public.can_manage_brand(auth.uid()))
  WITH CHECK (public.can_manage_brand(auth.uid()));

CREATE POLICY brand_brief_references_delete
  ON public.brand_brief_references
  FOR DELETE TO authenticated
  USING (public.can_manage_brand(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_brand_brief_references ON public.brand_brief_references;
CREATE TRIGGER trg_audit_brand_brief_references
AFTER INSERT OR UPDATE OR DELETE ON public.brand_brief_references
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_brief_references'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_brief_references;
  END IF;
END;
$$;
