-- Brand Studio AI domain foundation

CREATE OR REPLACE FUNCTION public.set_updated_at_brand_domain()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_brand_role(_user_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_role_assignments
    WHERE user_id = _user_id
      AND is_active = true
      AND role_name = ANY (_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_brand(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
    OR public.is_brand_role(_user_id, ARRAY['brand_admin', 'brand_designer', 'brand_reviewer']);
$$;

CREATE OR REPLACE FUNCTION public.can_manage_brand(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_admin(_user_id)
    OR public.is_brand_role(_user_id, ARRAY['brand_admin', 'brand_designer']);
$$;

CREATE TABLE IF NOT EXISTS public.brand_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE,
  status text NOT NULL DEFAULT 'planejamento',
  descricao text,
  owner_user_id uuid REFERENCES auth.users(id),
  started_at timestamptz,
  deadline_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT '',
  contexto text,
  objetivos text[] NOT NULL DEFAULT '{}'::text[],
  publico_alvo text,
  restricoes text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'rascunho',
  version integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  brief_id uuid REFERENCES public.brand_briefs(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  description text,
  task_type text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'pendente',
  priority text NOT NULL DEFAULT 'media',
  assigned_to uuid REFERENCES auth.users(id),
  due_date timestamptz,
  ai_required boolean NOT NULL DEFAULT false,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key text NOT NULL UNIQUE,
  provider text NOT NULL DEFAULT 'openai',
  model text NOT NULL DEFAULT '',
  temperature numeric,
  max_tokens integer,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_ai_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.brand_tasks(id) ON DELETE SET NULL,
  agent_config_id uuid REFERENCES public.brand_agent_configs(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'solicitado',
  provider_used text,
  model_used text,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_reason text,
  duration_ms integer,
  tokens_input integer,
  tokens_output integer,
  cost_estimated numeric,
  executed_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  label text NOT NULL DEFAULT '',
  summary text,
  change_log text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'em_criacao',
  presentation_url text,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.brand_design_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.brand_versions(id) ON DELETE SET NULL,
  task_id uuid REFERENCES public.brand_tasks(id) ON DELETE SET NULL,
  bucket text NOT NULL DEFAULT 'brand-generated',
  storage_path text NOT NULL,
  public_url text,
  asset_type text NOT NULL DEFAULT 'image',
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_feedback_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.brand_versions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'aberto',
  score integer,
  feedback_text text,
  change_requests jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolved_at timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.brand_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.brand_projects(id) ON DELETE CASCADE,
  addon_key text NOT NULL,
  titulo text NOT NULL DEFAULT '',
  descricao text,
  status text NOT NULL DEFAULT 'sugerido',
  impacto text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, addon_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_projects, public.brand_briefs, public.brand_tasks, public.brand_agent_configs, public.brand_ai_runs, public.brand_versions, public.brand_design_assets, public.brand_feedback_cycles, public.brand_addons TO authenticated;
GRANT ALL ON public.brand_projects, public.brand_briefs, public.brand_tasks, public.brand_agent_configs, public.brand_ai_runs, public.brand_versions, public.brand_design_assets, public.brand_feedback_cycles, public.brand_addons TO service_role;

CREATE INDEX IF NOT EXISTS idx_brand_projects_status ON public.brand_projects(status);
CREATE INDEX IF NOT EXISTS idx_brand_projects_owner ON public.brand_projects(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_brand_briefs_project ON public.brand_briefs(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_tasks_project ON public.brand_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_tasks_status ON public.brand_tasks(status);
CREATE INDEX IF NOT EXISTS idx_brand_ai_runs_project ON public.brand_ai_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_ai_runs_status ON public.brand_ai_runs(status);
CREATE INDEX IF NOT EXISTS idx_brand_assets_project ON public.brand_design_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_assets_bucket ON public.brand_design_assets(bucket);
CREATE INDEX IF NOT EXISTS idx_brand_versions_project ON public.brand_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_feedback_project ON public.brand_feedback_cycles(project_id);
CREATE INDEX IF NOT EXISTS idx_brand_addons_project ON public.brand_addons(project_id);

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_projects ON public.brand_projects;
CREATE TRIGGER trg_set_updated_at_brand_projects
BEFORE UPDATE ON public.brand_projects
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_briefs ON public.brand_briefs;
CREATE TRIGGER trg_set_updated_at_brand_briefs
BEFORE UPDATE ON public.brand_briefs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_tasks ON public.brand_tasks;
CREATE TRIGGER trg_set_updated_at_brand_tasks
BEFORE UPDATE ON public.brand_tasks
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_agent_configs ON public.brand_agent_configs;
CREATE TRIGGER trg_set_updated_at_brand_agent_configs
BEFORE UPDATE ON public.brand_agent_configs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_ai_runs ON public.brand_ai_runs;
CREATE TRIGGER trg_set_updated_at_brand_ai_runs
BEFORE UPDATE ON public.brand_ai_runs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_versions ON public.brand_versions;
CREATE TRIGGER trg_set_updated_at_brand_versions
BEFORE UPDATE ON public.brand_versions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_design_assets ON public.brand_design_assets;
CREATE TRIGGER trg_set_updated_at_brand_design_assets
BEFORE UPDATE ON public.brand_design_assets
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_feedback_cycles ON public.brand_feedback_cycles;
CREATE TRIGGER trg_set_updated_at_brand_feedback_cycles
BEFORE UPDATE ON public.brand_feedback_cycles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

DROP TRIGGER IF EXISTS trg_set_updated_at_brand_addons ON public.brand_addons;
CREATE TRIGGER trg_set_updated_at_brand_addons
BEFORE UPDATE ON public.brand_addons
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_brand_domain();

ALTER TABLE public.brand_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_design_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_feedback_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_addons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_projects_read ON public.brand_projects;
DROP POLICY IF EXISTS brand_projects_insert ON public.brand_projects;
DROP POLICY IF EXISTS brand_projects_update ON public.brand_projects;
DROP POLICY IF EXISTS brand_projects_delete ON public.brand_projects;
CREATE POLICY brand_projects_read ON public.brand_projects FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_projects_insert ON public.brand_projects FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_projects_update ON public.brand_projects FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_projects_delete ON public.brand_projects FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_briefs_read ON public.brand_briefs;
DROP POLICY IF EXISTS brand_briefs_insert ON public.brand_briefs;
DROP POLICY IF EXISTS brand_briefs_update ON public.brand_briefs;
DROP POLICY IF EXISTS brand_briefs_delete ON public.brand_briefs;
CREATE POLICY brand_briefs_read ON public.brand_briefs FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_briefs_insert ON public.brand_briefs FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_briefs_update ON public.brand_briefs FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_briefs_delete ON public.brand_briefs FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_tasks_read ON public.brand_tasks;
DROP POLICY IF EXISTS brand_tasks_insert ON public.brand_tasks;
DROP POLICY IF EXISTS brand_tasks_update ON public.brand_tasks;
DROP POLICY IF EXISTS brand_tasks_delete ON public.brand_tasks;
CREATE POLICY brand_tasks_read ON public.brand_tasks FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_tasks_insert ON public.brand_tasks FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_tasks_update ON public.brand_tasks FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_tasks_delete ON public.brand_tasks FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_agent_configs_read ON public.brand_agent_configs;
DROP POLICY IF EXISTS brand_agent_configs_insert ON public.brand_agent_configs;
DROP POLICY IF EXISTS brand_agent_configs_update ON public.brand_agent_configs;
DROP POLICY IF EXISTS brand_agent_configs_delete ON public.brand_agent_configs;
CREATE POLICY brand_agent_configs_read ON public.brand_agent_configs FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_agent_configs_insert ON public.brand_agent_configs FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_agent_configs_update ON public.brand_agent_configs FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_agent_configs_delete ON public.brand_agent_configs FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_ai_runs_read ON public.brand_ai_runs;
DROP POLICY IF EXISTS brand_ai_runs_insert ON public.brand_ai_runs;
DROP POLICY IF EXISTS brand_ai_runs_update ON public.brand_ai_runs;
DROP POLICY IF EXISTS brand_ai_runs_delete ON public.brand_ai_runs;
CREATE POLICY brand_ai_runs_read ON public.brand_ai_runs FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_ai_runs_insert ON public.brand_ai_runs FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_ai_runs_update ON public.brand_ai_runs FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_ai_runs_delete ON public.brand_ai_runs FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_design_assets_read ON public.brand_design_assets;
DROP POLICY IF EXISTS brand_design_assets_insert ON public.brand_design_assets;
DROP POLICY IF EXISTS brand_design_assets_update ON public.brand_design_assets;
DROP POLICY IF EXISTS brand_design_assets_delete ON public.brand_design_assets;
CREATE POLICY brand_design_assets_read ON public.brand_design_assets FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_design_assets_insert ON public.brand_design_assets FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_design_assets_update ON public.brand_design_assets FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_design_assets_delete ON public.brand_design_assets FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_versions_read ON public.brand_versions;
DROP POLICY IF EXISTS brand_versions_insert ON public.brand_versions;
DROP POLICY IF EXISTS brand_versions_update ON public.brand_versions;
DROP POLICY IF EXISTS brand_versions_delete ON public.brand_versions;
CREATE POLICY brand_versions_read ON public.brand_versions FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_versions_insert ON public.brand_versions FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_versions_update ON public.brand_versions FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_versions_delete ON public.brand_versions FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_feedback_cycles_read ON public.brand_feedback_cycles;
DROP POLICY IF EXISTS brand_feedback_cycles_insert ON public.brand_feedback_cycles;
DROP POLICY IF EXISTS brand_feedback_cycles_update ON public.brand_feedback_cycles;
DROP POLICY IF EXISTS brand_feedback_cycles_delete ON public.brand_feedback_cycles;
CREATE POLICY brand_feedback_cycles_read ON public.brand_feedback_cycles FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_feedback_cycles_insert ON public.brand_feedback_cycles FOR INSERT TO authenticated WITH CHECK (public.can_view_brand(auth.uid()));
CREATE POLICY brand_feedback_cycles_update ON public.brand_feedback_cycles FOR UPDATE TO authenticated USING (public.can_view_brand(auth.uid())) WITH CHECK (public.can_view_brand(auth.uid()));
CREATE POLICY brand_feedback_cycles_delete ON public.brand_feedback_cycles FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS brand_addons_read ON public.brand_addons;
DROP POLICY IF EXISTS brand_addons_insert ON public.brand_addons;
DROP POLICY IF EXISTS brand_addons_update ON public.brand_addons;
DROP POLICY IF EXISTS brand_addons_delete ON public.brand_addons;
CREATE POLICY brand_addons_read ON public.brand_addons FOR SELECT TO authenticated USING (public.can_view_brand(auth.uid()));
CREATE POLICY brand_addons_insert ON public.brand_addons FOR INSERT TO authenticated WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_addons_update ON public.brand_addons FOR UPDATE TO authenticated USING (public.can_manage_brand(auth.uid())) WITH CHECK (public.can_manage_brand(auth.uid()));
CREATE POLICY brand_addons_delete ON public.brand_addons FOR DELETE TO authenticated USING (public.can_manage_brand(auth.uid()));

CREATE OR REPLACE FUNCTION public.audit_brand_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_id text;
  v_user_email text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_entity_id := COALESCE(OLD.id::text, '');
  ELSE
    v_entity_id := COALESCE(NEW.id::text, '');
  END IF;

  v_user_email := COALESCE(auth.jwt() ->> 'email', '');

  INSERT INTO public.audit_logs (user_id, user_email, action, entity_type, entity_id, details)
  VALUES (
    auth.uid(),
    v_user_email,
    lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    jsonb_build_object('schema', TG_TABLE_SCHEMA, 'table', TG_TABLE_NAME, 'operation', TG_OP)
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_brand_projects ON public.brand_projects;
CREATE TRIGGER trg_audit_brand_projects
AFTER INSERT OR UPDATE OR DELETE ON public.brand_projects
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_briefs ON public.brand_briefs;
CREATE TRIGGER trg_audit_brand_briefs
AFTER INSERT OR UPDATE OR DELETE ON public.brand_briefs
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_tasks ON public.brand_tasks;
CREATE TRIGGER trg_audit_brand_tasks
AFTER INSERT OR UPDATE OR DELETE ON public.brand_tasks
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_agent_configs ON public.brand_agent_configs;
CREATE TRIGGER trg_audit_brand_agent_configs
AFTER INSERT OR UPDATE OR DELETE ON public.brand_agent_configs
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_ai_runs ON public.brand_ai_runs;
CREATE TRIGGER trg_audit_brand_ai_runs
AFTER INSERT OR UPDATE OR DELETE ON public.brand_ai_runs
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_versions ON public.brand_versions;
CREATE TRIGGER trg_audit_brand_versions
AFTER INSERT OR UPDATE OR DELETE ON public.brand_versions
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_design_assets ON public.brand_design_assets;
CREATE TRIGGER trg_audit_brand_design_assets
AFTER INSERT OR UPDATE OR DELETE ON public.brand_design_assets
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_feedback_cycles ON public.brand_feedback_cycles;
CREATE TRIGGER trg_audit_brand_feedback_cycles
AFTER INSERT OR UPDATE OR DELETE ON public.brand_feedback_cycles
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DROP TRIGGER IF EXISTS trg_audit_brand_addons ON public.brand_addons;
CREATE TRIGGER trg_audit_brand_addons
AFTER INSERT OR UPDATE OR DELETE ON public.brand_addons
FOR EACH ROW
EXECUTE FUNCTION public.audit_brand_change();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_projects') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_projects;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_briefs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_briefs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_tasks') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_tasks;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_agent_configs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_agent_configs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_ai_runs') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_ai_runs;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_versions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_versions;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_design_assets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_design_assets;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_feedback_cycles') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_feedback_cycles;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brand_addons') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.brand_addons;
  END IF;
END;
$$;

DROP POLICY IF EXISTS "Brand read references" ON storage.objects;
DROP POLICY IF EXISTS "Brand insert references" ON storage.objects;
DROP POLICY IF EXISTS "Brand update references" ON storage.objects;
DROP POLICY IF EXISTS "Brand delete references" ON storage.objects;
CREATE POLICY "Brand read references" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'brand-references' AND public.can_view_brand(auth.uid()));
CREATE POLICY "Brand insert references" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-references' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand update references" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-references' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand delete references" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-references' AND public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS "Brand read generated" ON storage.objects;
DROP POLICY IF EXISTS "Brand insert generated" ON storage.objects;
DROP POLICY IF EXISTS "Brand update generated" ON storage.objects;
DROP POLICY IF EXISTS "Brand delete generated" ON storage.objects;
CREATE POLICY "Brand read generated" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'brand-generated' AND public.can_view_brand(auth.uid()));
CREATE POLICY "Brand insert generated" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-generated' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand update generated" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-generated' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand delete generated" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-generated' AND public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS "Brand read final" ON storage.objects;
DROP POLICY IF EXISTS "Brand insert final" ON storage.objects;
DROP POLICY IF EXISTS "Brand update final" ON storage.objects;
DROP POLICY IF EXISTS "Brand delete final" ON storage.objects;
CREATE POLICY "Brand read final" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'brand-final' AND public.can_view_brand(auth.uid()));
CREATE POLICY "Brand insert final" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-final' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand update final" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-final' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand delete final" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-final' AND public.can_manage_brand(auth.uid()));

DROP POLICY IF EXISTS "Brand read pdf" ON storage.objects;
DROP POLICY IF EXISTS "Brand insert pdf" ON storage.objects;
DROP POLICY IF EXISTS "Brand update pdf" ON storage.objects;
DROP POLICY IF EXISTS "Brand delete pdf" ON storage.objects;
CREATE POLICY "Brand read pdf" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'brand-pdf' AND public.can_view_brand(auth.uid()));
CREATE POLICY "Brand insert pdf" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'brand-pdf' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand update pdf" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'brand-pdf' AND public.can_manage_brand(auth.uid()));
CREATE POLICY "Brand delete pdf" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'brand-pdf' AND public.can_manage_brand(auth.uid()));

WITH actions AS (
  SELECT unnest(ARRAY[
    'visualizar',
    'criar',
    'editar',
    'excluir',
    'exportar',
    'gerar_pdf',
    'baixar_pdf',
    'aprovar',
    'visualizar_segredo',
    'revogar_documento',
    'alterar_permissoes',
    'acessar_financeiro',
    'acessar_seguranca',
    'gerenciar_configuracoes',
    'ativar_addon',
    'gerenciar_provedores_ia',
    'revisar_blueprint',
    'acessar_avancado'
  ]::text[]) AS action
),
roles AS (
  SELECT unnest(ARRAY['super_admin', 'dev_admin', 'brand_admin']::text[]) AS role_name
)
INSERT INTO public.role_permissions (role_name, module, action, allowed)
SELECT r.role_name, 'brand_studio', a.action, true
FROM roles r
CROSS JOIN actions a
ON CONFLICT (role_name, module, action)
DO UPDATE SET allowed = EXCLUDED.allowed, atualizado_em = now();

WITH actions AS (
  SELECT unnest(ARRAY[
    'visualizar',
    'criar',
    'editar',
    'exportar',
    'gerar_pdf',
    'baixar_pdf',
    'gerenciar_provedores_ia',
    'revisar_blueprint'
  ]::text[]) AS action
)
INSERT INTO public.role_permissions (role_name, module, action, allowed)
SELECT 'brand_designer', 'brand_studio', action, true
FROM actions
ON CONFLICT (role_name, module, action)
DO UPDATE SET allowed = EXCLUDED.allowed, atualizado_em = now();

WITH actions AS (
  SELECT unnest(ARRAY['visualizar', 'aprovar', 'baixar_pdf', 'revisar_blueprint']::text[]) AS action
)
INSERT INTO public.role_permissions (role_name, module, action, allowed)
SELECT 'brand_reviewer', 'brand_studio', action, true
FROM actions
ON CONFLICT (role_name, module, action)
DO UPDATE SET allowed = EXCLUDED.allowed, atualizado_em = now();

WITH roles AS (
  SELECT unnest(ARRAY[
    'admin_comercial',
    'admin_operacional',
    'admin_tecnico',
    'financeiro',
    'conteudo_portfolio',
    'suporte',
    'somente_leitura'
  ]::text[]) AS role_name
)
INSERT INTO public.role_permissions (role_name, module, action, allowed)
SELECT role_name, 'brand_studio', 'visualizar', true
FROM roles
ON CONFLICT (role_name, module, action)
DO UPDATE SET allowed = EXCLUDED.allowed, atualizado_em = now();