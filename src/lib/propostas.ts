import { supabase } from "@/integrations/supabase/client";
import { ProposalTier, ProposalAddon, CommercialNotes } from "@/lib/proposal-tiers";
import { normalizePropostaJSON } from "@/lib/proposal-normalizer";
import { logProposalEvent } from "@/lib/proposal-events";

export interface PropostaInput {
  nome_cliente: string;
  empresa_cliente: string;
  segmento: string;
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
  // DocumentSpec fields (Genspark pipeline)
  document_spec: any | null;
  pricing_sheet: any | null;
  // Public sharing
  is_public: boolean;
  public_token: string | null;
  // Client reference
  link_referencia: string;
}

export interface GerarPropostaResult {
  proposta: PropostaJSON;
  document_spec: any | null;
  pricing_sheet: any | null;
}

export async function gerarPropostaIA(input: PropostaInput): Promise<GerarPropostaResult> {
  const requestId = crypto.randomUUID();
  await logProposalEvent("proposal_ai_requested", requestId, {
    prompt_version: "v5.0-genspark-pipeline",
  });

  const startTime = Date.now();

  try {
    const { data, error } = await supabase.functions.invoke("gerar-proposta", { body: input });
    if (error) throw new Error(error.message || "Erro ao gerar proposta");
    if (data?.error) throw new Error(data.error);

    const normResult = normalizePropostaJSON(data.proposta);
    const meta = data._meta || {};

    await logProposalEvent("proposal_ai_completed", requestId, {
      provider_used: meta.provider_used,
      model_used: meta.model_used,
      prompt_version: meta.prompt_version || "v5.0-genspark-pipeline",
      schema_valid: normResult.schema_valid,
      output_size: normResult.output_size,
      duration_ms: Date.now() - startTime,
      warnings: normResult.warnings,
      pipeline_steps: meta.pipeline_steps,
    });

    return {
      proposta: normResult.data,
      document_spec: data.document_spec || null,
      pricing_sheet: data.pricing_sheet || null,
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
      status: "gerada",
      orcamento_id: input.orcamento_id || null,
      proposal_tiers: tiers ? JSON.stringify(tiers) : "[]",
      proposal_addons: addons ? JSON.stringify(addons) : "[]",
      recommended_tier: recommendedTier || "",
      commercial_notes: commercialNotes ? JSON.stringify(commercialNotes) : "{}",
      proposal_validity: validity || "30 dias",
      is_phased: isPhased || false,
      closing_strategy: closingStrategy || "",
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
  try { tiers = typeof row.proposal_tiers === "string" ? JSON.parse(row.proposal_tiers) : (row.proposal_tiers || []); } catch {}
  try { addons = typeof row.proposal_addons === "string" ? JSON.parse(row.proposal_addons) : (row.proposal_addons || []); } catch {}
  try { notes = typeof row.commercial_notes === "string" ? JSON.parse(row.commercial_notes) : (row.commercial_notes || null); } catch {}

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
    document_spec: null,
    pricing_sheet: null,
    is_public: row.is_public || false,
    public_token: row.public_token || null,
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

export async function atualizarProposta(id: string, proposta: PropostaJSON) {
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
      atualizado_em: new Date().toISOString(),
    } as any)
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
