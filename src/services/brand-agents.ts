import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { logAction } from "@/lib/audit-logs";
import type {
  BrandAgentConfig,
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandBriefingAgentRunResult,
  BrandBriefingNormalizationOutput,
  BrandColorPaletteOutput,
  BrandConsistencyQaCheck,
  BrandConsistencyQaOutput,
  BrandProject,
  BrandStrategyOutput,
  BrandTypographySet,
  BrandLogoConcept,
  BrandPiece,
  BrandVersion,
} from "@/types/brand-studio";

const DOMAIN = "brand-agents";
const BRIEFING_AGENT_KEY = "brand_briefing_agent";
const CONSISTENCY_QA_AGENT_KEY = "brand_consistency_qa_agent";
const CONSISTENCY_QA_PROMPT_VERSION = "brand_consistency_qa_v1";

const normalizeTextList = (values: (string | null | undefined)[] | null | undefined): string[] =>
  [...new Set((values || []).map((item) => String(item || "").trim()).filter(Boolean))];

const round = (value: number, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const normalizeList = (values: unknown): string[] =>
  Array.isArray(values) ? values.map((item) => String(item || "").trim()).filter(Boolean) : [];

const normalizeCheckList = (values: unknown): BrandConsistencyQaCheck[] => {
  if (!Array.isArray(values)) return [];
  return values
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const statusRaw = String(raw.status || "");
      const status =
        statusRaw === "critical" || statusRaw === "fail"
          ? "critical"
          : statusRaw === "attention" || statusRaw === "warn"
            ? "attention"
            : statusRaw === "pending"
              ? "pending"
              : "ok";
      return {
        id: String(raw.id || "check"),
        label: String(raw.label || "Check"),
        status,
        notes: raw.notes ? String(raw.notes) : undefined,
      };
    })
    .filter(Boolean) as BrandConsistencyQaCheck[];
};

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const normalizeConsistencyQaOutput = (
  candidate: unknown,
  fallback: BrandConsistencyQaOutput
): BrandConsistencyQaOutput => {
  if (!candidate || typeof candidate !== "object") return fallback;
  const raw = (candidate as { output?: unknown }).output ?? candidate;
  if (!raw || typeof raw !== "object") return fallback;
  const payload = raw as Record<string, unknown>;
  const statusRaw = String(payload.status || "");
  const status =
    statusRaw === "critico"
      ? "critico"
      : statusRaw === "em_revisao" || statusRaw === "atencao"
        ? "em_revisao"
        : "pronto";
  const readinessScore = Number(payload.readiness_score);

  return {
    status,
    readiness_score: Number.isFinite(readinessScore) ? clampScore(readinessScore) : fallback.readiness_score,
    readiness_for_delivery: Boolean(payload.readiness_for_delivery ?? fallback.readiness_for_delivery),
    summary: String(payload.summary || fallback.summary),
    checks: normalizeCheckList(payload.checks).length ? normalizeCheckList(payload.checks) : fallback.checks,
    critical_issues: normalizeList(payload.critical_issues).length ? normalizeList(payload.critical_issues) : fallback.critical_issues,
    warnings: normalizeList(payload.warnings).length ? normalizeList(payload.warnings) : fallback.warnings,
    pending_items: normalizeList(payload.pending_items).length ? normalizeList(payload.pending_items) : fallback.pending_items,
  };
};

