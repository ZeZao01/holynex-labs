import { useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import FilterToolbar from "@/components/admin/FilterToolbar";
import BaseTable from "@/components/admin/BaseTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { ExternalLink, Check, Sparkles, Zap, Archive } from "lucide-react";
import { useAccessControl } from "@/hooks/useAccessControl";
import {
  getAddons,
  updateAddonStatus,
  ADDON_STATUS_MAP,
  ADDON_SOURCE_LABELS,
  type Addon,
  type AddonSourceContext,
  type AddonStatus,
} from "@/lib/addons";

const STATUS_OPTIONS: { value: "all" | AddonStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "suggested", label: "Sugeridos" },
  { value: "approved_internal", label: "Aprovados" },
  { value: "available_for_activation", label: "Disponiveis" },
  { value: "activated", label: "Ativados" },
  { value: "archived", label: "Arquivados" },
];

const SOURCE_OPTIONS: { value: "all" | AddonSourceContext; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "lead", label: "Lead" },
  { value: "proposta", label: "Proposta" },
  { value: "sistema", label: "Sistema" },
];

const ACTION_LABELS: Record<AddonStatus, { label?: string; icon?: typeof Sparkles; next?: AddonStatus }> = {
  suggested: { label: "Aprovar", icon: Check, next: "approved_internal" },
  approved_internal: { label: "Disponibilizar", icon: Sparkles, next: "available_for_activation" },
  available_for_activation: { label: "Ativar", icon: Zap, next: "activated" },
  activated: { label: "Arquivar", icon: Archive, next: "archived" },
  archived: {},
};

export default function AdminAddons() {
  const { canApprove, canActivateAddon, canEdit, guardAction } = useAccessControl();
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | AddonStatus>("all");
  const [filterSource, setFilterSource] = useState<"all" | AddonSourceContext>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAddons();
      setAddons(data);
    } catch {
      toast.error("Erro ao carregar add-ons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return addons.filter((addon) => {
      if (filterStatus !== "all" && addon.status !== filterStatus) return false;
      if (filterSource !== "all" && addon.source_context !== filterSource) return false;
      if (!q) return true;
      return [addon.name, addon.internal_description, addon.commercial_description, addon.technical_impact]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [addons, search, filterStatus, filterSource]);

  const handleStatusChange = async (addon: Addon) => {
    const meta = ACTION_LABELS[addon.status];
    if (!meta?.next) return;

    if (meta.next === "activated") {
      const allowed = await guardAction("addons", "ativar_addon", {
        description: "Tentativa de ativar add-on oculto",
        severity: "high",
        metadata: { addon_id: addon.id, status: addon.status },
      });
      if (!allowed) {
        toast.error("Sem permissao para ativar add-ons");
        return;
      }
    } else if (!canApprove("addons") && !canEdit("addons")) {
      toast.error("Sem permissao para atualizar add-ons");
      return;
    }

    setUpdatingId(addon.id);
    try {
      await updateAddonStatus(addon.id, meta.next, {
        from_status: addon.status,
        source_context: addon.source_context,
      });
      toast.success(`Status atualizado para ${ADDON_STATUS_MAP[meta.next].label}`);
      load();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Add-on",
      render: (addon: Addon) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{addon.name || "Sem nome"}</div>
          {addon.internal_description && (
            <div className="text-xs text-muted-foreground line-clamp-2">{addon.internal_description}</div>
          )}
          <div className="flex flex-wrap gap-1">
            {addon.niche && <Badge variant="outline" className="text-[10px]">{addon.niche}</Badge>}
            {addon.module_scope?.slice(0, 2).map((mod, idx) => (
              <Badge key={`${addon.id}-mod-${idx}`} variant="secondary" className="text-[10px]">{mod}</Badge>
            ))}
            {addon.module_scope?.length > 2 && (
              <Badge variant="outline" className="text-[10px]">+{addon.module_scope.length - 2}</Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "context",
      header: "Origem",
      className: "w-[140px]",
      render: (addon: Addon) => (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{ADDON_SOURCE_LABELS[addon.source_context]}</div>
          {addon.source_id ? (
            <a
              href={
                addon.source_context === "lead"
                  ? `/admin/orcamentos/${addon.source_id}`
                  : addon.source_context === "proposta"
                    ? `/admin/propostas/${addon.source_id}`
                    : `/admin/sistemas/${addon.source_id}`
              }
              className="inline-flex items-center gap-1 text-xs text-primary"
            >
              Ver origem <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">Sem vinculo</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-[180px]",
      render: (addon: Addon) => (
        <div className="space-y-1">
          <StatusBadge status={ADDON_STATUS_MAP[addon.status].badge} label={ADDON_STATUS_MAP[addon.status].label} />
          <div className="text-[10px] text-muted-foreground">{ADDON_STATUS_MAP[addon.status].helper}</div>
        </div>
      ),
    },
    {
      key: "valor",
      header: "Estimativa",
      className: "w-[140px]",
      render: (addon: Addon) => (
        <span className="text-xs font-medium">R$ {Number(addon.estimated_value || 0).toLocaleString("pt-BR")}</span>
      ),
    },
    {
      key: "actions",
      header: "Acoes",
      className: "w-[160px]",
      render: (addon: Addon) => {
        const meta = ACTION_LABELS[addon.status];
        if (!meta?.label || !meta.next) return <span className="text-xs text-muted-foreground">—</span>;

        const Icon = meta.icon || Sparkles;
        const isActivate = meta.next === "activated";
        const canUse = isActivate ? canActivateAddon() : canApprove("addons") || canEdit("addons");

        return (
          <Button
            size="sm"
            variant={isActivate ? "default" : "outline"}
            className="gap-1"
            disabled={!canUse || updatingId === addon.id}
            onClick={() => handleStatusChange(addon)}
          >
            <Icon className="h-3.5 w-3.5" /> {updatingId === addon.id ? "Atualizando" : meta.label}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add-ons Ocultos"
        description="Extensoes previstas da solucao com ativacao controlada"
        breadcrumbs={[{ label: "Sistema" }, { label: "Add-ons" }]}
      />

      <SectionCard title="Controle e Ativacao">
        <FilterToolbar
          searchPlaceholder="Buscar por nome, descricao ou impacto..."
          searchValue={search}
          onSearchChange={setSearch}
        >
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="h-9 w-[200px] text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSource} onValueChange={(v) => setFilterSource(v as any)}>
            <SelectTrigger className="h-9 w-[180px] text-sm">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterToolbar>

        <div className="mt-4">
          <BaseTable
            columns={columns}
            data={filtered}
            keyExtractor={(item) => item.id}
            loading={loading}
            loadingRows={5}
          />
          {!loading && filtered.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">Nenhum add-on encontrado.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
