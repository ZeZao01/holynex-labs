import { supabase } from "@/integrations/supabase/client";

export type OrcamentoStatus = "pendente" | "recebido" | "rejeitado";

export type StatusComercial =
  | "novo"
  | "em_analise"
  | "qualificado"
  | "aguardando_contato"
  | "proposta_em_preparacao"
  | "proposta_enviada"
  | "convertido"
  | "perdido"
  | "arquivado";

export const STATUS_COMERCIAL_MAP: Record<StatusComercial, { label: string; color: string }> = {
  novo: { label: "Novo", color: "text-sky-400" },
  em_analise: { label: "Em Análise", color: "text-amber-400" },
  qualificado: { label: "Qualificado", color: "text-emerald-400" },
  aguardando_contato: { label: "Aguardando Contato", color: "text-yellow-400" },
  proposta_em_preparacao: { label: "Proposta em Preparação", color: "text-purple-400" },
  proposta_enviada: { label: "Proposta Enviada", color: "text-blue-400" },
  convertido: { label: "Convertido", color: "text-emerald-500" },
  perdido: { label: "Perdido", color: "text-red-400" },
  arquivado: { label: "Arquivado", color: "text-muted-foreground" },
};

export const FAIXAS_INVESTIMENTO = [
  "Até R$ 3.000",
  "R$ 3.000 – R$ 8.000",
  "R$ 8.000 – R$ 15.000",
  "R$ 15.000 – R$ 30.000",
  "R$ 30.000 – R$ 60.000",
  "Acima de R$ 60.000",
  "Não sei / Preciso de orientação",
] as const;

export const TIPOS_PROJETO = [
  "Sistema interno",
  "SaaS / Micro SaaS",
  "Plataforma digital",
  "App mobile",
  "E-commerce",
  "Landing page / Site institucional",
  "Dashboard / Painel",
  "Automação / IA",
  "Integração / API",
  "Outro",
] as const;

export const PRAZOS = [
  "Urgente (até 2 semanas)",
  "Curto (até 1 mês)",
  "Médio (1 a 3 meses)",
  "Longo (3+ meses)",
  "Flexível",
] as const;

export const URGENCIAS = [
  { value: "sem_urgencia", label: "Sem urgência" },
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
] as const;

export const ORIGENS_LEAD = [
  "site",
  "indicacao",
  "google",
  "instagram",
  "linkedin",
  "whatsapp",
  "outro",
] as const;

export const ESTAGIOS_OPERACAO = [
  "Ideia / Validação",
  "MVP rodando",
  "Operação ativa",
  "Expansão",
  "Migração de sistema",
] as const;

export const ESTRATEGIAS_COMERCIAIS = [
  { value: "starter", label: "Starter", desc: "Projeto simples e rápido" },
  { value: "mvp_enxuto", label: "MVP Enxuto", desc: "Validar ideia com custo mínimo" },
  { value: "faseado", label: "Projeto Faseado", desc: "Entregas incrementais" },
  { value: "ideal", label: "Proposta Ideal", desc: "Escopo completo recomendado" },
  { value: "premium", label: "Premium", desc: "Alto valor e personalização total" },
  { value: "discovery", label: "Discovery Primeiro", desc: "Análise antes da proposta" },
] as const;

export interface Orcamento {
  id: string;
  nome: string;
  email: string;
  empresa: string;
  descricao: string;
  descricao_detalhada?: string;
  status: OrcamentoStatus;
  criadoEm: string;
  prioridade?: "alta" | "media" | "baixa";
  resumoIA?: string;
  // New fields
  tipo_projeto?: string;
  nicho?: string;
  objetivo?: string;
  faixa_investimento?: string;
  orcamento_estimado?: string;
  prazo_desejado?: string;
  urgencia?: string;
  numero_usuarios?: string;
  precisa_login?: boolean;
  precisa_admin?: boolean;
  precisa_area_cliente?: boolean;
  precisa_integracoes?: boolean;
  precisa_app_mobile?: boolean;
  aceita_mvp?: boolean;
  estagio_operacao?: string;
  origem_lead?: string;
  status_comercial?: StatusComercial;
  score_qualificacao?: number;
  faixa_ticket?: string;
  complexidade_estimada?: string;
  temperatura_lead?: string;
  estrategia_comercial?: string;
  observacoes_internas?: string;
  tags_automaticas?: string[];
  dor_principal?: string;
}

