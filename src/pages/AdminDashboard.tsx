import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, FolderKanban, PackageCheck, Wrench, DollarSign,
  ArrowRight, Plus, Loader2, Activity, TrendingUp,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ leads: 0, propostas: 0, projetos: 0, sistemas: 0, solicitacoes: 0, receita: "R$ 0" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    loadStats();
  }, [user, authLoading]);

  const loadStats = async () => {
    setLoading(true);
    const [{ count: leadsCount }, { count: propostasCount }] = await Promise.all([
      supabase.from("orcamentos").select("*", { count: "exact", head: true }),
      supabase.from("propostas").select("*", { count: "exact", head: true }),
    ]);
    setStats({
      leads: leadsCount || 0,
      propostas: propostasCount || 0,
      projetos: 0,
      sistemas: 0,
      solicitacoes: 0,
      receita: "R$ 0",
    });
    setLoading(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const quickActions = [
    { label: "Nova Proposta", icon: Plus, onClick: () => navigate("/admin/propostas/nova") },
    { label: "Ver Leads", icon: Users, onClick: () => navigate("/admin/orcamentos") },
    { label: "Projetos", icon: FolderKanban, onClick: () => navigate("/admin/projetos") },
    { label: "Financeiro", icon: DollarSign, onClick: () => navigate("/admin/financeiro") },
  ];

  const recentActivity = [
    { text: "Módulo disponível em breve", status: "pending", time: "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão executiva da agência"
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <StatsGrid columns={3}>
        <StatCard title="Leads" value={stats.leads} icon={<Users className="h-5 w-5" />} subtitle="Total de orçamentos" />
        <StatCard title="Propostas" value={stats.propostas} icon={<FileText className="h-5 w-5" />} subtitle="Propostas geradas" />
        <StatCard title="Projetos Ativos" value={stats.projetos} icon={<FolderKanban className="h-5 w-5" />} subtitle="Em andamento" />
        <StatCard title="Sistemas Entregues" value={stats.sistemas} icon={<PackageCheck className="h-5 w-5" />} subtitle="Catálogo" />
        <StatCard title="Solicitações" value={stats.solicitacoes} icon={<Wrench className="h-5 w-5" />} subtitle="Manutenção" />
        <StatCard title="Receita Prevista" value={stats.receita} icon={<DollarSign className="h-5 w-5" />} subtitle="Mês atual" />
      </StatsGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Atalhos Rápidos" className="lg:col-span-1">
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((a) => (
              <Button key={a.label} variant="outline" size="sm" className="justify-start gap-2 h-auto py-3" onClick={a.onClick}>
                <a.icon className="h-4 w-4 text-primary" />
                <span className="text-xs">{a.label}</span>
              </Button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Atividade Recente" className="lg:col-span-1" action={<Button variant="ghost" size="sm"><ArrowRight className="h-4 w-4" /></Button>}>
          <div className="space-y-3">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{item.text}</span>
                </div>
                <StatusBadge status={item.status} label="Em breve" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Status Operacional" className="lg:col-span-1" action={<Button variant="ghost" size="sm"><TrendingUp className="h-4 w-4" /></Button>}>
          <div className="space-y-3">
            {[
              { label: "Pipeline Comercial", status: "active", badge: "Ativo" },
              { label: "Geração de PDFs", status: "active", badge: "Ativo" },
              { label: "Gestão de Projetos", status: "pending", badge: "Em breve" },
              { label: "Financeiro", status: "pending", badge: "Em breve" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <StatusBadge status={item.status} label={item.badge} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
