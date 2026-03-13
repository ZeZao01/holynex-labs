import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import SectionCard from "@/components/admin/SectionCard";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import { DollarSign, TrendingUp, Repeat, BarChart3 } from "lucide-react";

export default function AdminFinanceiro() {
  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro" description="Receitas, margens e métricas financeiras da agência" breadcrumbs={[{ label: "Financeiro" }]} />
      <StatsGrid columns={4}>
        <StatCard title="Receita Mensal" value="R$ 0" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Margem Média" value="0%" icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Recorrência" value="R$ 0" icon={<Repeat className="h-5 w-5" />} />
        <StatCard title="Ticket Médio" value="R$ 0" icon={<BarChart3 className="h-5 w-5" />} />
      </StatsGrid>
      <EmptyState icon={<DollarSign className="h-10 w-10 text-muted-foreground" />} title="Dados financeiros em breve" description="Conecte projetos e propostas para visualizar métricas financeiras automaticamente." />
    </div>
  );
}
