import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import type { BrandBrief } from "@/types/brand-studio";

const DOMAIN = "brand-briefs";
const TABLE = "brand_briefs";

export async function listBrandBriefs(): Promise<BrandBrief[]> {
  logDomain(DOMAIN, "listBrandBriefs", "info", "Listing briefs");
  const result = await dbAny.from(TABLE).select("*").order("atualizado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandBriefs") || []) as BrandBrief[];
}

export async function getBrandBriefsByProject(projectId: string): Promise<BrandBrief[]> {
  logDomain(DOMAIN, "getBrandBriefsByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: false });
  return (unwrap(result, DOMAIN, "getBrandBriefsByProject") || []) as BrandBrief[];
}

export async function saveBrandBrief(payload: Partial<BrandBrief> & { project_id: string; titulo: string }) {
  if (payload.id) {
    logDomain(DOMAIN, "saveBrandBrief", "info", `update=${payload.id}`);
    const result = await dbAny
      .from(TABLE)
      .update(payload)
      .eq("id", payload.id)
      .select("*")
      .single();
    return unwrap(result, DOMAIN, "saveBrandBrief.update") as BrandBrief;
  }

  logDomain(DOMAIN, "saveBrandBrief", "info", `create.project=${payload.project_id}`);
  const result = await dbAny.from(TABLE).insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "saveBrandBrief.create") as BrandBrief;
}

export async function countBrandBriefs(): Promise<number> {
  logDomain(DOMAIN, "countBrandBriefs", "info", "Counting briefs");
  const { count, error } = await dbAny.from(TABLE).select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandBriefs", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
