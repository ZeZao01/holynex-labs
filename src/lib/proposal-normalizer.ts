/**
 * Camada de normalização entre a saída da IA e a renderização do PDF.
 * Valida schema, sanitiza caracteres, limita tamanhos e aplica fallbacks.
 */

import type { PropostaJSON, PropostaFinanceiro, StructuredContent } from "@/lib/propostas";

// ── Section size limits (characters) ──
const LIMITS: Record<string, number> = {
  resumo_executivo: 800,
  diagnostico: 600,
  solucao_proposta: 600,
  analise_estrategica: 600,
  estimativa_esforco: 200,
  cronograma: 300,
  manutencao: 300,
  proposta_comercial: 5000,
  complexidade: 20,
  classificacao_margem: 30,
  tipo_projeto: 60,
};

const LIST_ITEM_LIMIT = 150;
const LIST_MAX_ITEMS = 15;

// ── Structured content limits (characters) ──
const STRUCTURED_LIMITS: Record<string, number> = {
  proposta_comercial: 5000,
  visao_projeto: 1200,
  resumo_interno: 1200,
};

// ── Sanitization ──

/** Remove control chars, zero-width chars, and PDF-incompatible symbols */
function sanitizeText(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    // Remove control characters except newlines/tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Remove zero-width characters
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "")
    // Replace problematic Unicode with safe alternatives
    .replace(/✓/g, "[OK]")
    .replace(/✗/g, "[X]")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/—/g, " - ")
    .replace(/–/g, "-")
    .trim();
}

function sanitizeAndLimit(text: string, maxLen: number): string {
  const clean = sanitizeText(text);
  if (clean.length <= maxLen) return clean;
  // Cut at last sentence boundary within limit
  const truncated = clean.substring(0, maxLen);
  const lastPeriod = truncated.lastIndexOf(".");
  if (lastPeriod > maxLen * 0.6) return truncated.substring(0, lastPeriod + 1);
  return truncated + "...";
}

function sanitizeList(items: any[], maxItems: number = LIST_MAX_ITEMS): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .slice(0, maxItems)
    .map(item => sanitizeAndLimit(item, LIST_ITEM_LIMIT));
}

// ── Validation ──

function isValidFinanceiro(fin: any): fin is PropostaFinanceiro {
  return (
    fin &&
    typeof fin === "object" &&
    typeof fin.valor_minimo === "number" &&
    typeof fin.valor_ideal === "number" &&
    typeof fin.valor_premium === "number" &&
    fin.valor_minimo >= 0 &&
    fin.valor_ideal >= 0 &&
    fin.valor_premium >= 0
  );
}

const VALID_COMPLEXIDADES = ["baixa", "media", "alta", "avancada"];
const VALID_MARGENS = [
  "margem_aceitavel",
  "margem_saudavel",
  "alta_rentabilidade",
  "abaixo_da_margem",
  "margem_critica",
];

// ── Fallbacks ──
const FALLBACK_FINANCEIRO: PropostaFinanceiro = {
  valor_minimo: 0,
  valor_ideal: 0,
  valor_premium: 0,
  classificacao_margem: "margem_aceitavel",
};

// ── Normalization result ──
export interface NormalizationResult {
  data: PropostaJSON;
  schema_valid: boolean;
  warnings: string[];
  output_size: number;
}

export interface StructuredContentNormalizationResult {
  data: StructuredContent;
  schema_valid: boolean;
  warnings: string[];
  output_size: number;
}

/**
 * Normaliza a saída da IA para uso seguro no PDF.
 * Retorna dados sanitizados + metadados de validação.
 */
