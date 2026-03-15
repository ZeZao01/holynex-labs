-- Add public sharing token to propostas
ALTER TABLE public.propostas 
ADD COLUMN IF NOT EXISTS public_token text UNIQUE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_propostas_public_token ON public.propostas(public_token) WHERE public_token IS NOT NULL;

-- Allow anonymous read access for public proposals by token
CREATE POLICY "Anyone can read public proposals by token"
ON public.propostas
FOR SELECT
TO anon
USING (is_public = true AND public_token IS NOT NULL);