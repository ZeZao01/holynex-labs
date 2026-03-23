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

type NormalizationOutput = {
  normalized_context: JsonObject;
  missing_questions: string[];
  readiness_score: number;
  gap_summary?: string;
  status: "pronto" | "incompleto";
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
  fallback?: NormalizationOutput;
};

const round = (value: number, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const clampReadiness = (value: number) => Math.max(0, Math.min(100, round(value, 2)));

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

function buildFallback(brief: BriefInput, references: ReferenceInput[]): NormalizationOutput {
  const imageRefs = references
    .filter((ref) => ref.reference_type === "image")
    .map((ref) => ref.signed_url || ref.public_url || ref.source_url || ref.storage_path || "")
    .filter(Boolean);
  const urlRefs = references
    .filter((ref) => ref.reference_type === "url")
    .map((ref) => ref.source_url || "")
    .filter(Boolean);
  const noteRefs = references
    .filter((ref) => ref.reference_type === "note")
    .map((ref) => ref.note || "")
    .filter(Boolean);

  const concorrentes = asList(brief.concorrentes);
  const estilosDesejados = asList(brief.estilos_desejados);
  const estilosEvitar = asList(brief.estilos_evitar);
  const objetivos = asList(brief.objetivos_identidade);

  const checks = [
    { ok: Boolean(brief.nome_marca?.trim()), weight: 14, gap: "Nome da marca" },
    { ok: Boolean(brief.nicho?.trim()), weight: 12, gap: "Nicho" },
    { ok: Boolean((brief.publico_alvo_detalhado || brief.publico_alvo || "").trim()), weight: 14, gap: "Publico-alvo" },
    { ok: Boolean(brief.proposta_valor?.trim()), weight: 14, gap: "Proposta de valor" },
    { ok: concorrentes.length > 0, weight: 10, gap: "Concorrentes" },
    { ok: estilosDesejados.length > 0, weight: 8, gap: "Estilos desejados" },
    { ok: estilosEvitar.length > 0, weight: 8, gap: "Estilos a evitar" },
    { ok: objetivos.length > 0, weight: 10, gap: "Objetivos da identidade" },
    { ok: imageRefs.length > 0, weight: 5, gap: "Referencias visuais (imagens)" },
    { ok: urlRefs.length > 0, weight: 3, gap: "Referencias por URL" },
    { ok: noteRefs.length > 0, weight: 2, gap: "Notas de referencia" },
  ];

  const readiness = clampReadiness(checks.reduce((acc, check) => acc + (check.ok ? check.weight : 0), 0));
  const gaps = checks.filter((check) => !check.ok).map((check) => check.gap);

  const missingQuestions: string[] = [];
  if (!brief.nome_marca?.trim()) {
    missingQuestions.push("Qual e o nome oficial da marca e como ele deve aparecer nos materiais?");
  }
  if (!brief.proposta_valor?.trim()) {
    missingQuestions.push("Qual promessa central da marca para o cliente final?");
  }
  if (!(brief.publico_alvo_detalhado || brief.publico_alvo || "").trim()) {
    missingQuestions.push("Quem e o publico-alvo principal e quais dores ele precisa resolver?");
  }
  if (concorrentes.length === 0) {
    missingQuestions.push("Quais concorrentes diretos e indiretos devem ser considerados no posicionamento?");
  }
  if (estilosDesejados.length === 0 || estilosEvitar.length === 0) {
    missingQuestions.push("Quais estilos visuais devem ser reforcados e quais devem ser evitados?");
  }
  if (objetivos.length === 0) {
    missingQuestions.push("Quais objetivos da identidade sao prioritarios (percepcao, autoridade, conversao)?");
  }
  if (imageRefs.length + urlRefs.length === 0) {
    missingQuestions.push("Envie referencias visuais (imagens ou URLs) para orientar a direcao criativa.");
  }

  return {
    normalized_context: {
      marca: {
        nome: brief.nome_marca || "",
        slogan: brief.slogan || "",
        nicho: brief.nicho || "",
      },
      posicionamento: {
        publico_alvo: brief.publico_alvo_detalhado || brief.publico_alvo || "",
        proposta_valor: brief.proposta_valor || "",
        concorrentes,
      },
      direcao_visual: {
        estilos_desejados: estilosDesejados,
        estilos_evitar: estilosEvitar,
        objetivos_identidade: objetivos,
        contexto_referencia_visual: brief.referencia_visual_contexto || "",
        referencias: {
          imagens: imageRefs,
          urls: urlRefs,
          notas: noteRefs,
          total: references.length,
        },
      },
      contexto_aberto: {
        contexto_livre: brief.contexto || "",
        observacoes_adicionais: brief.observacoes_adicionais || "",
      },
    },
    missing_questions: missingQuestions,
    readiness_score: readiness,
    gap_summary:
      gaps.length > 0
        ? `Lacunas detectadas: ${gaps.slice(0, 4).join(", ")}${gaps.length > 4 ? ", ..." : ""}.`
        : "Briefing com contexto suficiente para iniciar as fases criativas.",
    status: readiness >= 75 && missingQuestions.length <= 2 ? "pronto" : "incompleto",
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

function coerceOutput(candidate: unknown, fallback: NormalizationOutput): NormalizationOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  if (!raw.normalized_context || typeof raw.normalized_context !== "object") {
    return null;
  }

  const readinessRaw = Number(raw.readiness_score);
  const missingQuestions = Array.isArray(raw.missing_questions)
    ? raw.missing_questions.map((item) => String(item))
    : fallback.missing_questions;

  return {
    normalized_context: raw.normalized_context as JsonObject,
    missing_questions: missingQuestions,
    readiness_score: Number.isFinite(readinessRaw) ? clampReadiness(readinessRaw) : fallback.readiness_score,
    gap_summary: typeof raw.gap_summary === "string" ? raw.gap_summary : fallback.gap_summary,
    status: raw.status === "pronto" ? "pronto" : "incompleto",
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

    if (!brief || typeof brief !== "object") {
      return new Response(JSON.stringify({ error: "brief obrigatorio" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let output = fallback;
    let usedFallback = true;
    let providerUsed = "local-normalizer";
    let modelUsed = "brand-briefing-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "brand_briefing_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "brand_briefing_agent", {
          temperature: 0.2,
          max_tokens: 3500,
        });

        const systemPrompt = [
          "Voce e o brand_briefing_agent da HolyNex.",
          "Normaliza um briefing de branding para execucao de agentes criativos.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          '{"normalized_context":{},"missing_questions":[],"readiness_score":0,"gap_summary":"","status":"pronto|incompleto"}',
          "Regras:",
          "- readiness_score entre 0 e 100.",
          "- missing_questions deve conter perguntas objetivas para preencher lacunas.",
          "- status deve ser pronto apenas com briefing realmente utilizavel.",
        ].join("\n");

        const userPrompt = JSON.stringify(
          {
            project: payload.project || {},
            brief,
            references,
            fallback,
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
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar brand_briefing_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
