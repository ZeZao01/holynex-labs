/**
 * AI Service — encapsulates AI execution operations.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "ai";

export {
  type AiUseCase,
  type AiEntityType,
  type AiExecutionStatus,
  type AiExecution,
  getAiExecutions,
  getExecutionsByEntity,
  getPendingReviews,
  reviewExecution,
  runCopilot,
  summarizeLead,
  suggestStrategy,
  summarizeProposal,
  summarizeProject,
  suggestPortfolioCopy,
  suggestModel,
  explainFinancials,
  summarizeMaintenance,
} from "@/lib/ai-copilot";

export async function countAiExecutionsByStatus(status: string): Promise<number> {
  logDomain(DOMAIN, "countAiExecutionsByStatus", "info", `status=${status}`);
  const { count, error } = await db
    .from("ai_executions")
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) {
    logDomain(DOMAIN, "countAiExecutionsByStatus", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
