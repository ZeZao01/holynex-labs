import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AiProviderConfig {
  name: string;
  enabled: boolean;
  url: string;
  model: string;
  headers?: Record<string, string>;
  priority?: number;
}

export interface AiProvidersSettings {
  default_provider?: string;
  fallback_order?: string[];
  fallback_enabled?: boolean;
  temperature?: number;
  max_tokens?: number;
  providers?: AiProviderConfig[] | Record<string, AiProviderConfig>;
}

export interface AiModelsSettings {
  default_model?: string;
  provider_overrides?: Record<string, string>;
  use_case_overrides?: Record<string, Record<string, string>>;
}

export interface PromptPoliciesSettings {
  temperature?: number;
  max_tokens?: number;
  use_case_overrides?: Record<string, { temperature?: number; max_tokens?: number }>;
}

export interface AiProviderRuntime {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  headers?: Record<string, string>;
}

export const DEFAULT_AI_PROVIDERS: AiProvidersSettings = {
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
};

export const DEFAULT_AI_MODELS: AiModelsSettings = {
  default_model: "google/gemini-2.5-flash",
  provider_overrides: {},
  use_case_overrides: {},
};

export const DEFAULT_PROMPT_POLICIES: PromptPoliciesSettings = {
  temperature: 0.3,
  max_tokens: 4000,
  use_case_overrides: {},
};

const PROVIDER_ENV_MAP: Record<string, string> = {
  "OpenRouter": "OPENROUTER_API_KEY",
  "Groq": "GROQ_API_KEY",
  "Genspark": "GENSPARK_API_KEY",
  "Lovable AI": "LOVABLE_API_KEY",
};

function createServiceClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function getSystemSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    const sb = createServiceClient();
    if (!sb) return fallback;

    const { data, error } = await sb
      .from("system_settings")
      .select("value, version")
      .eq("key", key)
      .eq("is_active", true)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data?.value) return fallback;
    return data.value as T;
  } catch {
    return fallback;
  }
}

export async function getAiProviderSettings() {
  return getSystemSetting<AiProvidersSettings>("ai_providers", DEFAULT_AI_PROVIDERS);
}

export async function getAiModelSettings() {
  return getSystemSetting<AiModelsSettings>("ai_models", DEFAULT_AI_MODELS);
}

export async function getPromptPolicies() {
  return getSystemSetting<PromptPoliciesSettings>("prompt_policies", DEFAULT_PROMPT_POLICIES);
}

function normalizeProviders(settings: AiProvidersSettings): AiProviderConfig[] {
  if (Array.isArray(settings.providers)) return settings.providers as AiProviderConfig[];
  if (settings.providers && typeof settings.providers === "object") return Object.values(settings.providers);
  return DEFAULT_AI_PROVIDERS.providers as AiProviderConfig[];
}

export function resolveAiProviders(
  providersSettings: AiProvidersSettings,
  modelSettings: AiModelsSettings,
  useCase: string
): AiProviderRuntime[] {
  const settings = { ...DEFAULT_AI_PROVIDERS, ...providersSettings } as AiProvidersSettings;
  const modelOverrides = modelSettings?.provider_overrides || {};
  const useCaseOverrides = modelSettings?.use_case_overrides?.[useCase] || {};

  const providers = normalizeProviders(settings)
    .map((provider) => {
      const envKey = PROVIDER_ENV_MAP[provider.name];
      const apiKey = envKey ? Deno.env.get(envKey) : undefined;
      if (!provider.enabled || !apiKey) return null;

      const overrideModel = useCaseOverrides[provider.name] || modelOverrides[provider.name];
      const finalModel = overrideModel || provider.model || modelSettings?.default_model || DEFAULT_AI_MODELS.default_model;

      return {
        name: provider.name,
        url: provider.url,
        apiKey,
        model: finalModel,
        headers: provider.headers,
        priority: provider.priority,
      } as AiProviderRuntime & { priority?: number };
    })
    .filter(Boolean) as (AiProviderRuntime & { priority?: number })[];

  const fallbackOrder = settings.fallback_order || [];
  const sorted = providers.sort((a, b) => {
    const aIndex = fallbackOrder.indexOf(a.name);
    const bIndex = fallbackOrder.indexOf(b.name);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return (a.priority ?? 99) - (b.priority ?? 99);
  });

  if (settings.default_provider) {
    const preferred = sorted.find((p) => p.name === settings.default_provider);
    if (preferred) {
      const others = sorted.filter((p) => p.name !== settings.default_provider);
      return settings.fallback_enabled === false ? [preferred] : [preferred, ...others];
    }
  }

  if (settings.fallback_enabled === false) {
    return sorted.length ? [sorted[0]] : [];
  }

  return sorted;
}

export function resolvePromptPolicy(
  policies: PromptPoliciesSettings,
  useCase: string,
  defaults: { temperature: number; max_tokens: number }
) {
  const base = { ...DEFAULT_PROMPT_POLICIES, ...policies };
  const overrides = base.use_case_overrides?.[useCase] || {};
  return {
    temperature: overrides.temperature ?? base.temperature ?? defaults.temperature,
    max_tokens: overrides.max_tokens ?? base.max_tokens ?? defaults.max_tokens,
  };
}
