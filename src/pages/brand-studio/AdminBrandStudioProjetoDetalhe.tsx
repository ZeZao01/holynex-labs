import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Link2, Save, Sparkles, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import SectionCard from "@/components/admin/SectionCard";
import EmptyState from "@/components/admin/EmptyState";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import { getBrandProjectById, updateBrandProject } from "@/services/brand-projects";
import { getBrandBriefsByProject, saveBrandBrief } from "@/services/brand-briefs";
import { getBrandTasksByProject } from "@/services/brand-tasks";
import { getBrandAssetsByProject } from "@/services/brand-assets";
import { listBrandVersionsByProject } from "@/services/brand-pdf";
import { getBrandAiRunsByProject } from "@/services/brand-agents";
import {
  createBrandBriefReference,
  deleteBrandBriefReferenceWithStorage,
  listBrandBriefReferencesByProject,
  parseBriefingListInput,
  runBrandBriefingAgent,
  uploadBrandBriefReferenceImage,
} from "@/services/brand-briefing";
import { BRAND_PROJECT_STATUS_BADGE } from "@/lib/brand-studio";
import {
  BRAND_PROJECT_STATUS_LABELS,
  type BrandAiRun,
  type BrandBrief,
  type BrandBriefReference,
  type BrandDesignAsset,
  type BrandProject,
  type BrandTask,
  type BrandVersion,
} from "@/types/brand-studio";

interface LinkOption {
  id: string;
  label: string;
  subtitle?: string;
}

interface LocalImagePreview {
  id: string;
  file: File;
  previewUrl: string;
}

interface BriefFormState {
  titulo: string;
  contexto: string;
  nome_marca: string;
  slogan: string;
  nicho: string;
  publico_alvo_detalhado: string;
  proposta_valor: string;
  concorrentes: string;
  estilos_desejados: string;
  estilos_evitar: string;
  objetivos_identidade: string;
  referencia_visual_contexto: string;
  observacoes_adicionais: string;
}

const emptyFormState: BriefFormState = {
  titulo: "",
  contexto: "",
  nome_marca: "",
  slogan: "",
  nicho: "",
  publico_alvo_detalhado: "",
  proposta_valor: "",
  concorrentes: "",
  estilos_desejados: "",
  estilos_evitar: "",
  objetivos_identidade: "",
  referencia_visual_contexto: "",
  observacoes_adicionais: "",
};

const toListInput = (value: string[] | null | undefined) => (value || []).join("\n");

const parseListField = (value: string) => {
  const lines = parseBriefingListInput(value);
  const exploded = lines.flatMap((line) => line.split(",").map((item) => item.trim()));
  return [...new Set(exploded.filter(Boolean))];
};

const buildFormState = (brief: BrandBrief | null, projectName = ""): BriefFormState => {
  if (!brief) {
    return {
      ...emptyFormState,
      titulo: projectName ? `Briefing de marca - ${projectName}` : "Briefing de marca",
    };
  }

  return {
    titulo: brief.titulo || `Briefing de marca - ${projectName}`,
    contexto: brief.contexto || "",
    nome_marca: brief.nome_marca || "",
    slogan: brief.slogan || "",
    nicho: brief.nicho || "",
    publico_alvo_detalhado: brief.publico_alvo_detalhado || brief.publico_alvo || "",
    proposta_valor: brief.proposta_valor || "",
    concorrentes: toListInput(brief.concorrentes),
    estilos_desejados: toListInput(brief.estilos_desejados),
    estilos_evitar: toListInput(brief.estilos_evitar),
    objetivos_identidade: toListInput(brief.objetivos_identidade),
    referencia_visual_contexto: brief.referencia_visual_contexto || "",
    observacoes_adicionais: brief.observacoes_adicionais || "",
  };
};

