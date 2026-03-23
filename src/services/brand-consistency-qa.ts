import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain } from "@/lib/service-helpers";
import { createBrandAiRun } from "@/services/brand-agents";
import type {
  BrandAiRun,
  BrandBrief,
  BrandColorPaletteOutput,
  BrandConsistencyQaExecutionResult,
  BrandConsistencyQaOutput,
  BrandConsistencyCheckStatus,
  BrandLogoConcept,
  BrandPiece,
  BrandProject,
  BrandStrategyOutput,
  BrandTypographySet,
  BrandVersion,
} from "@/types/brand-studio";

const DOMAIN = "brand-consistency-qa";
const QA_AGENT_KEY = "brand_consistency_qa_agent";
const PROMPT_VERSION = "brand_consistency_qa_v1";

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const buildCheckStatus = (value: BrandConsistencyCheckStatus): BrandConsistencyCheckStatus => value;

function buildFallbackConsistencyQa(params: {
  project: BrandProject;
  brief: BrandBrief;
  strategy: BrandStrategyOutput | null;
  palette: BrandColorPaletteOutput | null;
  typography: BrandTypographySet | null;
  logo: BrandLogoConcept | null;
  pieces: BrandPiece[];
  versions: BrandVersion[];
}): BrandConsistencyQaOutput {
  const hasApprovedStrategy = params.strategy?.status === "aprovado";
  const hasApprovedPalette = params.palette?.status === "aprovado";
  const hasApprovedTypography = params.typography?.status === "aprovado";
  const hasApprovedLogo = params.logo?.status === "aprovado";
  const approvedPieces = params.pieces.filter((piece) => piece.status === "aprovado");
  const hasApprovedPieces = approvedPieces.length > 0;
  const pdfGenerated = params.versions.some((version) => Boolean(version.presentation_url));

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

  const checks = [
    {
      id: "strategy_visual_coherence",
      label: "Coerencia entre estrategia e visual",
      status: buildCheckStatus(
        hasApprovedStrategy && hasApprovedPalette && hasApprovedTypography
          ? "ok"
          : hasApprovedStrategy
            ? "attention"
            : "pending"
      ),
      notes: hasApprovedStrategy
        ? "Estrategia disponivel para validar consistencia visual."
        : "A estrategia precisa ser aprovada para validar coerencia.",
    },
    {
      id: "visual_system_consistency",
      label: "Consistencia entre paleta, tipografia e logo",
      status: buildCheckStatus(
        hasApprovedPalette && hasApprovedTypography && hasApprovedLogo
          ? "ok"
          : hasApprovedLogo
            ? "attention"
            : "critical"
      ),
      notes: hasApprovedPalette && hasApprovedTypography
        ? "Sistema visual com bases aprovadas."
        : "Paleta e tipografia precisam estar aprovadas.",
    },
    {
      id: "pieces_alignment",
      label: "Consistencia entre sistema e pecas",
      status: buildCheckStatus(hasApprovedPieces ? "ok" : "attention"),
      notes: hasApprovedPieces
        ? `Pecas aprovadas: ${approvedPieces.length}.`
        : "Pecas finais ainda nao aprovadas.",
    },
    {
      id: "pdf_ready",
      label: "PDF final gerado",
      status: buildCheckStatus(pdfGenerated ? "ok" : "critical"),
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

function coerceOutput(candidate: unknown, fallback: BrandConsistencyQaOutput): BrandConsistencyQaOutput {
  if (!candidate || typeof candidate !== "object") return fallback;
  const root = candidate as Record<string, unknown>;
  const raw = root.output && typeof root.output === "object" ? (root.output as Record<string, unknown>) : root;

  const toList = (value: unknown) =>
    Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];

  const checksRaw = Array.isArray(raw.checks) ? raw.checks : fallback.checks;
  const checks = checksRaw.map((item, index) => {
    const base = fallback.checks[index] || fallback.checks[0];
    const payload = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
    const status = String(payload.status || base.status);
    const normalizedStatus: BrandConsistencyCheckStatus =
      status === "ok" || status === "attention" || status === "critical" || status === "pending"
        ? (status as BrandConsistencyCheckStatus)
        : base.status;
    return {
      id: String(payload.id || base.id),
      label: String(payload.label || base.label),
      status: normalizedStatus,
      notes: String(payload.notes || base.notes || "").trim() || undefined,
    };
  });

  const readinessScore = Number(raw.readiness_score);
  const readinessForDelivery = Boolean(raw.readiness_for_delivery ?? fallback.readiness_for_delivery);
  const statusRaw = String(raw.status || fallback.status);
  const status = statusRaw === "pronto" || statusRaw === "em_revisao" || statusRaw === "critico"
    ? statusRaw
    : fallback.status;

  return {
    readiness_score: Number.isFinite(readinessScore) ? clampScore(readinessScore) : fallback.readiness_score,
    status,
    readiness_for_delivery: readinessForDelivery,
    summary: String(raw.summary || fallback.summary),
    critical_issues: toList(raw.critical_issues).length ? toList(raw.critical_issues) : fallback.critical_issues,
    warnings: toList(raw.warnings).length ? toList(raw.warnings) : fallback.warnings,
    pending_items: toList(raw.pending_items).length ? toList(raw.pending_items) : fallback.pending_items,
    checks: checks.length ? checks : fallback.checks,
  };
}

export async function runBrandConsistencyQaAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  strategy: BrandStrategyOutput | null;
  palette: BrandColorPaletteOutput | null;
  typography: BrandTypographySet | null;
  logo: BrandLogoConcept | null;
  pieces: BrandPiece[];
  versions: BrandVersion[];
}): Promise<BrandConsistencyQaExecutionResult> {
  const startedAt = Date.now();
  const fallback = buildFallbackConsistencyQa(payload);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-qa";
  let modelUsed = "brand-consistency-qa-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", QA_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-consistency-qa-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        strategy: payload.strategy,
        palette: payload.palette,
        typography: payload.typography,
        logo: payload.logo,
        pieces: payload.pieces,
        versions: payload.versions,
        fallback,
        prompt_version: PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandConsistencyQaOutput;
      output = coerceOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandConsistencyQaAgent.invokeFallback",
      "warn",
      err instanceof Error ? err.message : "invoke failed"
    );
  }

  const durationMs = Date.now() - startedAt;
  const run = (await createBrandAiRun({
    project_id: payload.project.id,
    task_id: null,
    agent_config_id: agentConfigId,
    status: "concluido",
    provider_used: providerUsed,
    model_used: modelUsed,
    input_payload: {
      brief_id: payload.brief.id,
      brief_version: payload.brief.version,
      agent_key: QA_AGENT_KEY,
      prompt_version: PROMPT_VERSION,
    },
    output_payload: {
      ...output,
      used_fallback: usedFallback,
    },
    error_reason: null,
    duration_ms: durationMs,
    tokens_input: null,
    tokens_output: null,
    cost_estimated: null,
  })) as BrandAiRun;

  return {
    run,
    output,
    used_fallback: usedFallback,
  };
}
