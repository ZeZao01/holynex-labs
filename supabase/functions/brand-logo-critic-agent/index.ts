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

type LogoConcept = {
  titulo?: string;
  racional_estrategico?: string;
  simbolo?: string;
  wordmark?: string;
  prompt_visual?: string;
  negative_guidance?: string[];
};

type CriticOutput = {
  riscos: string[];
  legibilidade: string;
  escalabilidade: string;
  ajustes_recomendados: string[];
  recomendacao_aprovacao: "aprovar" | "revisar";
  observacoes?: string[];
};

type RequestPayload = {
  project?: JsonObject;
  brief?: JsonObject;
  references?: JsonObject[];
  concept?: LogoConcept;
  concept_index?: number;
  fallback?: CriticOutput;
  prompt_version?: string;
};

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallback(concept: LogoConcept): CriticOutput {
  return {
    riscos: ["Detalhes finos podem perder definicao em tamanhos reduzidos."],
    legibilidade: "Boa legibilidade em tamanhos medios; revisar microdetalhes do wordmark.",
    escalabilidade: "Escalavel para digital e impresso com ajustes minimos de espessura.",
    ajustes_recomendados: [
      "Simplificar elementos internos do simbolo.",
      "Aumentar espessura minima para uso em favicon.",
    ],
    recomendacao_aprovacao: "revisar",
    observacoes: concept.titulo ? [`Revisar contraste no conceito \"${concept.titulo}\".`] : undefined,
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceOutput(candidate: unknown, fallback: CriticOutput): CriticOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  const recomendacao = toText(raw.recomendacao_aprovacao || fallback.recomendacao_aprovacao) === "aprovar"
    ? "aprovar"
    : "revisar";

  return {
    riscos: asList(raw.riscos).length ? asList(raw.riscos) : fallback.riscos,
    legibilidade: toText(raw.legibilidade || fallback.legibilidade),
    escalabilidade: toText(raw.escalabilidade || fallback.escalabilidade),
    ajustes_recomendados: asList(raw.ajustes_recomendados).length
      ? asList(raw.ajustes_recomendados)
      : fallback.ajustes_recomendados,
    recomendacao_aprovacao: recomendacao,
    observacoes: asList(raw.observacoes).length ? asList(raw.observacoes) : fallback.observacoes,
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
    const concept = payload?.concept || {};
    const fallback = payload?.fallback || buildFallback(concept);

    let output = fallback;
    let usedFallback = true;
    let providerUsed = "local-logo-critic";
    let modelUsed = "brand-logo-critic-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "logo_critic_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "logo_critic_agent", {
          temperature: 0.2,
          max_tokens: 1800,
        });

        const systemPrompt = [
          "Voce e o logo_critic_agent da HolyNex.",
          "Analise o conceito de logo e gere uma critica objetiva.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          "{\"riscos\":[],\"legibilidade\":\"\",\"escalabilidade\":\"\",\"ajustes_recomendados\":[],\"recomendacao_aprovacao\":\"aprovar|revisar\",\"observacoes\":[]}",
          "Regras:",
          "- Liste 2-4 riscos concretos.",
          "- Ajustes recomendados devem ser acionaveis.",
        ].join("\n");

        const userPrompt = JSON.stringify(
          {
            project: payload.project || {},
            brief: payload.brief || {},
            concept,
            concept_index: payload.concept_index,
            references: payload.references || [],
            fallback,
            prompt_version: payload.prompt_version || "brand_logo_critic_v1",
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
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar logo_critic_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
