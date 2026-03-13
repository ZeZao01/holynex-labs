
-- Projects table (Projetos em Andamento)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cliente text NOT NULL DEFAULT '',
  empresa_cliente text DEFAULT '',
  descricao text DEFAULT '',
  tipo_projeto text DEFAULT 'Sistema interno',
  nicho text DEFAULT '',
  status text NOT NULL DEFAULT 'planejamento',
  prioridade text NOT NULL DEFAULT 'media',
  responsavel text DEFAULT '',
  proposta_id uuid REFERENCES public.propostas(id) ON DELETE SET NULL,
  delivered_system_id uuid REFERENCES public.delivered_systems(id) ON DELETE SET NULL,
  data_inicio timestamp with time zone DEFAULT now(),
  data_previsao timestamp with time zone DEFAULT NULL,
  data_conclusao timestamp with time zone DEFAULT NULL,
  valor_contrato numeric DEFAULT 0,
  recorrencia_mensal numeric DEFAULT 0,
  progresso integer DEFAULT 0,
  observacoes text DEFAULT '',
  stack text[] DEFAULT '{}',
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update projects" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete projects" ON public.projects FOR DELETE TO authenticated USING (true);

-- Project Modules table
CREATE TABLE IF NOT EXISTS public.project_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text DEFAULT '',
  status text NOT NULL DEFAULT 'planejado',
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  delivered_system_id uuid REFERENCES public.delivered_systems(id) ON DELETE SET NULL,
  tipo text DEFAULT 'funcionalidade',
  prioridade text DEFAULT 'media',
  responsavel text DEFAULT '',
  progresso integer DEFAULT 0,
  observacoes text DEFAULT '',
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read project_modules" ON public.project_modules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert project_modules" ON public.project_modules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update project_modules" ON public.project_modules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete project_modules" ON public.project_modules FOR DELETE TO authenticated USING (true);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid DEFAULT NULL,
  user_email text DEFAULT '',
  action text NOT NULL,
  entity_type text NOT NULL DEFAULT '',
  entity_id text DEFAULT '',
  details jsonb DEFAULT '{}',
  ip_address text DEFAULT '',
  criado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read audit_logs" ON public.audit_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert audit_logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);
