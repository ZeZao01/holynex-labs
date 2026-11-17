-- Aplicada pelo conector em 17/11/2026 (pós-migração da Lovable): avisos do linter de segurança.
ALTER FUNCTION public.set_updated_at() SET search_path = '';
ALTER FUNCTION public.set_updated_at_brand_domain() SET search_path = '';
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_brand_change() FROM anon, authenticated, public;
