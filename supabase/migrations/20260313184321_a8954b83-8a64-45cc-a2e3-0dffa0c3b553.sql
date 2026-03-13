CREATE POLICY "Authenticated users can update pdf_versoes"
ON public.pdf_versoes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);