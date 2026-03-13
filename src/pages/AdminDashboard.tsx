import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PageHeader from "@/components/admin/PageHeader";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import SectionCard from "@/components/admin/SectionCard";
import PipelineStages from "@/components/admin/PipelineStages";
import RecentActivityList, { type ActivityItem } from "@/components/admin/RecentActivityList";
import AlertList, { type AlertItem } from "@/components/admin/AlertList";
import OperationalStatusPanel, { type OperationalItem } from "@/components/admin/OperationalStatusPanel";
import QuickActionsGrid from "@/components/admin/QuickActionsGrid";
import MiniModuleTable, { type MiniModuleItem } from "@/components/admin/MiniModuleTable";
import { Button } from "@/components/ui/button";
import {
  Users, FileText, FolderKanban, PackageCheck, Wrench, DollarSign,
  Plus, Loader2, Mail, FilePlus, KeyRound, Globe, Settings, Repeat,
  FileBarChart, Sparkles, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    leads: 0, pendentes: 0, propostas: 0, projetos: 0,
    sistemas: 0, solicitacoes: 0, receita: "R$ 0", recorrencia: "R$ 0",
  });
  const [recentLeads, setRecentLeads] = useState<MiniModuleItem[]>([]);
  const [recentPropostas, setRecentPropostas] = useState<MiniModuleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    const [
      { count: leadsCount },
      { count: pendentesCount },
      { count: propostasCount },
      { data: leadsData },
      { data: propostasData },
    ] = await Promise.all([
      supabase.from("orcamentos").select("*", { count: "exact", head: true }),
      supabase.from("orcamentos").select("*", { count: "exact", head: true }).eq("status", "pendente"),
      supabase.from("propostas").select("*", { count: "exact", head: true }),
      supabase.from("orcamentos").select("nome, status, empresa").order("criado_em", { ascending: false }).limit(4),
      supabase.from("propostas").select("nome_cliente, status, tipo_projeto").order("criado_em", { ascending: false }).limit(4),
    ]);

    setStats({
      leads: leadsCount || 0,
      pendentes: pendentesCount || 0,
      propostas: propostasCount || 0,
      projetos: 0, sistemas: 0, solicitacoes: 0,
      receita: "R$ 0", recorrencia: "R$ 0",
    });

    const statusMap: Record<string, string> = { pendente: "pending", recebido: "active", rejeitado: "cancelled", rascunho: "pending", enviada: "active", aceita: "delivered" };
    const labelMap: Record<string, string> = { pendente: "Pendente", recebido: "Recebido", rejeitado: "Rejeitado", rascunho: "Rascunho", enviada: "Enviada", aceita: "Aceita" };

    setRecentLeads((leadsData || []).map(l => ({
      label: l.nome,
      subtitle: l.empresa || "—",
      status: statusMap[l.status] || "pending",
      statusLabel: labelMap[l.status] || l.status,
    })));

    setRecentPropostas((propostasData || []).map(p => ({
      label: p.nome_cliente,
      subtitle: p.tipo_projeto,
      status: statusMap[p.status] || "pending",
      statusLabel: labelMap[p.status] || p.status,
    })));

    setLoading(false);
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const pipelineStages = [
    { label: "Novo Lead", count: stats.pendentes },
    { label: "Qualificado", count: 0 },
    { label: "Proposta Enviada", count: stats.propostas },
    { label: "Aceita", count: 0 },
    { label: "Em Execução", count: stats.projetos },
    { label: "Validação", count: 0 },
    { label: "Entregue", count: stats.sistemas },
    { label: "Manutenção", count: stats.solicitacoes },
  ];

  const recentActivity: ActivityItem[] = [
    { icon: <Mail className="h-3.5 w-3.5" />, text: `${stats.leads} orçamentos recebidos no total`, time: "Histórico", status: "active", statusLabel: "Ativo" },
    { icon: <FileBarChart className="h-3.5 w-3.5" />, text: `${stats.propostas} propostas geradas`, time: "Histórico", status: "active", statusLabel: "Ativo" },
    { icon: <Sparkles className="h-3.5 w-3.5" />, text: "Geração de PDF com IA ativa", time: "Sistema", status: "active", statusLabel: "Online" },
    { icon: <FolderKanban className="h-3.5 w-3.5" />, text: "Gestão de projetos disponível em breve", time: "Próxima fase" },
  ];

  const alerts: AlertItem[] = [
    ...(stats.pendentes > 0 ? [{ type: "warning" as const, text: `${stats.pendentes} orçamento(s) pendente(s) de análise`, action: "Ver leads" }] : []),
    { type: "info" as const, text: "Módulos de projetos, acessos e manutenção em construção" },
    { type: "info" as const, text: "Financeiro será habilitado após cadastro de projetos" },
  ];

  const operationalStatus: OperationalItem[] = [
    { label: "Comercial (Leads & Propostas)", status: "ok" },
    { label: "Geração de PDFs", status: "ok" },
    { label: "Gestão de Projetos", status: "pending" },
    { label: "Acessos & Credenciais", status: "pending" },
    { label: "Manutenção & Suporte", status: "pending" },
    { label: "Financeiro", status: "pending" },
    { label: "Segurança & Auditoria", status: "pending" },
  ];

  const quickActions = [
    { label: "Novo Orçamento", icon: <Mail className="h-4 w-4" />, onClick: () => navigate("/contato") },
    { label: "Nova Proposta", icon: <FilePlus className="h-4 w-4" />, onClick: () => navigate("/admin/propostas/nova") },
    { label: "Novo Projeto", icon: <FolderKanban className="h-4 w-4" />, onClick: () => navigate("/admin/projetos") },
    { label: "Novo Sistema", icon: <PackageCheck className="h-4 w-4" />, onClick: () => navigate("/admin/sistemas") },
    { label: "Novo Acesso", icon: <KeyRound className="h-4 w-4" />, onClick: () => navigate("/admin/acessos") },
    { label: "Nova Solicitação", icon: <Wrench className="h-4 w-4" />, onClick: () => navigate("/admin/manutencao") },
    { label: "Ver Portfólio", icon: <Globe className="h-4 w-4" />, onClick: () => navigate("/admin/portfolio-admin") },
    { label: "Configurações", icon: <Settings className="h-4 w-4" />, onClick: () => navigate("/admin/configuracoes") },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Executivo"
        description="Visão geral da operação — leads, projetos, entregas e saúde da agência"
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <Button size="sm" onClick={() => navigate("/admin/propostas/nova")}>
            <Plus className="h-4 w-4 mr-1" /> Nova Proposta
          </Button>
        }
      />

      {/* Métricas principais */}
      <StatsGrid columns={4}>
        <StatCard title="Leads Recebidos" value={stats.leads} icon={<Users className="h-5 w-5" />} subtitle="Total" />
        <StatCard title="Orçamentos Pendentes" value={stats.pendentes} icon={<Clock className="h-5 w-5" />} subtitle="Aguardando análise" />
        <StatCard title="Propostas Enviadas" value={stats.propostas} icon={<FileText className="h-5 w-5" />} subtitle="Geradas" />
        <StatCard title="Projetos Ativos" value={stats.projetos} icon={<FolderKanban className="h-5 w-5" />} subtitle="Em andamento" />
        <StatCard title="Sistemas Entregues" value={stats.sistemas} icon={<PackageCheck className="h-5 w-5" />} subtitle="Catálogo" />
        <StatCard title="Solicitações Abertas" value={stats.solicitacoes} icon={<Wrench className="h-5 w-5" />} subtitle="Manutenção" />
        <StatCard title="Receita Prevista" value={stats.receita} icon={<DollarSign className="h-5 w-5" />} subtitle="Mês atual" />
        <StatCard title="Receita Recorrente" value={stats.recorrencia} icon={<Repeat className="h-5 w-5" />} subtitle="Estimada" />
      </StatsGrid>

      {/* Pipeline */}
      <SectionCard title="Pipeline Operacional">
        <PipelineStages stages={pipelineStages} />
      </SectionCard>

      {/* Atalhos rápidos */}
      <SectionCard title="Atalhos Rápidos">
        <QuickActionsGrid actions={quickActions} />
      </SectionCard>

      {/* Alertas */}
      {alerts.length > 0 && (
        <SectionCard title="Alertas Operacionais">
          <AlertList items={alerts} />
        </SectionCard>
      )}

      {/* Grid inferior: Atividade + Status + Módulos resumidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Atividade Recente">
          <RecentActivityList items={recentActivity} />
        </SectionCard>

        <SectionCard title="Saúde Operacional">
          <OperationalStatusPanel items={operationalStatus} />
        </SectionCard>

        <div className="space-y-4">
          <SectionCard title="Leads Recentes">
            <MiniModuleTable items={recentLeads} onViewAll={() => navigate("/admin/orcamentos")} />
          </SectionCard>

          <SectionCard title="Propostas Recentes">
            <MiniModuleTable items={recentPropostas} onViewAll={() => navigate("/admin/propostas")} />
          </SectionCard>
        </div>
      </div>

      {/* Placeholders futuros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Ranking de Nichos", desc: "Nichos com maior demanda" },
          { title: "Projetos Mais Rentáveis", desc: "Maior margem e retorno" },
          { title: "Modelos Mais Vendidos", desc: "Templates com maior conversão" },
        ].map((p, i) => (
          <SectionCard key={i} title={p.title}>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Sparkles className="h-6 w-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">{p.desc}</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">Disponível nas próximas fases</p>
            </div>
          </SectionCard>
        ))}
      </div>
    </div>
  );
}
