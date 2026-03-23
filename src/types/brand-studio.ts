export type BrandProjectStatus =
  | "planejamento"
  | "briefing"
  | "producao"
  | "revisao"
  | "aprovado"
  | "arquivado";

export type BrandTaskStatus = "pendente" | "em_execucao" | "em_revisao" | "concluida" | "cancelada";
export type BrandTaskPriority = "baixa" | "media" | "alta" | "critica";
export type BrandAssetType = "image" | "video" | "document" | "presentation" | "other";
export type BrandBriefReferenceType = "image" | "url" | "note";

export interface BrandProject {
  id: string;
  nome: string;
  slug: string | null;
  status: BrandProjectStatus;
  descricao: string | null;
  owner_user_id: string | null;
  lead_id: string | null;
  client_id: string | null;
  proposal_id: string | null;
  project_id: string | null;
  started_at: string | null;
  deadline_at: string | null;
  metadata: Record<string, unknown> | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandBrief {
  id: string;
  project_id: string;
  titulo: string;
  contexto: string | null;
  nome_marca: string | null;
  slogan: string | null;
  nicho: string | null;
  publico_alvo_detalhado: string | null;
  proposta_valor: string | null;
  concorrentes: string[] | null;
  estilos_desejados: string[] | null;
  estilos_evitar: string[] | null;
  objetivos_identidade: string[] | null;
  observacoes_adicionais: string | null;
  referencia_visual_contexto: string | null;
  readiness_score: number | null;
  missing_questions: string[] | null;
  normalized_context: Record<string, unknown> | null;
  normalized_at: string | null;
  gap_summary: string | null;
  objetivos: string[] | null;
  publico_alvo: string | null;
  restricoes: string[] | null;
  status: string;
  version: number;
  created_by: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandBriefReference {
  id: string;
  project_id: string;
  brief_id: string | null;
  reference_type: BrandBriefReferenceType;
  bucket: string | null;
  storage_path: string | null;
  public_url: string | null;
  source_url: string | null;
  note: string | null;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sort_order: number;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  criado_em: string;
  atualizado_em: string;
  signed_url?: string | null;
}

export interface BrandBriefingNormalizationOutput {
  normalized_context: Record<string, unknown>;
  missing_questions: string[];
  readiness_score: number;
  gap_summary?: string;
  status: "pronto" | "incompleto";
}

export interface BrandBriefingAgentRunResult {
  run: BrandAiRun;
  output: BrandBriefingNormalizationOutput;
  used_fallback: boolean;
}

export interface BrandBriefingExecutionResult extends BrandBriefingAgentRunResult {
  brief: BrandBrief;
}

export type BrandStrategyStatus = "pendente" | "aprovado" | "rejeitado";

export interface BrandStrategyDirection {
  titulo: string;
  descricao: string;
  justificativa_estrategica: string;
  tom_visual: string;
  atributos_chave: string[];
  palavras_chave: string[];
  aplicacoes: string[];
  evitar: string[];
}

export interface BrandStrategyOutputPayload {
  posicionamento: string;
  arquetipo: string;
  atributos: string[];
  tom_visual: string;
  direcoes_criativas: BrandStrategyDirection[];
  evitar: string[];
  recomendacao_principal: string;
}

export interface BrandStrategyOutput {
  id: string;
  project_id: string;
  brief_id: string | null;
  ai_run_id: string | null;
  status: BrandStrategyStatus;
  prompt_version: string;
  provider_used: string | null;
  model_used: string | null;
  output_payload: BrandStrategyOutputPayload | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandStrategyExecutionResult {
  run: BrandAiRun;
  output: BrandStrategyOutput;
  used_fallback: boolean;
}

export interface BrandTask {
  id: string;
  project_id: string;
  brief_id: string | null;
  title: string;
  description: string | null;
  task_type: string;
  status: BrandTaskStatus;
  priority: BrandTaskPriority;
  assigned_to: string | null;
  due_date: string | null;
  ai_required: boolean;
  payload: Record<string, unknown> | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandAgentConfig {
  id: string;
  agent_key: string;
  provider: string;
  model: string;
  temperature: number | null;
  max_tokens: number | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
  updated_by: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandAiRun {
  id: string;
  project_id: string;
  task_id: string | null;
  agent_config_id: string | null;
  status: string;
  provider_used: string | null;
  model_used: string | null;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  error_reason: string | null;
  duration_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_estimated: number | null;
  executed_by: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandDesignAsset {
  id: string;
  project_id: string;
  version_id: string | null;
  task_id: string | null;
  bucket: string;
  storage_path: string;
  public_url: string | null;
  asset_type: BrandAssetType;
  mime_type: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandVersion {
  id: string;
  project_id: string;
  version_number: number;
  label: string;
  summary: string | null;
  change_log: string[] | null;
  status: string;
  presentation_url: string | null;
  created_by: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandFeedbackCycle {
  id: string;
  project_id: string;
  version_id: string;
  reviewer_id: string | null;
  status: string;
  score: number | null;
  feedback_text: string | null;
  change_requests: Record<string, unknown>[] | null;
  resolved_at: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandAddon {
  id: string;
  project_id: string;
  addon_key: string;
  titulo: string;
  descricao: string | null;
  status: string;
  impacto: string | null;
  metadata: Record<string, unknown> | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BrandStudioOverviewStats {
  projects: number;
  briefs: number;
  tasks: number;
  assets: number;
  aiRuns: number;
  pendingReviews: number;
}

export const BRAND_PROJECT_STATUS_LABELS: Record<BrandProjectStatus, string> = {
  planejamento: "Planejamento",
  briefing: "Briefing",
  producao: "Producao",
  revisao: "Revisao",
  aprovado: "Aprovado",
  arquivado: "Arquivado",
};

export const BRAND_TASK_STATUS_LABELS: Record<BrandTaskStatus, string> = {
  pendente: "Pendente",
  em_execucao: "Em execucao",
  em_revisao: "Em revisao",
  concluida: "Concluida",
  cancelada: "Cancelada",
};
