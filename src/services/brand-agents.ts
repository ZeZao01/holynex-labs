import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import type {
  BrandAgentConfig,
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandBriefingAgentRunResult,
  BrandBriefingNormalizationOutput,
  BrandProject,
} from "@/types/brand-studio";

const DOMAIN = "brand-agents";
const BRIEFING_AGENT_KEY = "brand_briefing_agent";

const normalizeTextList = (values: (string | null | undefined)[] | null | undefined): string[] =>
  [...new Set((values || []).map((item) => String(item || "").trim()).filter(Boolean))];

const round = (value: number, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

function buildBriefingNormalization(
  project: BrandProject,
  brief: BrandBrief,
  references: BrandBriefReference[]
): BrandBriefingNormalizationOutput {
  const imageReferences = references
    .filter((ref) => ref.reference_type === "image")
    .map((ref) => ref.public_url || ref.source_url || "")
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
    return unwrap(result, DOMAIN, "upsertBrandAgentConfig.update") as BrandAgentConfig;
  }

  logDomain(DOMAIN, "upsertBrandAgentConfig", "info", `create=${payload.agent_key}`);
  const result = await dbAny.from("brand_agent_configs").insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "upsertBrandAgentConfig.create") as BrandAgentConfig;
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
        output = {
          normalized_context: candidate.normalized_context,
          missing_questions: Array.isArray(candidate.missing_questions)
            ? candidate.missing_questions.map((item) => String(item))
            : fallbackOutput.missing_questions,
          readiness_score: Math.min(100, Math.max(0, round(candidate.readiness_score, 2))),
          gap_summary: candidate.gap_summary || fallbackOutput.gap_summary,
          status: candidate.status === "pronto" ? "pronto" : "incompleto",
        };
        usedFallback = false;
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
