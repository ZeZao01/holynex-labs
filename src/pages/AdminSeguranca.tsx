import { useEffect, useState, useMemo, Fragment } from "react";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatCard from "@/components/admin/StatCard";
import StatsGrid from "@/components/admin/StatsGrid";
import FilterToolbar from "@/components/admin/FilterToolbar";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  ShieldCheck, AlertTriangle, Eye, Clock, User, FileText,
  ChevronDown, ChevronUp, Shield, Lock, Activity,
} from "lucide-react";
import { getAuditLogs, logAction, AuditLog } from "@/lib/audit-logs";
import {
  getSecurityEvents, getSecurityAlerts, getSecurityIncidents,
  getRolePermissions, updateAlertStatus, updateIncidentStatus,
  setPermission, initDefaultPermissions, buildPermissionMatrix,
  SecurityEvent, SecurityAlert, SecurityIncident, RolePermission,
  SEVERITY_LABELS, ALERT_STATUS_LABELS, INCIDENT_STATUS_LABELS,
  ROLES, ROLE_LABELS, MODULES, MODULE_LABELS, ACTIONS, ACTION_LABELS,
} from "@/lib/security";

const AUDIT_ACTION_COLORS: Record<string, string> = {
  create: "bg-primary/15 text-primary border-primary/30",
  update: "bg-secondary/70 text-secondary-foreground border-border",
  delete: "bg-destructive/10 text-destructive border-destructive/30",
  login: "bg-accent text-accent-foreground border-border",
  logout: "bg-muted text-muted-foreground border-border",
  export: "bg-muted text-foreground border-border",
  view_secret: "bg-destructive/20 text-destructive border-destructive/30",
  generate_pdf: "bg-primary/10 text-primary border-primary/20",
  download_pdf: "bg-primary/10 text-primary border-primary/20",
  revoke: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AdminSeguranca() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [selectedRole, setSelectedRole] = useState<string>(ROLES[0]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [l, e, a, i, p] = await Promise.all([
        getAuditLogs(200), getSecurityEvents(200),
        getSecurityAlerts(), getSecurityIncidents(),
        getRolePermissions(),
      ]);
      setLogs(l); setEvents(e); setAlerts(a); setIncidents(i); setPermissions(p);
    } catch {
      toast({ title: "Erro ao carregar dados de segurança", variant: "destructive" });
    } finally { setLoading(false); }
  }

  const stats = useMemo(() => ({
    totalLogs: logs.length,
    totalEvents: events.length,
    activeAlerts: alerts.filter(a => a.status === "novo" || a.status === "em_revisao" || a.status === "confirmado").length,
    openIncidents: incidents.filter(i => i.status === "aberto" || i.status === "em_investigacao").length,
    criticalEvents: events.filter(e => e.severity === "critical" || e.severity === "high").length,
  }), [logs, events, alerts, incidents]);

  const permMatrix = useMemo(() => buildPermissionMatrix(permissions), [permissions]);

  const filteredLogs = useMemo(() => logs.filter(l => {
    if (search && !l.user_email?.toLowerCase().includes(search.toLowerCase()) && !l.entity_type?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAction !== "all" && l.action !== filterAction) return false;
    return true;
  }), [logs, search, filterAction]);

  const filteredEvents = useMemo(() => events.filter(e => {
    if (search && !e.description?.toLowerCase().includes(search.toLowerCase()) && !e.event_type?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSeverity !== "all" && e.severity !== filterSeverity) return false;
    return true;
  }), [events, search, filterSeverity]);

  async function handleAlertStatus(id: string, status: string) {
    try {
      await updateAlertStatus(id, status);
      toast({ title: "Alerta atualizado" });
      load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handleIncidentStatus(id: string, status: string) {
    try {
      await updateIncidentStatus(id, status);
      toast({ title: "Incidente atualizado" });
      load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  async function handlePermissionToggle(role: string, mod: string, action: string, current: boolean) {
    try {
      await setPermission(role, mod, action, !current);
      await logAction("update", "role_permissions", "", { role, module: mod, action, allowed: !current });
      load();
    } catch { toast({ title: "Erro ao atualizar permissão", variant: "destructive" }); }
  }

  async function handleInitPermissions() {
    try {
      await initDefaultPermissions();
      toast({ title: "Permissões inicializadas!" });
      load();
    } catch { toast({ title: "Erro", variant: "destructive" }); }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const logActions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  if (loading) return <div className="p-8 text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Segurança & Auditoria" description="Governança, logs, eventos, alertas, incidentes e permissões" breadcrumbs={[{ label: "Segurança" }]} />

      <StatsGrid columns={5}>
        <StatCard title="Logs de Auditoria" value={stats.totalLogs} icon={<FileText className="h-5 w-5" />} />
        <StatCard title="Eventos" value={stats.totalEvents} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Alertas Ativos" value={stats.activeAlerts} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard title="Incidentes Abertos" value={stats.openIncidents} icon={<Shield className="h-5 w-5" />} />
        <StatCard title="Eventos Críticos" value={stats.criticalEvents} icon={<Lock className="h-5 w-5" />} />
      </StatsGrid>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="logs">Auditoria</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1">
            Alertas {stats.activeAlerts > 0 && <Badge variant="destructive" className="text-[10px] h-4 px-1">{stats.activeAlerts}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-1">
            Incidentes {stats.openIncidents > 0 && <Badge variant="destructive" className="text-[10px] h-4 px-1">{stats.openIncidents}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="permissions">Permissões</TabsTrigger>
        </TabsList>

        {/* Audit Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterToolbar searchPlaceholder="Buscar por email ou entidade..." searchValue={search} onSearchChange={setSearch} />
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas ações</SelectItem>
                {logActions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filteredLogs.length === 0 ? (
            <EmptyState icon={<ShieldCheck className="h-10 w-10 text-muted-foreground" />} title="Nenhum log" description="Ações do sistema serão registradas automaticamente." />
          ) : (
            <SectionCard noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(l.criado_em)}</div>
                      </TableCell>
                      <TableCell><div className="flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground" />{l.user_email || "Sistema"}</div></TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] ${AUDIT_ACTION_COLORS[l.action] || ""}`}>{l.action}</Badge></TableCell>
                      <TableCell className="text-sm">{l.entity_type || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{l.entity_id ? l.entity_id.substring(0, 8) + "…" : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.details && Object.keys(l.details).length > 0 ? JSON.stringify(l.details) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <FilterToolbar searchPlaceholder="Buscar evento..." searchValue={search} onSearchChange={setSearch} />
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas severidades</SelectItem>
                {Object.entries(SEVERITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {filteredEvents.length === 0 ? (
            <EmptyState icon={<Activity className="h-10 w-10 text-muted-foreground" />} title="Nenhum evento" description="Eventos de segurança aparecerão aqui." />
          ) : (
            <SectionCard noPadding>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Severidade</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Origem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map(e => {
                    const sev = SEVERITY_LABELS[e.severity] || { label: e.severity, color: "" };
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(e.criado_em)}</TableCell>
                        <TableCell className="text-sm font-medium">{e.event_type}</TableCell>
                        <TableCell><Badge className={`text-[10px] ${sev.color}`}>{sev.label}</Badge></TableCell>
                        <TableCell className="text-sm max-w-[250px] truncate">{e.description}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.user_email || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{e.source || "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </SectionCard>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <EmptyState icon={<AlertTriangle className="h-10 w-10 text-muted-foreground" />} title="Nenhum alerta" description="Alertas de segurança serão criados automaticamente ou manualmente." />
          ) : (
            <div className="space-y-3">
              {alerts.map(a => {
                const sev = SEVERITY_LABELS[a.severity] || { label: a.severity, color: "" };
                const st = ALERT_STATUS_LABELS[a.status] || { label: a.status, color: "" };
                return (
                  <SectionCard key={a.id} className={a.status === "novo" ? "border-destructive/30" : ""}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${sev.color}`}>{sev.label}</Badge>
                          <span className="font-medium text-sm">{a.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{fmtDate(a.criado_em)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      {(a.status === "novo" || a.status === "em_revisao" || a.status === "confirmado") && (
                        <div className="flex gap-2">
                          {a.status === "novo" && <Button size="sm" variant="outline" onClick={() => handleAlertStatus(a.id, "em_revisao")}>Revisar</Button>}
                          {(a.status === "em_revisao" || a.status === "novo") && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleAlertStatus(a.id, "confirmado")}>Confirmar</Button>
                              <Button size="sm" variant="ghost" onClick={() => handleAlertStatus(a.id, "descartado")}>Descartar</Button>
                            </>
                          )}
                          {a.status === "confirmado" && <Button size="sm" onClick={() => handleAlertStatus(a.id, "resolvido")}>Resolver</Button>}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-4">
          {incidents.length === 0 ? (
            <EmptyState icon={<Shield className="h-10 w-10 text-muted-foreground" />} title="Nenhum incidente" description="Incidentes de segurança serão registrados aqui." />
          ) : (
            <div className="space-y-3">
              {incidents.map(inc => {
                const sev = SEVERITY_LABELS[inc.severity] || { label: inc.severity, color: "" };
                const st = INCIDENT_STATUS_LABELS[inc.status] || { label: inc.status, color: "" };
                return (
                  <SectionCard key={inc.id} className={inc.status === "aberto" ? "border-destructive/30" : ""}>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] ${sev.color}`}>{sev.label}</Badge>
                          <span className="font-medium text-sm">{inc.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{fmtDate(inc.criado_em)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{inc.description}</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">Tipo:</span> {inc.incident_type}</div>
                        <div><span className="text-muted-foreground">Responsável:</span> {inc.responsible || "—"}</div>
                        {inc.containment_action && <div><span className="text-muted-foreground">Contenção:</span> {inc.containment_action}</div>}
                        {inc.corrective_action && <div><span className="text-muted-foreground">Correção:</span> {inc.corrective_action}</div>}
                      </div>
                      {(inc.status === "aberto" || inc.status === "em_investigacao" || inc.status === "contido") && (
                        <div className="flex gap-2">
                          {inc.status === "aberto" && <Button size="sm" variant="outline" onClick={() => handleIncidentStatus(inc.id, "em_investigacao")}>Investigar</Button>}
                          {inc.status === "em_investigacao" && <Button size="sm" variant="outline" onClick={() => handleIncidentStatus(inc.id, "contido")}>Conter</Button>}
                          {inc.status === "contido" && <Button size="sm" onClick={() => handleIncidentStatus(inc.id, "resolvido")}>Resolver</Button>}
                        </div>
                      )}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="flex items-center gap-3">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-[220px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            {permissions.length === 0 && (
              <Button size="sm" variant="outline" onClick={handleInitPermissions}>Inicializar Permissões Padrão</Button>
            )}
          </div>

          <SectionCard noPadding>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[140px]">Módulo</TableHead>
                    {ACTIONS.slice(0, 7).map(a => (
                      <TableHead key={a} className="text-center text-[10px] px-1 min-w-[60px]">{ACTION_LABELS[a]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULES.map(mod => (
                    <TableRow key={mod}>
                      <TableCell className="font-medium text-sm">{MODULE_LABELS[mod]}</TableCell>
                      {ACTIONS.slice(0, 7).map(action => {
                        const allowed = permMatrix[selectedRole]?.[mod]?.[action] ?? false;
                        return (
                          <TableCell key={action} className="text-center">
                            <Checkbox
                              checked={allowed}
                              onCheckedChange={() => handlePermissionToggle(selectedRole, mod, action, allowed)}
                              className="mx-auto"
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
