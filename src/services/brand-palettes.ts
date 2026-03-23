import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { createBrandAiRun } from "@/services/brand-agents";
import type {
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandColorPaletteExecutionResult,
  BrandColorPaletteOutput,
  BrandColorPaletteOutputPayload,
  BrandColorPaletteStatus,
  BrandProject,
  BrandStrategyOutput,
  BrandVersion,
} from "@/types/brand-studio";

const DOMAIN = "brand-palettes";
const TABLE = "brand_color_palettes";
const PALETTE_AGENT_KEY = "color_palette_agent";
const PROMPT_VERSION = "brand_palette_v1";

const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const toText = (value: unknown) => String(value || "").trim();

const ensureHex = (value: unknown, fallback: string) => {
  const text = String(value || "").trim();
  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text.toUpperCase();
  return fallback;
};

function buildFallbackPalette(brief: BrandBrief, strategy?: BrandStrategyOutput | null): BrandColorPaletteOutputPayload {
  const brandName = brief.nome_marca || "Marca";
  const tone = strategy?.output_payload?.tom_visual || brief.estilos_desejados?.[0] || "sofisticado";
  const attributes = strategy?.output_payload?.atributos || [];

  return {
    paleta_principal: [
      { nome: "Navy 900", hex: "#0B1D2E", role: "base", usage: "cabecalhos, fundos escuros" },
      { nome: "Navy 700", hex: "#1D3557", role: "primaria", usage: "botoes, links" },
      { nome: "Teal 600", hex: "#2A7F7A", role: "apoio", usage: "destaques secundarios" },
    ],
    paleta_secundaria: [
      { nome: "Terracotta 500", hex: "#D9734F", role: "acentos", usage: "tags, highlights" },
      { nome: "Sand 300", hex: "#E7D6C3", role: "superficie", usage: "cards e planos" },
    ],
    neutros: [
      { nome: "Slate 900", hex: "#111418", role: "texto", usage: "texto principal" },
      { nome: "Slate 600", hex: "#5B6472", role: "muted", usage: "texto secundario" },
      { nome: "Stone 100", hex: "#F4F2EE", role: "background", usage: "fundos claros" },
      { nome: "White", hex: "#FFFFFF", role: "white", usage: "espacos negativos" },
    ],
    destaque: { nome: "Amber 500", hex: "#F2A900", role: "cta", usage: "acoes prioritarias" },
    rationale: `Paleta alinhada ao tom ${tone} de ${brandName}, equilibrando autoridade e calor humano.`,
    acessibilidade: {
      notas: "Priorizar contraste AA em textos, com combinacoes Navy/Stone e Slate/White.",
      contrastes_recomendados: ["Navy 900 com Stone 100", "Slate 900 com White", "Teal 600 com Stone 100"],
      evitar: ["Terracotta 500 com Amber 500", "Slate 600 com Sand 300"],
    },
  };
}

function coerceSwatchList(value: unknown, fallback: BrandColorPaletteOutputPayload["paleta_principal"]) {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .map((item) => (typeof item === "object" && item ? (item as Record<string, unknown>) : null))
    .filter(Boolean)
    .map((item, index) => {
      const fallbackItem = fallback[index] || fallback[0];
      return {
        nome: toText(item?.nome || fallbackItem.nome),
        hex: ensureHex(item?.hex, fallbackItem.hex),
        role: toText(item?.role || fallbackItem.role || ""),
        usage: toText(item?.usage || fallbackItem.usage || ""),
      };
    });
  return list.length ? list : fallback;
}

function coerceOutput(candidate: unknown, fallback: BrandColorPaletteOutputPayload): BrandColorPaletteOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
  const root = candidate as Record<string, unknown>;
  const raw =
    root.output && typeof root.output === "object"
      ? (root.output as Record<string, unknown>)
      : root;

  const destaqueRaw = raw.destaque && typeof raw.destaque === "object" ? (raw.destaque as Record<string, unknown>) : null;

  return {
    paleta_principal: coerceSwatchList(raw.paleta_principal, fallback.paleta_principal),
    paleta_secundaria: coerceSwatchList(raw.paleta_secundaria, fallback.paleta_secundaria),
    neutros: coerceSwatchList(raw.neutros, fallback.neutros),
    destaque: {
      nome: toText(destaqueRaw?.nome || fallback.destaque?.nome || "Destaque"),
      hex: ensureHex(destaqueRaw?.hex, fallback.destaque?.hex || "#F2A900"),
      role: toText(destaqueRaw?.role || fallback.destaque?.role || "cta"),
      usage: toText(destaqueRaw?.usage || fallback.destaque?.usage || "acoes"),
    },
    rationale: toText(raw.rationale || fallback.rationale),
    acessibilidade: {
      notas: toText((raw.acessibilidade as any)?.notas || fallback.acessibilidade.notas),
      contrastes_recomendados: asList((raw.acessibilidade as any)?.contrastes_recomendados).length
        ? asList((raw.acessibilidade as any)?.contrastes_recomendados)
        : fallback.acessibilidade.contrastes_recomendados,
      evitar: asList((raw.acessibilidade as any)?.evitar).length
        ? asList((raw.acessibilidade as any)?.evitar)
        : fallback.acessibilidade.evitar,
    },
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

async function nextPaletteVersionNumber(projectId: string): Promise<number> {
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

export async function listBrandColorPalettesByProject(projectId: string, limit = 10): Promise<BrandColorPaletteOutput[]> {
  logDomain(DOMAIN, "listBrandColorPalettesByProject", "info", `project=${projectId};limit=${limit}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandColorPalettesByProject") || []) as BrandColorPaletteOutput[];
}

export async function getLatestBrandColorPalette(projectId: string): Promise<BrandColorPaletteOutput | null> {
  logDomain(DOMAIN, "getLatestBrandColorPalette", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (unwrap(result, DOMAIN, "getLatestBrandColorPalette") || null) as BrandColorPaletteOutput | null;
}

export async function updateBrandColorPaletteStatus(
  id: string,
  status: BrandColorPaletteStatus
): Promise<BrandColorPaletteOutput> {
  logDomain(DOMAIN, "updateBrandColorPaletteStatus", "info", `id=${id};status=${status}`);
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
  return unwrap(result, DOMAIN, "updateBrandColorPaletteStatus") as BrandColorPaletteOutput;
}

export async function runBrandColorPaletteAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
  strategy?: BrandStrategyOutput | null;
}): Promise<BrandColorPaletteExecutionResult> {
  const startedAt = Date.now();
  const fallback = buildFallbackPalette(payload.brief, payload.strategy);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-palette";
  let modelUsed = "brand-palette-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", PALETTE_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-color-palette-agent", {
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
      const candidate = (data.output || data) as BrandColorPaletteOutputPayload;
      output = coerceOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBrandColorPaletteAgent.invokeFallback",
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
      agent_key: PALETTE_AGENT_KEY,
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
  const versionNumber = await nextPaletteVersionNumber(payload.project.id);

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

  const outputRow = unwrap(saved, DOMAIN, "runBrandColorPaletteAgent.insert") as BrandColorPaletteOutput;

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}
