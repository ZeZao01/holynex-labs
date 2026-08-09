CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.atualizado_em = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  category text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  version integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  is_sensitive boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, version)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings (key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON public.system_settings (category);
CREATE INDEX IF NOT EXISTS idx_system_settings_active ON public.system_settings (is_active);
CREATE INDEX IF NOT EXISTS idx_system_settings_key_active ON public.system_settings (key) WHERE is_active = true;

CREATE TRIGGER set_updated_at_system_settings
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read system_settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin write system_settings"
  ON public.system_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  );

CREATE POLICY "Admin update system_settings"
  ON public.system_settings
  FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  );

CREATE POLICY "Admin delete system_settings"
  ON public.system_settings
  FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('super_admin', 'dev_admin')
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'app_metadata' -> 'roles') ? 'dev_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'super_admin'
    OR (auth.jwt() -> 'user_metadata' -> 'roles') ? 'dev_admin'
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;

do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id from auth.users where email = 'admin@holynexlabs.com.br' limit 1;

  if target_user_id is null then
    raise notice 'User with email admin@holynexlabs.com.br not found in auth.users';
    return;
  end if;

  update public.user_profiles
     set role_name = 'dev_admin', atualizado_em = now()
   where user_id = target_user_id;

  insert into public.user_role_assignments (user_id, role_name, is_active)
  values (target_user_id, 'dev_admin', true)
  on conflict (user_id, role_name)
  do update set is_active = true, atualizado_em = now();

  update public.user_role_assignments
     set is_active = false, atualizado_em = now()
   where user_id = target_user_id
     and role_name <> 'dev_admin';

  insert into public.role_permissions (role_name, module, action, allowed)
  select
    'dev_admin',
    m.module,
    a.action,
    true
  from (
    values
      ('dashboard'), ('leads'), ('propostas'), ('projetos'), ('sistemas'),
      ('acessos'), ('modulos'), ('manutencao'), ('portfolio'), ('modelos'),
      ('financeiro'), ('ia'), ('seguranca'), ('configuracoes'), ('addons')
  ) as m(module)
  cross join (
    values
      ('visualizar'), ('criar'), ('editar'), ('excluir'), ('exportar'),
      ('gerar_pdf'), ('baixar_pdf'), ('aprovar'), ('visualizar_segredo'),
      ('revogar_documento'), ('alterar_permissoes'), ('acessar_financeiro'),
      ('acessar_seguranca'), ('gerenciar_configuracoes'), ('ativar_addon'),
      ('gerenciar_provedores_ia'), ('revisar_blueprint'), ('acessar_avancado')
  ) as a(action)
  on conflict (role_name, module, action)
  do update set allowed = true, atualizado_em = now();
end $$;