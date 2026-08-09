import { supabase } from "@/integrations/supabase/client";
import { ProposalTier, ProposalAddon, CommercialNotes } from "@/lib/proposal-tiers";
import { normalizePropostaJSON, normalizeStructuredContent } from "@/lib/proposal-normalizer";
import { logProposalEvent } from "@/lib/proposal-events";

export interface PropostaInput {
  nome_cliente: string;
  empresa_cliente: string;
  segmento: string;
  nicho?: string;
  email_cliente: string;
  tipo_projeto: string;
  descricao_projeto: string;
  problema_cliente: string;
  objetivo_cliente: string;
  funcionalidades_desejadas: string[];
  integracoes: string[];
  numero_usuarios: string;
  prazo_desejado: string;
  orcamento_cliente: string;
  nivel_urgencia: string;
  link_referencia: string;
  observacoes: string;
  orcamento_id?: string;
  analise_arquitetural?: any;
  referencias_visuais?: any[];
  referencias_portfolio?: any[];
  modulos_base?: string[];
  addons_sugeridos?: any[];
  estilo_operacional?: string;
}

export interface PropostaFinanceiro {
  valor_minimo: number;
  valor_ideal: number;
  valor_premium: number;
  classificacao_margem: string;
}

export interface PropostaJSON {
  resumo_executivo: string;
  tipo_projeto: string;
  diagnostico: string;
  solucao_proposta: string;
  escopo: string[];
  funcionalidades: string[];
  funcionalidades_recomendadas: string[];
  complexidade: string;
  analise_estrategica: string;
  estimativa_esforco: string;
  financeiro: PropostaFinanceiro;
  cronograma: string;
  manutencao: string;
  riscos: string[];
  proximos_passos: string[];
  proposta_comercial: string;
}

export interface StructuredContent {
  proposta_comercial: string;
  visao_projeto: string;
  escopo_principal: string[];
  modulos_recomendados: string[];
  diferenciais: string[];
  roadmap_macro: string[];
  resumo_interno: string;
}

export interface PricingSheetTier {
  price: number;
  modules: string[];
  days: number;
}

export interface PricingSheet {
  setup_fee: number;
  monthly_fee: number;
  tier_starter: PricingSheetTier;
  tier_mvp: PricingSheetTier;
  tier_ideal: PricingSheetTier;
  tier_premium: PricingSheetTier;
  payment_options: string[];
  discount_conditions: string;
}

export interface HiddenAddon {
  name: string;
  description: string;
  category: string;
  estimated_price: number;
  trigger_condition: string;
  priority: string;
}

export interface PortfolioRef {
  reason: string;
  niche_match: string;
  modules_shared: string[];
}

export interface PdfBlueprint {
  cover_title: string;
  cover_subtitle: string;
  sections_order: string[];
  emphasis_sections: string[];
  tone: string;
}

export interface ProposalAIArtifacts {
  structured_content: StructuredContent | null;
  pricing_sheet: PricingSheet | null;
  document_spec: any | null;
  stitch_prompt: string | null;
  hidden_addons: HiddenAddon[] | null;
  portfolio_refs: PortfolioRef[] | null;
  pdf_blueprint: PdfBlueprint | null;
  ai_metadata: any | null;
}

export interface Proposta {
  id: string;
  criado_em: string;
  nome_cliente: string;
  empresa_cliente: string;
  segmento: string;
  email_cliente: string;
  tipo_projeto: string;
  descricao_projeto: string;
  proposta_json: PropostaJSON | null;
  proposta_texto: string | null;
  valor_minimo: number;
  valor_ideal: number;
  valor_premium: number;
  classificacao_margem: string;
  complexidade: string;
  status: string;
  orcamento_id: string | null;
  // Tier fields
  proposal_tiers: ProposalTier[];
  proposal_addons: ProposalAddon[];
  recommended_tier: string;
  commercial_notes: CommercialNotes | null;
  proposal_validity: string;
  is_phased: boolean;
  closing_strategy: string;
  // AI artifacts
  document_spec: any | null;
  pricing_sheet: PricingSheet | null;
  structured_content: StructuredContent | null;
  stitch_prompt: string | null;
  hidden_addons: HiddenAddon[] | null;
  portfolio_refs: PortfolioRef[] | null;
  pdf_blueprint: PdfBlueprint | null;
  ai_metadata: any | null;
  // Public sharing
  is_public: boolean;
  public_token: string | null;
  // Client reference
  link_referencia: string;
}

