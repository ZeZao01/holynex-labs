
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS slug text DEFAULT '',
  ADD COLUMN IF NOT EXISTS system_url text DEFAULT '',
  ADD COLUMN IF NOT EXISTS preview_mode text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS open_mode text DEFAULT 'new_tab',
  ADD COLUMN IF NOT EXISTS allow_public_preview boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS full_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tech_stack text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS features text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft';
