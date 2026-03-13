import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { Wrench } from "lucide-react";

export default function AdminManutencao() {
  return (
    <div className="space-y-6">
      <PageHeader title="Alterações & Manutenção" description="Solicitações de correção, melhoria e novos módulos" breadcrumbs={[{ label: "Manutenção" }]} />
      <FilterToolbar searchPlaceholder="Buscar solicitação..." />
      <EmptyState icon={<Wrench className="h-10 w-10 text-muted-foreground" />} title="Nenhuma solicitação aberta" description="Registre correções, melhorias, novos módulos e integrações com controle de urgência e custo." action={{ label: "Nova Solicitação", onClick: () => {} }} />
    </div>
  );
}
