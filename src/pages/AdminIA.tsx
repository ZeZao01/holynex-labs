import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAccessControl } from "@/hooks/useAccessControl";
import {
  Sparkles, Brain, Zap, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, Eye, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  getAiExecutions, getPendingReviews, reviewExecution,
  AiExecution, USE_CASE_LABELS, STATUS_LABELS,
} from "@/lib/ai-copilot";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { logSecurityEvent } from "@/lib/security";

export default function AdminIA() {
  const { canApprove, guardAction } = useAccessControl();
  const [executions, setExecutions] = useState<AiExecution[]>([]);
  const [pending, setPending] = useState<AiExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterUseCase, setFilterUseCase] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => { load(); }, []);
  useRealtimeSubscription("ai_executions", load);

  async function load() {
    try {
      const [execs, pend] = await Promise.all([getAiExecutions(100), getPendingReviews()]);
      setExecutions(execs);
      setPending(pend);
    } catch {
      toast({ title: "Erro ao carregar execuções IA", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleReview(id: string, approved: boolean) {
    const allowed = await guardAction("ia", "aprovar", {
      description: "Tentativa de revisão IA",
      metadata: { executionId: id, approved },
    });
    if (!allowed) {
      toast({ title: "Sem permissão para revisar IA", variant: "destructive" });
      return;
    }
    try {
      await reviewExecution(id, approved, "admin", reviewNote);
      await logSecurityEvent(
        "revisao_ia",
        "medium",
        approved ? "Execução IA aprovada" : "Execução IA rejeitada",
        { source: "ia", entityType: "ai_execution", entityId: id, metadata: { approved } }
      );
      toast({ title: approved ? "Saída aprovada!" : "Saída rejeitada" });
      setReviewNote("");
      setExpandedId(null);
      load();
    } catch {
      toast({ title: "Erro ao revisar", variant: "destructive" });
    }
  }

  const stats = useMemo(() => {
    const total = executions.length;
    const completed = executions.filter(e => e.status === "concluido" || e.status === "aprovado").length;
    const fallbacks = executions.filter(e => e.fallback_triggered).length;
    const errors = executions.filter(e => e.status === "falhou" || e.status === "invalido").length;
    const avgDuration = total > 0 ? Math.round(executions.reduce((a, e) => a + (e.duration_ms || 0), 0) / total) : 0;
    const fallbackRate = total > 0 ? Math.round((fallbacks / total) * 100) : 0;

    const providerCounts: Record<string, number> = {};
    executions.forEach(e => { providerCounts[e.provider_used] = (providerCounts[e.provider_used] || 0) + 1; });
    const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const useCaseCounts: Record<string, number> = {};
    executions.forEach(e => { useCaseCounts[e.use_case] = (useCaseCounts[e.use_case] || 0) + 1; });

    return { total, completed, fallbacks, errors, avgDuration, fallbackRate, topProvider, useCaseCounts, pendingCount: pending.length };
  }, [executions, pending]);

  const filtered = useMemo(() => {
    return executions.filter(e => {
      if (search && !e.use_case.includes(search.toLowerCase()) && !e.entity_type.includes(search.toLowerCase()) && !e.provider_used.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterUseCase !== "all" && e.use_case !== filterUseCase) return false;
      if (filterStatus !== "all" && e.status !== filterStatus) return false;
      return true;
    });
  }, [executions, search, filterUseCase, filterStatus]);

  const fmtDate = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="IA Assistiva" description="Centro de controle, governança e observabilidade da IA" breadcrumbs={[{ label: "IA Assistiva" }]} />

      <StatsGrid columns={6}>
        <StatCard title="Total Execuções" value={stats.total} icon={<Sparkles className="h-5 w-5" />} />
        <StatCard title="Concluídas" value={stats.completed} icon={<CheckCircle className="h-5 w-5" />} />
        <StatCard title="Pendentes Revisão" value={stats.pendingCount} icon={<Eye className="h-5 w-5" />} subtitle={stats.pendingCount > 0 ? "Ação necessária" : undefined} />
        <StatCard title="Taxa Fallback" value={`${stats.fallbackRate}%`} icon={<RefreshCw className="h-5 w-5" />} />
        <StatCard title="Erros" value={stats.errors} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Provedor Principal" value={stats.topProvider} icon={<Brain className="h-5 w-5" />} subtitle={`~${stats.avgDuration}ms`} />
      </StatsGrid>

      {/* Usage by module */}
      {Object.keys(stats.useCaseCounts).length > 0 && (
        <SectionCard title="Uso por Módulo">
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.useCaseCounts).sort((a, b) => b[1] - a[1]).map(([uc, count]) => (
              <Badge key={uc} variant="outline" className="text-xs gap-1">
                {USE_CASE_LABELS[uc] || uc} <span className="font-bold text-primary">{count}</span>
              </Badge>
            ))}
          </div>
        </SectionCard>
      )}

      <Tabs defaultValue={stats.pendingCount > 0 ? "revisao" : "historico"} className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="revisao" className="gap-1">
            Revisão {stats.pendingCount > 0 && <Badge variant="destructive" className="text-[10px] h-4 px-1">{stats.pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Pending reviews */}
        <TabsContent value="revisao" className="space-y-4">
          {pending.length === 0 ? (
            <EmptyState icon={<CheckCircle className="h-10 w-10 text-muted-foreground" />} title="Nenhuma revisão pendente" description="Todas as saídas de IA foram revisadas." />
          ) : (
            <div className="space-y-3">
              {pending.map(ex => (
                <SectionCard key={ex.id} className="border-secondary/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{USE_CASE_LABELS[ex.use_case] || ex.use_case}</Badge>
                        <span className="text-xs text-muted-foreground">{ex.entity_type} • {fmtDate(ex.criado_em)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{ex.provider_used}</span>
                        <span>{ex.duration_ms}ms</span>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 text-sm max-h-48 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-xs">{JSON.stringify(ex.output_data, null, 2)}</pre>
                    </div>
                    <Textarea
                      placeholder="Notas de revisão (opcional)..."
                      value={expandedId === ex.id ? reviewNote : ""}
                      onChange={(e) => { setExpandedId(ex.id); setReviewNote(e.target.value); }}
                      className="h-16 text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="destructive" disabled={!canApprove("ia")} onClick={() => handleReview(ex.id, false)}>
                        <XCircle className="h-3 w-3 mr-1" /> Rejeitar
                      </Button>
                      <Button size="sm" disabled={!canApprove("ia")} onClick={() => handleReview(ex.id, true)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Aprovar
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              ))}
            </div>
          )}
        </TabsContent>

        {/* History */}
        <TabsContent value="historico" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterToolbar searchPlaceholder="Buscar execução..." searchValue={search} onSearchChange={setSearch} />
            <Select value={filterUseCase} onValueChange={setFilterUseCase}>
              <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Caso de uso" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos casos</SelectItem>
                {Object.entries(USE_CASE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos status</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {filtered.length > 0 ? (
            <SectionCard noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caso de Uso</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Duração</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(ex => {
                    const st = STATUS_LABELS[ex.status] || { label: ex.status, color: "" };
                    const isExpanded = expandedId === ex.id;
                    return (
                      <>
                        <TableRow key={ex.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : ex.id)}>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px]">{USE_CASE_LABELS[ex.use_case] || ex.use_case}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{ex.entity_type || "—"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium">{ex.provider_used}</span>
                              {ex.fallback_triggered && <Badge variant="outline" className="text-[9px] text-destructive border-destructive/30">FB</Badge>}
                            </div>
                          </TableCell>
                          <TableCell><Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge></TableCell>
                          <TableCell className="text-right text-xs">{ex.duration_ms}ms</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fmtDate(ex.criado_em)}</TableCell>
                          <TableCell>{isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow key={`${ex.id}-detail`}>
                            <TableCell colSpan={7}>
                              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                  <div><span className="text-muted-foreground">Modelo:</span> {ex.model_used}</div>
                                  <div><span className="text-muted-foreground">Prompt:</span> {ex.prompt_version}</div>
                                  <div><span className="text-muted-foreground">Válido:</span> {ex.output_valid ? "Sim" : "Não"}</div>
                                </div>
                                {ex.error_reason && (
                                  <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{ex.error_reason}</div>
                                )}
                                {ex.output_data && Object.keys(ex.output_data).length > 0 && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver saída</summary>
                                    <pre className="mt-1 whitespace-pre-wrap bg-card rounded p-2 max-h-40 overflow-y-auto">{JSON.stringify(ex.output_data, null, 2)}</pre>
                                  </details>
                                )}
                                {ex.input_summary && (
                                  <details className="text-xs">
                                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver input</summary>
                                    <pre className="mt-1 whitespace-pre-wrap bg-card rounded p-2 max-h-32 overflow-y-auto">{ex.input_summary}</pre>
                                  </details>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          ) : (
            <EmptyState icon={<Sparkles className="h-10 w-10 text-muted-foreground" />} title="Sem execuções" description="Nenhuma execução de IA registrada ainda. Use os copilotos nos módulos para começar." />
          )}
        </TabsContent>
      </Tabs>

      {/* Copilot capabilities info */}
      <SectionCard title="🤖 Copilotos Disponíveis">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { icon: <Zap className="h-4 w-4" />, title: "Comercial", desc: "Resumir leads, sugerir estratégias e argumentos de fechamento" },
            { icon: <Sparkles className="h-4 w-4" />, title: "Propostas", desc: "Gerar propostas estruturadas, resumir e padronizar linguagem" },
            { icon: <Brain className="h-4 w-4" />, title: "Operacional", desc: "Resumir projetos, sugerir riscos e classificar demandas" },
            { icon: <Eye className="h-4 w-4" />, title: "Conteúdo", desc: "Copy para portfólio, headlines e descrições comerciais" },
          ].map(c => (
            <div key={c.title} className="rounded-lg border border-border p-3 space-y-1">
              <div className="flex items-center gap-2 font-medium text-sm">{c.icon} {c.title}</div>
              <p className="text-xs text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
