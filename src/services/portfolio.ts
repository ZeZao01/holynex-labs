/**
 * Portfolio Service — encapsulates portfolio item operations.
 * Re-exports from existing libs for backward compatibility.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "portfolio";

// Re-export
export {
  type PortfolioItem,
  getPortfolioItems,
  getPortfolioItemById,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
} from "@/lib/portfolio-items";

/**
 * Get only active and featured portfolio items (for public site).
 */
export async function getPublicPortfolioItems() {
  logDomain(DOMAIN, "getPublicPortfolioItems", "info", "Fetching public items");
  const result = await db
    .from("portfolio_items")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  return unwrap(result, DOMAIN, "getPublicPortfolioItems");
}

/**
 * Count portfolio items (for dashboard).
 */
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
