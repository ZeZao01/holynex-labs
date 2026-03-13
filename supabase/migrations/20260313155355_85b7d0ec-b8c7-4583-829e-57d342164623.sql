
-- Project profitability metrics
CREATE TABLE public.project_profitability_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivered_system_id uuid REFERENCES public.delivered_systems(id) ON DELETE CASCADE,
  receita_setup numeric DEFAULT 0,
  receita_recorrente numeric DEFAULT 0,
  receita_manutencao numeric DEFAULT 0,
  receita_total numeric DEFAULT 0,
  custo_entrega numeric DEFAULT 0,
  custo_suporte numeric DEFAULT 0,
  margem_estimada numeric DEFAULT 0,
  profitability_score numeric DEFAULT 0,
  demand_score numeric DEFAULT 0,
  recurrence_score numeric DEFAULT 0,
  reuse_score numeric DEFAULT 0,
  opportunity_score numeric DEFAULT 0,
  flags text[] DEFAULT '{}',
  override_manual boolean DEFAULT false,
  notas text DEFAULT '',
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(delivered_system_id)
);

ALTER TABLE public.project_profitability_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read project_profitability_metrics" ON public.project_profitability_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert project_profitability_metrics" ON public.project_profitability_metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update project_profitability_metrics" ON public.project_profitability_metrics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete project_profitability_metrics" ON public.project_profitability_metrics FOR DELETE TO authenticated USING (true);

-- Portfolio performance metrics
CREATE TABLE public.portfolio_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  visualizacoes integer DEFAULT 0,
  cliques integer DEFAULT 0,
  ctas_acionados integer DEFAULT 0,
  conversoes_lead integer DEFAULT 0,
  demand_score numeric DEFAULT 0,
  opportunity_score numeric DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now(),
  UNIQUE(portfolio_item_id)
);

ALTER TABLE public.portfolio_performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read portfolio_performance_metrics" ON public.portfolio_performance_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert portfolio_performance_metrics" ON public.portfolio_performance_metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update portfolio_performance_metrics" ON public.portfolio_performance_metrics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Niche metrics (aggregated view)
CREATE TABLE public.niche_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho text NOT NULL UNIQUE,
  qtd_leads integer DEFAULT 0,
  qtd_propostas integer DEFAULT 0,
  qtd_projetos integer DEFAULT 0,
  ticket_medio numeric DEFAULT 0,
  margem_media numeric DEFAULT 0,
  recorrencia_media numeric DEFAULT 0,
  demand_score numeric DEFAULT 0,
  opportunity_score numeric DEFAULT 0,
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE public.niche_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read niche_metrics" ON public.niche_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert niche_metrics" ON public.niche_metrics FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update niche_metrics" ON public.niche_metrics FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete niche_metrics" ON public.niche_metrics FOR DELETE TO authenticated USING (true);
