import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import { Settings } from "lucide-react";

export default function AdminConfiguracoes() {
  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Ajustes gerais do sistema e preferências" breadcrumbs={[{ label: "Configurações" }]} />
      <EmptyState icon={<Settings className="h-10 w-10 text-muted-foreground" />} title="Configurações em breve" description="Personalize tema, notificações, integrações e preferências do painel." />
    </div>
  );
}
