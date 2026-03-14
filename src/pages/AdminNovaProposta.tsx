import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, ArrowLeft, Zap, Layers, Brain } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import TierEditor from "@/components/admin/TierEditor";
import AddonSelector from "@/components/admin/AddonSelector";
import { gerarPropostaIA, salvarProposta, type PropostaInput, type PropostaJSON } from "@/lib/propostas";
import { getOrcamentoById } from "@/lib/orcamentos";
import { createDefaultTiers, createDefaultAddons, recommendTier, type ProposalTier, type ProposalAddon, type CommercialNotes, type TierType } from "@/lib/proposal-tiers";
import { supabase } from "@/integrations/supabase/client";

const tiposProjeto = [
  "Landing Page", "Site institucional", "Sistema interno", "Sistema administrativo",
  "CRM", "ERP", "Dashboard", "Plataforma SaaS", "Micro-SaaS", "Marketplace",
  "Automação empresarial", "Plataforma com IA", "Sistema operacional", "Outro",
];

export default function AdminNovaProposta() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orcamentoId = searchParams.get("orcamento");

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [filling, setFilling] = useState(false);
  const [generatingTiers, setGeneratingTiers] = useState(false);
  const [quickDesc, setQuickDesc] = useState("");
  const [result, setResult] = useState<PropostaJSON | null>(null);
  const [step, setStep] = useState<"form" | "tiers" | "review">("form");

  // Tiers state
  const [tiers, setTiers] = useState<ProposalTier[]>(createDefaultTiers());
  const [addons, setAddons] = useState<ProposalAddon[]>(createDefaultAddons());
  const [notes, setNotes] = useState<CommercialNotes>({ general_note: "", recommendation_justification: "", closing_strategy: "", next_steps: "" });
  const [validity, setValidity] = useState("30 dias");
  const [isPhased, setIsPhased] = useState(false);

  const [formData, setFormData] = useState<PropostaInput>({
    nome_cliente: "", empresa_cliente: "", segmento: "", email_cliente: "",
    tipo_projeto: "Sistema interno", descricao_projeto: "", problema_cliente: "",
    objetivo_cliente: "", funcionalidades_desejadas: [], integracoes: [],
    numero_usuarios: "", prazo_desejado: "", orcamento_cliente: "",
    nivel_urgencia: "medio", link_referencia: "", observacoes: "",
    orcamento_id: orcamentoId || undefined,
  });

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (orcamentoId && user) loadOrcamento(orcamentoId);
  }, [user, authLoading, orcamentoId]);

  const loadOrcamento = async (id: string) => {
    try {
      const orc = await getOrcamentoById(id);
      if (orc) {
        setFormData((prev) => ({
          ...prev,
          nome_cliente: orc.nome,
          email_cliente: orc.email,
          empresa_cliente: orc.empresa,
          descricao_projeto: orc.descricao,
          orcamento_id: orc.id,
          tipo_projeto: orc.tipo_projeto || prev.tipo_projeto,
          segmento: orc.nicho || prev.segmento,
          objetivo_cliente: orc.objetivo || prev.objetivo_cliente,
          orcamento_cliente: orc.faixa_investimento || prev.orcamento_cliente,
          prazo_desejado: orc.prazo_desejado || prev.prazo_desejado,
          nivel_urgencia: orc.urgencia || prev.nivel_urgencia,
          numero_usuarios: orc.numero_usuarios || prev.numero_usuarios,
        }));

        // Auto-recommend tier based on lead data
        const recTier = recommendTier(orc.complexidade_estimada || "media", orc.faixa_investimento || "");
        setTiers(prev => prev.map(t => ({ ...t, is_recommended: t.type === recTier, is_highlighted: t.type === recTier })));

        // Pre-fill commercial notes from lead
        if (orc.estrategia_comercial) {
          setNotes(prev => ({
            ...prev,
            recommendation_justification: `Baseado na análise do lead: estratégia ${orc.estrategia_comercial}, score ${orc.score_qualificacao}/100, temperatura ${orc.temperatura_lead}.`,
          }));
        }
      }
    } catch { /* silent */ }
  };

  const handleQuickFill = async () => {
    if (!quickDesc.trim()) { toast.error("Digite uma descrição rápida."); return; }
    setFilling(true);
    try {
      const { data, error } = await supabase.functions.invoke("preencher-formulario", { body: { descricao_rapida: quickDesc } });
      if (error) throw new Error(error.message || "Erro ao preencher");
      if (data?.error) throw new Error(data.error);
      const campos = data.campos;
      setFormData((prev) => ({
        ...prev,
        nome_cliente: campos.nome_cliente || prev.nome_cliente,
        empresa_cliente: campos.empresa_cliente || prev.empresa_cliente,
        segmento: campos.segmento || prev.segmento,
        email_cliente: campos.email_cliente || prev.email_cliente,
        tipo_projeto: campos.tipo_projeto || prev.tipo_projeto,
        descricao_projeto: campos.descricao_projeto || prev.descricao_projeto,
        problema_cliente: campos.problema_cliente || prev.problema_cliente,
        objetivo_cliente: campos.objetivo_cliente || prev.objetivo_cliente,
        funcionalidades_desejadas: campos.funcionalidades_desejadas?.length ? campos.funcionalidades_desejadas : prev.funcionalidades_desejadas,
        integracoes: campos.integracoes?.length ? campos.integracoes : prev.integracoes,
        numero_usuarios: campos.numero_usuarios || prev.numero_usuarios,
        prazo_desejado: campos.prazo_desejado || prev.prazo_desejado,
        orcamento_cliente: campos.orcamento_cliente || prev.orcamento_cliente,
        nivel_urgencia: campos.nivel_urgencia || prev.nivel_urgencia,
        observacoes: campos.observacoes || prev.observacoes,
      }));
      toast.success("Campos preenchidos pela IA!");
    } catch (err: any) { toast.error(err.message || "Erro ao preencher"); } finally { setFilling(false); }
  };

  const handleChange = (field: keyof PropostaInput, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.nome_cliente || !formData.descricao_projeto) {
      toast.error("Preencha nome do cliente e descrição do projeto.");
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const aiResult = await gerarPropostaIA(formData);
      setResult(aiResult.proposta);
      // Store document_spec and pricing_sheet for later use
      (window as any).__lastDocSpec = aiResult.document_spec;
      (window as any).__lastPricingSheet = aiResult.pricing_sheet;
      toast.success("Proposta gerada com sucesso!");
      setStep("tiers");
    } catch (err: any) { toast.error(err.message || "Erro ao gerar"); } finally { setGenerating(false); }
  };

  const handleGenerateTiersAI = async () => {
    if (!result) return;
    setGeneratingTiers(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-tiers", {
        body: {
          proposta: result,
          input: formData,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data.tiers && Array.isArray(data.tiers)) {
        setTiers(data.tiers);
      }
      if (data.addons && Array.isArray(data.addons)) {
        setAddons(data.addons);
      }
      if (data.notes) {
        setNotes(data.notes);
      }
      if (data.recommended_tier) {
        setTiers(prev => prev.map(t => ({ ...t, is_recommended: t.type === data.recommended_tier })));
      }
      toast.success("Faixas geradas pela IA!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar faixas");
    } finally { setGeneratingTiers(false); }
  };

  const handleSave = async () => {
    if (!result) return;
    setLoading(true);
    try {
      const recTier = tiers.find(t => t.is_recommended)?.type || "";
      const id = await salvarProposta(formData, result, tiers, addons, recTier, notes, validity, isPhased, notes.closing_strategy);
      toast.success("Proposta salva!");
      navigate(`/admin/propostas/${id}`);
    } catch (err: any) { toast.error(err.message || "Erro ao salvar"); } finally { setLoading(false); }
  };

  const setRecommended = (tierId: string) => {
    setTiers(prev => prev.map(t => ({ ...t, is_recommended: t.id === tierId })));
  };

  const toggleAddon = (addonId: string) => {
    setAddons(prev => prev.map(a => a.id === addonId ? { ...a, is_selected: !a.is_selected } : a));
  };

  if (authLoading || !user) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Proposta"
        description="Preencha os dados, gere com IA e configure as faixas comerciais"
        breadcrumbs={[{ label: "Propostas", href: "/admin/propostas" }, { label: "Nova Proposta" }]}
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate("/admin/propostas")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
        }
      />

      {/* Step Indicator */}
      <div className="flex items-center gap-3">
        {[
          { key: "form", label: "1. Briefing", active: step === "form" },
          { key: "tiers", label: "2. Faixas & Add-ons", active: step === "tiers" },
          { key: "review", label: "3. Revisão", active: step === "review" },
        ].map((s, i) => (
          <button
            key={s.key}
            onClick={() => {
              if (s.key === "form") setStep("form");
              if (s.key === "tiers" && result) setStep("tiers");
              if (s.key === "review" && result) setStep("review");
            }}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
              s.active ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Step 1: Form */}
      {step === "form" && (
        <>
          {/* Quick Fill */}
          <SectionCard title="Preenchimento Rápido com IA" action={
            <Button variant="outline" size="sm" onClick={handleQuickFill} disabled={filling} className="gap-1.5">
              {filling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {filling ? "Preenchendo..." : "Preencher com IA"}
            </Button>
          }>
            <Textarea
              value={quickDesc}
              onChange={(e) => setQuickDesc(e.target.value)}
              placeholder="Ex: João, TechCorp, quer ERP para estoque, 50 usuários, R$80k, 4 meses, urgente"
              rows={2}
              className="text-sm"
            />
          </SectionCard>

          {/* Main form */}
          <SectionCard title="Dados do Cliente e Projeto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="text-xs">Nome do Cliente *</Label><Input value={formData.nome_cliente} onChange={(e) => handleChange("nome_cliente", e.target.value)} placeholder="Nome completo" /></div>
              <div><Label className="text-xs">Email</Label><Input value={formData.email_cliente} onChange={(e) => handleChange("email_cliente", e.target.value)} placeholder="email@empresa.com" /></div>
              <div><Label className="text-xs">Empresa</Label><Input value={formData.empresa_cliente} onChange={(e) => handleChange("empresa_cliente", e.target.value)} placeholder="Nome da empresa" /></div>
              <div><Label className="text-xs">Segmento</Label><Input value={formData.segmento} onChange={(e) => handleChange("segmento", e.target.value)} placeholder="Ex: Saúde, Educação" /></div>
              <div>
                <Label className="text-xs">Tipo de Projeto</Label>
                <Select value={formData.tipo_projeto} onValueChange={(v) => handleChange("tipo_projeto", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{tiposProjeto.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Urgência</Label>
                <Select value={formData.nivel_urgencia} onValueChange={(v) => handleChange("nivel_urgencia", v)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixo">Baixo</SelectItem>
                    <SelectItem value="medio">Médio</SelectItem>
                    <SelectItem value="alto">Alto</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Nº Usuários</Label><Input value={formData.numero_usuarios} onChange={(e) => handleChange("numero_usuarios", e.target.value)} placeholder="Ex: 50" /></div>
              <div><Label className="text-xs">Prazo Desejado</Label><Input value={formData.prazo_desejado} onChange={(e) => handleChange("prazo_desejado", e.target.value)} placeholder="Ex: 3 meses" /></div>
              <div><Label className="text-xs">Orçamento do Cliente</Label><Input value={formData.orcamento_cliente} onChange={(e) => handleChange("orcamento_cliente", e.target.value)} placeholder="Ex: R$ 50.000" /></div>
              <div><Label className="text-xs">Link de Referência</Label><Input value={formData.link_referencia} onChange={(e) => handleChange("link_referencia", e.target.value)} placeholder="URL" /></div>
            </div>
            <div className="mt-4 space-y-3">
              <div><Label className="text-xs">Descrição do Projeto *</Label><Textarea value={formData.descricao_projeto} onChange={(e) => handleChange("descricao_projeto", e.target.value)} rows={4} placeholder="Descreva o projeto em detalhes..." /></div>
              <div><Label className="text-xs">Problema do Cliente</Label><Textarea value={formData.problema_cliente} onChange={(e) => handleChange("problema_cliente", e.target.value)} rows={2} placeholder="Qual problema o cliente enfrenta?" /></div>
              <div><Label className="text-xs">Objetivo</Label><Textarea value={formData.objetivo_cliente} onChange={(e) => handleChange("objetivo_cliente", e.target.value)} rows={2} placeholder="O que espera alcançar?" /></div>
              <div><Label className="text-xs">Observações</Label><Textarea value={formData.observacoes} onChange={(e) => handleChange("observacoes", e.target.value)} rows={2} placeholder="Informações adicionais..." /></div>
            </div>
          </SectionCard>

          <div className="flex justify-center">
            <Button onClick={handleGenerate} disabled={generating} size="lg" className="gap-2">
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? "Gerando proposta com IA..." : "Gerar Proposta com IA"}
            </Button>
          </div>
        </>
      )}

      {/* Step 2: Tiers */}
      {step === "tiers" && result && (
        <>
          {/* Financial Summary from AI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Mínimo (IA)</p>
              <p className="font-display text-lg font-bold text-amber-400">R$ {result.financeiro.valor_minimo.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Ideal (IA)</p>
              <p className="font-display text-lg font-bold text-primary">R$ {result.financeiro.valor_ideal.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Premium (IA)</p>
              <p className="font-display text-lg font-bold text-emerald-400">R$ {result.financeiro.valor_premium.toLocaleString("pt-BR")}</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">Complexidade</p>
              <p className="font-display text-lg font-bold capitalize">{result.complexidade}</p>
            </div>
          </div>

          {/* AI Tier Generation */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleGenerateTiersAI} disabled={generatingTiers} className="gap-1.5">
              {generatingTiers ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
              {generatingTiers ? "Gerando faixas..." : "Sugerir Faixas com IA"}
            </Button>
            <span className="text-xs text-muted-foreground">A IA preenche preços, escopo e observações por faixa</span>
          </div>

          {/* Tier Editors */}
          <div className="space-y-4">
            {tiers.map((tier, i) => (
              <TierEditor
                key={tier.id}
                tier={tier}
                onChange={updated => setTiers(prev => prev.map((t, j) => j === i ? updated : t))}
                onSetRecommended={() => setRecommended(tier.id)}
              />
            ))}
          </div>

          {/* Add-ons */}
          <SectionCard title="Add-ons">
            <AddonSelector addons={addons} onToggle={toggleAddon} />
          </SectionCard>

          {/* Commercial Notes */}
          <SectionCard title="Observações Comerciais">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Observação geral</Label><Textarea value={notes.general_note} onChange={e => setNotes(n => ({ ...n, general_note: e.target.value }))} rows={2} /></div>
              <div><Label className="text-xs">Justificativa da recomendação</Label><Textarea value={notes.recommendation_justification} onChange={e => setNotes(n => ({ ...n, recommendation_justification: e.target.value }))} rows={2} /></div>
              <div><Label className="text-xs">Estratégia de fechamento</Label><Textarea value={notes.closing_strategy} onChange={e => setNotes(n => ({ ...n, closing_strategy: e.target.value }))} rows={2} /></div>
              <div><Label className="text-xs">Próximos passos</Label><Textarea value={notes.next_steps} onChange={e => setNotes(n => ({ ...n, next_steps: e.target.value }))} rows={2} /></div>
            </div>
            <div className="flex items-center gap-6 mt-3">
              <div><Label className="text-xs">Validade</Label><Input value={validity} onChange={e => setValidity(e.target.value)} className="h-8 w-32" /></div>
              <div className="flex items-center gap-2"><Switch checked={isPhased} onCheckedChange={setIsPhased} /><Label className="text-xs">Proposta faseada</Label></div>
            </div>
          </SectionCard>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("form")}>Voltar ao Briefing</Button>
            <Button onClick={() => setStep("review")} className="gap-1.5">
              <Layers className="h-4 w-4" /> Revisar e Salvar
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Review */}
      {step === "review" && result && (
        <>
          <SectionCard title="Resumo da Proposta">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> <span className="font-medium">{formData.nome_cliente}</span></div>
              <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{formData.empresa_cliente || "—"}</span></div>
              <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{formData.tipo_projeto}</span></div>
              <div><span className="text-muted-foreground">Segmento:</span> <span className="font-medium">{formData.segmento || "—"}</span></div>
              <div><span className="text-muted-foreground">Complexidade:</span> <span className="font-medium capitalize">{result.complexidade}</span></div>
              <div><span className="text-muted-foreground">Faixas:</span> <span className="font-medium">{tiers.length} configuradas</span></div>
            </div>
          </SectionCard>

          {/* Tiers summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {tiers.map(t => (
              <div key={t.id} className={`rounded-xl border p-4 ${t.is_recommended ? "border-primary/40 bg-primary/5" : "border-border/40 bg-card"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{t.name}</span>
                  {t.is_recommended && <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">Recomendada</Badge>}
                </div>
                <div className="font-display text-xl font-bold text-primary">R$ {t.price.toLocaleString("pt-BR")}</div>
                <div className="text-xs text-muted-foreground mt-1">{t.estimated_days} dias • {t.scope_modules.filter(m => m.status === "included").length} módulos</div>
              </div>
            ))}
          </div>

          {/* Selected addons */}
          {addons.filter(a => a.is_selected).length > 0 && (
            <SectionCard title="Add-ons Selecionados">
              <div className="flex flex-wrap gap-2">
                {addons.filter(a => a.is_selected).map(a => (
                  <Badge key={a.id} variant="outline" className="text-xs">
                    {a.name} — R$ {a.price.toLocaleString("pt-BR")}
                  </Badge>
                ))}
              </div>
            </SectionCard>
          )}

          {/* AI content preview */}
          {result.resumo_executivo && (
            <SectionCard title="Resumo Executivo (IA)">
              <p className="text-sm text-muted-foreground whitespace-pre-line">{result.resumo_executivo}</p>
            </SectionCard>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("tiers")}>Voltar às Faixas</Button>
            <Button onClick={handleSave} disabled={loading} size="lg" className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Salvar Proposta
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
