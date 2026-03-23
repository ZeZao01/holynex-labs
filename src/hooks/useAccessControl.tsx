import { createContext, useContext, useEffect, useMemo, useState, useCallback, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEffectivePermissions, getUserRoleNames, ensureUserSetup, bootstrapAdminAccess, PermissionMatrix } from "@/lib/rbac";
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
  canViewBrandProject: () => boolean;
  canCreateBrandProject: () => boolean;
  canEditBrandProject: () => boolean;
  canRunBrandAgent: () => boolean;
  canApproveBrandAsset: () => boolean;
  canGenerateBrandPdf: () => boolean;
  canManageBrandAgents: () => boolean;
  canActivateBrandAddon: () => boolean;
  canViewBrandSensitive: () => boolean;
  isDevAdmin: () => boolean;
  isSuperAdmin: () => boolean;
  guardAction: (module: string, action: string, opts?: GuardOptions) => Promise<boolean>;
}

const AccessControlContext = createContext<AccessControlContextValue | null>(null);

const VIEW_OVERRIDES: Record<string, string[]> = {
  financeiro: ["visualizar", "acessar_financeiro"],
  seguranca: ["visualizar", "acessar_seguranca"],
  configuracoes: ["visualizar", "gerenciar_configuracoes"],
  brand_studio: ["visualizar", "view_brand_project"],
};

const EDIT_OVERRIDES: Record<string, string[]> = {
  configuracoes: ["editar", "gerenciar_configuracoes"],
  brand_studio: ["editar", "edit_brand_project"],
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
        await bootstrapAdminAccess(user);
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
  const canViewBrandProject = useCallback(
    () => hasPermission("brand_studio", "view_brand_project") || canView("brand_studio"),
    [hasPermission, canView]
  );
  const canCreateBrandProject = useCallback(
    () => hasPermission("brand_studio", "create_brand_project") || canCreate("brand_studio"),
    [hasPermission, canCreate]
  );
  const canEditBrandProject = useCallback(
    () => hasPermission("brand_studio", "edit_brand_project") || canEdit("brand_studio"),
    [hasPermission, canEdit]
  );
  const canRunBrandAgent = useCallback(
    () => hasPermission("brand_studio", "run_brand_agent"),
    [hasPermission]
  );
  const canApproveBrandAsset = useCallback(
    () => hasPermission("brand_studio", "approve_brand_asset") || canApprove("brand_studio"),
    [hasPermission, canApprove]
  );
  const canGenerateBrandPdf = useCallback(
    () =>
      hasPermission("brand_studio", "generate_brand_pdf") ||
      hasPermission("brand_studio", "gerar_pdf") ||
      hasPermission("brand_studio", "baixar_pdf"),
    [hasPermission]
  );
  const canManageBrandAgents = useCallback(
    () => hasPermission("brand_studio", "manage_brand_agents") || hasPermission("brand_studio", "gerenciar_provedores_ia"),
    [hasPermission]
  );
  const canActivateBrandAddon = useCallback(
    () =>
      hasPermission("brand_studio", "activate_brand_addon") ||
      hasPermission("brand_studio", "ativar_addon") ||
      hasPermission("configuracoes", "ativar_addon"),
    [hasPermission]
  );
  const canViewBrandSensitive = useCallback(
    () =>
      hasPermission("brand_studio", "visualizar_segredo") ||
      hasPermission("brand_studio", "acessar_avancado") ||
      hasPermission("acessos", "visualizar_segredo"),
    [hasPermission]
  );
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
      canViewBrandProject, canCreateBrandProject, canEditBrandProject,
      canRunBrandAgent, canApproveBrandAsset, canGenerateBrandPdf,
      canManageBrandAgents, canActivateBrandAddon, canViewBrandSensitive,
      isDevAdmin, isSuperAdmin, guardAction,
    }),
    [loading, roles, permissions, refresh, hasPermission, canView, canCreate, canEdit,
     canDelete, canExport, canApprove, canActivateAddon, canViewSensitiveData,
     canViewBrandProject, canCreateBrandProject, canEditBrandProject,
     canRunBrandAgent, canApproveBrandAsset, canGenerateBrandPdf,
     canManageBrandAgents, canActivateBrandAddon, canViewBrandSensitive,
     isDevAdmin, isSuperAdmin, guardAction]
  );

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  const ctx = useContext(AccessControlContext);
  if (!ctx) throw new Error("useAccessControl must be used within AccessControlProvider");
  return ctx;
}
