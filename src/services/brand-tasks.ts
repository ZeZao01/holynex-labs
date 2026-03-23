import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import type { BrandTask, BrandTaskStatus } from "@/types/brand-studio";

const DOMAIN = "brand-tasks";
const TABLE = "brand_tasks";

export async function listBrandTasks(): Promise<BrandTask[]> {
  logDomain(DOMAIN, "listBrandTasks", "info", "Listing tasks");
  const result = await dbAny.from(TABLE).select("*").order("atualizado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandTasks") || []) as BrandTask[];
}

export async function getBrandTasksByProject(projectId: string): Promise<BrandTask[]> {
  logDomain(DOMAIN, "getBrandTasksByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "getBrandTasksByProject") || []) as BrandTask[];
}

export async function createBrandTask(payload: Partial<BrandTask> & { project_id: string; title: string }) {
  logDomain(DOMAIN, "createBrandTask", "info", payload.title);
  const result = await dbAny.from(TABLE).insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "createBrandTask") as BrandTask;
}

export async function updateBrandTaskStatus(id: string, status: BrandTaskStatus) {
  logDomain(DOMAIN, "updateBrandTaskStatus", "info", `id=${id};status=${status}`);
  const result = await dbAny.from(TABLE).update({ status }).eq("id", id).select("*").single();
  return unwrap(result, DOMAIN, "updateBrandTaskStatus") as BrandTask;
}

export async function countBrandTasks(): Promise<number> {
  logDomain(DOMAIN, "countBrandTasks", "info", "Counting tasks");
  const { count, error } = await dbAny.from(TABLE).select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandTasks", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
