/**
 * Propostas Service — encapsulates proposal operations.
 * Re-exports from existing libs for backward compatibility.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "propostas";

// Re-export types and functions
export {
  type PropostaInput,
  type PropostaFinanceiro,
  type PropostaJSON,
  criarProposta,
  getPropostas,
  getPropostaById,
  getPropostaByToken,
  atualizarProposta,
  deletarProposta,
  publishProposta,
  unpublishProposta,
} from "@/lib/propostas";

export {
  type ProposalTier,
  type ProposalAddon,
  type CommercialNotes,
  type TierType,
  type ScopeStatus,
  type ProposalStatus,
  TIER_DEFAULTS,
} from "@/lib/proposal-tiers";

/**
 * Count total propostas (for dashboard).
 */
export async function countPropostas(): Promise<number> {
  logDomain(DOMAIN, "countPropostas", "info", "Counting propostas");
  const { count, error } = await db
    .from("propostas")
    .select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countPropostas", "error", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Get propostas by status (for pipeline).
 */
export async function getPropostasByStatus(status: string) {
  logDomain(DOMAIN, "getPropostasByStatus", "info", `Fetching status=${status}`);
  const result = await db
    .from("propostas")
    .select("*")
    .eq("status", status)
    .order("criado_em", { ascending: false });
  return unwrap(result, DOMAIN, "getPropostasByStatus");
}
