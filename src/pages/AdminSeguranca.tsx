import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { ShieldCheck } from "lucide-react";

export default function AdminSeguranca() {
  return (
    <div className="space-y-6">
      <PageHeader title="Segurança & Auditoria" description="Logs, permissões, auditoria de acessos e RBAC" breadcrumbs={[{ label: "Segurança" }]} />
      <EmptyState icon={<ShieldCheck className="h-10 w-10 text-muted-foreground" />} title="Módulo de segurança em breve" description="RBAC granular, logs append-only, auditoria de acessos e mascaramento de credenciais." />
    </div>
  );
}
