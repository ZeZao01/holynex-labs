import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { logAction } from "@/lib/audit-logs";
import type { BrandProject } from "@/types/brand-studio";

const DOMAIN = "brand-projects";
const TABLE = "brand_projects";

export async function listBrandProjects(): Promise<BrandProject[]> {
  logDomain(DOMAIN, "listBrandProjects", "info", "Listing projects");
  const result = await dbAny.from(TABLE).select("*").order("atualizado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandProjects") || []) as BrandProject[];
}

export async function getBrandProjectById(id: string): Promise<BrandProject | null> {
  logDomain(DOMAIN, "getBrandProjectById", "info", `id=${id}`);
  const result = await dbAny.from(TABLE).select("*").eq("id", id).maybeSingle();
  return (unwrap(result, DOMAIN, "getBrandProjectById") || null) as BrandProject | null;
}

export async function createBrandProject(payload: Partial<BrandProject> & { nome: string }) {
  logDomain(DOMAIN, "createBrandProject", "info", payload.nome);
  const result = await dbAny.from(TABLE).insert(payload).select("*").single();
  const created = unwrap(result, DOMAIN, "createBrandProject") as BrandProject;
  await logAction("create_brand_project", "brand_project", created.id, {
    nome: created.nome,
    status: created.status,
  });
  return created;
}

export async function updateBrandProject(id: string, patch: Partial<BrandProject>) {
  logDomain(DOMAIN, "updateBrandProject", "info", `id=${id}`);
  const result = await dbAny.from(TABLE).update(patch).eq("id", id).select("*").single();
  const updated = unwrap(result, DOMAIN, "updateBrandProject") as BrandProject;
  await logAction("edit_brand_project", "brand_project", updated.id, {
    patch,
  });
  return updated;
}

export async function countBrandProjects(): Promise<number> {
  logDomain(DOMAIN, "countBrandProjects", "info", "Counting projects");
  const { count, error } = await dbAny.from(TABLE).select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandProjects", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
