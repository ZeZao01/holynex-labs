import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProposta, atualizarStatusProposta, atualizarProposta, atualizarPropostaArtefatos, atualizarPropostaTiers, gerarPropostaIA, togglePropostaPublic, type Proposta, type PropostaInput } from "@/lib/propostas";
import { createDefaultTiers, createDefaultAddons, PROPOSAL_STATUS_MAP, type ProposalTier, type ProposalAddon, type CommercialNotes } from "@/lib/proposal-tiers";
import { uploadPdf } from "@/lib/pdf-storage";
import { generatePropostaPdf } from "@/lib/pdf-generator";
import { listPortfolioItems } from "@/lib/portfolio-items";
import { getPortfolioReferences, type PortfolioReference } from "@/lib/portfolio-similarity";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import TierCard from "@/components/admin/TierCard";
import ScopeComparison from "@/components/admin/ScopeComparison";
import AddonSelector from "@/components/admin/AddonSelector";
import TierEditor from "@/components/admin/TierEditor";
import { Loader2, Download, Sparkles, RefreshCw, Edit3, Save, X, Link2, ExternalLink, Copy, Layers } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PdfHistorico from "@/components/PdfHistorico";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RevealBox from "@/components/RevealBox";
import { useAccessControl } from "@/hooks/useAccessControl";
import { getAddonsBySource, createAddon, ADDON_STATUS_MAP, type Addon } from "@/lib/addons";

