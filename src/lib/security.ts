import { supabase } from "@/integrations/supabase/client";

// ── RBAC Roles & Permissions ──────────────────────────────────────────

export const ROLES = [
  "super_admin",
  "dev_admin",
  "brand_admin",
  "brand_designer",
  "brand_reviewer",
  "admin_comercial",
  "admin_operacional",
  "admin_tecnico",
  "financeiro",
  "conteudo_portfolio",
  "suporte",
  "somente_leitura",
] as const;

export type RoleName = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  dev_admin: "Dev Admin",
  brand_admin: "Brand Admin",
  brand_designer: "Brand Designer",
  brand_reviewer: "Brand Reviewer",
  admin_comercial: "Admin Comercial",
  admin_operacional: "Admin Operacional",
  admin_tecnico: "Admin Técnico",
  financeiro: "Financeiro",
  conteudo_portfolio: "Conteúdo/Portfólio",
  suporte: "Suporte",
  somente_leitura: "Somente Leitura",
};

export const MODULES = [
  "dashboard", "leads", "propostas", "projetos", "sistemas",
  "acessos", "modulos", "manutencao", "portfolio", "modelos",
  "financeiro", "ia", "seguranca", "configuracoes", "addons", "brand_studio",
] as const;

export const MODULE_LABELS: Record<string, string> = {
  dashboard: "Dashboard", leads: "Leads & Orçamentos", propostas: "Propostas",
  projetos: "Projetos", sistemas: "Sistemas Entregues", acessos: "Acessos",
  modulos: "Módulos", manutencao: "Manutenção", portfolio: "Portfólio",
  modelos: "Projetos Modelo", financeiro: "Financeiro", ia: "IA Assistiva",
  seguranca: "Segurança", configuracoes: "Configurações", addons: "Add-ons Ocultos",
  brand_studio: "Brand Studio AI",
};

export const ACTIONS = [
  "visualizar", "criar", "editar", "excluir", "exportar",
  "gerar_pdf", "baixar_pdf", "aprovar", "visualizar_segredo", "revogar_documento",
  "alterar_permissoes", "acessar_financeiro", "acessar_seguranca",
  "gerenciar_configuracoes", "ativar_addon", "gerenciar_provedores_ia",
  "revisar_blueprint", "acessar_avancado",
  "view_brand_project", "create_brand_project", "edit_brand_project",
  "run_brand_agent", "approve_brand_asset", "generate_brand_pdf",
  "manage_brand_agents", "activate_brand_addon",
] as const;

export const ACTION_LABELS: Record<string, string> = {
  visualizar: "Visualizar", criar: "Criar", editar: "Editar", excluir: "Excluir",
  exportar: "Exportar", gerar_pdf: "Gerar PDF", baixar_pdf: "Baixar PDF",
  aprovar: "Aprovar", visualizar_segredo: "Ver Segredo", revogar_documento: "Revogar Doc",
  alterar_permissoes: "Alterar Permissões", acessar_financeiro: "Acessar Financeiro",
  acessar_seguranca: "Acessar Segurança", gerenciar_configuracoes: "Config. Sistema",
  ativar_addon: "Ativar Add-on", gerenciar_provedores_ia: "Gerenciar IA",
  revisar_blueprint: "Revisar Blueprint", acessar_avancado: "Acesso Avançado",
  view_brand_project: "Ver Projeto Brand",
  create_brand_project: "Criar Projeto Brand",
  edit_brand_project: "Editar Projeto Brand",
  run_brand_agent: "Executar Agente Brand",
  approve_brand_asset: "Aprovar Asset Brand",
  generate_brand_pdf: "Gerar PDF Brand",
  manage_brand_agents: "Gerenciar Agentes Brand",
  activate_brand_addon: "Ativar Add-on Brand",
};

