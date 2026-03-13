
ALTER TABLE public.propostas
ADD COLUMN IF NOT EXISTS proposal_tiers jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS proposal_addons jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommended_tier text DEFAULT '',
ADD COLUMN IF NOT EXISTS commercial_notes jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS proposal_validity text DEFAULT '30 dias',
ADD COLUMN IF NOT EXISTS is_phased boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS closing_strategy text DEFAULT '';