export interface GerarPropostaResult {
  proposta: PropostaJSON;
  structured_content: StructuredContent | null;
  document_spec: any | null;
  pricing_sheet: PricingSheet | null;
  stitch_prompt: string | null;
  hidden_addons: HiddenAddon[] | null;
  portfolio_refs: PortfolioRef[] | null;
  pdf_blueprint: PdfBlueprint | null;
  ai_metadata: any | null;
}

export async function gerarPropostaIA(input: PropostaInput): Promise<GerarPropostaResult> {
  const requestId = crypto.randomUUID();
  await logProposalEvent("proposal_ai_requested", requestId, {
    prompt_version: "v7.0-full-structured",
  });

  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke("gerar-proposta", { body: input });
    if (error) throw new Error(error.message || "Erro ao gerar proposta");
    if (data?.error) throw new Error(data.error);

    const normResult = normalizePropostaJSON(data.proposta);
    const structuredResult = normalizeStructuredContent(data.structured_content || {});
    const meta = data._meta || {};
    const aiMetadata = {
      ...(data.ai_metadata || meta || {}),
      proposal_schema_valid: normResult.schema_valid,
      proposal_warnings: normResult.warnings,
      structured_schema_valid: structuredResult.schema_valid,
      structured_warnings: structuredResult.warnings,
    };

    await logProposalEvent("proposal_ai_completed", requestId, {
      provider_used: meta.provider_used,
      model_used: meta.model_used,
      prompt_version: meta.prompt_version || "v7.0-full-structured",
      schema_valid: normResult.schema_valid,
      structured_schema_valid: structuredResult.schema_valid,
      output_size: normResult.output_size,
      duration_ms: Date.now() - startTime,
      warnings: normResult.warnings,
      structured_warnings: structuredResult.warnings,
      pipeline_steps: meta.pipeline_steps,
    });

    return {
      proposta: normResult.data,
      structured_content: structuredResult.data,
      document_spec: data.document_spec || null,
      pricing_sheet: data.pricing_sheet || null,
      stitch_prompt: typeof data.stitch_prompt === "string" ? data.stitch_prompt.trim() : null,
      hidden_addons: Array.isArray(data.hidden_addons) ? data.hidden_addons : null,
      portfolio_refs: Array.isArray(data.portfolio_refs) ? data.portfolio_refs : null,
      pdf_blueprint: data.pdf_blueprint || null,
      ai_metadata: Object.keys(aiMetadata).length ? aiMetadata : null,
    };
  } catch (err) {
    await logProposalEvent("proposal_ai_failed", requestId, {
      render_error: err instanceof Error ? err.message : "Unknown error",
      duration_ms: Date.now() - startTime,
    });
    throw err;
  }
}

export async function salvarProposta(
  input: PropostaInput,
  proposta: PropostaJSON,
  tiers?: ProposalTier[],
  addons?: ProposalAddon[],
  recommendedTier?: string,
  commercialNotes?: CommercialNotes,
  validity?: string,
  isPhased?: boolean,
  closingStrategy?: string,
  artifacts?: ProposalAIArtifacts,
): Promise<string> {
  const { data, error } = await supabase
    .from("propostas" as any)
    .insert({
      nome_cliente: input.nome_cliente,
      empresa_cliente: input.empresa_cliente,
      segmento: input.segmento,
      email_cliente: input.email_cliente,
      tipo_projeto: proposta.tipo_projeto || input.tipo_projeto,
      descricao_projeto: input.descricao_projeto,
      problema_cliente: input.problema_cliente,
      objetivo_cliente: input.objetivo_cliente,
      funcionalidades_desejadas: input.funcionalidades_desejadas,
      integracoes: input.integracoes,
      numero_usuarios: input.numero_usuarios,
      prazo_desejado: input.prazo_desejado,
      orcamento_cliente: input.orcamento_cliente,
      nivel_urgencia: input.nivel_urgencia,
      link_referencia: input.link_referencia,
      observacoes: input.observacoes,
      proposta_json: proposta as any,
      proposta_texto: proposta.proposta_comercial,
      valor_minimo: proposta.financeiro.valor_minimo,
      valor_ideal: proposta.financeiro.valor_ideal,
      valor_premium: proposta.financeiro.valor_premium,
      classificacao_margem: proposta.financeiro.classificacao_margem,
      complexidade: proposta.complexidade,
      status: "rascunho",
      orcamento_id: input.orcamento_id || null,
      proposal_tiers: tiers ? JSON.stringify(tiers) : "[]",
      proposal_addons: addons ? JSON.stringify(addons) : "[]",
      recommended_tier: recommendedTier || "",
      commercial_notes: commercialNotes ? JSON.stringify(commercialNotes) : "{}",
      proposal_validity: validity || "30 dias",
      is_phased: isPhased || false,
      closing_strategy: closingStrategy || "",
      structured_content: artifacts?.structured_content || null,
      pricing_sheet: artifacts?.pricing_sheet || null,
      document_spec: artifacts?.document_spec || null,
      stitch_prompt: artifacts?.stitch_prompt || null,
      hidden_addons: artifacts?.hidden_addons || null,
      portfolio_refs: artifacts?.portfolio_refs || null,
      pdf_blueprint: artifacts?.pdf_blueprint || null,
      ai_metadata: artifacts?.ai_metadata || null,
    } as any)
    .select("id")
    .single();

  if (error) throw error;
  return (data as any).id;
}

