
-- Add new columns to project_modules
ALTER TABLE public.project_modules
  ADD COLUMN IF NOT EXISTS module_key text DEFAULT '',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS short_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS internal_description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_delivered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS reusability_type text DEFAULT 'nao',
  ADD COLUMN IF NOT EXISTS complexity_level text DEFAULT 'moderada',
  ADD COLUMN IF NOT EXISTS functional_priority text DEFAULT 'importante',
  ADD COLUMN IF NOT EXISTS depends_on_module_id uuid DEFAULT NULL;

-- Create project_module_events table
CREATE TABLE IF NOT EXISTS public.project_module_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.project_modules(id) ON DELETE CASCADE,
  evento text NOT NULL,
  descricao text DEFAULT '',
  criado_em timestamp with time zone DEFAULT now()
);

ALTER TABLE public.project_module_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth insert project_module_events" ON public.project_module_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read project_module_events" ON public.project_module_events FOR SELECT TO authenticated USING (true);