export default function AdminPropostaDetalhe() {
  const { user, loading: authLoading } = useAuth();
  const { canCreate } = useAccessControl();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [registeringAddons, setRegisteringAddons] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [showRegenDialog, setShowRegenDialog] = useState(false);

  const [stitchDraft, setStitchDraft] = useState("");
  const [editingStitch, setEditingStitch] = useState(false);
  const [savingStitch, setSavingStitch] = useState(false);
  const [versioningStitch, setVersioningStitch] = useState(false);
  const [regeneratingStitch, setRegeneratingStitch] = useState(false);
  
  const [orientacoes, setOrientacoes] = useState("");
  const [editingTiers, setEditingTiers] = useState(false);
  const [editTiers, setEditTiers] = useState<ProposalTier[]>([]);
  const [editAddons, setEditAddons] = useState<ProposalAddon[]>([]);
  const [editNotes, setEditNotes] = useState<CommercialNotes>({ general_note: "", recommendation_justification: "", closing_strategy: "", next_steps: "" });
  const [editValidity, setEditValidity] = useState("30 dias");
  const [editPhased, setEditPhased] = useState(false);
  const [savingTiers, setSavingTiers] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [portfolioRefs, setPortfolioRefs] = useState<PortfolioReference[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (user && id) loadProposta();
  }, [user, authLoading, id]);

  useEffect(() => {
    if (!proposta) return;
    setStitchDraft(proposta.stitch_prompt || "");
  }, [proposta?.stitch_prompt]);

  useEffect(() => {
    if (!proposta) return;
    let active = true;
    const fetchRefs = async () => {
      setPortfolioLoading(true);
      try {
        const items = await listPortfolioItems(true);
        const features = [
          ...(proposta.proposta_json?.funcionalidades || []),
          ...(proposta.proposta_json?.funcionalidades_recomendadas || []),
          ...(proposta.proposta_json?.escopo || []),
        ];
        const refs = getPortfolioReferences(items, {
          niche: proposta.segmento,
          category: proposta.tipo_projeto,
          solutionType: proposta.tipo_projeto,
          features,
        }, { limit: 4, minScore: 3 });
        if (active) setPortfolioRefs(refs);
      } catch {
        if (active) setPortfolioRefs([]);
      } finally {
        if (active) setPortfolioLoading(false);
      }
    };
    fetchRefs();
    return () => { active = false; };
  }, [proposta?.id]);

  const loadProposta = async () => {
    if (!id) return;
    const data = await getProposta(id);
    setProposta(data);
    try {
      const addonsData = await getAddonsBySource("proposta", id);
      setAddons(addonsData || []);
    } catch { /* ignore addons errors */ }
    setLoading(false);
    setAddonsLoading(false);
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    await atualizarStatusProposta(id, status);
    toast.success(`Status: ${PROPOSAL_STATUS_MAP[status]?.label || status}`);
    loadProposta();
  };

  const handleRegenerate = async () => {
    if (!proposta || !id) return;
    setShowRegenDialog(false);
    setRegenerating(true);
    try {
      const portfolioItems = await listPortfolioItems(true).catch(() => []);
      const features = [
        ...(proposta.proposta_json?.funcionalidades || []),
        ...(proposta.proposta_json?.funcionalidades_recomendadas || []),
        ...(proposta.proposta_json?.escopo || []),
      ];
      const similarRefs = getPortfolioReferences(portfolioItems, {
        niche: proposta.segmento,
        category: proposta.tipo_projeto,
        solutionType: proposta.tipo_projeto,
        features,
      }, { limit: 4, minScore: 3 });
      const referenciasPortfolio = similarRefs.map((ref) => ({
        id: ref.item.id,
        title: ref.item.title,
        motivo: ref.reason || "Similaridade com o contexto do cliente",
        category: ref.item.category,
        niche: ref.item.niche,
        solution_type: ref.item.solution_type,
        system_url: ref.item.system_url || ref.item.public_url,
        thumbnail_url: ref.item.thumbnail_url || ref.item.cover_image_url,
      }));

      const input: PropostaInput = {
        nome_cliente: proposta.nome_cliente, empresa_cliente: proposta.empresa_cliente,
        segmento: proposta.segmento, email_cliente: proposta.email_cliente,
        tipo_projeto: proposta.tipo_projeto, descricao_projeto: proposta.descricao_projeto,
        problema_cliente: "", objetivo_cliente: "", funcionalidades_desejadas: [], integracoes: [],
        numero_usuarios: "", prazo_desejado: "", orcamento_cliente: "",
        nivel_urgencia: "medio", link_referencia: "", observacoes: orientacoes || "",
        orcamento_id: proposta.orcamento_id || undefined,
        referencias_portfolio: referenciasPortfolio,
      };
      const aiResult = await gerarPropostaIA(input);
      await atualizarProposta(id, aiResult.proposta, {
        structured_content: aiResult.structured_content,
        document_spec: aiResult.document_spec,
        pricing_sheet: aiResult.pricing_sheet,
        stitch_prompt: aiResult.stitch_prompt,
        hidden_addons: aiResult.hidden_addons,
        ai_metadata: aiResult.ai_metadata,
      });
      toast.success("Proposta regenerada!");
      setOrientacoes("");
      loadProposta();
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar");
    } finally { setRegenerating(false); }
  };

  const handleExportPDF = async () => {
    if (!proposta || !id) return;
    setExportingPdf(true);
    try {
      const propostaAtual = await getProposta(id);
      if (!propostaAtual) throw new Error("Proposta não encontrada para exportação.");

      const pdfBlob = await generatePropostaPdf(propostaAtual);
      const result = await uploadPdf(id, propostaAtual.nome_cliente, pdfBlob, propostaAtual);
      setPdfRefreshKey(k => k + 1);

      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposta_HolyNex_${propostaAtual.nome_cliente.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`PDF v${result.versao} gerado! Código: ${result.document_code}`);
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error(err?.message || "Erro ao exportar PDF. Tente novamente.");
    } finally { setExportingPdf(false); }
  };

  type StitchPromptVersion = {
    id: string;
    created_at: string;
    created_by: string;
    label?: string;
    prompt: string;
  };

  const getStitchHistory = (): StitchPromptVersion[] => {
    const history = proposta?.ai_metadata?.stitch_prompt_versions;
    return Array.isArray(history) ? history : [];
  };

  const handleSaveStitch = async () => {
    if (!proposta) return;
    if (!proposta.proposta_json) {
      toast.error("Proposta sem conteúdo para atualizar o stitch prompt.");
      return;
    }
    setSavingStitch(true);
    try {
      const nextPrompt = stitchDraft.trim();
      const nextMeta = {
        ...(proposta.ai_metadata || {}),
        stitch_prompt_last_edit: new Date().toISOString(),
        stitch_prompt_last_editor: user?.email || user?.id || "admin",
      };
      await atualizarPropostaArtefatos(proposta.id, { stitch_prompt: nextPrompt || null }, nextMeta);
      toast.success("Stitch prompt atualizado!");
      setEditingStitch(false);
      loadProposta();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar stitch prompt");
    } finally {
      setSavingStitch(false);
    }
  };

  const handleVersionStitch = async () => {
    if (!proposta) return;
    if (!proposta.stitch_prompt || proposta.stitch_prompt.trim().length === 0) {
      toast.error("Nenhum stitch prompt para versionar.");
      return;
    }
    setVersioningStitch(true);
    try {
      const history = getStitchHistory();
      const nextVersion: StitchPromptVersion = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        created_by: user?.email || user?.id || "admin",
        label: `v${history.length + 1}`,
        prompt: proposta.stitch_prompt,
      };
      const nextMeta = {
        ...(proposta.ai_metadata || {}),
        stitch_prompt_versions: [nextVersion, ...history],
      };
      await atualizarPropostaArtefatos(proposta.id, {}, nextMeta);
      toast.success("Versão do stitch prompt registrada!");
      loadProposta();
    } catch (err: any) {
      toast.error(err.message || "Erro ao versionar stitch prompt");
    } finally {
      setVersioningStitch(false);
    }
  };

  const handleRegenerateStitch = async () => {
    if (!proposta) return;
    setRegeneratingStitch(true);
    try {
      const input: PropostaInput = {
        nome_cliente: proposta.nome_cliente,
        empresa_cliente: proposta.empresa_cliente,
        segmento: proposta.segmento,
        email_cliente: proposta.email_cliente,
        tipo_projeto: proposta.tipo_projeto,
        descricao_projeto: proposta.descricao_projeto,
        problema_cliente: "",
        objetivo_cliente: "",
        funcionalidades_desejadas: [],
        integracoes: [],
        numero_usuarios: "",
        prazo_desejado: "",
        orcamento_cliente: "",
        nivel_urgencia: "medio",
        link_referencia: proposta.link_referencia || "",
        observacoes: "Regenerar stitch prompt",
        orcamento_id: proposta.orcamento_id || undefined,
        nicho: proposta.segmento || "",
      };
      const aiResult = await gerarPropostaIA(input);
      const nextMeta = {
        ...(proposta.ai_metadata || {}),
        stitch_prompt_regenerated_at: new Date().toISOString(),
        stitch_prompt_regenerated_by: user?.email || user?.id || "admin",
        stitch_prompt_meta: aiResult.ai_metadata || null,
      };
      await atualizarPropostaArtefatos(
        proposta.id,
        { stitch_prompt: aiResult.stitch_prompt, hidden_addons: aiResult.hidden_addons },
        nextMeta,
      );
      toast.success("Stitch prompt regenerado!");
      loadProposta();
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar stitch prompt");
    } finally {
      setRegeneratingStitch(false);
    }
  };

  const startEditTiers = () => {
    if (!proposta) return;
    setEditTiers(proposta.proposal_tiers.length > 0 ? [...proposta.proposal_tiers] : createDefaultTiers());
    setEditAddons(proposta.proposal_addons.length > 0 ? [...proposta.proposal_addons] : createDefaultAddons());
    setEditNotes(proposta.commercial_notes || { general_note: "", recommendation_justification: "", closing_strategy: "", next_steps: "" });
    setEditValidity(proposta.proposal_validity || "30 dias");
    setEditPhased(proposta.is_phased);
    setEditingTiers(true);
  };

  const saveTiers = async () => {
    if (!id) return;
    setSavingTiers(true);
    try {
      const rec = editTiers.find(t => t.is_recommended)?.type || "";
      await atualizarPropostaTiers(id, editTiers, editAddons, rec, editNotes, editValidity, editPhased, editNotes.closing_strategy);
      toast.success("Faixas e add-ons salvos!");
      setEditingTiers(false);
      loadProposta();
    } catch (err: any) { toast.error(err.message || "Erro ao salvar"); } finally { setSavingTiers(false); }
  };

  const setRecommended = (tierId: string) => {
    setEditTiers(prev => prev.map(t => ({ ...t, is_recommended: t.id === tierId })));
  };

  const toggleAddon = (addonId: string) => {
    setEditAddons(prev => prev.map(a => a.id === addonId ? { ...a, is_selected: !a.is_selected } : a));
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!proposta) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground mb-4">Proposta não encontrada.</p>
        <Button variant="outline" onClick={() => navigate("/admin/propostas")}>Voltar</Button>
      </div>
    );
  }

  const pj = proposta.proposta_json;
  const st = PROPOSAL_STATUS_MAP[proposta.status] || PROPOSAL_STATUS_MAP.rascunho;
  const hasTiers = proposta.proposal_tiers.length > 0;
  const hiddenAddonsRaw = Array.isArray(proposta.hidden_addons) ? proposta.hidden_addons : [];
  const hiddenAddonSuggestions = hiddenAddonsRaw
    .map((item: any) => {
      if (typeof item === "string") return { name: item };
      if (item && typeof item === "object") {
        return {
          name: item.name || item.title || item.addon || "Add-on",
          internal_description: item.internal_description || item.description || "",
          commercial_description: item.commercial_description || "",
          technical_impact: item.technical_impact || item.impact || "",
          estimated_value: Number(item.estimated_value || 0),
          dependencies: Array.isArray(item.dependencies) ? item.dependencies : [],
          module_scope: Array.isArray(item.module_scope) ? item.module_scope : [],
        };
      }
      return { name: "Add-on" };
    })
    .filter((item) => item.name && String(item.name).trim().length > 0);

  const stitchHistory = getStitchHistory();
  const currentStitchPrompt = proposta.stitch_prompt || "";

  const handleRegisterHiddenAddons = async () => {
    if (!proposta || hiddenAddonSuggestions.length === 0) return;
    if (!canCreate("addons")) {
      toast.error("Sem permissão para registrar add-ons");
      return;
    }
    setRegisteringAddons(true);
    try {
      const existing = new Set(addons.map((a) => a.name.toLowerCase()));
      const toCreate = hiddenAddonSuggestions.filter(
        (s) => !existing.has(String(s.name).toLowerCase())
      );
      if (toCreate.length === 0) {
        toast.success("Todos os add-ons sugeridos ja foram registrados");
        return;
      }
      await Promise.all(
        toCreate.map((s) =>
          createAddon({
            source_context: "proposta",
            source_id: proposta.id,
            name: String(s.name).trim(),
            internal_description: s.internal_description || "Sugerido pela IA na proposta.",
            commercial_description: s.commercial_description || "",
            technical_impact: s.technical_impact || "",
            estimated_value: s.estimated_value || 0,
            dependencies: s.dependencies || [],
            activation_flag: false,
            status: "suggested",
            suggested_by: "ia",
            niche: proposta.segmento || "",
            module_scope: s.module_scope || [],
          })
        )
      );
      const refreshed = await getAddonsBySource("proposta", proposta.id);
      setAddons(refreshed || []);
      toast.success("Add-ons sugeridos registrados");
    } catch {
      toast.error("Erro ao registrar add-ons sugeridos");
    } finally {
      setRegisteringAddons(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={proposta.nome_cliente}
        description={`${proposta.tipo_projeto}${proposta.empresa_cliente ? ` — ${proposta.empresa_cliente}` : ""}`}
        breadcrumbs={[{ label: "Propostas", href: "/admin/propostas" }, { label: proposta.nome_cliente }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {["rascunho", "em_revisao", "pronta", "enviada", "aceita", "recusada"].map(s => {
              const cfg = PROPOSAL_STATUS_MAP[s];
              if (!cfg) return null;
              return (
                <Button key={s} variant={proposta.status === s ? "default" : "outline"} size="sm" onClick={() => handleStatusChange(s)} disabled={proposta.status === s} className="text-xs">
                  {cfg.label}
                </Button>
              );
            })}
          </div>
        }
      />

      {/* Meta info */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className={`${st.bgClass} ${st.color}`}>{st.label}</Badge>
        {proposta.segmento && <Badge variant="outline">{proposta.segmento}</Badge>}
        <span className="text-xs text-muted-foreground">{new Date(proposta.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => setShowRegenDialog(true)} disabled={regenerating} className="gap-1">
          {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerar
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExportPDF()} disabled={exportingPdf} className="gap-1">
          {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Exportar PDF
        </Button>
        <Button variant="outline" size="sm" onClick={startEditTiers} className="gap-1">
          <Edit3 className="h-3.5 w-3.5" /> Editar Faixas
        </Button>
        <Button
          variant={(proposta as any).is_public ? "default" : "outline"}
          size="sm"
          className="gap-1"
          disabled={sharingLoading}
          onClick={async () => {
            setSharingLoading(true);
            try {
              const isCurrentlyPublic = (proposta as any).is_public;
              const token = await togglePropostaPublic(proposta.id, !isCurrentlyPublic);
              if (token) {
                const url = `${window.location.origin}/proposta/${token}`;
                await navigator.clipboard.writeText(url);
                toast.success("Link copiado! A proposta está pública.");
              } else {
                toast.success("Proposta removida do acesso público.");
              }
              loadProposta();
            } catch (err: any) {
              toast.error(err.message || "Erro ao compartilhar");
            } finally { setSharingLoading(false); }
          }}
        >
          {sharingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
          {(proposta as any).is_public ? "Pública" : "Compartilhar"}
        </Button>
        {(proposta as any).is_public && (proposta as any).public_token && (
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => {
            const url = `${window.location.origin}/proposta/${(proposta as any).public_token}`;
            navigator.clipboard.writeText(url);
            toast.success("Link copiado!");
          }}>
            <Copy className="h-3.5 w-3.5" /> Copiar Link
          </Button>
        )}
        {(proposta as any).is_public && (proposta as any).public_token && (
          <Button variant="ghost" size="sm" className="gap-1" asChild>
            <a href={`/proposta/${(proposta as any).public_token}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" /> Visualizar
            </a>
          </Button>
        )}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
          <p className="font-display text-lg font-bold text-amber-400">R$ {proposta.valor_minimo.toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Ideal</p>
          <p className="font-display text-lg font-bold text-primary">R$ {proposta.valor_ideal.toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Premium</p>
          <p className="font-display text-lg font-bold text-emerald-400">R$ {proposta.valor_premium.toLocaleString("pt-BR")}</p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
          <p className="text-xs text-muted-foreground mb-1">Complexidade</p>
          <p className="font-display text-lg font-bold capitalize">{proposta.complexidade}</p>
        </div>
      </div>

      {/* Tiers */}
      {hasTiers && !editingTiers && (
        <>
          <SectionCard title="Faixas Comerciais" action={<Button variant="ghost" size="sm" onClick={startEditTiers}><Edit3 className="h-4 w-4" /></Button>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {proposta.proposal_tiers.map(t => <TierCard key={t.id} tier={t} />)}
            </div>
          </SectionCard>

          <SectionCard title="Comparativo de Escopo">
            <ScopeComparison tiers={proposta.proposal_tiers} />
          </SectionCard>

          {proposta.proposal_addons.length > 0 && (
            <SectionCard title="Add-ons">
              <AddonSelector addons={proposta.proposal_addons} readOnly />
            </SectionCard>
          )}

          {proposta.commercial_notes && proposta.commercial_notes.general_note && (
            <SectionCard title="Observações Comerciais">
              <div className="space-y-3 text-sm">
                {proposta.commercial_notes.general_note && <div><Label className="text-xs text-muted-foreground">Observação geral</Label><p>{proposta.commercial_notes.general_note}</p></div>}
                {proposta.commercial_notes.recommendation_justification && <div><Label className="text-xs text-muted-foreground">Justificativa</Label><p>{proposta.commercial_notes.recommendation_justification}</p></div>}
                {proposta.commercial_notes.closing_strategy && <div><Label className="text-xs text-muted-foreground">Estratégia</Label><p>{proposta.commercial_notes.closing_strategy}</p></div>}
                {proposta.commercial_notes.next_steps && <div><Label className="text-xs text-muted-foreground">Próximos passos</Label><p>{proposta.commercial_notes.next_steps}</p></div>}
              </div>
            </SectionCard>
          )}
        </>
      )}

      <SectionCard
        title="Add-ons Ocultos"
        action={
          hiddenAddonSuggestions.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={registeringAddons || !canCreate("addons")}
              onClick={handleRegisterHiddenAddons}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {registeringAddons ? "Registrando..." : "Registrar sugeridos"}
            </Button>
          ) : undefined
        }
      >
        {addonsLoading ? (
          <p className="text-sm text-muted-foreground">Carregando add-ons...</p>
        ) : addons.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum add-on registrado para esta proposta.</p>
        ) : (
          <div className="space-y-2">
            {addons.map((addon) => (
              <div key={addon.id} className="rounded-lg border border-border/60 bg-muted/20 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">{addon.name || "Add-on"}</div>
                  <StatusBadge status={ADDON_STATUS_MAP[addon.status].badge} label={ADDON_STATUS_MAP[addon.status].label} />
                </div>
                {addon.internal_description && (
                  <p className="text-xs text-muted-foreground mt-1">{addon.internal_description}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {addon.module_scope?.slice(0, 3).map((mod, idx) => (
                    <Badge key={`${addon.id}-scope-${idx}`} variant="outline" className="text-[10px]">{mod}</Badge>
                  ))}
                  {addon.module_scope?.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">+{addon.module_scope.length - 3}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {hiddenAddonSuggestions.length > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {hiddenAddonSuggestions.length} sugestao(oes) da IA detectada(s) nos artefatos da proposta.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Stitch Prompt"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              onClick={async () => {
                if (!currentStitchPrompt) {
                  toast.error("Nenhum stitch prompt para copiar.");
                  return;
                }
                try {
                  await navigator.clipboard.writeText(currentStitchPrompt);
                  toast.success("Stitch prompt copiado!");
                } catch {
                  toast.error("Erro ao copiar stitch prompt");
                }
              }}
            >
              <Copy className="h-3.5 w-3.5" /> Copiar
            </Button>

            {editingStitch ? (
              <>
                <Button size="sm" onClick={handleSaveStitch} disabled={savingStitch} className="gap-1">
                  <Save className="h-3.5 w-3.5" /> {savingStitch ? "Salvando..." : "Salvar"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingStitch(false);
                    setStitchDraft(currentStitchPrompt);
                  }}
                >
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => setEditingStitch(true)}
              >
                <Edit3 className="h-3.5 w-3.5" /> Editar
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={versioningStitch || !currentStitchPrompt}
              onClick={handleVersionStitch}
            >
              <Layers className="h-3.5 w-3.5" /> {versioningStitch ? "Versionando..." : "Versionar"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1"
              disabled={regeneratingStitch}
              onClick={handleRegenerateStitch}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${regeneratingStitch ? "animate-spin" : ""}`} />
              {regeneratingStitch ? "Regenerando..." : "Regenerar"}
            </Button>
          </div>
        }
      >
        {editingStitch ? (
          <Textarea
            value={stitchDraft}
            onChange={(e) => setStitchDraft(e.target.value)}
            rows={12}
            className="text-xs"
          />
        ) : currentStitchPrompt ? (
          <pre className="text-xs whitespace-pre-wrap bg-muted/30 rounded-lg p-3 border border-border/60">
            {currentStitchPrompt}
          </pre>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum stitch prompt gerado ainda.</p>
        )}

        {stitchHistory.length > 0 && (
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer text-muted-foreground">
              Versões salvas ({stitchHistory.length})
            </summary>
            <div className="mt-2 space-y-2">
              {stitchHistory.map((version) => (
                <div key={version.id} className="rounded-lg border border-border/60 bg-muted/10 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{version.label || "Versão"}</span>
                      <span className="mx-2">•</span>
                      {new Date(version.created_at).toLocaleString("pt-BR")}
                      {version.created_by && <span className="ml-2">• {version.created_by}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => {
                          setStitchDraft(version.prompt);
                          setEditingStitch(true);
                        }}
                      >
                        Aplicar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(version.prompt || "");
                            toast.success("Versão copiada!");
                          } catch {
                            toast.error("Erro ao copiar versão");
                          }
                        }}
                      >
                        Copiar
                      </Button>
                    </div>
                  </div>
                  {version.prompt && (
                    <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                      {version.prompt}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}
      </SectionCard>

      {/* Tier Editor Mode */}
      {editingTiers && (
        <SectionCard title="Editar Faixas Comerciais" action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditingTiers(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
            <Button size="sm" onClick={saveTiers} disabled={savingTiers}><Save className="h-4 w-4 mr-1" /> {savingTiers ? "Salvando..." : "Salvar"}</Button>
          </div>
        }>
          <div className="space-y-4">
            {editTiers.map((tier, i) => (
              <TierEditor
                key={tier.id}
                tier={tier}
                onChange={updated => setEditTiers(prev => prev.map((t, j) => j === i ? updated : t))}
                onSetRecommended={() => setRecommended(tier.id)}
              />
            ))}

            <SectionCard title="Add-ons">
              <AddonSelector addons={editAddons} onToggle={toggleAddon} />
            </SectionCard>

            <SectionCard title="Observações Comerciais">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><Label className="text-xs">Observação geral</Label><Textarea value={editNotes.general_note} onChange={e => setEditNotes(n => ({ ...n, general_note: e.target.value }))} rows={2} /></div>
                <div><Label className="text-xs">Justificativa da recomendação</Label><Textarea value={editNotes.recommendation_justification} onChange={e => setEditNotes(n => ({ ...n, recommendation_justification: e.target.value }))} rows={2} /></div>
                <div><Label className="text-xs">Estratégia de fechamento</Label><Textarea value={editNotes.closing_strategy} onChange={e => setEditNotes(n => ({ ...n, closing_strategy: e.target.value }))} rows={2} /></div>
                <div><Label className="text-xs">Próximos passos</Label><Textarea value={editNotes.next_steps} onChange={e => setEditNotes(n => ({ ...n, next_steps: e.target.value }))} rows={2} /></div>
              </div>
              <div className="flex items-center gap-6 mt-3">
                <div><Label className="text-xs">Validade</Label><Input value={editValidity} onChange={e => setEditValidity(e.target.value)} className="h-8 w-32" /></div>
                <div className="flex items-center gap-2"><Switch checked={editPhased} onCheckedChange={setEditPhased} /><Label className="text-xs">Proposta faseada</Label></div>
              </div>
            </SectionCard>
          </div>
        </SectionCard>
      )}

      {/* AI-generated content */}
      {pj && (
        <div className="space-y-4">
          {pj.resumo_executivo && <SectionCard title="Resumo Executivo"><p className="text-sm text-muted-foreground whitespace-pre-line">{pj.resumo_executivo}</p></SectionCard>}
          {pj.diagnostico && <SectionCard title="Diagnóstico"><p className="text-sm text-muted-foreground whitespace-pre-line">{pj.diagnostico}</p></SectionCard>}
          {pj.solucao_proposta && <SectionCard title="Solução Proposta"><p className="text-sm text-muted-foreground whitespace-pre-line">{pj.solucao_proposta}</p></SectionCard>}
          {pj.escopo?.length > 0 && <SectionCard title="Escopo"><ul className="space-y-1">{pj.escopo.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{s}</li>)}</ul></SectionCard>}
          {pj.funcionalidades?.length > 0 && <SectionCard title="Funcionalidades"><ul className="space-y-1">{pj.funcionalidades.map((f, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />{f}</li>)}</ul></SectionCard>}
          <SectionCard title="Projetos Semelhantes do Portfólio">
            {portfolioLoading ? (
              <p className="text-sm text-muted-foreground">Carregando referências...</p>
            ) : portfolioRefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem referências semelhantes encontradas.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {portfolioRefs.map((ref) => (
                  <div key={ref.id} className="rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="text-sm font-medium text-foreground">{ref.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{ref.reason || "Similaridade com a proposta"}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ref.item.category && <Badge variant="outline" className="text-[10px]">{ref.item.category}</Badge>}
                      {ref.item.niche && <Badge variant="outline" className="text-[10px]">{ref.item.niche}</Badge>}
                      {ref.item.solution_type && <Badge variant="outline" className="text-[10px]">{ref.item.solution_type}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
          {pj.analise_estrategica && <SectionCard title="Análise Estratégica"><p className="text-sm text-muted-foreground whitespace-pre-line">{pj.analise_estrategica}</p></SectionCard>}
          {pj.cronograma && <SectionCard title="Cronograma"><p className="text-sm text-muted-foreground whitespace-pre-line">{pj.cronograma}</p></SectionCard>}
          {pj.manutencao && <SectionCard title="Manutenção"><p className="text-sm text-muted-foreground whitespace-pre-line">{pj.manutencao}</p></SectionCard>}
          {pj.riscos?.length > 0 && <SectionCard title="Riscos"><ul className="space-y-1">{pj.riscos.map((r, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />{r}</li>)}</ul></SectionCard>}
          {pj.proximos_passos?.length > 0 && <SectionCard title="Próximos Passos"><ul className="space-y-1">{pj.proximos_passos.map((p, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />{p}</li>)}</ul></SectionCard>}
        </div>
      )}

      {/* PDF History */}
      <PdfHistorico propostaId={proposta.id} refreshKey={pdfRefreshKey} />

      {/* Dialogs */}
      <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RefreshCw className="h-5 w-5 text-primary" /> Regenerar Proposta</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">Orientações adicionais para a IA:</p>
            <Textarea value={orientacoes} onChange={e => setOrientacoes(e.target.value)} rows={4} placeholder="Ex: Foque em MVP, ajuste valores..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegenDialog(false)}>Cancelar</Button>
            <Button onClick={handleRegenerate} className="gap-1"><Sparkles className="h-4 w-4" /> Regenerar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      
    </div>
  );
}
