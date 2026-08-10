ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS telefone text DEFAULT '',
  ADD COLUMN IF NOT EXISTS endereco text DEFAULT '',
  ADD COLUMN IF NOT EXISTS cidade text DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_place_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS google_maps_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS avaliacao_google numeric(2,1),
  ADD COLUMN IF NOT EXISTS total_avaliacoes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status_negocio_google text DEFAULT '',
  ADD COLUMN IF NOT EXISTS horario_funcionamento text DEFAULT '',
  ADD COLUMN IF NOT EXISTS score_prospeccao integer,
  ADD COLUMN IF NOT EXISTS motivos_score text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS oferta_prospeccao text DEFAULT '',
  ADD COLUMN IF NOT EXISTS projeto_sugerido text DEFAULT '',
  ADD COLUMN IF NOT EXISTS resumo_projeto_sugerido text DEFAULT '',
  ADD COLUMN IF NOT EXISTS mensagem_prospeccao text DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS orcamentos_google_place_id_unique
  ON public.orcamentos (google_place_id)
  WHERE google_place_id IS NOT NULL AND google_place_id <> '';