function buildBriefingNormalization(
  project: BrandProject,
  brief: BrandBrief,
  references: BrandBriefReference[]
): BrandBriefingNormalizationOutput {
  const imageReferences = references
    .filter((ref) => ref.reference_type === "image")
    .map((ref) => ref.signed_url || ref.public_url || ref.source_url || ref.storage_path || "")
    .filter(Boolean);
  const urlReferences = references
    .filter((ref) => ref.reference_type === "url")
    .map((ref) => ref.source_url || "")
    .filter(Boolean);
  const noteReferences = references
    .filter((ref) => ref.reference_type === "note")
    .map((ref) => ref.note || "")
    .filter(Boolean);

  const competitors = normalizeTextList(brief.concorrentes);
  const stylesDesired = normalizeTextList(brief.estilos_desejados);
  const stylesAvoid = normalizeTextList(brief.estilos_evitar);
  const identityGoals = normalizeTextList(brief.objetivos_identidade);

  const checks = [
    { ok: !!brief.nome_marca?.trim(), weight: 14, gap: "Nome da marca" },
    { ok: !!brief.nicho?.trim(), weight: 12, gap: "Nicho" },
    { ok: !!(brief.publico_alvo_detalhado || brief.publico_alvo)?.trim(), weight: 14, gap: "Publico-alvo" },
    { ok: !!brief.proposta_valor?.trim(), weight: 14, gap: "Proposta de valor" },
    { ok: competitors.length > 0, weight: 10, gap: "Concorrentes" },
    { ok: stylesDesired.length > 0, weight: 8, gap: "Estilos desejados" },
    { ok: stylesAvoid.length > 0, weight: 8, gap: "Estilos a evitar" },
    { ok: identityGoals.length > 0, weight: 10, gap: "Objetivos da identidade" },
    { ok: imageReferences.length > 0, weight: 5, gap: "Referencias visuais (imagens)" },
    { ok: urlReferences.length > 0, weight: 3, gap: "Referencias por URL" },
    { ok: noteReferences.length > 0, weight: 2, gap: "Notas de referencia" },
  ];

  const readiness = round(
    checks.reduce((acc, check) => acc + (check.ok ? check.weight : 0), 0),
    2
  );

  const gaps = checks.filter((check) => !check.ok).map((check) => check.gap);

  const missingQuestions: string[] = [];
  if (!brief.nome_marca?.trim()) missingQuestions.push("Qual e o nome oficial da marca e como deve aparecer nos materiais?");
  if (!brief.proposta_valor?.trim()) missingQuestions.push("Qual promessa central da marca para o cliente final?");
  if (!(brief.publico_alvo_detalhado || brief.publico_alvo)?.trim()) {
    missingQuestions.push("Quem e o publico-alvo principal e quais dores ele precisa resolver?");
  }
  if (competitors.length === 0) {
    missingQuestions.push("Quais concorrentes diretos ou indiretos devem ser considerados no posicionamento?");
  }
  if (stylesDesired.length === 0 || stylesAvoid.length === 0) {
    missingQuestions.push("Quais estilos visuais devem ser reforcados e quais precisam ser evitados?");
  }
  if (identityGoals.length === 0) {
    missingQuestions.push("Quais objetivos de identidade (percepcao, autoridade, conversao) sao prioritarios?");
  }
  if (imageReferences.length + urlReferences.length === 0) {
    missingQuestions.push("Envie referencias visuais (imagens/URLs) para alinhar direcao criativa.");
  }

  const normalized_context = {
    marca: {
      nome: brief.nome_marca || "",
      slogan: brief.slogan || "",
      nicho: brief.nicho || "",
    },
    posicionamento: {
      publico_alvo: brief.publico_alvo_detalhado || brief.publico_alvo || "",
      proposta_valor: brief.proposta_valor || "",
      concorrentes: competitors,
    },
    direcao_visual: {
      estilos_desejados: stylesDesired,
      estilos_evitar: stylesAvoid,
      objetivos_identidade: identityGoals,
      referencias: {
        imagens: imageReferences,
        urls: urlReferences,
        notas: noteReferences,
        total: references.length,
      },
    },
    escopo_operacional: {
      project_id: project.project_id,
      lead_id: project.lead_id,
      proposal_id: project.proposal_id,
      client_id: project.client_id,
    },
    contexto_aberto: {
      contexto_livre: brief.contexto || "",
      observacoes_adicionais: brief.observacoes_adicionais || "",
    },
  };

  return {
    normalized_context,
    missing_questions: missingQuestions,
    readiness_score: readiness,
    gap_summary:
      gaps.length > 0
        ? `Lacunas detectadas: ${gaps.slice(0, 4).join(", ")}${gaps.length > 4 ? ", ..." : ""}.`
        : "Briefing com contexto suficiente para iniciar as fases criativas.",
    status: readiness >= 75 && missingQuestions.length <= 2 ? "pronto" : "incompleto",
  };
}

