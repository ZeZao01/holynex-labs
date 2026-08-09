export const ADMIN_MENU_ROUTES = [
  "/admin/dashboard", "/admin/qg", "/admin/orcamentos", "/admin/propostas",
  "/admin/projetos", "/admin/sistemas", "/admin/acessos", "/admin/modulos",
  "/admin/manutencao", "/admin/portfolio-admin", "/admin/modelos", "/admin/financeiro",
  "/admin/ia", "/admin/brand-studio", "/admin/seguranca", "/admin/configuracoes",
] as const;

export const ADMIN_UTILITY_ROUTES = [
  "/admin/propostas/nova", "/admin/addons",
] as const;

export const ADMIN_SECONDARY_ROUTES = [
  "/admin/brand-studio/projetos", "/admin/brand-studio/briefings",
  "/admin/brand-studio/prompts", "/admin/brand-studio/apresentacoes",
  "/admin/brand-studio/assets", "/admin/brand-studio/configuracoes",
] as const;

export const ADMIN_ROUTE_LABELS: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/orcamentos": "Leads & Orçamentos",
  "/admin/propostas": "Propostas",
  "/admin/propostas/nova": "Nova Proposta",
  "/admin/projetos": "Projetos",
  "/admin/sistemas": "Sistemas Entregues",
  "/admin/acessos": "Acessos & Credenciais",
  "/admin/modulos": "Módulos",
  "/admin/manutencao": "Manutenção",
  "/admin/portfolio-admin": "Portfólio Público",
  "/admin/modelos": "Projetos Modelo",
  "/admin/financeiro": "Financeiro",
  "/admin/ia": "IA Assistiva",
  "/admin/brand-studio": "Brand Studio AI",
  "/admin/brand-studio/projetos": "Brand Studio · Projetos",
  "/admin/brand-studio/briefings": "Brand Studio · Briefings",
  "/admin/brand-studio/prompts": "Brand Studio · Prompts",
  "/admin/brand-studio/apresentacoes": "Brand Studio · Apresentações",
  "/admin/brand-studio/assets": "Brand Studio · Assets",
  "/admin/brand-studio/configuracoes": "Brand Studio · Configurações",
  "/admin/qg": "QG Agência",
  "/admin/seguranca": "Segurança & Auditoria",
  "/admin/addons": "Add-ons Ocultos",
  "/admin/configuracoes": "Configurações",
};

export function getAdminRouteLabel(pathname: string): string {
  if (ADMIN_ROUTE_LABELS[pathname]) return ADMIN_ROUTE_LABELS[pathname];
  if (pathname.startsWith("/admin/brand-studio/projetos/")) return "Brand Studio · Projeto";
  if (pathname.startsWith("/admin/orcamentos/")) return "Detalhe do Lead";
  if (pathname.startsWith("/admin/propostas/")) return "Detalhe da Proposta";
  if (pathname.startsWith("/admin/projetos/")) return "Detalhe do Projeto";
  if (pathname.startsWith("/admin/sistemas/")) return "Detalhe do Sistema";
  return "Painel";
}
