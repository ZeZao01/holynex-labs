import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { Blocks } from "lucide-react";

export default function AdminModulos() {
  return (
    <div className="space-y-6">
      <PageHeader title="Módulos por Projeto" description="Gestão modular dos sistemas entregues e em andamento" breadcrumbs={[{ label: "Módulos" }]} />
      <FilterToolbar searchPlaceholder="Buscar módulo..." />
      <EmptyState icon={<Blocks className="h-10 w-10 text-muted-foreground" />} title="Nenhum módulo cadastrado" description="Gerencie autenticação, dashboard, CRM, relatórios, IA e outros módulos por projeto." action={{ label: "Adicionar Módulo", onClick: () => {} }} />
    </div>
  );
}
