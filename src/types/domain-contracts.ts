/**
 * Domain Contracts — frozen interfaces and enums that must not be broken
 * without backward-compatible migration.
 *
 * These represent the minimum stable API surface between frontend and backend.
 */

// ── Orcamento (Lead) ─────────────────────────────────────────────────
export type OrcamentoStatus = "pendente" | "recebido" | "rejeitado";

export type StatusComercial =
  | "novo"
  | "em_analise"
  | "qualificado"
  | "aguardando_contato"
  | "proposta_em_preparacao"
  | "proposta_enviada"
  | "convertido"
  | "perdido"
  | "arquivado";

// ── Proposta ──────────────────────────────────────────────────────────
export type ProposalStatus =
  | "rascunho"
  | "em_revisao"
  | "pronta"
  | "enviada"
  | "aceita"
  | "recusada"
  | "expirada";

export type TierType = "starter" | "mvp" | "ideal" | "premium";
export type ScopeStatus = "included" | "optional" | "not_included";

// ── Project ──────────────────────────────────────────────────────────
export type ProjectStatus =
  | "discovery"
  | "proposal"
  | "active"
  | "paused"
  | "delivered"
  | "maintenance"
  | "cancelled";

// ── Delivered System ─────────────────────────────────────────────────
export type SupportStatus = "suporte_ativo" | "suporte_eventual" | "sem_suporte" | "suporte_encerrado";
export type OperationalStatus = "em_uso" | "descontinuado" | "arquivado" | "base_reutilizavel" | "case_interno";

// ── Security / RBAC ──────────────────────────────────────────────────
export type RoleName =
  | "super_admin"
  | "dev_admin"
  | "admin_comercial"
  | "admin_operacional"
  | "admin_tecnico"
  | "financeiro"
  | "conteudo_portfolio"
  | "suporte"
  | "somente_leitura";

// ── AI ───────────────────────────────────────────────────────────────
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

// ── Add-ons ──────────────────────────────────────────────────────────
export type AddonStatus = "suggested" | "approved_internal" | "available_for_activation" | "activated" | "archived";
export type AddonSourceContext = "lead" | "proposta" | "sistema";

// ── Priority / Urgency (shared) ──────────────────────────────────────
export type Priority = "critical" | "high" | "medium" | "low";
export type Urgency = "sem_urgencia" | "baixa" | "media" | "alta" | "critica";

// ── Future schemas (placeholders — DO NOT implement yet) ─────────────
/** Will hold structured AI analysis output */
export interface AnalysisResult { _placeholder: true }
/** Will hold PDF document specification */
export interface DocumentSpec { _placeholder: true }
/** Will hold pricing sheet for tiers */
export interface PricingSheet { _placeholder: true }
/** Will hold stitch prompt for AI generation */
export interface StitchPrompt { _placeholder: true }
/** Will hold hidden addon configuration */
export interface HiddenAddonConfig { _placeholder: true }
