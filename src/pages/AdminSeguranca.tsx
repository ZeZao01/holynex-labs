import { useEffect, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import FilterToolbar from "@/components/admin/FilterToolbar";
import SectionCard from "@/components/admin/SectionCard";
import EmptyState from "@/components/admin/EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, User, Clock, FileText } from "lucide-react";
import { getAuditLogs, AuditLog } from "@/lib/audit-logs";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-primary/15 text-primary border-primary/30",
  update: "bg-secondary/70 text-secondary-foreground border-border",
  delete: "bg-destructive/10 text-destructive border-destructive/30",
  login: "bg-accent text-accent-foreground border-border",
  export: "bg-muted text-foreground border-border",
};

const ACTION_LABELS: Record<string, string> = {
  create: "Criação", update: "Atualização", delete: "Exclusão", login: "Login", export: "Exportação",
};

export default function AdminSeguranca() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");

  useEffect(() => { load(); }, []);

  async function load() {
    try { setLogs(await getAuditLogs(200)); }
    catch { toast({ title: "Erro ao carregar logs", variant: "destructive" }); }
    finally { setLoading(false); }
  }

  const entities = [...new Set(logs.map(l => l.entity_type).filter(Boolean))];
  const actions = [...new Set(logs.map(l => l.action).filter(Boolean))];

  const filtered = logs.filter(l => {
    if (search && !l.user_email?.toLowerCase().includes(search.toLowerCase()) && !l.entity_type?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterAction !== "all" && l.action !== filterAction) return false;
    if (filterEntity !== "all" && l.entity_type !== filterEntity) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <PageHeader title="Segurança & Auditoria" description="Logs de ações, rastreamento e governança" breadcrumbs={[{ label: "Segurança" }]} />

      <div className="flex flex-wrap items-center gap-3">
        <FilterToolbar searchPlaceholder="Buscar por email ou entidade..." searchValue={search} onSearchChange={setSearch} />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas ações</SelectItem>
            {actions.map(a => <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas entidades</SelectItem>
            {entities.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10 text-muted-foreground" />}
          title="Nenhum log encontrado"
          description="Ações do sistema serão registradas aqui automaticamente à medida que o painel for utilizado."
        />
      ) : (
        <SectionCard noPadding>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(l.criado_em).toLocaleString("pt-BR")}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm"><User className="h-3 w-3 text-muted-foreground" />{l.user_email || "Sistema"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${ACTION_COLORS[l.action] || ""}`}>{ACTION_LABELS[l.action] || l.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{l.entity_type || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{l.entity_id ? l.entity_id.substring(0, 8) + "…" : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.details && Object.keys(l.details).length > 0 ? JSON.stringify(l.details) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </SectionCard>
      )}
    </div>
  );
}
