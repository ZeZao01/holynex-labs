import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  nome: string;
  cliente: string;
  empresa_cliente: string;
  descricao: string;
  tipo_projeto: string;
  categoria: string;
  nicho: string;
  status: string;
  prioridade: string;
  faixa_contratada: string;
  responsavel: string;
  responsavel_comercial: string;
  responsavel_produto: string;
  responsavel_tecnico: string;
  resumo_executivo: string;
  descricao_interna: string;
  estrategia_comercial_origem: string;
  proposta_id: string | null;
  delivered_system_id: string | null;
  data_inicio: string | null;
  data_previsao: string | null;
  data_conclusao: string | null;
  valor_contrato: number;
  recorrencia_mensal: number;
  progresso: number;
  observacoes: string;
  stack: string[];
  live_url: string;
  admin_url: string;
  staging_url: string;
  repo_url: string;
  docs_url: string;
  design_url: string;
  analytics_url: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  titulo: string;
  descricao: string;
  status: string;
  data_prevista: string | null;
  data_concluida: string | null;
  observacoes: string;
  criado_em: string;
  atualizado_em: string;
}

export interface ProjectEvent {
  id: string;
  project_id: string;
  evento: string;
  descricao: string;
  criado_em: string;
}

export const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
  aguardando_inicio: { label: "Aguardando Início", color: "pending" },
  discovery: { label: "Discovery", color: "warm" },
  planejamento: { label: "Planejamento", color: "pending" },
  em_design: { label: "Em Design", color: "warm" },
  em_desenvolvimento: { label: "Em Desenvolvimento", color: "active" },
  em_validacao: { label: "Em Validação", color: "warm" },
  aguardando_cliente: { label: "Aguardando Cliente", color: "paused" },
  entregue: { label: "Entregue", color: "delivered" },
  em_manutencao: { label: "Em Manutenção", color: "active" },
  pausado: { label: "Pausado", color: "paused" },
  cancelado: { label: "Cancelado", color: "cancelled" },
};

export const PROJECT_PRIORITY: Record<string, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const MILESTONE_STATUS: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pendente", color: "pending" },
  em_andamento: { label: "Em Andamento", color: "active" },
  concluido: { label: "Concluído", color: "delivered" },
  cancelado: { label: "Cancelado", color: "cancelled" },
};

export async function getProjects() {
  const { data, error } = await supabase.from("projects").select("*").order("criado_em", { ascending: false });
  if (error) throw error;
  return data as Project[];
}

export async function getProject(id: string) {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Project | null;
}

export async function saveProject(p: Partial<Project>) {
  const payload = { ...p, atualizado_em: new Date().toISOString() };
  if (p.id) {
    const { data, error } = await supabase.from("projects").update(payload).eq("id", p.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from("projects").insert([payload as any]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

// Milestones
export async function getMilestones(projectId: string) {
  const { data, error } = await supabase.from("project_milestones").select("*").eq("project_id", projectId).order("data_prevista", { ascending: true });
  if (error) throw error;
  return data as ProjectMilestone[];
}

export async function saveMilestone(m: Partial<ProjectMilestone>) {
  const payload = { ...m, atualizado_em: new Date().toISOString() };
  if (m.id) {
    const { data, error } = await supabase.from("project_milestones").update(payload).eq("id", m.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from("project_milestones").insert([payload as any]).select().single();
  if (error) throw error;
  return data;
}

export async function deleteMilestone(id: string) {
  const { error } = await supabase.from("project_milestones").delete().eq("id", id);
  if (error) throw error;
}

// Events
export async function getProjectEvents(projectId: string) {
  const { data, error } = await supabase.from("project_events").select("*").eq("project_id", projectId).order("criado_em", { ascending: false });
  if (error) throw error;
  return data as ProjectEvent[];
}

export async function addProjectEvent(projectId: string, evento: string, descricao: string = "") {
  const { error } = await supabase.from("project_events").insert([{ project_id: projectId, evento, descricao }]);
  if (error) throw error;
}
