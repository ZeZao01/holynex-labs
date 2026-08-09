-- Repair the admin bootstrap after the production account was created and
-- restore the helper permissions required by RLS policies and the web client.

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    _user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.user_role_assignments
      WHERE user_id = _user_id
        AND is_active = true
        AND role_name IN ('super_admin', 'dev_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_role_names(_user_id uuid)
RETURNS text[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id <> (SELECT auth.uid()) THEN ARRAY['somente_leitura']::text[]
    ELSE COALESCE(
      (
        SELECT array_agg(role_name ORDER BY role_name)
        FROM public.user_role_assignments
        WHERE user_id = _user_id
          AND is_active = true
      ),
      ARRAY['somente_leitura']::text[]
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role_names(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_names(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  assigned_role text;
BEGIN
  assigned_role := CASE
    WHEN lower(COALESCE(NEW.email, '')) = 'admin@holynexlabs.com.br' THEN 'dev_admin'
    WHEN (SELECT count(*) FROM public.user_role_assignments) = 0 THEN 'super_admin'
    ELSE 'somente_leitura'
  END;

  INSERT INTO public.user_profiles (user_id, email, full_name, role_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    assigned_role
  )
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = CASE
        WHEN EXCLUDED.full_name <> '' THEN EXCLUDED.full_name
        ELSE public.user_profiles.full_name
      END,
      role_name = CASE
        WHEN assigned_role IN ('dev_admin', 'super_admin') THEN assigned_role
        ELSE public.user_profiles.role_name
      END,
      atualizado_em = now();

  INSERT INTO public.user_role_assignments (user_id, role_name, is_active)
  VALUES (NEW.id, assigned_role, true)
  ON CONFLICT (user_id, role_name)
  DO UPDATE SET is_active = true, atualizado_em = now();

  IF assigned_role IN ('dev_admin', 'super_admin') THEN
    UPDATE public.user_role_assignments
    SET is_active = false, atualizado_em = now()
    WHERE user_id = NEW.id
      AND role_name <> assigned_role;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE lower(email) = 'admin@holynexlabs.com.br'
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'HolyNex admin account is not present yet';
    RETURN;
  END IF;

  INSERT INTO public.user_profiles (user_id, email, full_name, role_name)
  SELECT id, COALESCE(email, ''), COALESCE(raw_user_meta_data ->> 'full_name', ''), 'dev_admin'
  FROM auth.users
  WHERE id = target_user_id
  ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      role_name = 'dev_admin',
      atualizado_em = now();

  INSERT INTO public.user_role_assignments (user_id, role_name, is_active)
  VALUES (target_user_id, 'dev_admin', true)
  ON CONFLICT (user_id, role_name)
  DO UPDATE SET is_active = true, atualizado_em = now();

  UPDATE public.user_role_assignments
  SET is_active = false, atualizado_em = now()
  WHERE user_id = target_user_id
    AND role_name <> 'dev_admin';
END $$;

INSERT INTO public.role_permissions (role_name, module, action, allowed)
SELECT 'dev_admin', module_name, action_name, true
FROM unnest(ARRAY[
  'dashboard', 'leads', 'propostas', 'projetos', 'sistemas', 'acessos',
  'modulos', 'manutencao', 'portfolio', 'modelos', 'financeiro', 'ia',
  'seguranca', 'configuracoes', 'addons', 'brand_studio', 'qg'
]) AS modules(module_name)
CROSS JOIN unnest(ARRAY[
  'visualizar', 'criar', 'editar', 'excluir', 'exportar', 'gerar_pdf',
  'baixar_pdf', 'aprovar', 'visualizar_segredo', 'revogar_documento',
  'alterar_permissoes', 'acessar_financeiro', 'acessar_seguranca',
  'gerenciar_configuracoes', 'ativar_addon', 'gerenciar_provedores_ia',
  'revisar_blueprint', 'acessar_avancado', 'view_brand_project',
  'create_brand_project', 'edit_brand_project', 'run_brand_agent',
  'approve_brand_asset', 'generate_brand_pdf', 'manage_brand_agents',
  'activate_brand_addon'
]) AS actions(action_name)
ON CONFLICT (role_name, module, action)
DO UPDATE SET allowed = true, atualizado_em = now();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivered_systems TO authenticated;
GRANT SELECT ON public.user_profiles, public.user_role_assignments, public.role_permissions TO authenticated;
