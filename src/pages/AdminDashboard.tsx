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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, FileText, FolderKanban, PackageCheck, Wrench, DollarSign,
  Plus, Mail, FilePlus, KeyRound, Globe, Settings, Repeat,
  Sparkles, Clock, Blocks,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    leads: 0, pendentes: 0, propostas: 0, projetos: 0,
    sistemas: 0, solicitacoes: 0, acessos: 0, modulos: 0,
    receita: 0, recorrencia: 0,
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
    try {
      const [
        { count: leadsCount },
        { count: pendentesCount },
        { count: propostasCount },
        { count: projetosCount },
        { count: sistemasCount },
        { count: solicitacoesCount },
        { count: acessosCount },
        { count: modulosCount },
        { data: leadsData },
        { data: propostasData },
        { data: systemsData },
      ] = await Promise.all([
        supabase.from("orcamentos").select("*", { count: "exact", head: true }),
        supabase.from("orcamentos").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("propostas").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("delivered_systems").select("*", { count: "exact", head: true }),
        supabase.from("project_changes").select("*", { count: "exact", head: true }).in("status", ["aberta", "em_andamento", "aguardando_aprovacao"]),
        supabase.from("project_accesses").select("*", { count: "exact", head: true }),
        supabase.from("project_modules").select("*", { count: "exact", head: true }),
        supabase.from("orcamentos").select("nome, status, empresa").order("criado_em", { ascending: false }).limit(5),
        supabase.from("propostas").select("nome_cliente, status, tipo_projeto").order("criado_em", { ascending: false }).limit(5),
        supabase.from("delivered_systems").select("valor_fechado, recorrencia_mensal"),
      ]);

      const receita = (systemsData || []).reduce((a, s) => a + (Number(s.valor_fechado) || 0), 0);
      const recorrencia = (systemsData || []).reduce((a, s) => a + (Number(s.recorrencia_mensal) || 0), 0);

      setStats({
        leads: leadsCount || 0,
        pendentes: pendentesCount || 0,
        propostas: propostasCount || 0,
        projetos: projetosCount || 0,
        sistemas: sistemasCount || 0,
        solicitacoes: solicitacoesCount || 0,
        acessos: acessosCount || 0,
        modulos: modulosCount || 0,
        receita,
        recorrencia,
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
    } catch (err) {
      console.error("Dashboard load error:", err);
    }
    setLoading(false);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center h-64"><Skeleton className="h-6 w-6 rounded-full" /></div>;
  }

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;

  const pipelineStages = [
    { label: "Novo Lead", count: stats.pendentes },
    { label: "Qualificado", count: 0 },
    { label: "Proposta", count: stats.propostas },
    { label: "Aceita", count: 0 },
    { label: "Em Execução", count: stats.projetos },
    { label: "Entregue", count: stats.sistemas },
    { label: "Manutenção", count: stats.solicitacoes },
  ];

  const recentActivity: ActivityItem[] = [
    { icon: <Mail className="h-3.5 w-3.5" />, text: `${stats.leads} leads recebidos`, time: "Total", status: "active", statusLabel: "Ativo" },
    { icon: <FileText className="h-3.5 w-3.5" />, text: `${stats.propostas} propostas geradas`, time: "Total", status: "active", statusLabel: "Ativo" },
    { icon: <FolderKanban className="h-3.5 w-3.5" />, text: `${stats.projetos} projetos em andamento`, time: "Atual", status: stats.projetos > 0 ? "active" : "pending", statusLabel: stats.projetos > 0 ? "Ativo" : "Vazio" },
    { icon: <PackageCheck className="h-3.5 w-3.5" />, text: `${stats.sistemas} sistemas entregues`, time: "Catálogo", status: stats.sistemas > 0 ? "delivered" : "pending", statusLabel: stats.sistemas > 0 ? "Entregue" : "Vazio" },
    { icon: <Sparkles className="h-3.5 w-3.5" />, text: "Geração de PDF com IA ativa", time: "Online", status: "active", statusLabel: "Online" },
  ];

  const alerts: AlertItem[] = [
    ...(stats.pendentes > 0 ? [{ type: "warning" as const, text: `${stats.pendentes} lead(s) pendente(s) aguardando análise`, action: "Ver leads" }] : []),
    ...(stats.solicitacoes > 0 ? [{ type: "warning" as const, text: `${stats.solicitacoes} solicitação(ões) de manutenção aberta(s)`, action: "Ver solicitações" }] : []),
  ];

  const operationalStatus: OperationalItem[] = [
    { label: "Leads & Orçamentos", status: "ok" },
    { label: "Propostas & PDFs", status: "ok" },
    { label: "Projetos", status: stats.projetos > 0 ? "ok" : "pending" },
    { label: "Sistemas Entregues", status: stats.sistemas > 0 ? "ok" : "pending" },
    { label: "Acessos & Credenciais", status: stats.acessos > 0 ? "ok" : "pending" },
    { label: "Módulos", status: stats.modulos > 0 ? "ok" : "pending" },
    { label: "Manutenção", status: "ok" },
    { label: "Portfólio Público", status: "ok" },
    { label: "Financeiro", status: "ok" },
    { label: "Segurança & Auditoria", status: "ok" },
  ];

  const quickActions = [
    { label: "Novo Lead", icon: <Mail className="h-4 w-4" />, onClick: () => navigate("/contato") },
    { label: "Nova Proposta", icon: <FilePlus className="h-4 w-4" />, onClick: () => navigate("/admin/propostas/nova") },
    { label: "Novo Projeto", icon: <FolderKanban className="h-4 w-4" />, onClick: () => navigate("/admin/projetos") },
    { label: "Novo Sistema", icon: <PackageCheck className="h-4 w-4" />, onClick: () => navigate("/admin/sistemas") },
    { label: "Novo Acesso", icon: <KeyRound className="h-4 w-4" />, onClick: () => navigate("/admin/acessos") },
    { label: "Nova Solicitação", icon: <Wrench className="h-4 w-4" />, onClick: () => navigate("/admin/manutencao") },
    { label: "Portfólio", icon: <Globe className="h-4 w-4" />, onClick: () => navigate("/admin/portfolio-admin") },
    { label: "Configurações", icon: <Settings className="h-4 w-4" />, onClick: () => navigate("/admin/configuracoes") },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      </div>
    );
  }

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

      {/* KPIs */}
      <StatsGrid columns={4}>
        <StatCard title="Leads" value={stats.leads} icon={<Users className="h-5 w-5" />} subtitle={`${stats.pendentes} pendente(s)`} />
        <StatCard title="Propostas" value={stats.propostas} icon={<FileText className="h-5 w-5" />} subtitle="Geradas" />
        <StatCard title="Projetos" value={stats.projetos} icon={<FolderKanban className="h-5 w-5" />} subtitle="Em andamento" />
        <StatCard title="Sistemas" value={stats.sistemas} icon={<PackageCheck className="h-5 w-5" />} subtitle="Entregues" />
        <StatCard title="Manutenção" value={stats.solicitacoes} icon={<Wrench className="h-5 w-5" />} subtitle="Solicitações abertas" />
        <StatCard title="Módulos" value={stats.modulos} icon={<Blocks className="h-5 w-5" />} subtitle="Cadastrados" />
        <StatCard title="Receita Total" value={fmt(stats.receita)} icon={<DollarSign className="h-5 w-5" />} subtitle="Valor fechado" />
        <StatCard title="Recorrência" value={fmt(stats.recorrencia)} icon={<Repeat className="h-5 w-5" />} subtitle="Mensal estimada" />
      </StatsGrid>

      {/* Pipeline */}
      <SectionCard title="Pipeline Operacional">
        <PipelineStages stages={pipelineStages} />
      </SectionCard>

      {/* Atalhos */}
      <SectionCard title="Atalhos Rápidos">
        <QuickActionsGrid actions={quickActions} />
      </SectionCard>

      {/* Alertas */}
      {alerts.length > 0 && (
        <SectionCard title="Alertas">
          <AlertList items={alerts} />
        </SectionCard>
      )}

      {/* Grid inferior */}
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
    </div>
  );
}
