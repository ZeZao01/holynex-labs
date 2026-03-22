-- Ensure admin@holynexlabs.com.br is dev_admin with full permissions

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
