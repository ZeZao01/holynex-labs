import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Loader2, Pencil, ExternalLink, Flag, Clock, DollarSign, Target, Plus, Trash2, CheckCircle2,
  FolderKanban, CalendarDays, Globe, Link2, FileText, PackageCheck, KeyRound, Copy
} from "lucide-react";
import { saveDeliveredSystem, addSystemEvent } from "@/lib/delivered-systems";
import {
  getAccessesByProject, ProjectAccess, ACCESS_TYPES, ENVIRONMENTS, ACCESS_STATUS,
} from "@/lib/project-accesses";
import {
  getProject, saveProject, Project, PROJECT_STATUS, PROJECT_PRIORITY,
  getMilestones, saveMilestone, deleteMilestone, ProjectMilestone, MILESTONE_STATUS,
  getProjectEvents, addProjectEvent, ProjectEvent,
} from "@/lib/projects";

const emptyMilestone: Partial<ProjectMilestone> = {
  titulo: "", descricao: "", status: "pendente", observacoes: "",
};

export default function AdminProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);
  const [events, setEvents] = useState<ProjectEvent[]>([]);
  const [accesses, setAccesses] = useState<ProjectAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Project>>({});
  const [saving, setSaving] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState<Partial<ProjectMilestone>>(emptyMilestone);
  const [milestoneSaving, setMilestoneSaving] = useState(false);

  const loadCb = useCallback(() => { if (id) load(); }, [id]);
  useEffect(() => { if (id) load(); }, [id]);
  useRealtimeSubscription("projects", loadCb);
  useRealtimeSubscription("project_milestones", loadCb);
  useRealtimeSubscription("project_events", loadCb);

  async function load() {
    try {
      const [p, m, e, ac] = await Promise.all([
        getProject(id!),
        getMilestones(id!),
        getProjectEvents(id!),
        getAccessesByProject(id!),
      ]);
      setProject(p);
      setForm(p || {});
      setMilestones(m);
      setEvents(e);
      setAccesses(ac);
    } catch { toast({ title: "Erro ao carregar projeto", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveProject(form);
      await addProjectEvent(id!, "projeto_atualizado", "Dados do projeto atualizados");
      toast({ title: "Projeto salvo" });
      setEditing(false);
      await load();
    } catch { toast({ title: "Erro ao salvar", variant: "destructive" }); }
    finally { setSaving(false); }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      await saveProject({ id: id!, status: newStatus });
      await addProjectEvent(id!, "status_alterado", `Status alterado para ${PROJECT_STATUS[newStatus]?.label || newStatus}`);
      toast({ title: "Status atualizado" });
      await load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleSaveMilestone() {
    if (!milestoneForm.titulo?.trim()) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    setMilestoneSaving(true);
    try {
      const isNew = !milestoneForm.id;
      await saveMilestone({ ...milestoneForm, project_id: id! });
      if (isNew) await addProjectEvent(id!, "marco_criado", `Marco: ${milestoneForm.titulo}`);
      if (milestoneForm.status === "concluido" && !isNew) await addProjectEvent(id!, "marco_concluido", `Marco concluído: ${milestoneForm.titulo}`);
      toast({ title: isNew ? "Marco criado" : "Marco atualizado" });
      setMilestoneOpen(false);
      setMilestoneForm(emptyMilestone);
      await load();
    } catch { toast({ title: "Erro ao salvar marco", variant: "destructive" }); }
    finally { setMilestoneSaving(false); }
  }

  async function handleDeleteMilestone(mId: string) {
    if (!confirm("Excluir este marco?")) return;
    try { await deleteMilestone(mId); toast({ title: "Marco excluído" }); await load(); }
    catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleMarkDelivered() {
    if (!confirm("Marcar projeto como entregue?")) return;
    try {
      await saveProject({ id: id!, status: "entregue", data_conclusao: new Date().toISOString(), progresso: 100 });
      await addProjectEvent(id!, "projeto_entregue", "Projeto marcado como entregue");
      toast({ title: "Projeto marcado como entregue" });
      await load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleConvertToSystem() {
    if (!project || !confirm("Converter projeto em sistema entregue?")) return;
    try {
      const sys = await saveDeliveredSystem({
        nome: project.nome,
        cliente: project.cliente,
        empresa_cliente: project.empresa_cliente,
        nicho: project.nicho,
        tipo_projeto: project.tipo_projeto,
        categoria: project.categoria,
        resumo_curto: project.resumo_executivo || "",
        descricao_interna: project.descricao_interna || project.descricao || "",
        valor_fechado: project.valor_contrato || 0,
        recorrencia_mensal: project.recorrencia_mensal || 0,
        faixa_contratada: project.faixa_contratada || "",
        live_url: project.live_url || "",
        admin_url: project.admin_url || "",
        staging_url: project.staging_url || "",
        repo_url: project.repo_url || "",
        docs_url: project.docs_url || "",
        design_url: project.design_url || "",
        analytics_url: project.analytics_url || "",
        data_entrega: project.data_conclusao || new Date().toISOString(),
        projeto_origem_id: project.id,
        observacoes_tecnicas: project.observacoes || "",
        status_suporte: "sem_suporte",
        status_operacional: "em_uso",
        potencial_reuso: "medio",
        ativo: true,
      });
      await addSystemEvent(sys.id, "convertido_de_projeto", `Convertido do projeto: ${project.nome}`);
      await saveProject({ id: id!, delivered_system_id: sys.id });
      await addProjectEvent(id!, "convertido_em_sistema", `Sistema entregue criado: ${sys.id}`);
      toast({ title: "Sistema entregue criado!" });
      navigate(`/admin/sistemas/${sys.id}`);
    } catch { toast({ title: "Erro ao converter", variant: "destructive" }); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!project) return <div className="text-center py-12 text-muted-foreground">Projeto não encontrado</div>;

  const links = [
    { label: "Live", url: project.live_url, icon: Globe },
    { label: "Admin", url: project.admin_url, icon: ExternalLink },
    { label: "Staging", url: project.staging_url, icon: Link2 },
    { label: "Repo", url: project.repo_url, icon: Link2 },
    { label: "Docs", url: project.docs_url, icon: FileText },
    { label: "Design", url: project.design_url, icon: Link2 },
    { label: "Analytics", url: project.analytics_url, icon: Link2 },
  ].filter(l => l.url);

  const completedMilestones = milestones.filter(m => m.status === "concluido").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={project.nome}
        description={`${project.cliente || project.empresa_cliente || "Sem cliente"} • ${PROJECT_STATUS[project.status]?.label || project.status}`}
        breadcrumbs={[{ label: "Projetos", href: "/admin/projetos" }, { label: project.nome }]}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { setForm(project); setEditing(true); }}><Pencil className="h-4 w-4 mr-1" /> Editar</Button>
            {project.status !== "entregue" && <Button size="sm" onClick={handleMarkDelivered}><CheckCircle2 className="h-4 w-4 mr-1" /> Marcar Entregue</Button>}
            {project.status === "entregue" && !project.delivered_system_id && <Button size="sm" onClick={handleConvertToSystem}><PackageCheck className="h-4 w-4 mr-1" /> Converter em Sistema</Button>}
            {project.delivered_system_id && <Button variant="outline" size="sm" onClick={() => navigate(`/admin/sistemas/${project.delivered_system_id}`)}><PackageCheck className="h-4 w-4 mr-1" /> Ver Sistema</Button>}
            {project.proposta_id && <Button variant="outline" size="sm" onClick={() => navigate(`/admin/propostas/${project.proposta_id}`)}><FileText className="h-4 w-4 mr-1" /> Ver Proposta</Button>}
          </div>
        }
      />

      {/* Stats */}
      <StatsGrid>
        <StatCard title="Status" value={PROJECT_STATUS[project.status]?.label || project.status} icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard title="Prioridade" value={PROJECT_PRIORITY[project.prioridade] || project.prioridade} icon={<Flag className="h-5 w-5" />} />
        <StatCard title="Valor Contrato" value={`R$ ${(project.valor_contrato || 0).toLocaleString("pt-BR")}`} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard title="Progresso" value={`${project.progresso || 0}%`} icon={<Target className="h-5 w-5" />} />
      </StatsGrid>

      {/* Progress bar */}
      <SectionCard title="Progresso Geral">
        <div className="flex items-center gap-4">
          <Progress value={project.progresso || 0} className="h-3 flex-1" />
          <span className="text-lg font-bold text-primary">{project.progresso || 0}%</span>
        </div>
        {milestones.length > 0 && <p className="text-xs text-muted-foreground mt-2">Marcos: {completedMilestones}/{milestones.length} concluídos</p>}
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General info */}
        <SectionCard title="Dados Gerais">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Cliente</span><span>{project.cliente || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span>{project.empresa_cliente || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Tipo</span><span>{project.tipo_projeto || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Categoria</span><span>{project.categoria || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Nicho</span><span>{project.nicho || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Faixa Contratada</span><span>{project.faixa_contratada || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Recorrência</span><span>{project.recorrencia_mensal ? `R$ ${project.recorrencia_mensal.toLocaleString("pt-BR")}/mês` : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Estratégia Origem</span><span>{project.estrategia_comercial_origem || "—"}</span></div>
          </div>
        </SectionCard>

        {/* Responsáveis & Datas */}
        <SectionCard title="Responsáveis & Datas">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Resp. Comercial</span><span>{project.responsavel_comercial || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Resp. Produto</span><span>{project.responsavel_produto || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Resp. Técnico</span><span>{project.responsavel_tecnico || "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Início</span><span>{project.data_inicio ? new Date(project.data_inicio).toLocaleDateString("pt-BR") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Previsão</span><span>{project.data_previsao ? new Date(project.data_previsao).toLocaleDateString("pt-BR") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Conclusão</span><span>{project.data_conclusao ? new Date(project.data_conclusao).toLocaleDateString("pt-BR") : "—"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Atualizado</span><span>{new Date(project.atualizado_em).toLocaleDateString("pt-BR")}</span></div>
          </div>
        </SectionCard>
      </div>

      {/* Resumo e Observações */}
      {(project.resumo_executivo || project.descricao || project.observacoes) && (
        <SectionCard title="Resumo & Observações">
          {project.resumo_executivo && <div className="mb-3"><p className="text-xs font-medium text-muted-foreground mb-1">Resumo Executivo</p><p className="text-sm">{project.resumo_executivo}</p></div>}
          {project.descricao && <div className="mb-3"><p className="text-xs font-medium text-muted-foreground mb-1">Descrição</p><p className="text-sm whitespace-pre-wrap">{project.descricao}</p></div>}
          {project.observacoes && <div><p className="text-xs font-medium text-muted-foreground mb-1">Observações</p><p className="text-sm whitespace-pre-wrap">{project.observacoes}</p></div>}
        </SectionCard>
      )}

      {/* Links */}
      {links.length > 0 && (
        <SectionCard title="Links do Projeto">
          <div className="flex flex-wrap gap-2">
            {links.map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-sm transition-colors">
                <l.icon className="h-3.5 w-3.5" />{l.label}
              </a>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Status change */}
      <SectionCard title="Alterar Status">
        <div className="flex flex-wrap gap-2">
          {Object.entries(PROJECT_STATUS).map(([k, v]) => (
            <Button key={k} variant={project.status === k ? "default" : "outline"} size="sm" onClick={() => handleStatusChange(k)} disabled={project.status === k}>
              {v.label}
            </Button>
          ))}
        </div>
      </SectionCard>

      {/* Milestones */}
      <SectionCard title="Marcos do Projeto" action={<Button size="sm" variant="outline" onClick={() => { setMilestoneForm({ ...emptyMilestone }); setMilestoneOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Marco</Button>}>
        {milestones.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum marco registrado</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Marco</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prevista</TableHead>
                <TableHead>Concluída</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {milestones.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div><span className="font-medium">{m.titulo}</span>{m.descricao && <p className="text-xs text-muted-foreground mt-0.5">{m.descricao}</p>}</div>
                  </TableCell>
                  <TableCell><StatusBadge status={MILESTONE_STATUS[m.status]?.color || "pending"} label={MILESTONE_STATUS[m.status]?.label || m.status} /></TableCell>
                  <TableCell className="text-sm">{m.data_prevista ? new Date(m.data_prevista).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-sm">{m.data_concluida ? new Date(m.data_concluida).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setMilestoneForm(m); setMilestoneOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteMilestone(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>

      {/* Events */}
      <SectionCard title="Histórico">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nenhum evento registrado</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {events.map(e => (
              <div key={e.id} className="flex items-start gap-3 text-sm">
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="font-medium">{e.evento.replace(/_/g, " ")}</p>
                  {e.descricao && <p className="text-muted-foreground text-xs">{e.descricao}</p>}
                  <p className="text-xs text-muted-foreground/60">{new Date(e.criado_em).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Edit dialog */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Projeto</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2"><Label>Nome *</Label><Input value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
            <div><Label>Cliente</Label><Input value={form.cliente || ""} onChange={e => setForm({ ...form, cliente: e.target.value })} /></div>
            <div><Label>Empresa</Label><Input value={form.empresa_cliente || ""} onChange={e => setForm({ ...form, empresa_cliente: e.target.value })} /></div>
            <div><Label>Tipo</Label><Input value={form.tipo_projeto || ""} onChange={e => setForm({ ...form, tipo_projeto: e.target.value })} /></div>
            <div><Label>Categoria</Label><Input value={form.categoria || ""} onChange={e => setForm({ ...form, categoria: e.target.value })} /></div>
            <div><Label>Nicho</Label><Input value={form.nicho || ""} onChange={e => setForm({ ...form, nicho: e.target.value })} /></div>
            <div><Label>Faixa Contratada</Label><Input value={form.faixa_contratada || ""} onChange={e => setForm({ ...form, faixa_contratada: e.target.value })} /></div>
            <div><Label>Resp. Comercial</Label><Input value={form.responsavel_comercial || ""} onChange={e => setForm({ ...form, responsavel_comercial: e.target.value })} /></div>
            <div><Label>Resp. Produto</Label><Input value={form.responsavel_produto || ""} onChange={e => setForm({ ...form, responsavel_produto: e.target.value })} /></div>
            <div><Label>Resp. Técnico</Label><Input value={form.responsavel_tecnico || ""} onChange={e => setForm({ ...form, responsavel_tecnico: e.target.value })} /></div>
            <div><Label>Progresso (%)</Label><Input type="number" min={0} max={100} value={form.progresso || 0} onChange={e => setForm({ ...form, progresso: Number(e.target.value) })} /></div>
            <div><Label>Valor Contrato</Label><Input type="number" value={form.valor_contrato || 0} onChange={e => setForm({ ...form, valor_contrato: Number(e.target.value) })} /></div>
            <div><Label>Recorrência Mensal</Label><Input type="number" value={form.recorrencia_mensal || 0} onChange={e => setForm({ ...form, recorrencia_mensal: Number(e.target.value) })} /></div>
            <div><Label>Live URL</Label><Input value={form.live_url || ""} onChange={e => setForm({ ...form, live_url: e.target.value })} /></div>
            <div><Label>Admin URL</Label><Input value={form.admin_url || ""} onChange={e => setForm({ ...form, admin_url: e.target.value })} /></div>
            <div><Label>Staging URL</Label><Input value={form.staging_url || ""} onChange={e => setForm({ ...form, staging_url: e.target.value })} /></div>
            <div><Label>Repo URL</Label><Input value={form.repo_url || ""} onChange={e => setForm({ ...form, repo_url: e.target.value })} /></div>
            <div><Label>Docs URL</Label><Input value={form.docs_url || ""} onChange={e => setForm({ ...form, docs_url: e.target.value })} /></div>
            <div><Label>Design URL</Label><Input value={form.design_url || ""} onChange={e => setForm({ ...form, design_url: e.target.value })} /></div>
            <div><Label>Analytics URL</Label><Input value={form.analytics_url || ""} onChange={e => setForm({ ...form, analytics_url: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Resumo Executivo</Label><Textarea value={form.resumo_executivo || ""} onChange={e => setForm({ ...form, resumo_executivo: e.target.value })} rows={2} /></div>
            <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={3} /></div>
            <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes || ""} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Milestone dialog */}
      <Dialog open={milestoneOpen} onOpenChange={setMilestoneOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{milestoneForm.id ? "Editar Marco" : "Novo Marco"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Título *</Label><Input value={milestoneForm.titulo || ""} onChange={e => setMilestoneForm({ ...milestoneForm, titulo: e.target.value })} /></div>
            <div><Label>Descrição</Label><Textarea value={milestoneForm.descricao || ""} onChange={e => setMilestoneForm({ ...milestoneForm, descricao: e.target.value })} rows={2} /></div>
            <div>
              <Label>Status</Label>
              <Select value={milestoneForm.status || "pendente"} onValueChange={v => setMilestoneForm({ ...milestoneForm, status: v, ...(v === "concluido" ? { data_concluida: new Date().toISOString() } : {}) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(MILESTONE_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Observações</Label><Textarea value={milestoneForm.observacoes || ""} onChange={e => setMilestoneForm({ ...milestoneForm, observacoes: e.target.value })} rows={2} /></div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setMilestoneOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMilestone} disabled={milestoneSaving}>{milestoneSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{milestoneForm.id ? "Salvar" : "Criar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
