import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, FolderKanban, Plus } from "lucide-react";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import SectionCard from "@/components/admin/SectionCard";
import BaseTable from "@/components/admin/BaseTable";
import EmptyState from "@/components/admin/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import AccessDenied from "@/components/admin/AccessDenied";
import { useAccessControl } from "@/hooks/useAccessControl";
import { createBrandProject, listBrandProjects } from "@/services/brand-projects";
import type { BrandProject } from "@/types/brand-studio";
import { BRAND_PROJECT_STATUS_LABELS } from "@/types/brand-studio";
import { BRAND_PROJECT_STATUS_BADGE } from "@/lib/brand-studio";

const fmtDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminBrandStudioProjetos() {
  const navigate = useNavigate();
  const { loading: accessLoading, canViewBrandProject, canCreateBrandProject, guardAction } = useAccessControl();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<BrandProject[]>([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listBrandProjects();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (accessLoading) return;
    if (!canViewBrandProject()) return;
    load();
  }, [accessLoading, canViewBrandProject, load]);

  const handleCreateProject = async () => {
    const allowed = await guardAction("brand_studio", "create_brand_project", {
      description: "Tentativa de criar projeto de branding",
      severity: "medium",
      metadata: { source: "brand_studio_projects" },
    });
    if (!allowed) {
      toast.error("Sem permissao para criar projetos");
      return;
    }
    const nome = newProjectName.trim();
    if (!nome) {
      toast.error("Informe o nome do projeto");
      return;
    }

    setCreatingProject(true);
    try {
      const created = await createBrandProject({
        nome,
        status: "briefing",
        descricao: "Projeto iniciado via fluxo de briefing estruturado",
      });
      setNewProjectName("");
      await load();
      toast.success("Projeto criado com sucesso");
      navigate(`/admin/brand-studio/projetos/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar projeto");
    } finally {
      setCreatingProject(false);
    }
  };

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

  if (!accessLoading && !canViewBrandProject()) {
    return <AccessDenied />;
  }

  return (
    <div className="space-y-6">
      <BrandStudioRouteHeader
        title="Projetos de Branding"
        description="Pipeline de projetos do Brand Studio AI"
        trail={[{ label: "Projetos" }]}
      />

      <SectionCard
        title="Projetos cadastrados"
        action={
          <div className="flex items-center gap-2">
            <Input
              value={newProjectName}
              onChange={(event) => setNewProjectName(event.target.value)}
              placeholder="Nome do novo projeto"
              className="h-8 w-56"
              disabled={!canCreateBrandProject()}
            />
            <Button size="sm" onClick={handleCreateProject} disabled={creatingProject || !canCreateBrandProject()}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {creatingProject ? "Criando..." : "Novo"}
            </Button>
          </div>
        }
      >
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
