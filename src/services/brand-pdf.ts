import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import { logAction } from "@/lib/audit-logs";
import type { BrandVersion } from "@/types/brand-studio";

const DOMAIN = "brand-pdf";

export async function listBrandVersionsByProject(projectId: string): Promise<BrandVersion[]> {
  logDomain(DOMAIN, "listBrandVersionsByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from("brand_versions")
    .select("*")
    .eq("project_id", projectId)
    .order("version_number", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandVersionsByProject") || []) as BrandVersion[];
}

export async function listBrandPresentations(): Promise<BrandVersion[]> {
  logDomain(DOMAIN, "listBrandPresentations", "info", "Listing presentation versions");
  const result = await dbAny
    .from("brand_versions")
    .select("*")
    .not("presentation_url", "is", null)
    .order("atualizado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandPresentations") || []) as BrandVersion[];
}

export async function registerBrandPresentation(versionId: string, presentationUrl: string): Promise<BrandVersion> {
  logDomain(DOMAIN, "registerBrandPresentation", "info", `version=${versionId}`);
  const result = await dbAny
    .from("brand_versions")
    .update({ presentation_url: presentationUrl, status: "apresentado" })
    .eq("id", versionId)
    .select("*")
    .single();
  const updated = unwrap(result, DOMAIN, "registerBrandPresentation") as BrandVersion;
  await logAction("generate_brand_pdf", "brand_version", updated.id, {
    project_id: updated.project_id,
    presentation_url: updated.presentation_url,
    status: updated.status,
  });
  return updated;
}

export async function countBrandPresentations(): Promise<number> {
  logDomain(DOMAIN, "countBrandPresentations", "info", "Counting presentations");
  const { count, error } = await dbAny
    .from("brand_versions")
    .select("*", { count: "exact", head: true })
    .not("presentation_url", "is", null);
  if (error) {
    logDomain(DOMAIN, "countBrandPresentations", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
