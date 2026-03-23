import { useEffect, useMemo, useState } from "react";
import { NotebookPen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listBrandBriefs } from "@/services/brand-briefs";
import type { BrandBrief } from "@/types/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioBriefings() {
  const navigate = useNavigate();
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
            <div className="text-xs text-muted-foreground">
              Marca: {brief.nome_marca || "nao informada"} · Projeto: {brief.project_id}
            </div>
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
        key: "readiness",
        header: "Readiness",
        className: "w-[180px]",
        render: (brief: BrandBrief) => (
          <div className="flex items-center gap-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{brief.readiness_score ?? 0}%</span>
            <span className="text-muted-foreground">({brief.missing_questions?.length || 0} lacunas)</span>
          </div>
        ),
      },
      {
        key: "updated",
        header: "Atualizado",
        className: "w-[170px]",
        render: (brief: BrandBrief) => <span className="text-xs text-muted-foreground">{fmtDate(brief.atualizado_em)}</span>,
      },
      {
        key: "actions",
        header: "Acoes",
        className: "w-[140px]",
        render: (brief: BrandBrief) => (
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/brand-studio/projetos/${brief.project_id}`)}>
            Abrir projeto
          </Button>
        ),
      },
    ],
    [navigate],
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
