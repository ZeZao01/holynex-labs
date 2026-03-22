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
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_name?: string | null;
  role_id?: string | null;
  is_active?: boolean | null;
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

export async function getUserProfiles() {
  const { data, error } = await sb
    .from("user_profiles" as any)
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as UserProfile[];
}

export async function getUserRoleAssignments() {
  const { data, error } = await sb
    .from("user_role_assignments" as any)
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data || []) as unknown as UserRoleAssignment[];
}

export async function getUserProfileByUserId(userId: string) {
  const { data, error } = await sb
    .from("user_profiles" as any)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data as UserProfile | null;
}

export async function upsertUserRoleAssignment(userId: string, roleName: string) {
  const { data: existing, error } = await sb
    .from("user_role_assignments" as any)
    .select("id, role_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const payload: any = {
    user_id: userId,
    role_name: roleName,
    atualizado_em: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error: updateError } = await sb
      .from("user_role_assignments" as any)
      .update(payload)
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return existing.id as string;
  }

  const { data: inserted, error: insertError } = await sb
    .from("user_role_assignments" as any)
    .insert(payload)
    .select("id")
    .single();
  if (insertError) throw insertError;
  return inserted?.id as string;
}

function resolveRolesFromMetadata(user?: User | null) {
  const roleNames = new Set<string>();
  const metaRoles = (user as any)?.user_metadata?.roles || (user as any)?.app_metadata?.roles;
  const singleRole = (user as any)?.user_metadata?.role || (user as any)?.app_metadata?.role;

  if (Array.isArray(metaRoles)) metaRoles.forEach((r) => roleNames.add(String(r)));
  if (typeof metaRoles === "string") roleNames.add(metaRoles);
  if (singleRole) roleNames.add(String(singleRole));

  return roleNames;
}

async function resolveRolesFromAssignments(userId: string) {
  const roleNames = new Set<string>();
  const { data, error } = await sb
    .from("user_role_assignments" as any)
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;

  const assignments = (data || []) as UserRoleAssignment[];
  const roleIds: string[] = [];

  assignments.forEach((row) => {
    if (row.is_active === false) return;
    if (row.role_name) roleNames.add(row.role_name);
    if (!row.role_name && row.role_id) roleIds.push(row.role_id);
  });

  if (roleIds.length > 0) {
    const { data: rolesData } = await sb
      .from("roles" as any)
      .select("id, name, role_name")
      .in("id", roleIds);
    (rolesData || []).forEach((r: any) => {
      if (r?.role_name) roleNames.add(r.role_name);
      else if (r?.name) roleNames.add(r.name);
    });
  }

  return roleNames;
}

export async function getUserRoleNames(userId: string, user?: User | null) {
  const roleNames = resolveRolesFromMetadata(user);

  try {
    const assignmentRoles = await resolveRolesFromAssignments(userId);
    assignmentRoles.forEach((r) => roleNames.add(r));
  } catch {
    // ignore, fallback to profile or metadata
  }

  if (roleNames.size === 0) {
    try {
      const profile = await getUserProfileByUserId(userId);
      if (profile?.role_name) roleNames.add(profile.role_name);
    } catch {
      // ignore
    }
  }

  if (roleNames.size === 0) roleNames.add("somente_leitura");

  return Array.from(roleNames);
}

function fillMissingMatrix(target: PermissionMatrix, source: PermissionMatrix) {
  Object.entries(source).forEach(([moduleName, actions]) => {
    if (!target[moduleName]) target[moduleName] = {};
    Object.entries(actions).forEach(([action, allowed]) => {
      if (target[moduleName][action] === undefined) target[moduleName][action] = allowed;
    });
  });
  return target;
}

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

export async function getEffectivePermissions(roleNames: string[]) {
  if (roleNames.length === 0) return {} as PermissionMatrix;
  const { data, error } = await supabase
    .from("role_permissions" as any)
    .select("role_name, module, action, allowed")
    .in("role_name", roleNames);

  if (error) throw error;
  const rows = (data || []) as unknown as RolePermissionRow[];
  const matrix: PermissionMatrix = {};

  rows.forEach((row) => {
    if (!matrix[row.module]) matrix[row.module] = {};
    if (row.allowed) {
      matrix[row.module][row.action] = true;
    } else if (matrix[row.module][row.action] === undefined) {
      matrix[row.module][row.action] = false;
    }
  });

  if (rows.length === 0) {
    return buildMatrixFromDefault(roleNames);
  }

  return fillMissingMatrix(matrix, buildMatrixFromDefault(roleNames));
}
