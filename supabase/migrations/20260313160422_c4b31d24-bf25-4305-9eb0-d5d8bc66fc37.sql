CREATE TABLE IF NOT EXISTS public.project_model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_item_id uuid REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  delivered_system_id uuid REFERENCES public.delivered_systems(id) ON DELETE SET NULL,
  model_name text NOT NULL DEFAULT '',
  visualizacoes integer NOT NULL DEFAULT 0,
  cliques integer NOT NULL DEFAULT 0,
  leads_gerados integer NOT NULL DEFAULT 0,
  versao_mais_procurada text DEFAULT '',
  demand_score numeric NOT NULL DEFAULT 0,
  opportunity_score numeric NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(portfolio_item_id)
);

ALTER TABLE public.project_model_performance_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_model_performance_metrics'
      AND policyname = 'Authenticated users can read project_model_performance_metrics'
  ) THEN
    CREATE POLICY "Authenticated users can read project_model_performance_metrics"
    ON public.project_model_performance_metrics
    FOR SELECT
    TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_model_performance_metrics'
      AND policyname = 'Authenticated users can insert project_model_performance_metrics'
  ) THEN
    CREATE POLICY "Authenticated users can insert project_model_performance_metrics"
    ON public.project_model_performance_metrics
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_model_performance_metrics'
      AND policyname = 'Authenticated users can update project_model_performance_metrics'
  ) THEN
    CREATE POLICY "Authenticated users can update project_model_performance_metrics"
    ON public.project_model_performance_metrics
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'project_model_performance_metrics'
      AND policyname = 'Authenticated users can delete project_model_performance_metrics'
  ) THEN
    CREATE POLICY "Authenticated users can delete project_model_performance_metrics"
    ON public.project_model_performance_metrics
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);
  END IF;
END $$;