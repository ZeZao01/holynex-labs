
-- Project Models table
CREATE TABLE public.project_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text DEFAULT '',
  slug text UNIQUE,
  category text DEFAULT '',
  niche text DEFAULT '',
  value_proposition text DEFAULT '',
  target_audience text DEFAULT '',
  problem_solved text DEFAULT '',
  commercial_description text DEFAULT '',
  investment_range text DEFAULT '',
  base_deadline text DEFAULT '',
  availability_status text DEFAULT 'disponivel',
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  cta_primary_label text DEFAULT 'Quero esse modelo',
  cta_primary_url text DEFAULT '',
  cta_secondary_label text DEFAULT 'Solicitar orçamento',
  cta_secondary_url text DEFAULT '',
  thumbnail_url text DEFAULT '',
  cover_image_url text DEFAULT '',
  gallery_urls text[] DEFAULT '{}',
  video_url text DEFAULT '',
  badges text[] DEFAULT '{}',
  how_it_works text DEFAULT '',
  display_order integer DEFAULT 0,
  delivered_system_id uuid REFERENCES public.delivered_systems(id),
  portfolio_item_id uuid REFERENCES public.portfolio_items(id),
  criado_em timestamptz DEFAULT now(),
  atualizado_em timestamptz DEFAULT now()
);

ALTER TABLE public.project_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active project_models" ON public.project_models FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert project_models" ON public.project_models FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update project_models" ON public.project_models FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete project_models" ON public.project_models FOR DELETE TO authenticated USING (true);

-- Project Model Tiers
CREATE TABLE public.project_model_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.project_models(id) ON DELETE CASCADE,
  tier_type text NOT NULL DEFAULT 'growth',
  name text NOT NULL,
  description text DEFAULT '',
  price_range text DEFAULT '',
  estimated_days integer DEFAULT 0,
  ideal_client_profile text DEFAULT '',
  is_recommended boolean DEFAULT false,
  display_order integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.project_model_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read project_model_tiers" ON public.project_model_tiers FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert project_model_tiers" ON public.project_model_tiers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update project_model_tiers" ON public.project_model_tiers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete project_model_tiers" ON public.project_model_tiers FOR DELETE TO authenticated USING (true);

-- Project Model Modules
CREATE TABLE public.project_model_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.project_models(id) ON DELETE CASCADE,
  tier_id uuid REFERENCES public.project_model_tiers(id) ON DELETE SET NULL,
  name text NOT NULL,
  category text DEFAULT 'core',
  is_required boolean DEFAULT true,
  scope_in_tier text DEFAULT 'included',
  notes text DEFAULT '',
  display_order integer DEFAULT 0,
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.project_model_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read project_model_modules" ON public.project_model_modules FOR SELECT TO public USING (true);
CREATE POLICY "Auth insert project_model_modules" ON public.project_model_modules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update project_model_modules" ON public.project_model_modules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete project_model_modules" ON public.project_model_modules FOR DELETE TO authenticated USING (true);

-- Project Model Events
CREATE TABLE public.project_model_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES public.project_models(id) ON DELETE CASCADE,
  evento text NOT NULL,
  descricao text DEFAULT '',
  criado_em timestamptz DEFAULT now()
);

ALTER TABLE public.project_model_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth insert project_model_events" ON public.project_model_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth read project_model_events" ON public.project_model_events FOR SELECT TO authenticated USING (true);
