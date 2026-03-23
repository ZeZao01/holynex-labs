import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEffectivePermissions, getUserRoleNames, ensureUserSetup, PermissionMatrix } from "@/lib/rbac";
import { initDefaultPermissions, logSecurityEvent } from "@/lib/security";

interface GuardOptions {
  description?: string;
  severity?: string;
  metadata?: Record<string, any>;
}

interface AccessControlContextValue {
  loading: boolean;
  roles: string[];
  permissions: PermissionMatrix;
  refresh: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  canView: (module: string) => boolean;
  canCreate: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  canDelete: (module: string) => boolean;
  canExport: (module: string) => boolean;
  canApprove: (module: string) => boolean;
  canActivateAddon: () => boolean;
  canViewSensitiveData: () => boolean;
  isDevAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  guardAction: (module: string, action: string, opts?: GuardOptions) => Promise<boolean>;
}

const AccessControlContext = createContext<AccessControlContextValue | null>(null);

const VIEW_OVERRIDES: Record<string, string[]> = {
  financeiro: ["visualizar", "acessar_financeiro"],
  seguranca: ["visualizar", "acessar_seguranca"],
  configuracoes: ["visualizar", "gerenciar_configuracoes"],
};

const EDIT_OVERRIDES: Record<string, string[]> = {
  configuracoes: ["editar", "gerenciar_configuracoes"],
};

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<PermissionMatrix>({});
  const [bootstrapped, setBootstrapped] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setRoles([]);
      setPermissions({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Bootstrap: ensure user has profile + role + default permissions exist
      if (!bootstrapped) {
        await ensureUserSetup(user);
        try { await initDefaultPermissions(); } catch { /* ignore */ }
        setBootstrapped(true);
      }

      const roleNames = await getUserRoleNames(user.id, user);
      const perms = await getEffectivePermissions(roleNames);
      setRoles(roleNames);
      setPermissions(perms);
    } catch {
      const fallbackRoles = ["somente_leitura"];
      try {
        const perms = await getEffectivePermissions(fallbackRoles);
        setRoles(fallbackRoles);
        setPermissions(perms);
      } catch {
        setRoles(fallbackRoles);
        setPermissions({});
      }
    } finally {
      setLoading(false);
    }
  }, [user, bootstrapped]);

  useEffect(() => {
    refresh();
  }, [user?.id, refresh]);

  const hasPermission = useCallback((module: string, action: string) => {
    if (roles.includes("dev_admin") || roles.includes("super_admin")) return true;
    return !!permissions?.[module]?.[action];
  }, [permissions, roles]);

  const canView = useCallback((module: string) => {
    const actions = VIEW_OVERRIDES[module] || ["visualizar"];
    return actions.some((action) => hasPermission(module, action));
  }, [hasPermission]);

  const canCreate = useCallback((module: string) => hasPermission(module, "criar"), [hasPermission]);
  const canEdit = useCallback((module: string) => {
    const actions = EDIT_OVERRIDES[module] || ["editar"];
    return actions.some((action) => hasPermission(module, action));
  }, [hasPermission]);
  const canDelete = useCallback((module: string) => hasPermission(module, "excluir"), [hasPermission]);
  const canExport = useCallback((module: string) => hasPermission(module, "exportar"), [hasPermission]);
  const canApprove = useCallback((module: string) => hasPermission(module, "aprovar"), [hasPermission]);
  const canActivateAddon = useCallback(() => hasPermission("configuracoes", "ativar_addon"), [hasPermission]);
  const canViewSensitiveData = useCallback(() => hasPermission("acessos", "visualizar_segredo"), [hasPermission]);
  const isDevAdmin = useCallback(() => roles.includes("dev_admin") || roles.includes("super_admin"), [roles]);
  const isSuperAdmin = useCallback(() => roles.includes("super_admin"), [roles]);

  const guardAction = useCallback(async (module: string, action: string, opts: GuardOptions = {}) => {
    if (hasPermission(module, action)) return true;
    await logSecurityEvent(
      "acesso_negado",
      opts.severity || "medium",
      opts.description || `Acesso negado: ${module}.${action}`,
      {
        source: "frontend",
        entityType: "permission",
        entityId: `${module}.${action}`,
        metadata: { module, action, ...(opts.metadata || {}) },
      }
    );
    return false;
  }, [hasPermission]);

  const value = useMemo(
    () => ({
      loading, roles, permissions, refresh,
      hasPermission, canView, canCreate, canEdit, canDelete,
      canExport, canApprove, canActivateAddon, canViewSensitiveData,
      isDevAdmin, isSuperAdmin, guardAction,
    }),
    [loading, roles, permissions, refresh, hasPermission, canView, canCreate, canEdit,
     canDelete, canExport, canApprove, canActivateAddon, canViewSensitiveData,
     isDevAdmin, isSuperAdmin, guardAction]
  );

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  const ctx = useContext(AccessControlContext);
  if (!ctx) throw new Error("useAccessControl must be used within AccessControlProvider");
  return ctx;
}
