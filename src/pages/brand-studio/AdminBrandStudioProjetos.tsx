import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FolderKanban } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listBrandProjects } from "@/services/brand-projects";
import type { BrandProject } from "@/types/brand-studio";
import { BRAND_PROJECT_STATUS_LABELS } from "@/types/brand-studio";
import { BRAND_PROJECT_STATUS_BADGE } from "@/lib/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioProjetos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<BrandProject[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await listBrandProjects();
        setProjects(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const columns = useMemo(
    () => [
      {
        key: "nome",
        header: "Projeto",
        render: (project: BrandProject) => (
          <div className="space-y-1">
            <div className="font-medium text-sm">{project.nome}</div>
            <div className="text-xs text-muted-foreground">{project.slug || "sem-slug"}</div>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        className: "w-[180px]",
        render: (project: BrandProject) => (
          <Badge className={`text-[10px] ${BRAND_PROJECT_STATUS_BADGE[project.status]}`}>
            {BRAND_PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        ),
      },
      {
        key: "atualizado",
        header: "Atualizado em",
        className: "w-[180px]",
        render: (project: BrandProject) => (
          <span className="text-xs text-muted-foreground">{fmtDate(project.atualizado_em)}</span>
        ),
      },
      {
        key: "acoes",
        header: "Acoes",
        className: "w-[140px]",
        render: (project: BrandProject) => (
          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/brand-studio/projetos/${project.id}`)}>
            <Eye className="h-3.5 w-3.5 mr-1" /> Abrir
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Projetos de Branding"
        description="Pipeline de projetos do Brand Studio AI"
        trail={[{ label: "Projetos" }]}
      />

      <SectionCard title="Projetos cadastrados">
        <BaseTable columns={columns} data={projects} keyExtractor={(item) => item.id} loading={loading} loadingRows={6} />
        {!loading && projects.length === 0 && (
          <EmptyState
            compact
            icon={<FolderKanban className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum projeto de branding"
            description="A tabela brand_projects esta pronta para receber os primeiros registros."
          />
        )}
      </SectionCard>
    </div>
  );
}
