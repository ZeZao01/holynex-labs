import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import StatsGrid from "@/components/admin/StatsGrid";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import EmptyState from "@/components/admin/EmptyState";
import ChangeForm from "@/components/admin/ChangeForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Wrench, Plus, AlertCircle, Play, CheckCircle, DollarSign, FileText, Clock,
  Edit, Copy, ThumbsUp, ThumbsDown, MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import {
  ProjectChange, ProjectChangeEvent,
  listChanges, saveChange, addChangeEvent, getChangeEvents, computeStats,
  getLabel, getStatusMeta, getPriorityMeta,
  CHANGE_TYPES, CHANGE_STATUSES, PRIORITIES, URGENCIES, BILLING_MODES, REQUEST_ORIGINS,
} from "@/lib/project-changes";
import { getProjects, Project } from "@/lib/projects";
import { getDeliveredSystems, DeliveredSystem } from "@/lib/delivered-systems";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AdminManutencao() {
  const navigate = useNavigate();
  const [changes, setChanges] = useState<ProjectChange[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todos");
  const [urgencyFilter, setUrgencyFilter] = useState("todos");
  const [billingFilter, setBillingFilter] = useState("todos");
  const [projectFilter, setProjectFilter] = useState("todos");
  const [systemFilter, setSystemFilter] = useState("todos");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectChange | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<ProjectChange | null>(null);
  const [events, setEvents] = useState<ProjectChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadCb = useCallback(() => load(), []);
  useEffect(() => { load(); }, []);
  useRealtimeSubscription("project_changes", loadCb);

  async function load() {
    try {
      const [data, p, s] = await Promise.all([listChanges(), getProjects(), getDeliveredSystems()]);
      setChanges(data);
      setProjects(p);
      setSystems(s);
    } catch {
      toast({ title: "Erro ao carregar solicitações", variant: "destructive" });
    }
  }

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.nome]));
  const systemMap = Object.fromEntries(systems.map(s => [s.id, s.nome]));

  const filtered = changes.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "todos" && c.status !== statusFilter) return false;
    if (typeFilter !== "todos" && c.change_type !== typeFilter) return false;
    if (priorityFilter !== "todos" && c.priority !== priorityFilter) return false;
    if (urgencyFilter !== "todos" && c.urgency !== urgencyFilter) return false;
    if (billingFilter !== "todos" && c.billing_mode !== billingFilter) return false;
    if (projectFilter !== "todos" && c.project_id !== projectFilter) return false;
    if (systemFilter !== "todos" && c.delivered_system_id !== systemFilter) return false;
    return true;
  });

  async function handleSave(data: Partial<ProjectChange>) {
    setLoading(true);
    try {
      const saved = await saveChange({ ...data, id: editing?.id });
      await addChangeEvent(saved.id, editing ? "solicitacao_editada" : "solicitacao_criada");
      toast({ title: editing ? "Solicitação atualizada!" : "Solicitação criada!" });
      setFormOpen(false);
      setEditing(null);
      load();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(change: ProjectChange, newStatus: string) {
    try {
      await saveChange({ id: change.id, status: newStatus, ...(newStatus === "concluida" ? { completed_at: new Date().toISOString() } : {}) });
      await addChangeEvent(change.id, "status_alterado", `${change.status} → ${newStatus}`);
      toast({ title: "Status atualizado!" });
      load();
      if (selected?.id === change.id) openDetail({ ...change, status: newStatus });
    } catch {
      toast({ title: "Erro ao atualizar status", variant: "destructive" });
    }
  }

  async function handleApprove(change: ProjectChange, approved: boolean) {
    try {
      await saveChange({
        id: change.id,
        status: approved ? "aprovada" : "recusada",
        approved_at: new Date().toISOString(),
      });
      await addChangeEvent(change.id, approved ? "aprovada" : "recusada");
      toast({ title: approved ? "Aprovada!" : "Recusada!" });
      load();
    } catch {
      toast({ title: "Erro na ação", variant: "destructive" });
    }
  }

  async function handleDuplicate(change: ProjectChange) {
    try {
      const { id, criado_em, atualizado_em, completed_at, approved_at, ...rest } = change;
      const dup = await saveChange({ ...rest, title: `${change.title} (Cópia)`, status: "aberta" });
      await addChangeEvent(dup.id, "solicitacao_criada", "Duplicada de: " + change.title);
      toast({ title: "Solicitação duplicada!" });
      load();
    } catch {
      toast({ title: "Erro ao duplicar", variant: "destructive" });
    }
  }

  async function openDetail(change: ProjectChange) {
    setSelected(change);
    setDetailOpen(true);
    try {
      const ev = await getChangeEvents(change.id);
      setEvents(ev);
    } catch { setEvents([]); }
  }

  const stats = computeStats(changes);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alterações & Manutenção"
        description="Solicitações de correção, melhoria e novos módulos"
        breadcrumbs={[{ label: "Manutenção" }]}
      />

      {/* Stats */}
      <StatsGrid columns={6}>
        <StatCard title="Abertas" value={stats.abertas} icon={<AlertCircle className="h-4 w-4" />} />
        <StatCard title="Em Execução" value={stats.emExecucao} icon={<Play className="h-4 w-4" />} />
        <StatCard title="Concluídas" value={stats.concluidas} icon={<CheckCircle className="h-4 w-4" />} />
        <StatCard title="Custo em Aberto" value={`R$ ${stats.custoAberto.toLocaleString("pt-BR")}`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard title="Cobradas" value={`R$ ${stats.cobradas.toLocaleString("pt-BR")}`} icon={<DollarSign className="h-4 w-4" />} />
        <StatCard title="Inclusas Contrato" value={stats.inclusas} icon={<FileText className="h-4 w-4" />} />
      </StatsGrid>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <FilterToolbar searchPlaceholder="Buscar solicitação..." searchValue={search} onSearchChange={setSearch} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Status</SelectItem>
            {CHANGE_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Tipos</SelectItem>
            {CHANGE_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Urgência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {URGENCIES.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={billingFilter} onValueChange={setBillingFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Cobrança" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            {BILLING_MODES.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Projeto" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Projetos</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {systems.length > 0 && (
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Sistema" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Sistemas</SelectItem>
              {systems.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nova Solicitação
        </Button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-10 w-10 text-muted-foreground" />}
          title="Nenhuma solicitação encontrada"
          description="Registre correções, melhorias, novos módulos e integrações."
          action={{ label: "Nova Solicitação", onClick: () => { setEditing(null); setFormOpen(true); } }}
        />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Projeto/Sistema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Cobrança</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const sm = getStatusMeta(c.status);
                const pm = getPriorityMeta(c.priority);
                const context = c.project_id ? projectMap[c.project_id] : c.delivered_system_id ? systemMap[c.delivered_system_id] : "—";
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openDetail(c)}>
                    <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{getLabel(CHANGE_TYPES, c.change_type)}</Badge></TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{context}</TableCell>
                    <TableCell><StatusBadge status={sm.color} label={sm.label} /></TableCell>
                    <TableCell><StatusBadge status={pm.color} label={pm.label} /></TableCell>
                    <TableCell className="text-xs">{getLabel(URGENCIES, c.urgency)}</TableCell>
                    <TableCell className="text-xs">R$ {(c.estimated_cost || 0).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="text-xs">{getLabel(BILLING_MODES, c.billing_mode || "")}</TableCell>
                    <TableCell className="text-xs">{c.assigned_to_name || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.requested_at ? format(new Date(c.requested_at), "dd/MM/yy") : "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true); }}><Edit className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(c, "em_execucao")}><Play className="h-3 w-3 mr-2" /> Em Execução</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(c, "concluida")}><CheckCircle className="h-3 w-3 mr-2" /> Concluir</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleApprove(c, true)}><ThumbsUp className="h-3 w-3 mr-2" /> Aprovar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleApprove(c, false)}><ThumbsDown className="h-3 w-3 mr-2" /> Recusar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(c)}><Copy className="h-3 w-3 mr-2" /> Duplicar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Solicitação" : "Nova Solicitação"}</DialogTitle>
          </DialogHeader>
          <ChangeForm change={editing} onSave={handleSave} onCancel={() => setFormOpen(false)} loading={loading} />
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-lg">{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={getStatusMeta(selected.status).color} label={getStatusMeta(selected.status).label} />
                  <StatusBadge status={getPriorityMeta(selected.priority).color} label={getPriorityMeta(selected.priority).label} />
                  <Badge variant="secondary">{getLabel(CHANGE_TYPES, selected.change_type)}</Badge>
                  <Badge variant="outline">{getLabel(URGENCIES, selected.urgency)}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Projeto:</span> {selected.project_id ? projectMap[selected.project_id] || "—" : "—"}</div>
                  <div><span className="text-muted-foreground">Sistema:</span> {selected.delivered_system_id ? systemMap[selected.delivered_system_id] || "—" : "—"}</div>
                  <div><span className="text-muted-foreground">Solicitante:</span> {selected.requested_by_name || "—"}</div>
                  <div><span className="text-muted-foreground">Responsável:</span> {selected.assigned_to_name || "—"}</div>
                  <div><span className="text-muted-foreground">Cobrança:</span> {getLabel(BILLING_MODES, selected.billing_mode || "")}</div>
                  <div><span className="text-muted-foreground">Custo:</span> R$ {(selected.estimated_cost || 0).toLocaleString("pt-BR")}</div>
                  <div><span className="text-muted-foreground">Horas:</span> {selected.estimated_hours || 0}h</div>
                  <div><span className="text-muted-foreground">Origem:</span> {getLabel(REQUEST_ORIGINS, selected.request_origin || "")}</div>
                </div>

                {selected.short_description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Descrição Curta</h4>
                    <p className="text-sm text-muted-foreground">{selected.short_description}</p>
                  </div>
                )}
                {selected.detailed_description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Descrição Detalhada</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.detailed_description}</p>
                  </div>
                )}
                {selected.internal_notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notas Internas</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.internal_notes}</p>
                  </div>
                )}
                {selected.commercial_notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Notas Comerciais</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.commercial_notes}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setEditing(selected); setFormOpen(true); setDetailOpen(false); }}><Edit className="h-3 w-3 mr-1" /> Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected, "em_execucao")}><Play className="h-3 w-3 mr-1" /> Em Execução</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(selected, "concluida")}><CheckCircle className="h-3 w-3 mr-1" /> Concluir</Button>
                  <Button size="sm" variant="outline" onClick={() => handleApprove(selected, true)}><ThumbsUp className="h-3 w-3 mr-1" /> Aprovar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(selected)}><Copy className="h-3 w-3 mr-1" /> Duplicar</Button>
                </div>

                <Separator />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Histórico</h4>
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum evento.</p>
                  ) : (
                    <div className="space-y-2">
                      {events.slice(0, 20).map((e) => (
                        <div key={e.id} className="flex gap-2 text-xs">
                          <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <span className="font-medium">{e.evento.replace(/_/g, " ")}</span>
                            {e.descricao && <span className="text-muted-foreground"> — {e.descricao}</span>}
                            <div className="text-muted-foreground">{e.criado_em ? format(new Date(e.criado_em), "dd/MM/yy HH:mm") : ""}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
