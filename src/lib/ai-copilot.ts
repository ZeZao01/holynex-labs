import { supabase } from "@/integrations/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────

export type AiUseCase =
  | "resumir_lead"
  | "sugerir_estrategia_comercial"
  | "resumir_proposta"
  | "resumir_projeto"
  | "sugerir_copy_portfolio"
  | "sugerir_modelo"
  | "explicar_financeiro"
  | "resumir_manutencao";

export type AiEntityType = "lead" | "proposta" | "projeto" | "portfolio" | "modelo" | "financeiro" | "manutencao";

export type AiExecutionStatus =
  | "solicitado"
  | "em_processamento"
  | "concluido"
  | "fallback_usado"
  | "invalido"
  | "aguardando_revisao"
  | "aprovado"
  | "rejeitado"
  | "falhou";

export interface AiExecution {
  id: string;
  use_case: string;
  entity_type: string;
  entity_id: string | null;
  provider_used: string;
  model_used: string;
  prompt_version: string;
  fallback_triggered: boolean;
  output_valid: boolean;
  human_approved: boolean | null;
  status: AiExecutionStatus;
  error_reason: string | null;
  input_summary: string | null;
  output_data: any;
  output_text: string | null;
  duration_ms: number | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notas: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface AiCopilotResult<T = any> {
  output: T;
  _meta: {
    provider_used: string;
    model_used: string;
    prompt_version: string;
    fallback_triggered: boolean;
    duration_ms: number;
    use_case: string;
  };
}

// ── Use case labels ───────────────────────────────────────────────────

export const USE_CASE_LABELS: Record<string, string> = {
  resumir_lead: "Resumir Lead",
  sugerir_estrategia_comercial: "Estratégia Comercial",
  resumir_proposta: "Resumir Proposta",
  resumir_projeto: "Resumir Projeto",
  sugerir_copy_portfolio: "Copy Portfólio",
  sugerir_modelo: "Sugerir Modelo",
  explicar_financeiro: "Explicar Financeiro",
  resumir_manutencao: "Resumir Manutenção",
};

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  solicitado: { label: "Solicitado", color: "bg-muted text-muted-foreground" },
  em_processamento: { label: "Processando", color: "bg-primary/20 text-primary" },
  concluido: { label: "Concluído", color: "bg-primary/15 text-primary" },
  fallback_usado: { label: "Fallback", color: "bg-accent text-accent-foreground" },
  invalido: { label: "Inválido", color: "bg-destructive/15 text-destructive" },
  aguardando_revisao: { label: "Aguardando Revisão", color: "bg-secondary text-secondary-foreground" },
  aprovado: { label: "Aprovado", color: "bg-primary/15 text-primary" },
  rejeitado: { label: "Rejeitado", color: "bg-destructive/15 text-destructive" },
  falhou: { label: "Falhou", color: "bg-destructive/15 text-destructive" },
};

// ── Core function ─────────────────────────────────────────────────────

export async function runCopilot<T = any>(
  useCase: AiUseCase,
  context: Record<string, any>,
  entityType?: AiEntityType,
  entityId?: string,
): Promise<AiCopilotResult<T>> {
  const { data, error } = await supabase.functions.invoke("copiloto-ia", {
    body: { use_case: useCase, context, entity_type: entityType || "", entity_id: entityId || null },
  });

  if (error) throw new Error(error.message || "Erro ao chamar copiloto IA");
  if (data?.error) throw new Error(data.error);
  return data as AiCopilotResult<T>;
}

// ── Typed helpers ─────────────────────────────────────────────────────

export interface LeadSummary {
  resumo: string;
  pontos_fortes: string[];
  riscos: string[];
  sugestao_proxima_acao: string;
}

export interface CommercialStrategy {
  estrategia: string;
  argumentos_fechamento: string[];
  faixa_ideal: string;
  abordagem: string;
  riscos_comerciais: string[];
}

export interface ProposalSummary {
  resumo_executivo: string;
  destaques: string[];
  valor_total_estimado: string;
  complexidade: string;
  recomendacao: string;
}

export interface ProjectSummary {
  resumo: string;
  status_geral: string;
  riscos: string[];
  proximos_passos: string[];
  blockers: string[];
}

export interface PortfolioCopy {
  headline: string;
  subtitulo: string;
  descricao_curta: string;
  descricao_comercial: string;
  badges_sugeridos: string[];
}

export interface ModelSuggestion {
  value_proposition: string;
  target_audience: string;
  problem_solved: string;
  badges_sugeridos: string[];
  tiers_sugeridos: { name: string; description: string; modules: string[] }[];
}

export interface FinancialExplanation {
  explicacao: string;
  oportunidades: string[];
  alertas: string[];
  sugestoes_acao: string[];
}

export interface MaintenanceSummary {
  resumo: string;
  classificacao: string;
  impacto: string;
  sugestao_acao: string;
}

export const summarizeLead = (ctx: any, entityId?: string) =>
  runCopilot<LeadSummary>("resumir_lead", ctx, "lead", entityId);

export const suggestStrategy = (ctx: any, entityId?: string) =>
  runCopilot<CommercialStrategy>("sugerir_estrategia_comercial", ctx, "proposta", entityId);

export const summarizeProposal = (ctx: any, entityId?: string) =>
  runCopilot<ProposalSummary>("resumir_proposta", ctx, "proposta", entityId);

export const summarizeProject = (ctx: any, entityId?: string) =>
  runCopilot<ProjectSummary>("resumir_projeto", ctx, "projeto", entityId);

export const suggestPortfolioCopy = (ctx: any, entityId?: string) =>
  runCopilot<PortfolioCopy>("sugerir_copy_portfolio", ctx, "portfolio", entityId);

export const suggestModel = (ctx: any, entityId?: string) =>
  runCopilot<ModelSuggestion>("sugerir_modelo", ctx, "modelo", entityId);

export const explainFinancials = (ctx: any) =>
  runCopilot<FinancialExplanation>("explicar_financeiro", ctx, "financeiro");

export const summarizeMaintenance = (ctx: any, entityId?: string) =>
  runCopilot<MaintenanceSummary>("resumir_manutencao", ctx, "manutencao", entityId);

// ── Execution management ──────────────────────────────────────────────

export async function getAiExecutions(limit = 50) {
  const { data, error } = await supabase
    .from("ai_executions" as any)
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as unknown as AiExecution[];
}

export async function getPendingReviews() {
  const { data, error } = await supabase
    .from("ai_executions" as any)
    .select("*")
    .eq("status", "aguardando_revisao")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as AiExecution[];
}

export async function reviewExecution(id: string, approved: boolean, reviewedBy: string, notas?: string) {
  const { error } = await supabase
    .from("ai_executions" as any)
    .update({
      human_approved: approved,
      status: approved ? "aprovado" : "rejeitado",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      notas: notas || "",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function getExecutionsByEntity(entityType: string, entityId: string) {
  const { data, error } = await supabase
    .from("ai_executions" as any)
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as AiExecution[];
}