export interface OrcamentoAsset {
  id: string;
  orcamento_id: string;
  file_url: string;
  file_type: string;
  original_name: string;
  sort_order: number;
  created_at: string;
}

const ORCAMENTO_ASSETS_BUCKET = "orcamentos-assets";

function classificarPrioridade(descricao: string): "alta" | "media" | "baixa" {
  const lower = descricao.toLowerCase();
  if (lower.includes("urgente") || lower.includes("rápido") || lower.includes("imediato") || lower.includes("prazo curto")) {
    return "alta";
  }
  if (lower.includes("futuro") || lower.includes("sem pressa") || lower.includes("avaliar")) {
    return "baixa";
  }
  return "media";
}

function gerarResumo(descricao: string): string {
  const palavras = descricao.split(" ");
  return palavras.length > 15 ? palavras.slice(0, 15).join(" ") + "..." : descricao;
}

export function qualificarLead(data: Partial<Orcamento>): {
  score: number;
  faixa_ticket: string;
  complexidade: string;
  temperatura: string;
  estrategia: string;
} {
  let score = 0;

  // Faixa de investimento scoring
  const faixa = data.faixa_investimento || "";
  if (faixa.includes("60.000")) { score += 30; }
  else if (faixa.includes("30.000")) { score += 25; }
  else if (faixa.includes("15.000")) { score += 20; }
  else if (faixa.includes("8.000")) { score += 15; }
  else if (faixa.includes("3.000") && !faixa.includes("Até")) { score += 10; }
  else if (faixa.includes("Até")) { score += 5; }

  // Urgência
  if (data.urgencia === "critica") score += 15;
  else if (data.urgencia === "alta") score += 10;
  else if (data.urgencia === "media") score += 5;

  // Complexidade indicators
  let complexidadeScore = 0;
  if (data.precisa_login) complexidadeScore++;
  if (data.precisa_admin) complexidadeScore++;
  if (data.precisa_area_cliente) complexidadeScore++;
  if (data.precisa_integracoes) complexidadeScore++;
  if (data.precisa_app_mobile) complexidadeScore += 2;
  score += complexidadeScore * 3;

  // Tipo projeto
  if (data.tipo_projeto?.includes("SaaS")) score += 10;
  if (data.tipo_projeto?.includes("Plataforma")) score += 8;
  if (data.tipo_projeto?.includes("E-commerce")) score += 7;

  // Estágio
  if (data.estagio_operacao?.includes("Expansão")) score += 8;
  if (data.estagio_operacao?.includes("Operação ativa")) score += 5;

  // Clamp
  score = Math.min(100, Math.max(0, score));

  // Faixa ticket
  let faixa_ticket = "Micro";
  if (score >= 70) faixa_ticket = "Enterprise";
  else if (score >= 50) faixa_ticket = "Premium";
  else if (score >= 30) faixa_ticket = "Standard";
  else if (score >= 15) faixa_ticket = "Starter";

  // Complexidade
  let complexidade = "baixa";
  if (complexidadeScore >= 4) complexidade = "alta";
  else if (complexidadeScore >= 2) complexidade = "media";

  // Temperatura
  let temperatura = "frio";
  if (score >= 60) temperatura = "quente";
  else if (score >= 30) temperatura = "morno";

  // Estratégia
  let estrategia = "starter";
  if (score >= 70) estrategia = "premium";
  else if (score >= 50) estrategia = "ideal";
  else if (score >= 35) estrategia = "faseado";
  else if (score >= 20) estrategia = "mvp_enxuto";
  else if (complexidadeScore >= 3) estrategia = "discovery";

  return { score, faixa_ticket, complexidade, temperatura, estrategia };
}

