import { useEffect, useState, useCallback } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import SystemForm from "@/components/admin/SystemForm";
import SystemGridCard from "@/components/admin/SystemGridCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import {
  getDeliveredSystems, saveDeliveredSystem, addSystemEvent, setSystemTags,
  DeliveredSystem, SUPPORT_STATUS_MAP, OPERATIONAL_STATUS_MAP, REUSE_MAP,
} from "@/lib/delivered-systems";
import { NICHES } from "@/lib/admin-types";
import { PackageCheck, Plus, LayoutGrid, List, Star, Recycle } from "lucide-react";
import { format } from "date-fns";

export default function AdminSistemas() {
  const navigate = useNavigate();
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterNicho, setFilterNicho] = useState("all");
  const [filterSuporte, setFilterSuporte] = useState("all");
  const [filterReuso, setFilterReuso] = useState("all");
  const [filterAtivo, setFilterAtivo] = useState("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadCb = useCallback(() => { load(); }, []);
  useEffect(() => { load(); }, []);
  useRealtimeSubscription("delivered_systems", loadCb);

  async function load() {
    setLoading(true);
    try {
      setSystems(await getDeliveredSystems());
    } catch {
      toast({ title: "Erro ao carregar sistemas", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: Partial<DeliveredSystem>, tags: string[]) {
    setSaving(true);
    try {
      const sys = await saveDeliveredSystem(data);
      if (tags.length > 0) await setSystemTags(sys.id, tags.map((t) => ({ tag: t, tipo: "tecnica" })));
      await addSystemEvent(sys.id, "criado_manualmente", "Sistema cadastrado manualmente");
      toast({ title: "Sistema cadastrado!" });
      setShowNew(false);
      load();
    } catch {
      toast({ title: "Erro ao cadastrar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  const filtered = systems.filter((s) => {
    if (search && !s.nome.toLowerCase().includes(search.toLowerCase()) && !s.cliente.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterNicho !== "all" && s.nicho !== filterNicho) return false;
    if (filterSuporte !== "all" && s.status_suporte !== filterSuporte) return false;
    if (filterReuso !== "all" && s.potencial_reuso !== filterReuso) return false;
    if (filterAtivo === "ativo" && !s.ativo) return false;
    if (filterAtivo === "arquivado" && s.ativo) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sistemas Entregues"
        description="Catálogo estratégico de projetos finalizados — ativos reutilizáveis da agência"
        breadcrumbs={[{ label: "Sistemas Entregues" }]}
      />

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <FilterToolbar searchPlaceholder="Buscar sistema ou cliente..." searchValue={search} onSearchChange={setSearch}>
          <Select value={filterNicho} onValueChange={setFilterNicho}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Nicho" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Nichos</SelectItem>
              {NICHES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterSuporte} onValueChange={setFilterSuporte}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Suporte" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Suporte</SelectItem>
              {Object.entries(SUPPORT_STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterReuso} onValueChange={setFilterReuso}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Reuso" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Reuso</SelectItem>
              {Object.entries(REUSE_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAtivo} onValueChange={setFilterAtivo}>
            <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="arquivado">Arquivados</SelectItem>
            </SelectContent>
          </Select>
        </FilterToolbar>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={viewMode === "table" ? "secondary" : "ghost"} onClick={() => setViewMode("table")}><List className="h-4 w-4" /></Button>
          <Button size="sm" variant={viewMode === "grid" ? "secondary" : "ghost"} onClick={() => setViewMode("grid")}><LayoutGrid className="h-4 w-4" /></Button>
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Novo Sistema</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<PackageCheck className="h-10 w-10 text-muted-foreground" />}
          title="Nenhum sistema encontrado"
          description="Cadastre sistemas entregues para construir o catálogo estratégico da agência."
          action={{ label: "Cadastrar Sistema", onClick: () => setShowNew(true) }}
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <SystemGridCard key={s.id} system={s} onClick={() => navigate(`/admin/sistemas/${s.id}`)} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Suporte</TableHead>
                <TableHead>Operação</TableHead>
                <TableHead>Reuso</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Entrega</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const sup = SUPPORT_STATUS_MAP[s.status_suporte as keyof typeof SUPPORT_STATUS_MAP];
                const op = OPERATIONAL_STATUS_MAP[s.status_operacional as keyof typeof OPERATIONAL_STATUS_MAP];
                const reu = REUSE_MAP[s.potencial_reuso as keyof typeof REUSE_MAP];
                return (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => navigate(`/admin/sistemas/${s.id}`)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {s.nome}
                        {s.destaque_interno && <Star className="h-3 w-3 text-amber-400" />}
                        {s.reutilizavel && <Recycle className="h-3 w-3 text-blue-400" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{s.nicho || "—"}</TableCell>
                    <TableCell>{sup ? <StatusBadge status={sup.color} label={sup.label} /> : "—"}</TableCell>
                    <TableCell>{op ? <StatusBadge status={op.color} label={op.label} /> : "—"}</TableCell>
                    <TableCell>{reu ? <StatusBadge status={reu.color} label={reu.label} /> : "—"}</TableCell>
                    <TableCell>R$ {s.valor_fechado?.toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-muted-foreground">{s.data_entrega ? format(new Date(s.data_entrega), "dd/MM/yy") : "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Sistema Entregue</DialogTitle></DialogHeader>
          <SystemForm system={{}} tags={[]} onSave={handleCreate} onCancel={() => setShowNew(false)} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
