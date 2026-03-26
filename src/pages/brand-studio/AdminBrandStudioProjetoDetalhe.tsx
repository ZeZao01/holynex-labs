import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Check, ClipboardCheck, Link2, Palette, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, Type, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import SectionCard from "@/components/admin/SectionCard";
import EmptyState from "@/components/admin/EmptyState";
import AccessDenied from "@/components/admin/AccessDenied";
import OperationalStatusPanel from "@/components/admin/OperationalStatusPanel";
import BrandStudioRouteHeader from "@/components/brand-studio/BrandStudioRouteHeader";
import { useAccessControl } from "@/hooks/useAccessControl";
import { getBrandProjectById, updateBrandProject } from "@/services/brand-projects";
import { getBrandBriefsByProject, saveBrandBrief } from "@/services/brand-briefs";
import { getBrandTasksByProject } from "@/services/brand-tasks";
import { getBrandAssetsByProject } from "@/services/brand-assets";
import { listBrandVersionsByProject } from "@/services/brand-pdf";
import { getBrandAiRunsByProject } from "@/services/brand-agents";
import { runBrandConsistencyQaAgent } from "@/services/brand-consistency-qa";
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
import {
  listBrandLogoConceptsByProject,
  runBrandLogoConceptAgent,
  runBrandLogoCriticAgent,
  updateBrandLogoConceptSelection,
  updateBrandLogoConceptStatus,
} from "@/services/brand-logo";
import {
  listBrandPiecesByProject,
  runBusinessCardAgent,
  runFlyerAgent,
  updateBrandPieceStatus,
} from "@/services/brand-pieces";
import { BRAND_PROJECT_STATUS_BADGE } from "@/lib/brand-studio";
import {
  BRAND_PROJECT_STATUS_LABELS,
  type BrandAiRun,
  type BrandConsistencyQaOutput,
  type BrandBrief,
  type BrandBriefReference,
  type BrandBusinessCardOutputPayload,
  type BrandColorPaletteOutput,
  type BrandColorToken,
  type BrandDesignAsset,
  type BrandFlyerOutputPayload,
  type BrandLogoConcept,
  type BrandLogoConceptItem,
  type BrandPiece,
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

interface DeliveryChecklistState {
  files_ready: boolean;
  versions_approved: boolean;
  pdf_generated: boolean;
  required_pieces_done: boolean;
  final_notes: string;
  updated_at?: string;
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

const baseChecklistState: DeliveryChecklistState = {
  files_ready: false,
  versions_approved: false,
  pdf_generated: false,
  required_pieces_done: false,
  final_notes: "",
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

const buildChecklistState = (
  project: BrandProject | null,
  defaults: DeliveryChecklistState
): DeliveryChecklistState => {
  if (!project?.metadata || typeof project.metadata !== "object") return defaults;
  const raw = (project.metadata as { delivery_checklist?: Partial<DeliveryChecklistState> }).delivery_checklist;
  if (!raw || typeof raw !== "object") return defaults;
  return {
    ...defaults,
    ...raw,
    final_notes: typeof raw.final_notes === "string" ? raw.final_notes : defaults.final_notes,
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

const QA_STATUS_LABELS = {
  pronto: "Pronto",
  em_revisao: "Em revisao",
  critico: "Critico",
} as const;

const QA_STATUS_BADGE = {
  pronto: "bg-emerald-500/15 text-emerald-400",
  em_revisao: "bg-amber-500/15 text-amber-400",
  critico: "bg-rose-500/15 text-rose-400",
} as const;

export default function AdminBrandStudioProjetoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const {
    loading: accessLoading,
    canViewBrandProject,
    canEditBrandProject,
    canRunBrandAgent,
    canApproveBrandAsset,
    canManageBrandAgents,
    canViewBrandSensitive,
    guardAction,
  } = useAccessControl();

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
  const [logoConcepts, setLogoConcepts] = useState<BrandLogoConcept[]>([]);
  const [pieces, setPieces] = useState<BrandPiece[]>([]);

  const [form, setForm] = useState<BriefFormState>(emptyFormState);
  const [savingBrief, setSavingBrief] = useState(false);
  const [runningAgent, setRunningAgent] = useState(false);
  const [runningStrategy, setRunningStrategy] = useState(false);
  const [runningPalette, setRunningPalette] = useState(false);
  const [runningTypography, setRunningTypography] = useState(false);
  const [runningLogoConcept, setRunningLogoConcept] = useState(false);
  const [runningLogoCritic, setRunningLogoCritic] = useState(false);
  const [runningBusinessCard, setRunningBusinessCard] = useState(false);
  const [runningFlyer, setRunningFlyer] = useState(false);
  const [runningConsistencyQa, setRunningConsistencyQa] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [updatingStrategy, setUpdatingStrategy] = useState(false);
  const [updatingPalette, setUpdatingPalette] = useState(false);
  const [updatingTypography, setUpdatingTypography] = useState(false);
  const [updatingLogoStatus, setUpdatingLogoStatus] = useState(false);
  const [updatingPieceStatus, setUpdatingPieceStatus] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [checklist, setChecklist] = useState<DeliveryChecklistState>(baseChecklistState);
  const [qaOutput, setQaOutput] = useState<BrandConsistencyQaOutput | null>(null);

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

  const [selectedConceptIndex, setSelectedConceptIndex] = useState(0);
  const [compareConceptA, setCompareConceptA] = useState(0);
  const [compareConceptB, setCompareConceptB] = useState(1);

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

  const latestLogoConcept = useMemo(() => logoConcepts[0] || null, [logoConcepts]);
  const logoPayload = latestLogoConcept?.output_payload || null;
  const logoItems = (logoPayload?.conceitos || []) as BrandLogoConceptItem[];
  const selectedConcept = logoItems[selectedConceptIndex] || logoItems[0] || null;
  const compareLeft = logoItems[compareConceptA] || null;
  const compareRight = logoItems[compareConceptB] || null;

  const latestBusinessCard = useMemo(
    () => pieces.find((piece) => piece.piece_type === "business_card") || null,
    [pieces]
  );
  const latestFlyer = useMemo(() => pieces.find((piece) => piece.piece_type === "flyer") || null, [pieces]);
  const businessCardPayload = latestBusinessCard?.output_payload as unknown as BrandBusinessCardOutputPayload | null;
  const flyerPayload = latestFlyer?.output_payload as unknown as BrandFlyerOutputPayload | null;

  const canRunVisual = latestStrategy?.status === "aprovado";
  const canRunLogo = canRunVisual;
  const canRunPieces =
    latestStrategy?.status === "aprovado" &&
    latestPalette?.status === "aprovado" &&
    latestTypography?.status === "aprovado" &&
    latestLogoConcept?.status === "aprovado";

  const showPromptDetails = canManageBrandAgents() || canViewBrandSensitive();

  const requiredPieceTypes = ["business_card", "flyer"] as const;
  const requiredPieces = useMemo(
    () =>
      requiredPieceTypes.map((type) => ({
        type,
        label: type === "business_card" ? "Cartao de visita" : "Flyer",
        latest: pieces.find((piece) => piece.piece_type === type) || null,
      })),
    [pieces]
  );

  const hasApprovedPalette = colorPalettes.some((item) => item.status === "aprovado");
  const hasApprovedTypography = typographySets.some((item) => item.status === "aprovado");
  const hasApprovedLogo = logoConcepts.some((item) => item.status === "aprovado");
  const hasApprovedSystemVisual = hasApprovedPalette && hasApprovedTypography;
  const hasPresentation = versions.some((version) => Boolean(version.presentation_url));
  const requiredPiecesApproved = requiredPieces.every((item) => item.latest?.status === "aprovado");
  const autoVersionsApproved = versions.some((version) => ["aprovado", "apresentado"].includes(version.status));
  const hasFinalAssets = assets.some((asset) => asset.bucket === "brand-final" || asset.asset_type === "presentation");

  const latestConsistencyRun = useMemo(
    () =>
      aiRuns.find((run) =>
        (run.input_payload as { agent_key?: string } | null)?.agent_key === "brand_consistency_qa_agent"
      ) || null,
    [aiRuns]
  );

  const latestConsistencyOutput = useMemo(() => {
    const raw = latestConsistencyRun?.output_payload as Record<string, unknown> | null;
    if (!raw || typeof raw !== "object") return null;
    const statusRaw = String(raw.status || "");
    const normalizedStatus =
      statusRaw === "aprovado" ? "pronto" : statusRaw === "atencao" ? "em_revisao" : statusRaw;
    const readinessForDelivery =
      typeof raw.readiness_for_delivery === "boolean" ? raw.readiness_for_delivery : normalizedStatus !== "critico";
    const checksRaw = Array.isArray(raw.checks) ? raw.checks : [];
    const checks = checksRaw.map((check) => {
      const payload = typeof check === "object" && check ? (check as Record<string, unknown>) : {};
      const checkStatusRaw = String(payload.status || "");
      const normalizedCheckStatus =
        checkStatusRaw === "warn"
          ? "attention"
          : checkStatusRaw === "fail"
            ? "critical"
            : checkStatusRaw === "pending"
              ? "pending"
              : checkStatusRaw === "ok"
                ? "ok"
                : "attention";
      return {
        ...payload,
        status: normalizedCheckStatus,
      };
    });
    return {
      ...(raw as BrandConsistencyQaOutput),
      status: (normalizedStatus || "em_revisao") as BrandConsistencyQaOutput["status"],
      readiness_score: typeof raw.readiness_score === "number" ? raw.readiness_score : 0,
      readiness_for_delivery: readinessForDelivery,
      checks: checks.length ? (checks as BrandConsistencyQaOutput["checks"]) : (raw as BrandConsistencyQaOutput).checks,
    };
  }, [latestConsistencyRun]);

  const checklistDefaults = useMemo(
    () => ({
      ...baseChecklistState,
      pdf_generated: hasPresentation,
      required_pieces_done: requiredPiecesApproved,
    }),
    [hasPresentation, requiredPiecesApproved]
  );

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
    if (!id || !canViewBrandProject()) return;
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
        logoData,
        piecesData,
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
        listBrandLogoConceptsByProject(id, 5),
        listBrandPiecesByProject(id, 5),
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
      setLogoConcepts(logoData);
      setPieces(piecesData);

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
  }, [id, canViewBrandProject, loadLinkOptions]);

  useEffect(() => {
    if (!latestLogoConcept?.output_payload?.conceitos?.length) return;
    const storedIndex = Number(latestLogoConcept.selected_concept_index ?? 0);
    const safeIndex = Number.isFinite(storedIndex) ? storedIndex : 0;
    const maxIndex = latestLogoConcept.output_payload.conceitos.length - 1;
    const clampedIndex = Math.min(Math.max(0, safeIndex), maxIndex);
    setSelectedConceptIndex(clampedIndex);
    setCompareConceptA(0);
    setCompareConceptB(Math.min(1, maxIndex));
  }, [latestLogoConcept?.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!project) return;
    setChecklist(buildChecklistState(project, checklistDefaults));
  }, [project, checklistDefaults]);

  useEffect(() => {
    setQaOutput(latestConsistencyOutput || null);
  }, [latestConsistencyOutput]);

  useEffect(() => {
    localImagePreviewsRef.current = localImagePreviews;
  }, [localImagePreviews]);

  useEffect(() => {
    return () => {
      localImagePreviewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
    };
  }, []);

  const ensureEditPermission = useCallback(async (description: string) => {
    const allowed = await guardAction("brand_studio", "edit_brand_project", {
      description,
      severity: "medium",
      metadata: { source: "brand_project_detail" },
    });
    if (!allowed) toast.error("Sem permissao para editar o projeto");
    return allowed;
  }, [guardAction]);

  const ensureRunPermission = useCallback(async (description: string) => {
    const allowed = await guardAction("brand_studio", "run_brand_agent", {
      description,
      severity: "medium",
      metadata: { source: "brand_project_detail" },
    });
    if (!allowed) toast.error("Sem permissao para executar agentes");
    return allowed;
  }, [guardAction]);

  const ensureApprovePermission = useCallback(async (description: string) => {
    const allowed = await guardAction("brand_studio", "approve_brand_asset", {
      description,
      severity: "medium",
      metadata: { source: "brand_project_detail" },
    });
    if (!allowed) toast.error("Sem permissao para aprovar ativos");
    return allowed;
  }, [guardAction]);

  const persistBrief = useCallback(async () => {
    if (!(await ensureEditPermission("Salvar briefing de branding"))) {
      throw new Error("Sem permissao para editar briefing");
    }
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
  }, [activeBrief?.id, activeBrief?.status, form, project, ensureEditPermission]);

  const handleSaveBrief = async () => {
    if (!(await ensureEditPermission("Salvar briefing de branding"))) return;
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

    if (!(await ensureEditPermission("Atualizar vinculos operacionais"))) return;

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
    if (!(await ensureEditPermission("Enviar referencias de briefing"))) return;

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
    if (!(await ensureEditPermission("Adicionar URLs de referencia"))) return;

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
    if (!(await ensureEditPermission("Adicionar notas de referencia"))) return;

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
    if (!(await ensureEditPermission("Remover referencia de briefing"))) return;
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
    if (!(await ensureRunPermission("Executar brand_briefing_agent"))) return;

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
    if (!(await ensureRunPermission("Executar brand_strategy_agent"))) return;

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
    if (!(await ensureApprovePermission("Atualizar status de direcao estrategica"))) return;
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
    if (!(await ensureRunPermission("Executar color_palette_agent"))) return;

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
    if (!(await ensureApprovePermission("Atualizar status de paleta"))) return;
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
    if (!(await ensureRunPermission("Executar typography_agent"))) return;

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

  const handleRunLogoConceptAgent = async () => {
    if (!project) return;
    if (!(await ensureRunPermission("Executar logo_concept_agent"))) return;

    setRunningLogoConcept(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBrandLogoConceptAgent({
        project,
        brief: briefForRun,
        references,
        strategy: latestStrategy,
        palette: latestPalette,
        typography: latestTypography,
      });

      setLogoConcepts((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`logo_concept_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agente de logo");
    } finally {
      setRunningLogoConcept(false);
    }
  };

  const handleRunLogoCriticAgent = async () => {
    if (!project || !latestLogoConcept) return;
    if (!(await ensureRunPermission("Executar logo_critic_agent"))) return;

    setRunningLogoCritic(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBrandLogoCriticAgent({
        project,
        brief: briefForRun,
        references,
        concept: latestLogoConcept,
        selectedConceptIndex,
      });

      setLogoConcepts((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`logo_critic_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao da critica");
    } finally {
      setRunningLogoCritic(false);
    }
  };

  const handleUpdateLogoStatus = async (status: "aprovado" | "rejeitado") => {
    if (!latestLogoConcept) return;
    if (!(await ensureApprovePermission("Atualizar status do logo"))) return;
    setUpdatingLogoStatus(true);
    try {
      const updated = await updateBrandLogoConceptStatus(latestLogoConcept.id, status);
      setLogoConcepts((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== updated.id);
        return [updated, ...withoutCurrent];
      });
      toast.success(status === "aprovado" ? "Conceito aprovado" : "Conceito rejeitado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar status do conceito");
    } finally {
      setUpdatingLogoStatus(false);
    }
  };

  const handleSelectConcept = async (index: number) => {
    if (!latestLogoConcept || !logoItems[index]) return;
    if (!(await ensureEditPermission("Selecionar conceito de logo"))) return;
    setSelectedConceptIndex(index);
    try {
      const updated = await updateBrandLogoConceptSelection({
        id: latestLogoConcept.id,
        selected_concept_index: index,
        selected_concept_title: logoItems[index]?.titulo || null,
      });
      setLogoConcepts((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== updated.id);
        return [updated, ...withoutCurrent];
      });
    } catch {
      // manter selecao local mesmo que falhe no backend
    }
  };

  const handleRunBusinessCardAgent = async () => {
    if (!project) return;
    if (!(await ensureRunPermission("Executar business_card_agent"))) return;

    setRunningBusinessCard(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runBusinessCardAgent({
        project,
        brief: briefForRun,
        references,
        strategy: latestStrategy,
        palette: latestPalette,
        typography: latestTypography,
        logo: latestLogoConcept,
      });

      setPieces((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`business_card_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agent de cartao");
    } finally {
      setRunningBusinessCard(false);
    }
  };

  const handleRunFlyerAgent = async () => {
    if (!project) return;
    if (!(await ensureRunPermission("Executar flyer_agent"))) return;

    setRunningFlyer(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }

      const result = await runFlyerAgent({
        project,
        brief: briefForRun,
        references,
        strategy: latestStrategy,
        palette: latestPalette,
        typography: latestTypography,
        logo: latestLogoConcept,
      });

      setPieces((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== result.output.id);
        return [result.output, ...withoutCurrent];
      });
      setAiRuns((prev) => [result.run, ...prev]);

      toast.success(`flyer_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do agent de flyer");
    } finally {
      setRunningFlyer(false);
    }
  };

  const handleUpdatePieceStatus = async (pieceId: string, status: "aprovado" | "rejeitado") => {
    if (!(await ensureApprovePermission("Atualizar status de peca"))) return;
    setUpdatingPieceStatus(true);
    try {
      const updated = await updateBrandPieceStatus(pieceId, status);
      setPieces((prev) => {
        const withoutCurrent = prev.filter((item) => item.id !== updated.id);
        return [updated, ...withoutCurrent];
      });
      toast.success(status === "aprovado" ? "Peca aprovada" : "Peca marcada para revisao");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao atualizar status da peca");
    } finally {
      setUpdatingPieceStatus(false);
    }
  };

  const updateChecklistValue = (key: keyof DeliveryChecklistState, value: boolean | string) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRunConsistencyQa = async () => {
    if (!project) return;
    if (!(await ensureRunPermission("Executar brand_consistency_qa_agent"))) return;
    setRunningConsistencyQa(true);
    try {
      let briefForRun = activeBrief;
      if (!briefForRun) {
        briefForRun = await persistBrief();
      }
      const result = await runBrandConsistencyQaAgent({
        project,
        brief: briefForRun,
        strategy: latestStrategy,
        palette: latestPalette,
        typography: latestTypography,
        logo: latestLogoConcept,
        pieces,
        versions,
      });
      setAiRuns((prev) => [result.run, ...prev]);
      setQaOutput(result.output);
      toast.success(`brand_consistency_qa_agent executado${result.used_fallback ? " - fallback local" : ""}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na execucao do QA de consistencia");
    } finally {
      setRunningConsistencyQa(false);
    }
  };

  const handleSaveChecklist = async () => {
    if (!project) return;
    if (!(await ensureEditPermission("Salvar checklist operacional"))) return;
    setSavingChecklist(true);
    try {
      const nextMetadata = {
        ...(project.metadata || {}),
        delivery_checklist: {
          ...checklist,
          updated_at: new Date().toISOString(),
        },
      };
      const updated = await updateBrandProject(project.id, { metadata: nextMetadata });
      setProject(updated);
      toast.success("Checklist operacional salvo");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar checklist operacional");
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleUpdateTypographyStatus = async (status: "aprovado" | "rejeitado") => {
    if (!latestTypography) return;
    if (!(await ensureApprovePermission("Atualizar status de tipografia"))) return;
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

  const checklistComplete =
    checklist.files_ready &&
    checklist.versions_approved &&
    checklist.pdf_generated &&
    checklist.required_pieces_done;

  const qaHasCritical = Boolean(qaOutput?.critical_issues?.length || qaOutput?.status === "critico");
  const qaReady = qaOutput?.readiness_for_delivery === true;
  const qaStatusLabel = qaOutput ? QA_STATUS_LABELS[qaOutput.status] ?? "Em revisao" : "Pendente";
  const qaStatusBadge = qaOutput
    ? QA_STATUS_BADGE[qaOutput.status] ?? "bg-amber-500/15 text-amber-400"
    : "bg-muted text-muted-foreground";

  const deliveryBlocks = [
    !hasApprovedLogo ? "Logo aprovado ausente" : null,
    !hasApprovedSystemVisual ? "Sistema visual aprovado ausente" : null,
    qaHasCritical ? "QA marcou inconsistencias criticas" : null,
    !hasPresentation ? "PDF nao foi gerado" : null,
  ].filter(Boolean) as string[];

  const deliveryReady = deliveryBlocks.length === 0 && checklistComplete && qaReady;

  if (!id) {
    return (
      <SectionCard>
        <EmptyState compact title="Projeto invalido" description="ID do projeto nao informado na rota." />
      </SectionCard>
    );
  }

  if (!accessLoading && !canViewBrandProject()) {
    return <AccessDenied />;
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
          <Button size="sm" variant="outline" onClick={handleSaveLinks} disabled={savingLinks || !canEditBrandProject()}>
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
          <Button size="sm" onClick={handleSaveBrief} disabled={savingBrief || !canEditBrandProject()}>
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
              <Input type="file" accept="image/*" multiple onChange={handleSelectLocalImages} disabled={!canEditBrandProject()} />
              <Button
                size="sm"
                variant="outline"
                onClick={handleUploadLocalImages}
                disabled={uploadingImages || !localImagePreviews.length || !canEditBrandProject()}
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploadingImages ? "Enviando..." : "Enviar imagens"}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">URLs de referencia (uma por linha)</Label>
              <Textarea rows={4} value={urlInput} onChange={(event) => setUrlInput(event.target.value)} />
              <Button size="sm" variant="outline" onClick={handleCreateUrlReferences} disabled={!canEditBrandProject()}>
                Adicionar URLs
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Notas de referencia (uma por linha)</Label>
            <Textarea rows={3} value={noteInput} onChange={(event) => setNoteInput(event.target.value)} />
            <Button size="sm" variant="outline" onClick={handleCreateNoteReferences} disabled={!canEditBrandProject()}>
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
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2"
                          onClick={() => handleDeleteReference(reference)}
                          disabled={!canEditBrandProject()}
                        >
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
          <Button size="sm" onClick={handleRunBriefingAgent} disabled={runningAgent || !canRunBrandAgent()}>
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
            <Button size="sm" variant="outline" onClick={handleRunStrategyAgent} disabled={runningStrategy || !canRunBrandAgent()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {runningStrategy ? "Executando..." : "Executar brand_strategy_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateStrategyStatus("aprovado")}
              disabled={!latestStrategy || updatingStrategy || latestStrategy.status === "aprovado" || !canApproveBrandAsset()}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateStrategyStatus("rejeitado")}
              disabled={!latestStrategy || updatingStrategy || latestStrategy.status === "rejeitado" || !canApproveBrandAsset()}
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
                {showPromptDetails ? (
                  <span className="text-xs text-muted-foreground">
                    Prompt {latestStrategy.prompt_version || "brand_strategy_v1"} · {latestStrategy.provider_used || "-"} · {latestStrategy.model_used || "-"}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Detalhes do prompt restritos</span>
                )}
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
              disabled={runningPalette || !canRunVisual || !canRunBrandAgent()}
            >
              <Palette className="h-3.5 w-3.5 mr-1" />
              {runningPalette ? "Executando..." : "Executar color_palette_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdatePaletteStatus("aprovado")}
              disabled={!latestPalette || updatingPalette || latestPalette.status === "aprovado" || !canApproveBrandAsset()}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdatePaletteStatus("rejeitado")}
              disabled={!latestPalette || updatingPalette || latestPalette.status === "rejeitado" || !canApproveBrandAsset()}
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
                {showPromptDetails ? (
                  <span className="text-xs text-muted-foreground">
                    Prompt {latestPalette.prompt_version || "brand_palette_v1"} · {latestPalette.provider_used || "-"} · {latestPalette.model_used || "-"}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Detalhes do prompt restritos</span>
                )}
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
              disabled={runningTypography || !canRunVisual || !canRunBrandAgent()}
            >
              <Type className="h-3.5 w-3.5 mr-1" />
              {runningTypography ? "Executando..." : "Executar typography_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateTypographyStatus("aprovado")}
              disabled={!latestTypography || updatingTypography || latestTypography.status === "aprovado" || !canApproveBrandAsset()}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateTypographyStatus("rejeitado")}
              disabled={!latestTypography || updatingTypography || latestTypography.status === "rejeitado" || !canApproveBrandAsset()}
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
                {showPromptDetails ? (
                  <span className="text-xs text-muted-foreground">
                    Prompt {latestTypography.prompt_version || "brand_typography_v1"} · {latestTypography.provider_used || "-"} · {latestTypography.model_used || "-"}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Detalhes do prompt restritos</span>
                )}
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

      <SectionCard
        title="Logo Lab"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunLogoConceptAgent}
              disabled={runningLogoConcept || !canRunLogo || !canRunBrandAgent()}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {runningLogoConcept ? "Executando..." : "Gerar conceitos"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunLogoCriticAgent}
              disabled={runningLogoCritic || !latestLogoConcept || !selectedConcept || !canRunLogo || !canRunBrandAgent()}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {runningLogoCritic ? "Analisando..." : "Executar logo_critic_agent"}
            </Button>
            <Button
              size="sm"
              onClick={() => handleUpdateLogoStatus("aprovado")}
              disabled={!latestLogoConcept || updatingLogoStatus || latestLogoConcept.status === "aprovado" || !canApproveBrandAsset()}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleUpdateLogoStatus("rejeitado")}
              disabled={!latestLogoConcept || updatingLogoStatus || latestLogoConcept.status === "rejeitado" || !canApproveBrandAsset()}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Rejeitar
            </Button>
          </div>
        }
      >
        {latestLogoConcept ? (
          <div className="space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-[10px] ${VISUAL_STATUS_BADGE[latestLogoConcept.status]}`}>
                  {VISUAL_STATUS_LABELS[latestLogoConcept.status]}
                </Badge>
                {showPromptDetails ? (
                  <span className="text-xs text-muted-foreground">
                    Prompt {latestLogoConcept.prompt_version || "brand_logo_concept_v1"} · {latestLogoConcept.provider_used || "-"} · {latestLogoConcept.model_used || "-"}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Detalhes do prompt restritos</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">Gerado em {fmtDate(latestLogoConcept.criado_em)}</span>
            </div>

            {!canRunLogo && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                Direcao criativa precisa estar aprovada para gerar e aprovar conceitos de logo.
              </div>
            )}

            <div className="space-y-3">
              <p className="text-sm font-medium">Conceitos gerados</p>
              {logoItems.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {logoItems.map((concept, index) => (
                    <div
                      key={`${concept.titulo}-${index}`}
                      className={`rounded-lg border p-4 space-y-2 ${
                        selectedConceptIndex === index ? "border-primary/60 bg-primary/5" : "border-border/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{concept.titulo || `Conceito ${index + 1}`}</p>
                        {logoPayload?.recomendacao_principal === concept.titulo && (
                          <Badge className="text-[10px]">Recomendado</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{concept.racional_estrategico || "-"}</p>
                      <div className="text-xs text-muted-foreground">Simbolo</div>
                      <p className="text-xs">{concept.simbolo || "-"}</p>
                      <div className="text-xs text-muted-foreground">Wordmark</div>
                      <p className="text-xs">{concept.wordmark || "-"}</p>
                      <Button
                        size="sm"
                        variant={selectedConceptIndex === index ? "default" : "outline"}
                        className="w-full"
                        onClick={() => handleSelectConcept(index)}
                        disabled={!canEditBrandProject()}
                      >
                        {selectedConceptIndex === index ? "Selecionado" : "Selecionar para critica"}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="Sem conceitos" description="Execute o logo_concept_agent para gerar conceitos." />
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-lg border border-border/50 p-4 space-y-2">
                <p className="text-sm font-medium">Prompt visual profissional</p>
                {selectedConcept ? (
                  <>
                    <p className="text-xs text-muted-foreground">{selectedConcept.prompt_visual || "-"}</p>
                    {selectedConcept.negative_guidance?.length ? (
                      <div className="text-[11px] text-muted-foreground">
                        Evitar: {selectedConcept.negative_guidance.join("; ")}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Selecione um conceito para ver o prompt.</p>
                )}
              </div>

              <div className="rounded-lg border border-border/50 p-4 space-y-2">
                <p className="text-sm font-medium">Parecer critico</p>
                {latestLogoConcept.critic_payload ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Recomendacao: {latestLogoConcept.critic_payload.recomendacao_aprovacao === "aprovar" ? "Aprovar" : "Revisar"}
                    </p>
                    {latestLogoConcept.critic_payload.riscos?.length ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Riscos</p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                          {latestLogoConcept.critic_payload.riscos.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    <div className="text-xs text-muted-foreground">Legibilidade</div>
                    <p className="text-xs">{latestLogoConcept.critic_payload.legibilidade || "-"}</p>
                    <div className="text-xs text-muted-foreground">Escalabilidade</div>
                    <p className="text-xs">{latestLogoConcept.critic_payload.escalabilidade || "-"}</p>
                    {latestLogoConcept.critic_payload.ajustes_recomendados?.length ? (
                      <div>
                        <p className="text-xs text-muted-foreground">Ajustes recomendados</p>
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                          {latestLogoConcept.critic_payload.ajustes_recomendados.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {latestLogoConcept.critic_payload.observacoes?.length ? (
                      <div className="text-[11px] text-muted-foreground">
                        Observacoes: {latestLogoConcept.critic_payload.observacoes.join("; ")}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Execute o logo_critic_agent para gerar o parecer.</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                <p className="text-sm font-medium">Comparacao lado a lado</p>
                {logoItems.length > 1 && (
                  <div className="flex flex-wrap gap-2">
                    <Select value={String(compareConceptA)} onValueChange={(value) => setCompareConceptA(Number(value))}>
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue placeholder="Conceito A" />
                      </SelectTrigger>
                      <SelectContent>
                        {logoItems.map((concept, index) => (
                          <SelectItem key={`logo-a-${index}`} value={String(index)}>
                            {concept.titulo || `Conceito ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={String(compareConceptB)} onValueChange={(value) => setCompareConceptB(Number(value))}>
                      <SelectTrigger className="h-8 w-[150px]">
                        <SelectValue placeholder="Conceito B" />
                      </SelectTrigger>
                      <SelectContent>
                        {logoItems.map((concept, index) => (
                          <SelectItem key={`logo-b-${index}`} value={String(index)}>
                            {concept.titulo || `Conceito ${index + 1}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {compareLeft && compareRight ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {[compareLeft, compareRight].map((concept, index) => (
                    <div key={`${concept.titulo}-${index}`} className="rounded-md border border-border/40 p-3 space-y-2">
                      <p className="text-sm font-medium">{concept.titulo || `Conceito ${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{concept.racional_estrategico || "-"}</p>
                      <p className="text-xs text-muted-foreground">Simbolo: {concept.simbolo || "-"}</p>
                      <p className="text-xs text-muted-foreground">Wordmark: {concept.wordmark || "-"}</p>
                      <p className="text-[11px] text-muted-foreground">Prompt: {concept.prompt_visual || "-"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Gere pelo menos dois conceitos para comparar.</p>
              )}
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <p className="text-sm font-medium">Historico de versoes</p>
              {logoConcepts.length > 0 ? (
                <div className="space-y-2">
                  {logoConcepts.map((concept) => (
                    <div key={concept.id} className="rounded-md border border-border/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">v{concept.version_number || "-"}</p>
                        <Badge className={`text-[10px] ${VISUAL_STATUS_BADGE[concept.status]}`}>
                          {VISUAL_STATUS_LABELS[concept.status]}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Gerado em {fmtDate(concept.criado_em)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Critica: {concept.critic_status === "concluido" ? "Concluida" : "Pendente"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState compact title="Sem historico" description="Nenhuma versao de conceito registrada." />
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            compact
            title="Logo nao gerado"
            description="Execute o logo_concept_agent para iniciar o Logo Lab."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Pecas derivadas da identidade"
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunBusinessCardAgent}
              disabled={runningBusinessCard || !canRunPieces || !canRunBrandAgent()}
            >
              {runningBusinessCard ? "Executando..." : "Executar business_card_agent"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRunFlyerAgent}
              disabled={runningFlyer || !canRunPieces || !canRunBrandAgent()}
            >
              {runningFlyer ? "Executando..." : "Executar flyer_agent"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {!canRunPieces && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
              Para gerar pecas, aprove direcao, paleta, tipografia e logo.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Cartao de visita</p>
                  <p className="text-[11px] text-muted-foreground">Frente/verso com hierarquia e notas de impressao</p>
                </div>
                {latestBusinessCard && (
                  <Badge className={`text-[10px] ${VISUAL_STATUS_BADGE[latestBusinessCard.status]}`}>
                    {VISUAL_STATUS_LABELS[latestBusinessCard.status]}
                  </Badge>
                )}
              </div>

              {latestBusinessCard ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">Gerado em {fmtDate(latestBusinessCard.criado_em)}</p>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Formato</p>
                    <p className="text-sm">{businessCardPayload?.formato || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Layout frente</p>
                    <p className="text-xs">{businessCardPayload?.layout_frente || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Layout verso</p>
                    <p className="text-xs">{businessCardPayload?.layout_verso || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Hierarquia</p>
                    {businessCardPayload?.hierarquia_conteudo?.length ? (
                      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        {businessCardPayload.hierarquia_conteudo.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Prompt visual</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{businessCardPayload?.prompt_visual || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Notas de impressao</p>
                    {businessCardPayload?.notas_impressao?.length ? (
                      <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                        {businessCardPayload.notas_impressao.map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePieceStatus(latestBusinessCard.id, "aprovado")}
                      disabled={updatingPieceStatus || latestBusinessCard.status === "aprovado" || !canApproveBrandAsset()}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdatePieceStatus(latestBusinessCard.id, "rejeitado")}
                      disabled={updatingPieceStatus || latestBusinessCard.status === "rejeitado" || !canApproveBrandAsset()}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Revisar
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState compact title="Sem cartao" description="Execute o business_card_agent para gerar o layout." />
              )}
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">Flyer</p>
                  <p className="text-[11px] text-muted-foreground">Headline, secoes, CTA e notas de impressao/digital</p>
                </div>
                {latestFlyer && (
                  <Badge className={`text-[10px] ${VISUAL_STATUS_BADGE[latestFlyer.status]}`}>
                    {VISUAL_STATUS_LABELS[latestFlyer.status]}
                  </Badge>
                )}
              </div>

              {latestFlyer ? (
                <div className="space-y-3">
                  <p className="text-[11px] text-muted-foreground">Gerado em {fmtDate(latestFlyer.criado_em)}</p>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Formato</p>
                    <p className="text-sm">{flyerPayload?.formato || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Headline</p>
                    <p className="text-sm">{flyerPayload?.headline || "-"}</p>
                    <p className="text-xs text-muted-foreground">Subheadline</p>
                    <p className="text-xs">{flyerPayload?.subheadline || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Secoes</p>
                    {flyerPayload?.secoes?.length ? (
                      <div className="space-y-2">
                        {flyerPayload.secoes.map((secao, index) => (
                          <div key={`${secao.titulo}-${index}`} className="rounded border border-border/40 p-2">
                            <p className="text-xs font-medium">{secao.titulo}</p>
                            <p className="text-xs text-muted-foreground">{secao.conteudo}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Layout direction</p>
                    <p className="text-xs">{flyerPayload?.layout_direction || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">CTA</p>
                    <p className="text-xs">{flyerPayload?.cta?.label || "-"}</p>
                    <p className="text-[11px] text-muted-foreground">{flyerPayload?.cta?.action || "-"}</p>
                  </div>
                  <div className="rounded-md border border-border/40 p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Prompt visual</p>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">{flyerPayload?.prompt_visual || "-"}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md border border-border/40 p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Notas de impressao</p>
                      {flyerPayload?.notas_impressao?.length ? (
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                          {flyerPayload.notas_impressao.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">-</p>
                      )}
                    </div>
                    <div className="rounded-md border border-border/40 p-3 space-y-2">
                      <p className="text-xs text-muted-foreground">Notas digitais</p>
                      {flyerPayload?.notas_digital?.length ? (
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                          {flyerPayload.notas_digital.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground">-</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePieceStatus(latestFlyer.id, "aprovado")}
                      disabled={updatingPieceStatus || latestFlyer.status === "aprovado" || !canApproveBrandAsset()}
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUpdatePieceStatus(latestFlyer.id, "rejeitado")}
                      disabled={updatingPieceStatus || latestFlyer.status === "rejeitado" || !canApproveBrandAsset()}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Revisar
                    </Button>
                  </div>
                </div>
              ) : (
                <EmptyState compact title="Sem flyer" description="Execute o flyer_agent para gerar a primeira versao." />
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 p-4 space-y-2">
            <p className="text-sm font-medium">Aplicacoes futuras (estrutura preparada)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="rounded-md border border-border/40 p-2">Capa de perfil</div>
              <div className="rounded-md border border-border/40 p-2">Assinatura de e-mail</div>
              <div className="rounded-md border border-border/40 p-2">Papel timbrado</div>
              <div className="rounded-md border border-border/40 p-2">Manual rapido</div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="QA de consistencia (IA)"
        action={
          <Button size="sm" variant="outline" onClick={handleRunConsistencyQa} disabled={runningConsistencyQa || !canRunBrandAgent()}>
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            {runningConsistencyQa ? "Executando..." : "Executar brand_consistency_qa_agent"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border/50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">Status da revisao automatizada</p>
                <p className="text-[11px] text-muted-foreground">QA nao substitui a revisao humana final.</p>
              </div>
              <Badge className={`text-[10px] ${qaStatusBadge}`}>
                {qaStatusLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {qaOutput?.summary || "Execute o QA para validar consistencia entre estrategia, visual e entregas."}
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Readiness</span>
                <span>{qaOutput?.readiness_score ?? 0}%</span>
              </div>
              <Progress value={qaOutput?.readiness_score ?? 0} className="h-1.5" />
            </div>
            <p className="text-[11px] text-muted-foreground">Ultima avaliacao: {latestConsistencyRun?.criado_em ? fmtDate(latestConsistencyRun.criado_em) : "-"}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <p className="text-sm font-medium">Criticos</p>
              {qaOutput?.critical_issues?.length ? (
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {qaOutput.critical_issues.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum bloqueio critico detectado.</p>
              )}
            </div>
            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <p className="text-sm font-medium">Atencoes</p>
              {qaOutput?.warnings?.length ? (
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {qaOutput.warnings.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Sem alertas adicionais.</p>
              )}
            </div>
            <div className="rounded-lg border border-border/50 p-3 space-y-2">
              <p className="text-sm font-medium">Pendencias</p>
              {qaOutput?.pending_items?.length ? (
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {qaOutput.pending_items.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhuma pendencia listada.</p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border/50 p-3 space-y-2">
            <p className="text-sm font-medium">Checks executados</p>
            {qaOutput?.checks?.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {qaOutput.checks.map((check) => (
                  <div key={check.id} className="rounded-md border border-border/40 p-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{check.label}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {check.status === "ok"
                          ? "OK"
                          : check.status === "attention"
                            ? "Atencao"
                            : check.status === "pending"
                              ? "Pendente"
                              : "Critico"}
                      </Badge>
                    </div>
                    {check.notes ? <p className="text-[11px] text-muted-foreground">{check.notes}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum check registrado ate o momento.</p>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Checklist operacional e entrega"
        action={
          <Button size="sm" variant="outline" onClick={handleSaveChecklist} disabled={savingChecklist || !canEditBrandProject()}>
            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
            {savingChecklist ? "Salvando..." : "Salvar checklist"}
          </Button>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Checklist final</p>
                <Badge className={`text-[10px] ${checklistComplete ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {checklistComplete ? "Completo" : "Pendente"}
                </Badge>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checklist.files_ready}
                  onCheckedChange={(value) => updateChecklistValue("files_ready", Boolean(value))}
                  disabled={!canEditBrandProject()}
                />
                <div className="flex-1">
                  <p className="text-sm">Arquivos finais disponiveis</p>
                  <p className="text-[11px] text-muted-foreground">Confirme que os assets finais estao no bucket apropriado.</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {hasFinalAssets ? "Auto: detectado" : "Auto: nao detectado"}
                </Badge>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checklist.versions_approved}
                  onCheckedChange={(value) => updateChecklistValue("versions_approved", Boolean(value))}
                  disabled={!canEditBrandProject()}
                />
                <div className="flex-1">
                  <p className="text-sm">Versoes aprovadas</p>
                  <p className="text-[11px] text-muted-foreground">Garanta que a versao final esta aprovada internamente.</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {autoVersionsApproved ? "Auto: aprovada" : "Auto: pendente"}
                </Badge>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checklist.pdf_generated}
                  onCheckedChange={(value) => updateChecklistValue("pdf_generated", Boolean(value))}
                  disabled={!canEditBrandProject()}
                />
                <div className="flex-1">
                  <p className="text-sm">PDF gerado</p>
                  <p className="text-[11px] text-muted-foreground">Apresentacao final exportada e pronta para envio.</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {hasPresentation ? "Auto: detectado" : "Auto: ausente"}
                </Badge>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  checked={checklist.required_pieces_done}
                  onCheckedChange={(value) => updateChecklistValue("required_pieces_done", Boolean(value))}
                  disabled={!canEditBrandProject()}
                />
                <div className="flex-1">
                  <p className="text-sm">Pecas obrigatorias concluidas</p>
                  <p className="text-[11px] text-muted-foreground">
                    {requiredPieces.map((piece) => piece.label).join(" + ")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {requiredPiecesApproved ? "Auto: aprovado" : "Auto: pendente"}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <Label className="text-xs">Observacoes finais</Label>
              <Textarea
                rows={3}
                value={checklist.final_notes}
                onChange={(event) => updateChecklistValue("final_notes", event.target.value)}
                placeholder="Observacoes para a entrega final (ex: detalhes do envio, ajustes combinados, etc.)"
                disabled={!canEditBrandProject()}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border/50 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">Status de entrega</p>
                <Badge className={`text-[10px] ${deliveryReady ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                  {deliveryReady ? "Pronto" : "Bloqueado"}
                </Badge>
              </div>
              <OperationalStatusPanel
                items={[
                  { label: "Logo aprovado", status: hasApprovedLogo ? "ok" : "pending" },
                  { label: "Sistema visual aprovado", status: hasApprovedSystemVisual ? "ok" : "pending" },
                  { label: "QA sem criticos", status: qaHasCritical ? "attention" : qaReady ? "ok" : "pending" },
                  { label: "PDF gerado", status: hasPresentation ? "ok" : "pending" },
                  { label: "Checklist completo", status: checklistComplete ? "ok" : "pending" },
                ]}
              />
            </div>

            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-amber-400" /> Bloqueios ativos
              </div>
              {deliveryBlocks.length ? (
                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                  {deliveryBlocks.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum bloqueio ativo identificado.</p>
              )}
            </div>
          </div>
        </div>
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
