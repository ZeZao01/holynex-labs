import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProposta, atualizarStatusProposta, type Proposta } from "@/lib/propostas";
import { Loader2, ArrowLeft, Download, Sparkles, CheckCircle2, XCircle, Send, Clock } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import RevealBox from "@/components/RevealBox";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

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
  const pdfRef = useRef<HTMLDivElement>(null);

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

  const handleExportPDF = async () => {
    if (!pdfRef.current || !proposta) return;
    setExportingPdf(true);
    try {
      const sections = Array.from(
        pdfRef.current.querySelectorAll('[data-pdf-section]')
      ) as HTMLElement[];

      const A4_WIDTH_MM = 210;
      const A4_HEIGHT_MM = 297;
      const MARGIN_MM = 15;
      const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;
      const SECTION_GAP_MM = 4;

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let currentY = MARGIN_MM;

      for (const section of sections) {
        const canvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0a0a14",
          logging: false,
        });

        const scaleFactor = CONTENT_WIDTH_MM / canvas.width;
        const heightMM = canvas.height * scaleFactor;
        const remainingSpace = A4_HEIGHT_MM - MARGIN_MM - currentY;

        if (heightMM > remainingSpace && currentY > MARGIN_MM) {
          pdf.addPage();
          currentY = MARGIN_MM;
        }

        const imgData = canvas.toDataURL("image/png");
        pdf.addImage(imgData, "PNG", MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);
        currentY += heightMM + SECTION_GAP_MM;
      }

      // Footer on each page
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text("HolyNex Labs — Inovação em Desenvolvimento de Software — holynexlabs.com.br", A4_WIDTH_MM / 2, A4_HEIGHT_MM - 8, { align: "center" });
        pdf.text(`Página ${i} de ${totalPages}`, A4_WIDTH_MM - MARGIN_MM, A4_HEIGHT_MM - 8, { align: "right" });
      }

      const clientName = proposta.nome_cliente.replace(/\s+/g, "_");
      pdf.save(`Proposta_HolyNex_${clientName}.pdf`);
      toast.success("PDF exportado com sucesso!");
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
        <div ref={pdfRef}>
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
