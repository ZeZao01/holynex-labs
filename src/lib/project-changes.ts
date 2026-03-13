import { supabase } from "@/integrations/supabase/client";

// ── Types ──
export interface ProjectChange {
  id: string;
  project_id: string | null;
  delivered_system_id: string | null;
  project_module_id: string | null;
  title: string;
  change_type: string;
  short_description: string | null;
  detailed_description: string | null;
  status: string;
  priority: string;
  urgency: string;
  request_origin: string | null;
  requested_by_name: string | null;
  assigned_to_name: string | null;
  estimated_hours: number | null;
  estimated_cost: number | null;
  billing_mode: string | null;
  is_included_in_contract: boolean | null;
  needs_approval: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
  approval_notes: string | null;
  requested_at: string | null;
  desired_deadline: string | null;
  planned_date: string | null;
  completed_at: string | null;
  internal_notes: string | null;
  commercial_notes: string | null;
  opportunity_tag: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
}

export interface ProjectChangeEvent {
  id: string;
  change_id: string;
  evento: string;
  descricao: string | null;
  criado_em: string | null;
}

// ── Constants ──
export const CHANGE_TYPES = [
  { value: "correcao", label: "Correção" },
  { value: "melhoria", label: "Melhoria" },
  { value: "novo_modulo", label: "Novo Módulo" },
  { value: "integracao", label: "Integração" },
  { value: "ajuste_regra", label: "Ajuste de Regra de Negócio" },
  { value: "ajuste_visual", label: "Ajuste Visual/UI" },
  { value: "performance", label: "Performance" },
  { value: "seguranca", label: "Segurança" },
  { value: "conteudo", label: "Conteúdo" },
  { value: "relatorio", label: "Relatório" },
  { value: "pdf_documento", label: "PDF/Documento" },
  { value: "automacao", label: "Automação" },
  { value: "suporte_tecnico", label: "Suporte Técnico" },
  { value: "ajuste_acesso", label: "Ajuste de Acesso" },
  { value: "manutencao_preventiva", label: "Manutenção Preventiva" },
];

export const CHANGE_STATUSES = [
  { value: "aberta", label: "Aberta", color: "pending" },
  { value: "em_analise", label: "Em Análise", color: "maintenance" },
  { value: "aguardando_orcamento", label: "Aguardando Orçamento", color: "warm" },
  { value: "aguardando_aprovacao", label: "Aguardando Aprovação", color: "warm" },
  { value: "aprovada", label: "Aprovada", color: "active" },
  { value: "em_execucao", label: "Em Execução", color: "maintenance" },
  { value: "aguardando_validacao", label: "Aguardando Validação", color: "warm" },
  { value: "concluida", label: "Concluída", color: "delivered" },
  { value: "recusada", label: "Recusada", color: "cancelled" },
  { value: "cancelada", label: "Cancelada", color: "cancelled" },
  { value: "arquivada", label: "Arquivada", color: "paused" },
];

export const PRIORITIES = [
  { value: "baixa", label: "Baixa", color: "cold" },
  { value: "media", label: "Média", color: "pending" },
  { value: "alta", label: "Alta", color: "warm" },
  { value: "critica", label: "Crítica", color: "hot" },
];

export const URGENCIES = [
  { value: "sem_urgencia", label: "Sem Urgência" },
  { value: "esta_semana", label: "Esta Semana" },
  { value: "em_72h", label: "Em 72h" },
  { value: "urgente", label: "Urgente" },
];

export const REQUEST_ORIGINS = [
  { value: "cliente", label: "Cliente" },
  { value: "equipe_interna", label: "Equipe Interna" },
  { value: "suporte", label: "Suporte" },
  { value: "revisao_tecnica", label: "Revisão Técnica" },
  { value: "melhoria_estrategica", label: "Melhoria Estratégica" },
  { value: "pos_entrega", label: "Pós-Entrega" },
  { value: "correcao_interna", label: "Correção Interna" },
  { value: "backlog_comercial", label: "Backlog Comercial" },
];

export const BILLING_MODES = [
  { value: "incluso_contrato", label: "Incluso em Contrato" },
  { value: "avulso_cobrado", label: "Avulso Cobrado" },
  { value: "avulso_nao_orcado", label: "Avulso Não Orçado" },
  { value: "cortesia", label: "Cortesia" },
  { value: "garantia", label: "Garantia" },
  { value: "manutencao_mensal", label: "Manutenção Mensal" },
  { value: "discovery", label: "Discovery" },
];

// ── Helpers ──
export function getLabel(list: { value: string; label: string }[], value: string) {
  return list.find((i) => i.value === value)?.label || value;
}

export function getStatusMeta(value: string) {
  return CHANGE_STATUSES.find((s) => s.value === value) || { value, label: value, color: "pending" };
}

export function getPriorityMeta(value: string) {
  return PRIORITIES.find((p) => p.value === value) || { value, label: value, color: "pending" };
}

// ── CRUD ──
export async function listChanges() {
  const { data, error } = await supabase
    .from("project_changes")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as ProjectChange[];
}

export async function getChange(id: string) {
  const { data, error } = await supabase
    .from("project_changes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as ProjectChange | null;
}

export async function saveChange(change: Partial<ProjectChange>) {
  const payload = { ...change, atualizado_em: new Date().toISOString() };
  const query = change.id
    ? supabase.from("project_changes").update(payload).eq("id", change.id)
    : supabase.from("project_changes").insert([payload as any]);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as ProjectChange;
}

export async function deleteChange(id: string) {
  const { error } = await supabase.from("project_changes").delete().eq("id", id);
  if (error) throw error;
}

// ── Events ──
export async function getChangeEvents(changeId: string) {
  const { data, error } = await supabase
    .from("project_change_events")
    .select("*")
    .eq("change_id", changeId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as ProjectChangeEvent[];
}

export async function addChangeEvent(changeId: string, evento: string, descricao?: string) {
  const { error } = await supabase
    .from("project_change_events")
    .insert([{ change_id: changeId, evento, descricao: descricao || "" }]);
  if (error) throw error;
}

// ── Stats ──
export function computeStats(changes: ProjectChange[]) {
  const abertas = changes.filter((c) => c.status === "aberta").length;
  const emExecucao = changes.filter((c) => c.status === "em_execucao").length;
  const concluidas = changes.filter((c) => c.status === "concluida").length;
  const custoAberto = changes
    .filter((c) => !["concluida", "cancelada", "arquivada", "recusada"].includes(c.status))
    .reduce((sum, c) => sum + (c.estimated_cost || 0), 0);
  const cobradas = changes
    .filter((c) => c.billing_mode === "avulso_cobrado")
    .reduce((sum, c) => sum + (c.estimated_cost || 0), 0);
  const inclusas = changes.filter((c) => c.is_included_in_contract).length;
  return { abertas, emExecucao, concluidas, custoAberto, cobradas, inclusas };
}
