import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  nome: string;
  cliente: string;
  empresa_cliente: string;
  descricao: string;
  tipo_projeto: string;
  nicho: string;
  status: string;
  prioridade: string;
  responsavel: string;
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
  criado_em: string;
  atualizado_em: string;
}

export const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
  planejamento: { label: "Planejamento", color: "pending" },
  em_andamento: { label: "Em Andamento", color: "active" },
  revisao: { label: "Revisão", color: "warm" },
  pausado: { label: "Pausado", color: "paused" },
  concluido: { label: "Concluído", color: "delivered" },
  cancelado: { label: "Cancelado", color: "cancelled" },
};

export const PROJECT_PRIORITY: Record<string, string> = {
  baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente",
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
