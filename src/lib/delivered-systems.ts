import { supabase } from "@/integrations/supabase/client";

export type SupportStatus = "suporte_ativo" | "suporte_eventual" | "sem_suporte" | "suporte_encerrado";
export type OperationalStatus = "em_uso" | "descontinuado" | "arquivado" | "base_reutilizavel" | "case_interno";
export type ReuseLevel = "baixo" | "medio" | "alto" | "muito_alto";

export const SUPPORT_STATUS_MAP: Record<SupportStatus, { label: string; color: string }> = {
  suporte_ativo: { label: "Suporte Ativo", color: "active" },
  suporte_eventual: { label: "Suporte Eventual", color: "warm" },
  sem_suporte: { label: "Sem Suporte", color: "paused" },
  suporte_encerrado: { label: "Encerrado", color: "cancelled" },
};

export const OPERATIONAL_STATUS_MAP: Record<OperationalStatus, { label: string; color: string }> = {
  em_uso: { label: "Em Uso", color: "active" },
  descontinuado: { label: "Descontinuado", color: "cancelled" },
  arquivado: { label: "Arquivado", color: "paused" },
  base_reutilizavel: { label: "Base Reutilizável", color: "maintenance" },
  case_interno: { label: "Case Interno", color: "delivered" },
};

export const REUSE_MAP: Record<ReuseLevel, { label: string; color: string }> = {
  baixo: { label: "Baixo", color: "cold" },
  medio: { label: "Médio", color: "warm" },
  alto: { label: "Alto", color: "hot" },
  muito_alto: { label: "Muito Alto", color: "active" },
};

export const DEFAULT_TAGS = [
  "CRM", "ERP", "SaaS", "Portal", "Dashboard", "Agendamento", "Financeiro",
  "Saúde", "Automação", "Recorrência", "Multiusuário", "White-label", "MVP",
  "Alta Margem", "Alta Demanda",
];

export interface DeliveredSystem {
  id: string;
  nome: string;
  projeto_origem_id: string | null;
  cliente: string;
  empresa_cliente: string;
  categoria: string;
  tipo_projeto: string;
  nicho: string;
  resumo_curto: string;
  descricao_interna: string;
  thumbnail_url: string;
  status_suporte: string;
  status_operacional: string;
  ativo: boolean;
  reutilizavel: boolean;
  destaque_interno: boolean;
  potencial_reuso: string;
  faixa_ticket: string;
  valor_fechado: number;
  recorrencia_mensal: number;
  data_entrega: string;
  ultima_atualizacao: string;
  live_url: string;
  admin_url: string;
  staging_url: string;
  repo_url: string;
  docs_url: string;
  design_url: string;
  analytics_url: string;
  stack_principal: string[];
  banco_dados: string;
  integracoes: string[];
  versao_atual: string;
  observacoes_tecnicas: string;
  observacoes_comerciais: string;
  faixa_contratada: string;
  criado_em: string;
  atualizado_em: string;
}

export interface SystemTag {
  id: string;
  system_id: string;
  tag: string;
  tipo: string;
}

export interface SystemEvent {
  id: string;
  system_id: string;
  evento: string;
  descricao: string;
  criado_em: string;
}

export async function getDeliveredSystems() {
  const { data, error } = await supabase
    .from("delivered_systems")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as DeliveredSystem[];
}

export async function getDeliveredSystem(id: string) {
  const { data, error } = await supabase
    .from("delivered_systems")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as DeliveredSystem | null;
}

export async function saveDeliveredSystem(system: Partial<DeliveredSystem>) {
  if (system.id) {
    const { data, error } = await supabase
      .from("delivered_systems")
      .update({ ...system, atualizado_em: new Date().toISOString() })
      .eq("id", system.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from("delivered_systems")
      .insert([system as any])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function deleteDeliveredSystem(id: string) {
  const { error } = await supabase.from("delivered_systems").delete().eq("id", id);
  if (error) throw error;
}

export async function getSystemTags(systemId: string) {
  const { data, error } = await supabase
    .from("delivered_system_tags")
    .select("*")
    .eq("system_id", systemId);
  if (error) throw error;
  return data as SystemTag[];
}

export async function setSystemTags(systemId: string, tags: { tag: string; tipo: string }[]) {
  await supabase.from("delivered_system_tags").delete().eq("system_id", systemId);
  if (tags.length > 0) {
    const { error } = await supabase
      .from("delivered_system_tags")
      .insert(tags.map((t) => ({ system_id: systemId, ...t })));
    if (error) throw error;
  }
}

export async function getSystemEvents(systemId: string) {
  const { data, error } = await supabase
    .from("delivered_system_events")
    .select("*")
    .eq("system_id", systemId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data as SystemEvent[];
}

export async function addSystemEvent(systemId: string, evento: string, descricao = "") {
  const { error } = await supabase
    .from("delivered_system_events")
    .insert({ system_id: systemId, evento, descricao });
  if (error) throw error;
}
