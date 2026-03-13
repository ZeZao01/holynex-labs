import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { FolderKanban } from "lucide-react";

export default function AdminProjetos() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos em Andamento"
        description="Gestão completa dos projetos ativos da agência"
        breadcrumbs={[{ label: "Projetos" }]}
      />
      <FilterToolbar searchPlaceholder="Buscar projeto..." />
      <EmptyState
        icon={<FolderKanban className="h-10 w-10 text-muted-foreground" />}
        title="Nenhum projeto cadastrado"
        description="Quando você converter uma proposta em projeto, ele aparecerá aqui com toda a gestão."
        action={{ label: "Criar Projeto", onClick: () => {} }}
      />
    </div>
  );
}
