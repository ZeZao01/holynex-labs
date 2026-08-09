CREATE TABLE IF NOT EXISTS public.brand_presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_project_id uuid,
  status text NOT NULL DEFAULT 'draft',
  title text NOT NULL DEFAULT '',
  executive_summary text,
  final_message text,
  blueprint jsonb NOT NULL DEFAULT '{}'::jsonb,
  agent_config_id uuid,
  agent_version_id uuid,
  provider_used text,
  model_used text,
  used_fallback boolean NOT NULL DEFAULT false,
  prompt_version integer,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_presentations_status_check
    CHECK (status IN ('draft', 'generated', 'approved', 'exported'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_presentations TO authenticated;
GRANT ALL ON public.brand_presentations TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_presentations_project ON public.brand_presentations(brand_project_id);
CREATE INDEX IF NOT EXISTS idx_brand_presentations_status ON public.brand_presentations(status);

CREATE TABLE IF NOT EXISTS public.brand_presentation_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.brand_presentations(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  title text NOT NULL DEFAULT '',
  order_index integer NOT NULL DEFAULT 0,
  copy text,
  artifacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_presentation_sections_key_check
    CHECK (section_key IN (
      'cover',
      'context',
      'objectives',
      'creative_direction',
      'palette',
      'typography',
      'logo',
      'pieces',
      'redesign_rationale',
      'next_steps'
    ))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_presentation_sections TO authenticated;
GRANT ALL ON public.brand_presentation_sections TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_presentation_sections_presentation ON public.brand_presentation_sections(presentation_id);
CREATE INDEX IF NOT EXISTS idx_brand_presentation_sections_order ON public.brand_presentation_sections(presentation_id, order_index);

CREATE TABLE IF NOT EXISTS public.brand_presentation_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.brand_presentations(id) ON DELETE CASCADE,
  artifact_type text NOT NULL,
  artifact_id uuid,
  artifact_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved boolean NOT NULL DEFAULT true,
  approved_at timestamptz,
  source_version_id uuid,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_presentation_artifacts_approved_check
    CHECK (approved = true)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_presentation_artifacts TO authenticated;
GRANT ALL ON public.brand_presentation_artifacts TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_presentation_artifacts_presentation ON public.brand_presentation_artifacts(presentation_id);
CREATE INDEX IF NOT EXISTS idx_brand_presentation_artifacts_type ON public.brand_presentation_artifacts(artifact_type);

CREATE TABLE IF NOT EXISTS public.brand_presentation_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.brand_presentations(id) ON DELETE CASCADE,
  format text NOT NULL DEFAULT 'pdf',
  file_url text,
  storage_path text,
  checksum text,
  export_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT brand_presentation_exports_format_check
    CHECK (format IN ('pdf'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_presentation_exports TO authenticated;
GRANT ALL ON public.brand_presentation_exports TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_presentation_exports_presentation ON public.brand_presentation_exports(presentation_id);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_presentations ON public.brand_presentations;
CREATE TRIGGER trg_set_updated_at_brand_presentations
BEFORE UPDATE ON public.brand_presentations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_presentation_sections ON public.brand_presentation_sections;
CREATE TRIGGER trg_set_updated_at_brand_presentation_sections
BEFORE UPDATE ON public.brand_presentation_sections
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_presentation_artifacts ON public.brand_presentation_artifacts;
CREATE TRIGGER trg_set_updated_at_brand_presentation_artifacts
BEFORE UPDATE ON public.brand_presentation_artifacts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_presentation_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_presentation_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_presentation_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_presentations_read ON public.brand_presentations;
DROP POLICY IF EXISTS brand_presentations_insert ON public.brand_presentations;
DROP POLICY IF EXISTS brand_presentations_update ON public.brand_presentations;
DROP POLICY IF EXISTS brand_presentations_delete ON public.brand_presentations;

CREATE POLICY brand_presentations_read
  ON public.brand_presentations
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_presentations_insert
  ON public.brand_presentations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentations_update
  ON public.brand_presentations
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentations_delete
  ON public.brand_presentations
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS brand_presentation_sections_read ON public.brand_presentation_sections;
DROP POLICY IF EXISTS brand_presentation_sections_insert ON public.brand_presentation_sections;
DROP POLICY IF EXISTS brand_presentation_sections_update ON public.brand_presentation_sections;
DROP POLICY IF EXISTS brand_presentation_sections_delete ON public.brand_presentation_sections;

CREATE POLICY brand_presentation_sections_read
  ON public.brand_presentation_sections
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_presentation_sections_insert
  ON public.brand_presentation_sections
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentation_sections_update
  ON public.brand_presentation_sections
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentation_sections_delete
  ON public.brand_presentation_sections
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS brand_presentation_artifacts_read ON public.brand_presentation_artifacts;
DROP POLICY IF EXISTS brand_presentation_artifacts_insert ON public.brand_presentation_artifacts;
DROP POLICY IF EXISTS brand_presentation_artifacts_update ON public.brand_presentation_artifacts;
DROP POLICY IF EXISTS brand_presentation_artifacts_delete ON public.brand_presentation_artifacts;

CREATE POLICY brand_presentation_artifacts_read
  ON public.brand_presentation_artifacts
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_presentation_artifacts_insert
  ON public.brand_presentation_artifacts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentation_artifacts_update
  ON public.brand_presentation_artifacts
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentation_artifacts_delete
  ON public.brand_presentation_artifacts
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS brand_presentation_exports_read ON public.brand_presentation_exports;
DROP POLICY IF EXISTS brand_presentation_exports_insert ON public.brand_presentation_exports;
DROP POLICY IF EXISTS brand_presentation_exports_update ON public.brand_presentation_exports;
DROP POLICY IF EXISTS brand_presentation_exports_delete ON public.brand_presentation_exports;

CREATE POLICY brand_presentation_exports_read
  ON public.brand_presentation_exports
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_presentation_exports_insert
  ON public.brand_presentation_exports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentation_exports_update
  ON public.brand_presentation_exports
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_presentation_exports_delete
  ON public.brand_presentation_exports
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

DROP TRIGGER IF EXISTS trg_audit_brand_presentations ON public.brand_presentations;
CREATE TRIGGER trg_audit_brand_presentations
AFTER INSERT OR UPDATE OR DELETE ON public.brand_presentations
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_presentation_sections ON public.brand_presentation_sections;
CREATE TRIGGER trg_audit_brand_presentation_sections
AFTER INSERT OR UPDATE OR DELETE ON public.brand_presentation_sections
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_presentation_artifacts ON public.brand_presentation_artifacts;
CREATE TRIGGER trg_audit_brand_presentation_artifacts
AFTER INSERT OR UPDATE OR DELETE ON public.brand_presentation_artifacts
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_presentation_exports ON public.brand_presentation_exports;
CREATE TRIGGER trg_audit_brand_presentation_exports
AFTER INSERT OR UPDATE OR DELETE ON public.brand_presentation_exports
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_presentations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_presentations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_presentation_sections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_presentation_sections;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_presentation_artifacts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_presentation_artifacts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_presentation_exports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_presentation_exports;
  END IF;
END;
$$;

INSERT INTO public.brand_agent_configs (
  agent_key,
  title,
  description,
  system_prompt,
  input_schema,
  output_schema,
  provider,
  model,
  temperature,
  max_tokens,
  fallback_enabled
)
SELECT
  'brand_presentation_agent',
  'Brand Presentation Agent',
  'Generates a structured brand presentation using only approved artifacts.',
  $$You are a brand presentation strategist. Build a narrative PDF blueprint and section copy using only approved strategy, palette, typography, logo concept, and pieces. Output concise, executive-ready language. Do not invent assets or reference unapproved material.$$,
  $$
  {
    "type": "object",
    "required": ["brand_project_id", "approved_artifacts"],
    "properties": {
      "brand_project_id": {"type": "string"},
      "project_name": {"type": "string"},
      "approved_artifacts": {
        "type": "object",
        "required": ["strategy", "palette", "typography", "logo", "pieces"],
        "properties": {
          "strategy": {"type": "object"},
          "palette": {"type": "object"},
          "typography": {"type": "object"},
          "logo": {"type": "object"},
          "pieces": {"type": "array"}
        }
      },
      "redesign_rationale": {"type": "string"},
      "client_context": {"type": "string"}
    }
  }
  $$::jsonb,
  $$
  {
    "type": "object",
    "required": ["executive_summary", "sections", "final_message"],
    "properties": {
      "executive_summary": {"type": "string"},
      "sections": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["section_key", "title", "copy"],
          "properties": {
            "section_key": {"type": "string"},
            "title": {"type": "string"},
            "copy": {"type": "string"},
            "artifacts_used": {"type": "array"}
          }
        }
      },
      "final_message": {"type": "string"}
    }
  }
  $$::jsonb,
  'openai',
  '',
  0.4,
  1400,
  true
WHERE NOT EXISTS (
  SELECT 1
  FROM public.brand_agent_configs
  WHERE agent_key = 'brand_presentation_agent'
);

INSERT INTO public.brand_agent_config_versions (
  agent_config_id,
  version_number,
  title,
  description,
  system_prompt,
  input_schema,
  output_schema,
  provider,
  model,
  temperature,
  max_tokens,
  fallback_enabled,
  is_active
)
SELECT
  c.id,
  1,
  c.title,
  c.description,
  c.system_prompt,
  c.input_schema,
  c.output_schema,
  c.provider,
  c.model,
  c.temperature,
  c.max_tokens,
  c.fallback_enabled,
  true
FROM public.brand_agent_configs c
WHERE c.agent_key = 'brand_presentation_agent'
  AND NOT EXISTS (
    SELECT 1
    FROM public.brand_agent_config_versions v
    WHERE v.agent_config_id = c.id
  );