export function normalizePropostaJSON(raw: any): NormalizationResult {
  const warnings: string[] = [];
  let schema_valid = true;

  if (!raw || typeof raw !== "object") {
    schema_valid = false;
    warnings.push("Input is not a valid object, using full fallbacks");
    raw = {};
  }

  // Validate and normalize each field
  const resumo_executivo = sanitizeAndLimit(
    raw.resumo_executivo || "Proposta comercial gerada pela HolyNex Labs.",
    LIMITS.resumo_executivo
  );
  if (!raw.resumo_executivo) { warnings.push("resumo_executivo: fallback applied"); schema_valid = false; }

  const tipo_projeto = sanitizeAndLimit(
    raw.tipo_projeto || "Sistema personalizado",
    LIMITS.tipo_projeto
  );

  const diagnostico = sanitizeAndLimit(
    raw.diagnostico || "Analise detalhada em elaboracao.",
    LIMITS.diagnostico
  );
  if (!raw.diagnostico) { warnings.push("diagnostico: fallback applied"); schema_valid = false; }

  const solucao_proposta = sanitizeAndLimit(
    raw.solucao_proposta || "Solucao personalizada com tecnologia de ponta.",
    LIMITS.solucao_proposta
  );
  if (!raw.solucao_proposta) { warnings.push("solucao_proposta: fallback applied"); schema_valid = false; }

  const escopo = sanitizeList(raw.escopo || []);
  if (!raw.escopo?.length) { warnings.push("escopo: empty, using empty list"); }

  const funcionalidades = sanitizeList(raw.funcionalidades || []);
  if (!raw.funcionalidades?.length) { warnings.push("funcionalidades: empty"); }

  const funcionalidades_recomendadas = sanitizeList(raw.funcionalidades_recomendadas || []);

  const complexidade = VALID_COMPLEXIDADES.includes(raw.complexidade)
    ? raw.complexidade
    : "media";
  if (!VALID_COMPLEXIDADES.includes(raw.complexidade)) {
    warnings.push(`complexidade: invalid value "${raw.complexidade}", defaulting to "media"`);
  }

  const analise_estrategica = sanitizeAndLimit(
    raw.analise_estrategica || "",
    LIMITS.analise_estrategica
  );

  const estimativa_esforco = sanitizeAndLimit(
    raw.estimativa_esforco || "A definir",
    LIMITS.estimativa_esforco
  );

  // Financeiro
  let financeiro: PropostaFinanceiro;
  if (isValidFinanceiro(raw.financeiro)) {
    financeiro = {
      valor_minimo: raw.financeiro.valor_minimo,
      valor_ideal: raw.financeiro.valor_ideal,
      valor_premium: raw.financeiro.valor_premium,
      classificacao_margem: VALID_MARGENS.includes(raw.financeiro.classificacao_margem)
        ? raw.financeiro.classificacao_margem
        : "margem_aceitavel",
    };
  } else {
    financeiro = { ...FALLBACK_FINANCEIRO };
    warnings.push("financeiro: invalid structure, using fallback");
    schema_valid = false;
  }

  const cronograma = sanitizeAndLimit(raw.cronograma || "A definir", LIMITS.cronograma);
  const manutencao = sanitizeAndLimit(raw.manutencao || "Sob consulta", LIMITS.manutencao);
  const riscos = sanitizeList(raw.riscos || []);
  const proximos_passos = sanitizeList(raw.proximos_passos || [
    "Aprovacao da Proposta",
    "Reuniao de Kickoff",
    "Inicio do Desenvolvimento",
  ]);

  // proposta_comercial: kept for internal use only (narrativa_interna_completa)
  const proposta_comercial = sanitizeAndLimit(
    raw.proposta_comercial || "",
    LIMITS.proposta_comercial
  );

  const data: PropostaJSON = {
    resumo_executivo,
    tipo_projeto,
    diagnostico,
    solucao_proposta,
    escopo,
    funcionalidades,
    funcionalidades_recomendadas,
    complexidade,
    analise_estrategica,
    estimativa_esforco,
    financeiro,
    cronograma,
    manutencao,
    riscos,
    proximos_passos,
    proposta_comercial,
  };

  const output_size = JSON.stringify(data).length;

  return { data, schema_valid, warnings, output_size };
}

/**
 * Extrai apenas os campos para o documento público (PDF emitido ao cliente).
 * Exclui proposta_comercial e dados internos.
 */
export function extractDocumentoPublico(proposta: PropostaJSON): Omit<PropostaJSON, "proposta_comercial"> & { proposta_comercial: string } {
  return {
    ...proposta,
    proposta_comercial: "", // Never rendered in public PDF
  };
}

/**
 * Retorna a narrativa interna completa para histórico.
 */
export function extractNarrativaInterna(proposta: PropostaJSON): PropostaJSON {
  return { ...proposta };
}

/**
 * Normaliza o bloco estruturado comercial/operacional da proposta.
 */
export function normalizeStructuredContent(raw: any): StructuredContentNormalizationResult {
  const warnings: string[] = [];
  let schema_valid = true;

  if (!raw || typeof raw !== "object") {
    schema_valid = false;
    warnings.push("structured_content: input is not an object, using fallbacks");
    raw = {};
  }

  const proposta_comercial = sanitizeAndLimit(
    raw.proposta_comercial || "",
    STRUCTURED_LIMITS.proposta_comercial
  );
  if (!raw.proposta_comercial) { warnings.push("structured_content.proposta_comercial: empty"); }

  const visao_projeto = sanitizeAndLimit(
    raw.visao_projeto || "",
    STRUCTURED_LIMITS.visao_projeto
  );
  if (!raw.visao_projeto) { warnings.push("structured_content.visao_projeto: empty"); }

  const escopo_principal = sanitizeList(raw.escopo_principal || []);
  const modulos_recomendados = sanitizeList(raw.modulos_recomendados || []);
  const diferenciais = sanitizeList(raw.diferenciais || []);
  const roadmap_macro = sanitizeList(raw.roadmap_macro || []);

  const resumo_interno = sanitizeAndLimit(
    raw.resumo_interno || "",
    STRUCTURED_LIMITS.resumo_interno
  );
  if (!raw.resumo_interno) { warnings.push("structured_content.resumo_interno: empty"); }

  const data: StructuredContent = {
    proposta_comercial,
    visao_projeto,
    escopo_principal,
    modulos_recomendados,
    diferenciais,
    roadmap_macro,
    resumo_interno,
  };

  const output_size = JSON.stringify(data).length;
  if (warnings.length > 0) schema_valid = false;

  return { data, schema_valid, warnings, output_size };
}
