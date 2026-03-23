import { dbAny, logDomain, unwrap } from "@/lib/service-helpers";
import type { BrandDesignAsset } from "@/types/brand-studio";

const DOMAIN = "brand-assets";
const TABLE = "brand_design_assets";

export async function listBrandAssets(): Promise<BrandDesignAsset[]> {
  logDomain(DOMAIN, "listBrandAssets", "info", "Listing assets");
  const result = await dbAny.from(TABLE).select("*").order("criado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "listBrandAssets") || []) as BrandDesignAsset[];
}

export async function getBrandAssetsByProject(projectId: string): Promise<BrandDesignAsset[]> {
  logDomain(DOMAIN, "getBrandAssetsByProject", "info", `project=${projectId}`);
  const result = await dbAny
    .from(TABLE)
    .select("*")
    .eq("project_id", projectId)
    .order("criado_em", { ascending: false });
  return (unwrap(result, DOMAIN, "getBrandAssetsByProject") || []) as BrandDesignAsset[];
}

export async function createBrandAsset(payload: Partial<BrandDesignAsset> & { project_id: string; storage_path: string }) {
  logDomain(DOMAIN, "createBrandAsset", "info", payload.storage_path);
  const result = await dbAny.from(TABLE).insert(payload).select("*").single();
  return unwrap(result, DOMAIN, "createBrandAsset") as BrandDesignAsset;
}

export async function countBrandAssets(): Promise<number> {
  logDomain(DOMAIN, "countBrandAssets", "info", "Counting assets");
  const { count, error } = await dbAny.from(TABLE).select("*", { count: "exact", head: true });
  if (error) {
    logDomain(DOMAIN, "countBrandAssets", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
