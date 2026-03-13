
-- Project Accesses table
CREATE TABLE public.project_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid DEFAULT NULL,
  delivered_system_id uuid REFERENCES public.delivered_systems(id) ON DELETE SET NULL DEFAULT NULL,
  access_type text NOT NULL DEFAULT 'admin_principal',
  friendly_name text NOT NULL DEFAULT '',
  environment text DEFAULT 'producao',
  provider_name text DEFAULT '',
  access_url text DEFAULT '',
  username text DEFAULT '',
  secret_masked text DEFAULT '',
  secret_reference text DEFAULT '',
  status text DEFAULT 'ativo',
  notes text DEFAULT '',
  owner_name text DEFAULT '',
  last_verified_at timestamp with time zone DEFAULT NULL,
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

ALTER TABLE public.project_accesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_accesses" ON public.project_accesses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert project_accesses" ON public.project_accesses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update project_accesses" ON public.project_accesses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete project_accesses" ON public.project_accesses FOR DELETE TO authenticated USING (true);

-- Access Events table
CREATE TABLE public.project_access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id uuid REFERENCES public.project_accesses(id) ON DELETE CASCADE NOT NULL,
  evento text NOT NULL,
  descricao text DEFAULT '',
  criado_em timestamp with time zone DEFAULT now()
);

ALTER TABLE public.project_access_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_access_events" ON public.project_access_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert project_access_events" ON public.project_access_events FOR INSERT TO authenticated WITH CHECK (true);
