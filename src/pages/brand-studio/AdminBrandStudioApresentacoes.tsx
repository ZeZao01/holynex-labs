import { useCallback, useEffect, useMemo, useState } from "react";
import { Presentation } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import AccessDenied from "@/components/admin/AccessDenied";
import { useAccessControl } from "@/hooks/useAccessControl";
import { logAction } from "@/lib/audit-logs";
import { listBrandPresentations } from "@/services/brand-pdf";
import type { BrandVersion } from "@/types/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioApresentacoes() {
  const { loading: accessLoading, canViewBrandProject, canGenerateBrandPdf, canViewBrandSensitive } = useAccessControl();
  const [loading, setLoading] = useState(true);
  const [presentations, setPresentations] = useState<BrandVersion[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!canViewBrandProject()) return;
      setLoading(true);
      try {
        const data = await listBrandPresentations();
        setPresentations(data);
      } finally {
        setLoading(false);
      }
    };
    if (accessLoading) return;
    load();
  }, [accessLoading, canViewBrandProject]);

  const allowOpenPresentation = canGenerateBrandPdf() || canViewBrandSensitive();

  const handleOpenPresentation = useCallback((version: BrandVersion) => {
    if (!allowOpenPresentation || !version.presentation_url) return;
    void logAction("export_brand_asset", "brand_version", version.id, {
      project_id: version.project_id,
      presentation_url: version.presentation_url,
    });
  }, [allowOpenPresentation]);

  const columns = useMemo(
    () => [
      {
        key: "version",
        header: "Versao",
        render: (version: BrandVersion) => (
          <div className="space-y-1">
            <div className="font-medium text-sm">v{version.version_number} · {version.label}</div>
            <div className="text-xs text-muted-foreground">Projeto: {version.project_id}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[160px]",
        render: (version: BrandVersion) => <Badge variant="outline" className="text-[10px]">{version.status}</Badge>,
      },
      {
        key: "url",
        header: "Apresentacao",
        render: (version: BrandVersion) => (
          version.presentation_url && allowOpenPresentation ? (
            <a
              className="text-xs text-primary underline underline-offset-4"
              href={version.presentation_url}
              target="_blank"
              rel="noreferrer"
              onClick={() => handleOpenPresentation(version)}
            >
              Abrir apresentacao
            </a>
          ) : (
            <span className="text-xs text-muted-foreground">
              {version.presentation_url ? "Sem acesso" : "Sem URL"}
            </span>
          )
        ),
      },
      {
        key: "updated",
        header: "Atualizado",
        className: "w-[170px]",
        render: (version: BrandVersion) => <span className="text-xs text-muted-foreground">{fmtDate(version.atualizado_em)}</span>,
      },
    ],
    [allowOpenPresentation, handleOpenPresentation],
  );

  if (!accessLoading && !canViewBrandProject()) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Apresentacoes"
        description="Versionamento de entregas e saidas para PDF do Brand Studio"
        trail={[{ label: "Apresentacoes" }]}
      />

      <SectionCard title="Historico de apresentacoes">
        <BaseTable columns={columns} data={presentations} keyExtractor={(item) => item.id} loading={loading} loadingRows={5} />
        {!loading && presentations.length === 0 && (
          <EmptyState
            compact
            icon={<Presentation className="h-8 w-8 text-muted-foreground" />}
            title="Nenhuma apresentacao registrada"
            description="A tabela brand_versions suporta URL de apresentacao e exportacao de PDF desde a fundacao."
          />
        )}
      </SectionCard>
    </div>
  );
}
