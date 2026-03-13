import { supabase } from "@/integrations/supabase/client";

export interface ProjectModule {
  id: string;
  nome: string;
  descricao: string;
  status: string;
  project_id: string | null;
  delivered_system_id: string | null;
  tipo: string;
  prioridade: string;
  responsavel: string;
  progresso: number;
  observacoes: string;
  criado_em: string;
  atualizado_em: string;
  module_key: string;
  category: string;
  short_description: string;
  internal_description: string;
  is_delivered: boolean;
  reusability_type: string;
  complexity_level: string;
  functional_priority: string;
  depends_on_module_id: string | null;
}

export interface ModuleEvent {
  id: string;
  module_id: string;
  evento: string;
  descricao: string;
  criado_em: string;
}

export const MODULE_STATUS: Record<string, { label: string; color: string }> = {
  planejado: { label: "Planejado", color: "pending" },
  em_construcao: { label: "Em Construção", color: "active" },
  em_desenvolvimento: { label: "Em Desenvolvimento", color: "active" },
  em_teste: { label: "Em Teste", color: "warm" },
  entregue: { label: "Entregue", color: "delivered" },
  concluido: { label: "Concluído", color: "delivered" },
  descontinuado: { label: "Descontinuado", color: "cancelled" },
  opcional: { label: "Opcional", color: "cold" },
  bloqueado: { label: "Bloqueado", color: "hot" },
  pausado: { label: "Pausado", color: "paused" },
};

export const MODULE_CATEGORIES: Record<string, string> = {
  core: "Core do Sistema",
  autenticacao: "Autenticação e Acesso",
  operacao: "Operação",
  comercial: "Comercial",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  comunicacao: "Comunicação",
  integracoes: "Integrações",
  ia_automacao: "IA e Automação",
  experiencia_cliente: "Experiência do Cliente",
  administrativo: "Administrativo",
  seguranca: "Segurança",
  documentos_midia: "Documentos e Mídia",
};

export const MODULE_TYPES: Record<string, string> = {
  autenticacao: "Autenticação",
  dashboard: "Dashboard",
  crm: "CRM",
  agenda: "Agenda",
  financeiro: "Financeiro",
  relatorios: "Relatórios",
  pdf_documentos: "PDF/Documentos",
  notificacoes: "Notificações",
  multiusuario: "Multiusuário",
  permissoes: "Permissões",
  uploads: "Uploads",
  area_cliente: "Área do Cliente",
  integracao_whatsapp: "Integração WhatsApp",
  integracao_email: "Integração E-mail",
  integracao_pagamento: "Integração Pagamento",
  ia: "IA",
  automacoes: "Automações",
  analytics: "Analytics",
  onboarding: "Onboarding",
  billing: "Billing",
  chat_interno: "Chat Interno",
  assinatura_digital: "Assinatura Digital",
  marketplace: "Marketplace",
  gestao_usuarios: "Gestão de Usuários",
  portal_admin: "Portal Administrativo",
  funcionalidade: "Funcionalidade",
  integracao: "Integração",
  infraestrutura: "Infraestrutura",
  design: "Design/UI",
  automacao: "Automação",
  relatorio: "Relatório",
};

export const REUSABILITY_TYPES: Record<string, { label: string; color: string }> = {
  sim: { label: "Reutilizável", color: "active" },
  nao: { label: "Não reutilizável", color: "paused" },
  parcial: { label: "Parcialmente", color: "warm" },
};

export const COMPLEXITY_LEVELS: Record<string, { label: string; color: string }> = {
  simples: { label: "Simples", color: "active" },
  moderada: { label: "Moderada", color: "pending" },
  alta: { label: "Alta", color: "warm" },
  avancada: { label: "Avançada", color: "hot" },
};

export const FUNCTIONAL_PRIORITIES: Record<string, { label: string; color: string }> = {
  essencial: { label: "Essencial", color: "hot" },
  importante: { label: "Importante", color: "warm" },
  complementar: { label: "Complementar", color: "pending" },
  opcional: { label: "Opcional", color: "cold" },
};

export async function getModules(filters?: {
  project_id?: string;
  delivered_system_id?: string;
  category?: string;
  status?: string;
  reusability_type?: string;
  complexity_level?: string;
  functional_priority?: string;
}) {
  let q = supabase.from("project_modules").select("*").order("criado_em", { ascending: false });
  if (filters?.project_id) q = q.eq("project_id", filters.project_id);
  if (filters?.delivered_system_id) q = q.eq("delivered_system_id", filters.delivered_system_id);
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.reusability_type) q = q.eq("reusability_type", filters.reusability_type);
  if (filters?.complexity_level) q = q.eq("complexity_level", filters.complexity_level);
  if (filters?.functional_priority) q = q.eq("functional_priority", filters.functional_priority);
  const { data, error } = await q;
  if (error) throw error;
  return data as ProjectModule[];
}

export async function getModulesByProject(projectId: string) {
  const { data, error } = await supabase
    .from("project_modules")
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as ProjectModule[];
}

export async function getModulesBySystem(systemId: string) {
  const { data, error } = await supabase
    .from("project_modules")
    .select("*")
    .eq("delivered_system_id", systemId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as ProjectModule[];
}

export async function saveModule(m: Partial<ProjectModule>) {
  const payload = { ...m, atualizado_em: new Date().toISOString() };
  if (m.id) {
    const { data, error } = await supabase.from("project_modules").update(payload).eq("id", m.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from("project_modules").insert([payload as any]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteModule(id: string) {
  const { error } = await supabase.from("project_modules").delete().eq("id", id);
  if (error) throw error;
}

export async function addModuleEvent(moduleId: string, evento: string, descricao?: string) {
  const { error } = await supabase.from("project_module_events" as any).insert([{
    module_id: moduleId,
    evento,
    descricao: descricao || "",
  }]);
  if (error) throw error;
}

export async function getModuleEvents(moduleId: string) {
  const { data, error } = await supabase
    .from("project_module_events" as any)
    .select("*")
    .eq("module_id", moduleId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as ModuleEvent[];
}
