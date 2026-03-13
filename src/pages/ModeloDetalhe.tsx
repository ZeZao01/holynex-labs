import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RevealBox from "@/components/RevealBox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, Clock, Layers, X as XIcon, Minus } from "lucide-react";
import {
  ProjectModel, ModelTier, ModelModule,
  getModel, getModelBySlug, listModelTiers, listModelModules,
  AVAILABILITY_STATUSES, TIER_TYPES, MODULE_SCOPES,
} from "@/lib/project-models";

export default function ModeloDetalhe() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [model, setModel] = useState<ProjectModel | null>(null);
  const [tiers, setTiers] = useState<ModelTier[]>([]);
  const [modules, setModules] = useState<ModelModule[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      // Try slug first, then id
      let data = await getModelBySlug(slug);
      if (!data) data = await getModel(slug);
      if (!data) { navigate("/modelos"); return; }
      setModel(data);
      const [t, m] = await Promise.all([listModelTiers(data.id), listModelModules(data.id)]);
      setTiers(t);
      setModules(m);
    };
    load();
  }, [slug]);

  if (!model) return <div className="min-h-screen pt-28 text-center text-muted-foreground">Carregando...</div>;

  const heroImage = selectedImage || model.cover_image_url || model.thumbnail_url;
  const gallery = model.gallery_urls || [];
  const availLabel = AVAILABILITY_STATUSES.find(s => s.value === model.availability_status)?.label;

  // Group modules by tier for display
  const globalModules = modules.filter(m => !m.tier_id);
  const requiredModules = globalModules.filter(m => m.is_required);
  const optionalModules = globalModules.filter(m => !m.is_required);

  return (
    <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back */}
        <RevealBox>
          <Button variant="ghost" size="sm" onClick={() => navigate("/modelos")} className="mb-6 gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar aos Modelos
          </Button>
        </RevealBox>

        {/* Hero */}
        <RevealBox className="mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Image */}
            <div className="space-y-3">
              {heroImage ? (
                <div className="rounded-2xl overflow-hidden border border-border aspect-video">
                  <img src={heroImage} alt={model.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl border border-border aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="font-display text-7xl font-bold text-primary/20">{model.title.charAt(0)}</span>
                </div>
              )}
              {gallery.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[model.cover_image_url || model.thumbnail_url, ...gallery].filter(Boolean).map((url, i) => (
                    <button key={i} onClick={() => setSelectedImage(url!)} className={`shrink-0 rounded-lg overflow-hidden border-2 transition ${selectedImage === url ? "border-primary" : "border-border hover:border-primary/40"}`}>
                      <img src={url!} alt="" className="h-14 w-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {model.category && <span className="text-xs text-primary font-medium uppercase tracking-widest">{model.category}</span>}
                {model.niche && <Badge variant="secondary">{model.niche}</Badge>}
                {availLabel && <Badge variant="outline">{availLabel}</Badge>}
                {(model.badges || []).map(b => (
                  <Badge key={b} className="bg-primary/15 text-primary border-primary/30"><Sparkles className="h-3 w-3 mr-1" />{b}</Badge>
                ))}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">{model.title}</h1>
              {model.subtitle && <p className="text-lg text-muted-foreground">{model.subtitle}</p>}
              {model.value_proposition && <p className="text-sm text-muted-foreground leading-relaxed">{model.value_proposition}</p>}

              <div className="flex flex-wrap gap-3 items-center">
                {model.investment_range && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                    <span className="text-xs text-muted-foreground">A partir de</span>
                    <span className="font-display font-bold text-primary">{model.investment_range}</span>
                  </div>
                )}
                {model.base_deadline && (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{model.base_deadline}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" className="gap-2" onClick={() => navigate(`/contato?modelo=${model.slug || model.id}`)}>
                  {model.cta_primary_label || "Quero esse modelo"} <ArrowRight className="h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate("/contato")}>
                  {model.cta_secondary_label || "Solicitar orçamento"}
                </Button>
              </div>
            </div>
          </div>
        </RevealBox>

        <Separator className="my-8" />

        {/* Problem & Audience */}
        <div className="grid md:grid-cols-2 gap-8">
          {model.problem_solved && (
            <RevealBox delay={0.1} className="space-y-2">
              <h3 className="font-display text-lg font-semibold">Problema que Resolve</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{model.problem_solved}</p>
            </RevealBox>
          )}
          {model.target_audience && (
            <RevealBox delay={0.15} className="space-y-2">
              <h3 className="font-display text-lg font-semibold">Para Quem Serve</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{model.target_audience}</p>
            </RevealBox>
          )}
        </div>

        {/* Modules */}
        {requiredModules.length > 0 && (
          <RevealBox delay={0.2} className="mt-8 space-y-4">
            <h3 className="font-display text-lg font-semibold">Módulos Inclusos</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {requiredModules.map(m => (
                <div key={m.id} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card/50">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-medium">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{m.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </RevealBox>
        )}

        {optionalModules.length > 0 && (
          <RevealBox delay={0.25} className="mt-6 space-y-3">
            <h3 className="font-display text-base font-semibold text-muted-foreground">Módulos Opcionais</h3>
            <div className="flex flex-wrap gap-2">
              {optionalModules.map(m => (
                <Badge key={m.id} variant="outline" className="text-sm py-1.5 px-3">{m.name}</Badge>
              ))}
            </div>
          </RevealBox>
        )}

        {/* Tiers */}
        {tiers.length > 0 && (
          <RevealBox delay={0.3} className="mt-12 space-y-6">
            <div className="text-center">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">Versões da Oferta</h2>
              <p className="text-sm text-muted-foreground">Escolha a versão que melhor se encaixa no seu momento</p>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {tiers.map((tier, i) => {
                const tierModules = modules.filter(m => m.tier_id === tier.id);
                return (
                  <RevealBox key={tier.id} delay={0.3 + i * 0.1}>
                    <div className={`relative rounded-2xl border p-6 space-y-4 transition-all ${
                      tier.is_recommended
                        ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30 shadow-lg"
                        : "border-border bg-card hover:border-primary/30"
                    }`}>
                      {tier.is_recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                          Recomendada
                        </div>
                      )}
                      <div>
                        <Badge variant="outline" className="text-[10px] mb-2">{TIER_TYPES.find(t => t.value === tier.tier_type)?.label}</Badge>
                        <h3 className="font-display text-xl font-bold">{tier.name}</h3>
                      </div>
                      {tier.price_range && (
                        <div className="font-display text-2xl font-bold text-primary">{tier.price_range}</div>
                      )}
                      {tier.estimated_days > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{tier.estimated_days} dias</p>
                      )}
                      {tier.description && <p className="text-sm text-muted-foreground">{tier.description}</p>}

                      {tierModules.length > 0 && (
                        <div className="space-y-1.5 border-t border-border/30 pt-3">
                          {tierModules.map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-xs">
                              {m.scope_in_tier === "included" ? <CheckCircle className="h-3.5 w-3.5 text-emerald-400" /> :
                               m.scope_in_tier === "optional" ? <Minus className="h-3.5 w-3.5 text-amber-400" /> :
                               <XIcon className="h-3.5 w-3.5 text-muted-foreground/40" />}
                              <span className={m.scope_in_tier === "not_included" ? "text-muted-foreground/40 line-through" : ""}>{m.name}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {tier.ideal_client_profile && (
                        <p className="text-xs text-muted-foreground/70 border-t border-border/30 pt-3">
                          <span className="font-medium">Ideal para:</span> {tier.ideal_client_profile}
                        </p>
                      )}

                      <Button
                        className="w-full gap-2"
                        variant={tier.is_recommended ? "default" : "outline"}
                        onClick={() => navigate(`/contato?modelo=${model.slug || model.id}&tier=${tier.tier_type}`)}
                      >
                        Quero essa versão <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </RevealBox>
                );
              })}
            </div>
          </RevealBox>
        )}

        {/* How it works */}
        {model.how_it_works && (
          <RevealBox delay={0.4} className="mt-12 space-y-4">
            <h3 className="font-display text-xl font-bold text-center">Como Funciona</h3>
            <div className="rounded-2xl border border-border bg-card/50 p-6">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{model.how_it_works}</p>
            </div>
          </RevealBox>
        )}

        {model.commercial_description && (
          <RevealBox delay={0.4} className="mt-8 space-y-2">
            <h3 className="font-display text-lg font-semibold">Detalhes da Solução</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{model.commercial_description}</p>
          </RevealBox>
        )}

        {/* Final CTA */}
        <RevealBox delay={0.5} className="mt-12">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8 text-center space-y-4">
            <h3 className="font-display text-2xl font-bold">Gostou deste modelo?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Podemos adaptá-lo ao seu negócio ou criar algo totalmente personalizado.</p>
            <div className="flex justify-center gap-3 flex-wrap">
              <Button size="lg" className="gap-2" onClick={() => navigate(`/contato?modelo=${model.slug || model.id}`)}>
                {model.cta_primary_label || "Quero esse modelo"} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contato")}>
                Falar com especialista
              </Button>
            </div>
          </div>
        </RevealBox>
      </div>
    </div>
  );
}
