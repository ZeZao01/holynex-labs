import { ReactNode, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAccessControl } from "@/hooks/useAccessControl";
import { logSecurityEvent } from "@/lib/security";
import AccessDenied from "@/components/admin/AccessDenied";

interface AdminRouteGuardProps {
  module: string;
  action?: "visualizar" | "criar" | "editar" | "excluir" | "exportar" | "aprovar" | string;
  children: ReactNode;
}

export default function AdminRouteGuard({ module, action, children }: AdminRouteGuardProps) {
  const { user } = useAuth();
  const { loading, canView, canCreate, canEdit, canDelete, canExport, canApprove, hasPermission } = useAccessControl();
  const loggedRef = useRef(false);

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const allowed = (() => {
    if (!action || action === "visualizar") return canView(module);
    if (action === "criar") return canCreate(module);
    if (action === "editar") return canEdit(module);
    if (action === "excluir") return canDelete(module);
    if (action === "exportar") return canExport(module);
    if (action === "aprovar") return canApprove(module);
    return hasPermission(module, action);
  })();

  useEffect(() => {
    if (!allowed && !loggedRef.current) {
      loggedRef.current = true;
      logSecurityEvent(
        "acesso_negado",
        "medium",
        `Tentativa de acesso negado: ${module}.${action || "visualizar"}`,
        { source: "route_guard", entityType: "route", entityId: module, metadata: { module, action } }
      );
    }
  }, [allowed, module, action]);

  if (!allowed) return <AccessDenied />;

  return <>{children}</>;
}
