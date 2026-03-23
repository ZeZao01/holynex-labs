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

type BusinessCardOutput = {
  formato: string;
  layout_frente: string;
  layout_verso: string;
  hierarquia_conteudo: string[];
  prompt_visual: string;
  notas_impressao: string[];
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
  fallback?: BusinessCardOutput;
  prompt_version?: string;
};

const asList = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))] : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallback(brief: JsonObject, strategy?: JsonObject | null): BusinessCardOutput {
  const brand = toText(brief?.nome_marca || "Marca");
  const slogan = toText(brief?.slogan || "");
  const positioning = toText((strategy as JsonObject | undefined)?.posicionamento || brief?.proposta_valor || "");

  return {
    formato: "90 x 50 mm, frente e verso",
    layout_frente: `Logo central com ${brand}. ${slogan ? `Slogan \"${slogan}\" abaixo.` : "Slogan opcional abaixo."}`,
    layout_verso: "Coluna esquerda com dados, QR code alinhado a direita, barra de cor principal no rodape.",
    hierarquia_conteudo: ["Nome completo", "Cargo", "Telefone", "Email", "Site", "Endereco (opcional)"],
    prompt_visual: `Cartao de visita premium para ${brand}. Frente minimalista, verso com hierarquia clara, tipografia consistente, paleta aprovada, acabamento fosco. Direcao: ${positioning || "posicionamento estrategico"}.`,
    notas_impressao: ["Margem de seguranca 3 mm e sangria 2 mm.", "Exportar em CMYK, 300 DPI.", "Papel 300g, acabamento fosco."],
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceOutput(candidate: unknown, fallback: BusinessCardOutput): BusinessCardOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const raw = (candidate as { output?: unknown }).output ?? candidate;
  if (!raw || typeof raw !== "object") return null;
  const payload = raw as Record<string, unknown>;

  return {
    formato: toText(payload.formato || fallback.formato),
    layout_frente: toText(payload.layout_frente || fallback.layout_frente),
    layout_verso: toText(payload.layout_verso || fallback.layout_verso),
    hierarquia_conteudo: asList(payload.hierarquia_conteudo).length
      ? asList(payload.hierarquia_conteudo)
      : fallback.hierarquia_conteudo,
    prompt_visual: toText(payload.prompt_visual || fallback.prompt_visual),
    notas_impressao: asList(payload.notas_impressao).length ? asList(payload.notas_impressao) : fallback.notas_impressao,
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
    let providerUsed = "local-business-card";
    let modelUsed = "business-card-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "business_card_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "business_card_agent", {
          temperature: 0.3,
          max_tokens: 2200,
        });

        const systemPrompt = [
          "Voce e o business_card_agent da HolyNex.",
          "Gere direcao completa de cartao de visita com frente/verso, hierarquia e prompt visual.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          "{\"formato\":\"\",\"layout_frente\":\"\",\"layout_verso\":\"\",\"hierarquia_conteudo\":[\"\"],\"prompt_visual\":\"\",\"notas_impressao\":[\"\"]}",
          "Regras:",
          "- prompt_visual deve ser detalhado e pronto para motor visual.",
          "- notas_impressao deve ter 3-6 itens tecnicos.",
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
            prompt_version: payload.prompt_version || "business_card_v1",
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
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar business_card_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