function parseRow(row: any): Proposta {
  let tiers: ProposalTier[] = [];
  let addons: ProposalAddon[] = [];
  let notes: CommercialNotes | null = null;
  let structuredContent: StructuredContent | null = null;
  let pricingSheet: any | null = null;
  let documentSpec: any | null = null;
  let hiddenAddons: any[] | null = null;
  let portfolioRefs: any[] | null = null;
  let pdfBlueprint: any | null = null;
  let aiMetadata: any | null = null;
  try { tiers = typeof row.proposal_tiers === "string" ? JSON.parse(row.proposal_tiers) : (row.proposal_tiers || []); } catch {}
  try { addons = typeof row.proposal_addons === "string" ? JSON.parse(row.proposal_addons) : (row.proposal_addons || []); } catch {}
  try { notes = typeof row.commercial_notes === "string" ? JSON.parse(row.commercial_notes) : (row.commercial_notes || null); } catch {}
  try { structuredContent = typeof row.structured_content === "string" ? JSON.parse(row.structured_content) : (row.structured_content || null); } catch {}
  try { pricingSheet = typeof row.pricing_sheet === "string" ? JSON.parse(row.pricing_sheet) : (row.pricing_sheet || null); } catch {}
  try { documentSpec = typeof row.document_spec === "string" ? JSON.parse(row.document_spec) : (row.document_spec || null); } catch {}
  try { hiddenAddons = typeof row.hidden_addons === "string" ? JSON.parse(row.hidden_addons) : (row.hidden_addons || null); } catch {}
  try { portfolioRefs = typeof row.portfolio_refs === "string" ? JSON.parse(row.portfolio_refs) : (row.portfolio_refs || null); } catch {}
  try { pdfBlueprint = typeof row.pdf_blueprint === "string" ? JSON.parse(row.pdf_blueprint) : (row.pdf_blueprint || null); } catch {}
  try { aiMetadata = typeof row.ai_metadata === "string" ? JSON.parse(row.ai_metadata) : (row.ai_metadata || null); } catch {}

  return {
    id: row.id,
    criado_em: row.criado_em,
    nome_cliente: row.nome_cliente,
    empresa_cliente: row.empresa_cliente || "",
    segmento: row.segmento || "",
    email_cliente: row.email_cliente || "",
    tipo_projeto: row.tipo_projeto,
    descricao_projeto: row.descricao_projeto,
    proposta_json: row.proposta_json as PropostaJSON | null,
    proposta_texto: row.proposta_texto,
    valor_minimo: Number(row.valor_minimo) || 0,
    valor_ideal: Number(row.valor_ideal) || 0,
    valor_premium: Number(row.valor_premium) || 0,
    classificacao_margem: row.classificacao_margem || "",
    complexidade: row.complexidade || "media",
    status: row.status,
    orcamento_id: row.orcamento_id,
    proposal_tiers: tiers,
    proposal_addons: addons,
    recommended_tier: row.recommended_tier || "",
    commercial_notes: notes,
    proposal_validity: row.proposal_validity || "30 dias",
    is_phased: row.is_phased || false,
    closing_strategy: row.closing_strategy || "",
    document_spec: documentSpec,
    pricing_sheet: pricingSheet,
    structured_content: structuredContent,
    stitch_prompt: row.stitch_prompt || null,
    hidden_addons: hiddenAddons,
    portfolio_refs: portfolioRefs,
    pdf_blueprint: pdfBlueprint,
    ai_metadata: aiMetadata,
    is_public: row.is_public || false,
    public_token: row.public_token || null,
    link_referencia: row.link_referencia || "",
  };
}

export async function getPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("propostas" as any)
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return ((data as any[]) || []).map(parseRow);
}

export async function getProposta(id: string): Promise<Proposta | null> {
  const { data, error } = await supabase
    .from("propostas" as any)
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return parseRow(data);
}

