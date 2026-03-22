import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export interface PortfolioItem {
  id: string;
  delivered_system_id: string | null;
  title: string;
  slug: string | null;
  subtitle: string | null;
  short_description: string | null;
  full_description: string | null;
  commercial_description: string | null;
  problem_solved: string | null;
  target_audience: string | null;
  features: string[] | null;
  differentials: string[] | null;
  tech_stack: string[] | null;
  main_modules: string[] | null;
  thumbnail_url: string | null;
  cover_image_url: string | null;
  hover_image_url: string | null;
  gallery_images: string[] | null;
  gallery_urls: string[] | null;
  video_url: string | null;
  system_url: string | null;
  preview_mode: string | null;
  open_mode: string | null;
  badges: string[] | null;
  category: string | null;
  niche: string | null;
  solution_type: string | null;
  investment_range: string | null;
  objective: string | null;
  item_type: string | null;
  cta_label: string | null;
  cta_url: string | null;
  public_url: string | null;
  allow_public_preview: boolean | null;
  status: string | null;
  sort_order: number | null;
  display_order: number | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  is_highlighted: boolean | null;
  highlight_section: string | null;
  client_context: string | null;
  customization_notes: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
}

export interface PortfolioItemEvent {
  id: string;
  portfolio_item_id: string;
  evento: string;
  descricao: string | null;
  criado_em: string | null;
}

export const ITEM_TYPES = [
  { value: "case_real", label: "Case Real" },
  { value: "projeto_modelo", label: "Projeto Modelo" },
  { value: "solucao_adaptavel", label: "Solução Adaptável" },
  { value: "conceito_validado", label: "Conceito Validado" },
];

export const BADGE_OPTIONS = [
  "Mais Procurado", "Maior Retorno", "Alta Recorrência", "Entrega Rápida",
  "Ideal para MVP", "Alta Margem", "Modelo Reutilizável", "Ótimo para Escalar",
];

export const HIGHLIGHT_SECTIONS = [
  { value: "mais_procurados", label: "Mais Procurados" },
  { value: "maior_retorno", label: "Maior Retorno" },
  { value: "comecar_rapido", label: "Para Começar Rápido" },
  { value: "escalar_operacao", label: "Soluções para Escalar" },
];

export const INVESTMENT_RANGES = [
  "R$ 3.000 - R$ 8.000",
  "R$ 8.000 - R$ 15.000",
  "R$ 15.000 - R$ 30.000",
  "R$ 30.000 - R$ 60.000",
  "R$ 60.000+",
];

export const PORTFOLIO_STATUSES = [
  { value: "draft", label: "Rascunho" },
  { value: "published", label: "Publicado" },
  { value: "archived", label: "Arquivado" },
];

export const PREVIEW_MODES = [
  { value: "none", label: "Sem preview" },
  { value: "thumbnail", label: "Thumbnail" },
  { value: "iframe", label: "Preview incorporado (iframe)" },
  { value: "image_mockup", label: "Mockup de tela" },
  { value: "mixed", label: "Misto (iframe com fallback)" },
];

export const OPEN_MODES = [
  { value: "new_tab", label: "Nova aba" },
  { value: "same_tab", label: "Mesma aba" },
  { value: "modal", label: "Modal" },
];

// ── CRUD ──
export async function listPortfolioItems(onlyActive = false) {
  let query = sb
    .from("portfolio_items")
    .select("*")
    .order("sort_order", { ascending: true, nullsFirst: true })
    .order("display_order", { ascending: true, nullsFirst: true });
  if (onlyActive) {
    query = query
      .or("status.eq.published,status.is.null")
      .or("is_active.eq.true,is_active.is.null");
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as PortfolioItem[];
}

export async function getPortfolioItem(id: string) {
  const { data, error } = await sb.from("portfolio_items").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as PortfolioItem | null;
}

export async function getPortfolioItemBySlug(title: string) {
  const { data, error } = await sb
    .from("portfolio_items")
    .select("*")
    .eq("slug", title)
    .maybeSingle();
  if (error) throw error;
  return data as PortfolioItem | null;
}

export async function savePortfolioItem(item: Partial<PortfolioItem>) {
  const payload = { ...item, atualizado_em: new Date().toISOString() };
  const query = item.id
    ? sb.from("portfolio_items").update(payload).eq("id", item.id)
    : sb.from("portfolio_items").insert([payload as any]);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as PortfolioItem;
}

export async function deletePortfolioItem(id: string) {
  const { error } = await sb.from("portfolio_items").delete().eq("id", id);
  if (error) throw error;
}

export async function addPortfolioEvent(itemId: string, evento: string, descricao?: string) {
  await sb.from("portfolio_item_events").insert([{ portfolio_item_id: itemId, evento, descricao: descricao || "" }]);
}

export async function getPortfolioEvents(itemId: string) {
  const { data, error } = await sb.from("portfolio_item_events").select("*").eq("portfolio_item_id", itemId).order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as PortfolioItemEvent[];
}

// Upload image to portfolio bucket
export async function uploadPortfolioImage(file: File, folder: string = "thumbnails"): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolio").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  return data.publicUrl;
}
