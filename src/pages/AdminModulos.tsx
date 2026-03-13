import { useEffect, useState } from "react";
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
import { Blocks, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { getModules, saveModule, deleteModule, ProjectModule, MODULE_STATUS, MODULE_TYPES } from "@/lib/project-modules";
import { getProjects, Project } from "@/lib/projects";
import { getDeliveredSystems, DeliveredSystem } from "@/lib/delivered-systems";

const emptyModule: Partial<ProjectModule> = {
  nome: "", descricao: "", status: "planejado", tipo: "funcionalidade",
  prioridade: "media", responsavel: "", progresso: 0, observacoes: "",
  project_id: null, delivered_system_id: null,
};

export default function AdminModulos() {
  const [modules, setModules] = useState<ProjectModule[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<ProjectModule>>(emptyModule);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [m, p, s] = await Promise.all([getModules(), getProjects(), getDeliveredSystems()]);
      setModules(m); setProjects(p); setSystems(s);
    } catch { toast({ title: "Erro ao carregar módulos", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.nome?.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await saveModule(form);
      toast({ title: form.id ? "Módulo atualizado" : "Módulo criado" });
      setOpen(false); setForm(emptyModule); await load();
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este módulo?")) return;
    try { await deleteModule(id); toast({ title: "Módulo excluído" }); await load(); }
    catch { toast({ title: "Erro ao excluir", variant: "destructive" }); }
  }

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.nome]));
  const systemMap = Object.fromEntries(systems.map(s => [s.id, s.nome]));

  const filtered = modules.filter(m => {
    if (search && !m.nome.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && m.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Módulos por Projeto"
        description="Gestão modular dos sistemas entregues e em andamento"
        breadcrumbs={[{ label: "Módulos" }]}
        actions={<Button size="sm" onClick={() => { setForm(emptyModule); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Adicionar Módulo</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <FilterToolbar searchPlaceholder="Buscar módulo..." searchValue={search} onSearchChange={setSearch} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(MODULE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Blocks className="h-10 w-10 text-muted-foreground" />} title="Nenhum módulo encontrado" description="Adicione módulos vinculados a projetos ou sistemas." action={{ label: "Adicionar Módulo", onClick: () => { setForm(emptyModule); setOpen(true); } }} />
      ) : (
        <SectionCard noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Módulo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Projeto/Sistema</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{MODULE_TYPES[m.tipo] || m.tipo}</TableCell>
                  <TableCell className="text-sm">{m.project_id ? projectMap[m.project_id] : m.delivered_system_id ? systemMap[m.delivered_system_id] : "—"}</TableCell>
                  <TableCell><StatusBadge status={MODULE_STATUS[m.status]?.color || "pending"} label={MODULE_STATUS[m.status]?.label || m.status} /></TableCell>
                  <TableCell><div className="flex items-center gap-2 w-24"><Progress value={m.progresso} className="h-2" /><span className="text-xs text-muted-foreground">{m.progresso}%</span></div></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm(m); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar Módulo" : "Novo Módulo"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Nome *</Label><Input value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
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
            <div><Label>Responsável</Label><Input value={form.responsavel || ""} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></div>
            <div><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={form.progresso || 0} onChange={e => setForm({ ...form, progresso: Number(e.target.value) })} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} /></div>
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
