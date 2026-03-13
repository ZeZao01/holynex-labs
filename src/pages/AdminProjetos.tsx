import { useEffect, useState, useCallback } from "react";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { useNavigate } from "react-router-dom";
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
import { FolderKanban, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { getProjects, saveProject, deleteProject, Project, PROJECT_STATUS, PROJECT_PRIORITY } from "@/lib/projects";
import { supabase } from "@/integrations/supabase/client";

const emptyProject: Partial<Project> = {
  nome: "", cliente: "", empresa_cliente: "", descricao: "", tipo_projeto: "Sistema interno",
  nicho: "", status: "planejamento", prioridade: "media", responsavel: "", valor_contrato: 0,
  recorrencia_mensal: 0, progresso: 0, observacoes: "", stack: [],
};

export default function AdminProjetos() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Project>>(emptyProject);
  const [saving, setSaving] = useState(false);
  const [propostas, setPropostas] = useState<{ id: string; nome_cliente: string }[]>([]);

  const loadCb = useCallback(() => { load(); }, []);
  useEffect(() => { load(); }, []);
  useRealtimeSubscription("projects", loadCb);

  async function load() {
    try {
      const [p, { data: props }] = await Promise.all([
        getProjects(),
        supabase.from("propostas").select("id, nome_cliente").eq("status", "aceita").order("criado_em", { ascending: false }),
      ]);
      setProjects(p);
      setPropostas(props || []);
    } catch { toast({ title: "Erro ao carregar projetos", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.nome?.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    setSaving(true);
    try {
      await saveProject(form);
      toast({ title: form.id ? "Projeto atualizado" : "Projeto criado" });
      setOpen(false);
      setForm(emptyProject);
      await load();
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este projeto?")) return;
    try { await deleteProject(id); toast({ title: "Projeto excluído" }); await load(); }
    catch { toast({ title: "Erro ao excluir", variant: "destructive" }); }
  }

  const filtered = projects.filter(p => {
    if (search && !p.nome.toLowerCase().includes(search.toLowerCase()) && !p.cliente.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && p.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos em Andamento"
        description="Gestão completa dos projetos ativos da agência"
        breadcrumbs={[{ label: "Projetos" }]}
        actions={<Button size="sm" onClick={() => { setForm(emptyProject); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Criar Projeto</Button>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <FilterToolbar searchPlaceholder="Buscar projeto..." searchValue={search} onSearchChange={setSearch} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            {Object.entries(PROJECT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-10 w-10 text-muted-foreground" />} title="Nenhum projeto encontrado" description="Crie um projeto ou ajuste os filtros." action={{ label: "Criar Projeto", onClick: () => { setForm(emptyProject); setOpen(true); } }} />
      ) : (
        <SectionCard noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{p.cliente || p.empresa_cliente || "—"}</TableCell>
                  <TableCell><StatusBadge status={PROJECT_STATUS[p.status]?.color || "pending"} label={PROJECT_STATUS[p.status]?.label || p.status} /></TableCell>
                  <TableCell className="text-sm">{PROJECT_PRIORITY[p.prioridade] || p.prioridade}</TableCell>
                  <TableCell><div className="flex items-center gap-2 w-24"><Progress value={p.progresso} className="h-2" /><span className="text-xs text-muted-foreground">{p.progresso}%</span></div></TableCell>
                  <TableCell className="text-right font-medium">R$ {(p.valor_contrato || 0).toLocaleString("pt-BR")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setForm(p); setOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{form.id ? "Editar Projeto" : "Novo Projeto"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Nome do Projeto *</Label><Input value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Cliente</Label><Input value={form.cliente || ""} onChange={e => setForm({ ...form, cliente: e.target.value })} /></div>
            <div><Label>Empresa</Label><Input value={form.empresa_cliente || ""} onChange={e => setForm({ ...form, empresa_cliente: e.target.value })} /></div>
            <div><Label>Tipo</Label><Input value={form.tipo_projeto || ""} onChange={e => setForm({ ...form, tipo_projeto: e.target.value })} /></div>
            <div><Label>Nicho</Label><Input value={form.nicho || ""} onChange={e => setForm({ ...form, nicho: e.target.value })} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status || "planejamento"} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PROJECT_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.prioridade || "media"} onValueChange={v => setForm({ ...form, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PROJECT_PRIORITY).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Responsável</Label><Input value={form.responsavel || ""} onChange={e => setForm({ ...form, responsavel: e.target.value })} /></div>
            <div><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={form.progresso || 0} onChange={e => setForm({ ...form, progresso: Number(e.target.value) })} /></div>
            <div><Label>Valor Contrato (R$)</Label><Input type="number" value={form.valor_contrato || 0} onChange={e => setForm({ ...form, valor_contrato: Number(e.target.value) })} /></div>
            <div><Label>Recorrência Mensal (R$)</Label><Input type="number" value={form.recorrencia_mensal || 0} onChange={e => setForm({ ...form, recorrencia_mensal: Number(e.target.value) })} /></div>
            {propostas.length > 0 && (
              <div>
                <Label>Vincular à Proposta</Label>
                <Select value={form.proposta_id || "none"} onValueChange={v => setForm({ ...form, proposta_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {propostas.map(p => <SelectItem key={p.id} value={p.id}>{p.nome_cliente}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} /></div>
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
