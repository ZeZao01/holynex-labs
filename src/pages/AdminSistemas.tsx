import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { PackageCheck } from "lucide-react";

export default function AdminSistemas() {
  return (
    <div className="space-y-6">
      <PageHeader title="Sistemas Entregues" description="Catálogo interno de todos os projetos entregues" breadcrumbs={[{ label: "Sistemas Entregues" }]} />
      <FilterToolbar searchPlaceholder="Buscar sistema..." />
      <EmptyState icon={<PackageCheck className="h-10 w-10 text-muted-foreground" />} title="Nenhum sistema cadastrado" description="Projetos finalizados serão listados aqui com métricas de reuso e potencial comercial." action={{ label: "Adicionar Sistema", onClick: () => {} }} />
    </div>
  );
}
