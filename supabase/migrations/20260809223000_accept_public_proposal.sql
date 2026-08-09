CREATE OR REPLACE FUNCTION public.accept_public_proposal(p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected_rows integer;
BEGIN
  IF p_token IS NULL OR length(p_token) < 16 THEN
    RETURN false;
  END IF;

  UPDATE public.propostas
  SET status = 'aceita', atualizado_em = now()
  WHERE public_token = p_token
    AND is_public = true
    AND status NOT IN ('aceita', 'recusada');

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 1 THEN
    RETURN true;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.propostas
    WHERE public_token = p_token
      AND is_public = true
      AND status = 'aceita'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.accept_public_proposal(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_public_proposal(text) TO anon, authenticated;
