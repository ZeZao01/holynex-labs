import { supabase } from "@/integrations/supabase/client";

export type OrcamentoStatus = "pendente" | "recebido" | "rejeitado";

export interface Orcamento {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  descricao: string;
  status: OrcamentoStatus;
  criadoEm: string;
  prioridade?: "alta" | "media" | "baixa";
  resumoIA?: string;
}

function classificarPrioridade(descricao: string): "alta" | "media" | "baixa" {
  const lower = descricao.toLowerCase();
  if (lower.includes("urgente") || lower.includes("rápido") || lower.includes("imediato") || lower.includes("prazo curto")) {
    return "alta";
  }
  if (lower.includes("futuro") || lower.includes("sem pressa") || lower.includes("avaliar")) {
    return "baixa";
  }
  return "media";
}

function gerarResumo(descricao: string): string {
  const palavras = descricao.split(" ");
  return palavras.length > 15 ? palavras.slice(0, 15).join(" ") + "..." : descricao;
}

export async function salvarOrcamento(data: { nome: string; email: string; empresa: string; descricao: string }) {
  const prioridade = classificarPrioridade(data.descricao);
  const resumo_ia = gerarResumo(data.descricao);

  const { error } = await supabase.from("orcamentos").insert({
    nome: data.nome,
    email: data.email,
    empresa: data.empresa,
    descricao: data.descricao,
    status: "pendente",
    prioridade,
    resumo_ia,
  });

  if (error) throw error;
}

export async function getOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    nome: row.nome,
    email: row.email,
    empresa: row.empresa || "",
    descricao: row.descricao,
    status: row.status as OrcamentoStatus,
    criadoEm: row.criado_em,
    prioridade: row.prioridade as Orcamento["prioridade"],
    resumoIA: row.resumo_ia,
  }));
}

export async function atualizarStatus(id: string, status: OrcamentoStatus) {
  const { error } = await supabase
    .from("orcamentos")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function removerOrcamento(id: string) {
  const { error } = await supabase
    .from("orcamentos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