export async function atualizarStatusProposta(id: string, status: string) {
  const { error } = await supabase
    .from("propostas" as any)
    .update({ status, atualizado_em: new Date().toISOString() } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function removerProposta(id: string) {
  const { error } = await supabase
    .from("propostas" as any)
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarProposta(id: string, proposta: PropostaJSON, artifacts?: ProposalAIArtifacts) {
  const { error } = await supabase
    .from("propostas" as any)
    .update({
      proposta_json: proposta as any,
      proposta_texto: proposta.proposta_comercial,
      valor_minimo: proposta.financeiro.valor_minimo,
      valor_ideal: proposta.financeiro.valor_ideal,
      valor_premium: proposta.financeiro.valor_premium,
      classificacao_margem: proposta.financeiro.classificacao_margem,
      complexidade: proposta.complexidade,
      structured_content: artifacts?.structured_content || undefined,
      pricing_sheet: artifacts?.pricing_sheet || undefined,
      document_spec: artifacts?.document_spec || undefined,
      stitch_prompt: artifacts?.stitch_prompt || undefined,
      hidden_addons: artifacts?.hidden_addons || undefined,
      portfolio_refs: artifacts?.portfolio_refs || undefined,
      pdf_blueprint: artifacts?.pdf_blueprint || undefined,
      ai_metadata: artifacts?.ai_metadata || undefined,
      atualizado_em: new Date().toISOString(),
    } as any)
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarPropostaArtefatos(
  id: string,
  artifacts: Partial<ProposalAIArtifacts> = {},
  aiMetadata?: any,
) {
  const payload: any = { atualizado_em: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(artifacts, "structured_content")) {
    payload.structured_content = artifacts.structured_content;
  }
  if (Object.prototype.hasOwnProperty.call(artifacts, "pricing_sheet")) {
    payload.pricing_sheet = artifacts.pricing_sheet;
  }
  if (Object.prototype.hasOwnProperty.call(artifacts, "document_spec")) {
    payload.document_spec = artifacts.document_spec;
  }
  if (Object.prototype.hasOwnProperty.call(artifacts, "stitch_prompt")) {
    payload.stitch_prompt = artifacts.stitch_prompt;
  }
  if (Object.prototype.hasOwnProperty.call(artifacts, "hidden_addons")) {
    payload.hidden_addons = artifacts.hidden_addons;
  }
  if (Object.prototype.hasOwnProperty.call(artifacts, "portfolio_refs")) {
    payload.portfolio_refs = artifacts.portfolio_refs;
  }
  if (Object.prototype.hasOwnProperty.call(artifacts, "pdf_blueprint")) {
    payload.pdf_blueprint = artifacts.pdf_blueprint;
  }

  if (typeof aiMetadata !== "undefined") {
    payload.ai_metadata = aiMetadata;
  }

  const { error } = await supabase
    .from("propostas" as any)
    .update(payload as any)
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarPropostaTiers(
  id: string,
  tiers: ProposalTier[],
  addons: ProposalAddon[],
  recommendedTier: string,
  commercialNotes: CommercialNotes | null,
  validity: string,
  isPhased: boolean,
  closingStrategy: string,
) {
  const { error } = await supabase
    .from("propostas" as any)
    .update({
      proposal_tiers: JSON.stringify(tiers),
      proposal_addons: JSON.stringify(addons),
      recommended_tier: recommendedTier,
      commercial_notes: commercialNotes ? JSON.stringify(commercialNotes) : "{}",
      proposal_validity: validity,
      is_phased: isPhased,
      closing_strategy: closingStrategy,
      atualizado_em: new Date().toISOString(),
    } as any)
    .eq("id", id);
  if (error) throw error;
}

// ── Public sharing ──

export async function togglePropostaPublic(id: string, isPublic: boolean): Promise<string | null> {
  if (isPublic) {
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const { error } = await supabase
      .from("propostas" as any)
      .update({ is_public: true, public_token: token, atualizado_em: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) throw error;
    return token;
  } else {
    const { error } = await supabase
      .from("propostas" as any)
      .update({ is_public: false, public_token: null, atualizado_em: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) throw error;
    return null;
  }
}

export async function getPropostaByToken(token: string): Promise<Proposta | null> {
  const { data, error } = await supabase
    .from("propostas" as any)
    .select("*")
    .eq("public_token", token)
    .eq("is_public", true)
    .single();
  if (error) return null;
  return parseRow(data);
}

export async function acceptPropostaByToken(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("accept_public_proposal" as never, { p_token: token } as never);
  if (error) throw error;
  return data === true;
}
