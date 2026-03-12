import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProposta, atualizarStatusProposta, type Proposta } from "@/lib/propostas";
import { Loader2, ArrowLeft, Download, Sparkles, CheckCircle2, XCircle, Send, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import RevealBox from "@/components/RevealBox";

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
  const printRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    window.print();
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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3 print:hidden">
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
            <button onClick={handlePrint} className="btn-glow inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-foreground">
              <Download className="h-3 w-3" /> PDF
            </button>
          </div>
        </div>

        {/* Printable Proposal */}
        <div ref={printRef} className="print:bg-white print:text-black">
          {/* Header */}
          <RevealBox className="glass rounded-2xl p-8 mb-6 text-center print:shadow-none print:border print:rounded-none">
            <div className="font-display text-2xl font-bold text-primary print:text-black mb-1">HolyNex Labs</div>
            <h1 className="font-display text-xl font-bold mt-4 mb-2">Proposta Comercial</h1>
            <p className="text-muted-foreground text-sm print:text-gray-600">
              Para: <strong>{proposta.nome_cliente}</strong>
              {proposta.empresa_cliente && ` — ${proposta.empresa_cliente}`}
            </p>
            <p className="text-xs text-muted-foreground mt-2 print:text-gray-500">
              {new Date(proposta.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </RevealBox>

          {/* Financial Summary */}
          <RevealBox delay={0.1} className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 text-center print:border">
              <div className="text-xs text-muted-foreground mb-1">Investimento Mínimo</div>
              <div className="font-display text-lg font-bold text-yellow-400 print:text-black">
                R$ {proposta.valor_minimo.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="glass rounded-xl p-4 text-center border-2 border-primary/30 print:border-2 print:border-black">
              <div className="text-xs text-muted-foreground mb-1">Investimento Ideal</div>
              <div className="font-display text-lg font-bold text-primary print:text-black">
                R$ {proposta.valor_ideal.toLocaleString("pt-BR")}
              </div>
            </div>
            <div className="glass rounded-xl p-4 text-center print:border">
              <div className="text-xs text-muted-foreground mb-1">Investimento Premium</div>
              <div className="font-display text-lg font-bold text-emerald-400 print:text-black">
                R$ {proposta.valor_premium.toLocaleString("pt-BR")}
              </div>
            </div>
          </RevealBox>

          {/* Content Sections */}
          {pj && (
            <div className="space-y-6">
              <Section title="Resumo Executivo" content={pj.resumo_executivo} />
              <Section title="Diagnóstico" content={pj.diagnostico} />
              <Section title="Solução Proposta" content={pj.solucao_proposta} />
              <ListSection title="Escopo do Projeto" items={pj.escopo} />
              <ListSection title="Funcionalidades Principais" items={pj.funcionalidades} />
              <ListSection title="Funcionalidades Recomendadas" items={pj.funcionalidades_recomendadas} />
              <Section title="Análise Estratégica" content={pj.analise_estrategica} />
              <Section title="Estimativa de Esforço" content={pj.estimativa_esforco} />
              <Section title="Cronograma Estimado" content={pj.cronograma} />
              <Section title="Manutenção Mensal" content={pj.manutencao} />
              <ListSection title="Riscos e Premissas" items={pj.riscos} />
              <ListSection title="Próximos Passos" items={pj.proximos_passos} />

              {/* Full Commercial Proposal Text */}
              {pj.proposta_comercial && (
                <div className="glass rounded-2xl p-6 print:border print:shadow-none">
                  <h3 className="font-display font-semibold text-primary mb-3 print:text-black">Proposta Comercial Completa</h3>
                  <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line print:text-black">
                    {pj.proposta_comercial}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-muted-foreground print:text-gray-500">
            <p>HolyNex Labs — Soluções Digitais sob Medida</p>
            <p>Este documento é confidencial e destinado exclusivamente ao destinatário.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  if (!content) return null;
  return (
    <RevealBox className="glass rounded-2xl p-6 print:border print:shadow-none">
      <h3 className="font-display font-semibold text-sm text-primary mb-2 print:text-black">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line print:text-black">{content}</p>
    </RevealBox>
  );
}

function ListSection({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <RevealBox className="glass rounded-2xl p-6 print:border print:shadow-none">
      <h3 className="font-display font-semibold text-sm text-primary mb-2 print:text-black">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2 print:text-black">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0 print:bg-black" />
            {item}
          </li>
        ))}
      </ul>
    </RevealBox>
  );
}
