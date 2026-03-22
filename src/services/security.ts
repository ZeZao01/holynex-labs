/**
 * Security Service — encapsulates security, audit, and RBAC operations.
 * Re-exports from existing libs for backward compatibility.
 */

import { db, unwrap, logDomain } from "@/lib/service-helpers";

const DOMAIN = "security";

// Re-export RBAC
export {
  type UserProfile,
  type UserRoleAssignment,
  type RolePermissionRow,
  type PermissionMatrix,
  getUserProfiles,
  getUserRoleAssignments,
  getUserProfileByUserId,
  getUserRoleNames,
  getEffectivePermissions,
} from "@/lib/rbac";

// Re-export security
export {
  ROLES,
  ROLE_LABELS,
  MODULES,
  MODULE_LABELS,
  ACTIONS,
  ACTION_LABELS,
  DEFAULT_PERMISSIONS,
  logSecurityEvent,
  getSecurityEvents,
  getSecurityAlerts,
  getSecurityIncidents,
} from "@/lib/security";

// Re-export audit
export {
  type AuditLog,
  getAuditLogs,
  logAction,
} from "@/lib/audit-logs";

/**
 * Get recent security events count (for dashboard).
 */
export async function countRecentSecurityEvents(hoursBack = 24): Promise<number> {
  logDomain(DOMAIN, "countRecentSecurityEvents", "info", `Last ${hoursBack}h`);
  const since = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  const { count, error } = await db
    .from("security_events")
    .select("*", { count: "exact", head: true })
    .gte("criado_em", since);
  if (error) {
    logDomain(DOMAIN, "countRecentSecurityEvents", "error", error.message);
    return 0;
  }
  return count ?? 0;
}