function buildConsistencyQaFallback(payload: {
  strategy: BrandStrategyOutput | null;
  palette: BrandColorPaletteOutput | null;
  typography: BrandTypographySet | null;
  logo: BrandLogoConcept | null;
  pieces: BrandPiece[];
  versions: BrandVersion[];
}): BrandConsistencyQaOutput {
  const requiredPieces = ["business_card", "flyer"] as const;
  const pieceLabels: Record<string, string> = {
    business_card: "Cartao de visita",
    flyer: "Flyer",
  };

  const hasStrategyApproved = payload.strategy?.status === "aprovado";
  const hasPaletteApproved = payload.palette?.status === "aprovado";
  const hasTypographyApproved = payload.typography?.status === "aprovado";
  const hasLogoApproved = payload.logo?.status === "aprovado";
  const hasSystemVisualApproved = hasPaletteApproved && hasTypographyApproved;
  const hasPdfGenerated = payload.versions.some((version) => Boolean(version.presentation_url));

  const pieceByType = (type: (typeof requiredPieces)[number]) =>
    payload.pieces.find((piece) => piece.piece_type === type) || null;

  const missingPieces = requiredPieces.filter((type) => !pieceByType(type));
  const unapprovedPieces = requiredPieces.filter((type) => pieceByType(type)?.status !== "aprovado");
  const piecesApproved = unapprovedPieces.length === 0;

  const checks: BrandConsistencyQaOutput["checks"] = [];
  const addCheck = (id: string, label: string, status: BrandConsistencyQaCheck["status"], notes?: string) => {
    checks.push({ id, label, status, notes });
  };

  addCheck(
    "strategy",
    "Direcao estrategica aprovada",
    hasStrategyApproved ? "ok" : "pending",
    hasStrategyApproved ? undefined : "Aprove a direcao estrategica antes da entrega."
  );
  addCheck(
    "visual-system",
    "Sistema visual aprovado (paleta + tipografia)",
    hasSystemVisualApproved ? "ok" : "critical",
    hasSystemVisualApproved ? undefined : "Paleta e tipografia precisam estar aprovadas."
  );
  addCheck(
    "logo",
    "Logo aprovado",
    hasLogoApproved ? "ok" : "critical",
    hasLogoApproved ? undefined : "Finalize a aprovacao do logo."
  );
  addCheck(
    "pieces",
    "Pecas obrigatorias aprovadas",
    piecesApproved ? "ok" : missingPieces.length ? "attention" : "attention",
    piecesApproved
      ? undefined
      : `Pendentes: ${unapprovedPieces
          .map((type) => pieceLabels[type] || type)
          .join(", ")}.`
  );
  addCheck(
    "pdf",
    "PDF final gerado",
    hasPdfGenerated ? "ok" : "critical",
    hasPdfGenerated ? undefined : "Gere o PDF de apresentacao final."
  );

  const hasVisualOutputs = Boolean(
    payload.palette?.output_payload && payload.typography?.output_payload && payload.logo?.output_payload
  );
  addCheck(
    "consistency",
    "Coerencia entre estrategia e visual",
    hasStrategyApproved && hasVisualOutputs ? "ok" : "attention",
    hasStrategyApproved && hasVisualOutputs
      ? undefined
      : "Valide se paleta, tipografia e logo refletem a direcao estrategica."
  );

  const criticalIssues: string[] = [];
  if (!hasLogoApproved) criticalIssues.push("Logo aprovado ausente.");
  if (!hasSystemVisualApproved) criticalIssues.push("Sistema visual (paleta + tipografia) nao aprovado.");
  if (!hasPdfGenerated) criticalIssues.push("PDF da apresentacao nao gerado.");

  const warnings: string[] = [];
  if (!hasStrategyApproved) warnings.push("Direcao estrategica nao aprovada.");
  if (!piecesApproved) {
    warnings.push(
      `Pecas obrigatorias pendentes: ${unapprovedPieces.map((type) => pieceLabels[type] || type).join(", ")}.`
    );
  }

  const pendingItems: string[] = [];
  if (!hasStrategyApproved) pendingItems.push("Aprovar direcao estrategica");
  if (!hasSystemVisualApproved) pendingItems.push("Aprovar paleta e tipografia");
  if (!hasLogoApproved) pendingItems.push("Aprovar logo final");
  if (!hasPdfGenerated) pendingItems.push("Gerar PDF final da apresentacao");
  missingPieces.forEach((type) => pendingItems.push(`Gerar ${pieceLabels[type] || type}`));
  unapprovedPieces
    .filter((type) => !missingPieces.includes(type))
    .forEach((type) => pendingItems.push(`Aprovar ${pieceLabels[type] || type}`));

  let readinessScore = 0;
  if (hasStrategyApproved) readinessScore += 20;
  if (hasPaletteApproved) readinessScore += 20;
  if (hasTypographyApproved) readinessScore += 20;
  if (hasLogoApproved) readinessScore += 20;
  if (piecesApproved) readinessScore += 10;
  if (hasPdfGenerated) readinessScore += 10;

  const status: BrandConsistencyQaOutput["status"] =
    criticalIssues.length > 0 ? "critico" : warnings.length > 0 || pendingItems.length > 0 ? "em_revisao" : "pronto";

  const summary =
    status === "critico"
      ? "Inconsistencias criticas detectadas. Entrega bloqueada ate correcao."
      : status === "em_revisao"
        ? "Checklist tecnico com pendencias. Recomenda-se revisar antes de entregar."
        : "Consistencia validada. Pronto para etapa operacional final.";

  return {
    status,
    readiness_score: clampScore(readinessScore),
    readiness_for_delivery: criticalIssues.length === 0,
    summary,
    checks,
    critical_issues: criticalIssues,
    warnings,
    pending_items: pendingItems,
  };
}

