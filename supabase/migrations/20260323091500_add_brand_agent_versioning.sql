-- Brand Studio AI agent governance: versioning + stricter access

-- Extend base config with governed fields
ALTER TABLE public.brand_agent_configs
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS system_prompt text,
  ADD COLUMN IF NOT EXISTS input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fallback_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS active_version_id uuid;

-- Normalize existing rows using legacy config payloads when present
UPDATE public.brand_agent_configs
SET
  title = COALESCE(NULLIF(title, ''), COALESCE(config ->> 'title', agent_key)),
  description = COALESCE(description, config ->> 'description'),
  system_prompt = COALESCE(system_prompt, config ->> 'system_prompt'),
  input_schema = COALESCE(input_schema, COALESCE(config -> 'input_schema', '{}'::jsonb)),
  output_schema = COALESCE(output_schema, COALESCE(config -> 'output_schema', '{}'::jsonb)),
  fallback_enabled = COALESCE(fallback_enabled, (config ->> 'fallback_enabled')::boolean, true),
  version = COALESCE(version, 1)
WHERE true;

-- Version table for governed prompt history
CREATE TABLE IF NOT EXISTS public.brand_agent_config_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_config_id uuid NOT NULL REFERENCES public.brand_agent_configs(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  title text NOT NULL DEFAULT '',
  description text,
  system_prompt text,
  input_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  provider text NOT NULL DEFAULT 'openai',
  model text NOT NULL DEFAULT '',
  temperature numeric,
  max_tokens integer,
  fallback_enabled boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_config_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_brand_agent_versions_agent ON public.brand_agent_config_versions(agent_config_id);
CREATE INDEX IF NOT EXISTS idx_brand_agent_versions_active ON public.brand_agent_config_versions(agent_config_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_agent_versions_single_active
  ON public.brand_agent_config_versions(agent_config_id)
  WHERE is_active = true;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_set_updated_at_brand_agent_config_versions ON public.brand_agent_config_versions;
CREATE TRIGGER trg_set_updated_at_brand_agent_config_versions
BEFORE UPDATE ON public.brand_agent_config_versions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

-- RLS policies (only dev_admin/super_admin can edit)
ALTER TABLE public.brand_agent_config_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_agent_config_versions_read ON public.brand_agent_config_versions;
DROP POLICY IF EXISTS brand_agent_config_versions_insert ON public.brand_agent_config_versions;
DROP POLICY IF EXISTS brand_agent_config_versions_update ON public.brand_agent_config_versions;
DROP POLICY IF EXISTS brand_agent_config_versions_delete ON public.brand_agent_config_versions;

CREATE POLICY brand_agent_config_versions_read
  ON public.brand_agent_config_versions
  FOR SELECT TO authenticated
  USING (public.can_view_brand(auth.uid()));

CREATE POLICY brand_agent_config_versions_insert
  ON public.brand_agent_config_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_agent_config_versions_update
  ON public.brand_agent_config_versions
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_agent_config_versions_delete
  ON public.brand_agent_config_versions
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Tighten edit permissions on base configs
DROP POLICY IF EXISTS brand_agent_configs_insert ON public.brand_agent_configs;
DROP POLICY IF EXISTS brand_agent_configs_update ON public.brand_agent_configs;
DROP POLICY IF EXISTS brand_agent_configs_delete ON public.brand_agent_configs;

CREATE POLICY brand_agent_configs_insert
  ON public.brand_agent_configs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_agent_configs_update
  ON public.brand_agent_configs
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY brand_agent_configs_delete
  ON public.brand_agent_configs
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- Bootstrap versions for existing configs
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
  is_active,
  created_by
)
SELECT
  c.id,
  1,
  COALESCE(NULLIF(c.title, ''), c.agent_key),
  c.description,
  c.system_prompt,
  c.input_schema,
  c.output_schema,
  c.provider,
  c.model,
  c.temperature,
  c.max_tokens,
  c.fallback_enabled,
  true,
  c.updated_by
FROM public.brand_agent_configs c
WHERE NOT EXISTS (
  SELECT 1
  FROM public.brand_agent_config_versions v
  WHERE v.agent_config_id = c.id
);

-- Sync active version back to base config
UPDATE public.brand_agent_configs c
SET
  active_version_id = v.id,
  version = v.version_number,
  title = COALESCE(NULLIF(c.title, ''), v.title),
  description = COALESCE(c.description, v.description),
  system_prompt = COALESCE(c.system_prompt, v.system_prompt),
  input_schema = COALESCE(c.input_schema, v.input_schema),
  output_schema = COALESCE(c.output_schema, v.output_schema),
  provider = COALESCE(c.provider, v.provider),
  model = COALESCE(c.model, v.model),
  temperature = COALESCE(c.temperature, v.temperature),
  max_tokens = COALESCE(c.max_tokens, v.max_tokens),
  fallback_enabled = COALESCE(c.fallback_enabled, v.fallback_enabled)
FROM public.brand_agent_config_versions v
WHERE v.agent_config_id = c.id AND v.is_active = true;

-- Audit + Realtime
DROP TRIGGER IF EXISTS trg_audit_brand_agent_config_versions ON public.brand_agent_config_versions;
CREATE TRIGGER trg_audit_brand_agent_config_versions
AFTER INSERT OR UPDATE OR DELETE ON public.brand_agent_config_versions
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'brand_agent_config_versions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_agent_config_versions;
  END IF;
END;
$$;