// Default permissions matrix
export const DEFAULT_PERMISSIONS: Record<string, Record<string, string[]>> = {
  super_admin: Object.fromEntries(MODULES.map(m => [m, [...ACTIONS]])),
  dev_admin: Object.fromEntries(MODULES.map(m => [m, [
    "visualizar", "criar", "editar", "excluir", "exportar",
    "gerar_pdf", "baixar_pdf", "aprovar", "visualizar_segredo",
    "acessar_financeiro", "acessar_seguranca", "gerenciar_configuracoes",
    "ativar_addon", "gerenciar_provedores_ia", "revisar_blueprint", "acessar_avancado",
    "view_brand_project", "create_brand_project", "edit_brand_project",
    "run_brand_agent", "approve_brand_asset", "generate_brand_pdf",
    "manage_brand_agents", "activate_brand_addon",
  ]])),
  brand_admin: {
    brand_studio: [
      "visualizar", "criar", "editar", "excluir", "exportar",
      "gerar_pdf", "baixar_pdf", "aprovar", "gerenciar_provedores_ia", "revisar_blueprint",
      "view_brand_project", "create_brand_project", "edit_brand_project",
      "run_brand_agent", "approve_brand_asset", "generate_brand_pdf",
      "manage_brand_agents", "activate_brand_addon",
    ],
    dashboard: ["visualizar"],
  },
  brand_designer: {
    brand_studio: [
      "visualizar", "criar", "editar", "exportar",
      "gerar_pdf", "baixar_pdf", "revisar_blueprint",
      "view_brand_project", "edit_brand_project", "run_brand_agent", "generate_brand_pdf",
    ],
    dashboard: ["visualizar"],
  },
  brand_reviewer: {
    brand_studio: [
      "visualizar", "aprovar", "baixar_pdf", "revisar_blueprint",
      "view_brand_project", "approve_brand_asset", "generate_brand_pdf",
    ],
    dashboard: ["visualizar"],
  },
  admin_comercial: {
    dashboard: ["visualizar"], leads: ["visualizar", "criar", "editar", "excluir", "exportar"],
    propostas: ["visualizar", "criar", "editar", "excluir", "gerar_pdf", "baixar_pdf", "aprovar"],
    projetos: ["visualizar"], portfolio: ["visualizar", "criar", "editar"],
    modelos: ["visualizar", "criar", "editar"], financeiro: ["visualizar", "acessar_financeiro"],
    ia: ["visualizar"], brand_studio: ["visualizar", "view_brand_project"],
  },
  admin_operacional: {
    dashboard: ["visualizar"], projetos: ["visualizar", "criar", "editar"],
    sistemas: ["visualizar", "criar", "editar"], modulos: ["visualizar", "criar", "editar"],
    manutencao: ["visualizar", "criar", "editar"], acessos: ["visualizar"],
    ia: ["visualizar"],
  },
  admin_tecnico: {
    dashboard: ["visualizar"], projetos: ["visualizar", "editar"],
    sistemas: ["visualizar", "editar"], modulos: ["visualizar", "criar", "editar", "excluir"],
    manutencao: ["visualizar", "criar", "editar"], acessos: ["visualizar", "criar", "editar", "visualizar_segredo"],
    ia: ["visualizar", "aprovar"],
  },
  financeiro: {
    dashboard: ["visualizar"], financeiro: ["visualizar", "acessar_financeiro", "exportar"],
    propostas: ["visualizar"], projetos: ["visualizar"],
  },
  conteudo_portfolio: {
    dashboard: ["visualizar"], portfolio: ["visualizar", "criar", "editar", "excluir"],
    modelos: ["visualizar", "criar", "editar"], ia: ["visualizar"],
  },
  suporte: {
    dashboard: ["visualizar"], manutencao: ["visualizar", "criar", "editar"],
    projetos: ["visualizar"], sistemas: ["visualizar"], modulos: ["visualizar"],
  },
  somente_leitura: Object.fromEntries(MODULES.map(m => [m, ["visualizar"]])),
};

// Critical actions requiring confirmation
export const CRITICAL_ACTIONS = [
  "visualizar_segredo", "excluir", "revogar_documento",
  "exportar", "alterar_permissoes", "ativar_addon",
];

// ── Types ─────────────────────────────────────────────────────────────

export interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  description: string;
  source: string | null;
  user_id: string | null;
  user_email: string | null;
  ip_address: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: any;
  criado_em: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  source: string | null;
  event_id: string | null;
  assigned_to: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface SecurityIncident {
  id: string;
  title: string;
  incident_type: string;
  severity: string;
  description: string;
  source: string | null;
  status: string;
  containment_action: string | null;
  corrective_action: string | null;
  responsible: string | null;
  alert_id: string | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
  resolved_at: string | null;
}

export interface RolePermission {
  id: string;
  role_name: string;
  module: string;
  action: string;
  allowed: boolean;
  criado_em: string;
  atualizado_em: string;
}

// ── Severity/Status labels ────────────────────────────────────────────

export const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  info: { label: "Info", color: "bg-muted text-muted-foreground" },
  low: { label: "Baixa", color: "bg-primary/10 text-primary" },
  medium: { label: "Média", color: "bg-secondary text-secondary-foreground" },
  high: { label: "Alta", color: "bg-destructive/20 text-destructive" },
  critical: { label: "Crítica", color: "bg-destructive text-destructive-foreground" },
};

export const ALERT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  novo: { label: "Novo", color: "bg-primary/15 text-primary" },
  em_revisao: { label: "Em Revisão", color: "bg-secondary text-secondary-foreground" },
  confirmado: { label: "Confirmado", color: "bg-destructive/20 text-destructive" },
  descartado: { label: "Descartado", color: "bg-muted text-muted-foreground" },
  resolvido: { label: "Resolvido", color: "bg-primary/10 text-primary" },
};

