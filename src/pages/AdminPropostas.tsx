import { useState, useEffect, useMemo, useCallback } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getPropostas, removerProposta, salvarProposta, type Proposta, type PropostaInput } from "@/lib/propostas";
import { PROPOSAL_STATUS_MAP } from "@/lib/proposal-tiers";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Trash2, Eye, FileText, TrendingUp, DollarSign, BarChart3, Copy, FolderKanban } from "lucide-react";
import { saveProject, addProjectEvent } from "@/lib/projects";
import { toast } from "@/components/ui/sonner";

export default function AdminPropostas() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");

  const refresh = useCallback(async () => {
    try { setPropostas(await getPropostas()); } catch {} finally { setLoadingData(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (user) refresh();
  }, [user, authLoading]);

  useRealtimeSubscription("propostas", refresh, !!user);

  const handleRemove = async (id: string) => { await removerProposta(id); refresh(); };

  const handleDuplicate = async (p: Proposta) => {
    try {
      const input: PropostaInput = {
        nome_cliente: p.nome_cliente + " (cópia)",
        empresa_cliente: p.empresa_cliente,
        segmento: p.segmento,
        email_cliente: p.email_cliente,
        tipo_projeto: p.tipo_projeto,
        descricao_projeto: p.descricao_projeto,
        problema_cliente: "",
        objetivo_cliente: "",
        funcionalidades_desejadas: [],
        integracoes: [],
        numero_usuarios: "",
        prazo_desejado: "",
        orcamento_cliente: "",
        nivel_urgencia: "medio",
        link_referencia: "",
        observacoes: "",
        orcamento_id: p.orcamento_id || undefined,
      };
      if (p.proposta_json) {
        const recTier = p.proposal_tiers.find(t => t.is_recommended)?.type || "";
        const id = await salvarProposta(
          input, p.proposta_json, p.proposal_tiers, p.proposal_addons,
          recTier, p.commercial_notes || undefined, p.proposal_validity,
          p.is_phased, p.closing_strategy
        );
        toast.success("Proposta duplicada!");
        navigate(`/admin/propostas/${id}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao duplicar");
    }
  };

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
          description={propostas.length === 0 ? "Crie sua primeira proposta comercial com IA." : "Ajuste os filtros."}
          action={propostas.length === 0 ? { label: "Nova Proposta", onClick: () => navigate("/admin/propostas/nova") } : undefined}
        />
      ) : (
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Tipo</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Faixa Rec.</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Valor Rec.</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Faixas</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Data</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => {
                const st = PROPOSAL_STATUS_MAP[p.status] || PROPOSAL_STATUS_MAP.rascunho;
                const recTier = p.proposal_tiers.find(t => t.is_recommended);
                return (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/20" onClick={() => navigate(`/admin/propostas/${p.id}`)}>
                    <TableCell>
                      <div className="font-medium text-sm">{p.nome_cliente}</div>
                      {p.empresa_cliente && <div className="text-xs text-muted-foreground">{p.empresa_cliente}</div>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{p.tipo_projeto}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {recTier ? <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{recTier.name}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm font-medium text-primary">
                      {recTier ? `R$ ${recTier.price.toLocaleString("pt-BR")}` : `R$ ${p.valor_ideal.toLocaleString("pt-BR")}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${st.bgClass} ${st.color}`}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {p.proposal_tiers.length > 0 ? `${p.proposal_tiers.length} faixas` : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                      {new Date(p.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/propostas/${p.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(p)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(p.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
