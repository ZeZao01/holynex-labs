
ALTER TABLE public.propostas
  ADD COLUMN IF NOT EXISTS structured_content jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pricing_sheet jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS document_spec jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stitch_prompt text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS hidden_addons jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_metadata jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portfolio_refs jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS pdf_blueprint jsonb DEFAULT NULL;
