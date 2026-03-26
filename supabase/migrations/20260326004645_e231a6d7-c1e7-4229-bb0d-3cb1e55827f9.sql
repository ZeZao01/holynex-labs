
-- Insert dev_admin role assignment for the existing user
INSERT INTO public.user_role_assignments (user_id, role_name, is_active)
VALUES ('fa2b212a-eda9-4fde-a71d-414f384d4177', 'dev_admin', true)
ON CONFLICT (user_id, role_name) DO UPDATE SET is_active = true, atualizado_em = now();

-- Update profile role_name
UPDATE public.user_profiles 
SET role_name = 'dev_admin', atualizado_em = now()
WHERE user_id = 'fa2b212a-eda9-4fde-a71d-414f384d4177';

-- Insert full permissions for dev_admin (all modules, all actions)
INSERT INTO public.role_permissions (role_name, module, action, allowed)
SELECT 'dev_admin', m.module, a.action, true
FROM (VALUES ('dashboard'),('leads'),('propostas'),('projetos'),('sistemas'),('acessos'),('modulos'),('manutencao'),('portfolio'),('modelos'),('financeiro'),('ia'),('seguranca'),('configuracoes'),('addons'),('brand_studio')) AS m(module)
CROSS JOIN (VALUES ('visualizar'),('criar'),('editar'),('excluir'),('exportar'),('gerar_pdf'),('baixar_pdf'),('aprovar'),('visualizar_segredo'),('revogar_documento'),('alterar_permissoes'),('acessar_financeiro'),('acessar_seguranca'),('gerenciar_configuracoes'),('ativar_addon'),('gerenciar_provedores_ia'),('revisar_blueprint'),('acessar_avancado'),('view_brand_project'),('create_brand_project'),('edit_brand_project'),('run_brand_agent'),('approve_brand_asset'),('generate_brand_pdf'),('manage_brand_agents'),('activate_brand_addon')) AS a(action)
ON CONFLICT (role_name, module, action) DO UPDATE SET allowed = true;
