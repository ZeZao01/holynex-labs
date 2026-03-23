import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Link2, Palette, RefreshCw, Save, Sparkles, Trash2, Type, Upload, X } from "lucide-react";
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
import {
  listBrandStrategyOutputsByProject,
  runBrandStrategyAgent,
  updateBrandStrategyStatus,
} from "@/services/brand-strategy";
import {
  listBrandColorPalettesByProject,
  runBrandColorPaletteAgent,
  updateBrandColorPaletteStatus,
} from "@/services/brand-palettes";
import {
  listBrandTypographySetsByProject,
  runBrandTypographyAgent,
  updateBrandTypographyStatus,
} from "@/services/brand-typography";
import { BRAND_PROJECT_STATUS_BADGE } from "@/lib/brand-studio";
import {
  BRAND_PROJECT_STATUS_LABELS,
  type BrandAiRun,
  type BrandBrief,
  type BrandBriefReference,
  type BrandColorPaletteOutput,
  type BrandColorToken,
  type BrandDesignAsset,
  type BrandProject,
  type BrandStrategyOutput,
  type BrandTask,
  type BrandTypographySet,
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

const STRATEGY_STATUS_LABELS = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
} as const;

const STRATEGY_STATUS_BADGE = {
  pendente: "bg-amber-500/15 text-amber-400",
  aprovado: "bg-emerald-500/15 text-emerald-400",
  rejeitado: "bg-rose-500/15 text-rose-400",
} as const;

const VISUAL_STATUS_LABELS = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  rejeitado: "Revisar",
} as const;

