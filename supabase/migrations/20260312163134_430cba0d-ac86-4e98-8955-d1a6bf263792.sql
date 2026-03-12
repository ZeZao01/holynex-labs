
-- Table to track PDF versions per proposal
CREATE TABLE public.pdf_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposta_id uuid NOT NULL REFERENCES public.propostas(id) ON DELETE CASCADE,
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  versao integer NOT NULL DEFAULT 1,
  criado_em timestamp with time zone NOT NULL DEFAULT now(),
  tamanho_bytes bigint DEFAULT 0
);

ALTER TABLE public.pdf_versoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read pdf_versoes" ON public.pdf_versoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert pdf_versoes" ON public.pdf_versoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete pdf_versoes" ON public.pdf_versoes FOR DELETE TO authenticated USING (true);

-- Storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('propostas-pdf', 'propostas-pdf', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload PDFs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'propostas-pdf');
CREATE POLICY "Anyone can download PDFs" ON storage.objects FOR SELECT USING (bucket_id = 'propostas-pdf');
CREATE POLICY "Authenticated users can delete PDFs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'propostas-pdf');
