import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { createBrandAiRun } from "@/services/brand-agents";
import type {
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandColorPaletteOutput,
  BrandLogoConcept,
  BrandLogoConceptExecutionResult,
  BrandLogoConceptItem,
  BrandLogoConceptOutputPayload,
  BrandLogoConceptStatus,
  BrandLogoCriticExecutionResult,
  BrandLogoCriticOutputPayload,
  BrandProject,
  BrandStrategyOutput,
  BrandTypographySet,
  BrandVersion,
} from "@/types/brand-studio";

const DOMAIN = "brand-logo";
const TABLE = "brand_logo_concepts";
const CONCEPT_AGENT_KEY = "logo_concept_agent";
const CRITIC_AGENT_KEY = "logo_critic_agent";
const PROMPT_VERSION = "brand_logo_concept_v1";
const CRITIC_PROMPT_VERSION = "brand_logo_critic_v1";

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

function buildFallbackConcepts(brief: BrandBrief, strategy?: BrandStrategyOutput | null): BrandLogoConceptOutputPayload {
  const brand = brief.nome_marca || "Marca";
  const niche = brief.nicho || "nicho";
  const tone = strategy?.output_payload?.tom_visual || brief.estilos_desejados?.[0] || "sofisticado";
  const avoid = asList(brief.estilos_evitar);

  const baseNegative = avoid.length
    ? avoid
    : ["visual generico", "ornamentos excessivos", "detalhes finos demais"];

  const conceitos: BrandLogoConceptItem[] = [
    {
      titulo: "Sinal de Confiança",
      racional_estrategico: `Simbolo minimalista que reforca autoridade em ${niche}, com foco em credibilidade e clareza para ${brand}.`,
      simbolo: "Monograma geometrico com eixo vertical firme e cantos suavizados.",
      wordmark: "Tipografia sem serifa com cortes precisos e espaçamento amplo.",
      prompt_visual: `Logo minimalista para ${brand}, monograma geometricamente balanceado, traços firmes, tom ${tone}, fundo neutro, alto contraste, acabamento premium, grid preciso.`,
      negative_guidance: baseNegative,
    },
    {
      titulo: "Energia Distintiva",
      racional_estrategico: `Marca destaca diferencial competitivo com simbolo dinamico e memoravel para ${brand}.`,
      simbolo: "Forma abstrata modular sugerindo movimento e progresso.",
      wordmark: "Sans contemporanea com leves cortes diagonais e ritmo visual.",
      prompt_visual: `Logo contemporaneo para ${brand}, simbolo abstrato modular com ritmo, sensacao de movimento controlado, composicao horizontal, tom ${tone}, fundo claro, sem sombras.`,
      negative_guidance: baseNegative,
    },
    {
      titulo: "Elegancia Humana",
      racional_estrategico: `Direcao que equilibra proximidade e sofisticacao, com sinal visual acolhedor para ${brand}.`,
      simbolo: "Emblema simples com curvas suaves e proporcoes classicas.",
      wordmark: "Serif moderna com contraste sutil e legibilidade alta.",
      prompt_visual: `Logo elegante para ${brand}, emblema simples com curvas suaves, serif moderna legivel, tom ${tone}, composicao equilibrada, uso de espaco negativo.`,
      negative_guidance: baseNegative,
    },
  ];

  return {
    conceitos,
    recomendacao_principal: conceitos[0].titulo,
  };
}

function coerceConceptItem(raw: Record<string, unknown>, fallback: BrandLogoConceptItem): BrandLogoConceptItem {
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

function coerceConceptOutput(candidate: unknown, fallback: BrandLogoConceptOutputPayload): BrandLogoConceptOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  const conceitosRaw = Array.isArray(raw.conceitos) ? raw.conceitos : [];
  const conceitos = conceitosRaw.length
    ? conceitosRaw.map((item, index) =>
        coerceConceptItem(
          typeof item === "object" && item ? (item as Record<string, unknown>) : {},
          fallback.conceitos[index] || fallback.conceitos[0]
        )
      )
    : fallback.conceitos;

  return {
    conceitos,
    recomendacao_principal: toText(raw.recomendacao_principal || fallback.recomendacao_principal),
  };
}

function buildFallbackCritic(concept: BrandLogoConceptItem): BrandLogoCriticOutputPayload {
  return {
    riscos: ["Detalhes finos podem perder definicao em tamanhos reduzidos."],
    legibilidade: "Boa legibilidade em tamanhos medios, revisar microdetalhes do wordmark.",
    escalabilidade: "Escalavel para digital e impresso com ajustes minimos de espessura.",
    ajustes_recomendados: [
      "Simplificar elementos internos do simbolo.",
      "Aumentar espessura minima para uso em favicon.",
    ],
    recomendacao_aprovacao: "revisar",
    observacoes: [
      `Reforcar contraste entre simbolo e wordmark no conceito "${concept.titulo}".`,
    ],
  };
}

function coerceCriticOutput(candidate: unknown, fallback: BrandLogoCriticOutputPayload): BrandLogoCriticOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
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
      label: "Logo v1",
      status: "em_criacao",
      summary: "Primeiros conceitos de logo",
      change_log: ["Geracao de conceitos iniciais"],
    })
    .select("*")
    .single();

  return unwrap(created, DOMAIN, "ensureBrandVersion") as BrandVersion;
}

