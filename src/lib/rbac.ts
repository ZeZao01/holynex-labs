import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { ACTIONS, DEFAULT_PERMISSIONS } from "@/lib/security";

const sb = supabase as any;

export interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string | null;
  email?: string | null;
  role_name?: string | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_name: string;
  is_active: boolean;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

export interface RolePermissionRow {
  role_name: string;
  module: string;
  action: string;
  allowed: boolean;
}

export type PermissionMatrix = Record<string, Record<string, boolean>>;

// ── Profile CRUD ──────────────────────────────────────────────────────

export async function getUserProfiles(): Promise<UserProfile[]> {
  const { data, error } = await sb
    .from("user_profiles")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as UserProfile[];
}

export async function getUserRoleAssignments(): Promise<UserRoleAssignment[]> {
  const { data, error } = await sb
    .from("user_role_assignments")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as UserRoleAssignment[];
}

export async function getUserProfileByUserId(userId: string): Promise<UserProfile | null> {
  const { data, error } = await sb
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserProfile) || null;
}

export async function upsertUserRoleAssignment(userId: string, roleName: string): Promise<string> {
  const { data: existing, error } = await sb
    .from("user_role_assignments")
    .select("id, role_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const payload = {
    user_id: userId,
    role_name: roleName,
    is_active: true,
    atualizado_em: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error: updateError } = await sb
      .from("user_role_assignments")
      .update(payload)
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await sb
    .from("user_role_assignments")
    .insert(payload)
    .select("id")
    .single();
  if (insertError) throw insertError;
  return inserted?.id as string;
}

// ── Role Resolution ───────────────────────────────────────────────────

export async function getUserRoleNames(userId: string, user?: User | null): Promise<string[]> {
  const roleNames = new Set<string>();

  // 1. Try DB assignments first
  try {
    const { data, error } = await sb
      .from("user_role_assignments")
      .select("role_name, is_active")
      .eq("user_id", userId);

    if (!error && data && data.length > 0) {
      (data as UserRoleAssignment[]).forEach((row) => {
        if (row.is_active && row.role_name) roleNames.add(row.role_name);
      });
    }
  } catch {
    // DB table may not exist yet, continue to fallback
  }

  // 2. Fallback: check user metadata
  if (roleNames.size === 0 && user) {
    const metaRoles = (user as any)?.user_metadata?.roles || (user as any)?.app_metadata?.roles;
    const singleRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;
    if (Array.isArray(metaRoles)) metaRoles.forEach((r: string) => roleNames.add(String(r)));
    if (typeof metaRoles === "string") roleNames.add(metaRoles);
    if (singleRole) roleNames.add(String(singleRole));
  }

  // 3. Fallback: check profile
  if (roleNames.size === 0) {
    try {
      const profile = await getUserProfileByUserId(userId);
      if (profile?.role_name) roleNames.add(profile.role_name);
    } catch {
      // ignore
    }
  }

  // 4. Final fallback
  if (roleNames.size === 0) roleNames.add("somente_leitura");

  return Array.from(roleNames);
}

// ── Permission Matrix ─────────────────────────────────────────────────

function buildMatrixFromDefault(roleNames: string[]): PermissionMatrix {
  const matrix: PermissionMatrix = {};
  roleNames.forEach((role) => {
    const modules = DEFAULT_PERMISSIONS[role] || {};
    Object.entries(modules).forEach(([moduleName, actions]) => {
      if (!matrix[moduleName]) matrix[moduleName] = {};
      ACTIONS.forEach((action) => {
        if (matrix[moduleName][action] === undefined) matrix[moduleName][action] = false;
      });
      (actions || []).forEach((action) => {
        matrix[moduleName][action] = true;
      });
    });
  });
  return matrix;
}

function fillMissingMatrix(target: PermissionMatrix, source: PermissionMatrix): PermissionMatrix {
  Object.entries(source).forEach(([moduleName, actions]) => {
    if (!target[moduleName]) target[moduleName] = {};
    Object.entries(actions).forEach(([action, allowed]) => {
      if (target[moduleName][action] === undefined) target[moduleName][action] = allowed;
    });
  });
  return target;
}

export async function getEffectivePermissions(roleNames: string[]): Promise<PermissionMatrix> {
  if (roleNames.length === 0) return {} as PermissionMatrix;

  try {
    const { data, error } = await sb
      .from("role_permissions")
      .select("role_name, module, action, allowed")
      .in("role_name", roleNames);

    if (error) throw error;

    const rows = (data || []) as RolePermissionRow[];
    const matrix: PermissionMatrix = {};

    rows.forEach((row) => {
      if (!matrix[row.module]) matrix[row.module] = {};
      if (row.allowed) {
        matrix[row.module][row.action] = true;
      } else if (matrix[row.module][row.action] === undefined) {
        matrix[row.module][row.action] = false;
      }
    });

    // If no DB permissions found, use defaults
    if (rows.length === 0) {
      return buildMatrixFromDefault(roleNames);
    }

    // Fill missing entries from defaults
    return fillMissingMatrix(matrix, buildMatrixFromDefault(roleNames));
  } catch {
    // Table doesn't exist yet or other error — fall back to defaults
    return buildMatrixFromDefault(roleNames);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────

/**
 * Ensure the current user has a profile and role assignment.
 * Called on first admin load.
 */
export async function ensureUserSetup(user: User): Promise<void> {
  try {
    // Check if profile exists
    const profile = await getUserProfileByUserId(user.id);
    if (!profile) {
      // Create profile
      await sb.from("user_profiles").insert({
        user_id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || "",
      });
    }

    // Check if role assignment exists
    const { data: assignments } = await sb
      .from("user_role_assignments")
      .select("id")
      .eq("user_id", user.id);

    if (!assignments || assignments.length === 0) {
      // Check if this is the first user (make them super_admin)
      const { count } = await sb
        .from("user_role_assignments")
        .select("*", { count: "exact", head: true });

      const role = (count === 0 || count === null) ? "super_admin" : "somente_leitura";
      await sb.from("user_role_assignments").insert({
        user_id: user.id,
        role_name: role,
        is_active: true,
      });
    }
  } catch (err) {
    console.warn("[RBAC] ensureUserSetup failed (tables may not exist yet):", err);
  }
}
