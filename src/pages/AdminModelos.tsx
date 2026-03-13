import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import StatsGrid from "@/components/admin/StatsGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  LayoutTemplate, Plus, Edit, Trash2, Eye, EyeOff, Star, MoreHorizontal, Loader2,
  ExternalLink, Copy, Layers, Package, Clock, X,
} from "lucide-react";
import {
  ProjectModel, ModelTier, ModelModule,
  listModels, saveModel, deleteModel, addModelEvent,
  listModelTiers, saveModelTier, deleteModelTier,
  listModelModules, saveModelModule, deleteModelModule,
  listModelEvents,
  MODEL_CATEGORIES, AVAILABILITY_STATUSES, TIER_TYPES, MODULE_SCOPES, MODEL_BADGES, MODULE_CATEGORIES,
  generateSlug, ModelEvent,
} from "@/lib/project-models";
import { supabase } from "@/integrations/supabase/client";

export default function AdminModelos() {
  const navigate = useNavigate();
  const [models, setModels] = useState<ProjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectModel | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailModel, setDetailModel] = useState<ProjectModel | null>(null);
  const [tiers, setTiers] = useState<ModelTier[]>([]);
  const [modules, setModules] = useState<ModelModule[]>([]);
  const [events, setEvents] = useState<ModelEvent[]>([]);
  const [detailTab, setDetailTab] = useState("tiers");

  // Systems for linking
  const [systems, setSystems] = useState<{ id: string; nome: string }[]>([]);

  const load = useCallback(async () => {
    try {
      setModels(await listModels());
    } catch {
      toast({ title: "Erro ao carregar modelos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); loadSystems(); }, []);
  useRealtimeSubscription("project_models", load);

  async function loadSystems() {
    const { data } = await supabase.from("delivered_systems").select("id, nome").order("nome");
    setSystems(data || []);
  }

  async function openDetail(model: ProjectModel) {
    setDetailModel(model);
    setDetailOpen(true);
    setDetailTab("tiers");
    const [t, m, e] = await Promise.all([
      listModelTiers(model.id),
      listModelModules(model.id),
      listModelEvents(model.id),
    ]);
    setTiers(t);
    setModules(m);
    setEvents(e);
  }

  // ── Filters ──
  const filtered = models.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.niche.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && m.availability_status !== filterStatus) return false;
    if (filterCategory !== "all" && m.category !== filterCategory) return false;
    return true;
  });

  const stats = [
    { label: "Total", value: models.length },
    { label: "Ativos", value: models.filter(m => m.is_active).length },
    { label: "Destaque", value: models.filter(m => m.is_featured).length },
    { label: "Disponíveis", value: models.filter(m => m.availability_status === "disponivel").length },
  ];

  // ── Save ──
  async function handleSave(data: Partial<ProjectModel>) {
    setSaving(true);
    try {
      const saved = await saveModel({ ...data, id: editing?.id });
      await addModelEvent(saved.id, editing ? "modelo_editado" : "modelo_criado");
      toast({ title: editing ? "Modelo atualizado!" : "Modelo criado!" });
      setFormOpen(false);
      setEditing(null);
      load();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(m: ProjectModel) {
    await saveModel({ id: m.id, is_active: !m.is_active });
    await addModelEvent(m.id, m.is_active ? "desativado" : "ativado");
    toast({ title: m.is_active ? "Desativado" : "Ativado" });
    load();
  }

  async function handleToggleFeatured(m: ProjectModel) {
    await saveModel({ id: m.id, is_featured: !m.is_featured });
    await addModelEvent(m.id, m.is_featured ? "removido_destaque" : "destacado");
    toast({ title: "Atualizado!" });
    load();
  }

  async function handleDelete(m: ProjectModel) {
    if (!confirm("Excluir este modelo?")) return;
    await deleteModel(m.id);
    toast({ title: "Modelo excluído" });
    load();
  }

  async function handleDuplicate(m: ProjectModel) {
    const { id, criado_em, atualizado_em, slug, ...rest } = m;
    const newModel = await saveModel({ ...rest, title: `${m.title} (cópia)`, is_active: false });
    // Copy tiers
    const existingTiers = await listModelTiers(m.id);
    for (const t of existingTiers) {
      const { id: _, criado_em: __, ...tierData } = t;
      await saveModelTier({ ...tierData, model_id: newModel.id });
    }
    // Copy modules
    const existingModules = await listModelModules(m.id);
    for (const mod of existingModules) {
      const { id: _, criado_em: __, ...modData } = mod;
      await saveModelModule({ ...modData, model_id: newModel.id, tier_id: null });
    }
    await addModelEvent(newModel.id, "modelo_duplicado", `Origem: ${m.title}`);
    toast({ title: "Modelo duplicado!" });
    load();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projetos Modelo"
        description="Gerencie modelos comercializáveis com versões, módulos e páginas de oferta"
        breadcrumbs={[{ label: "Modelos" }]}
        actions={<Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Novo Modelo</Button>}
      />

      <StatsGrid columns={4}>
        {stats.map(s => (
          <StatCard key={s.label} title={s.label} value={s.value} />
        ))}
      </StatsGrid>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <FilterToolbar searchPlaceholder="Buscar modelo..." searchValue={search} onSearchChange={setSearch} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            {AVAILABILITY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {MODEL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="h-10 w-10 text-muted-foreground" />}
          title="Nenhum modelo cadastrado"
          description="Crie modelos com versões e módulos para comercializar."
          action={{ label: "Criar Modelo", onClick: () => { setEditing(null); setFormOpen(true); } }}
        />
      ) : (
        <SectionCard noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>Faixa</TableHead>
                <TableHead>Disponibilidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(m => (
                <TableRow key={m.id} className="cursor-pointer hover:bg-muted/30" onClick={() => openDetail(m)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {m.thumbnail_url ? (
                        <img src={m.thumbnail_url} alt="" className="h-10 w-14 rounded object-cover" />
                      ) : (
                        <div className="h-10 w-14 rounded bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{m.title.charAt(0)}</div>
                      )}
                      <div>
                        <span className="font-medium">{m.title}</span>
                        {m.subtitle && <p className="text-xs text-muted-foreground">{m.subtitle}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{m.category || "—"}</TableCell>
                  <TableCell className="text-sm">{m.niche || "—"}</TableCell>
                  <TableCell className="text-sm">{m.investment_range || "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {AVAILABILITY_STATUSES.find(s => s.value === m.availability_status)?.label || m.availability_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <StatusBadge status={m.is_active ? "active" : "paused"} label={m.is_active ? "Ativo" : "Inativo"} />
                      {m.is_featured && <Badge variant="outline" className="text-[10px]">⭐</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); setEditing(m); setFormOpen(true); }}><Edit className="h-3 w-3 mr-2" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleToggleActive(m); }}>{m.is_active ? <><EyeOff className="h-3 w-3 mr-2" /> Desativar</> : <><Eye className="h-3 w-3 mr-2" /> Ativar</>}</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleToggleFeatured(m); }}><Star className="h-3 w-3 mr-2" /> {m.is_featured ? "Remover Destaque" : "Destacar"}</DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDuplicate(m); }}><Copy className="h-3 w-3 mr-2" /> Duplicar</DropdownMenuItem>
                        {m.slug && <DropdownMenuItem onClick={e => { e.stopPropagation(); window.open(`/modelos/${m.slug}`, "_blank"); }}><ExternalLink className="h-3 w-3 mr-2" /> Ver Página Pública</DropdownMenuItem>}
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); handleDelete(m); }} className="text-destructive"><Trash2 className="h-3 w-3 mr-2" /> Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Modelo" : "Novo Projeto Modelo"}</DialogTitle></DialogHeader>
          <ModelForm model={editing} systems={systems} onSave={handleSave} onCancel={() => setFormOpen(false)} loading={saving} />
        </DialogContent>
      </Dialog>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{detailModel?.title}</SheetTitle>
          </SheetHeader>
          {detailModel && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{AVAILABILITY_STATUSES.find(s => s.value === detailModel.availability_status)?.label}</Badge>
                {detailModel.investment_range && <Badge variant="secondary">{detailModel.investment_range}</Badge>}
                {detailModel.base_deadline && <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />{detailModel.base_deadline}</Badge>}
              </div>
              {detailModel.commercial_description && <p className="text-sm text-muted-foreground">{detailModel.commercial_description}</p>}

              <Tabs value={detailTab} onValueChange={setDetailTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="tiers"><Layers className="h-3 w-3 mr-1" /> Versões ({tiers.length})</TabsTrigger>
                  <TabsTrigger value="modules"><Package className="h-3 w-3 mr-1" /> Módulos ({modules.length})</TabsTrigger>
                  <TabsTrigger value="events"><Clock className="h-3 w-3 mr-1" /> Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="tiers" className="space-y-3 mt-3">
                  <TierManager modelId={detailModel.id} tiers={tiers} onUpdate={async () => setTiers(await listModelTiers(detailModel.id))} />
                </TabsContent>

                <TabsContent value="modules" className="space-y-3 mt-3">
                  <ModuleManager modelId={detailModel.id} modules={modules} tiers={tiers} onUpdate={async () => setModules(await listModelModules(detailModel.id))} />
                </TabsContent>

                <TabsContent value="events" className="mt-3">
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {events.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum evento registrado.</p> : events.map(e => (
                      <div key={e.id} className="flex items-start gap-2 text-xs border-b border-border/30 pb-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">{e.evento}</Badge>
                        <span className="text-muted-foreground">{e.descricao}</span>
                        <span className="ml-auto text-muted-foreground/50 shrink-0">{new Date(e.criado_em).toLocaleDateString("pt-BR")}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Model Form ──
function ModelForm({ model, systems, onSave, onCancel, loading }: {
  model: ProjectModel | null;
  systems: { id: string; nome: string }[];
  onSave: (data: Partial<ProjectModel>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<Partial<ProjectModel>>({
    title: "", subtitle: "", category: "", niche: "", value_proposition: "",
    target_audience: "", problem_solved: "", commercial_description: "",
    investment_range: "", base_deadline: "", availability_status: "disponivel",
    is_featured: false, is_active: true, cta_primary_label: "Quero esse modelo",
    cta_secondary_label: "Solicitar orçamento", thumbnail_url: "", cover_image_url: "",
    gallery_urls: [], video_url: "", badges: [], how_it_works: "",
    display_order: 0, delivered_system_id: null,
  });

  useEffect(() => { if (model) setForm(model); }, [model]);

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  function toggleBadge(b: string) {
    const curr = form.badges || [];
    set("badges", curr.includes(b) ? curr.filter(x => x !== b) : [...curr, b]);
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
          <TabsTrigger value="midia">Mídia</TabsTrigger>
          <TabsTrigger value="config">Config</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-3 mt-3">
          <div><Label>Nome do Modelo *</Label><Input value={form.title || ""} onChange={e => set("title", e.target.value)} required /></div>
          <div><Label>Subtítulo</Label><Input value={form.subtitle || ""} onChange={e => set("subtitle", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.category || "none"} onValueChange={v => set("category", v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {MODEL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Nicho</Label><Input value={form.niche || ""} onChange={e => set("niche", e.target.value)} /></div>
            <div>
              <Label>Disponibilidade</Label>
              <Select value={form.availability_status || "disponivel"} onValueChange={v => set("availability_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AVAILABILITY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Faixa de Investimento</Label><Input value={form.investment_range || ""} onChange={e => set("investment_range", e.target.value)} placeholder="Ex: R$ 8.000 - R$ 15.000" /></div>
            <div><Label>Prazo Base</Label><Input value={form.base_deadline || ""} onChange={e => set("base_deadline", e.target.value)} placeholder="Ex: 15-25 dias" /></div>
            <div>
              <Label>Sistema Entregue</Label>
              <Select value={form.delivered_system_id || "none"} onValueChange={v => set("delivered_system_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {systems.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="conteudo" className="space-y-3 mt-3">
          <div><Label>Proposta de Valor</Label><Textarea rows={2} value={form.value_proposition || ""} onChange={e => set("value_proposition", e.target.value)} /></div>
          <div><Label>Público-Alvo</Label><Textarea rows={2} value={form.target_audience || ""} onChange={e => set("target_audience", e.target.value)} /></div>
          <div><Label>Problema que Resolve</Label><Textarea rows={2} value={form.problem_solved || ""} onChange={e => set("problem_solved", e.target.value)} /></div>
          <div><Label>Descrição Comercial</Label><Textarea rows={3} value={form.commercial_description || ""} onChange={e => set("commercial_description", e.target.value)} /></div>
          <div><Label>Como Funciona</Label><Textarea rows={3} value={form.how_it_works || ""} onChange={e => set("how_it_works", e.target.value)} placeholder="Escolha → Adaptação → Entrega → Expansão" /></div>
          <div>
            <Label>Badges</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {MODEL_BADGES.map(b => (
                <Badge key={b} variant={(form.badges || []).includes(b) ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => toggleBadge(b)}>{b}</Badge>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="midia" className="space-y-3 mt-3">
          <div><Label>Thumbnail URL</Label><Input value={form.thumbnail_url || ""} onChange={e => set("thumbnail_url", e.target.value)} /></div>
          <div><Label>Capa URL</Label><Input value={form.cover_image_url || ""} onChange={e => set("cover_image_url", e.target.value)} /></div>
          <div><Label>Vídeo/Demo URL</Label><Input value={form.video_url || ""} onChange={e => set("video_url", e.target.value)} /></div>
        </TabsContent>

        <TabsContent value="config" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>CTA Principal</Label><Input value={form.cta_primary_label || ""} onChange={e => set("cta_primary_label", e.target.value)} /></div>
            <div><Label>CTA Secundário</Label><Input value={form.cta_secondary_label || ""} onChange={e => set("cta_secondary_label", e.target.value)} /></div>
            <div><Label>Ordem de Exibição</Label><Input type="number" value={form.display_order || 0} onChange={e => set("display_order", Number(e.target.value))} /></div>
          </div>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2"><Switch checked={form.is_active ?? true} onCheckedChange={v => set("is_active", v)} /><Label>Ativo</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_featured ?? false} onCheckedChange={v => set("is_featured", v)} /><Label>Destaque</Label></div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
      </div>
    </form>
  );
}

// ── Tier Manager ──
function TierManager({ modelId, tiers, onUpdate }: { modelId: string; tiers: ModelTier[]; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ tier_type: "starter", name: "", description: "", price_range: "", estimated_days: 0, ideal_client_profile: "", is_recommended: false });

  async function handleAdd() {
    if (!form.name) return;
    await saveModelTier({ ...form, model_id: modelId, display_order: tiers.length });
    await addModelEvent(modelId, "tier_criado", form.name);
    setForm({ tier_type: "starter", name: "", description: "", price_range: "", estimated_days: 0, ideal_client_profile: "", is_recommended: false });
    setAdding(false);
    onUpdate();
  }

  async function handleDelete(t: ModelTier) {
    await deleteModelTier(t.id);
    await addModelEvent(modelId, "tier_removido", t.name);
    onUpdate();
  }

  async function toggleRecommended(t: ModelTier) {
    // Remove recommended from all, set on this one
    for (const tier of tiers) {
      if (tier.id !== t.id && tier.is_recommended) await saveModelTier({ id: tier.id, is_recommended: false });
    }
    await saveModelTier({ id: t.id, is_recommended: !t.is_recommended });
    onUpdate();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">Versões da Oferta</Label>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
      </div>

      {tiers.map(t => (
        <div key={t.id} className={`rounded-lg border p-3 space-y-1 ${t.is_recommended ? "border-primary/50 bg-primary/5" : "border-border"}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-sm">{t.name}</span>
              <Badge variant="outline" className="ml-2 text-[10px]">{TIER_TYPES.find(x => x.value === t.tier_type)?.label}</Badge>
              {t.is_recommended && <Badge className="ml-1 text-[10px]">Recomendada</Badge>}
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => toggleRecommended(t)}><Star className="h-3 w-3" /></Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDelete(t)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </div>
          {t.price_range && <p className="text-xs text-primary font-medium">{t.price_range}</p>}
          {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
          {t.estimated_days > 0 && <p className="text-xs text-muted-foreground">{t.estimated_days} dias</p>}
          {t.ideal_client_profile && <p className="text-xs text-muted-foreground/70">Perfil: {t.ideal_client_profile}</p>}
        </div>
      ))}

      {adding && (
        <div className="rounded-lg border border-dashed border-primary/40 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tier_type} onValueChange={v => setForm(p => ({ ...p, tier_type: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TIER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Faixa de Valor</Label><Input value={form.price_range} onChange={e => setForm(p => ({ ...p, price_range: e.target.value }))} className="h-8 text-xs" placeholder="R$ 5.000 - R$ 10.000" /></div>
            <div><Label className="text-xs">Prazo (dias)</Label><Input type="number" value={form.estimated_days || ""} onChange={e => setForm(p => ({ ...p, estimated_days: Number(e.target.value) }))} className="h-8 text-xs" /></div>
          </div>
          <div><Label className="text-xs">Descrição</Label><Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="text-xs" /></div>
          <div><Label className="text-xs">Perfil Ideal do Cliente</Label><Input value={form.ideal_client_profile} onChange={e => setForm(p => ({ ...p, ideal_client_profile: e.target.value }))} className="h-8 text-xs" /></div>
          <div className="flex items-center gap-2"><Switch checked={form.is_recommended} onCheckedChange={v => setForm(p => ({ ...p, is_recommended: v }))} /><Label className="text-xs">Recomendada</Label></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Module Manager ──
function ModuleManager({ modelId, modules, tiers, onUpdate }: { modelId: string; modules: ModelModule[]; tiers: ModelTier[]; onUpdate: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Core", is_required: true, scope_in_tier: "included", tier_id: null as string | null, notes: "" });

  async function handleAdd() {
    if (!form.name) return;
    await saveModelModule({ ...form, model_id: modelId, display_order: modules.length });
    await addModelEvent(modelId, "modulo_adicionado", form.name);
    setForm({ name: "", category: "Core", is_required: true, scope_in_tier: "included", tier_id: null, notes: "" });
    setAdding(false);
    onUpdate();
  }

  async function handleDelete(m: ModelModule) {
    await deleteModelModule(m.id);
    await addModelEvent(modelId, "modulo_removido", m.name);
    onUpdate();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label className="text-sm font-semibold">Módulos do Modelo</Label>
        <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-3 w-3 mr-1" /> Adicionar</Button>
      </div>

      {modules.map(m => (
        <div key={m.id} className="flex items-center gap-2 text-xs border-b border-border/30 pb-2">
          <Badge variant="outline" className="text-[10px]">{m.category}</Badge>
          <span className="font-medium">{m.name}</span>
          <Badge variant={m.is_required ? "default" : "secondary"} className="text-[10px]">{m.is_required ? "Obrigatório" : "Opcional"}</Badge>
          <Badge variant="outline" className="text-[10px]">{MODULE_SCOPES.find(s => s.value === m.scope_in_tier)?.label}</Badge>
          {m.tier_id && <Badge variant="secondary" className="text-[10px]">{tiers.find(t => t.id === m.tier_id)?.name || "—"}</Badge>}
          <Button size="icon" variant="ghost" className="h-5 w-5 ml-auto" onClick={() => handleDelete(m)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
        </div>
      ))}

      {adding && (
        <div className="rounded-lg border border-dashed border-primary/40 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Nome *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="h-8 text-xs" /></div>
            <div>
              <Label className="text-xs">Categoria</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{MODULE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Escopo no Tier</Label>
              <Select value={form.scope_in_tier} onValueChange={v => setForm(p => ({ ...p, scope_in_tier: v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{MODULE_SCOPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Vinculado ao Tier</Label>
              <Select value={form.tier_id || "none"} onValueChange={v => setForm(p => ({ ...p, tier_id: v === "none" ? null : v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todos os tiers</SelectItem>
                  {tiers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.is_required} onCheckedChange={v => setForm(p => ({ ...p, is_required: v }))} /><Label className="text-xs">Obrigatório</Label></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Salvar</Button>
            <Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
