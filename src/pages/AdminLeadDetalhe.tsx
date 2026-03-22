import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getOrcamentoById, getOrcamentoAssets, getOrcamentoAnalises, atualizarStatusComercial, atualizarOrcamento, type Orcamento, type OrcamentoAsset, type OrcamentoAnalise, type StatusComercial, STATUS_COMERCIAL_MAP, ESTRATEGIAS_COMERCIAIS } from "@/lib/orcamentos";
import { listPortfolioItems } from "@/lib/portfolio-items";
import { getPortfolioReferences, type PortfolioReference } from "@/lib/portfolio-similarity";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import QuickActionsGrid from "@/components/admin/QuickActionsGrid";
import OperationalStatusPanel from "@/components/admin/OperationalStatusPanel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccessControl } from "@/hooks/useAccessControl";
import { getAddonsBySource, createAddon, ADDON_STATUS_MAP, type Addon } from "@/lib/addons";
import {
  ArrowLeft, Mail, Building2, FileBarChart, Sparkles, Target, Flame, Snowflake, Sun,
  Check, Monitor, Smartphone, Shield, Users as UsersIcon, Layers, Zap, Clock,
  Loader2, Brain, Copy,
} from "lucide-react";

const tempConfig: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  quente: { icon: Flame, color: "text-red-400", label: "Quente" },
  morno: { icon: Sun, color: "text-amber-400", label: "Morno" },
  frio: { icon: Snowflake, color: "text-sky-400", label: "Frio" },
};

const prioridadeMap: Record<string, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-red-500/15 text-red-400" },
  media: { label: "Média", className: "bg-amber-500/15 text-amber-400" },
  baixa: { label: "Baixa", className: "bg-emerald-500/15 text-emerald-400" },
};

