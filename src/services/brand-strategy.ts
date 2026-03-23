import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { logAction } from "@/lib/audit-logs";
import { createBrandAiRun } from "@/services/brand-agents";
import type {
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandProject,
  BrandStrategyExecutionResult,
  BrandStrategyOutput,
  BrandStrategyOutputPayload,
  BrandStrategyStatus,
} from "@/types/brand-studio";

const DOMAIN = "brand-strategy";
const TABLE = "brand_strategy_outputs";
const STRATEGY_AGENT_KEY = "brand_strategy_agent";
const PROMPT_VERSION = "brand_strategy_v1";

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallbackStrategy(brief: BrandBrief, references: BrandBriefReference[]): BrandStrategyOutputPayload {
  const brand = brief.nome_marca || "Marca";
  const niche = brief.nicho || "nicho principal";
  const value = brief.proposta_valor || "proposta de valor";
  const audience = brief.publico_alvo_detalhado || brief.publico_alvo || "publico-alvo";
  const desired = asList(brief.estilos_desejados);
  const avoid = asList(brief.estilos_evitar);
  const goals = asList(brief.objetivos_identidade);
  const baseKeywords = [brand, niche, value].map((item) => toText(item)).filter(Boolean);

  const directions = [
    {
      titulo: "Essencia Estrategica",
      descricao: `Direcao que reforca autoridade e clareza no setor de ${niche}.`,
      justificativa_estrategica: `Conecta a proposta de valor com sinais de confianca para ${audience}.`,
      tom_visual: desired[0] || "sofisticado e direto",
      atributos_chave: ["confianca", "clareza", "consistencia"],
      palavras_chave: baseKeywords,
      aplicacoes: ["logo", "paleta", "tipografia", "materiais institucionais"],
      evitar: avoid.length ? avoid : ["visual generico", "excesso de ornamentos"],
    },
    {
      titulo: "Proposta Memoravel",
      descricao: "Direcao que destaca diferencial competitivo e cria reconhecimento rapido.",
      justificativa_estrategica: `Amplifica a percepcao de ${value} em todos os pontos de contato.`,
      tom_visual: desired[1] || "marcante e contemporaneo",
      atributos_chave: ["diferenciacao", "energia", "memorabilidade"],
      palavras_chave: baseKeywords,
      aplicacoes: ["campanhas", "landing pages", "apresentacoes"],
      evitar: avoid.length ? avoid : ["mensagens vagas", "visual datado"],
    },
    {
      titulo: "Conexao Humana",
      descricao: "Direcao focada em proximidade e empatia, sem perder sofisticacao.",
      justificativa_estrategica: `Cria ponte emocional com ${audience} e facilita conversao.`,
      tom_visual: desired[2] || "acolhedor e elegante",
      atributos_chave: ["empatia", "acessibilidade", "autenticidade"],
      palavras_chave: baseKeywords,
      aplicacoes: ["redes sociais", "conteudo educativo", "experiencia digital"],
      evitar: avoid.length ? avoid : ["tom frio", "excesso de formalidade"],
    },
  ];

  return {
    posicionamento: `Marca posicionada em ${niche}, com foco em ${value} para ${audience}.`,
    arquetipo: "Sabio",
    atributos: ["confiavel", "estrategico", "moderno", ...goals].filter(Boolean),
    tom_visual: desired[0] || "sofisticado, claro e atual",
    direcoes_criativas: directions,
    evitar: [...new Set([...avoid, "inconsistencia visual", "promessas exageradas"])].filter(Boolean),
    recomendacao_principal: directions[0].titulo,
  };
}

function coerceOutput(candidate: unknown, fallback: BrandStrategyOutputPayload): BrandStrategyOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
  const raw = (candidate as { output?: unknown }).output ?? candidate;
  if (!raw || typeof raw !== "object") return fallback;

  const payload = raw as Record<string, unknown>;
  const directions = Array.isArray(payload.direcoes_criativas)
    ? payload.direcoes_criativas
    : fallback.direcoes_criativas;

  return {
    posicionamento: toText(payload.posicionamento || fallback.posicionamento),
    arquetipo: toText(payload.arquetipo || fallback.arquetipo),
    atributos: asList(payload.atributos).length ? asList(payload.atributos) : fallback.atributos,
    tom_visual: toText(payload.tom_visual || fallback.tom_visual),
    direcoes_criativas: directions as BrandStrategyOutputPayload["direcoes_criativas"],
    evitar: asList(payload.evitar).length ? asList(payload.evitar) : fallback.evitar,
    recomendacao_principal: toText(payload.recomendacao_principal || fallback.recomendacao_principal),
  };
}

export async function listBrandStrategyOutputsByProject(projectId: string, limit = 10): Promise<BrandStrategyOutput[]> {
  logDomain(DOMAIN, "listBrandStrategyOutputsByProject", "info", `project=${projectId};limit=${limit}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandStrategyOutputsByProject") || []) as BrandStrategyOutput[];
}

export async function getLatestBrandStrategyOutput(projectId: string): Promise<BrandStrategyOutput | null> {
  logDomain(DOMAIN, "getLatestBrandStrategyOutput", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (unwrap(result, DOMAIN, "getLatestBrandStrategyOutput") || null) as BrandStrategyOutput | null;
}

export async function updateBrandStrategyStatus(
  id: string,
  status: BrandStrategyStatus
): Promise<BrandStrategyOutput> {
  logDomain(DOMAIN, "updateBrandStrategyStatus", "info", `id=${id};status=${status}`);
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
  const updated = unwrap(result, DOMAIN, "updateBrandStrategyStatus") as BrandStrategyOutput;
  await logAction(status === "aprovado" ? "approve_brand_asset" : "reject_brand_asset", "brand_strategy", updated.id, {
    project_id: updated.project_id,
    status,
  });
  return updated;
}

export async function runBrandStrategyAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
}): Promise<BrandStrategyExecutionResult> {
  const startedAt = Date.now();
  const fallback = buildFallbackStrategy(payload.brief, payload.references);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-strategy";
  let modelUsed = "brand-strategy-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", STRATEGY_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-strategy-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        references: payload.references,
        normalized_context: payload.brief.normalized_context || null,
        fallback,
        prompt_version: PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandStrategyOutputPayload;
      output = coerceOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandStrategyAgent.invokeFallback",
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
      agent_key: STRATEGY_AGENT_KEY,
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

  const saved = await dbAny
    .from(TABLE)
    .insert({
      project_id: payload.project.id,
      brief_id: payload.brief.id,
      ai_run_id: run.id,
      status: "pendente",
      prompt_version: PROMPT_VERSION,
      provider_used: providerUsed,
      model_used: modelUsed,
      output_payload: output,
    })
    .select("*")
    .single();

  const outputRow = unwrap(saved, DOMAIN, "runBrandStrategyAgent.insert") as BrandStrategyOutput;

  await logAction("run_brand_agent", "brand_agent", run.id, {
    project_id: payload.project.id,
    agent_key: STRATEGY_AGENT_KEY,
    used_fallback: usedFallback,
    prompt_version: PROMPT_VERSION,
  });

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}
