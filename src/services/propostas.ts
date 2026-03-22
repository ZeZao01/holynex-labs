/**
 * Propostas Service — encapsulates proposal operations.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "propostas";

export {
  type PropostaInput,
  type PropostaFinanceiro,
  type PropostaJSON,
  type Proposta,
  gerarPropostaIA,
  salvarProposta,
  getPropostas,
  getProposta,
  atualizarStatusProposta,
  removerProposta,
  atualizarProposta,
  atualizarPropostaArtefatos,
  atualizarPropostaTiers,
  togglePropostaPublic,
  getPropostaByToken,
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

export async function getPropostasByStatus(status: string) {
  logDomain(DOMAIN, "getPropostasByStatus", "info", `Fetching status=${status}`);
  const result = await db
    .from("propostas")
    .select("*")
    .eq("status", status)
    .order("criado_em", { ascending: false });
  return unwrap(result, DOMAIN, "getPropostasByStatus");
}
