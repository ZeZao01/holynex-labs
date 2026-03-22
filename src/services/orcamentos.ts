/**
 * Orcamentos Service — encapsulates all lead/orcamento operations.
 * Re-exports existing functions from orcamentos.ts for backward compatibility
 * and adds service-layer patterns.
 */

import { db, dbAny, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "orcamentos";

// Re-export types and constants from existing file for backward compat
export {
  type Orcamento,
  type OrcamentoStatus,
  type StatusComercial,
  type OrcamentoAsset,
  type OrcamentoAnalise,
  STATUS_COMERCIAL_MAP,
  FAIXAS_INVESTIMENTO,
  TIPOS_PROJETO,
  PRAZOS,
  URGENCIAS,
  ORIGENS_LEAD,
  ESTAGIOS_OPERACAO,
  ESTRATEGIAS_COMERCIAIS,
  qualificarLead,
} from "@/lib/orcamentos";

// Re-export CRUD operations
export {
  salvarOrcamento,
  getOrcamentos,
  getOrcamentoById,
  atualizarStatus,
  atualizarStatusComercial,
  atualizarOrcamento,
  removerOrcamento,
  uploadOrcamentoAssets,
  getOrcamentoAssets,
  getOrcamentoAnalises,
} from "@/lib/orcamentos";

/**
 * Count total orcamentos (for dashboard).
 */
export async function countOrcamentos(): Promise<number> {
  logDomain(DOMAIN, "countOrcamentos", "info", "Counting orcamentos");
  const { count, error } = await db
    .from("orcamentos")
    .select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countOrcamentos", "error", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Get orcamentos by commercial status (for pipeline).
 */
export async function getOrcamentosByStatus(status: string) {
  logDomain(DOMAIN, "getOrcamentosByStatus", "info", `Fetching status=${status}`);
  const result = await db
    .from("orcamentos")
    .select("*")
    .eq("status_comercial", status)
    .order("criado_em", { ascending: false });
  return unwrap(result, DOMAIN, "getOrcamentosByStatus");
}
