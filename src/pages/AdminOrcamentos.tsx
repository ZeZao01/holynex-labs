import { useState, useEffect, useMemo, useCallback } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useNavigate } from "react-router-dom";
import { getOrcamentos, atualizarStatusComercial, removerOrcamento, type Orcamento, type StatusComercial, STATUS_COMERCIAL_MAP, ESTRATEGIAS_COMERCIAIS } from "@/lib/orcamentos";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Trash2, Eye, FileBarChart, Plus, Flame, Snowflake, Sun } from "lucide-react";

const tempIcons: Record<string, typeof Flame> = { quente: Flame, morno: Sun, frio: Snowflake };
const tempColors: Record<string, string> = { quente: "text-red-400", morno: "text-amber-400", frio: "text-sky-400" };

export default function AdminOrcamentos() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");
  const [filterUrgencia, setFilterUrgencia] = useState("todos");

  const refresh = useCallback(async () => {
    try {
      const data = await getOrcamentos();
      setOrcamentos(data);
    } catch { /* silent */ } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (user) refresh();
  }, [user, authLoading, navigate, refresh]);

  useRealtimeSubscription("orcamentos", refresh, !!user);

  const filtered = useMemo(() => {
    let list = orcamentos;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o => o.nome.toLowerCase().includes(q) || o.empresa.toLowerCase().includes(q) || o.email.toLowerCase().includes(q));
    }
    if (filterStatus !== "todos") list = list.filter(o => o.status_comercial === filterStatus);
    if (filterTipo !== "todos") list = list.filter(o => o.tipo_projeto === filterTipo);
    if (filterUrgencia !== "todos") list = list.filter(o => o.urgencia === filterUrgencia);
    return list;
  }, [orcamentos, search, filterStatus, filterTipo, filterUrgencia]);

  const counts = useMemo(() => ({
    total: orcamentos.length,
    novos: orcamentos.filter(o => o.status_comercial === "novo").length,
    qualificados: orcamentos.filter(o => o.status_comercial === "qualificado").length,
    convertidos: orcamentos.filter(o => o.status_comercial === "convertido").length,
  }), [orcamentos]);

  if (authLoading || !user) return <div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-8 rounded-full" /></div>;

  const tiposUnicos = [...new Set(orcamentos.map(o => o.tipo_projeto).filter(Boolean))];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads & Orçamentos"
        description="Pipeline comercial qualificado"
        actions={
          <Button onClick={() => navigate("/contato")} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "text-primary" },
          { label: "Novos", value: counts.novos, color: "text-sky-400" },
          { label: "Qualificados", value: counts.qualificados, color: "text-emerald-400" },
          { label: "Convertidos", value: counts.convertidos, color: "text-purple-400" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border/40 rounded-xl p-4 text-center">
            <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <FilterToolbar searchPlaceholder="Buscar por nome, email ou empresa..." searchValue={search} onSearchChange={setSearch}>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {Object.entries(STATUS_COMERCIAL_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tiposUnicos.length > 0 && (
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tiposUnicos.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={filterUrgencia} onValueChange={setFilterUrgencia}>
          <SelectTrigger className="w-[140px] h-9 text-sm"><SelectValue placeholder="Urgência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda urgência</SelectItem>
            <SelectItem value="critica">Crítica</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="sem_urgencia">Sem urgência</SelectItem>
          </SelectContent>
        </Select>
      </FilterToolbar>

      {/* Table */}
      {loadingData ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum lead encontrado" description="Ajuste os filtros ou aguarde novos orçamentos." />
      ) : (
        <div className="border border-border/40 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Nome</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Empresa</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Tipo</TableHead>
                <TableHead className="text-xs hidden lg:table-cell">Investimento</TableHead>
                <TableHead className="text-xs">Score</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Temp.</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((orc) => {
                const sc = STATUS_COMERCIAL_MAP[orc.status_comercial || "novo"];
                const TempIcon = tempIcons[orc.temperatura_lead || "morno"] || Sun;
                const tempColor = tempColors[orc.temperatura_lead || "morno"] || "text-muted-foreground";
                return (
                  <TableRow key={orc.id} className="cursor-pointer hover:bg-muted/20" onClick={() => navigate(`/admin/orcamentos/${orc.id}`)}>
                    <TableCell>
                      <div className="font-medium text-sm">{orc.nome}</div>
                      <div className="text-xs text-muted-foreground">{orc.email}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{orc.empresa || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{orc.tipo_projeto || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{orc.faixa_investimento || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-xs font-bold text-primary">
                          {orc.score_qualificacao || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <TempIcon className={`h-4 w-4 ${tempColor}`} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`text-[10px] ${sc?.color || ""}`}>{sc?.label || "Novo"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/orcamentos/${orc.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/propostas/nova?orcamento=${orc.id}`)}>
                          <FileBarChart className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={async () => { await removerOrcamento(orc.id); refresh(); }}>
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
