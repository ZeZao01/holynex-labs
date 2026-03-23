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

type ColorToken = {
  nome: string;
  hex: string;
  role?: string;
  usage?: string;
};

type PaletteOutput = {
  paleta_principal: ColorToken[];
  paleta_secundaria: ColorToken[];
  neutros: ColorToken[];
  destaque: ColorToken;
  rationale: string;
  acessibilidade: {
    notas: string;
    contrastes_recomendados: string[];
    evitar: string[];
  };
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
  fallback?: PaletteOutput;
  prompt_version?: string;
};

const toText = (value: unknown) => String(value || "").trim();

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const ensureHex = (value: unknown, fallback: string) => {
  const text = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text.toUpperCase();
  return fallback;
};

function buildFallback(brief: BriefInput, strategy?: JsonObject | null): PaletteOutput {
  const brand = brief.nome_marca || "Marca";
  const tone = (strategy as any)?.tom_visual || brief.estilos_desejados?.[0] || "sofisticado";

  return {
    paleta_principal: [
      { nome: "Navy 900", hex: "#0B1D2E", role: "base", usage: "cabecalhos, fundos escuros" },
      { nome: "Navy 700", hex: "#1D3557", role: "primaria", usage: "botoes, links" },
      { nome: "Teal 600", hex: "#2A7F7A", role: "apoio", usage: "destaques secundarios" },
    ],
    paleta_secundaria: [
      { nome: "Terracotta 500", hex: "#D9734F", role: "acentos", usage: "tags, highlights" },
      { nome: "Sand 300", hex: "#E7D6C3", role: "superficie", usage: "cards e planos" },
    ],
    neutros: [
      { nome: "Slate 900", hex: "#111418", role: "texto", usage: "texto principal" },
      { nome: "Slate 600", hex: "#5B6472", role: "muted", usage: "texto secundario" },
      { nome: "Stone 100", hex: "#F4F2EE", role: "background", usage: "fundos claros" },
      { nome: "White", hex: "#FFFFFF", role: "white", usage: "espacos negativos" },
    ],
    destaque: { nome: "Amber 500", hex: "#F2A900", role: "cta", usage: "acoes prioritarias" },
    rationale: `Paleta alinhada ao tom ${tone} da ${brand}, equilibrando autoridade e calor humano.`,
    acessibilidade: {
      notas: "Priorizar contraste AA em textos, com combinacoes Navy/Stone e Slate/White.",
      contrastes_recomendados: ["Navy 900 com Stone 100", "Slate 900 com White", "Teal 600 com Stone 100"],
      evitar: ["Terracotta 500 com Amber 500", "Slate 600 com Sand 300"],
    },
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

function coerceList(value: unknown, fallback: ColorToken[]): ColorToken[] {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .map((item) => (typeof item === "object" && item ? (item as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((item, index) => {
      const base = fallback[index] || fallback[0];
      return {
        nome: toText(item?.nome || base.nome),
        hex: ensureHex(item?.hex, base.hex),
        role: toText(item?.role || base.role || ""),
        usage: toText(item?.usage || base.usage || ""),
      };
    });
  return list.length ? list : fallback;
}

function coerceOutput(candidate: unknown, fallback: PaletteOutput): PaletteOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  const destaqueRaw = raw.destaque && typeof raw.destaque === "object" ? (raw.destaque as Record<string, unknown>) : null;

  return {
    paleta_principal: coerceList(raw.paleta_principal, fallback.paleta_principal),
    paleta_secundaria: coerceList(raw.paleta_secundaria, fallback.paleta_secundaria),
    neutros: coerceList(raw.neutros, fallback.neutros),
    destaque: {
      nome: toText(destaqueRaw?.nome || fallback.destaque.nome),
      hex: ensureHex(destaqueRaw?.hex, fallback.destaque.hex),
      role: toText(destaqueRaw?.role || fallback.destaque.role || "cta"),
      usage: toText(destaqueRaw?.usage || fallback.destaque.usage || "acoes"),
    },
    rationale: toText(raw.rationale || fallback.rationale),
    acessibilidade: {
      notas: toText((raw.acessibilidade as any)?.notas || fallback.acessibilidade.notas),
      contrastes_recomendados: asList((raw.acessibilidade as any)?.contrastes_recomendados).length
        ? asList((raw.acessibilidade as any)?.contrastes_recomendados)
        : fallback.acessibilidade.contrastes_recomendados,
      evitar: asList((raw.acessibilidade as any)?.evitar).length
        ? asList((raw.acessibilidade as any)?.evitar)
        : fallback.acessibilidade.evitar,
    },
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
    const promptVersion = body.prompt_version || "brand_palette_v1";

    const providerSettings = await getAiProviderSettings();
    const modelSettings = await getAiModelSettings();
    const promptPolicies = await getPromptPolicies();
    const providers = resolveAiProviders(providerSettings, modelSettings, "brand_palette_agent");
    const policy = resolvePromptPolicy(promptPolicies, "brand_palette_agent", { temperature: 0.3, max_tokens: 2400 });

    if (!providers.length) {
      return new Response(
        JSON.stringify({ output: fallback, used_fallback: true, provider_used: "local", model_used: "fallback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = {
      role: "user",
      content: `Gere uma paleta de cores para a marca com base no briefing, estrategia e referencias.
Responda SOMENTE com JSON valido, sem markdown.

Formato esperado:
{
  "paleta_principal": [{"nome":"","hex":"#RRGGBB","role":"","usage":""}],
  "paleta_secundaria": [{"nome":"","hex":"#RRGGBB","role":"","usage":""}],
  "neutros": [{"nome":"","hex":"#RRGGBB","role":"","usage":""}],
  "destaque": {"nome":"","hex":"#RRGGBB","role":"","usage":""},
  "rationale": "",
  "acessibilidade": {"notas":"","contrastes_recomendados":[],"evitar":[]}
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
        content: "Voce e um diretor de arte especializado em identidade visual. Responda apenas JSON valido.",
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
