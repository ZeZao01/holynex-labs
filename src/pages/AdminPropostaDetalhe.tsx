import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProposta, atualizarStatusProposta, atualizarProposta, atualizarPropostaTiers, gerarPropostaIA, type Proposta, type PropostaInput } from "@/lib/propostas";
import { createDefaultTiers, createDefaultAddons, PROPOSAL_STATUS_MAP, type ProposalTier, type ProposalAddon, type CommercialNotes } from "@/lib/proposal-tiers";
import { uploadPdf } from "@/lib/pdf-storage";
import { generatePropostaPdf } from "@/lib/pdf-generator";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import TierCard from "@/components/admin/TierCard";
import ScopeComparison from "@/components/admin/ScopeComparison";
import AddonSelector from "@/components/admin/AddonSelector";
import TierEditor from "@/components/admin/TierEditor";
import { Loader2, Download, Sparkles, RefreshCw, Edit3, Save, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import PdfHistorico from "@/components/PdfHistorico";
import TemplateSelector from "@/components/TemplateSelector";
import { type PdfTemplate } from "@/lib/pdf-templates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import RevealBox from "@/components/RevealBox";

export default function AdminPropostaDetalhe() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [pdfRefreshKey, setPdfRefreshKey] = useState(0);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [orientacoes, setOrientacoes] = useState("");
  const [editingTiers, setEditingTiers] = useState(false);
  const [editTiers, setEditTiers] = useState<ProposalTier[]>([]);
  const [editAddons, setEditAddons] = useState<ProposalAddon[]>([]);
  const [editNotes, setEditNotes] = useState<CommercialNotes>({ general_note: "", recommendation_justification: "", closing_strategy: "", next_steps: "" });
  const [editValidity, setEditValidity] = useState("30 dias");
  const [editPhased, setEditPhased] = useState(false);
  const [savingTiers, setSavingTiers] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (user && id) loadProposta();
  }, [user, authLoading, id]);

  const loadProposta = async () => {
    if (!id) return;
    const data = await getProposta(id);
    setProposta(data);
    setLoading(false);
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
      const input: PropostaInput = {
        nome_cliente: proposta.nome_cliente, empresa_cliente: proposta.empresa_cliente,
        segmento: proposta.segmento, email_cliente: proposta.email_cliente,
        tipo_projeto: proposta.tipo_projeto, descricao_projeto: proposta.descricao_projeto,
        problema_cliente: "", objetivo_cliente: "", funcionalidades_desejadas: [], integracoes: [],
        numero_usuarios: "", prazo_desejado: "", orcamento_cliente: "",
        nivel_urgencia: "medio", link_referencia: "", observacoes: orientacoes || "",
        orcamento_id: proposta.orcamento_id || undefined,
      };
      const nova = await gerarPropostaIA(input);
      await atualizarProposta(id, nova);
      toast.success("Proposta regenerada!");
      setOrientacoes("");
      loadProposta();
    } catch (err: any) {
      toast.error(err.message || "Erro ao regenerar");
    } finally { setRegenerating(false); }
  };

  const handleExportPDF = async (template?: PdfTemplate) => {
    if (!proposta || !id) return;
    setShowTemplateSelector(false);
    setExportingPdf(true);
    try {
      const pdfBlob = await generatePropostaPdf(proposta, template?.id);
      const result = await uploadPdf(id, proposta.nome_cliente, pdfBlob, proposta, template?.id);
      setPdfRefreshKey(k => k + 1);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposta_HolyNex_${proposta.nome_cliente.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF v${result.versao} gerado! Código: ${result.document_code}`);
    } catch (err: any) {
      console.error("PDF export error:", err);
      toast.error(err?.message || "Erro ao exportar PDF. Tente novamente.");
    } finally { setExportingPdf(false); }
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={proposta.nome_cliente}
        description={`${proposta.tipo_projeto}${proposta.empresa_cliente ? ` — ${proposta.empresa_cliente}` : ""}`}
        breadcrumbs={[{ label: "Propostas", href: "/admin/propostas" }, { label: proposta.nome_cliente }]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {["gerada", "em_revisao", "pronta", "enviada", "aceita", "recusada"].map(s => {
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
        <Button variant="outline" size="sm" onClick={() => setShowTemplateSelector(true)} disabled={exportingPdf} className="gap-1">
          {exportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} Exportar PDF
        </Button>
        <Button variant="outline" size="sm" onClick={startEditTiers} className="gap-1">
          <Edit3 className="h-3.5 w-3.5" /> Editar Faixas
        </Button>
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

      <TemplateSelector open={showTemplateSelector} onOpenChange={setShowTemplateSelector} onSelect={handleExportPDF} />
    </div>
  );
}
