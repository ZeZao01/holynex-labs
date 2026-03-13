import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { Globe } from "lucide-react";

export default function AdminPortfolioAdmin() {
  return (
    <div className="space-y-6">
      <PageHeader title="Portfólio Público" description="Gerencie a vitrine pública de projetos da agência" breadcrumbs={[{ label: "Portfólio" }]} />
      <FilterToolbar searchPlaceholder="Buscar projeto..." />
      <EmptyState icon={<Globe className="h-10 w-10 text-muted-foreground" />} title="Nenhum projeto no portfólio" description="Adicione projetos ao portfólio público com thumbnails, badges de destaque e CTA para orçamento." action={{ label: "Adicionar ao Portfólio", onClick: () => {} }} />
    </div>
  );
}
