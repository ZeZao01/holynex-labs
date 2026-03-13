
-- Add new columns to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT '',
  ADD COLUMN IF NOT EXISTS faixa_contratada text DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_comercial text DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_produto text DEFAULT '',
  ADD COLUMN IF NOT EXISTS responsavel_tecnico text DEFAULT '',
  ADD COLUMN IF NOT EXISTS resumo_executivo text DEFAULT '',
  ADD COLUMN IF NOT EXISTS descricao_interna text DEFAULT '',
  ADD COLUMN IF NOT EXISTS estrategia_comercial_origem text DEFAULT '',
  ADD COLUMN IF NOT EXISTS live_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS admin_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS staging_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS repo_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS docs_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS design_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS analytics_url text DEFAULT '';

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text DEFAULT '',
  status text NOT NULL DEFAULT 'pendente',
  data_prevista timestamp with time zone,
  data_concluida timestamp with time zone,
  observacoes text DEFAULT '',
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read project_milestones" ON public.project_milestones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert project_milestones" ON public.project_milestones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update project_milestones" ON public.project_milestones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete project_milestones" ON public.project_milestones FOR DELETE TO authenticated USING (true);

-- Create project_events table
CREATE TABLE IF NOT EXISTS public.project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  evento text NOT NULL,
  descricao text DEFAULT '',
  criado_em timestamp with time zone DEFAULT now()
);

ALTER TABLE public.project_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read project_events" ON public.project_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert project_events" ON public.project_events FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_milestones;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_events;
