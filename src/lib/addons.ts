import { supabase } from "@/integrations/supabase/client";
import { logAction } from "@/lib/audit-logs";

export type AddonSourceContext = "lead" | "proposta" | "sistema";
export type AddonStatus = "suggested" | "approved_internal" | "available_for_activation" | "activated" | "archived";

export const ADDON_STATUS_MAP: Record<AddonStatus, { label: string; badge: string; helper: string }> = {
  suggested: { label: "Sugerido", badge: "pending", helper: "Sugestao inicial (IA ou time)" },
  approved_internal: { label: "Aprovado Interno", badge: "warm", helper: "Revisado pelo time" },
  available_for_activation: { label: "Disponivel para Ativar", badge: "active", helper: "Liberado para ativacao" },
  activated: { label: "Ativado", badge: "delivered", helper: "Ativado por dev_admin" },
  archived: { label: "Arquivado", badge: "paused", helper: "Fora de uso" },
};

export const ADDON_SOURCE_LABELS: Record<AddonSourceContext, string> = {
  lead: "Lead",
  proposta: "Proposta",
  sistema: "Sistema",
};

export interface Addon {
  id: string;
  source_context: AddonSourceContext;
  source_id: string | null;
  name: string;
  internal_description: string;
  commercial_description: string;
  technical_impact: string;
  estimated_value: number;
  dependencies: string[];
  activation_flag: boolean;
  status: AddonStatus;
  suggested_by: string;
  niche: string;
  module_scope: string[];
  criado_em?: string;
  atualizado_em?: string;
}

type AddonRow = Partial<Addon> & { [key: string]: any };

function normalizeRow(row: AddonRow): Addon {
  return {
    id: String(row.id || ""),
    source_context: (row.source_context || "lead") as AddonSourceContext,
    source_id: row.source_id || null,
    name: row.name || "",
    internal_description: row.internal_description || "",
    commercial_description: row.commercial_description || "",
    technical_impact: row.technical_impact || "",
    estimated_value: Number(row.estimated_value) || 0,
    dependencies: Array.isArray(row.dependencies) ? row.dependencies : [],
    activation_flag: !!row.activation_flag,
    status: (row.status || "suggested") as AddonStatus,
    suggested_by: row.suggested_by || "",
    niche: row.niche || "",
    module_scope: Array.isArray(row.module_scope) ? row.module_scope : [],
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
  };
}

export async function getAddons(filters?: { status?: AddonStatus; source_context?: AddonSourceContext }) {
  let query = supabase.from("addon_extensions" as any).select("*").order("criado_em", { ascending: false });
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.source_context) query = query.eq("source_context", filters.source_context);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(normalizeRow) as Addon[];
}

export async function getAddonsBySource(source_context: AddonSourceContext, source_id: string) {
  const { data, error } = await supabase
    .from("addon_extensions" as any)
    .select("*")
    .eq("source_context", source_context)
    .eq("source_id", source_id)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeRow) as Addon[];
}

export async function createAddon(payload: Partial<Addon>) {
  const insertPayload: any = {
    source_context: payload.source_context,
    source_id: payload.source_id || null,
    name: payload.name || "",
    internal_description: payload.internal_description || "",
    commercial_description: payload.commercial_description || "",
    technical_impact: payload.technical_impact || "",
    estimated_value: payload.estimated_value ?? 0,
    dependencies: payload.dependencies || [],
    activation_flag: payload.activation_flag ?? false,
    status: payload.status || "suggested",
    suggested_by: payload.suggested_by || "manual",
    niche: payload.niche || "",
    module_scope: payload.module_scope || [],
  };

  const { data, error } = await supabase
    .from("addon_extensions" as any)
    .insert(insertPayload)
    .select("*")
    .single();
  if (error) throw error;

  await logAction("create", "addon", String(data?.id || ""), {
    source_context: insertPayload.source_context,
    source_id: insertPayload.source_id,
    status: insertPayload.status,
  });

  return normalizeRow(data as AddonRow);
}

export async function updateAddonStatus(id: string, status: AddonStatus, metadata: Record<string, any> = {}) {
  const updates: any = {
    status,
    activation_flag: status === "activated",
    atualizado_em: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("addon_extensions" as any)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  await logAction(status === "activated" ? "activate" : "status_change", "addon", id, {
    status,
    ...metadata,
  });

  return normalizeRow(data as AddonRow);
}
