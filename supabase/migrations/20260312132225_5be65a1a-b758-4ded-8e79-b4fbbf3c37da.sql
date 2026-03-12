
CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  empresa text DEFAULT '',
  descricao text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  prioridade text DEFAULT 'media',
  resumo_ia text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit orcamento"
  ON public.orcamentos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can read orcamentos"
  ON public.orcamentos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orcamentos"
  ON public.orcamentos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete orcamentos"
  ON public.orcamentos
  FOR DELETE
  TO authenticated
  USING (true);
