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

type FlyerSection = {
  titulo: string;
  conteudo: string;
};

type FlyerOutput = {
  formato: string;
  headline: string;
  subheadline: string;
  secoes: FlyerSection[];
  layout_direction: string;
  cta: {
    label: string;
    action: string;
  };
  prompt_visual: string;
  notas_impressao: string[];
  notas_digital: string[];
};

type RequestPayload = {
  project?: JsonObject;
  brief?: JsonObject;
  references?: JsonObject[];
  strategy?: JsonObject | null;
  palette?: JsonObject | null;
  typography?: JsonObject | null;
  logo?: JsonObject | null;
  normalized_context?: JsonObject | null;
  fallback?: FlyerOutput;
  prompt_version?: string;
};

const asList = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))] : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallback(brief: JsonObject, strategy?: JsonObject | null): FlyerOutput {
  const brand = toText(brief?.nome_marca || "Marca");
  const positioning = toText((strategy as JsonObject | undefined)?.posicionamento || brief?.proposta_valor || "");

  return {
    formato: "A5 vertical",
    headline: `${brand}: transforme a percepcao da sua marca`,
    subheadline: positioning || "Proposta de valor estrategica",
    secoes: [
      { titulo: "Sobre", conteudo: "Resumo curto do diferencial e beneficio principal." },
      { titulo: "Destaques", conteudo: "3 bullets com prova, resultado ou vantagem competitiva." },
      { titulo: "Servicos", conteudo: "Lista resumida das solucoes ou planos principais." },
    ],
    layout_direction: "Topo com headline e hero visual, miolo com tres blocos alinhados, rodape com CTA forte e QR code.",
    cta: { label: "Fale com a equipe", action: "Agende pelo WhatsApp ou acesse o site" },
    prompt_visual: `Flyer institucional A5 para ${brand}. Layout vertical, grid modular, paleta aprovada, tipografia consistente, textura sutil, destaque para CTA e QR code. Direcao: ${positioning || "posicionamento estrategico"}.`,
    notas_impressao: ["Margem de seguranca 4 mm e sangria 3 mm.", "Exportar em CMYK, 300 DPI."],
    notas_digital: ["Versao 1080x1350 px para redes sociais.", "Garantir contraste minimo AA para texto pequeno."],
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceOutput(candidate: unknown, fallback: FlyerOutput): FlyerOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const raw = (candidate as { output?: unknown }).output ?? candidate;
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;

  const sections = Array.isArray(payload.secoes) ? (payload.secoes as FlyerSection[]) : fallback.secoes;

  return {
    formato: toText(payload.formato || fallback.formato),
    headline: toText(payload.headline || fallback.headline),
    subheadline: toText(payload.subheadline || fallback.subheadline),
    secoes: sections.length ? sections : fallback.secoes,
    layout_direction: toText(payload.layout_direction || fallback.layout_direction),
    cta: {
      label: toText((payload.cta as { label?: string } | undefined)?.label || fallback.cta.label),
      action: toText((payload.cta as { action?: string } | undefined)?.action || fallback.cta.action),
    },
    prompt_visual: toText(payload.prompt_visual || fallback.prompt_visual),
    notas_impressao: asList(payload.notas_impressao).length ? asList(payload.notas_impressao) : fallback.notas_impressao,
    notas_digital: asList(payload.notas_digital).length ? asList(payload.notas_digital) : fallback.notas_digital,
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
    const text = await response.text();
    throw new Error(`${provider.name} [${response.status}] ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`${provider.name}: resposta vazia`);
  }

  return content as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as RequestPayload;
    const brief = payload?.brief || {};
    const fallback = payload?.fallback || buildFallback(brief, payload?.strategy || null);

    let output = fallback;
    let usedFallback = true;
    let providerUsed = "local-flyer";
    let modelUsed = "flyer-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "flyer_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "flyer_agent", {
          temperature: 0.35,
          max_tokens: 2600,
        });

        const systemPrompt = [
          "Voce e o flyer_agent da HolyNex.",
          "Gere conteudo e direcao de layout para flyer profissional.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          "{\"formato\":\"\",\"headline\":\"\",\"subheadline\":\"\",\"secoes\":[{\"titulo\":\"\",\"conteudo\":\"\"}],\"layout_direction\":\"\",\"cta\":{\"label\":\"\",\"action\":\"\"},\"prompt_visual\":\"\",\"notas_impressao\":[\"\"],\"notas_digital\":[\"\"]}",
          "Regras:",
          "- headline deve ser curta e memoravel.",
          "- prompt_visual detalhado e pronto para motor visual.",
          "- notas_impressao e notas_digital devem ter 2-5 itens.",
        ].join("\n");

        const userPrompt = JSON.stringify(
          {
            project: payload.project || {},
            brief,
            strategy: payload.strategy || null,
            palette: payload.palette || null,
            typography: payload.typography || null,
            logo: payload.logo || null,
            normalized_context: payload.normalized_context || brief.normalized_context || {},
            references: payload.references || [],
            fallback,
            prompt_version: payload.prompt_version || "flyer_v1",
          },
          null,
          2
        );

        for (const provider of providers) {
          try {
            const content = await callProvider(
              provider,
              [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Contexto:\n${userPrompt}` },
              ],
              policy
            );

            const parsed = parseResponseContent(content);
            const coerced = coerceOutput(parsed, fallback);
            if (coerced) {
              output = coerced;
              usedFallback = false;
              providerUsed = provider.name;
              modelUsed = provider.model;
              break;
            }
          } catch (_err) {
            continue;
          }
        }
      }
    } catch (_err) {
      usedFallback = true;
    }

    return new Response(
      JSON.stringify({
        output,
        used_fallback: usedFallback,
        provider_used: providerUsed,
        model_used: modelUsed,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar flyer_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