async function nextLogoVersionNumber(projectId: string): Promise<number> {
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

export async function listBrandLogoConceptsByProject(projectId: string, limit = 10): Promise<BrandLogoConcept[]> {
  logDomain(DOMAIN, "listBrandLogoConceptsByProject", "info", `project=${projectId};limit=${limit}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandLogoConceptsByProject") || []) as BrandLogoConcept[];
}

export async function updateBrandLogoConceptStatus(
  id: string,
  status: BrandLogoConceptStatus
): Promise<BrandLogoConcept> {
  logDomain(DOMAIN, "updateBrandLogoConceptStatus", "info", `id=${id};status=${status}`);
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
  return unwrap(result, DOMAIN, "updateBrandLogoConceptStatus") as BrandLogoConcept;
}

export async function updateBrandLogoConceptSelection(payload: {
  id: string;
  selected_concept_index: number;
  selected_concept_title?: string | null;
}) {
  logDomain(DOMAIN, "updateBrandLogoConceptSelection", "info", `id=${payload.id}`);
  const result = await dbAny
    .from(TABLE)
    .update({
      selected_concept_index: payload.selected_concept_index,
      selected_concept_title: payload.selected_concept_title || null,
    })
    .eq("id", payload.id)
    .select("*")
    .single();
  return unwrap(result, DOMAIN, "updateBrandLogoConceptSelection") as BrandLogoConcept;
}

export async function runBrandLogoConceptAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
  strategy?: BrandStrategyOutput | null;
  palette?: BrandColorPaletteOutput | null;
  typography?: BrandTypographySet | null;
}): Promise<BrandLogoConceptExecutionResult> {
  const startedAt = Date.now();
  const fallback = buildFallbackConcepts(payload.brief, payload.strategy);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-logo-concept";
  let modelUsed = "brand-logo-concept-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", CONCEPT_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-logo-concept-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        references: payload.references,
        strategy: payload.strategy?.output_payload || null,
        palette: payload.palette?.output_payload || null,
        typography: payload.typography?.output_payload || null,
        normalized_context: payload.brief.normalized_context || null,
        fallback,
        prompt_version: PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandLogoConceptOutputPayload;
      output = coerceConceptOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandLogoConceptAgent.invokeFallback",
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
      agent_key: CONCEPT_AGENT_KEY,
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
  const versionNumber = await nextLogoVersionNumber(payload.project.id);

  const saved = await dbAny
    .from(TABLE)
    .insert({
      project_id: payload.project.id,
      brief_id: payload.brief.id,
      strategy_id: payload.strategy?.id || null,
      palette_id: payload.palette?.id || null,
      typography_id: payload.typography?.id || null,
      ai_run_id: run.id,
      version_id: version.id,
      version_number: versionNumber,
      status: "pendente",
      prompt_version: PROMPT_VERSION,
      provider_used: providerUsed,
      model_used: modelUsed,
      output_payload: output,
      selected_concept_index: 0,
      selected_concept_title: output.conceitos[0]?.titulo || null,
    })
    .select("*")
    .single();

  const outputRow = unwrap(saved, DOMAIN, "runBrandLogoConceptAgent.insert") as BrandLogoConcept;

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}

export async function runBrandLogoCriticAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
  concept: BrandLogoConcept;
  selectedConceptIndex: number;
}): Promise<BrandLogoCriticExecutionResult> {
  const startedAt = Date.now();
  const concepts = payload.concept.output_payload?.conceitos || [];
  const selected = concepts[payload.selectedConceptIndex] || concepts[0];
  if (!selected) {
    throw new Error("Nenhum conceito disponivel para critica");
  }

  const fallback = buildFallbackCritic(selected);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-logo-critic";
  let modelUsed = "brand-logo-critic-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", CRITIC_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-logo-critic-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        references: payload.references,
        concept: selected,
        concept_index: payload.selectedConceptIndex,
        fallback,
        prompt_version: CRITIC_PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandLogoCriticOutputPayload;
      output = coerceCriticOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandLogoCriticAgent.invokeFallback",
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
      concept_id: payload.concept.id,
      selected_concept_index: payload.selectedConceptIndex,
      agent_key: CRITIC_AGENT_KEY,
      prompt_version: CRITIC_PROMPT_VERSION,
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

  const updated = await dbAny
    .from(TABLE)
    .update({
      critic_ai_run_id: run.id,
      critic_prompt_version: CRITIC_PROMPT_VERSION,
      critic_provider_used: providerUsed,
      critic_model_used: modelUsed,
      critic_payload: output,
      critic_status: "concluido",
      critic_at: new Date().toISOString(),
      selected_concept_index: payload.selectedConceptIndex,
      selected_concept_title: selected.titulo,
    })
    .eq("id", payload.concept.id)
    .select("*")
    .single();

  const outputRow = unwrap(updated, DOMAIN, "runBrandLogoCriticAgent.update") as BrandLogoConcept;

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}
