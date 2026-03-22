/**
 * Feature Flags — progressive feature enablement system.
 *
 * Flags can be stored in system_settings table (key: "feature_flags")
 * or fall back to local defaults. This allows enabling features
 * without code changes.
 */

export interface FeatureFlags {
  /** AI-powered lead analysis */
  ai_lead_analysis: boolean;
  /** AI-powered proposal generation */
  ai_proposal_generation: boolean;
  /** Hidden add-ons system */
  hidden_addons: boolean;
  /** Advanced PDF template with dynamic blocks */
  advanced_pdf: boolean;
  /** Portfolio expanded preview mode */
  portfolio_expanded_preview: boolean;
  /** RBAC granular permissions */
  rbac_granular: boolean;
  /** Niche intelligence dashboard */
  niche_intelligence: boolean;
  /** Proposal public sharing */
  proposal_public_sharing: boolean;
  /** Financial profitability metrics */
  financial_profitability: boolean;
  /** Real-time notifications */
  realtime_notifications: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  ai_lead_analysis: true,
  ai_proposal_generation: true,
  hidden_addons: true,
  advanced_pdf: false,
  portfolio_expanded_preview: false,
  rbac_granular: true,
  niche_intelligence: true,
  proposal_public_sharing: true,
  financial_profitability: true,
  realtime_notifications: false,
};

let _cachedFlags: FeatureFlags | null = null;
let _cacheTimestamp = 0;
const CACHE_TTL = 60_000; // 1 minute

/**
 * Get current feature flags. Uses cached value if fresh enough,
 * otherwise falls back to defaults.
 */
export function getFeatureFlags(): FeatureFlags {
  if (_cachedFlags && Date.now() - _cacheTimestamp < CACHE_TTL) {
    return _cachedFlags;
  }
  return { ...DEFAULT_FLAGS };
}

/**
 * Update cached flags (called from system-settings when loaded).
 */
export function setCachedFlags(flags: Partial<FeatureFlags>) {
  _cachedFlags = { ...DEFAULT_FLAGS, ...flags };
  _cacheTimestamp = Date.now();
}

/**
 * Check if a specific feature is enabled.
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return getFeatureFlags()[flag];
}

/**
 * Invalidate cached flags (force refresh on next access).
 */
export function invalidateFlagCache() {
  _cachedFlags = null;
  _cacheTimestamp = 0;
}