export async function salvarOrcamento(data: {
  nome: string;
  email: string;
  empresa: string;
  descricao: string;
  descricao_detalhada?: string;
  tipo_projeto?: string;
  nicho?: string;
  objetivo?: string;
  faixa_investimento?: string;
  orcamento_estimado?: string;
  prazo_desejado?: string;
  urgencia?: string;
  numero_usuarios?: string;
  precisa_login?: boolean;
  precisa_admin?: boolean;
  precisa_area_cliente?: boolean;
  precisa_integracoes?: boolean;
  precisa_app_mobile?: boolean;
  aceita_mvp?: boolean;
  estagio_operacao?: string;
  dor_principal?: string;
  origem_lead?: string;
}) {
  const prioridade = classificarPrioridade(data.descricao);
  const resumo_ia = gerarResumo(data.descricao);

  const qual = qualificarLead(data);

  const { data: created, error } = await supabase.from("orcamentos").insert({
    nome: data.nome,
    email: data.email,
    empresa: data.empresa,
    descricao: data.descricao,
    descricao_detalhada: data.descricao_detalhada || "",
    status: "pendente",
    prioridade,
    resumo_ia,
    tipo_projeto: data.tipo_projeto || "",
    nicho: data.nicho || "",
    objetivo: data.objetivo || "",
    faixa_investimento: data.faixa_investimento || "",
    orcamento_estimado: data.orcamento_estimado || "",
    prazo_desejado: data.prazo_desejado || "",
    urgencia: data.urgencia || "sem_urgencia",
    numero_usuarios: data.numero_usuarios || "",
    precisa_login: data.precisa_login || false,
    precisa_admin: data.precisa_admin || false,
    precisa_area_cliente: data.precisa_area_cliente || false,
    precisa_integracoes: data.precisa_integracoes || false,
    precisa_app_mobile: data.precisa_app_mobile || false,
    aceita_mvp: data.aceita_mvp !== false,
    estagio_operacao: data.estagio_operacao || "",
    dor_principal: data.dor_principal || "",
    origem_lead: data.origem_lead || "site",
    status_comercial: "novo",
    score_qualificacao: qual.score,
    faixa_ticket: qual.faixa_ticket,
    complexidade_estimada: qual.complexidade,
    temperatura_lead: qual.temperatura,
    estrategia_comercial: qual.estrategia,
  }).select().single();

  if (error) throw error;
  return created as any;
}

export async function getOrcamentos(): Promise<Orcamento[]> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    nome: row.nome,
    email: row.email,
    empresa: row.empresa || "",
    descricao: row.descricao,
    descricao_detalhada: row.descricao_detalhada || "",
    status: row.status as OrcamentoStatus,
    criadoEm: row.criado_em,
    prioridade: row.prioridade as Orcamento["prioridade"],
    resumoIA: row.resumo_ia,
    tipo_projeto: row.tipo_projeto || "",
    nicho: row.nicho || "",
    objetivo: row.objetivo || "",
    faixa_investimento: row.faixa_investimento || "",
    orcamento_estimado: row.orcamento_estimado || "",
    prazo_desejado: row.prazo_desejado || "",
    urgencia: row.urgencia || "",
    numero_usuarios: row.numero_usuarios || "",
    precisa_login: row.precisa_login || false,
    precisa_admin: row.precisa_admin || false,
    precisa_area_cliente: row.precisa_area_cliente || false,
    precisa_integracoes: row.precisa_integracoes || false,
    precisa_app_mobile: row.precisa_app_mobile || false,
    aceita_mvp: row.aceita_mvp !== false,
    estagio_operacao: row.estagio_operacao || "",
    origem_lead: row.origem_lead || "site",
    status_comercial: (row.status_comercial || "novo") as StatusComercial,
    score_qualificacao: row.score_qualificacao || 0,
    faixa_ticket: row.faixa_ticket || "",
    complexidade_estimada: row.complexidade_estimada || "media",
    temperatura_lead: row.temperatura_lead || "morno",
    estrategia_comercial: row.estrategia_comercial || "",
    observacoes_internas: row.observacoes_internas || "",
    tags_automaticas: row.tags_automaticas || [],
    dor_principal: row.dor_principal || "",
  }));
}

