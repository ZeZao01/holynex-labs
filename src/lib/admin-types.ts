// Admin platform global types, enums, and constants

export type ProjectStatus = "discovery" | "proposal" | "active" | "paused" | "delivered" | "maintenance" | "cancelled";
export type LeadScore = "hot" | "warm" | "cold";
export type Priority = "critical" | "high" | "medium" | "low";
export type ChangeType = "bugfix" | "improvement" | "new_module" | "integration";
export type AccessType = "admin" | "staging" | "production" | "repository";
export type BillingType = "one_time" | "monthly" | "contract";

export const PROJECT_STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  discovery: { label: "Descoberta", color: "text-sky-400" },
  proposal: { label: "Proposta", color: "text-amber-400" },
  active: { label: "Em Andamento", color: "text-emerald-400" },
  paused: { label: "Pausado", color: "text-muted-foreground" },
  delivered: { label: "Entregue", color: "text-primary" },
  maintenance: { label: "Manutenção", color: "text-blue-400" },
  cancelled: { label: "Cancelado", color: "text-destructive" },
};

export const PRIORITY_MAP: Record<Priority, { label: string; color: string }> = {
  critical: { label: "Crítica", color: "text-red-500" },
  high: { label: "Alta", color: "text-orange-400" },
  medium: { label: "Média", color: "text-yellow-400" },
  low: { label: "Baixa", color: "text-emerald-400" },
};

export const MODULE_LIST = [
  "Autenticação", "Dashboard", "CRM", "Relatórios", "PDF", "Integrações",
  "Notificações", "Financeiro", "IA", "Multiusuário", "Permissões",
  "Uploads", "Documentos", "Área do Cliente", "E-commerce", "Agendamento",
  "Chat", "Analytics", "API", "Webhooks",
] as const;

export const NICHES = [
  "SaaS", "E-commerce", "Saúde", "Educação", "Imobiliário", "Jurídico",
  "Finanças", "Logística", "Alimentação", "Beleza", "Fitness", "Varejo",
  "Indústria", "Agro", "Governo", "ONGs", "Outro",
] as const;

export interface AdminModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}

export const ADMIN_MODULES: AdminModule[] = [
  { id: "dashboard", title: "Dashboard", description: "Visão executiva da agência", icon: "LayoutDashboard", route: "/admin/dashboard" },
  { id: "leads", title: "Leads & Orçamentos", description: "Pipeline comercial", icon: "Users", route: "/admin/orcamentos" },
  { id: "proposals", title: "Propostas & PDFs", description: "Propostas comerciais e modelos", icon: "FileText", route: "/admin/propostas" },
  { id: "projects", title: "Projetos em Andamento", description: "Gestão de projetos ativos", icon: "FolderKanban", route: "/admin/projetos" },
  { id: "delivered", title: "Sistemas Entregues", description: "Catálogo de entregas", icon: "PackageCheck", route: "/admin/sistemas" },
  { id: "accesses", title: "Acessos & Admins", description: "Central de credenciais", icon: "KeyRound", route: "/admin/acessos" },
  { id: "modules", title: "Módulos por Projeto", description: "Gestão modular", icon: "Blocks", route: "/admin/modulos" },
  { id: "maintenance", title: "Alterações & Manutenção", description: "Solicitações e suporte", icon: "Wrench", route: "/admin/manutencao" },
  { id: "portfolio", title: "Portfólio Público", description: "Vitrine de projetos", icon: "Globe", route: "/admin/portfolio" },
  { id: "models", title: "Projetos Modelo", description: "Templates e modelos", icon: "LayoutTemplate", route: "/admin/modelos" },
  { id: "finance", title: "Financeiro", description: "Receitas e métricas", icon: "DollarSign", route: "/admin/financeiro" },
  { id: "security", title: "Segurança & Auditoria", description: "Logs e permissões", icon: "ShieldCheck", route: "/admin/seguranca" },
  { id: "settings", title: "Configurações", description: "Ajustes do sistema", icon: "Settings", route: "/admin/configuracoes" },
];
