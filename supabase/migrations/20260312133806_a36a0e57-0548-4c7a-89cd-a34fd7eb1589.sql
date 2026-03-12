CREATE TABLE public.propostas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  nome_cliente text NOT NULL,
  empresa_cliente text DEFAULT '',
  segmento text DEFAULT '',
  email_cliente text DEFAULT '',
  tipo_projeto text NOT NULL DEFAULT 'Sistema interno',
  descricao_projeto text NOT NULL,
  problema_cliente text DEFAULT '',
  objetivo_cliente text DEFAULT '',
  funcionalidades_desejadas text[] DEFAULT '{}',
  integracoes text[] DEFAULT '{}',
  numero_usuarios text DEFAULT '',
  prazo_desejado text DEFAULT '',
  orcamento_cliente text DEFAULT '',
  nivel_urgencia text DEFAULT 'medio',
  link_referencia text DEFAULT '',
  observacoes text DEFAULT '',
  proposta_json jsonb,
  proposta_texto text,
  valor_minimo numeric DEFAULT 0,
  valor_ideal numeric DEFAULT 0,
  valor_premium numeric DEFAULT 0,
  classificacao_margem text DEFAULT '',
  complexidade text DEFAULT 'media',
  status text NOT NULL DEFAULT 'rascunho',
  orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL
);

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read propostas" ON public.propostas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert propostas" ON public.propostas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update propostas" ON public.propostas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete propostas" ON public.propostas FOR DELETE TO authenticated USING (true);