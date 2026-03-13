import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge from "@/components/admin/StatusBadge";
import AccessForm from "@/components/admin/AccessForm";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  getProjectAccesses, saveProjectAccess, deleteProjectAccess, addAccessEvent, getAccessEvents,
  ProjectAccess, AccessEvent, ACCESS_TYPES, ENVIRONMENTS, ACCESS_STATUS,
  maskSecret, getAccessAlerts,
} from "@/lib/project-accesses";
import { getDeliveredSystems, DeliveredSystem } from "@/lib/delivered-systems";
import { getProjects, Project } from "@/lib/projects";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  KeyRound, Plus, Copy, ExternalLink, Eye, EyeOff, CheckCircle2, Edit, Trash2,
  AlertTriangle, Clock, Shield,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminAcessos() {
  const [accesses, setAccesses] = useState<ProjectAccess[]>([]);
  const [systems, setSystems] = useState<DeliveredSystem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEnv, setFilterEnv] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSystem, setFilterSystem] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterNoVerification, setFilterNoVerification] = useState(false);
  const [groupBy, setGroupBy] = useState<"none" | "system">("none");
  const [showNew, setShowNew] = useState(false);
  const [editAccess, setEditAccess] = useState<ProjectAccess | null>(null);
  const [detailAccess, setDetailAccess] = useState<ProjectAccess | null>(null);
  const [detailEvents, setDetailEvents] = useState<AccessEvent[]>([]);
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
  const [confirmReveal, setConfirmReveal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const loadCb = useCallback(() => load(), []);
  useRealtimeSubscription("project_accesses", loadCb);

  async function load() {
    setLoading(true);
    try {
      const [a, s, p] = await Promise.all([getProjectAccesses(), getDeliveredSystems(), getProjects()]);
      setAccesses(a);
      setSystems(s);
      setProjects(p);
    } catch {
      toast({ title: "Erro ao carregar acessos", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(data: Partial<ProjectAccess>) {
    setSaving(true);
    try {
      const saved = await saveProjectAccess(data);
      await addAccessEvent(saved.id, data.id ? "acesso_editado" : "acesso_criado");
      toast({ title: data.id ? "Acesso atualizado!" : "Acesso registrado!" });
      setShowNew(false);
      setEditAccess(null);
      load();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(access: ProjectAccess) {
    try {
      await saveProjectAccess({ id: access.id, last_verified_at: new Date().toISOString() });
      await addAccessEvent(access.id, "acesso_verificado", "Marcado como verificado");
      toast({ title: "Acesso verificado!" });
      load();
    } catch {
      toast({ title: "Erro", variant: "destructive" });
    }
  }

  async function handleRevealSecret(accessId: string) {
    setConfirmReveal(null);
    setRevealedSecrets((s) => new Set(s).add(accessId));
    await addAccessEvent(accessId, "segredo_visualizado", "Segredo revelado pelo admin");
    setTimeout(() => {
      setRevealedSecrets((s) => { const n = new Set(s); n.delete(accessId); return n; });
    }, 10000);
  }

  async function openDetail(access: ProjectAccess) {
    setDetailAccess(access);
    try {
      setDetailEvents(await getAccessEvents(access.id));
    } catch { /* ignore */ }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copiado!` });
  }

  const filtered = useMemo(() => accesses.filter((a) => {
    if (search && !a.friendly_name.toLowerCase().includes(search.toLowerCase()) && !a.provider_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && a.access_type !== filterType) return false;
    if (filterEnv !== "all" && a.environment !== filterEnv) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterSystem !== "all" && a.delivered_system_id !== filterSystem) return false;
    if (filterProject !== "all" && a.project_id !== filterProject) return false;
    if (filterNoVerification) {
      if (a.status !== "ativo") return false;
      if (a.last_verified_at) {
        const days = Math.floor((Date.now() - new Date(a.last_verified_at).getTime()) / 86400000);
        if (days <= 30) return false;
      }
    }
    return true;
  }), [accesses, search, filterType, filterEnv, filterStatus, filterSystem, filterProject, filterNoVerification]);

  const alerts = useMemo(() => getAccessAlerts(accesses), [accesses]);

  const grouped = useMemo(() => {
    if (groupBy !== "system") return null;
    const map = new Map<string, ProjectAccess[]>();
    filtered.forEach((a) => {
      const key = a.delivered_system_id || "sem_vinculo";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [filtered, groupBy]);

  const getSystemName = (id: string | null) => {
    if (!id) return "Sem vínculo";
    return systems.find((s) => s.id === id)?.nome || "Sistema desconhecido";
  };

  function renderRow(a: ProjectAccess) {
    const st = ACCESS_STATUS[a.status];
    return (
      <TableRow key={a.id} className="cursor-pointer" onClick={() => openDetail(a)}>
        <TableCell className="font-medium">{a.friendly_name}</TableCell>
        <TableCell className="text-muted-foreground text-xs">{ACCESS_TYPES[a.access_type] || a.access_type}</TableCell>
        <TableCell className="text-muted-foreground text-xs">{getSystemName(a.delivered_system_id)}</TableCell>
        <TableCell className="text-xs">{ENVIRONMENTS[a.environment] || a.environment}</TableCell>
        <TableCell className="text-muted-foreground text-xs">{a.provider_name || "—"}</TableCell>
        <TableCell>{st ? <StatusBadge status={st.badge} label={st.label} /> : "—"}</TableCell>
        <TableCell className="text-muted-foreground text-xs">{a.last_verified_at ? format(new Date(a.last_verified_at), "dd/MM/yy") : "—"}</TableCell>
        <TableCell className="text-muted-foreground text-xs">{a.owner_name || "—"}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-1">
            {a.access_url && (
              <>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(a.access_url, "URL")}><Copy className="h-3 w-3" /></Button>
                <a href={a.access_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-7 w-7"><ExternalLink className="h-3 w-3" /></Button></a>
              </>
            )}
            {a.username && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(a.username, "Login")}><KeyRound className="h-3 w-3" /></Button>}
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleVerify(a)}><CheckCircle2 className="h-3 w-3" /></Button>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Acessos & Admins"
        description="Central de credenciais e acessos operacionais por projeto e sistema"
        breadcrumbs={[{ label: "Acessos" }]}
      />

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">{alerts.length} alerta(s)</span>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {alerts.slice(0, 8).map((al, i) => (
              <p key={i} className="text-xs text-muted-foreground">{al.message}</p>
            ))}
            {alerts.length > 8 && <p className="text-xs text-muted-foreground">... e mais {alerts.length - 8} alertas</p>}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <FilterToolbar searchPlaceholder="Buscar acesso ou provedor..." searchValue={search} onSearchChange={setSearch}>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Tipos</SelectItem>
              {Object.entries(ACCESS_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterEnv} onValueChange={setFilterEnv}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Ambiente" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Ambientes</SelectItem>
              {Object.entries(ENVIRONMENTS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              {Object.entries(ACCESS_STATUS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Agrupar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem agrupamento</SelectItem>
              <SelectItem value="system">Por Sistema</SelectItem>
            </SelectContent>
          </Select>
        </FilterToolbar>
        <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Novo Acesso</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-10 w-10 text-muted-foreground" />}
          title="Nenhum acesso encontrado"
          description="Registre acessos para centralizar credenciais da agência."
          action={{ label: "Registrar Acesso", onClick: () => setShowNew(true) }}
        />
      ) : grouped ? (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([key, items]) => (
            <div key={key} className="rounded-xl border border-border bg-card">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm">{getSystemName(key === "sem_vinculo" ? null : key)} ({items.length})</h3>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificado</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>{items.map(renderRow)}</TableBody>
              </Table>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead>Ambiente</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verificado</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{filtered.map(renderRow)}</TableBody>
          </Table>
        </div>
      )}

      {/* New/Edit Dialog */}
      <Dialog open={showNew || !!editAccess} onOpenChange={(o) => { if (!o) { setShowNew(false); setEditAccess(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editAccess ? "Editar Acesso" : "Novo Acesso"}</DialogTitle></DialogHeader>
          <AccessForm access={editAccess || {}} systems={systems} onSave={handleSave} onCancel={() => { setShowNew(false); setEditAccess(null); }} loading={saving} />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailAccess} onOpenChange={(o) => { if (!o) setDetailAccess(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {detailAccess && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {detailAccess.friendly_name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap gap-2">
                {ACCESS_STATUS[detailAccess.status] && <StatusBadge status={ACCESS_STATUS[detailAccess.status].badge} label={ACCESS_STATUS[detailAccess.status].label} />}
                <StatusBadge status="maintenance" label={ENVIRONMENTS[detailAccess.environment] || detailAccess.environment} />
                <StatusBadge status="delivered" label={ACCESS_TYPES[detailAccess.access_type] || detailAccess.access_type} />
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Sistema:</span> {getSystemName(detailAccess.delivered_system_id)}</div>
                <div><span className="text-muted-foreground">Provedor:</span> {detailAccess.provider_name || "—"}</div>
                <div><span className="text-muted-foreground">Responsável:</span> {detailAccess.owner_name || "—"}</div>
                <div><span className="text-muted-foreground">Último teste:</span> {detailAccess.last_verified_at ? format(new Date(detailAccess.last_verified_at), "dd/MM/yyyy HH:mm") : "Nunca"}</div>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">URL:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs truncate max-w-[300px]">{detailAccess.access_url || "—"}</span>
                    {detailAccess.access_url && (
                      <>
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(detailAccess.access_url, "URL")}><Copy className="h-3 w-3" /></Button>
                        <a href={detailAccess.access_url} target="_blank" rel="noopener noreferrer"><Button size="icon" variant="ghost" className="h-6 w-6"><ExternalLink className="h-3 w-3" /></Button></a>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Login:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">{detailAccess.username || "—"}</span>
                    {detailAccess.username && <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(detailAccess.username, "Login")}><Copy className="h-3 w-3" /></Button>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Segredo:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-xs">
                      {revealedSecrets.has(detailAccess.id) ? detailAccess.secret_masked : maskSecret(detailAccess.secret_masked)}
                    </span>
                    {detailAccess.secret_masked && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                        if (revealedSecrets.has(detailAccess.id)) {
                          setRevealedSecrets((s) => { const n = new Set(s); n.delete(detailAccess.id); return n; });
                        } else {
                          setConfirmReveal(detailAccess.id);
                        }
                      }}>
                        {revealedSecrets.has(detailAccess.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    )}
                  </div>
                </div>
                {detailAccess.secret_reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ref. Segredo:</span>
                    <span className="font-mono text-xs">{detailAccess.secret_reference}</span>
                  </div>
                )}
              </div>

              {detailAccess.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-1">Observações</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{detailAccess.notes}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => { setDetailAccess(null); setEditAccess(detailAccess); }}><Edit className="h-4 w-4 mr-1" /> Editar</Button>
                <Button size="sm" variant="outline" onClick={() => handleVerify(detailAccess)}><CheckCircle2 className="h-4 w-4 mr-1" /> Verificar Agora</Button>
                {detailAccess.access_url && (
                  <a href={detailAccess.access_url} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline"><ExternalLink className="h-4 w-4 mr-1" /> Abrir Link</Button>
                  </a>
                )}
              </div>

              {/* History */}
              {detailEvents.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium mb-2">Histórico</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {detailEvents.map((e) => (
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
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm reveal secret */}
      <AlertDialog open={!!confirmReveal} onOpenChange={(o) => { if (!o) setConfirmReveal(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revelar segredo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação será registrada no histórico. O segredo ficará visível por 10 segundos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmReveal && handleRevealSecret(confirmReveal)}>Revelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
