-- Give the official HolyNex account its intended full-access role and replace
-- the legacy system_settings policies that trusted user-editable metadata.

DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id
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

DROP POLICY IF EXISTS "Auth read system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admin write system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admin update system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admin delete system_settings" ON public.system_settings;
DROP POLICY IF EXISTS "Admins manage system_settings" ON public.system_settings;

CREATE POLICY "Admins manage system_settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;

-- A profile owner must not be able to promote their own role_name.
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins update profiles" ON public.user_profiles;
CREATE POLICY "Admins update profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_role_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO authenticated;

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
