import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getOrcamentoById, atualizarStatusComercial, atualizarOrcamento, type Orcamento, type StatusComercial, STATUS_COMERCIAL_MAP, ESTRATEGIAS_COMERCIAIS } from "@/lib/orcamentos";
import PageHeader from "@/components/admin/PageHeader";
import SectionCard from "@/components/admin/SectionCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Mail, Building2, FileBarChart, Sparkles, Target, Flame, Snowflake, Sun,
  Check, Monitor, Smartphone, Shield, Users as UsersIcon, Layers, Zap, Clock,
  Loader2, Brain,
} from "lucide-react";

const tempConfig: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  quente: { icon: Flame, color: "text-red-400", label: "Quente" },
  morno: { icon: Sun, color: "text-amber-400", label: "Morno" },
  frio: { icon: Snowflake, color: "text-sky-400", label: "Frio" },
};

export default function AdminLeadDetalhe() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [lead, setLead] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [obs, setObs] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const loadLead = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getOrcamentoById(id);
      setLead(data);
      setObs(data?.observacoes_internas || "");
    } catch { /* silent */ } finally {
      setLoading(false);
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

  if (authLoading || loading) return <div className="flex items-center justify-center py-20"><Skeleton className="h-8 w-8 rounded-full" /></div>;
  if (!lead) return <div className="text-center py-20 text-muted-foreground">Lead não encontrado.</div>;

  const temp = tempConfig[lead.temperatura_lead || "morno"] || tempConfig.morno;
  const TempIcon = temp.icon;
  const estrategia = ESTRATEGIAS_COMERCIAIS.find(e => e.value === lead.estrategia_comercial);

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
          <SectionCard title="Informações de Contato">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {lead.email}</div>
              {lead.empresa && <div className="flex items-center gap-2 text-muted-foreground"><Building2 className="h-4 w-4" /> {lead.empresa}</div>}
              {lead.numero_usuarios && <div className="flex items-center gap-2 text-muted-foreground"><UsersIcon className="h-4 w-4" /> {lead.numero_usuarios} usuários</div>}
              {lead.estagio_operacao && <div className="flex items-center gap-2 text-muted-foreground"><Layers className="h-4 w-4" /> {lead.estagio_operacao}</div>}
            </div>
          </SectionCard>

          {/* Project description */}
          <SectionCard title="Descrição do Projeto">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{lead.descricao}</p>
            {lead.objetivo && (
              <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <span className="text-xs font-medium text-primary">Objetivo:</span>
                <p className="text-sm mt-1">{lead.objetivo}</p>
              </div>
            )}
          </SectionCard>

          {/* Scope */}
          <SectionCard title="Escopo Solicitado">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {lead.tipo_projeto && <InfoTag label="Tipo" value={lead.tipo_projeto} />}
              {lead.nicho && <InfoTag label="Nicho" value={lead.nicho} />}
              {lead.faixa_investimento && <InfoTag label="Investimento" value={lead.faixa_investimento} />}
              {lead.prazo_desejado && <InfoTag label="Prazo" value={lead.prazo_desejado} />}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {lead.precisa_login && <SmallTag icon={Shield}>Login</SmallTag>}
              {lead.precisa_admin && <SmallTag icon={Monitor}>Admin</SmallTag>}
              {lead.precisa_area_cliente && <SmallTag icon={UsersIcon}>Área Cliente</SmallTag>}
              {lead.precisa_integracoes && <SmallTag icon={Zap}>Integrações</SmallTag>}
              {lead.precisa_app_mobile && <SmallTag icon={Smartphone}>Mobile</SmallTag>}
              {lead.aceita_mvp && <SmallTag icon={Check}>MVP OK</SmallTag>}
            </div>
          </SectionCard>

          {/* AI Analysis */}
          <SectionCard title="IA Assistiva" action={
            <Button variant="outline" size="sm" onClick={handleAiClassify} disabled={aiLoading} className="gap-1.5">
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
              {aiLoading ? "Analisando..." : "Classificar com IA"}
            </Button>
          }>
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
            {!lead.dor_principal && !aiResult && (
              <p className="text-sm text-muted-foreground">Clique em "Classificar com IA" para obter análise automática do lead.</p>
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

          {/* Quick actions */}
          <SectionCard title="Ações Rápidas">
            <div className="space-y-2">
              <Button variant="default" size="sm" className="w-full gap-1.5" onClick={() => navigate(`/admin/propostas/nova?orcamento=${lead.id}`)}>
                <FileBarChart className="h-4 w-4" /> Converter em Proposta
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => handleStatusChange("qualificado")}>
                <Target className="h-4 w-4" /> Marcar como Qualificado
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => handleStatusChange("aguardando_contato")}>
                <Clock className="h-4 w-4" /> Aguardando Contato
              </Button>
            </div>
          </SectionCard>

          {/* Resumo IA */}
          {lead.resumoIA && (
            <SectionCard title="Resumo Automático">
              <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80">{lead.resumoIA}</p>
              </div>
            </SectionCard>
          )}
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
