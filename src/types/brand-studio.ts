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

export interface BrandProject {
  id: string;
  nome: string;
  slug: string | null;
  status: BrandProjectStatus;
  descricao: string | null;
  owner_user_id: string | null;
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
  objetivos: string[] | null;
  publico_alvo: string | null;
  restricoes: string[] | null;
  status: string;
  version: number;
  created_by: string | null;
  criado_em: string;
  atualizado_em: string;
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
