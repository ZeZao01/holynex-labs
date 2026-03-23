import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { logAction } from "@/lib/audit-logs";
import { createBrandAiRun } from "@/services/brand-agents";
import type {
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandProject,
  BrandStrategyOutput,
  BrandTypographyExecutionResult,
  BrandTypographyOutputPayload,
  BrandTypographySet,
  BrandTypographyStatus,
  BrandVersion,
} from "@/types/brand-studio";

const DOMAIN = "brand-typography";
const TABLE = "brand_typography_sets";
const TYPOGRAPHY_AGENT_KEY = "typography_agent";
const PROMPT_VERSION = "brand_typography_v1";

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallbackTypography(brief: BrandBrief, strategy?: BrandStrategyOutput | null): BrandTypographyOutputPayload {
  const tone = strategy?.output_payload?.tom_visual || brief.estilos_desejados?.[0] || "moderno";
  const niche = brief.nicho || "mercado";

  return {
    fontes_sugeridas: [
      { nome: "IBM Plex Sans", categoria: "sans", usos: ["interfaces", "textos longos"] },
      { nome: "Playfair Display", categoria: "serif", usos: ["titulos", "destaques"] },
    ],
    pesos: [
      { fonte: "IBM Plex Sans", pesos: ["300", "400", "500", "600"] },
      { fonte: "Playfair Display", pesos: ["400", "600", "700"] },
    ],
    fallback: ["system-ui", "-apple-system", "Segoe UI", "Arial", "sans-serif"],
    regras_uso: [
      `Priorizar ${tone} e legibilidade em todos os canais do setor de ${niche}.`,
      "Usar serif para titulos e sans para corpo para criar contraste hierarquico.",
      "Manter tracking neutro e espacamento de linha 1.4+ para textos longos.",
    ],
    regras_evitar: [
      "Evitar excesso de familias tipograficas (maximo 2).",
      "Nao usar pesos ultrafinos em tamanhos pequenos.",
      "Evitar combinacoes muito decorativas para texto corrido.",
    ],
  };
}

function coerceOutput(candidate: unknown, fallback: BrandTypographyOutputPayload): BrandTypographyOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  const fontes = Array.isArray(raw.fontes_sugeridas)
    ? raw.fontes_sugeridas
    : fallback.fontes_sugeridas;
  const pesos = Array.isArray(raw.pesos) ? raw.pesos : fallback.pesos;

  return {
    fontes_sugeridas: fontes.map((item, index) => {
      const base = fallback.fontes_sugeridas[index] || fallback.fontes_sugeridas[0];
      const payload = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
      return {
        nome: toText(payload.nome || base.nome),
        categoria: toText(payload.categoria || base.categoria),
        usos: asList(payload.usos).length ? asList(payload.usos) : base.usos,
      };
    }),
    pesos: pesos.map((item, index) => {
      const base = fallback.pesos[index] || fallback.pesos[0];
      const payload = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
      return {
        fonte: toText(payload.fonte || base.fonte),
        pesos: asList(payload.pesos).length ? asList(payload.pesos) : base.pesos,
      };
    }),
    fallback: asList(raw.fallback).length ? asList(raw.fallback) : fallback.fallback,
    regras_uso: asList(raw.regras_uso).length ? asList(raw.regras_uso) : fallback.regras_uso,
    regras_evitar: asList(raw.regras_evitar).length ? asList(raw.regras_evitar) : fallback.regras_evitar,
  };
}

async function ensureBrandVersion(projectId: string): Promise<BrandVersion> {
  const latest = await dbAny
    .from("brand_versions")
    .select("*")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest.error && latest.data) return latest.data as BrandVersion;

  const created = await dbAny
    .from("brand_versions")
    .insert({
      project_id: projectId,
      version_number: 1,
      label: "Sistema visual v1",
      status: "em_criacao",
      summary: "Base visual inicial",
      change_log: ["Criacao da base visual"],
    })
    .select("*")
    .single();

  return unwrap(created, DOMAIN, "ensureBrandVersion") as BrandVersion;
}

async function nextTypographyVersionNumber(projectId: string): Promise<number> {
  const result = await dbAny
    .from(TABLE)
    .select("version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!result.error && result.data?.version_number) return Number(result.data.version_number) + 1;
  return 1;
}

export async function listBrandTypographySetsByProject(projectId: string, limit = 10): Promise<BrandTypographySet[]> {
  logDomain(DOMAIN, "listBrandTypographySetsByProject", "info", `project=${projectId};limit=${limit}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandTypographySetsByProject") || []) as BrandTypographySet[];
}

export async function getLatestBrandTypographySet(projectId: string): Promise<BrandTypographySet | null> {
  logDomain(DOMAIN, "getLatestBrandTypographySet", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (unwrap(result, DOMAIN, "getLatestBrandTypographySet") || null) as BrandTypographySet | null;
}

export async function updateBrandTypographyStatus(
  id: string,
  status: BrandTypographyStatus
): Promise<BrandTypographySet> {
  logDomain(DOMAIN, "updateBrandTypographyStatus", "info", `id=${id};status=${status}`);
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id || null;
  const payload: Record<string, unknown> = { status };
  if (status === "aprovado") {
    payload.approved_at = new Date().toISOString();
    if (userId) payload.approved_by = userId;
  } else {
    payload.approved_at = null;
    payload.approved_by = null;
  }

  const result = await dbAny.from(TABLE).update(payload).eq("id", id).select("*").single();
  const updated = unwrap(result, DOMAIN, "updateBrandTypographyStatus") as BrandTypographySet;
  await logAction(status === "aprovado" ? "approve_brand_asset" : "reject_brand_asset", "brand_typography", updated.id, {
    project_id: updated.project_id,
    status,
  });
  return updated;
}

export async function runBrandTypographyAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
  strategy?: BrandStrategyOutput | null;
}): Promise<BrandTypographyExecutionResult> {
  const startedAt = Date.now();
  const fallback = buildFallbackTypography(payload.brief, payload.strategy);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-typography";
  let modelUsed = "brand-typography-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", TYPOGRAPHY_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-typography-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        references: payload.references,
        strategy: payload.strategy?.output_payload || null,
        fallback,
        prompt_version: PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandTypographyOutputPayload;
      output = coerceOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandTypographyAgent.invokeFallback",
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
      agent_key: TYPOGRAPHY_AGENT_KEY,
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

  const version = await ensureBrandVersion(payload.project.id);
  const versionNumber = await nextTypographyVersionNumber(payload.project.id);

  const saved = await dbAny
    .from(TABLE)
    .insert({
      project_id: payload.project.id,
      brief_id: payload.brief.id,
      strategy_id: payload.strategy?.id || null,
      ai_run_id: run.id,
      version_id: version.id,
      version_number: versionNumber,
      status: "pendente",
      prompt_version: PROMPT_VERSION,
      provider_used: providerUsed,
      model_used: modelUsed,
      output_payload: output,
    })
    .select("*")
    .single();

  const outputRow = unwrap(saved, DOMAIN, "runBrandTypographyAgent.insert") as BrandTypographySet;

  await logAction("run_brand_agent", "brand_agent", run.id, {
    project_id: payload.project.id,
    agent_key: TYPOGRAPHY_AGENT_KEY,
    used_fallback: usedFallback,
    prompt_version: PROMPT_VERSION,
  });

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}
