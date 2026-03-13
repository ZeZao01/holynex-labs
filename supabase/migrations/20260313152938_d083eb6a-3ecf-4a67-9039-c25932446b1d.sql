
-- Delivered Systems table
CREATE TABLE public.delivered_systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  projeto_origem_id uuid DEFAULT NULL,
  cliente text NOT NULL DEFAULT '',
  empresa_cliente text DEFAULT '',
  categoria text DEFAULT '',
  tipo_projeto text DEFAULT '',
  nicho text DEFAULT '',
  resumo_curto text DEFAULT '',
  descricao_interna text DEFAULT '',
  thumbnail_url text DEFAULT '',
  status_suporte text DEFAULT 'sem_suporte',
  status_operacional text DEFAULT 'em_uso',
  ativo boolean DEFAULT true,
  reutilizavel boolean DEFAULT false,
  destaque_interno boolean DEFAULT false,
  potencial_reuso text DEFAULT 'baixo',
  faixa_ticket text DEFAULT '',
  valor_fechado numeric DEFAULT 0,
  recorrencia_mensal numeric DEFAULT 0,
  data_entrega timestamp with time zone DEFAULT now(),
  ultima_atualizacao timestamp with time zone DEFAULT now(),
  live_url text DEFAULT '',
  admin_url text DEFAULT '',
  staging_url text DEFAULT '',
  repo_url text DEFAULT '',
  docs_url text DEFAULT '',
  design_url text DEFAULT '',
  analytics_url text DEFAULT '',
  stack_principal text[] DEFAULT '{}',
  banco_dados text DEFAULT '',
  integracoes text[] DEFAULT '{}',
  versao_atual text DEFAULT '1.0',
  observacoes_tecnicas text DEFAULT '',
  observacoes_comerciais text DEFAULT '',
  faixa_contratada text DEFAULT '',
  criado_em timestamp with time zone DEFAULT now(),
  atualizado_em timestamp with time zone DEFAULT now()
);

ALTER TABLE public.delivered_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read delivered_systems" ON public.delivered_systems FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert delivered_systems" ON public.delivered_systems FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update delivered_systems" ON public.delivered_systems FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete delivered_systems" ON public.delivered_systems FOR DELETE TO authenticated USING (true);

-- Tags table
CREATE TABLE public.delivered_system_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.delivered_systems(id) ON DELETE CASCADE NOT NULL,
  tag text NOT NULL,
  tipo text DEFAULT 'tecnica'
);

ALTER TABLE public.delivered_system_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read delivered_system_tags" ON public.delivered_system_tags FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert delivered_system_tags" ON public.delivered_system_tags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete delivered_system_tags" ON public.delivered_system_tags FOR DELETE TO authenticated USING (true);

-- Events/History table
CREATE TABLE public.delivered_system_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_id uuid REFERENCES public.delivered_systems(id) ON DELETE CASCADE NOT NULL,
  evento text NOT NULL,
  descricao text DEFAULT '',
  criado_em timestamp with time zone DEFAULT now()
);

ALTER TABLE public.delivered_system_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read delivered_system_events" ON public.delivered_system_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert delivered_system_events" ON public.delivered_system_events FOR INSERT TO authenticated WITH CHECK (true);
