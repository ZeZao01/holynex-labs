import { useEffect, useState, useCallback } from "react";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAccessControl } from "@/hooks/useAccessControl";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { Blocks, Plus, Pencil, Trash2, Loader2, Copy, Clock } from "lucide-react";
import {
  getModules, saveModule, deleteModule, addModuleEvent, getModuleEvents,
  ProjectModule, ModuleEvent, MODULE_STATUS, MODULE_TYPES, MODULE_CATEGORIES,
  REUSABILITY_TYPES, COMPLEXITY_LEVELS, FUNCTIONAL_PRIORITIES,
} from "@/lib/project-modules";
import { getProjects, Project } from "@/lib/projects";
import { getDeliveredSystems, DeliveredSystem } from "@/lib/delivered-systems";
import { format } from "date-fns";

const emptyModule: Partial<ProjectModule> = {
  nome: "", descricao: "", status: "planejado", tipo: "funcionalidade",
  prioridade: "media", responsavel: "", progresso: 0, observacoes: "",
  project_id: null, delivered_system_id: null,
  module_key: "", category: "core", short_description: "", internal_description: "",
  is_delivered: false, reusability_type: "nao", complexity_level: "moderada",
  functional_priority: "importante", depends_on_module_id: null,
};

export default function AdminModulos() {
  const { canCreate, canEdit, canDelete, guardAction } = useAccessControl();
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterReuse, setFilterReuse] = useState("all");
  const [filterComplexity, setFilterComplexity] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailModule, setDetailModule] = useState<ProjectModule | null>(null);
  const [detailEvents, setDetailEvents] = useState<ModuleEvent[]>([]);
  const [form, setForm] = useState<Partial<ProjectModule>>(emptyModule);
  const [saving, setSaving] = useState(false);

  const loadCb = useCallback(() => load(), []);
  useEffect(() => { load(); }, []);
  useRealtimeSubscription("project_modules", loadCb);

  async function load() {
    try {
      const [m, p, s] = await Promise.all([getModules(), getProjects(), getDeliveredSystems()]);
      setModules(m); setProjects(p); setSystems(s);
    } catch { toast({ title: "Erro ao carregar módulos", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.nome?.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    const action = form.id ? "editar" : "criar";
    const allowed = await guardAction("modulos", action, {
      description: `Tentativa de ${action} módulo`,
      metadata: { moduleId: form.id || null },
    });
    if (!allowed) {
      toast({ title: "Sem permissão para salvar módulo", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const isNew = !form.id;
      const saved = await saveModule(form);
      await addModuleEvent(saved.id, isNew ? "modulo_criado" : "modulo_editado", `Módulo ${isNew ? "criado" : "editado"}: ${form.nome}`);
      toast({ title: isNew ? "Módulo criado" : "Módulo atualizado" });
      setOpen(false); setForm(emptyModule); await load();
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    const allowed = await guardAction("modulos", "excluir", {
      description: "Tentativa de exclusão de módulo",
      severity: "high",
      metadata: { moduleId: id },
    });
    if (!allowed) {
      toast({ title: "Sem permissão para excluir módulo", variant: "destructive" });
      return;
    }
    if (!confirm("Excluir este módulo?")) return;
    try { await deleteModule(id); toast({ title: "Módulo excluído" }); await load(); }
    catch { toast({ title: "Erro ao excluir", variant: "destructive" }); }
  }

  async function handleDuplicate(m: ProjectModule) {
    const allowed = await guardAction("modulos", "criar", {
      description: "Tentativa de duplicação de módulo",
      metadata: { moduleId: m.id },
    });
    if (!allowed) {
      toast({ title: "Sem permissão para duplicar módulo", variant: "destructive" });
      return;
    }
    try {
      const { id, criado_em, atualizado_em, ...rest } = m;
      const dup = await saveModule({ ...rest, nome: `${m.nome} (Cópia)` });
      await addModuleEvent(dup.id, "modulo_criado", `Duplicado de: ${m.nome}`);
      toast({ title: "Módulo duplicado" });
      await load();
    } catch { toast({ title: "Erro ao duplicar", variant: "destructive" }); }
  }

  async function openDetail(m: ProjectModule) {
    setDetailModule(m);
    setDetailOpen(true);
    try {
      const ev = await getModuleEvents(m.id);
      setDetailEvents(ev);
    } catch { setDetailEvents([]); }
  }

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.nome]));
  const systemMap = Object.fromEntries(systems.map(s => [s.id, s.nome]));

  const filtered = modules.filter(m => {
    if (search && !m.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    if (filterCategory !== "all" && m.category !== filterCategory) return false;
    if (filterReuse !== "all" && m.reusability_type !== filterReuse) return false;
    if (filterComplexity !== "all" && m.complexity_level !== filterComplexity) return false;
    if (filterPriority !== "all" && m.functional_priority !== filterPriority) return false;
    if (filterProject !== "all" && m.project_id !== filterProject) return false;
    if (filterSystem !== "all" && m.delivered_system_id !== filterSystem) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
        <PageHeader
          title="Módulos por Projeto"
          description="Gestão modular dos sistemas entregues e em andamento"
          breadcrumbs={[{ label: "Módulos" }]}
          actions={
            <Button
              size="sm"
              onClick={async () => {
                if (!canCreate("modulos")) {
                  await guardAction("modulos", "criar", { description: "Tentativa de criar módulo" });
                  toast({ title: "Sem permissão para criar módulo", variant: "destructive" });
                  return;
                }
                setForm(emptyModule);
                setOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Adicionar Módulo
            </Button>
          }
        />

      <div className="flex flex-wrap items-center gap-3">
        <FilterToolbar searchPlaceholder="Buscar módulo..." searchValue={search} onSearchChange={setSearch} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(MODULE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {Object.entries(MODULE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterReuse} onValueChange={setFilterReuse}>
          <SelectTrigger className="w-[170px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Reutilização</SelectItem>
            {Object.entries(REUSABILITY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterComplexity} onValueChange={setFilterComplexity}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Complexidade</SelectItem>
            {Object.entries(COMPLEXITY_LEVELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridade</SelectItem>
            {Object.entries(FUNCTIONAL_PRIORITIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {projects.length > 0 && (
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos projetos</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {systems.length > 0 && (
          <Select value={filterSystem} onValueChange={setFilterSystem}>
            <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos sistemas</SelectItem>
              {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Blocks className="h-10 w-10 text-muted-foreground" />}
          title="Nenhum módulo encontrado"
          description="Adicione módulos vinculados a projetos ou sistemas."
          action={{
            label: "Adicionar Módulo",
            onClick: async () => {
              if (!canCreate("modulos")) {
                await guardAction("modulos", "criar", { description: "Tentativa de criar módulo" });
                toast({ title: "Sem permissão para criar módulo", variant: "destructive" });
                return;
              }
              setForm(emptyModule);
              setOpen(true);
            },
          }}
        />
      ) : (
        <SectionCard noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Projeto/Sistema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reuso</TableHead>
                <TableHead>Complexidade</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(m)}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{m.nome}</p>
                      {m.short_description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{m.short_description}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{MODULE_CATEGORIES[m.category] || m.category || MODULE_TYPES[m.tipo] || m.tipo}</TableCell>
                  <TableCell className="text-sm">{m.project_id ? projectMap[m.project_id] : m.delivered_system_id ? systemMap[m.delivered_system_id] : "—"}</TableCell>
                  <TableCell><StatusBadge status={MODULE_STATUS[m.status]?.color || "pending"} label={MODULE_STATUS[m.status]?.label || m.status} /></TableCell>
                  <TableCell>{REUSABILITY_TYPES[m.reusability_type] && <StatusBadge status={REUSABILITY_TYPES[m.reusability_type].color} label={REUSABILITY_TYPES[m.reusability_type].label} />}</TableCell>
                  <TableCell>{COMPLEXITY_LEVELS[m.complexity_level] && <StatusBadge status={COMPLEXITY_LEVELS[m.complexity_level].color} label={COMPLEXITY_LEVELS[m.complexity_level].label} />}</TableCell>
                  <TableCell>{FUNCTIONAL_PRIORITIES[m.functional_priority] && <StatusBadge status={FUNCTIONAL_PRIORITIES[m.functional_priority].color} label={FUNCTIONAL_PRIORITIES[m.functional_priority].label} />}</TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!canEdit("modulos")}
                        onClick={() => {
                          if (!canEdit("modulos")) {
                            void guardAction("modulos", "editar", { description: "Tentativa de editar módulo" });
                            toast({ title: "Sem permissão para editar", variant: "destructive" });
                            return;
                          }
                          setForm(m);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(m)}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        disabled={!canDelete("modulos")}
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailModule && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Blocks className="h-5 w-5 text-primary" />
                  {detailModule.nome}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={MODULE_STATUS[detailModule.status]?.color || "pending"} label={MODULE_STATUS[detailModule.status]?.label || detailModule.status} />
                  {REUSABILITY_TYPES[detailModule.reusability_type] && <StatusBadge status={REUSABILITY_TYPES[detailModule.reusability_type].color} label={REUSABILITY_TYPES[detailModule.reusability_type].label} />}
                  {COMPLEXITY_LEVELS[detailModule.complexity_level] && <StatusBadge status={COMPLEXITY_LEVELS[detailModule.complexity_level].color} label={COMPLEXITY_LEVELS[detailModule.complexity_level].label} />}
                  {FUNCTIONAL_PRIORITIES[detailModule.functional_priority] && <StatusBadge status={FUNCTIONAL_PRIORITIES[detailModule.functional_priority].color} label={FUNCTIONAL_PRIORITIES[detailModule.functional_priority].label} />}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Categoria:</span> {MODULE_CATEGORIES[detailModule.category] || detailModule.category}</div>
                  <div><span className="text-muted-foreground">Tipo:</span> {MODULE_TYPES[detailModule.tipo] || detailModule.tipo}</div>
                  <div><span className="text-muted-foreground">Projeto:</span> {detailModule.project_id ? projectMap[detailModule.project_id] || "—" : "—"}</div>
                  <div><span className="text-muted-foreground">Sistema:</span> {detailModule.delivered_system_id ? systemMap[detailModule.delivered_system_id] || "—" : "—"}</div>
                  <div><span className="text-muted-foreground">Responsável:</span> {detailModule.responsavel || "—"}</div>
                  <div><span className="text-muted-foreground">Progresso:</span> {detailModule.progresso}%</div>
                  {detailModule.depends_on_module_id && (
                    <div className="col-span-2"><span className="text-muted-foreground">Depende de:</span> {modules.find(x => x.id === detailModule.depends_on_module_id)?.nome || detailModule.depends_on_module_id}</div>
                  )}
                </div>
                {detailModule.short_description && <div><h4 className="text-sm font-medium mb-1">Descrição Curta</h4><p className="text-sm text-muted-foreground">{detailModule.short_description}</p></div>}
                {detailModule.descricao && <div><h4 className="text-sm font-medium mb-1">Descrição</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailModule.descricao}</p></div>}
                {detailModule.internal_description && <div><h4 className="text-sm font-medium mb-1">Descrição Interna</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailModule.internal_description}</p></div>}
                {detailModule.observacoes && <div><h4 className="text-sm font-medium mb-1">Observações</h4><p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailModule.observacoes}</p></div>}

                {/* Events */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Histórico</h4>
                  {detailEvents.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sem eventos registrados.</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {detailEvents.map(e => (
                        <div key={e.id} className="flex gap-2 text-xs">
                          <Clock className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                          <div>
                            <span className="font-medium">{e.evento.replace(/_/g, " ")}</span>
                            {e.descricao && <span className="text-muted-foreground"> — {e.descricao}</span>}
                            <div className="text-muted-foreground">{format(new Date(e.criado_em), "dd/MM/yyyy HH:mm")}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canEdit("modulos")}
                    onClick={() => {
                      if (!canEdit("modulos")) {
                        void guardAction("modulos", "editar", { description: "Tentativa de editar módulo" });
                        toast({ title: "Sem permissão para editar", variant: "destructive" });
                        return;
                      }
                      setForm(detailModule);
                      setDetailOpen(false);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { handleDuplicate(detailModule); setDetailOpen(false); }}><Copy className="h-3.5 w-3.5 mr-1" /> Duplicar</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Nome *</Label><Input value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Module Key</Label><Input placeholder="ex: auth, crm, billing" value={form.module_key || ""} onChange={e => setForm({ ...form, module_key: e.target.value })} /></div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category || "core"} onValueChange={v => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MODULE_CATEGORIES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo || "funcionalidade"} onValueChange={v => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MODULE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "planejado"} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MODULE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reutilização</Label>
              <Select value={form.reusability_type || "nao"} onValueChange={v => setForm({ ...form, reusability_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(REUSABILITY_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Complexidade</Label>
              <Select value={form.complexity_level || "moderada"} onValueChange={v => setForm({ ...form, complexity_level: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(COMPLEXITY_LEVELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade Funcional</Label>
              <Select value={form.functional_priority || "importante"} onValueChange={v => setForm({ ...form, functional_priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(FUNCTIONAL_PRIORITIES).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div>
                <Label>Projeto</Label>
                <Select value={form.project_id || "none"} onValueChange={v => setForm({ ...form, project_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Nenhum</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {systems.length > 0 && (
              <div>
                <Label>Sistema Entregue</Label>
                <Select value={form.delivered_system_id || "none"} onValueChange={v => setForm({ ...form, delivered_system_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Nenhum</SelectItem>{systems.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            {modules.length > 0 && (
              <div>
                <Label>Depende de</Label>
                <Select value={form.depends_on_module_id || "none"} onValueChange={v => setForm({ ...form, depends_on_module_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">Nenhum</SelectItem>{modules.filter(x => x.id !== form.id).map(x => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Responsável</Label><Input value={form.responsavel || ""} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></div>
            <div><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={form.progresso || 0} onChange={e => setForm({ ...form, progresso: Number(e.target.value) })} /></div>
            <div className="md:col-span-2"><Label>Descrição Curta</Label><Input value={form.short_description || ""} onChange={e => setForm({ ...form, short_description: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2"><Label>Descrição Interna</Label><Textarea value={form.internal_description || ""} onChange={e => setForm({ ...form, internal_description: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes || ""} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{form.id ? "Salvar" : "Criar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
