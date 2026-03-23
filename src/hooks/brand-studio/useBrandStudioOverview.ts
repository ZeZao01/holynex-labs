import { useCallback, useEffect, useState } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  countBrandProjects,
  countBrandBriefs,
  countBrandTasks,
  countBrandAssets,
  countBrandAiRuns,
  countBrandPendingReviews,
} from "@/services/brand-studio";
import type { BrandStudioOverviewStats } from "@/types/brand-studio";

const INITIAL_STATS: BrandStudioOverviewStats = {
  projects: 0,
  briefs: 0,
  tasks: 0,
  assets: 0,
  aiRuns: 0,
  pendingReviews: 0,
};

export function useBrandStudioOverview(enabled = true) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<BrandStudioOverviewStats>(INITIAL_STATS);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projects, briefs, tasks, assets, aiRuns, pendingReviews] = await Promise.all([
        countBrandProjects(),
        countBrandBriefs(),
        countBrandTasks(),
        countBrandAssets(),
        countBrandAiRuns(),
        countBrandPendingReviews(),
      ]);

      setStats({ projects, briefs, tasks, assets, aiRuns, pendingReviews });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar Brand Studio");
      setStats(INITIAL_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    load();
  }, [enabled, load]);

  useRealtimeSubscription("brand_projects", load, enabled);
  useRealtimeSubscription("brand_briefs", load, enabled);
  useRealtimeSubscription("brand_tasks", load, enabled);
  useRealtimeSubscription("brand_design_assets", load, enabled);
  useRealtimeSubscription("brand_ai_runs", load, enabled);

  return { loading, error, stats, refresh: load };
}
