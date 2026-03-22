import { supabase } from "@/integrations/supabase/client";

const sb = supabase as any;

export type SystemSettingKey =
  | "ai_providers"
  | "ai_models"
  | "prompt_policies"
  | "proposal_rules"
  | "pdf_rules"
  | "addon_rules"
  | "portfolio_rules"
  | "feature_flags";

export interface AiProviderConfig {
  name: string;
  enabled: boolean;
  url: string;
  model: string;
  headers?: Record<string, string>;
  priority?: number;
}

export interface AiProvidersSettings {
  default_provider: string;
  fallback_order: string[];
  fallback_enabled: boolean;
  temperature: number;
  max_tokens: number;
  providers: AiProviderConfig[];
}

export const DEFAULT_SYSTEM_SETTINGS: Record<SystemSettingKey, any> = {
  ai_providers: {
    default_provider: "OpenRouter",
    fallback_order: ["OpenRouter", "Groq", "Genspark", "Lovable AI"],
    fallback_enabled: true,
    temperature: 0.3,
    max_tokens: 4000,
    providers: [
      {
        name: "OpenRouter",
        enabled: true,
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemini-2.5-flash",
        headers: { "HTTP-Referer": "https://holynexlabs.com.br", "X-Title": "HolyNex Labs" },
        priority: 2,
      },
      {
        name: "Groq",
        enabled: true,
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile",
        priority: 1,
      },
      {
        name: "Genspark",
        enabled: false,
        url: "https://api.genspark.ai/v1/chat/completions",
        model: "genspark-lite",
        priority: 3,
      },
      {
        name: "Lovable AI",
        enabled: false,
        url: "https://ai.gateway.lovable.dev/v1/chat/completions",
        model: "google/gemini-3-flash-preview",
        priority: 4,
      },
    ],
  },
  ai_models: {
    default_model: "google/gemini-2.5-flash",
    provider_overrides: {},
    use_case_overrides: {},
  },
  prompt_policies: {
    temperature: 0.3,
    max_tokens: 4000,
    use_case_overrides: {},
  },
  proposal_rules: {
    pricing_floor: 3000,
    module_price_range: "800-2500",
    integration_price_range: "500-1500",
    maintenance_percent_range: "8-15",
    style_notes: "consultivo, profissional, sem exageros",
  },
  pdf_rules: {
    include_portfolio_section: true,
    include_pricing_sheet: true,
    include_document_spec: true,
  },
  addon_rules: {
    allow_hidden_activation: true,
    require_dev_admin: true,
  },
  portfolio_rules: {
    max_related_items: 6,
    require_preview: true,
  },
  feature_flags: {
    system_profile: {
      agency_name: "HolyNex",
      agency_email: "",
      agency_phone: "",
    },
    notifications: {
      leads: true,
      proposals: true,
    },
    hidden_addons: false,
  },
};

export interface SystemSettingRow {
  id: string;
  key: string;
  category: string;
  value: any;
  version: number;
  is_active: boolean;
  is_sensitive: boolean;
  criado_em: string;
  atualizado_em: string;
}

export function normalizeAiProviders(input: any): AiProvidersSettings {
  const defaults = DEFAULT_SYSTEM_SETTINGS.ai_providers as AiProvidersSettings;
  if (!input || typeof input !== "object") return defaults;

  const providers = Array.isArray(input.providers)
    ? input.providers
    : Object.values(input.providers || {});

  return {
    ...defaults,
    ...input,
    providers: (providers as AiProviderConfig[]).map((provider) => ({
      ...defaults.providers.find((p) => p.name === provider.name),
      ...provider,
    })),
  };
}

export async function getActiveSettings(keys: SystemSettingKey[]) {
  const { data, error } = await sb
    .from("system_settings" as any)
    .select("*")
    .in("key", keys)
    .eq("is_active", true);

  if (error) throw error;

  const map = new Map<string, SystemSettingRow>();
  (data || []).forEach((row: SystemSettingRow) => {
    const existing = map.get(row.key);
    if (!existing || row.version > existing.version) {
      map.set(row.key, row);
    }
  });

  return map;
}

export async function setVersionedSetting(
  key: SystemSettingKey,
  category: SystemSettingKey,
  value: any,
  isSensitive = false
) {
  const { data: current, error } = await sb
    .from("system_settings" as any)
    .select("id, version")
    .eq("key", key)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && (error as any).code !== "PGRST116") throw error;

  const nextVersion = (current?.version || 0) + 1;
  if (current?.id) {
    const { error: updateError } = await sb
      .from("system_settings" as any)
      .update({ is_active: false })
      .eq("id", current.id);
    if (updateError) throw updateError;
  }

  const { error: insertError } = await sb
    .from("system_settings" as any)
    .insert({ key, category, value, version: nextVersion, is_active: true, is_sensitive: isSensitive });
  if (insertError) throw insertError;
}
