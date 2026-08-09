import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { acceptPropostaByToken, getPropostaByToken, type Proposta } from "@/lib/propostas";
import { TIER_DEFAULTS, type ProposalTier } from "@/lib/proposal-tiers";
import { Loader2, CheckCircle2, XCircle, Star, Clock, Shield, Zap, ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generatePropostaPdf } from "@/lib/pdf-generator";
import { toast } from "@/components/ui/sonner";
import logoUrl from "@/assets/logo-transparent.png";
import { listPortfolioItems } from "@/lib/portfolio-items";
import { getPortfolioReferences, type PortfolioReference } from "@/lib/portfolio-similarity";

function TierPublicCard({ tier, isRecommended }: { tier: ProposalTier; isRecommended: boolean }) {
  const defaults = TIER_DEFAULTS[tier.type] || TIER_DEFAULTS.ideal;

  return (
    <div className={cn(
      "relative rounded-2xl border p-6 transition-all",
      isRecommended
        ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20 scale-[1.02]"
        : "border-border/40 bg-card/50"
    )}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
            <Star className="h-3 w-3" /> Recomendado
          </Badge>
        </div>
      )}
      <h3 className={cn("font-display text-lg font-bold mb-1", defaults.color)}>{tier.name}</h3>
      <p className="text-xs text-muted-foreground mb-4">{tier.description}</p>
      <p className="font-display text-3xl font-black text-foreground mb-1">
        R$ {tier.price.toLocaleString("pt-BR")}
      </p>
      <p className="text-xs text-muted-foreground mb-4">
        <Clock className="h-3 w-3 inline mr-1" />{tier.estimated_days} dias • {tier.installments}
      </p>
      <div className="space-y-2 mb-4">
        {tier.included_items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{item}</span>
          </div>
        ))}
        {tier.excluded_items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <XCircle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
            <span className="text-muted-foreground/50 line-through">{item}</span>
          </div>
        ))}
      </div>
      {tier.notes && (
        <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-3">{tier.notes}</p>
      )}
    </div>
  );
}

