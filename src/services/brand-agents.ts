import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import type { BrandAgentConfig, BrandAiRun } from "@/types/brand-studio";

const DOMAIN = "brand-agents";

export async function listBrandAgentConfigs(): Promise<BrandAgentConfig[]> {
  logDomain(DOMAIN, "listBrandAgentConfigs", "info", "Listing agent configs");
  const result = await dbAny
    .from("brand_agent_configs")
    .select("*")
    .order("agent_key", { ascending: true });
  return (unwrap(result, DOMAIN, "listBrandAgentConfigs") || []) as BrandAgentConfig[];
}

export async function upsertBrandAgentConfig(payload: Partial<BrandAgentConfig> & { agent_key: string }) {
  if (payload.id) {
    logDomain(DOMAIN, "upsertBrandAgentConfig", "info", `update=${payload.id}`);
    const result = await dbAny
      .from("brand_agent_configs")
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
    return unwrap(result, DOMAIN, "upsertBrandAgentConfig.update") as BrandAgentConfig;
  }

  logDomain(DOMAIN, "upsertBrandAgentConfig", "info", `create=${payload.agent_key}`);
  const result = await dbAny.from("brand_agent_configs").insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "upsertBrandAgentConfig.create") as BrandAgentConfig;
}

export async function listBrandAiRuns(limit = 100): Promise<BrandAiRun[]> {
  logDomain(DOMAIN, "listBrandAiRuns", "info", `limit=${limit}`);
  const result = await dbAny
    .from("brand_ai_runs")
    .select("*")
    .order("criado_em", { ascending: false })
    .limit(limit);
  return (unwrap(result, DOMAIN, "listBrandAiRuns") || []) as BrandAiRun[];
}

export async function createBrandAiRun(payload: Partial<BrandAiRun> & { project_id: string }) {
  logDomain(DOMAIN, "createBrandAiRun", "info", `project=${payload.project_id}`);
  const result = await dbAny.from("brand_ai_runs").insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "createBrandAiRun") as BrandAiRun;
}

export async function countBrandAiRuns(): Promise<number> {
  logDomain(DOMAIN, "countBrandAiRuns", "info", "Counting AI runs");
  const { count, error } = await dbAny
    .from("brand_ai_runs")
    .select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandAiRuns", "error", error.message);
    return 0;
  }
  return count ?? 0;
}

export async function countBrandPendingReviews(): Promise<number> {
  logDomain(DOMAIN, "countBrandPendingReviews", "info", "Counting pending reviews");
  const { count, error } = await dbAny
    .from("brand_ai_runs")
    .select("*", { count: "exact", head: true })
    .in("status", ["aguardando_revisao", "em_revisao"]);
  if (error) {
    logDomain(DOMAIN, "countBrandPendingReviews", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
