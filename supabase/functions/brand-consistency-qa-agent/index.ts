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

type QaCheckStatus = "ok" | "attention" | "critical" | "pending";

type QaCheck = {
  id: string;
  label: string;
  status: QaCheckStatus;
  notes?: string;
};

type QaOutput = {
  readiness_score: number;
  status: "pronto" | "em_revisao" | "critico";
  readiness_for_delivery: boolean;
  summary: string;
  critical_issues: string[];
  warnings: string[];
  pending_items: string[];
  checks: QaCheck[];
};

type RequestPayload = {
  project?: JsonObject;
  brief?: JsonObject;
  strategy?: JsonObject | null;
  palette?: JsonObject | null;
  typography?: JsonObject | null;
  logo?: JsonObject | null;
  pieces?: JsonObject[];
  versions?: JsonObject[];
  fallback?: QaOutput;
  prompt_version?: string;
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function buildFallback(payload: RequestPayload): QaOutput {
  const strategyStatus = String((payload.strategy as { status?: string } | null)?.status || "");
  const paletteStatus = String((payload.palette as { status?: string } | null)?.status || "");
  const typographyStatus = String((payload.typography as { status?: string } | null)?.status || "");
  const logoStatus = String((payload.logo as { status?: string } | null)?.status || "");
  const pieces = Array.isArray(payload.pieces) ? payload.pieces : [];
  const versions = Array.isArray(payload.versions) ? payload.versions : [];

  const hasApprovedStrategy = strategyStatus === "aprovado";
  const hasApprovedPalette = paletteStatus === "aprovado";
  const hasApprovedTypography = typographyStatus === "aprovado";
  const hasApprovedLogo = logoStatus === "aprovado";
  const approvedPieces = pieces.filter((piece) => String((piece as { status?: string }).status || "") === "aprovado");
  const hasApprovedPieces = approvedPieces.length > 0;
  const pdfGenerated = versions.some((version) => Boolean((version as { presentation_url?: string }).presentation_url));

  const criticalIssues: string[] = [];
  if (!hasApprovedLogo) criticalIssues.push("Logo aprovado ausente.");
  if (!hasApprovedPalette || !hasApprovedTypography) {
    criticalIssues.push("Sistema visual (paleta/tipografia) nao aprovado.");
  }
  if (!pdfGenerated) criticalIssues.push("PDF final ainda nao foi gerado.");

  const warnings: string[] = [];
  if (!hasApprovedStrategy) warnings.push("Direcao estrategica nao aprovada.");
  if (!hasApprovedPieces) warnings.push("Pecas finais pendentes ou nao aprovadas.");

  const pendingItems: string[] = [];
  if (!hasApprovedStrategy) pendingItems.push("Aprovar direcao estrategica");
  if (!hasApprovedPalette) pendingItems.push("Aprovar paleta de cores");
  if (!hasApprovedTypography) pendingItems.push("Aprovar tipografia");
  if (!hasApprovedLogo) pendingItems.push("Aprovar logo final");
  if (!hasApprovedPieces) pendingItems.push("Concluir pecas obrigatorias");
  if (!pdfGenerated) pendingItems.push("Gerar PDF final da apresentacao");

  let readinessScore = 0;
  if (hasApprovedStrategy) readinessScore += 20;
  if (hasApprovedPalette) readinessScore += 20;
  if (hasApprovedTypography) readinessScore += 20;
  if (hasApprovedLogo) readinessScore += 20;
  if (hasApprovedPieces) readinessScore += 10;
  if (pdfGenerated) readinessScore += 10;

  const readinessForDelivery = criticalIssues.length === 0;
  const status = criticalIssues.length > 0 ? "critico" : warnings.length > 0 ? "em_revisao" : "pronto";

  const checks: QaCheck[] = [
    {
      id: "strategy_visual_coherence",
      label: "Coerencia entre estrategia e visual",
      status: hasApprovedStrategy && hasApprovedPalette && hasApprovedTypography ? "ok" : hasApprovedStrategy ? "attention" : "pending",
      notes: hasApprovedStrategy
        ? "Estrategia disponivel para validar consistencia visual."
        : "A estrategia precisa ser aprovada para validar coerencia.",
    },
    {
      id: "visual_system_consistency",
      label: "Consistencia entre paleta, tipografia e logo",
      status: hasApprovedPalette && hasApprovedTypography && hasApprovedLogo ? "ok" : hasApprovedLogo ? "attention" : "critical",
      notes: hasApprovedPalette && hasApprovedTypography
        ? "Sistema visual com bases aprovadas."
        : "Paleta e tipografia precisam estar aprovadas.",
    },
    {
      id: "pieces_alignment",
      label: "Consistencia entre sistema e pecas",
      status: hasApprovedPieces ? "ok" : "attention",
      notes: hasApprovedPieces
        ? `Pecas aprovadas: ${approvedPieces.length}.`
        : "Pecas finais ainda nao aprovadas.",
    },
    {
      id: "pdf_ready",
      label: "PDF final gerado",
      status: pdfGenerated ? "ok" : "critical",
      notes: pdfGenerated ? "Apresentacao pronta para entrega." : "Gerar PDF final para entrega.",
    },
  ];

  return {
    readiness_score: clampScore(readinessScore),
    status,
    readiness_for_delivery: readinessForDelivery,
    summary: readinessForDelivery
      ? "Consistencia valida sem bloqueios criticos para entrega."
      : "Bloqueios criticos detectados para entrega final.",
    critical_issues: criticalIssues,
    warnings,
    pending_items: pendingItems,
    checks,
  };
}

function parseResponseContent(content: string): unknown {
  const stripped = content.replace(/```json/gi, "").replace(/```/g, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  const candidate = first >= 0 && last > first ? stripped.slice(first, last + 1) : stripped;
  return JSON.parse(candidate);
}

function coerceOutput(candidate: unknown, fallback: QaOutput): QaOutput | null {
  if (!candidate || typeof candidate !== "object") return null;
  const root = candidate as Record<string, unknown>;
  const raw = root.output && typeof root.output === "object" ? (root.output as Record<string, unknown>) : root;

  const toList = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];

  const statusRaw = String(raw.status || "");
  const status = statusRaw === "pronto" || statusRaw === "em_revisao" || statusRaw === "critico" ? statusRaw : fallback.status;
  const scoreRaw = Number(raw.readiness_score);
  const readinessScore = Number.isFinite(scoreRaw) ? clampScore(scoreRaw) : fallback.readiness_score;
  const readinessForDelivery = Boolean(raw.readiness_for_delivery ?? fallback.readiness_for_delivery);

  const checksRaw = Array.isArray(raw.checks) ? raw.checks : fallback.checks;
  const checks = checksRaw.map((item, index) => {
    const base = fallback.checks[index] || fallback.checks[0];
    const payload = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
    const statusValue = String(payload.status || base.status);
    const normalizedStatus =
      statusValue === "ok" || statusValue === "attention" || statusValue === "critical" || statusValue === "pending"
        ? (statusValue as QaCheckStatus)
        : base.status;
    return {
      id: String(payload.id || base.id),
      label: String(payload.label || base.label),
      status: normalizedStatus,
      notes: String(payload.notes || base.notes || "").trim() || undefined,
    };
  });

  return {
    readiness_score: readinessScore,
    status,
    readiness_for_delivery: readinessForDelivery,
    summary: String(raw.summary || fallback.summary),
    critical_issues: toList(raw.critical_issues).length ? toList(raw.critical_issues) : fallback.critical_issues,
    warnings: toList(raw.warnings).length ? toList(raw.warnings) : fallback.warnings,
    pending_items: toList(raw.pending_items).length ? toList(raw.pending_items) : fallback.pending_items,
    checks: checks.length ? checks : fallback.checks,
  };
}

async function callProvider(
  provider: { name: string; url: string; apiKey: string; model: string; headers?: Record<string, string> },
  messages: Array<{ role: string; content: string }>,
  policy: { temperature: number; max_tokens: number },
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
    const fallback = payload?.fallback || buildFallback(payload || {});

    let output = fallback;
    let usedFallback = true;
    let providerUsed = "local-qa";
    let modelUsed = "brand-consistency-qa-heuristic-v1";

    try {
      const [providerSettings, modelSettings, promptPolicies] = await Promise.all([
        getAiProviderSettings(),
        getAiModelSettings(),
        getPromptPolicies(),
      ]);

      const providers = resolveAiProviders(providerSettings, modelSettings, "brand_consistency_qa_agent");
      if (providers.length > 0) {
        const policy = resolvePromptPolicy(promptPolicies, "brand_consistency_qa_agent", {
          temperature: 0.2,
          max_tokens: 2600,
        });

        const systemPrompt = [
          "Voce e o brand_consistency_qa_agent da HolyNex.",
          "Valide consistencia entre estrategia e entregaveis visuais.",
          "Responda APENAS com JSON valido.",
          "Estrutura obrigatoria do JSON:",
          '{"readiness_score":0,"status":"pronto|em_revisao|critico","readiness_for_delivery":false,"summary":"","critical_issues":[""],"warnings":[""],"pending_items":[""],"checks":[{"id":"","label":"","status":"ok|attention|critical|pending","notes":""}]}',
          "Regras:",
          "- readiness_score entre 0 e 100.",
          "- critical_issues deve listar bloqueios reais para entrega.",
          "- readiness_for_delivery deve refletir ausencia de bloqueios criticos.",
        ].join("\n");

        const userPrompt = JSON.stringify(
          {
            project: payload.project || {},
            brief: payload.brief || {},
            strategy: payload.strategy || null,
            palette: payload.palette || null,
            typography: payload.typography || null,
            logo: payload.logo || null,
            pieces: payload.pieces || [],
            versions: payload.versions || [],
            fallback,
            prompt_version: payload.prompt_version || "brand_consistency_qa_v1",
          },
          null,
          2,
        );

        for (const provider of providers) {
          try {
            const content = await callProvider(
              provider,
              [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Contexto:\n${userPrompt}` },
              ],
              policy,
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
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro ao executar brand_consistency_qa_agent" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
