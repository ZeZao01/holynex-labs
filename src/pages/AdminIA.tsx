import PageHeader from "@/components/admin/PageHeader";
import EmptyState from "@/components/admin/EmptyState";
import SectionCard from "@/components/admin/SectionCard";
import { Button } from "@/components/ui/button";
import { Sparkles, Brain, Zap, MessageSquare } from "lucide-react";
import StatsGrid from "@/components/admin/StatsGrid";
import StatCard from "@/components/admin/StatCard";

export default function AdminIA() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="IA Assistiva"
        description="Inteligência artificial integrada para geração de propostas, análises e automações"
        breadcrumbs={[{ label: "IA Assistiva" }]}
      />

      <StatsGrid columns={4}>
        <StatCard title="Propostas Geradas" value={0} icon={<Sparkles className="h-5 w-5" />} subtitle="Via IA" />
        <StatCard title="Análises" value={0} icon={<Brain className="h-5 w-5" />} subtitle="Realizadas" />
        <StatCard title="Automações" value={0} icon={<Zap className="h-5 w-5" />} subtitle="Ativas" />
        <StatCard title="Interações" value={0} icon={<MessageSquare className="h-5 w-5" />} subtitle="Este mês" />
      </StatsGrid>

      <SectionCard title="Assistente IA">
        <EmptyState
          icon={<Sparkles className="h-10 w-10 text-muted-foreground" />}
          title="IA Assistiva em preparação"
          description="Módulo de inteligência artificial para geração de conteúdo, diagnósticos automáticos e análises preditivas. Disponível nas próximas fases."
        />
      </SectionCard>
    </div>
  );
}