const VISUAL_STATUS_BADGE = {
  pendente: "bg-amber-500/15 text-amber-400",
  aprovado: "bg-emerald-500/15 text-emerald-400",
  rejeitado: "bg-rose-500/15 text-rose-400",
} as const;

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
  const [strategyOutputs, setStrategyOutputs] = useState<BrandStrategyOutput[]>([]);
  const [colorPalettes, setColorPalettes] = useState<BrandColorPaletteOutput[]>([]);
  const [typographySets, setTypographySets] = useState<BrandTypographySet[]>([]);

  const [form, setForm] = useState<BriefFormState>(emptyFormState);
  const [savingBrief, setSavingBrief] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [runningStrategy, setRunningStrategy] = useState(false);
  const [runningPalette, setRunningPalette] = useState(false);
  const [runningTypography, setRunningTypography] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [updatingStrategy, setUpdatingStrategy] = useState(false);
  const [updatingPalette, setUpdatingPalette] = useState(false);
  const [updatingTypography, setUpdatingTypography] = useState(false);

  const [urlInput, setUrlInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [localImagePreviews, setLocalImagePreviews] = useState<LocalImagePreview[]>([]);
  const localImagePreviewsRef = useRef<LocalImagePreview[]>([]);
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

  const latestStrategy = useMemo(() => strategyOutputs[0] || null, [strategyOutputs]);
  const strategyPayload = latestStrategy?.output_payload || null;
  const strategyDirections = strategyPayload?.direcoes_criativas || [];

  const latestPalette = useMemo(() => colorPalettes[0] || null, [colorPalettes]);
  const previousPalette = useMemo(() => colorPalettes[1] || null, [colorPalettes]);
  const palettePayload = latestPalette?.output_payload || null;

  const latestTypography = useMemo(() => typographySets[0] || null, [typographySets]);
  const previousTypography = useMemo(() => typographySets[1] || null, [typographySets]);
  const typographyPayload = latestTypography?.output_payload || null;

  const canRunVisual = latestStrategy?.status === "aprovado";

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
      const [
        projectData,
        briefsData,
        tasksData,
        versionsData,
        assetsData,
        referencesData,
        aiRunsData,
        strategyData,
        paletteData,
        typographyData,
      ] = await Promise.all([
        getBrandProjectById(id),
        getBrandBriefsByProject(id),
        getBrandTasksByProject(id),
        listBrandVersionsByProject(id),
        getBrandAssetsByProject(id),
        listBrandBriefReferencesByProject(id),
        getBrandAiRunsByProject(id, 20),
        listBrandStrategyOutputsByProject(id, 5),
        listBrandColorPalettesByProject(id, 5),
        listBrandTypographySetsByProject(id, 5),
      ]);

      setProject(projectData);
      setBriefs(briefsData);
      setActiveBrief(briefsData[0] || null);
      setTasks(tasksData);
      setVersions(versionsData);
      setAssets(assetsData);
      setReferences(referencesData);
      setAiRuns(aiRunsData);
      setStrategyOutputs(strategyData);
      setColorPalettes(paletteData);
      setTypographySets(typographyData);

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
    localImagePreviewsRef.current = localImagePreviews;
  }, [localImagePreviews]);

  useEffect(() => {
    return () => {
      localImagePreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, []);

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

      toast.success(
        `brand_briefing_agent executado (readiness ${result.output.readiness_score}%)${
          result.used_fallback ? " - fallback local" : ""
        }`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agente");
    } finally {
      setRunningAgent(false);
    }
  };

  const handleRunStrategyAgent = async () => {
    if (!project) return;

    setRunningStrategy(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBrandStrategyAgent({
        project,
        brief: briefForRun,
        references,
      });

      setStrategyOutputs((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`brand_strategy_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agente");
    } finally {
      setRunningStrategy(false);
    }
  };

  const handleUpdateStrategyStatus = async (status: "aprovado" | "rejeitado") => {
    if (!latestStrategy) return;
    setUpdatingStrategy(true);
    try {
      const updated = await updateBrandStrategyStatus(latestStrategy.id, status);
      setStrategyOutputs((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== updated.id);
        return [updated, ...withoutCurrent];
      });
      toast.success(status === "aprovado" ? "Direcao aprovada" : "Direcao rejeitada");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar status");
    } finally {
      setUpdatingStrategy(false);
    }
  };

  const handleRunPaletteAgent = async () => {
    if (!project) return;

    setRunningPalette(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBrandColorPaletteAgent({
        project,
        brief: briefForRun,
        references,
        strategy: latestStrategy,
      });

      setColorPalettes((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`color_palette_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agente de paleta");
    } finally {
      setRunningPalette(false);
    }
  };

  const handleUpdatePaletteStatus = async (status: "aprovado" | "rejeitado") => {
    if (!latestPalette) return;
    setUpdatingPalette(true);
    try {
      const updated = await updateBrandColorPaletteStatus(latestPalette.id, status);
      setColorPalettes((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== updated.id);
        return [updated, ...withoutCurrent];
      });
      toast.success(status === "aprovado" ? "Paleta aprovada" : "Paleta marcada para revisao");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar status da paleta");
    } finally {
      setUpdatingPalette(false);
    }
  };

  const handleRunTypographyAgent = async () => {
    if (!project) return;

    setRunningTypography(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBrandTypographyAgent({
        project,
        brief: briefForRun,
        references,
        strategy: latestStrategy,
      });

      setTypographySets((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`typography_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agente tipografico");
    } finally {
      setRunningTypography(false);
    }
  };

  const handleUpdateTypographyStatus = async (status: "aprovado" | "rejeitado") => {
    if (!latestTypography) return;
    setUpdatingTypography(true);
    try {
      const updated = await updateBrandTypographyStatus(latestTypography.id, status);
      setTypographySets((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== updated.id);
        return [updated, ...withoutCurrent];
      });
      toast.success(status === "aprovado" ? "Tipografia aprovada" : "Tipografia marcada para revisao");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar status da tipografia");
    } finally {
      setUpdatingTypography(false);
    }
  };

  const renderSwatchGrid = (items: BrandColorToken[]) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((item, index) => (
        <div key={`${item.nome}-${item.hex}-${index}`} className="rounded-md border border-border/40 overflow-hidden">
          <div className="h-10" style={{ backgroundColor: item.hex }} />
          <div className="p-2 space-y-0.5">
            <div className="text-[11px] font-medium">{item.nome}</div>
            <div className="text-[10px] text-muted-foreground">{item.hex}</div>
            {item.role ? <div className="text-[10px] text-muted-foreground">{item.role}</div> : null}
          </div>
        </div>
      ))}
    </div>
  );

  const compactPalettePreview = (payload?: { paleta_principal: BrandColorToken[]; paleta_secundaria: BrandColorToken[]; neutros: BrandColorToken[]; destaque: BrandColorToken }) => {
    if (!payload) return [] as BrandColorToken[];
    const merged = [...payload.paleta_principal, ...payload.paleta_secundaria, ...payload.neutros, payload.destaque];
    return merged.filter(Boolean).slice(0, 8);
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
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm">
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
            <div className="text-xs text-muted-foreground mb-1">Direcao criativa</div>
            <div className="font-medium">
              {latestStrategy ? STRATEGY_STATUS_LABELS[latestStrategy.status] : "Nao gerada"}
            </div>
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

      <SectionCard
        title="Direcao estrategica e criativa"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleRunStrategyAgent} disabled={runningStrategy}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {runningStrategy ? "Executando..." : "Executar brand_strategy_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateStrategyStatus("aprovado")}
              disabled={!latestStrategy || updatingStrategy || latestStrategy.status === "aprovado"}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStrategyStatus("rejeitado")}
              disabled={!latestStrategy || updatingStrategy || latestStrategy.status === "rejeitado"}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Rejeitar
            </Button>
          </div>
        }
      >
        {latestStrategy ? (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-[10px] ${STRATEGY_STATUS_BADGE[latestStrategy.status]}`}>
                  {STRATEGY_STATUS_LABELS[latestStrategy.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Prompt {latestStrategy.prompt_version || "brand_strategy_v1"} · {latestStrategy.provider_used || "-"} · {latestStrategy.model_used || "-"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Gerado em {fmtDate(latestStrategy.criado_em)}</span>
            </div>

            {latestStrategy.status !== "aprovado" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Direcao criativa precisa ser aprovada antes de seguir para paleta, tipografia e logo.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Posicionamento</p>
                <p className="text-sm">{strategyPayload?.posicionamento || "-"}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Arquetipo</p>
                <p className="text-sm">{strategyPayload?.arquetipo || "-"}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Atributos-chave</p>
                {strategyPayload?.atributos?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {strategyPayload.atributos.map((item) => (
                      <Badge key={item} variant="secondary" className="text-[10px]">
                        {item}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Tom visual</p>
                <p className="text-sm">{strategyPayload?.tom_visual || "-"}</p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Recomendacao principal</p>
              <p className="text-sm font-medium">{strategyPayload?.recomendacao_principal || "-"}</p>
            </div>

            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">Lista do que evitar</p>
              {strategyPayload?.evitar?.length ? (
                <div className="flex flex-wrap gap-2">
                  {strategyPayload.evitar.map((item) => (
                    <Badge key={item} variant="outline" className="text-[10px]">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">-</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Direcoes criativas</p>
              {strategyDirections.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {strategyDirections.map((direction, index) => (
                    <div key={`${direction.titulo || "direcao"}-${index}`} className="rounded-lg border border-border/50 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{direction.titulo || `Direcao ${index + 1}`}</p>
                        {strategyPayload?.recomendacao_principal === direction.titulo && (
                          <Badge className="text-[10px]">Recomendado</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{direction.descricao || "-"}</p>
                      <div className="text-xs text-muted-foreground">Justificativa estrategica</div>
                      <p className="text-xs">{direction.justificativa_estrategica || "-"}</p>
                      <div className="text-xs text-muted-foreground">Tom visual</div>
                      <p className="text-xs">{direction.tom_visual || "-"}</p>
                      {direction.atributos_chave?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {direction.atributos_chave.map((item) => (
                            <Badge key={item} variant="secondary" className="text-[10px]">
                              {item}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {direction.palavras_chave?.length ? (
                        <p className="text-[11px] text-muted-foreground">Palavras-chave: {direction.palavras_chave.join(", ")}</p>
                      ) : null}
                      {direction.aplicacoes?.length ? (
                        <p className="text-[11px] text-muted-foreground">Aplicacoes: {direction.aplicacoes.join(", ")}</p>
                      ) : null}
                      {direction.evitar?.length ? (
                        <p className="text-[11px] text-muted-foreground">Evitar: {direction.evitar.join(", ")}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="Sem direcoes" description="Execute o brand_strategy_agent para gerar direcoes criativas." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            title="Direcao nao gerada"
            description="Execute o brand_strategy_agent para transformar o briefing em direcao estrategica."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Paleta de cores"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunPaletteAgent}
              disabled={runningPalette || !canRunVisual}
            >
              <Palette className="h-3.5 w-3.5 mr-1" />
              {runningPalette ? "Executando..." : "Executar color_palette_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdatePaletteStatus("aprovado")}
              disabled={!latestPalette || updatingPalette || latestPalette.status === "aprovado"}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdatePaletteStatus("rejeitado")}
              disabled={!latestPalette || updatingPalette || latestPalette.status === "rejeitado"}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Revisar
            </Button>
          </div>
        }
      >
        {latestPalette ? (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-[10px] ${VISUAL_STATUS_BADGE[latestPalette.status]}`}>
                  {VISUAL_STATUS_LABELS[latestPalette.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Prompt {latestPalette.prompt_version || "brand_palette_v1"} · {latestPalette.provider_used || "-"} · {latestPalette.model_used || "-"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Gerado em {fmtDate(latestPalette.criado_em)}</span>
            </div>

            {!canRunVisual && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Direcao criativa precisa estar aprovada para gerar e aprovar a paleta.
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Paleta principal</p>
                {palettePayload?.paleta_principal?.length ? (
                  renderSwatchGrid(palettePayload.paleta_principal)
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Paleta secundaria</p>
                {palettePayload?.paleta_secundaria?.length ? (
                  renderSwatchGrid(palettePayload.paleta_secundaria)
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Neutros</p>
                {palettePayload?.neutros?.length ? renderSwatchGrid(palettePayload.neutros) : <p className="text-xs text-muted-foreground">-</p>}
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Cor de destaque</p>
                {palettePayload?.destaque ? renderSwatchGrid([palettePayload.destaque]) : <p className="text-xs text-muted-foreground">-</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Rationale</p>
                <p className="text-sm">{palettePayload?.rationale || "-"}</p>
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Notas de acessibilidade</p>
                <p className="text-xs">{palettePayload?.acessibilidade?.notas || "-"}</p>
                {palettePayload?.acessibilidade?.contrastes_recomendados?.length ? (
                  <p className="text-[11px] text-muted-foreground">
                    Contrastes recomendados: {palettePayload.acessibilidade.contrastes_recomendados.join("; ")}
                  </p>
                ) : null}
                {palettePayload?.acessibilidade?.evitar?.length ? (
                  <p className="text-[11px] text-muted-foreground">Evitar: {palettePayload.acessibilidade.evitar.join("; ")}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            title="Paleta nao gerada"
            description="Execute o color_palette_agent para gerar a paleta base da marca."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Tipografia"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunTypographyAgent}
              disabled={runningTypography || !canRunVisual}
            >
              <Type className="h-3.5 w-3.5 mr-1" />
              {runningTypography ? "Executando..." : "Executar typography_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateTypographyStatus("aprovado")}
              disabled={!latestTypography || updatingTypography || latestTypography.status === "aprovado"}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateTypographyStatus("rejeitado")}
              disabled={!latestTypography || updatingTypography || latestTypography.status === "rejeitado"}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Revisar
            </Button>
          </div>
        }
      >
        {latestTypography ? (
          <div className="space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-[10px] ${VISUAL_STATUS_BADGE[latestTypography.status]}`}>
                  {VISUAL_STATUS_LABELS[latestTypography.status]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Prompt {latestTypography.prompt_version || "brand_typography_v1"} · {latestTypography.provider_used || "-"} · {latestTypography.model_used || "-"}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Gerado em {fmtDate(latestTypography.criado_em)}</span>
            </div>

            {!canRunVisual && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Direcao criativa precisa estar aprovada para gerar e aprovar a tipografia.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">Fontes sugeridas</p>
                {typographyPayload?.fontes_sugeridas?.length ? (
                  <div className="space-y-3">
                    {typographyPayload.fontes_sugeridas.map((font) => (
                      <div key={font.nome} className="rounded-md border border-border/40 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{font.nome}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {font.categoria}
                          </Badge>
                        </div>
                        {font.usos?.length ? (
                          <p className="text-xs text-muted-foreground">Usos: {font.usos.join(", ")}</p>
                        ) : null}
                        <div
                          className="rounded-md border border-border/40 px-3 py-2 text-sm"
                          style={{
                            fontFamily: `${font.nome}, ${(typographyPayload.fallback || ["system-ui"]).join(", ")}`,
                          }}
                        >
                          Aa Bb 123456 · Exemplo tipografico
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>

              <div className="rounded-lg border border-border/50 p-3 space-y-3">
                <p className="text-xs text-muted-foreground">Pesos e fallback</p>
                {typographyPayload?.pesos?.length ? (
                  <div className="space-y-2">
                    {typographyPayload.pesos.map((peso) => (
                      <div key={peso.fonte} className="rounded-md border border-border/40 p-2">
                        <p className="text-xs font-medium">{peso.fonte}</p>
                        <p className="text-[11px] text-muted-foreground">{peso.pesos.join(" · ")}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
                {typographyPayload?.fallback?.length ? (
                  <p className="text-[11px] text-muted-foreground">Fallback: {typographyPayload.fallback.join(", ")}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Regras de uso</p>
                {typographyPayload?.regras_uso?.length ? (
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {typographyPayload.regras_uso.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>
              <div className="rounded-lg border border-border/50 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Regras de evitar</p>
                {typographyPayload?.regras_evitar?.length ? (
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                    {typographyPayload.regras_evitar.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">-</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            title="Tipografia nao gerada"
            description="Execute o typography_agent para gerar o conjunto tipografico da marca."
          />
        )}
      </SectionCard>

      <SectionCard title="Comparativo de versoes">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/50 p-3 space-y-3">
            <p className="text-sm font-medium">Paleta</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md border border-border/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Atual</p>
                {latestPalette?.output_payload ? (
                  <div className="flex flex-wrap gap-1">
                    {compactPalettePreview(latestPalette.output_payload).map((item) => (
                      <span key={`${item.nome}-${item.hex}`} className="h-6 w-6 rounded border" style={{ backgroundColor: item.hex }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  v{latestPalette?.version_number || "-"} · {latestPalette ? VISUAL_STATUS_LABELS[latestPalette.status] : "-"}
                </p>
              </div>
              <div className="rounded-md border border-border/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Anterior</p>
                {previousPalette?.output_payload ? (
                  <div className="flex flex-wrap gap-1">
                    {compactPalettePreview(previousPalette.output_payload).map((item) => (
                      <span key={`${item.nome}-${item.hex}`} className="h-6 w-6 rounded border" style={{ backgroundColor: item.hex }} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem versao anterior</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  v{previousPalette?.version_number || "-"} · {previousPalette ? VISUAL_STATUS_LABELS[previousPalette.status] : "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 p-3 space-y-3">
            <p className="text-sm font-medium">Tipografia</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-md border border-border/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Atual</p>
                {latestTypography?.output_payload?.fontes_sugeridas?.length ? (
                  <div className="text-xs text-muted-foreground">
                    {latestTypography.output_payload.fontes_sugeridas.map((font) => font.nome).join(" · ")}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem dados</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  v{latestTypography?.version_number || "-"} · {latestTypography ? VISUAL_STATUS_LABELS[latestTypography.status] : "-"}
                </p>
              </div>
              <div className="rounded-md border border-border/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Anterior</p>
                {previousTypography?.output_payload?.fontes_sugeridas?.length ? (
                  <div className="text-xs text-muted-foreground">
                    {previousTypography.output_payload.fontes_sugeridas.map((font) => font.nome).join(" · ")}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Sem versao anterior</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  v{previousTypography?.version_number || "-"} · {previousTypography ? VISUAL_STATUS_LABELS[previousTypography.status] : "-"}
                </p>
              </div>
            </div>
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