export default function PropostaPublica() {
  const { token } = useParams<{ token: string }>();
  const [proposta, setProposta] = useState<Proposta | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [portfolioRefs, setPortfolioRefs] = useState<PortfolioReference[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return; }
    (async () => {
      try {
        const data = await getPropostaByToken(token);
        if (!data) { setNotFound(true); } else { setProposta(data); }
      } catch { setNotFound(true); }
      setLoading(false);
    })();
  }, [token]);

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

  const handleDownloadPdf = async () => {
    if (!proposta) return;
    setDownloadingPdf(true);
    try {
      const blob = await generatePropostaPdf(proposta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposta_HolyNex_${proposta.nome_cliente.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error("Erro ao gerar PDF");
    } finally { setDownloadingPdf(false); }
  };

  const handleAccept = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    try {
      const ok = await acceptPropostaByToken(token);
      if (!ok) throw new Error("A proposta não está mais disponível para aceite.");
      setAccepted(true);
      setProposta((current) => current ? { ...current, status: "aceita" } : current);
      toast.success("Proposta aceita. A HolyNex entrará em contato para os próximos passos.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível aceitar a proposta.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !proposta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Proposta não encontrada</h1>
        <p className="text-muted-foreground text-sm">Este link pode ter expirado ou sido desativado.</p>
      </div>
    );
  }

  const pj = proposta.proposta_json;
  const hasTiers = proposta.proposal_tiers.length > 0;
  const recommendedTier = proposta.recommended_tier;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/30 bg-card/30 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="HolyNex" className="h-8 w-8" />
            <span className="font-display font-bold text-foreground">HolyNex</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={downloadingPdf} className="gap-1.5">
            {downloadingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Baixar PDF
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Hero */}
        <section className="text-center space-y-4">
          <Badge variant="outline" className="text-xs">{proposta.tipo_projeto}</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-black text-foreground">
            Proposta Comercial
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Preparada especialmente para <span className="text-primary font-semibold">{proposta.nome_cliente}</span>
            {proposta.empresa_cliente && <> — {proposta.empresa_cliente}</>}
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Válida por {proposta.proposal_validity || "30 dias"}</span>
            <span>•</span>
            <span>{new Date(proposta.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
          </div>
        </section>

        {/* Executive Summary */}
        {pj?.resumo_executivo && (
          <section className="space-y-3">
            <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" /> Resumo Executivo
            </h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{pj.resumo_executivo}</p>
          </section>
        )}

        {/* Diagnosis & Solution */}
        {pj?.diagnostico && (
          <section className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold text-foreground">Diagnóstico</h2>
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{pj.diagnostico}</p>
            </div>
            {pj.solucao_proposta && (
              <div className="space-y-3">
                <h2 className="font-display text-xl font-bold text-foreground">Solução Proposta</h2>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{pj.solucao_proposta}</p>
              </div>
            )}
          </section>
        )}

        {/* Scope & Features */}
        {pj?.funcionalidades && pj.funcionalidades.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Funcionalidades</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pj.funcionalidades.map((f, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-border/30 bg-card/30 p-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tiers */}
        {hasTiers && (
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-display text-2xl font-bold text-foreground">Planos de Investimento</h2>
              <p className="text-muted-foreground text-sm">Escolha a faixa que melhor se adapta ao seu momento</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {proposta.proposal_tiers.map(tier => (
                <TierPublicCard key={tier.id} tier={tier} isRecommended={tier.type === recommendedTier || tier.is_recommended} />
              ))}
            </div>
          </section>
        )}

        {/* Add-ons */}
        {proposta.proposal_addons.filter(a => a.is_selected).length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display text-xl font-bold text-foreground">Add-ons Inclusos</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {proposta.proposal_addons.filter(a => a.is_selected).map(addon => (
                <div key={addon.id} className="rounded-xl border border-border/30 bg-card/30 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{addon.name}</span>
                    <Badge variant="outline" className="text-xs">R$ {addon.price.toLocaleString("pt-BR")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{addon.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Timeline & Risks */}
        <div className="grid md:grid-cols-2 gap-8">
          {pj?.cronograma && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-foreground">Cronograma</h2>
              <p className="text-muted-foreground text-sm whitespace-pre-line">{pj.cronograma}</p>
            </section>
          )}
          {pj?.riscos && pj.riscos.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold text-foreground">Riscos & Mitigações</h2>
              <ul className="space-y-2">
                {pj.riscos.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />{r}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Portfolio References */}
        {(portfolioLoading || portfolioRefs.length > 0) && (
          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">Projetos Semelhantes</h2>
            {portfolioLoading ? (
              <p className="text-sm text-muted-foreground">Carregando referências...</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolioRefs.map((ref) => (
                  <div key={ref.id} className="rounded-xl border border-border/30 bg-card/30 p-4">
                    <div className="text-sm font-medium text-foreground">{ref.title}</div>
                    <p className="text-xs text-muted-foreground mt-1">{ref.reason || "Similaridade com esta proposta"}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {ref.item.category && <Badge variant="outline" className="text-[10px]">{ref.item.category}</Badge>}
                      {ref.item.niche && <Badge variant="outline" className="text-[10px]">{ref.item.niche}</Badge>}
                      {ref.item.solution_type && <Badge variant="outline" className="text-[10px]">{ref.item.solution_type}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Next Steps */}
        {pj?.proximos_passos && pj.proximos_passos.length > 0 && (
          <section className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="font-display text-2xl font-bold text-foreground">Próximos Passos</h2>
            <div className="flex flex-col items-center gap-3 max-w-lg mx-auto">
              {pj.proximos_passos.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">{i + 1}</span>
                  {p}
                </div>
              ))}
            </div>
            <Button size="lg" className="mt-4 gap-2" onClick={handleAccept} disabled={accepting || accepted || proposta.status === "aceita"}>
              {accepting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {accepted || proposta.status === "aceita" ? "Proposta aceita" : accepting ? "Confirmando..." : "Aceitar Proposta"}
            </Button>
          </section>
        )}

        {/* Maintenance */}
        {pj?.manutencao && (
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold text-foreground">Manutenção & Suporte</h2>
            <p className="text-muted-foreground text-sm whitespace-pre-line">{pj.manutencao}</p>
          </section>
        )}

        {/* Commercial Notes */}
        {proposta.commercial_notes?.general_note && (
          <section className="space-y-2 border-t border-border/30 pt-8">
            <h3 className="text-sm font-medium text-foreground">Observações</h3>
            <p className="text-xs text-muted-foreground">{proposta.commercial_notes.general_note}</p>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 bg-card/30 mt-16">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center">
          <img src={logoUrl} alt="HolyNex" className="h-8 mx-auto mb-3 opacity-50" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} HolyNex Labs — Documento gerado automaticamente
          </p>
        </div>
      </footer>
    </div>
  );
}
