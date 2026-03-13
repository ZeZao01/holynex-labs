import { supabase } from "@/integrations/supabase/client";

export interface ProfitabilityMetrics {
  id: string;
  delivered_system_id: string | null;
  receita_setup: number;
  receita_recorrente: number;
  receita_manutencao: number;
  receita_total: number;
  custo_entrega: number;
  custo_suporte: number;
  margem_estimada: number;
  profitability_score: number;
  demand_score: number;
  recurrence_score: number;
  reuse_score: number;
  opportunity_score: number;
  flags: string[];
  override_manual: boolean;
  notas: string;
  criado_em: string;
  atualizado_em: string;
}

export interface NicheMetrics {
  id: string;
  nicho: string;
  qtd_leads: number;
  qtd_propostas: number;
  qtd_projetos: number;
  ticket_medio: number;
  margem_media: number;
  recorrencia_media: number;
  demand_score: number;
  opportunity_score: number;
}

export interface PortfolioPerformance {
  id: string;
  portfolio_item_id: string | null;
  visualizacoes: number;
  cliques: number;
  ctas_acionados: number;
  conversoes_lead: number;
  demand_score: number;
  opportunity_score: number;
}

export const STRATEGIC_FLAGS = [
  "estrategico", "vender_mais", "destacar_site", "alta_margem",
  "muito_procurado", "gera_recorrencia", "evitar_escalar",
] as const;

export const FLAG_LABELS: Record<string, { label: string; color: string }> = {
  estrategico: { label: "Estratégico", color: "bg-primary/20 text-primary" },
  vender_mais: { label: "Vender Mais", color: "bg-emerald-500/20 text-emerald-400" },
  destacar_site: { label: "Destacar no Site", color: "bg-blue-500/20 text-blue-400" },
  alta_margem: { label: "Alta Margem", color: "bg-amber-500/20 text-amber-400" },
  muito_procurado: { label: "Muito Procurado", color: "bg-pink-500/20 text-pink-400" },
  gera_recorrencia: { label: "Gera Recorrência", color: "bg-cyan-500/20 text-cyan-400" },
  evitar_escalar: { label: "Evitar Escalar", color: "bg-red-500/20 text-red-400" },
};

export const RISK_ALERTS = [
  { key: "baixa_margem", label: "Baixa Margem", check: (m: ProfitabilityMetrics) => m.margem_estimada < 20 && m.receita_total > 0 },
  { key: "alta_manutencao_baixo_retorno", label: "Alta Manutenção / Baixo Retorno", check: (m: ProfitabilityMetrics) => m.receita_manutencao > m.receita_setup * 0.5 && m.profitability_score < 40 },
  { key: "baixa_recorrencia", label: "Baixa Recorrência", check: (m: ProfitabilityMetrics) => m.recurrence_score < 20 && m.receita_total > 0 },
];

export function calculateScores(m: Partial<ProfitabilityMetrics>): Pick<ProfitabilityMetrics, "profitability_score" | "demand_score" | "recurrence_score" | "reuse_score" | "opportunity_score"> {
  const receitaTotal = (m.receita_setup || 0) + (m.receita_recorrente || 0) * 12 + (m.receita_manutencao || 0);
  const custoTotal = (m.custo_entrega || 0) + (m.custo_suporte || 0);
  const margem = receitaTotal > 0 ? ((receitaTotal - custoTotal) / receitaTotal) * 100 : 0;
  const profitability_score = Math.min(100, Math.max(0, margem));
  const recurrence_score = Math.min(100, ((m.receita_recorrente || 0) / Math.max(receitaTotal, 1)) * 100);
  const reuse_score = m.reuse_score || 0;
  const demand_score = m.demand_score || 0;
  const opportunity_score = Math.round((profitability_score * 0.3 + recurrence_score * 0.25 + reuse_score * 0.25 + demand_score * 0.2));
  return { profitability_score: Math.round(profitability_score), demand_score, recurrence_score: Math.round(recurrence_score), reuse_score, opportunity_score };
}

export async function getAllProfitabilityMetrics() {
  const { data, error } = await supabase
    .from("project_profitability_metrics")
    .select("*")
    .order("receita_total", { ascending: false });
  if (error) throw error;
  return (data || []) as ProfitabilityMetrics[];
}

export async function getProfitabilityMetrics(systemId: string) {
  const { data, error } = await supabase
    .from("project_profitability_metrics")
    .select("*")
    .eq("delivered_system_id", systemId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfitabilityMetrics | null;
}

export async function saveProfitabilityMetrics(metrics: Partial<ProfitabilityMetrics>) {
  const scores = metrics.override_manual ? {} : calculateScores(metrics);
  const receitaTotal = (metrics.receita_setup || 0) + (metrics.receita_recorrente || 0) * 12 + (metrics.receita_manutencao || 0);
  const custoTotal = (metrics.custo_entrega || 0) + (metrics.custo_suporte || 0);
  const margem = receitaTotal > 0 ? ((receitaTotal - custoTotal) / receitaTotal) * 100 : 0;

  const payload = {
    ...metrics,
    receita_total: receitaTotal,
    margem_estimada: Math.round(margem * 100) / 100,
    ...scores,
    atualizado_em: new Date().toISOString(),
  };

  if (metrics.id) {
    const { data, error } = await supabase.from("project_profitability_metrics").update(payload).eq("id", metrics.id).select().single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase.from("project_profitability_metrics").insert([payload as any]).select().single();
  if (error) throw error;
  return data;
}

export async function getNicheMetrics() {
  const { data, error } = await supabase.from("niche_metrics").select("*").order("ticket_medio", { ascending: false });
  if (error) throw error;
  return (data || []) as NicheMetrics[];
}

export async function saveNicheMetrics(m: Partial<NicheMetrics>) {
  if (m.id) {
    const { error } = await supabase.from("niche_metrics").update({ ...m, atualizado_em: new Date().toISOString() }).eq("id", m.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("niche_metrics").insert([m as any]);
    if (error) throw error;
  }
}

export async function getPortfolioPerformance() {
  const { data, error } = await supabase.from("portfolio_performance_metrics").select("*").order("visualizacoes", { ascending: false });
  if (error) throw error;
  return (data || []) as PortfolioPerformance[];
}
