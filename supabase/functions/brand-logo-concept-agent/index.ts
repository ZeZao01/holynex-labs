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
  titulo: string;
  racional_estrategico: string;
  simbolo: string;
  wordmark: string;
  prompt_visual: string;
  negative_guidance: string[];
};

type ConceptOutput = {
  conceitos: LogoConcept[];
  recomendacao_principal: string;
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
  estilos_desejados?: string[] | null;
  estilos_evitar?: string[] | null;
  objetivos_identidade?: string[] | null;
  contexto?: string | null;
  normalized_context?: JsonObject | null;
};

type RequestPayload = {
  project?: JsonObject;
  brief?: BriefInput;
  references?: ReferenceInput[];
  strategy?: JsonObject | null;
  palette?: JsonObject | null;
  typography?: JsonObject | null;
  normalized_context?: JsonObject | null;
  fallback?: ConceptOutput;
  prompt_version?: string;
};

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallback(brief: BriefInput, _references: ReferenceInput[]): ConceptOutput {
  const brand = brief.nome_marca || "Marca";
  const niche = brief.nicho || "nicho";
  const tone = (brief.estilos_desejados || [])[0] || "sofisticado";
  const avoid = asList(brief.estilos_evitar);
  const baseNegative = avoid.length ? avoid : ["visual generico", "ornamentos excessivos"];

  const conceitos: LogoConcept[] = [
    {
      titulo: "Sinal de Confianca",
      racional_estrategico: `Simbolo minimalista que reforca autoridade em ${niche} para ${brand}.`,
      simbolo: "Monograma geometrico com eixo firme e cantos suavizados.",
      wordmark: "Tipografia sem serifa com cortes precisos e espacamento amplo.",
      prompt_visual: `Logo minimalista para ${brand}, monograma geometrico, tom ${tone}, fundo neutro, alto contraste, grid preciso.`,
      negative_guidance: baseNegative,
    },
    {
      titulo: "Energia Distintiva",
      racional_estrategico: `Marca destaca diferencial competitivo com simbolo dinamico e memoravel.`,
      simbolo: "Forma abstrata modular sugerindo movimento controlado.",
      wordmark: "Sans contemporanea com ritmo visual e cortes diagonais sutis.",
      prompt_visual: `Logo contemporaneo para ${brand}, simbolo abstrato modular, composicao horizontal, tom ${tone}, sem sombras.`,
      negative_guidance: baseNegative,
    },
    {
      titulo: "Elegancia Humana",
      racional_estrategico: `Direcao que equilibra proximidade e sofisticacao para ${brand}.`,
      simbolo: "Emblema simples com curvas suaves e proporcoes classicas.",
      wordmark: "Serif moderna com contraste sutil e legibilidade alta.",
      prompt_visual: `Logo elegante para ${brand}, emblema com curvas suaves, serif moderna, tom ${tone}, uso de espaco negativo.`,
      negative_guidance: baseNegative,
    },
  ];

  return {
    conceitos,
    recomendacao_principal: conceitos[0].titulo,
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceConcept(raw: Record<string, unknown>, fallback: LogoConcept): LogoConcept {
  return {
    titulo: toText(raw.titulo || fallback.titulo),
    racional_estrategico: toText(raw.racional_estrategico || fallback.racional_estrategico),
    simbolo: toText(raw.simbolo || fallback.simbolo),
    wordmark: toText(raw.wordmark || fallback.wordmark),
    prompt_visual: toText(raw.prompt_visual || fallback.prompt_visual),
    negative_guidance: asList(raw.negative_guidance).length
      ? asList(raw.negative_guidance)
      : fallback.negative_guidance,
  };
}

function coerceOutput(candidate: unknown, fallback: ConceptOutput): ConceptOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  if (!raw.conceitos || !Array.isArray(raw.conceitos)) return null;
  const conceitos = (raw.conceitos as Array<Record<string, unknown>>).map((item, index) =>
    coerceConcept(item, fallback.conceitos[index] || fallback.conceitos[0])
  );

  return {
    conceitos: conceitos.length ? conceitos : fallback.conceitos,
    recomendacao_principal: toText(raw.recomendacao_principal || fallback.recomendacao_principal),
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
    const references = Array.isArray(payload?.references) ? payload.references : [];
    const fallback = payload?.fallback || buildFallback(brief, references);

    let output = fallback;
    let usedFallback = true;
    let providerUsed = "local-logo-concept";
    let modelUsed = "brand-logo-concept-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "logo_concept_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "logo_concept_agent", {
          temperature: 0.35,
          max_tokens: 3200,
        });

        const systemPrompt = [
          "Voce e o logo_concept_agent da HolyNex.",
          "Gere conceitos de logo profissionais para um projeto de branding.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          "{\"conceitos\":[{\"titulo\":\"\",\"racional_estrategico\":\"\",\"simbolo\":\"\",\"wordmark\":\"\",\"prompt_visual\":\"\",\"negative_guidance\":[]}],\"recomendacao_principal\":\"\"}",
          "Regras:",
          "- Gere 3 conceitos distintos.",
          "- prompt_visual deve ser detalhado e pronto para ferramenta visual.",
          "- negative_guidance deve ser lista com 3-6 itens.",
        ].join("\n");

        const userPrompt = JSON.stringify(
          {
            project: payload.project || {},
            brief,
            strategy: payload.strategy || null,
            palette: payload.palette || null,
            typography: payload.typography || null,
            normalized_context: payload.normalized_context || brief.normalized_context || {},
            references,
            fallback,
            prompt_version: payload.prompt_version || "brand_logo_concept_v1",
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
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar logo_concept_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
