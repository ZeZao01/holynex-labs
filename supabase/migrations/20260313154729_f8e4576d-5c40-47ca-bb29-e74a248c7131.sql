
-- portfolio_items table
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delivered_system_id UUID REFERENCES public.delivered_systems(id) NULL,
  title TEXT NOT NULL,
  subtitle TEXT NULL DEFAULT '',
  short_description TEXT NULL DEFAULT '',
  commercial_description TEXT NULL DEFAULT '',
  problem_solved TEXT NULL DEFAULT '',
  target_audience TEXT NULL DEFAULT '',
  differentials TEXT[] NULL DEFAULT '{}',
  main_modules TEXT[] NULL DEFAULT '{}',
  thumbnail_url TEXT NULL DEFAULT '',
  cover_image_url TEXT NULL DEFAULT '',
  hover_image_url TEXT NULL DEFAULT '',
  gallery_urls TEXT[] NULL DEFAULT '{}',
  video_url TEXT NULL DEFAULT '',
  badges TEXT[] NULL DEFAULT '{}',
  category TEXT NULL DEFAULT '',
  niche TEXT NULL DEFAULT '',
  solution_type TEXT NULL DEFAULT '',
  investment_range TEXT NULL DEFAULT '',
  objective TEXT NULL DEFAULT '',
  item_type TEXT NULL DEFAULT 'case_real',
  cta_label TEXT NULL DEFAULT 'Quero algo parecido',
  cta_url TEXT NULL DEFAULT '',
  public_url TEXT NULL DEFAULT '',
  display_order INTEGER NULL DEFAULT 0,
  is_active BOOLEAN NULL DEFAULT true,
  is_featured BOOLEAN NULL DEFAULT false,
  is_highlighted BOOLEAN NULL DEFAULT false,
  highlight_section TEXT NULL DEFAULT '',
  client_context TEXT NULL DEFAULT '',
  customization_notes TEXT NULL DEFAULT '',
  criado_em TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  atualizado_em TIMESTAMP WITH TIME ZONE NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Public read for portfolio
CREATE POLICY "Anyone can read active portfolio_items" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert portfolio_items" ON public.portfolio_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update portfolio_items" ON public.portfolio_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete portfolio_items" ON public.portfolio_items FOR DELETE TO authenticated USING (true);

-- portfolio_item_events table
CREATE TABLE public.portfolio_item_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_item_id UUID NOT NULL REFERENCES public.portfolio_items(id) ON DELETE CASCADE,
  evento TEXT NOT NULL,
  descricao TEXT NULL DEFAULT '',
  criado_em TIMESTAMP WITH TIME ZONE NULL DEFAULT now()
);

ALTER TABLE public.portfolio_item_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read portfolio_item_events" ON public.portfolio_item_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert portfolio_item_events" ON public.portfolio_item_events FOR INSERT TO authenticated WITH CHECK (true);

-- Storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

CREATE POLICY "Anyone can read portfolio files" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Authenticated users can upload portfolio files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'portfolio');
CREATE POLICY "Authenticated users can update portfolio files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'portfolio');
CREATE POLICY "Authenticated users can delete portfolio files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'portfolio');