export async function listBrandAgentConfigs(): Promise<BrandAgentConfig[]> {
  logDomain(DOMAIN, "listBrandAgentConfigs", "info", "Listing agent configs");
  const result = await dbAny
    .from("brand_agent_configs")
    .select("*")
    .order("agent_key", { ascending: true });
  return (unwrap(result, DOMAIN, "listBrandAgentConfigs") || []) as BrandAgentConfig[];
}

export async function upsertBrandAgentConfig(payload: Partial<BrandAgentConfig> & { agent_key: string }) {
  if (payload.id) {
    logDomain(DOMAIN, "upsertBrandAgentConfig", "info", `update=${payload.id}`);
    const result = await dbAny
      .from("brand_agent_configs")
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
    const updated = unwrap(result, DOMAIN, "upsertBrandAgentConfig.update") as BrandAgentConfig;
    await logAction("update_brand_prompt", "brand_agent_config", updated.id, {
      agent_key: updated.agent_key,
      provider: updated.provider,
      model: updated.model,
      is_active: updated.is_active,
    });
    return updated;
  }

  logDomain(DOMAIN, "upsertBrandAgentConfig", "info", `create=${payload.agent_key}`);
  const result = await dbAny.from("brand_agent_configs").insert(payload).select("*").single();
  const created = unwrap(result, DOMAIN, "upsertBrandAgentConfig.create") as BrandAgentConfig;
  await logAction("create_brand_prompt", "brand_agent_config", created.id, {
    agent_key: created.agent_key,
    provider: created.provider,
    model: created.model,
    is_active: created.is_active,
  });
  return created;
}

export async function listBrandAiRuns(limit = 100): Promise<BrandAiRun[]> {
  logDomain(DOMAIN, "listBrandAiRuns", "info", `limit=${limit}`);
  const result = await dbAny
    .from("brand_ai_runs")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandAiRuns") || []) as BrandAiRun[];
}

export async function getBrandAiRunsByProject(projectId: string, limit = 30): Promise<BrandAiRun[]> {
  logDomain(DOMAIN, "getBrandAiRunsByProject", "info", `project=${projectId};limit=${limit}`);
  const result = await dbAny
    .from("brand_ai_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "getBrandAiRunsByProject") || []) as BrandAiRun[];
}

export async function createBrandAiRun(payload: Partial<BrandAiRun> & { project_id: string }) {
  logDomain(DOMAIN, "createBrandAiRun", "info", `project=${payload.project_id}`);
  const result = await dbAny.from("brand_ai_runs").insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "createBrandAiRun") as BrandAiRun;
}

