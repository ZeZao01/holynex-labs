// Tiered proposal types, defaults, and helpers

export type TierType = "starter" | "mvp" | "ideal" | "premium";
export type ScopeStatus = "included" | "optional" | "not_included";
export type ProposalStatus = "rascunho" | "em_revisao" | "pronta" | "enviada" | "aceita" | "recusada" | "expirada";

export interface ScopeModule {
  id: string;
  label: string;
  status: ScopeStatus;
}

export interface ProposalTier {
  id: string;
  type: TierType;
  name: string;
  price: number;
  estimated_days: number;
  description: string;
  detailed_scope: string;
  included_items: string[];
  excluded_items: string[];
  notes: string;
  installments: string;
  is_recommended: boolean;
  is_highlighted: boolean;
  scope_modules: ScopeModule[];
}

export interface ProposalAddon {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  is_optional: boolean;
  is_selected: boolean;
  is_active: boolean;
}

export interface CommercialNotes {
  general_note: string;
  recommendation_justification: string;
  closing_strategy: string;
  next_steps: string;
}

export const TIER_DEFAULTS: Record<TierType, { name: string; color: string; bgClass: string }> = {
  starter: { name: "Starter", color: "text-muted-foreground", bgClass: "bg-muted/30 border-border/50" },
  mvp: { name: "MVP Enxuto", color: "text-amber-400", bgClass: "bg-amber-500/5 border-amber-500/20" },
  ideal: { name: "Projeto Ideal", color: "text-primary", bgClass: "bg-primary/5 border-primary/20" },
  premium: { name: "Premium", color: "text-emerald-400", bgClass: "bg-emerald-500/5 border-emerald-500/20" },
};

export const SCOPE_MODULE_DEFAULTS: { id: string; label: string }[] = [
  { id: "auth", label: "Autenticação" },
  { id: "dashboard", label: "Dashboard" },
  { id: "crud", label: "CRUD Principal" },
  { id: "reports", label: "Relatórios" },
  { id: "pdf", label: "PDF / Documentos" },
  { id: "notifications", label: "Notificações" },
  { id: "integrations", label: "Integrações" },
  { id: "client_area", label: "Área do Cliente" },
  { id: "ai", label: "Inteligência Artificial" },
  { id: "automations", label: "Automações" },
  { id: "multiuser", label: "Multiusuário" },
  { id: "permissions", label: "Permissões" },
  { id: "uploads", label: "Uploads" },
  { id: "scheduling", label: "Agenda" },
  { id: "finance", label: "Financeiro" },
];

export const ADDON_PRESETS: Omit<ProposalAddon, "id">[] = [
  { name: "Implantação Rápida", description: "Setup acelerado com prioridade", category: "Serviço", price: 2000, is_optional: true, is_selected: false, is_active: true },
  { name: "Branding Premium", description: "Design personalizado e identidade visual", category: "Design", price: 3000, is_optional: true, is_selected: false, is_active: true },
  { name: "Integração Extra", description: "Conexão com sistema adicional", category: "Técnico", price: 1500, is_optional: true, is_selected: false, is_active: true },
  { name: "Automação Extra", description: "Fluxo automatizado adicional", category: "Técnico", price: 2000, is_optional: true, is_selected: false, is_active: true },
  { name: "App Mobile", description: "Versão mobile responsiva ou PWA", category: "Técnico", price: 5000, is_optional: true, is_selected: false, is_active: true },
  { name: "Manutenção Mensal", description: "Suporte e manutenção contínua", category: "Serviço", price: 800, is_optional: true, is_selected: false, is_active: true },
  { name: "Suporte Prioritário", description: "Atendimento com SLA reduzido", category: "Serviço", price: 500, is_optional: true, is_selected: false, is_active: true },
  { name: "Onboarding", description: "Treinamento e acompanhamento inicial", category: "Serviço", price: 1500, is_optional: true, is_selected: false, is_active: true },
  { name: "Relatórios Personalizados", description: "Dashboards e relatórios sob medida", category: "Técnico", price: 2500, is_optional: true, is_selected: false, is_active: true },
];

export const PROPOSAL_STATUS_MAP: Record<string, { label: string; color: string; bgClass: string }> = {
  rascunho: { label: "Rascunho", color: "text-muted-foreground", bgClass: "bg-muted/50 border-border/50" },
  em_revisao: { label: "Em Revisão", color: "text-amber-400", bgClass: "bg-amber-500/15 border-amber-500/30" },
  pronta: { label: "Pronta p/ Envio", color: "text-sky-400", bgClass: "bg-sky-500/15 border-sky-500/30" },
  enviada: { label: "Enviada", color: "text-blue-400", bgClass: "bg-blue-500/15 border-blue-500/30" },
  aceita: { label: "Aceita", color: "text-emerald-400", bgClass: "bg-emerald-500/15 border-emerald-500/30" },
  recusada: { label: "Recusada", color: "text-red-400", bgClass: "bg-red-500/15 border-red-500/30" },
  expirada: { label: "Expirada", color: "text-muted-foreground", bgClass: "bg-muted/50 border-border/50" },
  gerada: { label: "Gerada", color: "text-primary", bgClass: "bg-primary/15 border-primary/30" },
};

export function createEmptyTier(type: TierType): ProposalTier {
  const def = TIER_DEFAULTS[type];
  return {
    id: crypto.randomUUID(),
    type,
    name: def.name,
    price: 0,
    estimated_days: 0,
    description: "",
    detailed_scope: "",
    included_items: [],
    excluded_items: [],
    notes: "",
    installments: "",
    is_recommended: type === "ideal",
    is_highlighted: type === "ideal",
    scope_modules: SCOPE_MODULE_DEFAULTS.map(m => ({
      ...m,
      status: type === "premium" ? "included" : type === "ideal" ? "included" : type === "mvp" ? "optional" : "not_included",
    })),
  };
}

export function createDefaultTiers(): ProposalTier[] {
  return (["starter", "mvp", "ideal", "premium"] as TierType[]).map(createEmptyTier);
}

export function createDefaultAddons(): ProposalAddon[] {
  return ADDON_PRESETS.map(a => ({ ...a, id: crypto.randomUUID() }));
}

export function recommendTier(complexity: string, budget: string): TierType {
  const budgetNum = parseFloat(budget.replace(/[^\d]/g, "")) || 0;
  if (budgetNum > 80000 || complexity === "avancada") return "premium";
  if (budgetNum > 40000 || complexity === "alta") return "ideal";
  if (budgetNum > 15000 || complexity === "media") return "mvp";
  return "starter";
}
