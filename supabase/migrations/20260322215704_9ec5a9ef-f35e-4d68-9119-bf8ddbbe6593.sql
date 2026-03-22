
CREATE TABLE public.addon_extensions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_context text NOT NULL DEFAULT 'lead',
  source_id uuid NULL,
  name text NOT NULL DEFAULT '',
  internal_description text NOT NULL DEFAULT '',
  commercial_description text NOT NULL DEFAULT '',
  technical_impact text NOT NULL DEFAULT '',
  estimated_value numeric NOT NULL DEFAULT 0,
  dependencies text[] NOT NULL DEFAULT '{}',
  activation_flag boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'suggested',
  suggested_by text NOT NULL DEFAULT 'manual',
  niche text NOT NULL DEFAULT '',
  module_scope text[] NOT NULL DEFAULT '{}',
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  atualizado_em timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.addon_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read addon_extensions" ON public.addon_extensions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth insert addon_extensions" ON public.addon_extensions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth update addon_extensions" ON public.addon_extensions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Auth delete addon_extensions" ON public.addon_extensions
  FOR DELETE TO authenticated USING (true);