export async function runBrandBriefingAgent(
  project: BrandProject,
  brief: BrandBrief,
  references: BrandBriefReference[]
): Promise<BrandBriefingAgentRunResult> {
  const startedAt = Date.now();
  const fallbackOutput = buildBriefingNormalization(project, brief, references);

  let output = fallbackOutput;
  let usedFallback = true;
  let providerUsed = "local-normalizer";
  let modelUsed = "brand-briefing-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", BRIEFING_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-briefing-agent", {
      body: {
        project,
        brief,
        references,
        fallback: fallbackOutput,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as Partial<BrandBriefingNormalizationOutput>;
      if (candidate.normalized_context && typeof candidate.readiness_score === "number") {
        providerUsed = typeof data.provider_used === "string" && data.provider_used
          ? data.provider_used
          : providerUsed;
        modelUsed = typeof data.model_used === "string" && data.model_used
          ? data.model_used
          : modelUsed;

        output = {
          normalized_context: candidate.normalized_context,
          missing_questions: Array.isArray(candidate.missing_questions)
            ? candidate.missing_questions.map((item) => String(item))
            : fallbackOutput.missing_questions,
          readiness_score: Math.min(100, Math.max(0, round(candidate.readiness_score, 2))),
          gap_summary: candidate.gap_summary || fallbackOutput.gap_summary,
          status: candidate.status === "pronto" ? "pronto" : "incompleto",
        };
        usedFallback = Boolean(data.used_fallback ?? false);
      }
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandBriefingAgent.invokeFallback",
      "warn",
      err instanceof Error ? err.message : "invoke failed"
    );
  }

  const durationMs = Date.now() - startedAt;
  const run = await createBrandAiRun({
    project_id: project.id,
    task_id: null,
    agent_config_id: agentConfigId,
    status: "concluido",
    provider_used: providerUsed,
    model_used: modelUsed,
    input_payload: {
      brief_id: brief.id,
      brief_version: brief.version,
      references_count: references.length,
      has_structured_fields: true,
      agent_key: BRIEFING_AGENT_KEY,
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
  });

  await logAction("run_brand_agent", "brand_agent", run.id, {
    project_id: project.id,
    agent_key: BRIEFING_AGENT_KEY,
    used_fallback: usedFallback,
  });

  return {
    run,
    output,
    used_fallback: usedFallback,
  };
}

export async function runBrandConsistencyQaAgent(payload: {
  project: BrandProject;
  strategy: BrandStrategyOutput | null;
  palette: BrandColorPaletteOutput | null;
  typography: BrandTypographySet | null;
  logo: BrandLogoConcept | null;
  pieces: BrandPiece[];
  versions: BrandVersion[];
}): Promise<{ run: BrandAiRun; output: BrandConsistencyQaOutput; used_fallback: boolean }> {
  const startedAt = Date.now();
  const fallbackOutput = buildConsistencyQaFallback(payload);

  let output = fallbackOutput;
  let usedFallback = true;
  let providerUsed = "local-consistency-qa";
  let modelUsed = "consistency-qa-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", CONSISTENCY_QA_AGENT_KEY)
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
        strategy: payload.strategy,
        palette: payload.palette,
        typography: payload.typography,
        logo: payload.logo,
        pieces: payload.pieces,
        versions: payload.versions,
        fallback: fallbackOutput,
        prompt_version: CONSISTENCY_QA_PROMPT_VERSION,
      },
    });

    if (!error && data) {
      output = normalizeConsistencyQaOutput(data.output || data, fallbackOutput);
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
  const run = await createBrandAiRun({
    project_id: payload.project.id,
    task_id: null,
    agent_config_id: agentConfigId,
    status: "concluido",
    provider_used: providerUsed,
    model_used: modelUsed,
    input_payload: {
      agent_key: CONSISTENCY_QA_AGENT_KEY,
      prompt_version: CONSISTENCY_QA_PROMPT_VERSION,
      strategy_id: payload.strategy?.id || null,
      palette_id: payload.palette?.id || null,
      typography_id: payload.typography?.id || null,
      logo_id: payload.logo?.id || null,
      pieces_count: payload.pieces.length,
      versions_count: payload.versions.length,
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
  });

  await logAction("run_brand_agent", "brand_agent", run.id, {
    project_id: payload.project.id,
    agent_key: CONSISTENCY_QA_AGENT_KEY,
    used_fallback: usedFallback,
    prompt_version: CONSISTENCY_QA_PROMPT_VERSION,
  });

  return {
    run,
    output,
    used_fallback: usedFallback,
  };
}

export async function countBrandAiRuns(): Promise<number> {
  logDomain(DOMAIN, "countBrandAiRuns", "info", "Counting AI runs");
  const { count, error } = await dbAny
    .from("brand_ai_runs")
    .select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandAiRuns", "error", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function countBrandPendingReviews(): Promise<number> {
  logDomain(DOMAIN, "countBrandPendingReviews", "info", "Counting pending reviews");
  const { count, error } = await dbAny
    .from("brand_ai_runs")
    .select("*", { count: "exact", head: true })
    .in("status", ["aguardando_revisao", "em_revisao"]);
  if (error) {
    logDomain(DOMAIN, "countBrandPendingReviews", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
