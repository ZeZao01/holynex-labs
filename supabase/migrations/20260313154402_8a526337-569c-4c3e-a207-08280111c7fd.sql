
-- project_changes table
CREATE TABLE public.project_changes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NULL,
  delivered_system_id UUID REFERENCES public.delivered_systems(id) NULL,
  project_module_id UUID NULL,
  title TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'melhoria',
  short_description TEXT NULL DEFAULT '',
  detailed_description TEXT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'aberta',
  priority TEXT NOT NULL DEFAULT 'media',
  urgency TEXT NOT NULL DEFAULT 'sem_urgencia',
  request_origin TEXT NULL DEFAULT 'cliente',
  requested_by_name TEXT NULL DEFAULT '',
  assigned_to_name TEXT NULL DEFAULT '',
  estimated_hours NUMERIC NULL DEFAULT 0,
  estimated_cost NUMERIC NULL DEFAULT 0,
  billing_mode TEXT NULL DEFAULT 'avulso_nao_orcado',
  is_included_in_contract BOOLEAN NULL DEFAULT false,
  needs_approval BOOLEAN NULL DEFAULT false,
  approved_at TIMESTAMP WITH TIME ZONE NULL,
  approved_by TEXT NULL DEFAULT '',
  approval_notes TEXT NULL DEFAULT '',
  requested_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  desired_deadline TIMESTAMP WITH TIME ZONE NULL,
  planned_date TIMESTAMP WITH TIME ZONE NULL,
  completed_at TIMESTAMP WITH TIME ZONE NULL,
  internal_notes TEXT NULL DEFAULT '',
  commercial_notes TEXT NULL DEFAULT '',
  opportunity_tag TEXT NULL DEFAULT '',
  criado_em TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NULL DEFAULT now()
);

ALTER TABLE public.project_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_changes" ON public.project_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert project_changes" ON public.project_changes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update project_changes" ON public.project_changes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete project_changes" ON public.project_changes FOR DELETE TO authenticated USING (true);

-- project_change_events table
CREATE TABLE public.project_change_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  change_id UUID NOT NULL REFERENCES public.project_changes(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  descricao TEXT NULL DEFAULT '',
  criado_em TIMESTAMP WITH TIME ZONE NULL DEFAULT now()
);

ALTER TABLE public.project_change_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_change_events" ON public.project_change_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert project_change_events" ON public.project_change_events FOR INSERT TO authenticated WITH CHECK (true);
