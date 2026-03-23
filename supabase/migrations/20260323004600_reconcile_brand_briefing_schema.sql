-- Reconcile Brand Studio briefing schema after duplicate migrations.
-- Guarantees consistent types and columns for structured briefing flow.

DO $$
DECLARE
  v_data_type text;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'brand_projects'
  ) THEN
    SELECT data_type
      INTO v_data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_projects'
      AND column_name = 'lead_id';

    IF v_data_type = 'text' THEN
      ALTER TABLE public.brand_projects
        ALTER COLUMN lead_id TYPE uuid
        USING (
          CASE
            WHEN trim(lead_id) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              THEN trim(lead_id)::uuid
            ELSE NULL
          END
        );
    END IF;

    SELECT data_type
      INTO v_data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_projects'
      AND column_name = 'client_id';

    IF v_data_type = 'text' THEN
      ALTER TABLE public.brand_projects
        ALTER COLUMN client_id TYPE uuid
        USING (
          CASE
            WHEN trim(client_id) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              THEN trim(client_id)::uuid
            ELSE NULL
          END
        );
    END IF;

    SELECT data_type
      INTO v_data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_projects'
      AND column_name = 'proposal_id';

    IF v_data_type = 'text' THEN
      ALTER TABLE public.brand_projects
        ALTER COLUMN proposal_id TYPE uuid
        USING (
          CASE
            WHEN trim(proposal_id) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              THEN trim(proposal_id)::uuid
            ELSE NULL
          END
        );
    END IF;

    SELECT data_type
      INTO v_data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_projects'
      AND column_name = 'project_id';

    IF v_data_type = 'text' THEN
      ALTER TABLE public.brand_projects
        ALTER COLUMN project_id TYPE uuid
        USING (
          CASE
            WHEN trim(project_id) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
              THEN trim(project_id)::uuid
            ELSE NULL
          END
        );
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'brand_projects'
  ) THEN
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
  END IF;
END;
$$;

ALTER TABLE public.brand_briefs
  ADD COLUMN IF NOT EXISTS gap_summary text;

ALTER TABLE public.brand_briefs
  ALTER COLUMN concorrentes SET DEFAULT '{}'::text[],
  ALTER COLUMN estilos_desejados SET DEFAULT '{}'::text[],
  ALTER COLUMN estilos_evitar SET DEFAULT '{}'::text[],
  ALTER COLUMN objetivos_identidade SET DEFAULT '{}'::text[],
  ALTER COLUMN missing_questions SET DEFAULT '{}'::text[],
  ALTER COLUMN normalized_context SET DEFAULT '{}'::jsonb,
  ALTER COLUMN readiness_score SET DEFAULT 0;

UPDATE public.brand_briefs
SET
  concorrentes = COALESCE(concorrentes, '{}'::text[]),
  estilos_desejados = COALESCE(estilos_desejados, '{}'::text[]),
  estilos_evitar = COALESCE(estilos_evitar, '{}'::text[]),
  objetivos_identidade = COALESCE(objetivos_identidade, '{}'::text[]),
  missing_questions = COALESCE(missing_questions, '{}'::text[]),
  normalized_context = COALESCE(normalized_context, '{}'::jsonb),
  readiness_score = COALESCE(readiness_score, 0)
WHERE
  concorrentes IS NULL
  OR estilos_desejados IS NULL
  OR estilos_evitar IS NULL
  OR objetivos_identidade IS NULL
  OR missing_questions IS NULL
  OR normalized_context IS NULL
  OR readiness_score IS NULL;

ALTER TABLE public.brand_briefs
  ALTER COLUMN concorrentes SET NOT NULL,
  ALTER COLUMN estilos_desejados SET NOT NULL,
  ALTER COLUMN estilos_evitar SET NOT NULL,
  ALTER COLUMN objetivos_identidade SET NOT NULL,
  ALTER COLUMN missing_questions SET NOT NULL,
  ALTER COLUMN normalized_context SET NOT NULL,
  ALTER COLUMN readiness_score SET NOT NULL;

ALTER TABLE public.brand_brief_references
  ADD COLUMN IF NOT EXISTS public_url text,
  ADD COLUMN IF NOT EXISTS original_name text,
  ADD COLUMN IF NOT EXISTS mime_type text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint;

UPDATE public.brand_brief_references
SET reference_type = 'note'
WHERE reference_type IS NULL
  OR reference_type NOT IN ('image', 'url', 'note');

ALTER TABLE public.brand_brief_references
  ALTER COLUMN reference_type SET DEFAULT 'note',
  ALTER COLUMN reference_type SET NOT NULL;

ALTER TABLE public.brand_brief_references
  DROP CONSTRAINT IF EXISTS brand_brief_references_type_check;

ALTER TABLE public.brand_brief_references
  ADD CONSTRAINT brand_brief_references_type_check
  CHECK (reference_type = ANY (ARRAY['image', 'url', 'note']::text[]));

UPDATE public.brand_brief_references
SET bucket = 'brand-references'
WHERE bucket IS NULL OR trim(bucket) = '';

ALTER TABLE public.brand_brief_references
  ALTER COLUMN bucket SET DEFAULT 'brand-references',
  ALTER COLUMN bucket SET NOT NULL;
