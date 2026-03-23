import { supabase } from "@/integrations/supabase/client";
import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { logAction } from "@/lib/audit-logs";
import { createBrandAiRun } from "@/services/brand-agents";
import type {
  BrandAiRun,
  BrandBrief,
  BrandBriefReference,
  BrandBusinessCardOutputPayload,
  BrandFlyerOutputPayload,
  BrandLogoConcept,
  BrandPiece,
  BrandPieceStatus,
  BrandPieceType,
  BrandProject,
  BrandStrategyOutput,
  BrandTypographySet,
  BrandColorPaletteOutput,
} from "@/types/brand-studio";

const DOMAIN = "brand-pieces";
const TABLE = "brand_pieces";
const BUSINESS_CARD_AGENT_KEY = "business_card_agent";
const FLYER_AGENT_KEY = "flyer_agent";
const BUSINESS_CARD_PROMPT_VERSION = "business_card_v1";
const FLYER_PROMPT_VERSION = "flyer_v1";

const toText = (value: unknown) => String(value || "").trim();
const asList = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.map((item) => String(item || "").trim()).filter(Boolean))]
    : [];

const pieceLabel: Record<BrandPieceType, string> = {
  business_card: "Cartao de visita",
  flyer: "Flyer",
  profile_cover: "Capa de perfil",
  email_signature: "Assinatura de e-mail",
  letterhead: "Papel timbrado",
  quick_guide: "Manual rapido",
};

async function createBrandVersionForPiece(projectId: string, pieceType: BrandPieceType) {
  const latest = await dbAny
    .from("brand_versions")
    .select("id, version_number")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (latest.data?.version_number || 0) + 1;
  const result = await dbAny
    .from("brand_versions")
    .insert({
      project_id: projectId,
      version_number: nextNumber,
      label: `Peca: ${pieceLabel[pieceType]}`,
      summary: `Gerado por ${pieceType}`,
      change_log: [`Geracao ${pieceType}`],
      status: "em_criacao",
    })
    .select("*")
    .single();

  return unwrap(result, DOMAIN, "createBrandVersionForPiece");
}

async function createPieceAsset(payload: {
  project_id: string;
  version_id: string | null;
  piece_id: string;
  piece_type: BrandPieceType;
  prompt_visual: string;
}) {
  const storagePath = `pieces/${payload.piece_type}/${payload.piece_id}.json`;
  const result = await dbAny
    .from("brand_design_assets")
    .insert({
      project_id: payload.project_id,
      version_id: payload.version_id,
      bucket: "brand-generated",
      storage_path: storagePath,
      asset_type: "document",
      mime_type: "application/json",
      metadata: {
        piece_id: payload.piece_id,
        piece_type: payload.piece_type,
        prompt_visual: payload.prompt_visual,
      },
    })
    .select("*")
    .single();

  return unwrap(result, DOMAIN, "createPieceAsset");
}

function buildBusinessCardFallback(brief: BrandBrief, strategy: BrandStrategyOutput | null): BrandBusinessCardOutputPayload {
  const brand = brief.nome_marca || "Marca";
  const slogan = brief.slogan || "";
  const positioning = strategy?.output_payload?.posicionamento || brief.proposta_valor || "Proposta de valor";

  return {
    formato: "90 x 50 mm, frente e verso",
    layout_frente: `Logo central com ${brand} em destaque. Slogan ${slogan ? `\"${slogan}\"` : "alinhado abaixo"}. Uso de area de respiro generosa.`,
    layout_verso: "Dados de contato em coluna esquerda, QR code alinhado a direita, barra de cor principal no rodape.",
    hierarquia_conteudo: [
      "Nome completo",
      "Cargo",
      "Telefone",
      "Email",
      "Site",
      "Endereco (opcional)",
    ],
    prompt_visual: `Cartao de visita premium para ${brand}. Frente minimalista com logo central e slogan discreto. Verso com hierarquia clara, tipografia consistente, grid alinhado, uso da paleta aprovada, acabamento fosco. Direcao: ${positioning}.`,
    notas_impressao: [
      "Margem de seguranca 3 mm e sangria 2 mm.",
      "Exportar em CMYK, 300 DPI.",
      "Usar papel 300g e acabamento fosco.",
    ],
  };
}

