import { useEffect, useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { listBrandAssets } from "@/services/brand-assets";
import type { BrandDesignAsset } from "@/types/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioAssets() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<BrandDesignAsset[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listBrandAssets();
        setAssets(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Assets"
        description="Gerenciamento de referencias, gerados e finais do Brand Studio"
        trail={[{ label: "Assets" }]}
      />

      <SectionCard title="Repositorio de assets">
        <BaseTable columns={columns} data={assets} keyExtractor={(item) => item.id} loading={loading} loadingRows={6} />
        {!loading && assets.length === 0 && (
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
