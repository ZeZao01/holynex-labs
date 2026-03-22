import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEffectivePermissions, getUserRoleNames, PermissionMatrix } from "@/lib/rbac";
import { logSecurityEvent } from "@/lib/security";

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

  const refresh = async () => {
    if (!user) {
      setRoles([]);
      setPermissions({});
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
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
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const hasPermission = (module: string, action: string) => {
    return !!permissions?.[module]?.[action];
  };

  const canView = (module: string) => {
    const actions = VIEW_OVERRIDES[module] || ["visualizar"];
    return actions.some((action) => hasPermission(module, action));
  };

  const canCreate = (module: string) => hasPermission(module, "criar");
  const canEdit = (module: string) => {
    const actions = EDIT_OVERRIDES[module] || ["editar"];
    return actions.some((action) => hasPermission(module, action));
  };
  const canDelete = (module: string) => hasPermission(module, "excluir");
  const canExport = (module: string) => hasPermission(module, "exportar");
  const canApprove = (module: string) => hasPermission(module, "aprovar");
  const canActivateAddon = () => hasPermission("configuracoes", "ativar_addon");
  const canViewSensitiveData = () => hasPermission("acessos", "visualizar_segredo");

  const guardAction = async (module: string, action: string, opts: GuardOptions = {}) => {
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
  };

  const value = useMemo(
    () => ({
      loading,
      roles,
      permissions,
      refresh,
      hasPermission,
      canView,
      canCreate,
      canEdit,
      canDelete,
      canExport,
      canApprove,
      canActivateAddon,
      canViewSensitiveData,
      guardAction,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, roles, permissions]
  );

  return <AccessControlContext.Provider value={value}>{children}</AccessControlContext.Provider>;
}

export function useAccessControl() {
  const ctx = useContext(AccessControlContext);
  if (!ctx) throw new Error("useAccessControl must be used within AccessControlProvider");
  return ctx;
}