const fmtDate = (value: string | null | undefined) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminBrandStudioProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<BrandProject | null>(null);
  const [briefs, setBriefs] = useState<BrandBrief[]>([]);
  const [activeBrief, setActiveBrief] = useState<BrandBrief | null>(null);
  const [tasks, setTasks] = useState<BrandTask[]>([]);
  const [versions, setVersions] = useState<BrandVersion[]>([]);
  const [assets, setAssets] = useState<BrandDesignAsset[]>([]);
  const [references, setReferences] = useState<BrandBriefReference[]>([]);
  const [aiRuns, setAiRuns] = useState<BrandAiRun[]>([]);

  const [form, setForm] = useState<BriefFormState>(emptyFormState);
  const [savingBrief, setSavingBrief] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);

  const [urlInput, setUrlInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [localImagePreviews, setLocalImagePreviews] = useState<LocalImagePreview[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [leadOptions, setLeadOptions] = useState<LinkOption[]>([]);
  const [proposalOptions, setProposalOptions] = useState<LinkOption[]>([]);
  const [projectOptions, setProjectOptions] = useState<LinkOption[]>([]);
  const [linkDraft, setLinkDraft] = useState({
    lead_id: "",
    client_id: "",
    proposal_id: "",
    project_id: "",
  });

  const readiness = useMemo(() => {
    const value = Number(activeBrief?.readiness_score || 0);
    if (Number.isNaN(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }, [activeBrief?.readiness_score]);

  const normalizedContextPreview = useMemo(() => {
    if (!activeBrief?.normalized_context) return "";
    try {
      return JSON.stringify(activeBrief.normalized_context, null, 2);
    } catch {
      return "";
    }
  }, [activeBrief?.normalized_context]);

  const loadLinkOptions = useCallback(async () => {
    const [leadQuery, proposalQuery, projectQuery] = await Promise.all([
      supabase
        .from("orcamentos" as any)
        .select("id, nome, empresa, email")
        .order("criado_em", { ascending: false })
        .limit(100),
      supabase
        .from("propostas" as any)
        .select("id, nome_cliente, empresa_cliente")
        .order("criado_em", { ascending: false })
        .limit(100),
      supabase
        .from("projects" as any)
        .select("id, nome, cliente")
        .order("criado_em", { ascending: false })
        .limit(100),
    ]);

    setLeadOptions(
      (leadQuery.data || []).map((row: any) => ({
        id: row.id,
        label: row.nome || "Lead",
        subtitle: [row.empresa, row.email].filter(Boolean).join(" - "),
      }))
    );

    setProposalOptions(
      (proposalQuery.data || []).map((row: any) => ({
        id: row.id,
        label: row.nome_cliente || "Proposta",
        subtitle: row.empresa_cliente || "",
      }))
    );

    setProjectOptions(
      (projectQuery.data || []).map((row: any) => ({
        id: row.id,
        label: row.nome || "Projeto",
        subtitle: row.cliente || "",
      }))
    );
  }, []);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    try {
      const [projectData, briefsData, tasksData, versionsData, assetsData, referencesData, aiRunsData] = await Promise.all([
        getBrandProjectById(id),
        getBrandBriefsByProject(id),
        getBrandTasksByProject(id),
        listBrandVersionsByProject(id),
        getBrandAssetsByProject(id),
        listBrandBriefReferencesByProject(id),
        getBrandAiRunsByProject(id, 20),
      ]);

      setProject(projectData);
      setBriefs(briefsData);
      setActiveBrief(briefsData[0] || null);
      setTasks(tasksData);
      setVersions(versionsData);
      setAssets(assetsData);
      setReferences(referencesData);
      setAiRuns(aiRunsData);

      setForm(buildFormState(briefsData[0] || null, projectData?.nome || ""));
      setLinkDraft({
        lead_id: projectData?.lead_id || "",
        client_id: projectData?.client_id || "",
        proposal_id: projectData?.proposal_id || "",
        project_id: projectData?.project_id || "",
      });

      await loadLinkOptions();
    } finally {
      setLoading(false);
    }
  }, [id, loadLinkOptions]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    return () => {
      localImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, [localImagePreviews]);

  const persistBrief = useCallback(async () => {
    if (!project) throw new Error("Projeto nao carregado");

    const payload: Partial<BrandBrief> & { project_id: string; titulo: string } = {
      id: activeBrief?.id,
      project_id: project.id,
      titulo: form.titulo.trim() || `Briefing de marca - ${project.nome}`,
      contexto: form.contexto.trim() || null,
      nome_marca: form.nome_marca.trim() || null,
      slogan: form.slogan.trim() || null,
      nicho: form.nicho.trim() || null,
      publico_alvo_detalhado: form.publico_alvo_detalhado.trim() || null,
      proposta_valor: form.proposta_valor.trim() || null,
      concorrentes: parseListField(form.concorrentes),
      estilos_desejados: parseListField(form.estilos_desejados),
      estilos_evitar: parseListField(form.estilos_evitar),
      objetivos_identidade: parseListField(form.objetivos_identidade),
      referencia_visual_contexto: form.referencia_visual_contexto.trim() || null,
      observacoes_adicionais: form.observacoes_adicionais.trim() || null,
      status: activeBrief?.status || "em_coleta",
    };

    const saved = await saveBrandBrief(payload);

    setActiveBrief(saved);
    setBriefs((prev) => {
      const withoutCurrent = prev.filter((item) => item.id !== saved.id);
      return [saved, ...withoutCurrent].sort((a, b) => b.version - a.version);
    });

    return saved;
  }, [activeBrief?.id, activeBrief?.status, form, project]);

  const handleSaveBrief = async () => {
    setSavingBrief(true);
    try {
      await persistBrief();
      toast.success("Briefing salvo com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar briefing");
    } finally {
      setSavingBrief(false);
    }
  };

  const handleSaveLinks = async () => {
    if (!project) return;

    setSavingLinks(true);
    try {
      const updated = await updateBrandProject(project.id, {
        lead_id: linkDraft.lead_id || null,
        client_id: linkDraft.client_id || null,
        proposal_id: linkDraft.proposal_id || null,
        project_id: linkDraft.project_id || null,
      });
      setProject(updated);
      toast.success("Vinculos atualizados");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar vinculos");
    } finally {
      setSavingLinks(false);
    }
  };

  const handleSelectLocalImages = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const nextPreviews = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setLocalImagePreviews((prev) => [...prev, ...nextPreviews]);
    event.target.value = "";
  };

  const removeLocalPreview = (previewId: string) => {
    setLocalImagePreviews((prev) => {
      const target = prev.find((item) => item.id === previewId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== previewId);
    });
  };

  const handleUploadLocalImages = async () => {
    if (!project || localImagePreviews.length === 0) return;

    setUploadingImages(true);
    try {
      const uploaded = await Promise.all(
        localImagePreviews.map((preview, index) =>
          uploadBrandBriefReferenceImage({
            project_id: project.id,
            brief_id: activeBrief?.id || null,
            file: preview.file,
            sort_order: references.length + index,
          })
        )
      );

      setReferences((prev) => [...prev, ...uploaded]);
      const latestAssets = await getBrandAssetsByProject(project.id);
      setAssets(latestAssets);

      localImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
      setLocalImagePreviews([]);
      toast.success("Imagens de referencia enviadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar imagens");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCreateUrlReferences = async () => {
    if (!project) return;

    const urls = parseBriefingListInput(urlInput).filter((value) => /^https?:\/\//i.test(value));
    if (!urls.length) {
      toast.error("Informe pelo menos uma URL valida (http/https)");
      return;
    }

    try {
      const created = await Promise.all(
        urls.map((url, index) =>
          createBrandBriefReference({
            project_id: project.id,
            brief_id: activeBrief?.id || null,
            reference_type: "url",
            source_url: url,
            sort_order: references.length + index,
          })
        )
      );

      setReferences((prev) => [...prev, ...created.map((item) => ({ ...item, signed_url: item.source_url }))]);
      setUrlInput("");
      toast.success("URLs de referencia adicionadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar URLs");
    }
  };

  const handleCreateNoteReferences = async () => {
    if (!project) return;

    const notes = parseBriefingListInput(noteInput);
    if (!notes.length) {
      toast.error("Adicione pelo menos uma nota de referencia");
      return;
    }

    try {
      const created = await Promise.all(
        notes.map((note, index) =>
          createBrandBriefReference({
            project_id: project.id,
            brief_id: activeBrief?.id || null,
            reference_type: "note",
            note,
            sort_order: references.length + index,
          })
        )
      );

      setReferences((prev) => [...prev, ...created]);
      setNoteInput("");
      toast.success("Notas de referencia adicionadas");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar notas");
    }
  };

  const handleDeleteReference = async (reference: BrandBriefReference) => {
    try {
      await deleteBrandBriefReferenceWithStorage(reference);
      setReferences((prev) => prev.filter((item) => item.id !== reference.id));
      toast.success("Referencia removida");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao remover referencia");
    }
  };

  const handleRunBriefingAgent = async () => {
    if (!project) return;

    setRunningAgent(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBrandBriefingAgent({
        brief: briefForRun,
        references,
      });

      setActiveBrief(result.brief);
      setBriefs((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.brief.id);
        return [result.brief, ...withoutCurrent].sort((a, b) => b.version - a.version);
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`brand_briefing_agent executado (readiness ${result.output.readiness_score}%)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agente");
    } finally {
      setRunningAgent(false);
    }
  };

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
        description="Briefing estruturado, referencias e contexto normalizado para os agentes"
        trail={[{ label: "Projetos", href: "/admin/brand-studio/projetos" }, { label: project.nome }]}
      />

      <SectionCard title="Resumo do projeto">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Status</div>
            <Badge className={`text-[10px] ${BRAND_PROJECT_STATUS_BADGE[project.status]}`}>
              {BRAND_PROJECT_STATUS_LABELS[project.status]}
            </Badge>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Briefing</div>
            <div className="font-medium">{activeBrief ? `v${activeBrief.version}` : "Nao iniciado"}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Readiness</div>
            <div className="font-medium">{readiness}%</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Referencias</div>
            <div className="font-medium">{references.length}</div>
          </div>
          <div className="rounded-lg border border-border/50 p-3">
            <div className="text-xs text-muted-foreground mb-1">Runs IA</div>
            <div className="font-medium">{aiRuns.length}</div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Vinculos operacionais"
        action={
          <Button size="sm" variant="outline" onClick={handleSaveLinks} disabled={savingLinks}>
            <Link2 className="h-3.5 w-3.5 mr-1" />
            {savingLinks ? "Salvando..." : "Salvar vinculos"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">lead_id</Label>
            <Select
              value={linkDraft.lead_id || "none"}
              onValueChange={(value) => setLinkDraft((prev) => ({ ...prev, lead_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar lead" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem lead</SelectItem>
                {leadOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">proposal_id</Label>
            <Select
              value={linkDraft.proposal_id || "none"}
              onValueChange={(value) => setLinkDraft((prev) => ({ ...prev, proposal_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar proposta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem proposta</SelectItem>
                {proposalOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">project_id</Label>
            <Select
              value={linkDraft.project_id || "none"}
              onValueChange={(value) => setLinkDraft((prev) => ({ ...prev, project_id: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar projeto operacional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem projeto</SelectItem>
                {projectOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">client_id</Label>
            <Input
              placeholder="UUID do cliente"
              value={linkDraft.client_id}
              onChange={(event) => setLinkDraft((prev) => ({ ...prev, client_id: event.target.value.trim() }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Briefing estruturado"
        action={
          <Button size="sm" onClick={handleSaveBrief} disabled={savingBrief}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {savingBrief ? "Salvando..." : "Salvar briefing"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Titulo do briefing</Label>
            <Input value={form.titulo} onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nome da marca</Label>
            <Input value={form.nome_marca} onChange={(event) => setForm((prev) => ({ ...prev, nome_marca: event.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Slogan</Label>
            <Input value={form.slogan} onChange={(event) => setForm((prev) => ({ ...prev, slogan: event.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nicho</Label>
            <Input value={form.nicho} onChange={(event) => setForm((prev) => ({ ...prev, nicho: event.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Publico-alvo</Label>
            <Input
              value={form.publico_alvo_detalhado}
              onChange={(event) => setForm((prev) => ({ ...prev, publico_alvo_detalhado: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Proposta de valor</Label>
            <Textarea
              rows={3}
              value={form.proposta_valor}
              onChange={(event) => setForm((prev) => ({ ...prev, proposta_valor: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Concorrentes (um por linha)</Label>
            <Textarea
              rows={4}
              value={form.concorrentes}
              onChange={(event) => setForm((prev) => ({ ...prev, concorrentes: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Estilos desejados (um por linha)</Label>
            <Textarea
              rows={4}
              value={form.estilos_desejados}
              onChange={(event) => setForm((prev) => ({ ...prev, estilos_desejados: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Estilos a evitar (um por linha)</Label>
            <Textarea
              rows={4}
              value={form.estilos_evitar}
              onChange={(event) => setForm((prev) => ({ ...prev, estilos_evitar: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Objetivos da identidade (um por linha)</Label>
            <Textarea
              rows={4}
              value={form.objetivos_identidade}
              onChange={(event) => setForm((prev) => ({ ...prev, objetivos_identidade: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Contexto de referencias visuais</Label>
            <Textarea
              rows={3}
              value={form.referencia_visual_contexto}
              onChange={(event) => setForm((prev) => ({ ...prev, referencia_visual_contexto: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Observacoes adicionais</Label>
            <Textarea
              rows={3}
              value={form.observacoes_adicionais}
              onChange={(event) => setForm((prev) => ({ ...prev, observacoes_adicionais: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Contexto livre</Label>
            <Textarea
              rows={3}
              value={form.contexto}
              onChange={(event) => setForm((prev) => ({ ...prev, contexto: event.target.value }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Referencias do briefing">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Upload de imagens (multiplo)</Label>
              <Input type="file" accept="image/*" multiple onChange={handleSelectLocalImages} />
              <Button size="sm" variant="outline" onClick={handleUploadLocalImages} disabled={uploadingImages || !localImagePreviews.length}>
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploadingImages ? "Enviando..." : "Enviar imagens"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">URLs de referencia (uma por linha)</Label>
              <Textarea rows={4} value={urlInput} onChange={(event) => setUrlInput(event.target.value)} />
              <Button size="sm" variant="outline" onClick={handleCreateUrlReferences}>
                Adicionar URLs
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Notas de referencia (uma por linha)</Label>
            <Textarea rows={3} value={noteInput} onChange={(event) => setNoteInput(event.target.value)} />
            <Button size="sm" variant="outline" onClick={handleCreateNoteReferences}>
              Adicionar notas
            </Button>
          </div>

          {localImagePreviews.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs">Preview local (antes do upload)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {localImagePreviews.map((preview) => (
                  <div key={preview.id} className="rounded-lg border border-border/50 p-2 space-y-2">
                    <img src={preview.previewUrl} alt={preview.file.name} className="w-full h-24 object-cover rounded" />
                    <p className="text-[11px] text-muted-foreground truncate">{preview.file.name}</p>
                    <Button size="sm" variant="ghost" className="w-full h-7" onClick={() => removeLocalPreview(preview.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Remover
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Referencias persistidas</Label>
            {references.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {references.map((reference) => {
                  const imageSource = reference.signed_url || reference.public_url || reference.source_url || "";

                  return (
                    <div key={reference.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          {reference.reference_type}
                        </Badge>
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleDeleteReference(reference)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      {reference.reference_type === "image" && imageSource && (
                        <img src={imageSource} alt={reference.original_name || "referencia"} className="w-full h-32 object-cover rounded" />
                      )}

                      {reference.reference_type === "url" && reference.source_url && (
                        <a href={reference.source_url} target="_blank" rel="noreferrer" className="text-xs underline text-primary break-all">
                          {reference.source_url}
                        </a>
                      )}

                      {reference.reference_type === "note" && <p className="text-xs text-muted-foreground whitespace-pre-wrap">{reference.note || "-"}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState compact title="Sem referencias" description="Adicione imagens, URLs e notas para enriquecer o briefing." />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="IA de briefing"
        action={
          <Button size="sm" onClick={handleRunBriefingAgent} disabled={runningAgent}>
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {runningAgent ? "Executando..." : "Executar brand_briefing_agent"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Readiness score</span>
              <span>{readiness}%</span>
            </div>
            <Progress value={readiness} className="h-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <p className="text-sm font-medium">Perguntas faltantes</p>
              {activeBrief?.missing_questions && activeBrief.missing_questions.length > 0 ? (
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  {activeBrief.missing_questions.map((question, index) => (
                    <li key={`${question}-${index}`}>{question}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma lacuna critica identificada.</p>
              )}
            </div>

            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <p className="text-sm font-medium">Contexto consolidado</p>
              {normalizedContextPreview ? (
                <pre className="text-[11px] text-muted-foreground whitespace-pre-wrap break-words max-h-52 overflow-auto">
                  {normalizedContextPreview}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">Execute o agente para gerar o contexto normalizado.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 p-3 text-xs text-muted-foreground">
            Ultima normalizacao: {fmtDate(activeBrief?.normalized_at)}
            {activeBrief?.gap_summary ? ` - ${activeBrief.gap_summary}` : ""}
          </div>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Briefings recentes">
          {briefs.length > 0 ? (
            <div className="space-y-2">
              {briefs.slice(0, 5).map((brief) => (
                <div key={brief.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{brief.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    v{brief.version} - {brief.status} - readiness {Number(brief.readiness_score || 0)}%
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Sem briefings" description="Nenhum briefing salvo para este projeto." />
          )}
        </SectionCard>

        <SectionCard title="Tarefas recentes">
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.slice(0, 6).map((task) => (
                <div key={task.id} className="rounded-lg border border-border/50 p-3">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {task.status} - prioridade {task.priority}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState compact title="Sem tarefas" description="Nenhuma tarefa registrada para este projeto." />
          )}
        </SectionCard>

        <SectionCard title="Versoes e assets">
          <div className="space-y-3">
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-xs text-muted-foreground">Versoes</p>
              <p className="text-sm font-medium">{versions.length}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-xs text-muted-foreground">Assets</p>
              <p className="text-sm font-medium">{assets.length}</p>
            </div>
            <div className="rounded-lg border border-border/50 p-3">
              <p className="text-xs text-muted-foreground">Runs IA</p>
              <p className="text-sm font-medium">{aiRuns.length}</p>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
