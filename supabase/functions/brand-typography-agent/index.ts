import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  getAiModelSettings,
  getAiProviderSettings,
  getPromptPolicies,
  resolveAiProviders,
  resolvePromptPolicy,
} from "../_shared/system-settings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type JsonObject = Record<string, unknown>;

type TypographyFont = {
  nome: string;
  categoria: string;
  usos: string[];
};

type TypographyWeight = {
  fonte: string;
  pesos: string[];
};

type TypographyOutput = {
  fontes_sugeridas: TypographyFont[];
  pesos: TypographyWeight[];
  fallback: string[];
  regras_uso: string[];
  regras_evitar: string[];
};

type ReferenceInput = {
  reference_type?: string;
  signed_url?: string | null;
  public_url?: string | null;
  source_url?: string | null;
  storage_path?: string | null;
  note?: string | null;
};

type BriefInput = {
  nome_marca?: string | null;
  slogan?: string | null;
  nicho?: string | null;
  publico_alvo_detalhado?: string | null;
  publico_alvo?: string | null;
  proposta_valor?: string | null;
  concorrentes?: string[] | null;
  estilos_desejados?: string[] | null;
  estilos_evitar?: string[] | null;
  objetivos_identidade?: string[] | null;
  referencia_visual_contexto?: string | null;
  contexto?: string | null;
  observacoes_adicionais?: string | null;
};

type RequestPayload = {
  project?: JsonObject;
  brief?: BriefInput;
  references?: ReferenceInput[];
  strategy?: JsonObject | null;
  fallback?: TypographyOutput;
  prompt_version?: string;
};

const toText = (value: unknown) => String(value || "").trim();

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

function buildFallback(brief: BriefInput, strategy?: JsonObject | null): TypographyOutput {
  const tone = (strategy as any)?.tom_visual || brief.estilos_desejados?.[0] || "moderno";
  const niche = brief.nicho || "mercado";

  return {
    fontes_sugeridas: [
      { nome: "IBM Plex Sans", categoria: "sans", usos: ["interfaces", "textos longos"] },
      { nome: "Playfair Display", categoria: "serif", usos: ["titulos", "destaques"] },
    ],
    pesos: [
      { fonte: "IBM Plex Sans", pesos: ["300", "400", "500", "600"] },
      { fonte: "Playfair Display", pesos: ["400", "600", "700"] },
    ],
    fallback: ["system-ui", "-apple-system", "Segoe UI", "Arial", "sans-serif"],
    regras_uso: [
      `Priorizar ${tone} e legibilidade em todos os canais do setor de ${niche}.`,
      "Usar serif para titulos e sans para corpo para criar contraste hierarquico.",
      "Manter tracking neutro e espacamento de linha 1.4+ para textos longos.",
    ],
    regras_evitar: [
      "Evitar excesso de familias tipograficas (maximo 2).",
      "Nao usar pesos ultrafinos em tamanhos pequenos.",
      "Evitar combinacoes muito decorativas para texto corrido.",
    ],
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceOutput(candidate: unknown, fallback: TypographyOutput): TypographyOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  const fontes = Array.isArray(raw.fontes_sugeridas) ? raw.fontes_sugeridas : fallback.fontes_sugeridas;
  const pesos = Array.isArray(raw.pesos) ? raw.pesos : fallback.pesos;

  return {
    fontes_sugeridas: fontes.map((item, index) => {
      const base = fallback.fontes_sugeridas[index] || fallback.fontes_sugeridas[0];
      const payload = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
      return {
        nome: toText(payload.nome || base.nome),
        categoria: toText(payload.categoria || base.categoria),
        usos: asList(payload.usos).length ? asList(payload.usos) : base.usos,
      };
    }),
    pesos: pesos.map((item, index) => {
      const base = fallback.pesos[index] || fallback.pesos[0];
      const payload = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
      return {
        fonte: toText(payload.fonte || base.fonte),
        pesos: asList(payload.pesos).length ? asList(payload.pesos) : base.pesos,
      };
    }),
    fallback: asList(raw.fallback).length ? asList(raw.fallback) : fallback.fallback,
    regras_uso: asList(raw.regras_uso).length ? asList(raw.regras_uso) : fallback.regras_uso,
    regras_evitar: asList(raw.regras_evitar).length ? asList(raw.regras_evitar) : fallback.regras_evitar,
  };
}

async function callProvider(
  provider: { name: string; url: string; apiKey: string; model: string; headers?: Record<string, string> },
  messages: Array<{ role: string; content: string }>,
  policy: { temperature: number; max_tokens: number }
) {
  const response = await fetch(provider.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
      ...(provider.headers || {}),
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: policy.temperature,
      max_tokens: policy.max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.name} error: ${errorText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${provider.name} empty response`);
  return { content, provider: provider.name, model: provider.model };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as RequestPayload;
    const brief = body.brief || {};
    const references = body.references || [];
    const strategy = body.strategy || null;
    const fallback = body.fallback || buildFallback(brief, strategy);
    const promptVersion = body.prompt_version || "brand_typography_v1";

    const providerSettings = await getAiProviderSettings();
    const modelSettings = await getAiModelSettings();
    const promptPolicies = await getPromptPolicies();
    const providers = resolveAiProviders(providerSettings, modelSettings, "brand_typography_agent");
    const policy = resolvePromptPolicy(promptPolicies, "brand_typography_agent", { temperature: 0.3, max_tokens: 2400 });

    if (!providers.length) {
      return new Response(
        JSON.stringify({ output: fallback, used_fallback: true, provider_used: "local", model_used: "fallback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = {
      role: "user",
      content: `Gere um conjunto tipografico para a marca com base no briefing, estrategia e referencias.
Responda SOMENTE com JSON valido, sem markdown.

Formato esperado:
{
  "fontes_sugeridas": [{"nome":"","categoria":"","usos":[]}],
  "pesos": [{"fonte":"","pesos":[]}],
  "fallback": [""],
  "regras_uso": [""],
  "regras_evitar": [""]
}

Briefing: ${JSON.stringify(brief)}
Estrategia: ${JSON.stringify(strategy)}
Referencias: ${JSON.stringify(references)}
Fallback: ${JSON.stringify(fallback)}
Prompt version: ${promptVersion}`,
    };

    const messages = [
      {
        role: "system",
        content: "Voce e um diretor de tipografia. Responda apenas JSON valido.",
      },
      prompt,
    ];

    for (const provider of providers) {
      try {
        const response = await callProvider(provider, messages, policy);
        const parsed = parseResponseContent(response.content);
        const output = coerceOutput(parsed, fallback);
        if (output) {
          return new Response(
            JSON.stringify({
              output,
              used_fallback: false,
              provider_used: response.provider,
              model_used: response.model,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (err) {
        console.warn("provider failed", provider.name, err instanceof Error ? err.message : err);
      }
    }

    return new Response(
      JSON.stringify({ output: fallback, used_fallback: true, provider_used: "fallback", model_used: "fallback" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "unexpected_error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
