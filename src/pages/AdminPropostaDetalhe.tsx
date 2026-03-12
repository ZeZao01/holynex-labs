import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProposta, atualizarStatusProposta, atualizarProposta, gerarPropostaIA, type Proposta, type PropostaInput } from "@/lib/propostas";
import { uploadPdf } from "@/lib/pdf-storage";
import { generatePropostaPdf } from "@/lib/pdf-generator";
import { Loader2, ArrowLeft, Download, Sparkles, CheckCircle2, XCircle, Send, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import RevealBox from "@/components/RevealBox";
import PdfHistorico from "@/components/PdfHistorico";
import TemplateSelector from "@/components/TemplateSelector";
import { type PdfTemplate } from "@/lib/pdf-templates";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const statusActions = [
  { status: "gerada", label: "Gerada", icon: Sparkles, color: "text-primary" },
  { status: "enviada", label: "Enviada", icon: Send, color: "text-blue-400" },
  { status: "aceita", label: "Aceita", icon: CheckCircle2, color: "text-emerald-400" },
  { status: "recusada", label: "Recusada", icon: XCircle, color: "text-red-400" },
];

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
  const [orientacoes, setOrientacoes] = useState("");

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
    toast.success(`Status atualizado para ${status}`);
    loadProposta();
  };

  const handleRegenerate = async () => {
    if (!proposta || !id) return;
    setShowRegenDialog(false);
    setRegenerating(true);
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
        link_referencia: "",
        observacoes: orientacoes || "",
        orcamento_id: proposta.orcamento_id || undefined,
      };
      const novaProposta = await gerarPropostaIA(input);
      await atualizarProposta(id, novaProposta);
      toast.success("Proposta regenerada com sucesso!");
      setOrientacoes("");
      loadProposta();
    } catch (err: any) {
      console.error("Regenerate error:", err);
      toast.error(err.message || "Erro ao regenerar proposta");
    } finally {
      setRegenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!proposta || !id) return;
    setExportingPdf(true);
    try {
      const pdfBlob = await generatePropostaPdf(proposta);
      await uploadPdf(id, proposta.nome_cliente, pdfBlob);
      setPdfRefreshKey((k) => k + 1);

      // Trigger local download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposta_HolyNex_${proposta.nome_cliente.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("PDF gerado e salvo com sucesso!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Erro ao exportar PDF");
    } finally {
      setExportingPdf(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Proposta não encontrada.</p>
        <button onClick={() => navigate("/admin/propostas")} className="text-primary text-sm hover:underline">Voltar</button>
      </div>
    );
  }

  const pj = proposta.proposta_json;

  return (
    <div className="min-h-screen pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Actions bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button onClick={() => navigate("/admin/propostas")} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="flex gap-2 flex-wrap">
            {statusActions.map((sa) => (
              <button
                key={sa.status}
                onClick={() => handleStatusChange(sa.status)}
                disabled={proposta.status === sa.status}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border/50 transition-colors disabled:opacity-30 ${sa.color} hover:bg-muted/50`}
              >
                <sa.icon className="h-3 w-3" /> {sa.label}
              </button>
            ))}
            <button
              onClick={() => setShowRegenDialog(true)}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              {regenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              {regenerating ? "Regenerando..." : "Regenerar Proposta"}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={exportingPdf}
              className="btn-glow inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-foreground disabled:opacity-50"
            >
              {exportingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
              {exportingPdf ? "Gerando..." : "Exportar PDF"}
            </button>
          </div>
        </div>

        {/* PDF Content */}
        <div>
          {/* Cover / Header */}
          <div data-pdf-section>
            <RevealBox className="glass rounded-2xl p-8 mb-6 text-center">
              <div className="font-display text-2xl font-bold text-primary mb-1">HolyNex Labs</div>
              <p className="text-xs text-muted-foreground mb-6">Inovação em Desenvolvimento de Software</p>
              <h1 className="font-display text-xl font-bold mt-4 mb-2">Proposta Comercial</h1>
              <p className="text-muted-foreground text-sm">
                Para: <strong>{proposta.nome_cliente}</strong>
                {proposta.empresa_cliente && ` — ${proposta.empresa_cliente}`}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(proposta.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </RevealBox>
          </div>

          {/* Financial Summary */}
          <div data-pdf-section>
            <RevealBox delay={0.1} className="grid grid-cols-3 gap-4 mb-6">
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Investimento Mínimo</div>
                <div className="font-display text-lg font-bold text-yellow-400">
                  R$ {proposta.valor_minimo.toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="glass rounded-xl p-4 text-center border-2 border-primary/30">
                <div className="text-xs text-muted-foreground mb-1">Investimento Ideal</div>
                <div className="font-display text-lg font-bold text-primary">
                  R$ {proposta.valor_ideal.toLocaleString("pt-BR")}
                </div>
              </div>
              <div className="glass rounded-xl p-4 text-center">
                <div className="text-xs text-muted-foreground mb-1">Investimento Premium</div>
                <div className="font-display text-lg font-bold text-emerald-400">
                  R$ {proposta.valor_premium.toLocaleString("pt-BR")}
                </div>
              </div>
            </RevealBox>
          </div>

          {/* Content Sections */}
          {pj && (
            <>
              <PdfSection title="Resumo Executivo" content={pj.resumo_executivo} />
              <PdfSection title="Diagnóstico" content={pj.diagnostico} />
              <PdfSection title="Solução Proposta" content={pj.solucao_proposta} />
              <PdfListSection title="Escopo do Projeto" items={pj.escopo} />
              <PdfListSection title="Funcionalidades Principais" items={pj.funcionalidades} />
              <PdfListSection title="Funcionalidades Recomendadas" items={pj.funcionalidades_recomendadas} />
              <PdfSection title="Análise Estratégica" content={pj.analise_estrategica} />
              <PdfSection title="Estimativa de Esforço" content={pj.estimativa_esforco} />
              <PdfSection title="Cronograma Estimado" content={pj.cronograma} />
              <PdfSection title="Manutenção Mensal" content={pj.manutencao} />
              <PdfListSection title="Riscos e Premissas" items={pj.riscos} />
              <PdfListSection title="Próximos Passos" items={pj.proximos_passos} />

              {pj.proposta_comercial && (
                <div data-pdf-section>
                  <div className="glass rounded-2xl p-6 mb-6">
                    <h3 className="font-display font-semibold text-primary mb-3">Proposta Comercial Completa</h3>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {pj.proposta_comercial}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div data-pdf-section>
            <div className="mt-4 text-center text-xs text-muted-foreground py-4">
              <p className="font-semibold">HolyNex Labs — Inovação em Desenvolvimento de Software</p>
              <p>holynexlabs.com.br</p>
              <p className="mt-1">Este documento é confidencial e destinado exclusivamente ao destinatário.</p>
            </div>
          </div>
        </div>

        {/* PDF History */}
        <div className="mt-8">
          <PdfHistorico propostaId={proposta.id} refreshKey={pdfRefreshKey} />
        </div>

        {/* Regenerate Dialog */}
        <Dialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Regenerar Proposta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Insira orientações e parâmetros adicionais para a IA considerar ao regenerar esta proposta. Deixe em branco para usar apenas os dados originais.
              </p>
              <div className="space-y-2">
                <Label htmlFor="orientacoes">Novas orientações</Label>
                <Textarea
                  id="orientacoes"
                  placeholder="Ex: Foque em MVP com prazo de 30 dias, priorize funcionalidades de automação, ajuste os valores para faixa de R$ 5.000 a R$ 15.000..."
                  value={orientacoes}
                  onChange={(e) => setOrientacoes(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRegenDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRegenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Regenerar com IA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function PdfSection({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <div data-pdf-section>
      <RevealBox className="glass rounded-2xl p-6 mb-6">
        <h3 className="font-display font-semibold text-sm text-primary mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{content}</p>
      </RevealBox>
    </div>
  );
}

function PdfListSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div data-pdf-section>
      <RevealBox className="glass rounded-2xl p-6 mb-6">
        <h3 className="font-display font-semibold text-sm text-primary mb-2">{title}</h3>
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </RevealBox>
    </div>
  );
}
