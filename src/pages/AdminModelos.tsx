import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { LayoutTemplate } from "lucide-react";

export default function AdminModelos() {
  return (
    <div className="space-y-6">
      <PageHeader title="Projetos Modelo" description="Biblioteca de sistemas modelo para venda e reuso" breadcrumbs={[{ label: "Modelos" }]} />
      <FilterToolbar searchPlaceholder="Buscar modelo..." />
      <EmptyState icon={<LayoutTemplate className="h-10 w-10 text-muted-foreground" />} title="Nenhum modelo cadastrado" description="Crie modelos como CRM, ERP, portal do cliente, agendamento, SaaS vertical e mais." action={{ label: "Criar Modelo", onClick: () => {} }} />
    </div>
  );
}