const urgenciaMap: Record<string, string> = {
  sem_urgencia: "Sem urgência",
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export default function AdminLeadDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { canCreate } = useAccessControl();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assets, setAssets] = useState<OrcamentoAsset[]>([]);
  const [addonsLoading, setAddonsLoading] = useState(true);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [registeringAddons, setRegisteringAddons] = useState(false);
  const [obs, setObs] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [analises, setAnalises] = useState<OrcamentoAnalise[]>([]);
  const [portfolioRefs, setPortfolioRefs] = useState<PortfolioReference[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [analiseLoading, setAnaliseLoading] = useState(true);
  const [analiseRunning, setAnaliseRunning] = useState(false);

  const loadLead = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOrcamentoById(id);
      let assetsData: OrcamentoAsset[] = [];
      try {
        assetsData = await getOrcamentoAssets(id);
      } catch { /* ignore assets errors */ }
      try {
        const analisesData = await getOrcamentoAnalises(id);
        setAnalises(analisesData || []);
      } catch { /* ignore analysis errors */ }
      try {
        const addonsData = await getAddonsBySource("lead", id);
        setAddons(addonsData || []);
      } catch { /* ignore addons errors */ }
      setLead(data);
      setObs(data?.observacoes_internas || "");
      setAssets(assetsData || []);
    } catch { /* silent */ } finally {
      setLoading(false);
      setAssetsLoading(false);
      setAnaliseLoading(false);
      setAddonsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/admin/login"); return; }
    if (user) loadLead();
  }, [user, authLoading, navigate, loadLead]);

  const handleStatusChange = async (status: StatusComercial) => {
    if (!lead) return;
    await atualizarStatusComercial(lead.id, status);
    toast.success(`Status atualizado para ${STATUS_COMERCIAL_MAP[status].label}`);
    loadLead();
  };

  const handleSaveObs = async () => {
    if (!lead) return;
    await atualizarOrcamento(lead.id, { observacoes_internas: obs });
    toast.success("Observações salvas");
  };

  const handleAiClassify = async () => {
    if (!lead) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("classificar-lead", {
        body: { lead },
      });
      if (error) throw error;
      setAiResult(data);

      // Apply AI suggestions to lead
      if (data?.score_qualificacao !== undefined) {
        await atualizarOrcamento(lead.id, {
          score_qualificacao: data.score_qualificacao,
          faixa_ticket: data.faixa_ticket || lead.faixa_ticket,
          complexidade_estimada: data.complexidade_estimada || lead.complexidade_estimada,
          temperatura_lead: data.temperatura_lead || lead.temperatura_lead,
          estrategia_comercial: data.estrategia_comercial || lead.estrategia_comercial,
          dor_principal: data.dor_principal || lead.dor_principal,
          tags_automaticas: data.tags || lead.tags_automaticas,
        });
        toast.success("Classificação IA aplicada com sucesso!");
        loadLead();
      }
    } catch (err) {
      toast.error("Erro ao classificar lead com IA");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnalyzeBudget = async () => {
    if (!lead) return;
    setAnaliseRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("analisar-orcamento", {
        body: { orcamento_id: lead.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Análise iniciada e concluída com sucesso!");
      const analisesData = await getOrcamentoAnalises(lead.id);
      setAnalises(analisesData || []);
    } catch (err) {
      toast.error("Erro ao analisar orçamento com IA");
      console.error(err);
    } finally {
      setAnaliseRunning(false);
    }
  };

  if (authLoading || loading) return <div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-8 rounded-full" /></div>;
  if (!lead) return <div className="text-center py-20 text-muted-foreground">Lead não encontrado.</div>;

  const temp = tempConfig[lead.temperatura_lead || "morno"] || tempConfig.morno;
  const TempIcon = temp.icon;
  const estrategia = ESTRATEGIAS_COMERCIAIS.find(e => e.value === lead.estrategia_comercial);
  const latestAnalise = analises[0];
  const analiseData = (latestAnalise?.output_json as any) || null;
  const aiAddonSuggestions = Array.isArray(analiseData?.addons_ocultos_sugeridos)
    ? (analiseData.addons_ocultos_sugeridos as string[]).filter(Boolean)
    : [];
  const statusMap: Record<string, { label: string; color: string }> = {
    em_processamento: { label: "Processando", color: "bg-amber-500/15 text-amber-400" },
    concluido: { label: "Concluído", color: "bg-emerald-500/15 text-emerald-400" },
    falhou: { label: "Falhou", color: "bg-destructive/15 text-destructive" },
  };
  const statusInfo = latestAnalise ? statusMap[latestAnalise.status] || { label: latestAnalise.status, color: "bg-muted text-muted-foreground" } : null;
  const operationalItems = [
    { label: "Briefing", status: lead.descricao ? "ok" : "pending" },
    { label: "Contato", status: lead.email ? "ok" : "attention" },
    { label: "Análise IA", status: latestAnalise ? "ok" : "pending" },
    { label: "Add-ons", status: addons.length > 0 ? "ok" : "pending" },
    { label: "Portfólio", status: portfolioRefs.length > 0 ? "ok" : "pending" },
  ] as const;
  const quickActions = [
    {
      label: "Converter em proposta",
      icon: <FileBarChart className="h-4 w-4" />,
      onClick: () => navigate(`/admin/propostas/nova?orcamento=${lead.id}`),
    },
    {
      label: "Copiar email",
      icon: <Copy className="h-4 w-4" />,
      onClick: async () => {
        try {
          await navigator.clipboard.writeText(lead.email);
          toast.success("Email copiado");
        } catch {
          toast.error("Erro ao copiar email");
        }
      },
    },
    {
      label: "Abrir email",
      icon: <Mail className="h-4 w-4" />,
      onClick: () => { window.location.href = `mailto:${lead.email}`; },
    },
    {
      label: "Marcar qualificado",
      icon: <Target className="h-4 w-4" />,
      onClick: () => handleStatusChange("qualificado"),
    },
    {
      label: "Aguardando contato",
      icon: <Clock className="h-4 w-4" />,
      onClick: () => handleStatusChange("aguardando_contato"),
    },
  ];

  useEffect(() => {
    if (!lead) return;
    let active = true;
    const fetchRefs = async () => {
      setPortfolioLoading(true);
      try {
        const items = await listPortfolioItems(true);
        const features = [
          ...(Array.isArray(analiseData?.modulos_recomendados) ? analiseData.modulos_recomendados : []),
          ...(Array.isArray(analiseData?.stack_sugerida) ? analiseData.stack_sugerida : []),
          ...(Array.isArray(lead.tags_automaticas) ? lead.tags_automaticas : []),
        ];
        const refs = getPortfolioReferences(items, {
          niche: lead.nicho || lead.segmento,
          category: lead.tipo_projeto,
          solutionType: lead.tipo_projeto,
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
  }, [lead?.id, lead?.nicho, lead?.segmento, lead?.tipo_projeto, lead?.tags_automaticas, latestAnalise?.id]);

  const handleRegisterAiAddons = async () => {
    if (!lead || aiAddonSuggestions.length === 0) return;
    if (!canCreate("addons")) {
      toast.error("Sem permissão para registrar add-ons");
      return;
    }
    setRegisteringAddons(true);
    try {
      const existing = new Set(addons.map((a) => a.name.toLowerCase()));
      const toCreate = aiAddonSuggestions
        .map((s) => String(s).trim())
        .filter((s) => s.length > 0 && !existing.has(s.toLowerCase()));
      if (toCreate.length === 0) {
        toast.success("Todos os add-ons sugeridos ja foram registrados");
        return;
      }
      await Promise.all(
        toCreate.map((name) =>
          createAddon({
            source_context: "lead",
            source_id: lead.id,
            name,
            internal_description: "Sugerido pela IA a partir da analise do lead.",
            commercial_description: "",
            technical_impact: "",
            estimated_value: 0,
            dependencies: [],
            activation_flag: false,
            status: "suggested",
            suggested_by: "ia",
            niche: lead.nicho || "",
            module_scope: [],
          })
        )
      );
      const refreshed = await getAddonsBySource("lead", lead.id);
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
        title={lead.nome}
        description={`Lead #${lead.id.slice(0, 8)} • ${new Date(lead.criadoEm).toLocaleDateString("pt-BR")}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/orcamentos")} className="gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Button>
            <Button size="sm" onClick={() => navigate(`/admin/propostas/nova?orcamento=${lead.id}`)} className="gap-1.5">
              <FileBarChart className="h-4 w-4" /> Converter em Proposta
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info */}
          <SectionCard title="Dados de Contato">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {lead.email}</div>
              {lead.empresa && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> {lead.empresa}</div>}
              {lead.numero_usuarios && <div className="flex items-center gap-2 text-muted-foreground"><UsersIcon className="h-4 w-4" /> {lead.numero_usuarios} usuários</div>}
              {lead.estagio_operacao && <div className="flex items-center gap-2 text-muted-foreground"><Layers className="h-4 w-4" /> {lead.estagio_operacao}</div>}
            </div>
          </SectionCard>

          {/* Original briefing */}
          <SectionCard title="Briefing Original">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{lead.descricao}</p>
            {lead.objetivo && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-xs font-medium text-primary">Objetivo</span>
                <p className="text-sm mt-1">{lead.objetivo}</p>
              </div>
            )}
            {lead.descricao_detalhada && (
              <div className="mt-3 p-3 bg-muted/40 rounded-lg border border-border/60">
                <span className="text-xs font-medium text-muted-foreground">Detalhamento</span>
                <p className="text-sm mt-1 whitespace-pre-wrap">{lead.descricao_detalhada}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Contexto Comercial">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {lead.tipo_projeto && <InfoTag label="Tipo" value={lead.tipo_projeto} />}
              {lead.nicho && <InfoTag label="Nicho" value={lead.nicho} />}
              {lead.faixa_investimento && <InfoTag label="Faixa" value={lead.faixa_investimento} />}
              {lead.orcamento_estimado && <InfoTag label="Orçamento" value={lead.orcamento_estimado} />}
              {lead.prazo_desejado && <InfoTag label="Prazo" value={lead.prazo_desejado} />}
              {lead.urgencia && <InfoTag label="Urgência" value={urgenciaMap[lead.urgencia] || lead.urgencia} />}
              {lead.origem_lead && <InfoTag label="Origem" value={lead.origem_lead} />}
            </div>
          </SectionCard>

          <SectionCard title="Referências Visuais">
            {assetsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando imagens...</p>
            ) : assets.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma referência enviada.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {assets.map((asset) => (
                  <a key={asset.id} href={asset.file_url} target="_blank" rel="noreferrer" className="group">
                    <img
                      src={asset.file_url}
                      alt={asset.original_name}
                      className="h-28 w-full rounded-lg object-cover border border-border/60 group-hover:border-primary/40 transition-colors"
                    />
                  </a>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Scope */}
          <SectionCard title="Escopo Solicitado">
            <div className="flex flex-wrap gap-2">
              {lead.precisa_login && <SmallTag icon={Shield}>Login</SmallTag>}
              {lead.precisa_admin && <SmallTag icon={Monitor}>Admin</SmallTag>}
              {lead.precisa_area_cliente && <SmallTag icon={UsersIcon}>Área Cliente</SmallTag>}
              {lead.precisa_integracoes && <SmallTag icon={Zap}>Integrações</SmallTag>}
              {lead.precisa_app_mobile && <SmallTag icon={Smartphone}>Mobile</SmallTag>}
              {lead.aceita_mvp && <SmallTag icon={Check}>MVP OK</SmallTag>}
            </div>
          </SectionCard>

          {/* AI Analysis */}
          <SectionCard
            title="IA Assistiva"
            action={
              <Button variant="outline" size="sm" onClick={handleAiClassify} disabled={aiLoading} className="gap-1.5">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                {aiLoading ? "Analisando..." : "Classificar com IA"}
              </Button>
            }
          >
            {lead.dor_principal && (
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/10 mb-3">
                <span className="text-xs font-medium text-primary flex items-center gap-1"><Sparkles className="h-3 w-3" /> Dor Principal</span>
                <p className="text-sm mt-1">{lead.dor_principal}</p>
              </div>
            )}
            {lead.tags_automaticas && lead.tags_automaticas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {lead.tags_automaticas.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-[10px] bg-primary/10 border-primary/20 text-primary">{tag}</Badge>
                ))}
              </div>
            )}
            {lead.resumoIA && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80">{lead.resumoIA}</p>
              </div>
            )}
            {!lead.dor_principal && !aiResult && (
              <p className="text-sm text-muted-foreground">Clique em "Classificar com IA" para obter análise automática do lead.</p>
            )}
          </SectionCard>

          <SectionCard title="Módulos Sugeridos">
            {Array.isArray(analiseData?.modulos_recomendados) && analiseData.modulos_recomendados.length > 0 ? (
              <AnalysisList title="Módulos recomendados" items={analiseData.modulos_recomendados} />
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma sugestão de módulo registrada.</p>
            )}
          </SectionCard>

          <SectionCard
            title="Análise Operacional do Orçamento"
            action={
              <Button variant="outline" size="sm" onClick={handleAnalyzeBudget} disabled={analiseRunning} className="gap-1.5">
                {analiseRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {analiseRunning ? "Processando..." : "Gerar análise"}
              </Button>
            }
          >
            {analiseLoading ? (
              <p className="text-sm text-muted-foreground">Carregando análises...</p>
            ) : !latestAnalise ? (
              <p className="text-sm text-muted-foreground">Nenhuma análise gerada ainda.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {statusInfo && <Badge className={`text-[10px] ${statusInfo.color}`}>{statusInfo.label}</Badge>}
                  <span className="text-muted-foreground">v{latestAnalise.version}</span>
                  {latestAnalise.provider_used && <span className="text-muted-foreground">{latestAnalise.provider_used}</span>}
                  {latestAnalise.model_used && <span className="text-muted-foreground">{latestAnalise.model_used}</span>}
                  {latestAnalise.duration_ms && <span className="text-muted-foreground">{latestAnalise.duration_ms}ms</span>}
                </div>

                {latestAnalise.status === "falhou" && (
                  <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
                    {latestAnalise.error_reason || "Falha ao gerar análise."}
                  </div>
                )}

                {analiseData && (
                  <div className="space-y-3 text-sm">
                    {analiseData.resumo_executivo && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <span className="text-xs font-medium text-primary">Resumo Executivo</span>
                        <p className="mt-1 text-sm text-foreground/80">{analiseData.resumo_executivo}</p>
                      </div>
                    )}
                    {analiseData.leitura_tecnica && (
                      <div className="p-3 bg-muted/40 rounded-lg border border-border/60">
                        <span className="text-xs font-medium text-muted-foreground">Leitura Técnica</span>
                        <p className="mt-1 text-sm text-foreground/80">{analiseData.leitura_tecnica}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analiseData.prioridade && <InfoTag label="Prioridade" value={analiseData.prioridade} />}
                      {analiseData.complexidade && <InfoTag label="Complexidade" value={analiseData.complexidade} />}
                    </div>

                    {Array.isArray(analiseData.oportunidades_adicionais) && analiseData.oportunidades_adicionais.length > 0 && (
                      <AnalysisList title="Oportunidades" items={analiseData.oportunidades_adicionais} />
                    )}
                    {Array.isArray(analiseData.riscos) && analiseData.riscos.length > 0 && (
                      <AnalysisList title="Riscos" items={analiseData.riscos} />
                    )}
                    {Array.isArray(analiseData.stack_sugerida) && analiseData.stack_sugerida.length > 0 && (
                      <AnalysisList title="Stack Sugerida" items={analiseData.stack_sugerida} />
                    )}
                    {Array.isArray(analiseData.roadmap_resumido) && analiseData.roadmap_resumido.length > 0 && (
                      <AnalysisList title="Roadmap Resumido" items={analiseData.roadmap_resumido} />
                    )}
                    {Array.isArray(analiseData.addons_ocultos_sugeridos) && analiseData.addons_ocultos_sugeridos.length > 0 && (
                      <AnalysisList title="Add-ons Ocultos" items={analiseData.addons_ocultos_sugeridos} />
                    )}

                    {Array.isArray(analiseData.referencias_portfolio) && analiseData.referencias_portfolio.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">Referências de Portfólio</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {analiseData.referencias_portfolio.map((ref: any, idx: number) => (
                            <div key={ref?.id || idx} className="rounded-lg border border-border/60 p-2 text-xs">
                              <div className="font-medium">{ref?.title || "Item"}</div>
                              {ref?.motivo && <div className="text-muted-foreground mt-1">{ref.motivo}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analiseData.base_stitch && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">Base para Stitch</span>
                        {analiseData.base_stitch.objetivo && <p className="text-sm text-foreground/80">{analiseData.base_stitch.objetivo}</p>}
                        {Array.isArray(analiseData.base_stitch.principais_entregas) && (
                          <AnalysisList title="Entregas" items={analiseData.base_stitch.principais_entregas} />
                        )}
                        {Array.isArray(analiseData.base_stitch.metricas_sucesso) && (
                          <AnalysisList title="Métricas" items={analiseData.base_stitch.metricas_sucesso} />
                        )}
                      </div>
                    )}

                    {analiseData.base_pdf && (
                      <div className="space-y-2">
                        <span className="text-xs font-medium text-muted-foreground">Base para PDF</span>
                        {Array.isArray(analiseData.base_pdf.sumario) && (
                          <AnalysisList title="Sumário" items={analiseData.base_pdf.sumario} />
                        )}
                        {Array.isArray(analiseData.base_pdf.destaques) && (
                          <AnalysisList title="Destaques" items={analiseData.base_pdf.destaques} />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Add-ons Ocultos"
            action={
              aiAddonSuggestions.length > 0 ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  disabled={registeringAddons || !canCreate("addons")}
                  onClick={handleRegisterAiAddons}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {registeringAddons ? "Registrando..." : "Registrar sugeridos"}
                </Button>
              ) : null
            }
          >
            {addonsLoading ? (
              <p className="text-sm text-muted-foreground">Carregando add-ons...</p>
            ) : addons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum add-on registrado para este lead.</p>
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
            {aiAddonSuggestions.length > 0 && (
              <div className="mt-3 text-xs text-muted-foreground">
                {aiAddonSuggestions.length} sugestao(oes) detectada(s) na analise.
              </div>
            )}
          </SectionCard>

          <SectionCard title="Referências Sugeridas do Portfólio">
            {portfolioLoading ? (
              <p className="text-sm text-muted-foreground">Carregando referências...</p>
            ) : portfolioRefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma referência semelhante encontrada.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {portfolioRefs.map((ref) => (
                  <div key={ref.id} className="rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="text-sm font-medium text-foreground">{ref.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{ref.reason || "Semelhante ao lead"}</div>
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

          {/* Internal notes */}
          <SectionCard title="Observações Internas">
            <Textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Notas internas sobre este lead..." rows={4} className="text-sm" />
            <Button size="sm" className="mt-3" onClick={handleSaveObs}>Salvar Observações</Button>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Status Operacional">
            <OperationalStatusPanel items={operationalItems as any} />
          </SectionCard>

          {/* Qualification */}
          <SectionCard title="Qualificação">
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl font-bold text-primary">{lead.score_qualificacao || 0}</span>
                </div>
                <span className="text-xs text-muted-foreground">Score de Qualificação</span>
              </div>
              <div className="space-y-2.5">
                <QualRow label="Temperatura" value={temp.label} icon={<TempIcon className={`h-4 w-4 ${temp.color}`} />} />
                <QualRow label="Faixa Ticket" value={lead.faixa_ticket || "—"} />
                <QualRow label="Complexidade" value={lead.complexidade_estimada || "—"} />
                {estrategia && <QualRow label="Estratégia" value={estrategia.label} />}
              </div>
            </div>
          </SectionCard>

          {/* Status */}
          <SectionCard title="Status Comercial">
            <Select value={lead.status_comercial || "novo"} onValueChange={(v) => handleStatusChange(v as StatusComercial)}>
              <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_COMERCIAL_MAP).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SectionCard>

          <SectionCard title="Prioridade & Urgência">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prioridade</span>
              <Badge className={`text-[11px] ${lead.prioridade ? prioridadeMap[lead.prioridade]?.className : "bg-muted text-muted-foreground"}`}>
                {lead.prioridade ? prioridadeMap[lead.prioridade]?.label || lead.prioridade : "Não definida"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm mt-3">
              <span className="text-muted-foreground">Urgência</span>
              <span className="font-medium">{lead.urgencia ? (urgenciaMap[lead.urgencia] || lead.urgencia) : "—"}</span>
            </div>
          </SectionCard>

          {/* Quick actions */}
          <SectionCard title="Ações Rápidas">
            <QuickActionsGrid actions={quickActions} />
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function InfoTag({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function SmallTag({ children, icon: Icon }: { children: React.ReactNode; icon: any }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-primary/10 border border-primary/20 text-primary">
      <Icon className="h-3 w-3" /> {children}
    </span>
  );
}

function QualRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 font-medium">{icon}{value}</span>
    </div>
  );
}

function AnalysisList({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{title}</span>
      <ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">
        {items.map((item, idx) => (
          <li key={`${title}-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
