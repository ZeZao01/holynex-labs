import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, Repeat, BarChart3, AlertTriangle, Award,
  Target, Zap, Flame,
} from "lucide-react";
import {
  getAllProfitabilityMetrics, getNicheMetrics, getPortfolioPerformance,
  ProfitabilityMetrics, NicheMetrics, PortfolioPerformance,
  FLAG_LABELS, RISK_ALERTS,
} from "@/lib/financial-metrics";
import { getDeliveredSystems, DeliveredSystem } from "@/lib/delivered-systems";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--secondary))",
  "hsl(var(--muted-foreground))",
  "hsl(var(--foreground))",
  "hsl(var(--border))",
];

export default function AdminFinanceiro() {
  const [metrics, setMetrics] = useState<ProfitabilityMetrics[]>([]);
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [nicheData, setNicheData] = useState<NicheMetrics[]>([]);
  const [portfolioPerf, setPortfolioPerf] = useState<PortfolioPerformance[]>([]);
  const [search, setSearch] = useState("");
  const [filterNicho, setFilterNicho] = useState("all");
  const [filterFlag, setFilterFlag] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [m, s, n, p] = await Promise.all([
        getAllProfitabilityMetrics(),
        getDeliveredSystems(),
        getNicheMetrics(),
        getPortfolioPerformance(),
      ]);
      setMetrics(m);
      setSystems(s);
      setNicheData(n);
      setPortfolioPerf(p);
    } catch {
      toast({ title: "Erro ao carregar dados financeiros", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const systemMap = useMemo(() => {
    const map: Record<string, DeliveredSystem> = {};
    systems.forEach(s => { map[s.id] = s; });
    return map;
  }, [systems]);

  // Aggregated stats from both metrics table AND delivered_systems
  const stats = useMemo(() => {
    const receitaTotal = metrics.reduce((a, m) => a + (m.receita_total || 0), 0);
    const recorrencia = metrics.reduce((a, m) => a + (m.receita_recorrente || 0), 0);
    const manutencao = metrics.reduce((a, m) => a + (m.receita_manutencao || 0), 0);
    const margens = metrics.filter((m) => m.receita_total > 0).map((m) => m.margem_estimada);
    const margemMedia = margens.length > 0 ? margens.reduce((a, b) => a + b, 0) / margens.length : 0;

    const systemReceitaTotal = systems.reduce((a, s) => a + (s.valor_fechado || 0), 0);
    const systemRecorrencia = systems.reduce((a, s) => a + (s.recorrencia_mensal || 0), 0);
    const totalReceita = Math.max(receitaTotal, systemReceitaTotal);
    const totalRecorrencia = Math.max(recorrencia, systemRecorrencia);
    const ticketMedio = systems.length > 0 ? systemReceitaTotal / systems.length : 0;

    const portfolioInteracoes = portfolioPerf.reduce((a, p) => a + (p.cliques || 0) + (p.ctas_acionados || 0), 0);

    return { receitaTotal: totalReceita, recorrencia: totalRecorrencia, manutencao, margemMedia, ticketMedio, portfolioInteracoes };
  }, [metrics, systems, portfolioPerf]);

  // Enriched metrics with system info
  const enrichedMetrics = useMemo(() => {
    return metrics.map(m => ({
      ...m,
      system: m.delivered_system_id ? systemMap[m.delivered_system_id] : null,
    })).filter(m => {
      if (search && m.system && !m.system.nome.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterNicho !== "all" && m.system?.nicho !== filterNicho) return false;
      if (filterFlag !== "all" && !(m.flags || []).includes(filterFlag)) return false;
      return true;
    });
  }, [metrics, systemMap, search, filterNicho, filterFlag]);

  // Risk alerts
  const risks = useMemo(() => {
    return metrics.flatMap(m => 
      RISK_ALERTS.filter(r => r.check(m)).map(r => ({
        ...r,
        system: m.delivered_system_id ? systemMap[m.delivered_system_id] : null,
        metrics: m,
      }))
    );
  }, [metrics, systemMap]);

  // Rankings
  const topRetorno = useMemo(() => [...enrichedMetrics].sort((a, b) => b.profitability_score - a.profitability_score).slice(0, 10), [enrichedMetrics]);
  const topRecorrencia = useMemo(() => [...enrichedMetrics].sort((a, b) => b.recurrence_score - a.recurrence_score).slice(0, 10), [enrichedMetrics]);
  const topReuso = useMemo(() => [...enrichedMetrics].sort((a, b) => b.reuse_score - a.reuse_score).slice(0, 10), [enrichedMetrics]);
  const topOportunidade = useMemo(() => [...enrichedMetrics].sort((a, b) => b.opportunity_score - a.opportunity_score).slice(0, 10), [enrichedMetrics]);

  const nichos = useMemo(() => [...new Set(systems.map(s => s.nicho).filter(Boolean))], [systems]);

  // Charts data
  const nicheChartData = useMemo(() => {
    if (nicheData.length > 0) return nicheData.map(n => ({ name: n.nicho, ticket: n.ticket_medio, margem: n.margem_media }));
    const nichoMap: Record<string, { total: number; count: number }> = {};
    systems.forEach(s => {
      if (!s.nicho) return;
      if (!nichoMap[s.nicho]) nichoMap[s.nicho] = { total: 0, count: 0 };
      nichoMap[s.nicho].total += s.valor_fechado || 0;
      nichoMap[s.nicho].count += 1;
    });
    return Object.entries(nichoMap).map(([name, v]) => ({ name, ticket: v.count > 0 ? v.total / v.count : 0, margem: 0 }));
  }, [nicheData, systems]);

  const typeChartData = useMemo(() => {
    const typeMap: Record<string, number> = {};
    systems.forEach(s => {
      const tipo = s.tipo_projeto || "Outro";
      typeMap[tipo] = (typeMap[tipo] || 0) + 1;
    });
    return Object.entries(typeMap).map(([name, value]) => ({ name, value }));
  }, [systems]);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Financeiro Estratégico" description="Inteligência financeira, margens, rankings e oportunidades" breadcrumbs={[{ label: "Financeiro" }]} />

      {/* KPI Cards */}
      <StatsGrid columns={6}>
        <StatCard title="Receita Total" value={fmt(stats.receitaTotal)} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Recorrência Mensal" value={fmt(stats.recorrencia)} icon={<Repeat className="h-5 w-5" />} />
        <StatCard title="Manutenção" value={fmt(stats.manutencao)} icon={<Zap className="h-5 w-5" />} />
        <StatCard title="Ticket Médio" value={fmt(stats.ticketMedio)} icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard title="Margem Média" value={`${stats.margemMedia.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Interações Portfólio" value={stats.portfolioInteracoes} icon={<Flame className="h-5 w-5" />} />
      </StatsGrid>

      {/* Risk Alerts */}
      {risks.length > 0 && (
        <SectionCard title="⚠️ Alertas de Risco" className="border-destructive/30">
          <div className="space-y-2">
            {risks.slice(0, 5).map((r, i) => (
              <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                <span className="font-medium">{r.system?.nome || "Sistema"}</span>
                <Badge variant="outline" className="text-destructive border-destructive/30">{r.label}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <Tabs defaultValue="rankings" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="nichos">Visão por Nicho</TabsTrigger>
          <TabsTrigger value="tipos">Visão por Tipo</TabsTrigger>
          <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
        </TabsList>

        {/* Rankings Tab */}
        <TabsContent value="rankings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RankingCard title="🏆 Maior Retorno" items={topRetorno} scoreKey="profitability_score" />
            <RankingCard title="🔄 Maior Recorrência" items={topRecorrencia} scoreKey="recurrence_score" />
            <RankingCard title="♻️ Maior Potencial de Reuso" items={topReuso} scoreKey="reuse_score" />
            <RankingCard title="🚀 Maior Oportunidade" items={topOportunidade} scoreKey="opportunity_score" />
          </div>
          {enrichedMetrics.length === 0 && (
            <EmptyState icon={<Award className="h-10 w-10 text-muted-foreground" />} title="Sem dados de ranking" description="Adicione métricas financeiras nos sistemas entregues para ver os rankings." />
          )}
        </TabsContent>

        {/* Nicho Tab */}
        <TabsContent value="nichos" className="space-y-6">
          {nicheChartData.length > 0 ? (
            <>
              <SectionCard title="Ticket Médio por Nicho">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nicheChartData}>
                      <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                      <Bar dataKey="ticket" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              {nicheData.length > 0 && (
                <SectionCard title="Detalhes por Nicho" noPadding>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nicho</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Propostas</TableHead>
                        <TableHead className="text-right">Projetos</TableHead>
                        <TableHead className="text-right">Ticket Médio</TableHead>
                        <TableHead className="text-right">Margem</TableHead>
                        <TableHead className="text-right">Demanda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {nicheData.map(n => (
                        <TableRow key={n.id}>
                          <TableCell className="font-medium">{n.nicho}</TableCell>
                          <TableCell className="text-right">{n.qtd_leads}</TableCell>
                          <TableCell className="text-right">{n.qtd_propostas}</TableCell>
                          <TableCell className="text-right">{n.qtd_projetos}</TableCell>
                          <TableCell className="text-right">{fmt(n.ticket_medio)}</TableCell>
                          <TableCell className="text-right">{n.margem_media.toFixed(1)}%</TableCell>
                          <TableCell className="text-right">
                            <ScoreBar value={n.demand_score} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </SectionCard>
              )}
            </>
          ) : (
            <EmptyState icon={<BarChart3 className="h-10 w-10 text-muted-foreground" />} title="Sem dados de nicho" description="Cadastre sistemas com nichos definidos para ver a análise." />
          )}
        </TabsContent>

        {/* Tipos Tab */}
        <TabsContent value="tipos" className="space-y-6">
          {typeChartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SectionCard title="Distribuição por Tipo de Solução">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, value }) => `${name} (${value})`}>
                        {typeChartData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
              <SectionCard title="Tipos Cadastrados" noPadding>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Quantidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {typeChartData.map(t => (
                      <TableRow key={t.name}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-right">{t.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionCard>
            </div>
          ) : (
            <EmptyState icon={<Target className="h-10 w-10 text-muted-foreground" />} title="Sem dados por tipo" description="Cadastre sistemas com tipo de projeto definido." />
          )}
        </TabsContent>

        {/* Detalhado Tab */}
        <TabsContent value="detalhado" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterToolbar searchPlaceholder="Buscar sistema..." searchValue={search} onSearchChange={setSearch} />
            <Select value={filterNicho} onValueChange={setFilterNicho}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Nicho" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos nichos</SelectItem>
                {nichos.map(n => <SelectItem key={n} value={n!}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterFlag} onValueChange={setFilterFlag}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Flag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas flags</SelectItem>
                {Object.entries(FLAG_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {enrichedMetrics.length > 0 ? (
            <SectionCard noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sistema</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                    <TableHead className="text-right">Recorrência</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                    <TableHead>Scores</TableHead>
                    <TableHead>Flags</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedMetrics.map(m => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div>
                          <span className="font-medium">{m.system?.nome || "—"}</span>
                          {m.system?.nicho && <span className="text-xs text-muted-foreground ml-2">{m.system.nicho}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmt(m.receita_total)}</TableCell>
                      <TableCell className="text-right">{fmt(m.receita_recorrente)}/mês</TableCell>
                      <TableCell className="text-right">
                        <span className={m.margem_estimada < 20 ? "text-destructive" : m.margem_estimada > 50 ? "text-primary" : "text-foreground"}>
                          {m.margem_estimada.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <ScorePill label="P" value={m.profitability_score} />
                          <ScorePill label="D" value={m.demand_score} />
                          <ScorePill label="R" value={m.recurrence_score} />
                          <ScorePill label="U" value={m.reuse_score} />
                          <ScorePill label="O" value={m.opportunity_score} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(m.flags || []).map(f => {
                            const fl = FLAG_LABELS[f];
                            return fl ? <Badge key={f} variant="outline" className={`text-[10px] ${fl.color}`}>{fl.label}</Badge> : null;
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          ) : (
            <EmptyState
              icon={<DollarSign className="h-10 w-10 text-muted-foreground" />}
              title="Sem métricas financeiras"
              description="Acesse um sistema entregue e configure as métricas financeiras para alimentar este painel."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <Progress value={value} className="h-1.5 w-16" />
      <span className="text-xs text-muted-foreground">{value}</span>
    </div>
  );
}

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "text-primary" : value >= 40 ? "text-foreground" : "text-destructive";
  return (
    <div className="flex flex-col items-center">
      <span className={`text-[10px] font-bold ${color}`}>{value}</span>
      <span className="text-[8px] text-muted-foreground">{label}</span>
    </div>
  );
}

function RankingCard({ title, items, scoreKey }: { title: string; items: (ProfitabilityMetrics & { system: DeliveredSystem | null })[]; scoreKey: keyof ProfitabilityMetrics }) {
  if (items.length === 0) return null;
  return (
    <SectionCard title={title}>
      <div className="space-y-2">
        {items.map((m, i) => (
          <div key={m.id} className="flex items-center gap-3 text-sm">
            <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}.</span>
            <span className="flex-1 font-medium truncate">{m.system?.nome || "—"}</span>
            <ScoreBar value={Number(m[scoreKey]) || 0} />
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