export async function getOrcamentoById(id: string): Promise<Orcamento | null> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as any;
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    empresa: row.empresa || "",
    descricao: row.descricao,
    descricao_detalhada: row.descricao_detalhada || "",
    status: row.status as OrcamentoStatus,
    criadoEm: row.criado_em,
    prioridade: row.prioridade as Orcamento["prioridade"],
    resumoIA: row.resumo_ia,
    tipo_projeto: row.tipo_projeto || "",
    nicho: row.nicho || "",
    objetivo: row.objetivo || "",
    faixa_investimento: row.faixa_investimento || "",
    orcamento_estimado: row.orcamento_estimado || "",
    prazo_desejado: row.prazo_desejado || "",
    urgencia: row.urgencia || "",
    numero_usuarios: row.numero_usuarios || "",
    precisa_login: row.precisa_login || false,
    precisa_admin: row.precisa_admin || false,
    precisa_area_cliente: row.precisa_area_cliente || false,
    precisa_integracoes: row.precisa_integracoes || false,
    precisa_app_mobile: row.precisa_app_mobile || false,
    aceita_mvp: row.aceita_mvp !== false,
    estagio_operacao: row.estagio_operacao || "",
    origem_lead: row.origem_lead || "site",
    status_comercial: (row.status_comercial || "novo") as StatusComercial,
    score_qualificacao: row.score_qualificacao || 0,
    faixa_ticket: row.faixa_ticket || "",
    complexidade_estimada: row.complexidade_estimada || "media",
    temperatura_lead: row.temperatura_lead || "morno",
    estrategia_comercial: row.estrategia_comercial || "",
    observacoes_internas: row.observacoes_internas || "",
    tags_automaticas: row.tags_automaticas || [],
    dor_principal: row.dor_principal || "",
  };
}

export async function atualizarStatus(id: string, status: OrcamentoStatus) {
  const { error } = await supabase
    .from("orcamentos")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
}

export async function atualizarStatusComercial(id: string, status_comercial: StatusComercial) {
  const { error } = await supabase
    .from("orcamentos")
    .update({ status_comercial } as any)
    .eq("id", id);

  if (error) throw error;
}

export async function atualizarOrcamento(id: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from("orcamentos")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function removerOrcamento(id: string) {
  const { error } = await supabase
    .from("orcamentos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadOrcamentoAssets(orcamentoId: string, files: File[]) {
  const uploads = files.map(async (file, index) => {
    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${orcamentoId}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(ORCAMENTO_ASSETS_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(ORCAMENTO_ASSETS_BUCKET).getPublicUrl(storagePath);
    const payload = {
      orcamento_id: orcamentoId,
      file_url: data.publicUrl,
      file_type: file.type || "image",
      original_name: file.name,
      sort_order: index,
    };
    const { data: created, error: insertError } = await supabase
      .from("orcamento_assets")
      .insert(payload)
      .select()
      .single();
    if (insertError) throw insertError;
    return created as OrcamentoAsset;
  });

  return Promise.all(uploads);
}

export async function getOrcamentoAssets(orcamentoId: string): Promise<OrcamentoAsset[]> {
  const { data, error } = await supabase
    .from("orcamento_assets")
    .select("*")
    .eq("orcamento_id", orcamentoId)
    .order("sort_order", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []) as OrcamentoAsset[];
}
