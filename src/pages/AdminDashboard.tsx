import { useState, useEffect, useCallback } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
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
import EmptyState from "@/components/admin/EmptyState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Users, FileText, FolderKanban, PackageCheck, Wrench, DollarSign,
  Plus, Mail, FilePlus, KeyRound, Globe, Settings, Repeat,
  Sparkles, Blocks, TrendingUp, BarChart3, Brain, Target,
} from "lucide-react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    leads: 0, pendentes: 0, propostas: 0, propostasEnviadas: 0,
    propostasSemEnvio: 0, propostasAceitas: 0,
    projetos: 0, projetosAtivos: 0, projetosPausados: 0, projetosValidacao: 0,
    sistemas: 0, sistemasSemLink: 0,
    solicitacoes: 0, solicitacoesPendentes: 0,
    acessos: 0, modulos: 0,
    receita: 0, recorrencia: 0,
    pdfsGerados: 0,
  });
  const [recentLeads, setRecentLeads] = useState<MiniModuleItem[]>([]);
  const [recentPropostas, setRecentPropostas] = useState<MiniModuleItem[]>([]);
  const [recentProjetos, setRecentProjetos] = useState<MiniModuleItem[]>([]);
  const [recentSistemas, setRecentSistemas] = useState<MiniModuleItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDataCb = useCallback(() => { loadData(); }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/admin/login"); return; }
    loadData();
  }, [user, authLoading]);

  useRealtimeSubscription("orcamentos", loadDataCb, !!user);
  useRealtimeSubscription("propostas", loadDataCb, !!user);
  useRealtimeSubscription("projects", loadDataCb, !!user);
  useRealtimeSubscription("delivered_systems", loadDataCb, !!user);
  useRealtimeSubscription("project_changes", loadDataCb, !!user);

  const loadData = async () => {
    setLoading(true);
    try {
      const [
        { count: leadsCount },
        { count: pendentesCount },
        { count: propostasCount },
        { count: propostasEnviadasCount },
        { count: propostasSemEnvioCount },
        { count: propostasAceitasCount },
        { count: projetosCount },
        { count: projetosAtivosCount },
        { count: projetosPausadosCount },
        { count: projetosValidacaoCount },
        { count: sistemasCount },
        { count: sistemasSemLinkCount },
        { count: solicitacoesCount },
        { count: solicitacoesPendentesCount },
        { count: acessosCount },
        { count: modulosCount },
        { count: pdfsCount },
        { data: leadsData },
        { data: propostasData },
        { data: projetosData },
        { data: sistemasData },
        { data: systemsFinancial },
        { data: auditData },
      ] = await Promise.all([
        supabase.from("orcamentos").select("*", { count: "exact", head: true }),
        supabase.from("orcamentos").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("propostas").select("*", { count: "exact", head: true }),
        supabase.from("propostas").select("*", { count: "exact", head: true }).eq("status", "enviada"),
        supabase.from("propostas").select("*", { count: "exact", head: true }).eq("status", "rascunho"),
        supabase.from("propostas").select("*", { count: "exact", head: true }).eq("status", "aceita"),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }).in("status", ["em_andamento", "planejamento"]),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "pausado"),
        supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "validacao"),
        supabase.from("delivered_systems").select("*", { count: "exact", head: true }),
        supabase.from("delivered_systems").select("*", { count: "exact", head: true }).or("live_url.is.null,live_url.eq."),
        supabase.from("project_changes").select("*", { count: "exact", head: true }).in("status", ["aberta", "em_andamento", "aguardando_aprovacao"]),
        supabase.from("project_changes").select("*", { count: "exact", head: true }).eq("status", "aberta"),
        supabase.from("project_accesses").select("*", { count: "exact", head: true }),
        supabase.from("project_modules").select("*", { count: "exact", head: true }),
        supabase.from("pdf_versoes").select("*", { count: "exact", head: true }),
        supabase.from("orcamentos").select("nome, status, empresa, criado_em").order("criado_em", { ascending: false }).limit(5),
        supabase.from("propostas").select("nome_cliente, status, tipo_projeto, criado_em").order("criado_em", { ascending: false }).limit(5),
        supabase.from("projects").select("nome, status, cliente, criado_em, progresso").order("criado_em", { ascending: false }).limit(5),
        supabase.from("delivered_systems").select("nome, cliente, status_operacional, criado_em").order("criado_em", { ascending: false }).limit(5),
        supabase.from("delivered_systems").select("valor_fechado, recorrencia_mensal"),
        supabase.from("audit_logs").select("action, entity_type, user_email, criado_em, details").order("criado_em", { ascending: false }).limit(10),
      ]);

      const receita = (systemsFinancial || []).reduce((a, s) => a + (Number(s.valor_fechado) || 0), 0);
      const recorrencia = (systemsFinancial || []).reduce((a, s) => a + (Number(s.recorrencia_mensal) || 0), 0);

      setStats({
        leads: leadsCount || 0,
        pendentes: pendentesCount || 0,
        propostas: propostasCount || 0,
        propostasEnviadas: propostasEnviadasCount || 0,
        propostasSemEnvio: propostasSemEnvioCount || 0,
        propostasAceitas: propostasAceitasCount || 0,
        projetos: projetosCount || 0,
        projetosAtivos: projetosAtivosCount || 0,
        projetosPausados: projetosPausadosCount || 0,
        projetosValidacao: projetosValidacaoCount || 0,
        sistemas: sistemasCount || 0,
        sistemasSemLink: sistemasSemLinkCount || 0,
        solicitacoes: solicitacoesCount || 0,
        solicitacoesPendentes: solicitacoesPendentesCount || 0,
        acessos: acessosCount || 0,
        modulos: modulosCount || 0,
        receita,
        recorrencia,
        pdfsGerados: pdfsCount || 0,
      });

      const statusMap: Record<string, string> = {
        pendente: "pending", recebido: "active", rejeitado: "cancelled",
        rascunho: "pending", enviada: "active", aceita: "delivered",
        planejamento: "pending", em_andamento: "active", pausado: "paused",
        concluido: "delivered", cancelado: "cancelled", validacao: "maintenance",
        em_uso: "active", desativado: "paused",
      };
      const labelMap: Record<string, string> = {
        pendente: "Pendente", recebido: "Recebido", rejeitado: "Rejeitado",
        rascunho: "Rascunho", enviada: "Enviada", aceita: "Aceita",
        planejamento: "Planejamento", em_andamento: "Em Andamento", pausado: "Pausado",
        concluido: "Concluído", cancelado: "Cancelado", validacao: "Validação",
        em_uso: "Em Uso", desativado: "Desativado",
      };

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

      setRecentProjetos((projetosData || []).map(p => ({
        label: p.nome,
        subtitle: `${p.cliente} · ${p.progresso || 0}%`,
        status: statusMap[p.status] || "pending",
        statusLabel: labelMap[p.status] || p.status,
      })));

      setRecentSistemas((sistemasData || []).map(s => ({
        label: s.nome,
        subtitle: s.cliente,
        status: statusMap[s.status_operacional || ""] || "active",
        statusLabel: labelMap[s.status_operacional || ""] || s.status_operacional || "Ativo",
      })));

      // Build real activity from audit logs
      const actionIcons: Record<string, React.ReactNode> = {
        create: <FilePlus className="h-3.5 w-3.5" />,
        update: <FileText className="h-3.5 w-3.5" />,
        delete: <Wrench className="h-3.5 w-3.5" />,
        login: <KeyRound className="h-3.5 w-3.5" />,
        export: <FileText className="h-3.5 w-3.5" />,
      };
      const actionLabels: Record<string, string> = {
        create: "criou", update: "atualizou", delete: "removeu", login: "fez login", export: "exportou",
      };
      const entityLabels: Record<string, string> = {
        orcamento: "orçamento", proposta: "proposta", project: "projeto",
        delivered_system: "sistema", project_change: "solicitação",
        pdf_versao: "PDF", project_access: "acesso", project_module: "módulo",
      };

      const activityFromAudit: ActivityItem[] = (auditData || []).map(a => ({
        icon: actionIcons[a.action] || <FileText className="h-3.5 w-3.5" />,
        text: `${a.user_email?.split("@")[0] || "Sistema"} ${actionLabels[a.action] || a.action} ${entityLabels[a.entity_type] || a.entity_type}`,
        time: new Date(a.criado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
        status: "active" as const,
        statusLabel: "",
      }));

      // Fallback if no audit logs
      if (activityFromAudit.length === 0) {
        setRecentActivity([
          { icon: <Mail className="h-3.5 w-3.5" />, text: `${leadsCount || 0} leads recebidos`, time: "Total", status: "active", statusLabel: "Ativo" },
          { icon: <FileText className="h-3.5 w-3.5" />, text: `${propostasCount || 0} propostas geradas`, time: "Total", status: "active", statusLabel: "Ativo" },
          { icon: <FolderKanban className="h-3.5 w-3.5" />, text: `${projetosCount || 0} projetos cadastrados`, time: "Atual", status: (projetosCount || 0) > 0 ? "active" : "pending", statusLabel: "" },
          { icon: <PackageCheck className="h-3.5 w-3.5" />, text: `${sistemasCount || 0} sistemas entregues`, time: "Catálogo", status: (sistemasCount || 0) > 0 ? "delivered" : "pending", statusLabel: "" },
          { icon: <Sparkles className="h-3.5 w-3.5" />, text: `${pdfsCount || 0} PDFs gerados`, time: "Total", status: "active", statusLabel: "" },
        ]);
      } else {
        setRecentActivity(activityFromAudit);
      }
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
    { label: "Qualificado", count: stats.leads - stats.pendentes },
    { label: "Proposta Enviada", count: stats.propostasEnviadas },
    { label: "Proposta Aceita", count: stats.propostasAceitas },
    { label: "Em Execução", count: stats.projetosAtivos },
    { label: "Em Validação", count: stats.projetosValidacao },
    { label: "Entregue", count: stats.sistemas },
    { label: "Manutenção", count: stats.solicitacoes },
  ];

  const alerts: AlertItem[] = [
    ...(stats.pendentes > 0 ? [{ type: "warning" as const, text: `${stats.pendentes} lead(s) pendente(s) aguardando análise`, action: "Ver leads" }] : []),
    ...(stats.propostasSemEnvio > 0 ? [{ type: "warning" as const, text: `${stats.propostasSemEnvio} proposta(s) em rascunho sem envio`, action: "Ver propostas" }] : []),
    ...(stats.projetosPausados > 0 ? [{ type: "danger" as const, text: `${stats.projetosPausados} projeto(s) pausado(s)`, action: "Ver projetos" }] : []),
    ...(stats.solicitacoesPendentes > 0 ? [{ type: "warning" as const, text: `${stats.solicitacoesPendentes} solicitação(ões) pendente(s)`, action: "Ver solicitações" }] : []),
    ...(stats.sistemasSemLink > 0 ? [{ type: "info" as const, text: `${stats.sistemasSemLink} sistema(s) sem link de produção configurado`, action: "Ver sistemas" }] : []),
    ...(stats.acessos === 0 ? [{ type: "info" as const, text: "Nenhum acesso/credencial cadastrado ainda", action: "Cadastrar" }] : []),
  ];

  const operationalStatus: OperationalItem[] = [
    { label: "Comercial", status: stats.leads > 0 ? "ok" : "pending", detail: `${stats.leads} leads · ${stats.propostas} propostas` },
    { label: "Execução", status: stats.projetosAtivos > 0 ? "ok" : "pending", detail: `${stats.projetosAtivos} ativos · ${stats.projetosPausados} pausados` },
    { label: "Entregas", status: stats.sistemas > 0 ? "ok" : "pending", detail: `${stats.sistemas} sistemas entregues` },
    { label: "Manutenção", status: stats.solicitacoesPendentes > 0 ? "warning" : "ok", detail: `${stats.solicitacoes} solicitações abertas` },
    { label: "Documentos", status: stats.pdfsGerados > 0 ? "ok" : "pending", detail: `${stats.pdfsGerados} PDFs gerados` },
    { label: "Credenciais", status: stats.acessos > 0 ? "ok" : "pending", detail: `${stats.acessos} acessos cadastrados` },
    { label: "Módulos", status: stats.modulos > 0 ? "ok" : "pending", detail: `${stats.modulos} módulos ativos` },
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/orcamentos")}>
              <Users className="h-4 w-4 mr-1" /> Leads
            </Button>
            <Button size="sm" onClick={() => navigate("/admin/propostas/nova")}>
              <Plus className="h-4 w-4 mr-1" /> Nova Proposta
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <StatsGrid columns={4}>
        <StatCard title="Leads" value={stats.leads} icon={<Users className="h-5 w-5" />} subtitle={`${stats.pendentes} pendente(s)`} onClick={() => navigate("/admin/orcamentos")} />
        <StatCard title="Propostas" value={stats.propostas} icon={<FileText className="h-5 w-5" />} subtitle={`${stats.propostasEnviadas} enviada(s)`} onClick={() => navigate("/admin/propostas")} />
        <StatCard title="Projetos" value={stats.projetos} icon={<FolderKanban className="h-5 w-5" />} subtitle={`${stats.projetosAtivos} ativo(s)`} onClick={() => navigate("/admin/projetos")} />
        <StatCard title="Sistemas" value={stats.sistemas} icon={<PackageCheck className="h-5 w-5" />} subtitle="Entregues" onClick={() => navigate("/admin/sistemas")} />
        <StatCard title="Solicitações" value={stats.solicitacoes} icon={<Wrench className="h-5 w-5" />} subtitle={`${stats.solicitacoesPendentes} pendente(s)`} onClick={() => navigate("/admin/manutencao")} />
        <StatCard title="Módulos" value={stats.modulos} icon={<Blocks className="h-5 w-5" />} subtitle="Cadastrados" onClick={() => navigate("/admin/modulos")} />
        <StatCard title="Receita Total" value={fmt(stats.receita)} icon={<DollarSign className="h-5 w-5" />} subtitle="Valor fechado" onClick={() => navigate("/admin/financeiro")} />
        <StatCard title="Recorrência" value={fmt(stats.recorrencia)} icon={<Repeat className="h-5 w-5" />} subtitle="Mensal estimada" onClick={() => navigate("/admin/financeiro")} />
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
        <SectionCard title="Alertas Operacionais">
          <AlertList items={alerts} />
        </SectionCard>
      )}

      {/* Grid: Activity + Status + Recentes */}
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

      {/* Grid: Projetos + Sistemas recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Projetos em Andamento">
          {recentProjetos.length > 0 ? (
            <MiniModuleTable items={recentProjetos} onViewAll={() => navigate("/admin/projetos")} />
          ) : (
            <EmptyState compact title="Nenhum projeto" description="Crie um projeto para acompanhar aqui." icon={<FolderKanban className="h-8 w-8 text-muted-foreground" />} />
          )}
        </SectionCard>
        <SectionCard title="Sistemas Entregues Recentes">
          {recentSistemas.length > 0 ? (
            <MiniModuleTable items={recentSistemas} onViewAll={() => navigate("/admin/sistemas")} />
          ) : (
            <EmptyState compact title="Nenhum sistema" description="Registre sistemas entregues para vê-los aqui." icon={<PackageCheck className="h-8 w-8 text-muted-foreground" />} />
          )}
        </SectionCard>
      </div>

      {/* Placeholders IA — futura inteligência */}
      <SectionCard title="Inteligência & Insights">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: <BarChart3 className="h-5 w-5" />, label: "Ranking de Nichos" },
            { icon: <TrendingUp className="h-5 w-5" />, label: "Projetos Rentáveis" },
            { icon: <Target className="h-5 w-5" />, label: "Modelos Populares" },
            { icon: <Brain className="h-5 w-5" />, label: "Score de Demanda" },
            { icon: <Sparkles className="h-5 w-5" />, label: "Score de Retorno" },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/40 bg-card/30 text-center">
              <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">{item.icon}</div>
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
              <Badge variant="outline" className="text-[9px] border-border/50 text-muted-foreground/60">Em breve</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
