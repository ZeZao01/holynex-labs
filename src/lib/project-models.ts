import { supabase } from "@/integrations/supabase/client";

// ── Types ──
export interface ProjectModel {
  id: string;
  title: string;
  subtitle: string;
  slug: string | null;
  category: string;
  niche: string;
  value_proposition: string;
  target_audience: string;
  problem_solved: string;
  commercial_description: string;
  investment_range: string;
  base_deadline: string;
  availability_status: string;
  is_featured: boolean;
  is_active: boolean;
  cta_primary_label: string;
  cta_primary_url: string;
  cta_secondary_label: string;
  cta_secondary_url: string;
  thumbnail_url: string;
  cover_image_url: string;
  gallery_urls: string[];
  video_url: string;
  badges: string[];
  how_it_works: string;
  display_order: number;
  delivered_system_id: string | null;
  portfolio_item_id: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ModelTier {
  id: string;
  model_id: string;
  tier_type: string;
  name: string;
  description: string;
  price_range: string;
  estimated_days: number;
  ideal_client_profile: string;
  is_recommended: boolean;
  display_order: number;
  criado_em: string;
}

export interface ModelModule {
  id: string;
  model_id: string;
  tier_id: string | null;
  name: string;
  category: string;
  is_required: boolean;
  scope_in_tier: string;
  notes: string;
  display_order: number;
  criado_em: string;
}

export interface ModelEvent {
  id: string;
  model_id: string;
  evento: string;
  descricao: string;
  criado_em: string;
}

export interface RankedProjectModel { model: ProjectModel; score: number; reasons: string[] }

export function rankProjectModels(models: ProjectModel[], context: { niche?: string; projectType?: string; objective?: string }): RankedProjectModel[] {
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = normalize([context.niche, context.projectType, context.objective].filter(Boolean).join(" "))
    .split(/[^a-z0-9]+/).filter((term) => term.length >= 4);
  return models.filter((model) => model.is_active).map((model) => {
    const haystack = normalize([model.title, model.subtitle, model.category, model.niche, model.value_proposition, model.target_audience, model.problem_solved, model.commercial_description].join(" "));
    const matches = [...new Set(terms.filter((term) => haystack.includes(term)))];
    const score = matches.length * 12 + (model.is_featured ? 8 : 0) + (model.availability_status === "disponivel" ? 8 : model.availability_status === "adaptavel" ? 5 : 0);
    return { model, score, reasons: [matches.length ? `Compatibilidade com: ${matches.slice(0, 5).join(", ")}` : "Modelo reutilizável disponível no acervo", model.value_proposition || model.problem_solved].filter(Boolean) };
  }).sort((a, b) => b.score - a.score || a.model.display_order - b.model.display_order);
}

// ── Constants ──
export const MODEL_CATEGORIES = [
  "CRM", "ERP Leve", "Portal do Cliente", "Agendamento", "Dashboard Operacional",
  "SaaS Vertical", "Plataforma de Cursos", "Financeiro Leve", "Área Logada",
  "Clínicas", "Home Care", "Marketplace", "Gestão Interna",
];

export const AVAILABILITY_STATUSES = [
  { value: "disponivel", label: "Disponível Agora", color: "emerald" },
  { value: "adaptavel", label: "Adaptável", color: "blue" },
  { value: "sob_consulta", label: "Sob Consulta", color: "amber" },
  { value: "em_validacao", label: "Em Validação Interna", color: "slate" },
];

export const TIER_TYPES = [
  { value: "starter", label: "Entrada / Starter" },
  { value: "growth", label: "Recomendada / Growth" },
  { value: "premium", label: "Premium / Escalável" },
];

export const MODULE_SCOPES = [
  { value: "included", label: "Incluso" },
  { value: "optional", label: "Opcional" },
  { value: "not_included", label: "Não Incluso" },
];

export const MODEL_BADGES = [
  "Mais Procurado", "Maior Retorno", "Alta Recorrência", "Entrega Rápida",
  "Ideal para MVP", "Alta Margem", "Modelo Reutilizável", "Ótimo para Escalar",
  "Novo", "Popular",
];

export const MODULE_CATEGORIES = [
  "Core", "Autenticação", "Operação", "Comercial", "Financeiro",
  "Relatórios", "Comunicação", "Integrações", "IA e Automação",
  "Experiência do Cliente", "Administrativo", "Segurança", "Documentos",
];

// ── Slug helper ──
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ── CRUD Models ──
export async function listModels(onlyActive = false) {
  let q = supabase.from("project_models" as any).select("*").order("display_order", { ascending: true });
  if (onlyActive) q = q.eq("is_active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as unknown as ProjectModel[];
}

export async function getModel(id: string) {
  const { data, error } = await supabase.from("project_models" as any).select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as unknown as ProjectModel | null;
}

export async function getModelBySlug(slug: string) {
  const { data, error } = await supabase.from("project_models" as any).select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error) throw error;
  return data as unknown as ProjectModel | null;
}

export async function saveModel(model: Partial<ProjectModel>) {
  const payload: any = { ...model, atualizado_em: new Date().toISOString() };
  if (payload.title && !payload.slug) payload.slug = generateSlug(payload.title);
  const q = model.id
    ? supabase.from("project_models" as any).update(payload).eq("id", model.id)
    : supabase.from("project_models" as any).insert([payload]);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data as unknown as ProjectModel;
}

export async function deleteModel(id: string) {
  const { error } = await supabase.from("project_models" as any).delete().eq("id", id);
  if (error) throw error;
}

// ── CRUD Tiers ──
export async function listModelTiers(modelId: string) {
  const { data, error } = await supabase.from("project_model_tiers" as any).select("*").eq("model_id", modelId).order("display_order");
  if (error) throw error;
  return (data || []) as unknown as ModelTier[];
}

export async function saveModelTier(tier: Partial<ModelTier>) {
  const q = tier.id
    ? supabase.from("project_model_tiers" as any).update(tier as any).eq("id", tier.id)
    : supabase.from("project_model_tiers" as any).insert([tier as any]);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data as unknown as ModelTier;
}

export async function deleteModelTier(id: string) {
  const { error } = await supabase.from("project_model_tiers" as any).delete().eq("id", id);
  if (error) throw error;
}

// ── CRUD Modules ──
export async function listModelModules(modelId: string) {
  const { data, error } = await supabase.from("project_model_modules" as any).select("*").eq("model_id", modelId).order("display_order");
  if (error) throw error;
  return (data || []) as unknown as ModelModule[];
}

export async function saveModelModule(mod: Partial<ModelModule>) {
  const q = mod.id
    ? supabase.from("project_model_modules" as any).update(mod as any).eq("id", mod.id)
    : supabase.from("project_model_modules" as any).insert([mod as any]);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data as unknown as ModelModule;
}

export async function deleteModelModule(id: string) {
  const { error } = await supabase.from("project_model_modules" as any).delete().eq("id", id);
  if (error) throw error;
}

// ── Events ──
export async function addModelEvent(modelId: string, evento: string, descricao?: string) {
  await supabase.from("project_model_events" as any).insert([{ model_id: modelId, evento, descricao: descricao || "" }]);
}

export async function listModelEvents(modelId: string) {
  const { data, error } = await supabase.from("project_model_events" as any).select("*").eq("model_id", modelId).order("criado_em", { ascending: false }).limit(50);
  if (error) throw error;
  return (data || []) as unknown as ModelEvent[];
}
