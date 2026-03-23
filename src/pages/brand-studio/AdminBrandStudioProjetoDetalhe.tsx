import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import SectionCard from "@/components/admin/SectionCard";
import EmptyState from "@/components/admin/EmptyState";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import { getBrandProjectById } from "@/services/brand-projects";
import { getBrandBriefsByProject } from "@/services/brand-briefs";
import { getBrandTasksByProject } from "@/services/brand-tasks";
import { getBrandAssetsByProject } from "@/services/brand-assets";
import { listBrandVersionsByProject } from "@/services/brand-pdf";
import { BRAND_PROJECT_STATUS_BADGE } from "@/lib/brand-studio";
import { BRAND_PROJECT_STATUS_LABELS, type BrandBrief, type BrandDesignAsset, type BrandProject, type BrandTask, type BrandVersion } from "@/types/brand-studio";

export default function AdminBrandStudioProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<BrandProject | null>(null);
  const [briefs, setBriefs] = useState<BrandBrief[]>([]);
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [versions, setVersions] = useState<BrandVersion[]>([]);
  const [assets, setAssets] = useState<BrandDesignAsset[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [projectData, briefsData, tasksData, versionsData, assetsData] = await Promise.all([
          getBrandProjectById(id),
          getBrandBriefsByProject(id),
          getBrandTasksByProject(id),
          listBrandVersionsByProject(id),
          getBrandAssetsByProject(id),
        ]);
        setProject(projectData);
        setBriefs(briefsData);
        setTasks(tasksData);
        setVersions(versionsData);
        setAssets(assetsData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (!id) {
    return (
      <SectionCard>
        <EmptyState compact title="Projeto invalido" description="ID do projeto nao informado na rota." />
      </SectionCard>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando projeto...</div>;
  }

  if (!project) {
    return (
      <SectionCard>
        <EmptyState compact title="Projeto nao encontrado" description="Nenhum registro retornado para o ID informado." />
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title={project.nome}
        description="Visao de briefs, tarefas, assets e versoes do projeto"
        trail={[{ label: "Projetos", href: "/admin/brand-studio/projetos" }, { label: project.nome }]}
      />

      <SectionCard title="Resumo do projeto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Badge className={`text-[10px] ${BRAND_PROJECT_STATUS_BADGE[project.status]}`}>
              {BRAND_PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Briefings</div>
            <div className="font-medium">{briefs.length}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Tarefas</div>
            <div className="font-medium">{tasks.length}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Assets</div>
            <div className="font-medium">{assets.length}</div>
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Briefings recentes">
          {briefs.length > 0 ? (
            <div className="space-y-2">
              {briefs.slice(0, 5).map((brief) => (
                <div key={brief.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{brief.titulo}</p>
                  <p className="text-xs text-muted-foreground">v{brief.version} · {brief.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Sem briefings" description="Nenhum briefing vinculado ao projeto." />
          )}
        </SectionCard>

        <SectionCard title="Tarefas recentes">
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.status} · prioridade {task.priority}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Sem tarefas" description="A tabela brand_tasks esta pronta para uso operacional." />
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Versoes e apresentacoes">
          {versions.length > 0 ? (
            <div className="space-y-2">
              {versions.slice(0, 5).map((version) => (
                <div key={version.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">v{version.version_number} · {version.label}</p>
                  <p className="text-xs text-muted-foreground">{version.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Sem versoes" description="Nenhuma versao registrada para este projeto." />
          )}
        </SectionCard>

        <SectionCard title="Assets vinculados">
          {assets.length > 0 ? (
            <div className="space-y-2">
              {assets.slice(0, 5).map((asset) => (
                <div key={asset.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{asset.storage_path}</p>
                  <p className="text-xs text-muted-foreground">{asset.bucket} · {asset.asset_type}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Sem assets" description="Nenhum asset de design registrado para este projeto." />
          )}
        </SectionCard>
      </div>
    </div>
  );
}
