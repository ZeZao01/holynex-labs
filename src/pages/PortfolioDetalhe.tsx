import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RevealBox from "@/components/RevealBox";
import PortfolioPreview from "@/components/PortfolioPreview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, ExternalLink } from "lucide-react";
import { PortfolioItem, getPortfolioItem, getPortfolioItemBySlug, ITEM_TYPES } from "@/lib/portfolio-items";

export default function PortfolioDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<PortfolioItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const loadItem = async () => {
      setLoading(true);
      setError(false);
      try {
        const bySlug = await getPortfolioItemBySlug(id);
        const data = bySlug || await getPortfolioItem(id);
        if (!isMounted) return;
        if (data) {
          if ((data.status && data.status !== "published") || (data.status == null && data.is_active === false)) {
            navigate("/portfolio");
            return;
          }
          setItem(data);
        } else {
          navigate("/portfolio");
        }
      } catch {
        if (!isMounted) return;
        setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadItem();
    return () => { isMounted = false; };
  }, [id, navigate]);

  if (loading) return <div className="min-h-screen pt-28 text-center text-muted-foreground">Carregando...</div>;
  if (error) return <div className="min-h-screen pt-28 text-center text-muted-foreground">Não foi possível carregar este projeto.</div>;
  if (!item) return <div className="min-h-screen pt-28 text-center text-muted-foreground">Projeto não encontrado.</div>;

  const typeLabel = ITEM_TYPES.find((t) => t.value === item.item_type)?.label;
  const gallery = item.gallery_images || item.gallery_urls || [];
  const heroImage = selectedImage || item.cover_image_url || item.thumbnail_url || gallery[0];
  const fullDescription = item.full_description || item.commercial_description;
  const techStack = item.tech_stack || item.main_modules || [];
  const features = item.features || item.differentials || [];
  const previewModeRaw = item.preview_mode || "image";
  const previewMode = (previewModeRaw === "image"
    ? "thumbnail"
    : previewModeRaw === "iframe"
      ? "iframe"
      : previewModeRaw === "mixed"
        ? "mixed"
        : previewModeRaw === "image_mockup"
          ? "image_mockup"
          : previewModeRaw === "none"
            ? "none"
            : "thumbnail") as "thumbnail" | "iframe" | "image_mockup" | "mixed" | "none";
  const systemUrl = item.system_url || item.public_url;
  const canPreview = Boolean(item.allow_public_preview && systemUrl);
  const subtitle = item.short_description || item.subtitle;

  const handlePrimaryCta = () => {
    if (item.cta_url) {
      window.open(item.cta_url, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(`/contato?ref=${item.id}`);
  };

  const handleOpenSystem = () => {
    if (!systemUrl) return;
    if (item.open_mode === "modal" && canPreview) {
      setPreviewOpen(true);
      return;
    }
    if (item.open_mode === "same_tab") {
      window.location.href = systemUrl;
      return;
    }
    window.open(systemUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <>
      <div className="min-h-screen pt-24 sm:pt-28 pb-16 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
        {/* Back */}
        <RevealBox>
          <Button variant="ghost" size="sm" onClick={() => navigate("/portfolio")} className="mb-6 gap-1 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Portfólio
          </Button>
        </RevealBox>

        {/* Hero */}
        <RevealBox className="mb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Image side */}
            <div className="space-y-3">
              {heroImage ? (
                <div className="rounded-2xl overflow-hidden border border-border aspect-video">
                  <img src={heroImage} alt={item.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="rounded-2xl border border-border aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <span className="font-display text-7xl font-bold text-primary/20">{item.title.charAt(0)}</span>
                </div>
              )}
              {gallery.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[item.cover_image_url || item.thumbnail_url, ...gallery].filter(Boolean).map((url, i) => (
                    <button key={i} onClick={() => setSelectedImage(url!)} className={`shrink-0 rounded-lg overflow-hidden border-2 transition ${selectedImage === url ? "border-primary" : "border-border hover:border-primary/40"}`}>
                      <img src={url!} alt="" className="h-14 w-20 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info side */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {item.niche && <span className="text-xs text-primary font-medium uppercase tracking-widest">{item.niche}</span>}
                {typeLabel && <Badge variant="secondary">{typeLabel}</Badge>}
                {(item.badges || []).map((b) => (
                  <Badge key={b} className="bg-primary/15 text-primary border-primary/30"><Sparkles className="h-3 w-3 mr-1" />{b}</Badge>
                ))}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold">{item.title}</h1>
              {subtitle && <p className="text-lg text-muted-foreground">{subtitle}</p>}
              {fullDescription && <p className="text-sm text-muted-foreground leading-relaxed">{fullDescription}</p>}

              {item.investment_range && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-xs text-muted-foreground">A partir de</span>
                  <span className="font-display font-bold text-primary">{item.investment_range}</span>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" className="gap-2" onClick={handlePrimaryCta}>
                  {item.cta_label || "Quero algo parecido"} <ArrowRight className="h-4 w-4" />
                </Button>
                {systemUrl && (
                  <Button size="lg" variant="outline" className="gap-2" onClick={handleOpenSystem}>
                    Abrir sistema <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button size="lg" variant="ghost" className="gap-2" onClick={() => navigate("/contato")}>
                  Solicitar Orçamento
                </Button>
              </div>
            </div>
          </div>
        </RevealBox>

        <Separator className="my-8" />

        {previewMode !== "none" && (
          <RevealBox delay={0.2} className="mt-2">
            <h3 className="font-display text-lg font-semibold mb-4">Preview do Sistema</h3>
            <PortfolioPreview
              title={item.title}
              systemUrl={systemUrl}
              thumbnailUrl={heroImage}
              gallery={gallery}
              mode={previewMode}
              allowPreview={canPreview}
              onOpenSystem={handleOpenSystem}
            />
          </RevealBox>
        )}

        {/* Details grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {item.problem_solved && (
            <RevealBox delay={0.1} className="space-y-2">
              <h3 className="font-display text-lg font-semibold">Problema que Resolve</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.problem_solved}</p>
            </RevealBox>
          )}
          {item.target_audience && (
            <RevealBox delay={0.15} className="space-y-2">
              <h3 className="font-display text-lg font-semibold">Para Quem Serve</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.target_audience}</p>
            </RevealBox>
          )}
        </div>

        {techStack.length > 0 && (
          <RevealBox delay={0.2} className="mt-8 space-y-4">
            <h3 className="font-display text-lg font-semibold">Stack Técnica</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {techStack.map((m) => (
                <div key={m} className="flex items-center gap-2 p-3 rounded-xl border border-border bg-card/50">
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm">{m}</span>
                </div>
              ))}
            </div>
          </RevealBox>
        )}

        {features.length > 0 && (
          <RevealBox delay={0.25} className="mt-8 space-y-4">
            <h3 className="font-display text-lg font-semibold">Funcionalidades</h3>
            <div className="flex flex-wrap gap-2">
              {features.map((d) => (
                <Badge key={d} variant="outline" className="text-sm py-1.5 px-3">{d}</Badge>
              ))}
            </div>
          </RevealBox>
        )}

        {item.item_type === "case_real" && item.client_context && (
          <RevealBox delay={0.3} className="mt-8 space-y-2">
            <h3 className="font-display text-lg font-semibold">Contexto do Cliente</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.client_context}</p>
          </RevealBox>
        )}

        {(item.item_type === "solucao_adaptavel" || item.item_type === "projeto_modelo") && item.customization_notes && (
          <RevealBox delay={0.3} className="mt-8 space-y-2">
            <h3 className="font-display text-lg font-semibold">Possibilidades de Personalização</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.customization_notes}</p>
          </RevealBox>
        )}

        {/* Final CTA */}
        <RevealBox delay={0.35} className="mt-12">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-8 text-center space-y-4">
            <h3 className="font-display text-2xl font-bold">Gostou deste projeto?</h3>
            <p className="text-muted-foreground max-w-md mx-auto">Podemos criar algo semelhante ou totalmente personalizado para o seu negócio.</p>
            <div className="flex justify-center gap-3">
              <Button size="lg" className="gap-2" onClick={() => navigate(`/contato?ref=${item.id}`)}>
                Quero algo parecido <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/contato")}>
                Falar com especialista
              </Button>
            </div>
          </div>
        </RevealBox>
        </div>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Preview do Sistema</DialogTitle></DialogHeader>
          <PortfolioPreview
            title={item.title}
            systemUrl={systemUrl}
            thumbnailUrl={heroImage}
            gallery={gallery}
            mode="iframe"
            allowPreview={canPreview}
            onOpenSystem={handleOpenSystem}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