function buildFlyerFallback(brief: BrandBrief, strategy: BrandStrategyOutput | null): BrandFlyerOutputPayload {
  const brand = brief.nome_marca || "Marca";
  const positioning = strategy?.output_payload?.posicionamento || brief.proposta_valor || "Proposta de valor";

  return {
    formato: "A5 vertical",
    headline: `${brand}: transforme a percepcao da sua marca`,
    subheadline: positioning,
    secoes: [
      {
        titulo: "Sobre",
        conteudo: "Resumo curto do diferencial e beneficio principal.",
      },
      {
        titulo: "Destaques",
        conteudo: "3 bullets de prova, resultado ou vantagem competitiva.",
      },
      {
        titulo: "Servicos",
        conteudo: "Lista resumida das solucoes ou planos principais.",
      },
    ],
    layout_direction: "Topo com headline e hero visual, miolo com tres blocos alinhados, rodape com CTA forte e QR code.",
    cta: {
      label: "Fale com a equipe",
      action: "Agende pelo WhatsApp ou acesse o site",
    },
    prompt_visual: `Flyer institucional A5 para ${brand}. Layout vertical com headline forte, seções em grid modular, uso da paleta aprovada, tipografia consistente, textura sutil no fundo, destaque para CTA e QR code. Direcao: ${positioning}.`,
    notas_impressao: [
      "Margem de seguranca 4 mm e sangria 3 mm.",
      "Exportar em CMYK, 300 DPI.",
    ],
    notas_digital: [
      "Versao em 1080x1350 px para redes sociais.",
      "Garantir contraste minimo AA para texto pequeno.",
    ],
  };
}

function coerceBusinessCardOutput(candidate: unknown, fallback: BrandBusinessCardOutputPayload): BrandBusinessCardOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
  const raw = (candidate as { output?: unknown }).output ?? candidate;
  if (!raw || typeof raw !== "object") return fallback;
  const payload = raw as Record<string, unknown>;

  return {
    formato: toText(payload.formato || fallback.formato),
    layout_frente: toText(payload.layout_frente || fallback.layout_frente),
    layout_verso: toText(payload.layout_verso || fallback.layout_verso),
    hierarquia_conteudo: asList(payload.hierarquia_conteudo).length
      ? asList(payload.hierarquia_conteudo)
      : fallback.hierarquia_conteudo,
    prompt_visual: toText(payload.prompt_visual || fallback.prompt_visual),
    notas_impressao: asList(payload.notas_impressao).length
      ? asList(payload.notas_impressao)
      : fallback.notas_impressao,
  };
}

function coerceFlyerOutput(candidate: unknown, fallback: BrandFlyerOutputPayload): BrandFlyerOutputPayload {
  if (!candidate || typeof candidate !== "object") return fallback;
  const raw = (candidate as { output?: unknown }).output ?? candidate;
  if (!raw || typeof raw !== "object") return fallback;
  const payload = raw as Record<string, unknown>;

  const sections = Array.isArray(payload.secoes)
    ? payload.secoes
    : fallback.secoes;

  return {
    formato: toText(payload.formato || fallback.formato),
    headline: toText(payload.headline || fallback.headline),
    subheadline: toText(payload.subheadline || fallback.subheadline),
    secoes: sections as BrandFlyerOutputPayload["secoes"],
    layout_direction: toText(payload.layout_direction || fallback.layout_direction),
    cta: {
      label: toText((payload.cta as { label?: string } | undefined)?.label || fallback.cta.label),
      action: toText((payload.cta as { action?: string } | undefined)?.action || fallback.cta.action),
    },
    prompt_visual: toText(payload.prompt_visual || fallback.prompt_visual),
    notas_impressao: asList(payload.notas_impressao).length
      ? asList(payload.notas_impressao)
      : fallback.notas_impressao,
    notas_digital: asList(payload.notas_digital).length
      ? asList(payload.notas_digital)
      : fallback.notas_digital,
  };
}

