import type { PortfolioItem } from "@/lib/portfolio-items";

export type PortfolioMatchContext = {
  niche?: string;
  category?: string;
  solutionType?: string;
  features?: string[];
};

export type PortfolioReference = {
  id: string;
  title: string;
  score: number;
  reason: string;
  item: PortfolioItem;
};

type ReferenceOptions = {
  limit?: number;
  minScore?: number;
  fallback?: "none" | "featured" | "highlighted";
};

const normalize = (value?: string | null) => (value || "").toLowerCase().trim();

const splitTokens = (value?: string | string[] | null) => {
  if (!value) return [] as string[];
  const raw = Array.isArray(value) ? value : String(value).split(/[,;|\n]/g);
  return raw
    .map((item) => normalize(item))
    .filter((item) => item.length > 0);
};

const unique = (values: string[]) => Array.from(new Set(values));

function matchText(a?: string | null, b?: string | null) {
  const av = normalize(a);
  const bv = normalize(b);
  return av.length > 0 && bv.length > 0 && av === bv;
}

function calcFeatureOverlap(a: string[], b: string[]) {
  if (a.length === 0 || b.length === 0) return [] as string[];
  const bSet = new Set(b);
  return a.filter((item) => bSet.has(item));
}

export function getPortfolioReferences(
  items: PortfolioItem[],
  context: PortfolioMatchContext,
  options: ReferenceOptions = {},
): PortfolioReference[] {
  const limit = options.limit ?? 4;
  const minScore = options.minScore ?? 3;
  const fallback = options.fallback ?? "none";

  const ctxFeatures = unique(splitTokens(context.features));
  const ctxNiche = normalize(context.niche);
  const ctxCategory = normalize(context.category);
  const ctxSolution = normalize(context.solutionType);

  const scored = items.map((item) => {
    let score = 0;
    const reasons: string[] = [];

    if (ctxNiche && matchText(item.niche, ctxNiche)) {
      score += 4;
      reasons.push(`Nicho: ${item.niche}`);
    }

    if (ctxCategory && matchText(item.category, ctxCategory)) {
      score += 3;
      reasons.push(`Categoria: ${item.category}`);
    }

    if (ctxSolution && matchText(item.solution_type, ctxSolution)) {
      score += 3;
      reasons.push(`Tipo: ${item.solution_type}`);
    }

    const itemFeatures = unique(splitTokens(item.features));
    const overlap = calcFeatureOverlap(ctxFeatures, itemFeatures);
    if (overlap.length > 0) {
      const featureScore = Math.min(4, overlap.length);
      score += featureScore;
      reasons.push(`Funcionalidades: ${overlap.slice(0, 3).join(", ")}`);
    }

    return { item, score, reason: reasons.join(" • ") };
  });

  const filtered = scored
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aFeatured = a.item.is_featured ? 1 : 0;
      const bFeatured = b.item.is_featured ? 1 : 0;
      if (bFeatured !== aFeatured) return bFeatured - aFeatured;
      const aSort = a.item.sort_order ?? 999;
      const bSort = b.item.sort_order ?? 999;
      if (aSort !== bSort) return aSort - bSort;
      return (a.item.display_order ?? 999) - (b.item.display_order ?? 999);
    })
    .slice(0, limit);

  if (filtered.length > 0 || fallback === "none") {
    return filtered.map((entry) => ({
      id: entry.item.id,
      title: entry.item.title,
      score: entry.score,
      reason: entry.reason,
      item: entry.item,
    }));
  }

  const fallbackItems = items.filter((item) => {
    if (fallback === "highlighted") return !!item.is_highlighted || !!item.is_featured;
    return !!item.is_featured;
  });

  return fallbackItems
    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      title: item.title,
      score: 0,
      reason: "Destaque manual",
      item,
    }));
}
