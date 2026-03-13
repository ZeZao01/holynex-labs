import { useState, useEffect, useMemo, useCallback } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getPropostas, removerProposta, type Proposta } from "@/lib/propostas";
import { PROPOSAL_STATUS_MAP } from "@/lib/proposal-tiers";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2, Eye, FileText, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPropostas() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (user) refresh();
  }, [user, authLoading]);

  const refresh = async () => {
    try { setPropostas(await getPropostas()); } catch {} finally { setLoadingData(false); }
  };

  const handleRemove = async (id: string) => { await removerProposta(id); refresh(); };

  const filtered = useMemo(() => {
    return propostas.filter(p => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (tipoFilter !== "all" && p.tipo_projeto !== tipoFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return p.nome_cliente.toLowerCase().includes(s) || p.empresa_cliente.toLowerCase().includes(s) || p.tipo_projeto.toLowerCase().includes(s);
      }
      return true;
    });
  }, [propostas, search, statusFilter, tipoFilter]);

  const stats = useMemo(() => {
    const total = propostas.length;
    const totalValor = propostas.reduce((s, p) => s + p.valor_ideal, 0);
    const aceitas = propostas.filter(p => p.status === "aceita").length;
    const pipeline = propostas.filter(p => ["gerada", "enviada", "pronta", "em_revisao"].includes(p.status)).reduce((s, p) => s + p.valor_ideal, 0);
    return { total, totalValor, aceitas, pipeline };
  }, [propostas]);

  const tipos = useMemo(() => [...new Set(propostas.map(p => p.tipo_projeto))], [propostas]);

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Propostas Comerciais"
        description="Motor de propostas com faixas comerciais e comparativo"
        breadcrumbs={[{ label: "Propostas" }]}
        actions={
          <Button size="sm" onClick={() => navigate("/admin/propostas/nova")}>
            <Plus className="h-4 w-4 mr-1" /> Nova Proposta
          </Button>
        }
      />

      <StatsGrid columns={4}>
        <StatCard title="Total" value={stats.total} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Valor Total" value={`R$ ${stats.totalValor.toLocaleString("pt-BR")}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Aceitas" value={stats.aceitas} icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Pipeline" value={`R$ ${stats.pipeline.toLocaleString("pt-BR")}`} icon={<BarChart3 className="h-5 w-5" />} />
      </StatsGrid>

      <FilterToolbar searchPlaceholder="Buscar cliente, empresa..." searchValue={search} onSearchChange={setSearch}>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(PROPOSAL_STATUS_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {tipos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </FilterToolbar>

      {loadingData ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-10 w-10 text-muted-foreground" />}
          title={propostas.length === 0 ? "Nenhuma proposta criada" : "Nenhum resultado"}
          description={propostas.length === 0 ? "Crie sua primeira proposta comercial com IA." : "Ajuste os filtros para encontrar propostas."}
          action={propostas.length === 0 ? { label: "Nova Proposta", onClick: () => navigate("/admin/propostas/nova") } : undefined}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filtered.map(p => {
              const st = PROPOSAL_STATUS_MAP[p.status] || PROPOSAL_STATUS_MAP.rascunho;
              const recTier = p.proposal_tiers.find(t => t.is_recommended);
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="rounded-xl border border-border/40 bg-card p-5 hover:border-primary/20 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-semibold text-base truncate">{p.nome_cliente}</h3>
                        <Badge variant="outline" className={`${st.bgClass} ${st.color} text-xs`}>{st.label}</Badge>
                        {recTier && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Rec: {recTier.name}</Badge>}
                        {p.proposal_tiers.length > 0 && <Badge variant="outline" className="text-[10px]">{p.proposal_tiers.length} faixas</Badge>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-1.5">
                        {p.empresa_cliente && <span>{p.empresa_cliente}</span>}
                        <span>{p.tipo_projeto}</span>
                        {p.segmento && <span>• {p.segmento}</span>}
                        <span>{new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                      </div>
                      <div className="flex gap-3 text-xs">
                        {recTier ? (
                          <span className="text-primary font-medium">R$ {recTier.price.toLocaleString("pt-BR")}</span>
                        ) : (
                          <>
                            <span className="text-amber-400">Min: R$ {p.valor_minimo.toLocaleString("pt-BR")}</span>
                            <span className="text-primary font-medium">Ideal: R$ {p.valor_ideal.toLocaleString("pt-BR")}</span>
                            <span className="text-emerald-400">Premium: R$ {p.valor_premium.toLocaleString("pt-BR")}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="default" size="sm" onClick={() => navigate(`/admin/propostas/${p.id}`)} className="gap-1">
                        <Eye className="h-3.5 w-3.5" /> Ver
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRemove(p.id)} className="text-muted-foreground hover:text-destructive gap-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
