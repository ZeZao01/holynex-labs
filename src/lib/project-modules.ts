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
}

export const MODULE_STATUS: Record<string, { label: string; color: string }> = {
  planejado: { label: "Planejado", color: "pending" },
  em_desenvolvimento: { label: "Em Desenvolvimento", color: "active" },
  em_teste: { label: "Em Teste", color: "warm" },
  concluido: { label: "Concluído", color: "delivered" },
  pausado: { label: "Pausado", color: "paused" },
};

export const MODULE_TYPES: Record<string, string> = {
  funcionalidade: "Funcionalidade",
  integracao: "Integração",
  infraestrutura: "Infraestrutura",
  design: "Design/UI",
  automacao: "Automação",
  relatorio: "Relatório",
};

export async function getModules(filters?: { project_id?: string; delivered_system_id?: string }) {
  let q = supabase.from("project_modules").select("*").order("criado_em", { ascending: false });
  if (filters?.project_id) q = q.eq("project_id", filters.project_id);
  if (filters?.delivered_system_id) q = q.eq("delivered_system_id", filters.delivered_system_id);
  const { data, error } = await q;
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
