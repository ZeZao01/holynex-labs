/**
 * Portfolio Service — encapsulates portfolio item operations.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "portfolio";

export {
  type PortfolioItem,
  listPortfolioItems,
  getPortfolioItem,
  getPortfolioItemBySlug,
  savePortfolioItem,
  deletePortfolioItem,
  addPortfolioEvent,
  getPortfolioEvents,
  uploadPortfolioImage,
} from "@/lib/portfolio-items";

export async function getPublicPortfolioItems() {
  logDomain(DOMAIN, "getPublicPortfolioItems", "info", "Fetching public items");
  const result = await db
    .from("portfolio_items")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return unwrap(result, DOMAIN, "getPublicPortfolioItems");
}

export async function countPortfolioItems(): Promise<number> {
  logDomain(DOMAIN, "countPortfolioItems", "info", "Counting items");
  const { count, error } = await db
    .from("portfolio_items")
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);
  if (error) {
    logDomain(DOMAIN, "countPortfolioItems", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
