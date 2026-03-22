/**
 * AI Service — encapsulates AI execution operations.
 * Re-exports from existing libs for backward compatibility.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "ai";

// Re-export
export {
  type AiUseCase,
  type AiEntityType,
  type AiExecutionStatus,
  type AiExecution,
  getAiExecutions,
  getAiExecutionsByEntity,
  updateAiExecution,
  getAiStats,
} from "@/lib/ai-copilot";

/**
 * Count AI executions by status (for dashboard).
 */
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