export const INCIDENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "bg-destructive/20 text-destructive" },
  em_investigacao: { label: "Investigando", color: "bg-secondary text-secondary-foreground" },
  contido: { label: "Contido", color: "bg-accent text-accent-foreground" },
  resolvido: { label: "Resolvido", color: "bg-primary/10 text-primary" },
  encerrado: { label: "Encerrado", color: "bg-muted text-muted-foreground" },
};

// ── CRUD functions ────────────────────────────────────────────────────

export async function logSecurityEvent(
  eventType: string, severity: string, description: string,
  opts: { source?: string; entityType?: string; entityId?: string; metadata?: any } = {}
) {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("security_events" as any).insert({
    event_type: eventType, severity, description,
    source: opts.source || "", user_id: user?.id || null,
    user_email: user?.email || "", entity_type: opts.entityType || "",
    entity_id: opts.entityId || "", metadata: opts.metadata || {},
  });
}

export async function getSecurityEvents(limit = 100) {
  const { data, error } = await supabase
    .from("security_events" as any).select("*")
    .order("criado_em", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as unknown as SecurityEvent[];
}

export async function getSecurityAlerts() {
  const { data, error } = await supabase
    .from("security_alerts" as any).select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as SecurityAlert[];
}

export async function updateAlertStatus(id: string, status: string, notas?: string) {
  const { data: { user } } = await supabase.auth.getUser();
  const update: any = { status, atualizado_em: new Date().toISOString() };
  if (status === "resolvido" || status === "descartado") {
    update.resolved_by = user?.email || "";
    update.resolved_at = new Date().toISOString();
  }
  if (notas) update.notas = notas;
  await supabase.from("security_alerts" as any).update(update).eq("id", id);
}

export async function createSecurityAlert(alert: Partial<SecurityAlert>) {
  const { error } = await supabase.from("security_alerts" as any).insert(alert);
  if (error) throw error;
}

export async function getSecurityIncidents() {
  const { data, error } = await supabase
    .from("security_incidents" as any).select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as SecurityIncident[];
}

export async function updateIncidentStatus(id: string, status: string, notas?: string) {
  const update: any = { status, atualizado_em: new Date().toISOString() };
  if (status === "resolvido" || status === "encerrado") update.resolved_at = new Date().toISOString();
  if (notas) update.notas = notas;
  await supabase.from("security_incidents" as any).update(update).eq("id", id);
}

export async function createSecurityIncident(incident: Partial<SecurityIncident>) {
  const { error } = await supabase.from("security_incidents" as any).insert(incident);
  if (error) throw error;
}

// ── Permissions ───────────────────────────────────────────────────────

export async function getRolePermissions() {
  const { data, error } = await supabase
    .from("role_permissions" as any).select("*")
    .order("role_name");
  if (error) throw error;
  return (data || []) as unknown as RolePermission[];
}

export async function setPermission(roleName: string, module: string, action: string, allowed: boolean) {
  // Upsert
  const { data: existing } = await supabase
    .from("role_permissions" as any).select("id")
    .eq("role_name", roleName).eq("module", module).eq("action", action).maybeSingle();

  const existingRow = existing as any;
  if (existingRow?.id) {
    await supabase.from("role_permissions" as any).update({ allowed, atualizado_em: new Date().toISOString() }).eq("id", existingRow.id);
  } else {
    await supabase.from("role_permissions" as any).insert({ role_name: roleName, module, action, allowed });
  }
}

export async function initDefaultPermissions() {
  const existing = await getRolePermissions();
  if (existing.length > 0) return; // Already initialized

  const inserts: any[] = [];
  for (const [role, modules] of Object.entries(DEFAULT_PERMISSIONS)) {
    for (const [mod, actions] of Object.entries(modules)) {
      for (const action of ACTIONS) {
        inserts.push({
          role_name: role, module: mod, action,
          allowed: (actions as string[]).includes(action),
        });
      }
    }
  }

  // Batch insert
  const batchSize = 100;
  for (let i = 0; i < inserts.length; i += batchSize) {
    await supabase.from("role_permissions" as any).insert(inserts.slice(i, i + batchSize));
  }
}

export function buildPermissionMatrix(permissions: RolePermission[]): Record<string, Record<string, Record<string, boolean>>> {
  const matrix: Record<string, Record<string, Record<string, boolean>>> = {};
  for (const p of permissions) {
    if (!matrix[p.role_name]) matrix[p.role_name] = {};
    if (!matrix[p.role_name][p.module]) matrix[p.role_name][p.module] = {};
    matrix[p.role_name][p.module][p.action] = p.allowed;
  }
  return matrix;
}
