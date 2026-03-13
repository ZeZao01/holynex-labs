import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { KeyRound } from "lucide-react";

export default function AdminAcessos() {
  return (
    <div className="space-y-6">
      <PageHeader title="Acessos & Admins" description="Central de credenciais e acessos por projeto" breadcrumbs={[{ label: "Acessos" }]} />
      <FilterToolbar searchPlaceholder="Buscar acesso..." />
      <EmptyState icon={<KeyRound className="h-10 w-10 text-muted-foreground" />} title="Nenhum acesso registrado" description="Gerencie URLs de admin, staging, produção e credenciais de cada projeto." action={{ label: "Registrar Acesso", onClick: () => {} }} />
    </div>
  );
}
