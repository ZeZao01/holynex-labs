import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { ImageIcon } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import AccessDenied from "@/components/admin/AccessDenied";
import { useAccessControl } from "@/hooks/useAccessControl";
import { logAction } from "@/lib/audit-logs";
import { toast } from "@/components/ui/sonner";
import { listBrandAssets } from "@/services/brand-assets";
import type { BrandDesignAsset } from "@/types/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioAssets() {
  const { loading: accessLoading, canViewBrandProject, canViewBrandSensitive, guardAction } = useAccessControl();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<BrandDesignAsset[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!canViewBrandProject()) return;
      setLoading(true);
      try {
        const data = await listBrandAssets();
        setAssets(data);
      } finally {
        setLoading(false);
      }
    };
    if (accessLoading) return;
    load();
  }, [accessLoading, canViewBrandProject]);

  const isSensitiveAsset = useCallback(
    (asset: BrandDesignAsset) =>
      asset.bucket === "brand-final" || asset.bucket === "brand-pdf" || asset.asset_type === "presentation",
    []
  );

  const visibleAssets = useMemo(() => {
    if (canViewBrandSensitive()) return assets;
    return assets.filter((asset) => !isSensitiveAsset(asset));
  }, [assets, canViewBrandSensitive, isSensitiveAsset]);

  const handleOpenAsset = useCallback(async (
    event: MouseEvent<HTMLAnchorElement>,
    asset: BrandDesignAsset
  ) => {
    event.preventDefault();
    if (!asset.public_url) return;

    if (isSensitiveAsset(asset)) {
      const allowedSensitive = await guardAction("brand_studio", "visualizar_segredo", {
        description: "Acesso a asset sensivel do Brand Studio",
        severity: "high",
        metadata: { source: "brand_studio_assets", asset_id: asset.id, bucket: asset.bucket },
      });
      if (!allowedSensitive) {
        toast.error("Sem permissao para visualizar assets sensiveis");
        return;
      }
    }

    const allowedExport = await guardAction("brand_studio", "exportar", {
      description: "Exportacao de asset do Brand Studio",
      severity: "medium",
      metadata: { source: "brand_studio_assets", asset_id: asset.id, bucket: asset.bucket },
    });
    if (!allowedExport) {
      toast.error("Sem permissao para exportar assets");
      return;
    }

    window.open(asset.public_url, "_blank", "noopener,noreferrer");
    void logAction("export_brand_asset", "brand_design_asset", asset.id, {
      project_id: asset.project_id,
      bucket: asset.bucket,
      storage_path: asset.storage_path,
    });
  }, [guardAction, isSensitiveAsset]);

  const columns = useMemo(
    () => [
      {
        key: "asset",
        header: "Asset",
        render: (asset: BrandDesignAsset) => (
          <div className="space-y-1">
            <div className="font-medium text-sm">{asset.storage_path}</div>
            <div className="text-xs text-muted-foreground">Projeto: {asset.project_id}</div>
          </div>
        ),
      },
      {
        key: "bucket",
        header: "Bucket",
        className: "w-[180px]",
        render: (asset: BrandDesignAsset) => <Badge variant="outline" className="text-[10px]">{asset.bucket}</Badge>,
      },
      {
        key: "type",
        header: "Tipo",
        className: "w-[130px]",
        render: (asset: BrandDesignAsset) => <span className="text-xs">{asset.asset_type}</span>,
      },
      {
        key: "created",
        header: "Criado",
        className: "w-[170px]",
        render: (asset: BrandDesignAsset) => <span className="text-xs text-muted-foreground">{fmtDate(asset.criado_em)}</span>,
      },
      {
        key: "download",
        header: "Arquivo",
        className: "w-[160px]",
        render: (asset: BrandDesignAsset) => {
          if (!asset.public_url) return <span className="text-xs text-muted-foreground">Sem URL</span>;
          if (isSensitiveAsset(asset) && !canViewBrandSensitive()) {
            return <span className="text-xs text-muted-foreground">Restrito</span>;
          }
          return (
            <a
              className="text-xs text-primary underline underline-offset-4"
              href={asset.public_url}
              target="_blank"
              rel="noreferrer"
               onClick={(event) => void handleOpenAsset(event, asset)}
            >
              Abrir arquivo
            </a>
          );
        },
      },
    ],
    [canViewBrandSensitive, handleOpenAsset, isSensitiveAsset],
  );

  if (!accessLoading && !canViewBrandProject()) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Assets"
        description="Gerenciamento de referencias, gerados e finais do Brand Studio"
        trail={[{ label: "Assets" }]}
      />

      <SectionCard title="Repositorio de assets">
        <BaseTable columns={columns} data={visibleAssets} keyExtractor={(item) => item.id} loading={loading} loadingRows={6} />
        {!loading && visibleAssets.length === 0 && (
          <EmptyState
            compact
            icon={<ImageIcon className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum asset encontrado"
            description="Os buckets brand-references, brand-generated, brand-final e brand-pdf estao provisionados."
          />
        )}
      </SectionCard>
    </div>
  );
}
