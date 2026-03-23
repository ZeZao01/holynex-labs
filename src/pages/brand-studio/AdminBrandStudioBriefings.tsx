import { useEffect, useMemo, useState } from "react";
import { NotebookPen } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { listBrandBriefs } from "@/services/brand-briefs";
import type { BrandBrief } from "@/types/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioBriefings() {
  const [loading, setLoading] = useState(true);
  const [briefs, setBriefs] = useState<BrandBrief[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listBrandBriefs();
        setBriefs(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "titulo",
        header: "Briefing",
        render: (brief: BrandBrief) => (
          <div className="space-y-1">
            <div className="font-medium text-sm">{brief.titulo}</div>
            <div className="text-xs text-muted-foreground">Projeto: {brief.project_id}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[150px]",
        render: (brief: BrandBrief) => <Badge variant="outline" className="text-[10px]">{brief.status}</Badge>,
      },
      {
        key: "version",
        header: "Versao",
        className: "w-[120px]",
        render: (brief: BrandBrief) => <span className="text-sm">v{brief.version}</span>,
      },
      {
        key: "updated",
        header: "Atualizado",
        className: "w-[170px]",
        render: (brief: BrandBrief) => <span className="text-xs text-muted-foreground">{fmtDate(brief.atualizado_em)}</span>,
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Briefings"
        description="Base de discovery e direcao de marca por projeto"
        trail={[{ label: "Briefings" }]}
      />

      <SectionCard title="Briefings registrados">
        <BaseTable columns={columns} data={briefs} keyExtractor={(item) => item.id} loading={loading} loadingRows={5} />
        {!loading && briefs.length === 0 && (
          <EmptyState
            compact
            icon={<NotebookPen className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum briefing encontrado"
            description="A tabela brand_briefs ja esta pronta para receber os dados iniciais de discovery."
          />
        )}
      </SectionCard>
    </div>
  );
}
