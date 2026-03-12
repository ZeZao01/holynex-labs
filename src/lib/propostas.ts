import { supabase } from "@/integrations/supabase/client";

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
}

export async function gerarPropostaIA(input: PropostaInput): Promise<PropostaJSON> {
  const { data, error } = await supabase.functions.invoke("gerar-proposta", {
    body: input,
  });

  if (error) throw new Error(error.message || "Erro ao gerar proposta");
  if (data?.error) throw new Error(data.error);
  return data.proposta as PropostaJSON;
}

export async function salvarProposta(input: PropostaInput, proposta: PropostaJSON): Promise<string> {
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
    } as any)
    .select("id")
    .single();

  if (error) throw error;
  return (data as any).id;
}

export async function getPropostas(): Promise<Proposta[]> {
  const { data, error } = await supabase
    .from("propostas" as any)
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) throw error;
  return ((data as any[]) || []).map((row) => ({
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
  }));
}

export async function getProposta(id: string): Promise<Proposta | null> {
  const { data, error } = await supabase
    .from("propostas" as any)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  const row = data as any;
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
  };
}

export async function atualizarStatusProposta(id: string, status: string) {
  const { error } = await supabase
    .from("propostas" as any)
    .update({ status } as any)
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