export async function listBrandPiecesByProject(projectId: string, limit = 10): Promise<BrandPiece[]> {
  logDomain(DOMAIN, "listBrandPiecesByProject", "info", `project=${projectId};limit=${limit}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandPiecesByProject") || []) as BrandPiece[];
}

export async function updateBrandPieceStatus(id: string, status: BrandPieceStatus): Promise<BrandPiece> {
  logDomain(DOMAIN, "updateBrandPieceStatus", "info", `id=${id};status=${status}`);
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
  const updated = unwrap(result, DOMAIN, "updateBrandPieceStatus") as BrandPiece;
  await logAction(status === "aprovado" ? "approve_brand_asset" : "reject_brand_asset", "brand_piece", updated.id, {
    project_id: updated.project_id,
    status,
    piece_type: updated.piece_type,
  });
  return updated;
}

export async function runBusinessCardAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
  strategy: BrandStrategyOutput | null;
  palette: BrandColorPaletteOutput | null;
  typography: BrandTypographySet | null;
  logo: BrandLogoConcept | null;
}): Promise<{ run: BrandAiRun; output: BrandPiece; used_fallback: boolean }> {
  const startedAt = Date.now();
  const fallback = buildBusinessCardFallback(payload.brief, payload.strategy);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-business-card";
  let modelUsed = "business-card-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", BUSINESS_CARD_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-business-card-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        references: payload.references,
        strategy: payload.strategy,
        palette: payload.palette,
        typography: payload.typography,
        logo: payload.logo,
        normalized_context: payload.brief.normalized_context || null,
        fallback,
        prompt_version: BUSINESS_CARD_PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandBusinessCardOutputPayload;
      output = coerceBusinessCardOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runBusinessCardAgent.invokeFallback",
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
      agent_key: BUSINESS_CARD_AGENT_KEY,
      prompt_version: BUSINESS_CARD_PROMPT_VERSION,
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

  const version = await createBrandVersionForPiece(payload.project.id, "business_card");

  const saved = await dbAny
    .from(TABLE)
    .insert({
      project_id: payload.project.id,
      brief_id: payload.brief.id,
      strategy_id: payload.strategy?.id || null,
      palette_id: payload.palette?.id || null,
      typography_id: payload.typography?.id || null,
      logo_concept_id: payload.logo?.id || null,
      ai_run_id: run.id,
      version_id: version.id,
      version_number: version.version_number,
      piece_type: "business_card",
      status: "pendente",
      prompt_version: BUSINESS_CARD_PROMPT_VERSION,
      provider_used: providerUsed,
      model_used: modelUsed,
      output_payload: output,
    })
    .select("*")
    .single();

  const outputRow = unwrap(saved, DOMAIN, "runBusinessCardAgent.insert") as BrandPiece;
  await createPieceAsset({
    project_id: payload.project.id,
    version_id: version.id,
    piece_id: outputRow.id,
    piece_type: "business_card",
    prompt_visual: output.prompt_visual,
  });

  await logAction("run_brand_agent", "brand_agent", run.id, {
    project_id: payload.project.id,
    agent_key: BUSINESS_CARD_AGENT_KEY,
    used_fallback: usedFallback,
    prompt_version: BUSINESS_CARD_PROMPT_VERSION,
  });

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}

export async function runFlyerAgent(payload: {
  project: BrandProject;
  brief: BrandBrief;
  references: BrandBriefReference[];
  strategy: BrandStrategyOutput | null;
  palette: BrandColorPaletteOutput | null;
  typography: BrandTypographySet | null;
  logo: BrandLogoConcept | null;
}): Promise<{ run: BrandAiRun; output: BrandPiece; used_fallback: boolean }> {
  const startedAt = Date.now();
  const fallback = buildFlyerFallback(payload.brief, payload.strategy);

  let output = fallback;
  let usedFallback = true;
  let providerUsed = "local-flyer";
  let modelUsed = "flyer-heuristic-v1";
  let agentConfigId: string | null = null;

  const configQuery = await dbAny
    .from("brand_agent_configs")
    .select("id, provider, model")
    .eq("agent_key", FLYER_AGENT_KEY)
    .eq("is_active", true)
    .maybeSingle();

  if (!configQuery.error && configQuery.data) {
    agentConfigId = configQuery.data.id || null;
    providerUsed = configQuery.data.provider || providerUsed;
    modelUsed = configQuery.data.model || modelUsed;
  }

  try {
    const { data, error } = await supabase.functions.invoke("brand-flyer-agent", {
      body: {
        project: payload.project,
        brief: payload.brief,
        references: payload.references,
        strategy: payload.strategy,
        palette: payload.palette,
        typography: payload.typography,
        logo: payload.logo,
        normalized_context: payload.brief.normalized_context || null,
        fallback,
        prompt_version: FLYER_PROMPT_VERSION,
      },
    });

    if (!error && data) {
      const candidate = (data.output || data) as BrandFlyerOutputPayload;
      output = coerceFlyerOutput(candidate, fallback);
      usedFallback = Boolean(data.used_fallback ?? false);
      providerUsed = typeof data.provider_used === "string" && data.provider_used ? data.provider_used : providerUsed;
      modelUsed = typeof data.model_used === "string" && data.model_used ? data.model_used : modelUsed;
    }
  } catch (err) {
    logDomain(
      DOMAIN,
      "runFlyerAgent.invokeFallback",
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
      agent_key: FLYER_AGENT_KEY,
      prompt_version: FLYER_PROMPT_VERSION,
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

  const version = await createBrandVersionForPiece(payload.project.id, "flyer");

  const saved = await dbAny
    .from(TABLE)
    .insert({
      project_id: payload.project.id,
      brief_id: payload.brief.id,
      strategy_id: payload.strategy?.id || null,
      palette_id: payload.palette?.id || null,
      typography_id: payload.typography?.id || null,
      logo_concept_id: payload.logo?.id || null,
      ai_run_id: run.id,
      version_id: version.id,
      version_number: version.version_number,
      piece_type: "flyer",
      status: "pendente",
      prompt_version: FLYER_PROMPT_VERSION,
      provider_used: providerUsed,
      model_used: modelUsed,
      output_payload: output,
    })
    .select("*")
    .single();

  const outputRow = unwrap(saved, DOMAIN, "runFlyerAgent.insert") as BrandPiece;
  await createPieceAsset({
    project_id: payload.project.id,
    version_id: version.id,
    piece_id: outputRow.id,
    piece_type: "flyer",
    prompt_visual: output.prompt_visual,
  });

  await logAction("run_brand_agent", "brand_agent", run.id, {
    project_id: payload.project.id,
    agent_key: FLYER_AGENT_KEY,
    used_fallback: usedFallback,
    prompt_version: FLYER_PROMPT_VERSION,
  });

  return {
    run,
    output: outputRow,
    used_fallback: usedFallback,
  };
}
